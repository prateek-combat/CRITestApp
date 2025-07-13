# CRITestApp System Architecture

## Overview
CRITestApp is a comprehensive online assessment platform built with modern web technologies. It provides secure test administration, AI-powered proctoring, and detailed analytics for recruitment and evaluation purposes.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend Layer                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router │ React 19 │ TypeScript │ Tailwind CSS │ SWR    │
│                                                                         │
│  Pages:                Components:            Stores:                   │
│  • /login             • UI Components         • Zustand                │
│  • /admin/*           • Admin Components      • Local Storage          │
│  • /test/*            • Test Components       • Session Storage        │
│  • /public-test/*     • Proctoring UI                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Layer (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  API Routes:           Middleware:           Services:                  │
│  • /api/auth/*        • Authentication       • Email Service           │
│  • /api/admin/*       • Authorization        • Proctoring Service      │
│  • /api/tests/*       • Rate Limiting        • Scoring Service         │
│  • /api/analytics/*   • Logging              • Notification Service    │
│  • /api/proctor/*     • Error Handling       • Analytics Service       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Data Access Layer                              │
├─────────────────────────────────────────────────────────────────────────┤
│                          Prisma ORM (v6.10.1)                           │
│                                                                         │
│  Models:               Relations:            Enums:                     │
│  • User               • 1:N, N:M             • UserRole                │
│  • Test               • Cascading            • TestAttemptStatus       │
│  • Question           • Soft Deletes         • QuestionCategory        │
│  • TestAttempt                               • InvitationStatus        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Database Layer                               │
├─────────────────────────────────────────────────────────────────────────┤
│                    PostgreSQL (Supabase/Neon)                           │
│                                                                         │
│  • ACID Compliance    • JSON Support         • Full Text Search        │
│  • Row Level Security • Connection Pooling   • Backup & Recovery       │
└─────────────────────────────────────────────────────────────────────────┘
```

## External Services Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         External Services                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ Google OAuth │  │ SMTP Server  │  │ AI Proctor   │  │   Vercel   ││
│  │              │  │              │  │   Service    │  │            ││
│  │ • Auth       │  │ • Email      │  │ • Face Det.  │  │ • Hosting  ││
│  │ • SSO        │  │ • Notif.     │  │ • Object Det.│  │ • CDN      ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Authentication & Authorization
- **Technology**: NextAuth.js v4 with Google OAuth
- **Roles**: USER, ADMIN, SUPER_ADMIN
- **Security**: Session-based auth with secure cookies
- **Access Control**: Role-based middleware protection

### 2. Test Management System
- **Test Creation**: Admin interface for creating assessments
- **Question Types**: Multiple choice (objective) and personality questions
- **Categories**: Logical, Verbal, Numerical, Attention to Detail, Other
- **Features**: Timer per question, bulk import, question ordering

### 3. Job Profile & Position System
- **Job Profiles**: Grouping of tests with weighted scoring
- **Positions**: Department/role definitions
- **Test Weights**: Configurable importance per test in a profile
- **Time Slots**: Scheduled assessment windows

### 4. Proctoring System
- **Client-Side**: WebRTC for audio/video capture
- **Processing**: AI service for face/object detection
- **Storage**: Binary data in PostgreSQL
- **Risk Scoring**: Automated cheating detection

### 5. Analytics & Reporting
- **Leaderboards**: Position-based rankings
- **Performance Metrics**: Category-wise scoring
- **Export Options**: Excel, PDF reports
- **Real-time Updates**: SWR for live data

## Data Flow Architecture

### Test Taking Flow
```
Candidate → Public Link → System Check → Test Interface → Submit
                ↓                ↓            ↓            ↓
           Validation      Proctoring    Save Progress  Calculate Score
                                ↓                           ↓
                          AI Analysis                   Generate Report
```

### Admin Flow
```
Admin Login → Dashboard → Create/Manage → Invite → Monitor → Analyze
                 ↓            ↓            ↓         ↓         ↓
              Analytics  Tests/Questions  Email   Real-time  Export
```

## Security Architecture

### Application Security
- Input validation at all entry points
- SQL injection prevention via Prisma
- XSS protection through React
- CSRF tokens for state-changing operations
- Rate limiting on API endpoints

### Data Security
- Encrypted passwords (bcrypt)
- Secure session management
- Environment variable protection
- File upload restrictions
- Audit logging

## Scalability Considerations

### Current Architecture Supports:
- 1000+ concurrent test takers
- 100,000+ questions per test
- 10GB+ proctoring data storage
- Sub-second response times

### Future Scaling Options:
- Database read replicas
- Redis caching layer
- CDN for static assets
- Microservices for proctoring
- Horizontal scaling via containerization

## Technology Stack Details

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **React 19**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS 3.4**: Utility-first CSS
- **SWR 2.3**: Data fetching and caching
- **Zustand 5**: State management

### Backend
- **Node.js**: JavaScript runtime
- **Prisma 6.10**: Type-safe ORM
- **PostgreSQL**: Primary database
- **pg-boss 9**: Job queue management

### DevOps
- **Vercel**: Deployment platform
- **Docker**: Containerization
- **GitHub Actions**: CI/CD
- **ESLint/Prettier**: Code quality

## Monitoring & Observability

### Application Monitoring
- Error tracking and logging
- Performance metrics
- User activity tracking
- API usage analytics

### Infrastructure Monitoring
- Database performance
- API response times
- Resource utilization
- Uptime monitoring

---

Last Updated: January 13, 2025
