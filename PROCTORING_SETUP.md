# Proctoring System Setup Guide

This guide explains how to set up the comprehensive proctoring system for the Test platform.

## Overview

The proctoring system provides:
- **Real-time browser monitoring** (tab switches, DevTools, copy/paste)
- **Video/audio recording** during tests
- **Automated analysis** using AI models for suspicious behavior detection
- **Risk scoring** based on detected violations
- **Single database storage** (PostgreSQL for everything: data, recordings, job queue)

## Architecture

```
Frontend (Next.js)
├── Recording (RecordRTC + MediaStream)
├── Live monitoring (browser events)
└── Event reporting (beacon API)

Backend (Next.js API)
├── Event collection (/api/proctor/event)
├── Video upload (/api/proctor/upload → Database)
├── Video serving (/api/recordings/database/[id])
└── Queue jobs (pg-boss → PostgreSQL)

Analysis Worker (Python/Docker)
├── Video analysis (MediaPipe + YOLO)
├── Audio analysis (WebRTC VAD + pyannote)
└── Risk calculation
```

## Prerequisites

1. **PostgreSQL database** (Neon) - handles everything: data, recordings, job queue
2. **Docker** for running analysis workers

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL="your-neon-postgres-url"
NEXTAUTH_SECRET="your-secret-key"

# Optional OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

All required packages (including pg-boss) are already in package.json.

### 2. Database Setup

The Prisma schema includes all proctoring tables:
- `ProctorEvent` - stores browser/behavior events
- `ProctorAsset` - stores video recordings as binary data
- `TestAttempt.riskScore` - final calculated risk score
- `pgboss.*` tables - job queue management (auto-created)

Push the schema to your database:

```bash
npx prisma db push
npx prisma generate
```

### 3. Python Worker Setup

Build and run the analysis worker:

```bash
# Build the Docker image
docker-compose -f docker-compose.proctor.yml build

# Start worker
docker-compose -f docker-compose.proctor.yml up -d
```

The worker will:
- Poll PostgreSQL job queue for new analysis jobs
- Download videos from database
- Run AI analysis (pose estimation, object detection, audio analysis)
- Save detected events to database
- Calculate and update risk scores

## Testing the System

### 1. Start the Application

```bash
npm run dev
```

### 2. Start Proctoring Worker

```bash
# Start analysis worker
docker-compose -f docker-compose.proctor.yml up -d

# Check worker logs
docker logs -f proctor-worker
```

### 3. Take a Test

1. Create a test invitation as admin
2. Open the test as a candidate
3. Grant camera/microphone permissions
4. Complete the test
5. Check admin panel for:
   - Recorded video link
   - Risk score
   - Detected events

## Monitoring and Debugging

### Check Queue Status

Connect to your PostgreSQL database and check:

```sql
-- Check pending jobs
SELECT COUNT(*) FROM pgboss.job WHERE name = 'proctor.analyse' AND state = 'created';

-- Check active jobs
SELECT COUNT(*) FROM pgboss.job WHERE name = 'proctor.analyse' AND state = 'active';

-- Check recent jobs
SELECT id, state, createdon, completedon FROM pgboss.job 
WHERE name = 'proctor.analyse' 
ORDER BY createdon DESC LIMIT 10;
```

### Worker Logs

```bash
docker logs -f proctor-worker
```

### Database Events

```sql
-- Check proctor events for a test attempt
SELECT * FROM "ProctorEvent" WHERE "attemptId" = 'attempt-id';

-- Check risk scores
SELECT id, "candidateName", "riskScore", "videoRecordingUrl" 
FROM "TestAttempt" 
WHERE "riskScore" IS NOT NULL;
```

## Architecture Benefits

### Single Database Approach
- **Simplified Deployment**: Only PostgreSQL needed (no Redis setup)
- **Easier Management**: Everything in one database
- **Cost Effective**: Reduce infrastructure dependencies
- **ACID Compliance**: Reliable job processing with PostgreSQL transactions

### pg-boss Features
- **PostgreSQL-native**: Uses PostgreSQL for job queue
- **Reliable**: ACID transactions, at-least-once delivery
- **Monitoring**: Built-in job status tracking
- **Scalable**: Multiple workers can process jobs concurrently

## Risk Score Interpretation

- **0-10**: Low risk (normal behavior)
- **10-25**: Medium risk (minor violations)
- **25-50**: High risk (significant violations)
- **50+**: Critical risk (severe violations)

### Risk Factors

| Event Type | Base Weight | Description |
|------------|-------------|-------------|
| FACE_NOT_DETECTED | 15 | No face visible in frame |
| HEAD_TURNED_AWAY | 10 | Head rotated significantly |
| MULTIPLE_FACES | 25 | More than one person detected |
| PHONE_DETECTED | 30 | Mobile device visible |
| EXCESSIVE_MOVEMENT | 8 | Unusual movement patterns |
| MULTIPLE_SPEAKERS | 20 | Different voices detected |
| LONG_SILENCE | 5 | Extended periods without voice |

## Troubleshooting

### Common Issues

1. **Jobs not processing**: Check database connection and pg-boss schema
2. **Worker crashes**: Check Docker logs for Python dependencies
3. **High memory usage**: Adjust Docker memory limits
4. **Slow analysis**: Consider multiple worker instances

### Performance Optimization

- **Multiple Workers**: Scale horizontally with multiple Docker containers
- **Database Indexing**: Add indexes on job queue tables if needed
- **Memory Management**: Tune Docker memory limits based on video size

## License Compliance

All dependencies use OSS-compatible licenses:
- **MediaPipe**: Apache 2.0
- **YOLO (Ultralytics)**: AGPL-3.0 (consider commercial license)
- **WebRTC VAD**: BSD-3-Clause
- **pyannote.audio**: MIT
- **RecordRTC**: MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review worker logs
3. Test with minimal setup
4. Contact the development team 