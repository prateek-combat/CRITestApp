# API Endpoints Reference

## Overview
This document provides a comprehensive reference for all API endpoints in the CRITestApp. All endpoints use JSON for request/response bodies and require authentication unless specified otherwise.

## Base Configuration
- **Base URL**: `/api`
- **Authentication**: Session-based (NextAuth.js)
- **Content-Type**: `application/json`
- **Rate Limiting**: Applied to most endpoints

## Authentication Endpoints

### `/api/auth/*` (NextAuth.js)
Handled by NextAuth.js - see Authentication Flow documentation.

## Admin Endpoints

### Job Profiles
```
GET    /api/admin/job-profiles              # List all job profiles
POST   /api/admin/job-profiles              # Create new job profile
GET    /api/admin/job-profiles/[id]         # Get job profile details
PUT    /api/admin/job-profiles/[id]         # Update job profile
DELETE /api/admin/job-profiles/[id]         # Delete job profile
```

### Time Slots
```
GET    /api/admin/time-slots                # List time slots for job profile
POST   /api/admin/time-slots                # Create new time slot
PUT    /api/admin/time-slots/[id]           # Update time slot
DELETE /api/admin/time-slots/[id]           # Delete time slot
```

### Tests Management
```
GET    /api/tests                           # List all tests
POST   /api/tests                           # Create new test
GET    /api/tests/[id]                      # Get test details
PUT    /api/tests/[id]                      # Update test
DELETE /api/tests/[id]                      # Archive test
```

### Questions Management
```
GET    /api/questions?testId=[testId]       # List questions for test
POST   /api/questions                       # Create new question
PUT    /api/questions/[id]                  # Update question
DELETE /api/questions/[id]                  # Delete question
POST   /api/questions/bulk-import           # Bulk import from Excel/CSV
```

### Analytics
```
GET    /api/analytics/leaderboard           # Get leaderboard data
GET    /api/analytics/test-results          # Get detailed test results
GET    /api/analytics/performance           # Get performance metrics
```

## Test Taking Endpoints

### Public Test Access
```
GET    /api/public-test/[token]             # Access test via public link
POST   /api/public-test/[token]/start       # Start test attempt
POST   /api/public-test/[token]/submit      # Submit answer
POST   /api/public-test/[token]/complete    # Complete test
```

### Test Attempts
```
GET    /api/test-attempts/[id]              # Get attempt details
POST   /api/test-attempts/[id]/resume       # Resume incomplete attempt
```

### Question Responses
```
POST   /api/test-attempts/[id]/answers      # Submit answer
GET    /api/test-attempts/[id]/progress     # Get progress
```

## Proctoring Endpoints

### Proctoring Data
```
POST   /api/proctor/events                  # Log proctoring event
POST   /api/proctor/assets                  # Upload proctoring asset
GET    /api/proctor/analysis/[attemptId]    # Get AI analysis results
```

### Real-time Monitoring
```
WebSocket: /api/proctor/ws/[attemptId]      # Real-time proctoring stream
```

## Invitation Endpoints

### Job Profile Invitations
```
GET    /api/job-profile-invitations         # List invitations
POST   /api/job-profile-invitations         # Create invitation
PUT    /api/job-profile-invitations/[id]    # Update invitation status
```

### Direct Test Invitations
```
GET    /api/invitations                     # List test invitations
POST   /api/invitations                     # Create test invitation
```

## File Management

### File Uploads
```
POST   /api/files/upload                    # Upload file (questions, images)
GET    /api/files/[id]                      # Download file
DELETE /api/files/[id]                      # Delete file
```

## Detailed Endpoint Documentation

## Job Profile Management

### GET `/api/admin/job-profiles`
Get list of all job profiles.

**Authentication**: Required (ADMIN, SUPER_ADMIN)

**Query Parameters**:
- `page?: number` - Page number for pagination
- `limit?: number` - Items per page (max 100)
- `search?: string` - Search by name or description
- `isActive?: boolean` - Filter by active status

**Response**:
```typescript
{
  jobProfiles: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
      email: string;
    };
    _count: {
      testWeights: number;
      invitations: number;
    };
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

### POST `/api/admin/job-profiles`
Create a new job profile.

**Authentication**: Required (ADMIN, SUPER_ADMIN)

**Request Body**:
```typescript
{
  name: string;           // Required, unique
  description?: string;
  positionIds?: string[]; // Position IDs to associate
  testWeights?: {         // Test assignments with weights
    testId: string;
    weight: number;
  }[];
}
```

**Response**:
```typescript
{
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}
```

## Test Taking Flow

### GET `/api/public-test/[token]`
Access a test via public link.

**Authentication**: Not required

**Parameters**:
- `token: string` - Public test link token

**Response**:
```typescript
{
  publicLink: {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    expiresAt: string;
    isTimeRestricted: boolean;
    timeSlot?: {
      startDateTime: string;
      endDateTime: string;
      timezone: string;
    };
  };
  test: {
    id: string;
    title: string;
    description: string;
    lockOrder: boolean;
    allowReview: boolean;
    questions: {
      id: string;
      timerSeconds: number;
      category: string;
    }[];
  };
  candidateForm: {
    requiresName: boolean;
    requiresEmail: boolean;
  };
}
```

### POST `/api/public-test/[token]/start`
Start a new test attempt.

**Authentication**: Not required

**Request Body**:
```typescript
{
  candidateName: string;
  candidateEmail: string;
  ipAddress?: string;
  proctoringConsent: boolean;
}
```

**Response**:
```typescript
{
  attemptId: string;
  status: 'IN_PROGRESS';
  startedAt: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  proctoringEnabled: boolean;
}
```

### POST `/api/public-test/[token]/submit`
Submit an answer for current question.

**Authentication**: Not required

**Request Body**:
```typescript
{
  attemptId: string;
  questionId: string;
  selectedAnswerIndex: number;
  timeTakenSeconds: number;
}
```

**Response**:
```typescript
{
  success: boolean;
  nextQuestionId?: string;
  progressPercentage: number;
  questionsRemaining: number;
}
```

## Proctoring API

### POST `/api/proctor/events`
Log a proctoring event.

**Authentication**: Not required (uses attempt validation)

**Request Body**:
```typescript
{
  attemptId: string;
  type: 'tab_switch' | 'focus_loss' | 'fullscreen_exit' | 'right_click' | 'devtools_open';
  timestamp: string;
  extra?: {
    [key: string]: any;
  };
}
```

**Response**:
```typescript
{
  eventId: string;
  riskScoreUpdate?: number;
  warning?: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  };
}
```

### POST `/api/proctor/assets`
Upload proctoring media (images/video).

**Authentication**: Not required (uses attempt validation)

**Request**: Multipart form data
- `attemptId: string`
- `kind: 'image' | 'video' | 'audio'`
- `file: File`
- `timestamp: string`

**Response**:
```typescript
{
  assetId: string;
  fileSize: number;
  processed: boolean;
}
```

## Analytics API

### GET `/api/analytics/leaderboard`
Get leaderboard data with rankings.

**Authentication**: Required (ADMIN, SUPER_ADMIN)

**Query Parameters**:
- `jobProfileId?: string` - Filter by job profile
- `positionId?: string` - Filter by position
- `limit?: number` - Number of results (default 50)
- `includeArchived?: boolean` - Include archived attempts

**Response**:
```typescript
{
  leaderboard: {
    rank: number;
    candidateName: string;
    candidateEmail: string;
    overallScore: number;
    percentile: number;
    completedAt: string;
    riskScore: number;
    categoryScores: {
      [category: string]: number;
    };
    jobProfile?: {
      name: string;
    };
  }[];
  metadata: {
    totalCandidates: number;
    averageScore: number;
    topScore: number;
    lastUpdated: string;
  };
}
```

## Error Responses

### Standard Error Format
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## Rate Limiting

### Limits by Endpoint Type
- **Admin Operations**: 100 requests/minute
- **Test Taking**: 300 requests/minute
- **Proctoring Data**: 1000 requests/minute
- **File Uploads**: 20 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Connections

### Proctoring Stream
**Endpoint**: `/api/proctor/ws/[attemptId]`

**Events**:
```typescript
// Client → Server
{
  type: 'frame_capture';
  data: string; // base64 image
  timestamp: number;
}

{
  type: 'event_log';
  eventType: string;
  data: any;
}

// Server → Client
{
  type: 'risk_alert';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

{
  type: 'connection_status';
  status: 'connected' | 'disconnected' | 'error';
}
```

---

Last Updated: January 13, 2025
