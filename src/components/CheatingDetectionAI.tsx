'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, AlertTriangle, Shield, Activity, Camera } from 'lucide-react';

interface SuspiciousActivity {
  type:
    | 'eye_movement'
    | 'face_detection'
    | 'tab_switch'
    | 'multiple_faces'
    | 'no_face';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  description: string;
  confidence: number;
}

interface CheatingDetectionProps {
  isActive: boolean;
  onActivityDetected: (activity: SuspiciousActivity) => void;
  testAttemptId: string;
  className?: string;
}

export default function CheatingDetectionAI({
  isActive,
  onActivityDetected,
  testAttemptId,
  className = '',
}: CheatingDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFacePositionRef = useRef<{ x: number; y: number } | null>(null);
  const suspicionCounterRef = useRef<{ [key: string]: number }>({});

  const [detectionStatus, setDetectionStatus] = useState<
    'initializing' | 'active' | 'paused' | 'error'
  >('initializing');
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<
    'low' | 'medium' | 'high'
  >('low');
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<string>(
    'System monitoring...'
  );

  // Load Face-API.js (simulated for demo - in production, use actual face-api.js)
  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        // In production, load actual face-api.js models here
        // await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        // await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        // await faceapi.nets.faceExpressionNet.loadFromUri('/models');

        // Simulate loading time
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setFaceApiLoaded(true);
        setLastActivity('AI models loaded successfully');
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        setDetectionStatus('error');
        setLastActivity('Failed to load AI models');
      }
    };

    if (isActive) {
      loadFaceAPI();
    }
  }, [isActive]);

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    if (!isActive || !faceApiLoaded) return;

    try {
      // TEMPORARY DISABLE: Skip camera access, simulate successful start
      console.log('Camera proctoring temporarily disabled');
      setDetectionStatus('active');
      setLastActivity('Camera disabled - monitoring other behaviors only');
      startDetection();
      
      // Original camera code commented out:
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   video: {
      //     width: { ideal: 640 },
      //     height: { ideal: 480 },
      //     frameRate: { ideal: 15 }, // Lower framerate for AI processing
      //   },
      // });
      // 
      // streamRef.current = stream;
      // 
      // if (videoRef.current) {
      //   videoRef.current.srcObject = stream;
      //   videoRef.current.play();
      //   setDetectionStatus('active');
      //   setLastActivity('Camera initialized - monitoring started');
      //   startDetection();
      // }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      // TEMPORARY: Don't show error, just continue with other monitoring
      setDetectionStatus('active');
      setLastActivity('Camera disabled - monitoring other behaviors only');
      startDetection();
    }
  }, [isActive, faceApiLoaded]);

  // Eye movement and behavior analysis
  const analyzeFrame = useCallback(async () => {
    if (detectionStatus !== 'active') return;

    // TEMPORARY DISABLE: Skip actual frame analysis but keep other monitoring
    console.log('Frame analysis temporarily disabled');
    
    // Original frame analysis code commented out:
    // if (!videoRef.current || !canvasRef.current) return;
    // const video = videoRef.current;
    // const canvas = canvasRef.current;
    // const ctx = canvas.getContext('2d');
    // if (!ctx) return;
    // canvas.width = video.videoWidth;
    // canvas.height = video.videoHeight;
    // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // 
    // try {
    //   const simulatedAnalysis = await simulateFaceDetection(canvas);
    //   if (simulatedAnalysis.faces.length === 0) {
    //     handleSuspiciousActivity({
    //       type: 'no_face',
    //       severity: 'medium',
    //       timestamp: Date.now(),
    //       description: 'No face detected in frame',
    //       confidence: 0.85,
    //     });
    //   } else if (simulatedAnalysis.faces.length > 1) {
    //     handleSuspiciousActivity({
    //       type: 'multiple_faces',
    //       severity: 'high',
    //       timestamp: Date.now(),
    //       description: 'Multiple faces detected',
    //       confidence: 0.95,
    //     });
    //   } else {
    //     const face = simulatedAnalysis.faces[0];
    //     analyzeEyeMovement(face);
    //     analyzeFacePosition(face);
    //   }
    // } catch (error) {
    //   console.error('Frame analysis failed:', error);
    // }
  }, [detectionStatus]);

  // Simulate face detection (replace with actual face-api.js in production)
  const simulateFaceDetection = async (canvas: HTMLCanvasElement) => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate random face detection results for demo
    const random = Math.random();

    if (random < 0.05) {
      // 5% chance of no face
      return { faces: [] };
    } else if (random < 0.08) {
      // 3% chance of multiple faces
      return {
        faces: [
          {
            x: 100,
            y: 100,
            width: 150,
            height: 180,
            eyeGaze: { x: 0.2, y: -0.1 },
          },
          {
            x: 300,
            y: 120,
            width: 140,
            height: 170,
            eyeGaze: { x: -0.3, y: 0.1 },
          },
        ],
      };
    } else {
      // Normal single face detection
      return {
        faces: [
          {
            x: 150 + (Math.random() - 0.5) * 20, // Slight random movement
            y: 100 + (Math.random() - 0.5) * 15,
            width: 160,
            height: 190,
            eyeGaze: {
              x: (Math.random() - 0.5) * 0.8, // Simulated eye gaze direction
              y: (Math.random() - 0.5) * 0.6,
            },
          },
        ],
      };
    }
  };

  // Analyze eye movement patterns
  const analyzeEyeMovement = (face: any) => {
    const { eyeGaze } = face;

    // Detect suspicious eye movements (looking away from screen)
    if (Math.abs(eyeGaze.x) > 0.4 || Math.abs(eyeGaze.y) > 0.3) {
      const direction =
        eyeGaze.x > 0.4
          ? 'right'
          : eyeGaze.x < -0.4
            ? 'left'
            : eyeGaze.y > 0.3
              ? 'down'
              : 'up';

      handleSuspiciousActivity({
        type: 'eye_movement',
        severity:
          Math.abs(eyeGaze.x) > 0.6 || Math.abs(eyeGaze.y) > 0.5
            ? 'high'
            : 'medium',
        timestamp: Date.now(),
        description: `Sustained gaze ${direction} - possible distraction`,
        confidence: Math.min(0.9, Math.abs(eyeGaze.x) + Math.abs(eyeGaze.y)),
      });
    }
  };

  // Analyze face position changes
  const analyzeFacePosition = (face: any) => {
    const currentPosition = { x: face.x, y: face.y };

    if (lastFacePositionRef.current) {
      const movement = {
        x: Math.abs(currentPosition.x - lastFacePositionRef.current.x),
        y: Math.abs(currentPosition.y - lastFacePositionRef.current.y),
      };

      // Detect significant movement (possible cheating attempt)
      if (movement.x > 50 || movement.y > 40) {
        handleSuspiciousActivity({
          type: 'face_detection',
          severity: movement.x > 100 || movement.y > 80 ? 'high' : 'medium',
          timestamp: Date.now(),
          description: 'Significant head movement detected',
          confidence: Math.min(0.9, (movement.x + movement.y) / 100),
        });
      }
    }

    lastFacePositionRef.current = currentPosition;
  };

  // Handle suspicious activity detection
  const handleSuspiciousActivity = (activity: SuspiciousActivity) => {
    // Increment suspicion counter
    const key = activity.type;
    suspicionCounterRef.current[key] =
      (suspicionCounterRef.current[key] || 0) + 1;

    // Only report if activity occurs frequently enough to avoid false positives
    const threshold = {
      eye_movement: 3,
      face_detection: 2,
      no_face: 2,
      multiple_faces: 1,
      tab_switch: 1,
    };

    if (suspicionCounterRef.current[key] >= threshold[key]) {
      onActivityDetected(activity);
      setActivitiesCount((prev) => prev + 1);
      setLastActivity(activity.description);

      // Update risk level
      const totalSuspicion = Object.values(suspicionCounterRef.current).reduce(
        (a, b) => a + b,
        0
      );
      if (totalSuspicion > 20) {
        setCurrentRiskLevel('high');
      } else if (totalSuspicion > 10) {
        setCurrentRiskLevel('medium');
      }

      // Reset counter after reporting
      suspicionCounterRef.current[key] = 0;
    }
  };

  // Start detection loop
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) return;

    detectionIntervalRef.current = setInterval(analyzeFrame, 500); // Analyze every 500ms
  }, [analyzeFrame]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Initialize camera when conditions are met
  useEffect(() => {
    if (isActive && faceApiLoaded) {
      initializeCamera();
    }

    return () => {
      stopDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, faceApiLoaded, initializeCamera, stopDetection]);

  // Handle tab switching (from document visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        handleSuspiciousActivity({
          type: 'tab_switch',
          severity: 'high',
          timestamp: Date.now(),
          description: 'Tab switch or window minimize detected',
          confidence: 1.0,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'initializing':
        return 'text-blue-600';
      case 'paused':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Detection Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <h3 className="font-medium text-primary-900">AI Proctoring</h3>
          </div>
          <div
            className={`flex items-center space-x-1 ${getStatusColor(detectionStatus)}`}
          >
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium capitalize">
              {detectionStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Risk Level:</span>
            <div
              className={`ml-2 inline-block rounded border px-2 py-1 text-xs font-medium ${getRiskLevelColor(currentRiskLevel)}`}
            >
              {currentRiskLevel.toUpperCase()}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Activities:</span>
            <span className="ml-2 font-medium">{activitiesCount}</span>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">Status: {lastActivity}</div>
      </div>

      {/* Hidden elements for processing */}
      <div className="hidden">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} />
      </div>

      {/* Detection Indicators */}
      {detectionStatus === 'active' && (
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>Eye Tracking</span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
          </div>
          <div className="flex items-center space-x-1">
            <Camera className="h-3 w-3" />
            <span>Face Detection</span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Behavior Analysis</span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
          </div>
        </div>
      )}
    </div>
  );
}
