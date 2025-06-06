import os
import cv2
import mediapipe as mp
import numpy as np
import ffmpeg
import logging
from typing import List, Dict, Tuple
from ultralytics import YOLO

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    """Analyzes video for proctoring violations using computer vision"""
    
    def __init__(self):
        # Initialize MediaPipe Face Mesh for head pose detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize YOLO for object detection
        model_path = os.getenv('MODEL_PATH', 'yolov8n.pt')
        self.yolo_model = YOLO(model_path)
        
        # Phone detection class ID in COCO (cell phone = 67)
        self.phone_class_id = 67
        
        logger.info("VideoAnalyzer initialized")
    
    def extract_frames(self, video_path: str, frames_dir: str, fps: int = 2) -> bool:
        """Extract frames from video at specified FPS"""
        try:
            (
                ffmpeg
                .input(video_path)
                .filter('fps', fps=fps)
                .output(f"{frames_dir}/frame_%04d.jpg")
                .overwrite_output()
                .run(quiet=True)
            )
            
            frame_count = len(os.listdir(frames_dir))
            logger.info(f"Extracted {frame_count} frames at {fps} FPS")
            return True
            
        except Exception as e:
            logger.error(f"Failed to extract frames: {e}")
            return False
    
    def calculate_head_pose(self, landmarks) -> Tuple[float, float, float]:
        """Calculate head pose angles from face landmarks"""
        try:
            # Key landmark points for pose estimation
            # Nose tip, chin, left eye corner, right eye corner, left mouth corner, right mouth corner
            image_points = np.array([
                landmarks[1],    # Nose tip
                landmarks[152],  # Chin
                landmarks[33],   # Left eye left corner
                landmarks[263],  # Right eye right corner
                landmarks[61],   # Left mouth corner
                landmarks[291]   # Right mouth corner
            ], dtype=np.float32)
            
            # 3D model points (generic face model)
            model_points = np.array([
                (0.0, 0.0, 0.0),             # Nose tip
                (0.0, -330.0, -65.0),        # Chin
                (-225.0, 170.0, -135.0),     # Left eye left corner
                (225.0, 170.0, -135.0),      # Right eye right corner
                (-150.0, -150.0, -125.0),    # Left mouth corner
                (150.0, -150.0, -125.0)      # Right mouth corner
            ])
            
            # Camera matrix (approximate)
            focal_length = 640
            center = (320, 240)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float32)
            
            # Distortion coefficients (assuming no distortion)
            dist_coeffs = np.zeros((4, 1))
            
            # Solve PnP
            success, rotation_vector, translation_vector = cv2.solvePnP(
                model_points, image_points, camera_matrix, dist_coeffs
            )
            
            if success:
                # Convert rotation vector to rotation matrix
                rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
                
                # Calculate Euler angles
                sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
                singular = sy < 1e-6
                
                if not singular:
                    x = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
                    y = np.arctan2(-rotation_matrix[2, 0], sy)
                    z = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
                else:
                    x = np.arctan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
                    y = np.arctan2(-rotation_matrix[2, 0], sy)
                    z = 0
                
                # Convert to degrees
                pitch = np.degrees(x)
                yaw = np.degrees(y)
                roll = np.degrees(z)
                
                return pitch, yaw, roll
            
        except Exception as e:
            logger.warning(f"Failed to calculate head pose: {e}")
        
        return 0.0, 0.0, 0.0
    
    def analyze_frame(self, frame_path: str, frame_number: int) -> List[Dict]:
        """Analyze a single frame for violations"""
        events = []
        
        try:
            # Load frame
            image = cv2.imread(frame_path)
            if image is None:
                return events
            
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            height, width = image.shape[:2]
            
            # Face detection and pose analysis
            results = self.face_mesh.process(rgb_image)
            
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Convert landmarks to pixel coordinates
                    landmarks = []
                    for landmark in face_landmarks.landmark:
                        landmarks.append([
                            int(landmark.x * width),
                            int(landmark.y * height)
                        ])
                    
                    # Calculate head pose
                    pitch, yaw, roll = self.calculate_head_pose(landmarks)
                    
                    # Check for looking away (yaw > 30 degrees)
                    if abs(yaw) > 30:
                        events.append({
                            'type': 'LOOK_AWAY',
                            'timestamp': frame_number * 0.5,  # Assuming 2 FPS
                            'extra': {
                                'yaw': yaw,
                                'pitch': pitch,
                                'roll': roll,
                                'frame_number': frame_number
                            }
                        })
            
            # Object detection with YOLO
            yolo_results = self.yolo_model(image, verbose=False)
            
            for result in yolo_results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        
                        # Check for phone detection
                        if class_id == self.phone_class_id and confidence > 0.5:
                            events.append({
                                'type': 'PHONE_DETECTED',
                                'timestamp': frame_number * 0.5,
                                'extra': {
                                    'confidence': confidence,
                                    'frame_number': frame_number,
                                    'bbox': box.xyxy[0].tolist()
                                }
                            })
                        
                        # Check for multiple people (person class = 0)
                        elif class_id == 0 and confidence > 0.5:
                            # Count persons in frame
                            person_count = sum(1 for b in boxes if int(b.cls[0]) == 0 and float(b.conf[0]) > 0.5)
                            if person_count > 1:
                                events.append({
                                    'type': 'MULTIPLE_PEOPLE',
                                    'timestamp': frame_number * 0.5,
                                    'extra': {
                                        'person_count': person_count,
                                        'frame_number': frame_number
                                    }
                                })
                                break  # Only report once per frame
            
        except Exception as e:
            logger.error(f"Error analyzing frame {frame_path}: {e}")
        
        return events
    
    def analyze_video(self, video_path: str, frames_dir: str) -> List[Dict]:
        """Main video analysis pipeline"""
        logger.info(f"Starting video analysis: {video_path}")
        
        all_events = []
        
        # Extract frames
        if not self.extract_frames(video_path, frames_dir):
            logger.error("Failed to extract frames")
            return all_events
        
        # Analyze each frame
        frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.jpg')])
        
        for i, frame_file in enumerate(frame_files):
            frame_path = os.path.join(frames_dir, frame_file)
            frame_events = self.analyze_frame(frame_path, i + 1)
            all_events.extend(frame_events)
        
        logger.info(f"Video analysis complete. Found {len(all_events)} events")
        return all_events 