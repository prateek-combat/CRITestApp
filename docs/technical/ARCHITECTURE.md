# 🏗️ Test Platform Architecture

## Overview

This document describes the complete architecture of the Test Platform with integrated proctoring system, designed with a **single-database approach** using PostgreSQL for all data storage and job processing.

## 🎯 Design Goals

- **Simplicity**: Single database for all data (user data, recordings, job queue)
- **Reliability**: ACID transactions and PostgreSQL's proven stability
- **Scalability**: Horizontal scaling of workers, vertical scaling of database
- **Cost-Effectiveness**: Minimal infrastructure dependencies
- **Open Source**: 100% open-source stack with no vendor lock-in

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS             │
│  ├── Admin Panel (dashboard, user management, analytics)        │
│  ├── Test Interface (proctored recording + live monitoring)     │
│  └── Authentication (NextAuth.js + Google OAuth)               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                             │
│  ├── /api/admin/* (user/test management)                       │
│  ├── /api/proctor/* (event collection, video upload)           │
│  ├── /api/recordings/* (video serving from database)           │
│  └── /api/test-attempts/* (test execution)                     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Job Queue Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  pg-boss (PostgreSQL-based job queue)                          │
│  ├── Job enqueueing (video analysis tasks)                     │
│  ├── Job processing (worker polling)                           │
│  └── Job monitoring (status tracking)                          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Neon)                                    │
│  ├── Application Data (users, tests, results)                  │
│  ├── Binary Storage (video recordings as BYTEA)                │
│  ├── Job Queue Tables (pgboss.* schema)                        │
│  └── Proctoring Events (violations, risk scores)               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Analysis Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Python Worker (Docker Container)                              │
│  ├── Video Analysis (MediaPipe + YOLO)                         │
│  ├── Audio Analysis (WebRTC VAD + pyannote)                    │
│  ├── Risk Calculation (weighted scoring)                       │
│  └── Result Storage (events + risk scores)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### 1. Test Taking Flow

```
Candidate → Frontend → Live Monitoring → Real-time Events → Database
         ↓
    Video Recording → Video Upload → Database Storage → Job Queue
                                                      ↓
                                             Python Worker Analysis
                                                      ↓
                                           Risk Calculation → Database
```

### 2. Admin Review Flow

```
Admin → Dashboard → Query Database → View Results
                 ↓
              Video Player ← Serve from Database ← ProctorAsset.data
```

## 🗄️ Database Schema

### Core Tables

- **User**: Admin user accounts and authentication
- **Test**: Test definitions and configuration
- **Question**: Individual test questions with multiple choice answers
- **Invitation**: Test invitations sent to candidates
- **TestAttempt**: Completed test attempts with scores and metadata

### Proctoring Tables

- **ProctorEvent**: Real-time and AI-detected events during tests
- **ProctorAsset**: Binary video recordings stored in database
- **TestAttempt.riskScore**: Calculated risk score (0-100)

### Job Queue Tables (pg-boss)

- **pgboss.job**: Job queue for video analysis tasks
- **pgboss.schedule**: Scheduled job definitions
- **pgboss.subscription**: Worker subscriptions

## 🔍 Proctoring System

### Real-Time Monitoring

Frontend captures and reports:

- Tab visibility changes
- DevTools detection
- Copy/paste operations
- Keyboard shortcuts
- Mouse activity
- Full-screen exits

### Video Recording

- **Format**: WebM (H.264/VP8 + AAC/Opus)
- **Storage**: PostgreSQL BYTEA field
- **Size Limit**: 500MB per recording
- **Serving**: Streamed from database via API route

### AI Analysis Pipeline

1. **Job Creation**: Video upload triggers pg-boss job
2. **Worker Processing**: Python worker claims jobs via internal queue API (token-protected)
3. **Video Download**: Worker fetches video from database
4. **Multi-Modal Analysis**:
   - Face detection and head pose estimation
   - Object detection (phones, multiple people)
   - Audio analysis (speaker changes, voice activity)
5. **Risk Scoring**: Weighted algorithm calculates 0-100 score
6. **Result Storage**: Events and scores saved to database

**Queue Contract**:

- Job payloads are versioned (`schemaVersion`) to allow safe evolution.
- Worker queue access is encapsulated behind internal API endpoints.

**Authoritative Scoring**:

- Risk scoring is performed by the Python worker and stored in the database.
- API routes and UI treat the stored score as the source of truth.

### Risk Categories

- **0-10**: Low risk (normal behavior)
- **10-25**: Medium risk (minor violations)
- **25-50**: High risk (significant violations)
- **50+**: Critical risk (severe violations)

## 🔧 Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: UI library with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **RecordRTC**: WebRTC video recording
- **devtools-detect**: Browser DevTools detection

### Backend

- **Next.js API Routes**: Serverless API endpoints
- **Prisma 5**: Type-safe database ORM
- **NextAuth.js**: Authentication framework
- **pg-boss**: PostgreSQL job queue

### Database

- **PostgreSQL**: Primary database (Neon cloud)
- **Prisma Schema**: Database definition and migrations

### Analysis Worker

- **Python 3.11**: Runtime environment
- **MediaPipe**: Face detection and pose estimation
- **YOLO (Ultralytics)**: Object detection
- **WebRTC VAD**: Voice activity detection
- **pyannote.audio**: Speaker diarization
- **OpenCV**: Video processing
- **FFmpeg**: Audio/video manipulation

### Infrastructure

- **Docker**: Worker containerization
- **Vercel**: Frontend deployment (recommended)
- **Neon**: PostgreSQL hosting
- **GitHub**: Source code management

## 🔐 Security Boundaries

### Authentication & Authorization

- **Admin APIs**: `/api/admin/*` endpoints require authenticated users with `ADMIN` or `SUPER_ADMIN` roles.
- **Public flows**: `/api/public-test*` endpoints accept unauthenticated access for candidate flows.
- **Worker APIs**: `/api/internal/queue/*` endpoints require `WORKER_API_TOKEN` and do not use session auth.

### CSRF Protection

- CSRF protection applies to authenticated, non-GET requests.
- The double-submit cookie pattern is used with an explicit CSRF header.
- Public candidate endpoints do not require CSRF tokens.

### Internal Queue Contract

- Job payloads include a `schemaVersion` for forward compatibility.
- Worker access is rate-limited and token-protected.

## 🚀 Deployment Architecture

### Development

```
Local Machine
├── Next.js (npm run dev)
├── PostgreSQL (Neon cloud)
└── Worker (Docker container)
```

### Production

```
Vercel (Frontend + API)
├── Static Assets
├── API Routes
└── Serverless Functions
         │
         ▼
Neon PostgreSQL (Database + Queue)
         │
         ▼
Cloud Workers (Docker containers)
├── AWS ECS / Google Cloud Run
├── Auto-scaling based on queue length
└── Health monitoring
```

## 🔒 Security Considerations

### Authentication & Authorization

- Google OAuth 2.0 integration
- Role-based access control (ADMIN, SUPER_ADMIN)
- Session-based authentication
- Pre-registered admin emails only

### Data Protection

- Video recordings accessible only to admins
- Secure API endpoints with session validation
- Input validation and sanitization
- SQL injection prevention via Prisma

### Privacy Compliance

- Candidate consent required for recording
- Data retention policies configurable
- GDPR/privacy law compliance considerations
- Audit logs for admin actions

## 📈 Scaling Strategies

### Horizontal Scaling

- **Multiple Workers**: Deploy multiple Docker containers
- **Load Balancing**: Distribute analysis jobs across workers
- **Regional Deployment**: Workers closer to data centers

### Vertical Scaling

- **Database**: Neon auto-scaling capabilities
- **Worker Resources**: Increase Docker memory/CPU limits
- **Queue Throughput**: pg-boss handles high job volumes

### Performance Optimization

- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis cache for frequently accessed data (optional)
- **CDN**: Static asset delivery optimization

## 🔧 Monitoring & Observability

### Application Metrics

- Test completion rates
- Video upload success rates
- Analysis job processing times
- Risk score distributions

### System Metrics

- Database connection counts
- Job queue length and processing rates
- Worker health and resource usage
- API response times

### Error Tracking

- Failed video uploads
- Analysis processing errors
- Authentication failures
- Database connection issues

## 🎯 Future Enhancements

### Enhanced Analysis

- **Emotion Detection**: Facial expression analysis
- **Gaze Tracking**: Eye movement patterns
- **Behavioral Biometrics**: Typing and mouse patterns
- **Advanced Audio**: Stress detection in voice

### System Improvements

- **Real-time Analysis**: Live violation detection
- **Mobile Support**: Native mobile app for tests
- **Advanced Reporting**: Detailed analytics dashboard
- **API Integration**: Webhook notifications for violations

### Scalability

- **Multi-tenant**: Support multiple organizations
- **Global Deployment**: Multi-region architecture
- **Advanced Caching**: Redis cluster for performance
- **Message Queues**: Event-driven architecture

---

This architecture provides a solid foundation for a production-ready proctoring system while maintaining simplicity and cost-effectiveness through the single-database approach.
