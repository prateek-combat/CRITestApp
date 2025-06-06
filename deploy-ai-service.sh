#!/bin/bash

# Custom AI Service Deployment Script for Google Cloud Platform
# This script automates the deployment of your custom AI analysis service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Custom AI Service Deployment Script${NC}"
echo -e "${GREEN}======================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️ No project set. Please set your project ID:${NC}"
    read -p "Enter your GCP Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo -e "${GREEN}📋 Using project: $PROJECT_ID${NC}"

# Create directory structure
echo -e "${YELLOW}📁 Creating AI service directory...${NC}"
mkdir -p ai-service
cd ai-service

# Create requirements.txt
echo -e "${YELLOW}📄 Creating requirements.txt...${NC}"
cat > requirements.txt << 'EOF'
flask==2.3.3
opencv-python-headless==4.8.1.78
mediapipe==0.10.7
numpy==1.24.3
pillow==10.0.1
ultralytics==8.0.196
gunicorn==21.2.0
EOF

# Create app.py
echo -e "${YELLOW}🐍 Creating app.py...${NC}"
cat > app.py << 'EOF'
import os
import cv2
import numpy as np
import mediapipe as mp
from flask import Flask, request, jsonify
from PIL import Image
import io
import base64
from ultralytics import YOLO

app = Flask(__name__)

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

# Initialize YOLO for object detection
yolo_model = None
try:
    yolo_model = YOLO('yolov8n.pt')  # Downloads automatically on first run
    print("✅ YOLO model loaded successfully")
except Exception as e:
    print(f"⚠️ YOLO model not available: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "ai-analysis",
        "models": {
            "face_detection": "MediaPipe 0.10.7",
            "object_detection": "YOLOv8n" if yolo_model else "Not available"
        }
    })

@app.route('/analyze-frame', methods=['POST'])
def analyze_frame():
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        
        # Face Detection using MediaPipe
        face_results = face_detection.process(rgb_image)
        
        faces = []
        if face_results.detections:
            for detection in face_results.detections:
                confidence = detection.score[0]
                faces.append({
                    'confidence': float(confidence),
                    'bbox': {
                        'x': detection.location_data.relative_bounding_box.xmin,
                        'y': detection.location_data.relative_bounding_box.ymin,
                        'width': detection.location_data.relative_bounding_box.width,
                        'height': detection.location_data.relative_bounding_box.height
                    }
                })
        
        # Object Detection using YOLO
        objects = []
        if yolo_model:
            results = yolo_model(image_np, verbose=False)
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        class_name = yolo_model.names[class_id].lower()
                        
                        # Filter for suspicious objects
                        suspicious_items = ['cell phone', 'book', 'laptop', 'tablet', 'remote', 'computer']
                        if any(item in class_name for item in suspicious_items):
                            objects.append({
                                'type': class_name,
                                'confidence': confidence,
                                'bbox': box.xyxy[0].tolist()
                            })
        
        # Analysis results
        result = {
            'face_detection': {
                'faces_detected': len(faces),
                'faces': faces,
                'average_confidence': sum(f['confidence'] for f in faces) / len(faces) if faces else 0
            },
            'object_detection': {
                'objects': objects,
                'suspicious_objects_count': len(objects)
            },
            'analysis_metadata': {
                'model_versions': {
                    'face_detection': 'MediaPipe 0.10.7',
                    'object_detection': 'YOLOv8n'
                },
                'processing_time': 'real-time'
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"🚀 Starting AI service on port {port}")
    app.run(host='0.0.0.0', port=port)
EOF

# Create Dockerfile
echo -e "${YELLOW}🐳 Creating Dockerfile...${NC}"
cat > Dockerfile << 'EOF'
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 300 app:app
EOF

# Create .gcloudignore
echo -e "${YELLOW}📋 Creating .gcloudignore...${NC}"
cat > .gcloudignore << 'EOF'
.git
.gitignore
README.md
Dockerfile
.dockerignore
node_modules
npm-debug.log
EOF

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy
echo -e "${YELLOW}🏗️ Building container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/ai-service

echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy ai-service \
  --image gcr.io/$PROJECT_ID/ai-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="PORT=8080"

# Get service URL
SERVICE_URL=$(gcloud run services describe ai-service --region us-central1 --format="value(status.url)")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🔗 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Add this to your .env.local file:"
echo "   CUSTOM_AI_SERVICE_URL=$SERVICE_URL"
echo ""
echo "2. Test the service:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "3. Monitor costs in GCP Console:"
echo "   https://console.cloud.google.com/billing/"
echo ""
echo -e "${GREEN}🎉 Your custom AI service is ready!${NC}"
echo -e "${GREEN}💰 Cost estimate: ~$0.05 per 1,000 images (vs $3.00 with Vision API)${NC}" 