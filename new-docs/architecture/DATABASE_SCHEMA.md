# CRITestApp Database Schema

## Overview
The CRITestApp uses PostgreSQL with Prisma ORM for data persistence. The schema is designed for scalability, data integrity, and efficient querying.

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id              │
│ email           │
│ passwordHash    │
│ firstName       │
│ lastName        │
│ role            │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │ 1:N
        ├────────────────┬───────────────┬──────────────┬─────────────┐
        ▼                ▼               ▼              ▼             ▼
┌───────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
│   Position    │ │  JobProfile  │ │   Test   │ │TimeSlot  │ │PublicLink  │
├───────────────┤ ├──────────────┤ ├──────────┤ ├──────────┤ ├────────────┤
│ id            │ │ id           │ │ id       │ │ id       │ │ id         │
│ name          │ │ name         │ │ title    │ │ name     │ │ linkToken  │
│ code          │ │ description  │ │ desc     │ │ start    │ │ testId     │
│ department    │ │ isActive     │ │ lockOrder│ │ end      │ │ isActive   │
│ level         │ │ createdById  │ │ createdBy│ │ jobProfile│ │ maxUses   │
└───────────────┘ └──────────────┘ └──────────┘ └──────────┘ └────────────┘
        │               │ 1:N            │ 1:N                        │
        │               ▼                ▼                            ▼
        │       ┌──────────────┐ ┌──────────────┐         ┌─────────────────┐
        │       │ TestWeight   │ │  Question    │         │PublicTestAttempt│
        │       ├──────────────┤ ├──────────────┤         ├─────────────────┤
        │       │ jobProfileId │ │ id           │         │ id              │
        │       │ testId       │ │ promptText   │         │ publicLinkId    │
        │       │ weight       │ │ timerSeconds │         │ candidateName   │
        │       └──────────────┘ │ category     │         │ status          │
        │                        │ questionType │         └─────────────────┘
        │                        └──────────────┘
        │                                │
        └──────────N:M───────────────────┘
```

## Core Tables

### 1. User Management
```sql
User {
  id: UUID (PK)
  email: String (Unique)
  passwordHash: String
  firstName: String?
  lastName: String?
  role: UserRole (ADMIN, SUPER_ADMIN)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. Test Structure
```sql
Test {
  id: UUID (PK)
  title: String
  description: String?
  lockOrder: Boolean
  allowReview: Boolean
  isArchived: Boolean
  emailNotificationsEnabled: Boolean
  notificationEmails: String[]
  includeAnalytics: Boolean
  positionId: String? (FK)
  createdById: String (FK)
}

Question {
  id: UUID (PK)
  testId: String (FK)
  promptText: String
  promptImageUrl: String?
  timerSeconds: Int
  answerOptions: String[]
  correctAnswerIndex: Int?
  sectionTag: String?
  category: QuestionCategory
  questionType: QuestionType
  answerWeights: Json?
}
```

### 3. Job Management
```sql
Position {
  id: UUID (PK)
  name: String (Unique)
  code: String (Unique)
  description: String?
  department: String?
  level: String?
  isActive: Boolean
  createdById: String (FK)
}

JobProfile {
  id: UUID (PK)
  name: String (Unique)
  description: String?
  isActive: Boolean
  createdById: String (FK)
  -- Relations: positions, tests (via TestWeight)
}

TestWeight {
  id: UUID (PK)
  jobProfileId: String (FK)
  testId: String (FK)
  weight: Float
  -- Unique: [jobProfileId, testId]
}
```

### 4. Test Attempts
```sql
TestAttempt {
  id: UUID (PK)
  invitationId: String (FK, Unique)
  testId: String (FK)
  candidateName: String?
  candidateEmail: String?
  ipAddress: String?
  startedAt: DateTime
  completedAt: DateTime?
  status: TestAttemptStatus
  rawScore: Int?
  percentile: Float?
  categorySubScores: Json?
  -- Proctoring fields
  tabSwitches: Int
  proctoringEnabled: Boolean
  videoRecordingUrl: String?
  riskScore: Float?
  riskScoreBreakdown: Json?
}

PublicTestAttempt {
  -- Similar structure to TestAttempt
  -- Linked via publicLinkId instead of invitationId
}
```

### 5. Proctoring Data
```sql
ProctorEvent {
  id: String (PK)
  attemptId: String (FK)
  type: String
  ts: DateTime
  extra: Json?
}

ProctorAsset {
  id: String (PK)
  attemptId: String (FK)
  kind: String
  fileName: String
  mimeType: String
  fileSize: Int
  data: Bytes
  ts: DateTime
}
```

## Key Relationships

### One-to-Many (1:N)
- User → Tests (creator)
- User → Positions (creator)
- User → JobProfiles (creator)
- Test → Questions
- Test → TestAttempts
- JobProfile → JobProfileInvitations
- PublicTestLink → PublicTestAttempts

### Many-to-Many (N:M)
- JobProfile ↔ Test (via TestWeight)
- JobProfile ↔ Position
- Test ↔ Position

### One-to-One (1:1)
- Invitation → TestAttempt
- TestAttempt → Multiple ProctorEvents/Assets

## Indexes and Performance

### Primary Indexes
- All `id` fields are primary keys with UUID default
- Unique constraints on email, position code, job profile name

### Secondary Indexes
```sql
-- Performance indexes
@@index([isActive, department]) on Position
@@index([isArchived, createdAt]) on Test
@@index([status, completedAt]) on TestAttempt
@@index([candidateEmail]) on TestAttempt
@@index([testId, category]) on Question
```

## Enumerations

```typescript
enum UserRole {
  ADMIN
  SUPER_ADMIN
}

enum TestAttemptStatus {
  IN_PROGRESS
  COMPLETED
  TIMED_OUT
  ABANDONED
  ARCHIVED
}

enum QuestionCategory {
  LOGICAL
  VERBAL
  NUMERICAL
  ATTENTION_TO_DETAIL
  OTHER
}

enum QuestionType {
  OBJECTIVE
  PERSONALITY
}

enum InvitationStatus {
  PENDING
  SENT
  OPENED
  COMPLETED
  EXPIRED
  CANCELLED
}
```

## Data Integrity Rules

### Cascading Deletes
- Deleting a Test cascades to Questions
- Deleting a JobProfile cascades to TestWeights
- Deleting an Attempt cascades to ProctorEvents/Assets

### Soft Deletes
- Tests use `isArchived` flag instead of hard delete
- Maintains historical data integrity

### Constraints
- Email must be unique across Users
- Position code must be unique
- JobProfile name must be unique
- TestWeight has unique constraint on [jobProfileId, testId]

## JSON Field Structures

### categorySubScores
```json
{
  "LOGICAL": 85.5,
  "VERBAL": 72.0,
  "NUMERICAL": 90.0,
  "ATTENTION_TO_DETAIL": 88.5
}
```

### riskScoreBreakdown
```json
{
  "tabSwitches": 0.15,
  "facesDetected": 0.0,
  "objectsDetected": 0.25,
  "audioAnomalies": 0.0,
  "overallRisk": 0.40
}
```

### answerWeights (for personality questions)
```json
{
  "dimension1": [0.8, 0.2, 0.5, 0.1],
  "dimension2": [0.1, 0.9, 0.3, 0.7]
}
```

## Migration Strategy

### Adding New Fields
1. Add field as optional in schema
2. Run migration
3. Backfill data if needed
4. Make field required if necessary

### Modifying Relations
1. Create new relation
2. Migrate data
3. Update application code
4. Remove old relation

### Performance Optimization
1. Monitor slow queries
2. Add appropriate indexes
3. Consider materialized views for complex reports
4. Implement connection pooling

---

Last Updated: January 13, 2025
