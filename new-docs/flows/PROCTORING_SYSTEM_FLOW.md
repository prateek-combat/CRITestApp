# Proctoring System Flow Documentation

## Overview
The CRITestApp includes an AI-powered proctoring system that monitors candidates during test sessions to detect potential cheating behaviors. The system combines real-time monitoring with post-test analysis.

## Proctoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Candidate Browser                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Camera     │  │ Microphone   │  │Screen Capture│  │   Focus    │ │
│  │   Stream     │  │   Stream     │  │   (Optional) │  │  Monitor   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Proctoring Recorder                                │
├─────────────────────────────────────────────────────────────────────────┤
│  • Frame capture every 2-3 seconds                                     │
│  • Event logging (tab switches, focus loss)                            │
│  • Real-time validation checks                                         │
│  • Binary data compression                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database Storage                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ProctorAsset  │  │ProctorEvent  │  │ TestAttempt  │                  │
│  │(Images/Video)│  │ (Actions)    │  │(Risk Scores) │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Analysis Service                              │
├─────────────────────────────────────────────────────────────────────────┤
│  • Face detection & tracking                                           │
│  • Object detection (phones, books)                                    │
│  • Multiple person detection                                           │
│  • Audio anomaly detection                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Proctoring Session Lifecycle

### 1. Session Initialization

```
Test Start → Permission Check → Camera/Mic Access → Initial Calibration → Begin Monitoring
```

#### Permission Flow
```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│  Browser    │                    │   App        │                    │   Device     │
└─────────────┘                    └──────────────┘                    └──────────────┘
       │                                   │                                   │
       │  1. Request permissions           │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  2. getUserMedia()               │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  3. Permission dialog             │                                   │
       │◄──────────────────────────────────────────────────────────────────────┤
       │                                   │                                   │
       │  4. Grant/Deny                    │                                   │
       ├──────────────────────────────────────────────────────────────────────►│
       │                                   │                                   │
       │                                   │  5. Media stream                 │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                   │
       │  6. Start proctoring              │                                   │
       │◄──────────────────────────────────┤                                   │
```

### 2. Real-time Monitoring

#### Frame Capture Process
```typescript
// Capture configuration
{
  captureInterval: 2000, // 2 seconds
  frameWidth: 640,
  frameHeight: 480,
  quality: 0.8,
  format: 'image/jpeg'
}
```

#### Event Monitoring
```
┌─────────────────────────────────────────┐
│           Event Detection               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │Tab Switches │  │Focus Loss   │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │Fullscreen   │  │Right Click  │      │
│  │Exit         │  │Attempts     │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │DevTools     │  │Copy/Paste   │      │
│  │Detection    │  │Detection    │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
```

### 3. Data Storage Flow

```
Capture Frame/Event → Compress → Validate → Store in Database → Update Risk Score
```

#### Database Schema
```sql
ProctorAsset {
  id: String
  attemptId: String
  kind: 'image' | 'video' | 'audio'
  fileName: String
  mimeType: String
  fileSize: Int
  data: Bytes
  ts: DateTime
}

ProctorEvent {
  id: String
  attemptId: String
  type: 'tab_switch' | 'focus_loss' | 'fullscreen_exit' | 'face_not_detected'
  ts: DateTime
  extra: Json (additional context)
}
```

## AI Analysis Pipeline

### 1. Face Detection Analysis

```
Frame Input → Face Detection → Face Count → Position Tracking → Anomaly Detection
```

#### Face Detection Logic
```typescript
interface FaceAnalysis {
  facesDetected: number;
  primaryFaceConfidence: number;
  facePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lookingAway: boolean;
  multipleFaces: boolean;
}
```

### 2. Object Detection Analysis

```
Frame Input → Object Detection → Classification → Risk Assessment
```

#### Detected Objects
- Mobile phones
- Books/notebooks
- Other electronic devices
- Multiple people
- Suspicious items

### 3. Audio Analysis (Optional)

```
Audio Stream → Noise Detection → Voice Count → Background Analysis
```

## Risk Scoring Algorithm

### Risk Score Components

```
Total Risk Score = (
  tabSwitchRisk * 0.30 +
  faceDetectionRisk * 0.35 +
  objectDetectionRisk * 0.25 +
  audioAnomalyRisk * 0.10
)
```

#### Individual Risk Calculations

```typescript
// Tab Switch Risk
tabSwitchRisk = Math.min(tabSwitches * 0.1, 1.0);

// Face Detection Risk
faceDetectionRisk = (
  noFaceFrames / totalFrames * 0.4 +
  multipleFaceFrames / totalFrames * 0.6
);

// Object Detection Risk
objectDetectionRisk = (
  phoneDetections * 0.5 +
  bookDetections * 0.3 +
  otherObjects * 0.2
) / totalFrames;

// Audio Anomaly Risk
audioAnomalyRisk = anomalousAudioEvents / totalAudioSamples;
```

### Risk Score Thresholds

```
┌─────────────────────────────────────────┐
│            Risk Levels                  │
├─────────────────────────────────────────┤
│  🟢 Low Risk:     0.0 - 0.3            │
│  🟡 Medium Risk:  0.3 - 0.6            │
│  🟠 High Risk:    0.6 - 0.8            │
│  🔴 Critical:     0.8 - 1.0            │
└─────────────────────────────────────────┘
```

## Real-time Alerts and Interventions

### Alert System Flow

```
Risk Event Detected → Evaluate Severity → Generate Alert → Display Warning → Log Event
```

### Warning Types

```typescript
interface ProctorWarning {
  type: 'tab_switch' | 'face_not_visible' | 'multiple_faces' | 'object_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: 'warn' | 'pause' | 'terminate';
  timestamp: DateTime;
}
```

### Intervention Actions

1. **Gentle Warning**: Modal popup with warning message
2. **Pause Test**: Temporarily pause until candidate acknowledges
3. **Terminate Session**: End test if critical violations detected

## Post-Test Analysis

### AI Service Communication

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│   Database  │                    │  AI Service  │                    │   Results    │
└─────────────┘                    └──────────────┘                    └──────────────┘
       │                                   │                                   │
       │  1. Retrieve proctoring data      │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │  2. Process frames batch          │                                   │
       │                                   ├─────────┐                         │
       │                                   │         │                         │
       │                                   │◄────────┘                         │
       │                                   │                                   │
       │                                   │  3. Generate analysis report     │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  4. Update risk scores            │                                   │
       │◄──────────────────────────────────┤                                   │
```

### Analysis Report Structure

```typescript
interface ProctorAnalysisReport {
  attemptId: string;
  overallRiskScore: number;
  riskBreakdown: {
    tabSwitches: number;
    faceAnomalies: number;
    objectDetections: number;
    audioAnomalies: number;
  };
  detailedFindings: {
    suspiciousTimestamps: DateTime[];
    flaggedFrames: string[];
    recommendations: string[];
  };
  complianceScore: number;
}
```

## Fallback Mechanisms

### AI Service Unavailable

```
AI Service Down → Fallback to Basic Monitoring → Log Events Only → Manual Review Required
```

### Network Issues

```
Network Interruption → Buffer Data Locally → Resume Upload → Validate Integrity
```

### Browser Compatibility

```
Feature Not Supported → Graceful Degradation → Basic Event Logging → Continue Test
```

## Privacy and Security

### Data Protection
- All proctoring data encrypted at rest
- Limited retention period (configurable)
- Secure transmission (HTTPS/WSS)
- Candidate consent required

### Compliance Features
- GDPR compliance with data deletion
- Configurable data retention policies
- Audit logs for all proctoring activities
- Candidate rights management

### Security Measures
- Signed URLs for media access
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file storage with access controls

---

Last Updated: January 13, 2025
