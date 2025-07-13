# Test Taking Flow Documentation

## Overview
This document describes the complete flow of how candidates take tests in the CRITestApp, from accessing the test link to completion and scoring.

## Test Access Methods

### 1. Direct Invitation Flow
```
Admin creates invitation → Email sent to candidate → Candidate clicks link → Test interface
```

### 2. Public Link Flow
```
Admin creates public link → Share link → Candidate accesses → Enter details → Test interface
```

### 3. Job Profile Invitation Flow
```
Admin invites to job profile → Multiple tests assigned → Candidate completes all tests
```

## Complete Test Taking Flow

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│  Candidate  │                    │  Test App    │                    │  Database    │
└─────────────┘                    └──────────────┘                    └──────────────┘
       │                                   │                                   │
       │  1. Access test link              │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  2. Validate link/invitation     │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  3. System compatibility check    │                                   │
       │◄──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  4. Grant permissions             │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  5. Create test attempt          │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │                                   │  6. Start proctoring             │
       │                                   ├─────────┐                         │
       │                                   │         │                         │
       │                                   │◄────────┘                         │
       │                                   │                                   │
       │  7. Load first question           │                                   │
       │◄──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  8. Answer & navigate             │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  9. Save answer                  │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  10. Continue until complete      │                                   │
       │◄─────────────────────────────────►│◄─────────────────────────────────►│
       │                                   │                                   │
       │  11. Submit test                  │                                   │
       ├──────────────────────────────────►│                                   │
       │                                   │                                   │
       │                                   │  12. Calculate scores            │
       │                                   ├──────────────────────────────────►│
       │                                   │                                   │
       │  13. Show completion screen       │                                   │
       │◄──────────────────────────────────┤                                   │
```

## Pre-Test Setup

### System Compatibility Check
```
┌─────────────────────────────────────────┐
│         Browser Compatibility           │
├─────────────────────────────────────────┤
│ • Chrome/Edge/Firefox/Safari Check     │
│ • JavaScript Enabled                    │
│ • Cookies Enabled                       │
│ • Pop-up Blocker Check                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Permission Requirements          │
├─────────────────────────────────────────┤
│ • Camera Access (if proctoring)        │
│ • Microphone Access (if proctoring)    │
│ • Screen Recording (optional)          │
│ • Fullscreen Mode                      │
└─────────────────────────────────────────┘
```

### Test Attempt Creation
```typescript
// Test attempt initialization
{
  id: UUID,
  candidateName: string,
  candidateEmail: string,
  testId: string,
  startedAt: DateTime.now(),
  status: 'IN_PROGRESS',
  proctoringEnabled: boolean,
  currentQuestionIndex: 0,
  tabSwitches: 0
}
```

## Question Navigation Flow

### Linear Navigation (lockOrder: true)
```
Question 1 → Question 2 → Question 3 → ... → Question N → Submit
    ↓            ↓            ↓                  ↓
  Timer       Timer        Timer              Timer
  (60s)       (45s)        (90s)              (30s)
```

### Free Navigation (lockOrder: false)
```
┌─────────────────────────────────────────┐
│           Question Grid                 │
├─────────────────────────────────────────┤
│  [1] [2] [3] [4] [5] [6] [7] [8]      │
│  [9] [10][11][12][13][14][15][16]     │
│                                         │
│  Legend:                                │
│  ⬜ Not Attempted                       │
│  🟩 Answered                            │
│  🟨 Bookmarked                          │
│  🟦 Current                             │
└─────────────────────────────────────────┘
```

## Answer Submission Process

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│Select Answer│────►│  Validate    │────►│Save to DB   │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │Update Timer  │     │Update State │
                    └──────────────┘     └─────────────┘
```

### Answer Data Structure
```typescript
{
  questionId: string,
  selectedAnswerIndex: number,
  timeTakenSeconds: number,
  submittedAt: DateTime,
  isCorrect: boolean (calculated server-side)
}
```

## Test Completion Flow

### Automatic Completion Triggers
1. All questions answered
2. Test timer expires
3. Manual submission by candidate
4. Browser/connection issues (TIMED_OUT status)

### Scoring Process
```
Raw Score Calculation
        │
        ▼
Category-wise Scoring
        │
        ▼
Percentile Calculation
        │
        ▼
Risk Score Analysis
        │
        ▼
Generate Report
```

## Real-time Features

### Progress Tracking
```typescript
// Updated in real-time
{
  questionsAnswered: 15,
  totalQuestions: 50,
  timeRemaining: "45:30",
  currentScore: null, // Hidden until completion
  bookmarkedQuestions: [3, 7, 12]
}
```

### Auto-save Mechanism
- Answers saved immediately on selection
- Progress saved every 30 seconds
- Browser local storage backup
- Resume capability if connection lost

## Error Handling

### Connection Issues
```
┌─────────────────┐
│Connection Lost  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Show Warning    │────►│ Retry Connection │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                        ▼                 ▼
                ┌─────────────┐   ┌─────────────┐
                │  Reconnect  │   │Save Locally │
                └─────────────┘   └─────────────┘
```

### Browser Issues
- Tab switch detection and warning
- Browser back button disabled
- Refresh prevention with confirmation
- Fullscreen exit warning

## Post-Test Processing

### Immediate Actions
1. Stop all timers
2. End proctoring session
3. Calculate raw scores
4. Update test status to COMPLETED
5. Trigger email notifications

### Delayed Processing
1. Calculate percentiles (batch job)
2. Generate detailed reports
3. Update leaderboards
4. AI proctoring analysis

## Special Scenarios

### Resume Test Flow
```
Previous attempt exists → Check time limit → Load saved progress → Continue from last question
```

### Multiple Test Sessions (Job Profile)
```
Complete Test 1 → Show progress → Start Test 2 → ... → All tests complete → Combined results
```

### Time Slot Restrictions
```
Check current time → Within slot window? → Allow access : Show waiting/expired message
```

---

Last Updated: January 13, 2025
