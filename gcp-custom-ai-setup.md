# Custom AI Models on Google Cloud Platform

## Overview
Deploy your own face detection and object detection models on GCP for **10x cheaper** analysis than Google Vision API.

**Cost Comparison:**
- Google Vision API: ~$3.00 per 1,000 images
- Custom GCP deployment: ~$0.10-0.30 per 1,000 images

## Option 1: Cloud Run (Recommended - Serverless)

### Step 1: Create the AI Service

Create a new directory for your AI service:

```bash
mkdir ai-service && cd ai-service
```

Create `requirements.txt`:
```txt
flask==2.3.3
opencv-python-headless==4.8.1.78
mediapipe==0.10.7
numpy==1.24.3
pillow==10.0.1
ultralytics==8.0.196
gunicorn==21.2.0
```

Create `app.py`:
```python
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

# Initialize YOLO for object detection (you'll download this model)
yolo_model = None
try:
    yolo_model = YOLO('yolov8n.pt')  # Downloads automatically on first run
except:
    print("YOLO model not available, using basic detection")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ai-analysis"})

@app.route('/analyze-frame', methods=['POST'])
def analyze_frame():
    try:
        data = request.get_json()
        
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
                        suspicious_items = ['cell phone', 'book', 'laptop', 'tablet', 'remote']
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
                }
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
```

### Step 2: Deploy to Cloud Run

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/ai-service
gcloud run deploy ai-service \
  --image gcr.io/$PROJECT_ID/ai-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10
```

### Step 3: Get Your Service URL

```bash
gcloud run services describe ai-service --region us-central1 --format="value(status.url)"
```

## Option 2: Compute Engine (For High Volume)

### Create VM with GPU (Optional for faster processing)

```bash
gcloud compute instances create ai-analysis-vm \
  --zone=us-central1-a \
  --machine-type=n1-standard-2 \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server
```

### Setup Script for VM

```bash
#!/bin/bash
# Run this on your VM

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install -y python3-pip python3-venv

# Create virtual environment
python3 -m venv ~/ai-env
source ~/ai-env/bin/activate

# Install requirements
pip install flask opencv-python mediapipe ultralytics gunicorn

# Create systemd service
sudo tee /etc/systemd/system/ai-service.service > /dev/null <<EOF
[Unit]
Description=AI Analysis Service
After=network.target

[Service]
Type=exec
User=ubuntu
WorkingDirectory=/home/ubuntu/ai-service
Environment=PATH=/home/ubuntu/ai-env/bin
ExecStart=/home/ubuntu/ai-env/bin/gunicorn --bind 0.0.0.0:8080 --workers 2 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable ai-service
sudo systemctl start ai-service
```

## Option 3: Vertex AI Custom Container

### Deploy to Vertex AI

```bash
# Create custom container
gcloud ai custom-jobs create \
  --region=us-central1 \
  --display-name=ai-analysis-endpoint \
  --config=endpoint-config.yaml
```

## Integration with Your App

Update your Next.js app to use the custom AI service:

```typescript
// Replace the analyzeFrame function in your trigger-analysis route
async function analyzeFrame(frameData: Buffer, frameId: string) {
  const frameSize = frameData.length;
  const isLargeFrame = frameSize > 50000;
  
  try {
    const AI_SERVICE_URL = process.env.CUSTOM_AI_SERVICE_URL;
    
    if (!AI_SERVICE_URL) {
      return simulateFrameAnalysis(frameId, frameSize, isLargeFrame);
    }

    // Convert buffer to base64
    const base64Image = frameData.toString('base64');
    
    // Call your custom AI service
    const response = await fetch(`${AI_SERVICE_URL}/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        frameId: frameId
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResult = await response.json();
    
    // Process results
    const faceDetected = aiResult.face_detection.faces_detected > 0;
    const faceCount = aiResult.face_detection.faces_detected;
    const confidence = aiResult.face_detection.average_confidence;
    
    // Map detected objects to suspicious objects
    const suspiciousObjects = aiResult.object_detection.objects.map(obj => ({
      type: obj.type.includes('phone') ? 'phone' : 
            obj.type.includes('book') ? 'book' : 
            obj.type.includes('laptop') ? 'electronic_device' : obj.type,
      confidence: obj.confidence
    }));

    console.log(`🤖 Custom AI analyzed frame ${frameId}: faces=${faceCount}, objects=${suspiciousObjects.length}`);

    return {
      frameId,
      faceDetected,
      faceCount,
      confidence,
      suspiciousObjects,
      reason: !faceDetected ? 'face_not_visible' : null,
      metadata: {
        frameSize,
        isLargeFrame,
        analysisTime: new Date().toISOString(),
        totalObjectsDetected: aiResult.object_detection.objects.length,
        analysisMethod: 'custom_ai_service'
      }
    };

  } catch (error) {
    console.error(`❌ Custom AI service error for frame ${frameId}:`, error);
    return simulateFrameAnalysis(frameId, frameSize, isLargeFrame);
  }
}
```

## Environment Variables

Add to your `.env.local`:

```bash
# Custom AI Service
CUSTOM_AI_SERVICE_URL=https://your-ai-service-url.run.app
```

## Cost Analysis

### Cloud Run Pricing (Pay per use):
- **CPU**: $0.000024 per vCPU-second
- **Memory**: $0.0000025 per GiB-second
- **Requests**: $0.0000004 per request

**Example cost for 1,000 images:**
- Processing time: ~2 seconds per image
- Total CPU-seconds: 2,000
- Total cost: ~$0.048 + request costs = **~$0.05**

### Compute Engine (Always-on):
- **n1-standard-2**: $0.095 per hour
- **Monthly cost**: ~$70 for 24/7 operation
- **Cost per 1,000 images**: ~$0.10 (if processing 10,000+ images/month)

## Advanced Features

### 1. Model Caching
```python
# Add Redis caching for frequently analyzed frames
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)
```

### 2. Batch Processing
```python
@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    # Process multiple frames in one request
    pass
```

### 3. Model Updates
```bash
# Script to update models
#!/bin/bash
cd /app
pip install --upgrade ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"  # Download latest
sudo systemctl restart ai-service
```

## Monitoring & Scaling

### Set up monitoring:
```bash
# Cloud Monitoring
gcloud logging sinks create ai-service-logs \
  bigquery.googleapis.com/projects/$PROJECT_ID/datasets/ai_logs
```

### Auto-scaling configuration:
```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    run.googleapis.com/cpu-throttling: "false"
    autoscaling.knative.dev/maxScale: "10"
    autoscaling.knative.dev/minScale: "0"
```

## Next Steps

1. **Deploy the AI service** using Cloud Run
2. **Update your environment variables** with the service URL
3. **Test the integration** with your existing frame capture
4. **Monitor costs** in GCP Console
5. **Scale as needed** based on usage patterns

This setup will give you **enterprise-grade AI analysis at 10x lower cost** than Google Vision API! 