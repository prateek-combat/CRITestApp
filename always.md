# ALWAYS.md - Critical AI Guidelines for CRITestApp

> **🚨 MANDATORY READ**: This file contains essential guidelines for AI assistants working on this codebase. Following these rules prevents recreating the technical debt we eliminated through massive cleanup efforts (2,500+ lines removed).

## 🏗️ System Overview

**CRITestApp** is a comprehensive online testing platform with:
- **Next.js 14** frontend with TypeScript
- **PostgreSQL** database via Prisma ORM
- **Real-time proctoring** system with AI monitoring
- **Admin dashboard** for test management
- **Public test links** for candidate assessment
- **Job profile-based** test assignments

## 🚫 CRITICAL PROHIBITIONS - NEVER DO THESE

### 1. Email Infrastructure
- **NEVER** add real email functionality back
- **NEVER** install `nodemailer`, `@sendgrid/mail`, or email libraries
- **USE** the stub system in `src/lib/email.ts` instead
- **REASON**: Email system was 1,980+ lines of unused complexity

### 2. Dead Code Creation
- **NEVER** create features without immediate use
- **NEVER** leave commented-out code blocks
- **NEVER** create "future-use" imports or functions
- **ALWAYS** remove unused exports immediately

### 3. Dependency Bloat
- **NEVER** add dependencies without justification
- **ALWAYS** check if functionality exists in current stack
- **NEVER** install development dependencies in production
- **CHECK** package.json impact before any additions

### 4. Architecture Violations
- **NEVER** create circular dependencies
- **NEVER** bypass the auth middleware
- **NEVER** create direct database calls outside API routes
- **FOLLOW** the established patterns in existing code

## ✅ MANDATORY PATTERNS TO FOLLOW

### 1. File Organization
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints ONLY
│   ├── admin/          # Admin dashboard pages
│   └── [feature]/      # Feature-specific pages
├── components/         # Reusable UI components
├── lib/               # Utilities and configurations
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Pure utility functions
```

### 2. API Route Structure
```typescript
// ALWAYS use this pattern for API routes
export async function GET/POST/PUT/DELETE(request: Request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorization check (if needed)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Input validation
    const body = await request.json();
    // Validate inputs here

    // 4. Database operations
    const result = await prisma.model.operation();

    // 5. Return response
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### 3. Component Structure
```typescript
// ALWAYS use this pattern for components
interface ComponentProps {
  // Define props clearly
}

export default function Component({ ...props }: ComponentProps) {
  // 1. Hooks at the top
  const [state, setState] = useState();
  
  // 2. Event handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## 🔧 Key System Components

### 1. Authentication (`src/lib/auth.ts`)
- Uses NextAuth.js with Google OAuth
- **NEVER** modify without understanding auth flow
- **ALWAYS** check session in protected routes

### 2. Database (`prisma/schema.prisma`)
- **NEVER** modify schema without migration
- **ALWAYS** use relationships properly
- **FOLLOW** naming conventions (camelCase for fields)

### 3. Proctoring System (`src/lib/proctor/`)
- **CRITICAL**: Real-time monitoring system
- **NEVER** disable without user consent flows
- **ALWAYS** handle camera/microphone permissions

### 4. Test Engine (`src/app/test/`)
- **STATEFUL**: Maintains test progress
- **NEVER** allow navigation during active tests
- **ALWAYS** handle time limits properly

## 📊 Database Critical Rules

### 1. User Roles
```typescript
enum UserRole {
  ADMIN    // Full system access
  USER     // Test taker only
}
```

### 2. Test States
```typescript
enum TestStatus {
  NOT_STARTED
  IN_PROGRESS  
  COMPLETED
  ARCHIVED
}
```

### 3. Critical Relationships
- `User` ↔ `TestAttempt` (one-to-many)
- `Test` ↔ `Question` (many-to-many via TestQuestion)
- `JobProfile` ↔ `Test` (many-to-many via JobProfileTest)

## 🎨 UI/UX Guidelines

### 1. Tailwind Classes
- **USE** existing utility classes
- **AVOID** custom CSS unless absolutely necessary
- **FOLLOW** responsive design patterns

### 2. Loading States
- **ALWAYS** show loading indicators for async operations
- **USE** existing `LoadingSkeleton` component
- **NEVER** leave hanging states

### 3. Error Handling
- **ALWAYS** show user-friendly error messages
- **NEVER** expose technical errors to users
- **LOG** detailed errors for debugging

## 🔒 Security Requirements

### 1. Input Validation
- **ALWAYS** validate API inputs
- **NEVER** trust client-side data
- **USE** Zod schemas for validation

### 2. Authorization
- **CHECK** user permissions on every protected route
- **NEVER** rely on client-side checks only
- **IMPLEMENT** proper role-based access control

### 3. Data Sanitization
- **SANITIZE** all user inputs
- **PREVENT** XSS attacks
- **ESCAPE** HTML content properly

## 🚀 Performance Rules

### 1. Database Queries
- **USE** proper Prisma includes/select
- **AVOID** N+1 query problems
- **IMPLEMENT** pagination for large datasets

### 2. React Optimization
- **USE** useMemo/useCallback for expensive operations
- **IMPLEMENT** proper key props in lists
- **AVOID** unnecessary re-renders

### 3. Bundle Size
- **MINIMIZE** client-side dependencies
- **USE** dynamic imports for large libraries
- **OPTIMIZE** images and assets

## 📋 Testing Requirements

### 1. API Testing
- **TEST** all API endpoints
- **MOCK** external dependencies
- **VALIDATE** error scenarios

### 2. Component Testing
- **TEST** user interactions
- **MOCK** API calls
- **VERIFY** accessibility

### 3. E2E Testing
- **TEST** critical user flows
- **VERIFY** cross-browser compatibility
- **VALIDATE** proctoring functionality

## 🛠️ Development Workflow

### 1. Before Making Changes
```bash
# Always check current state
git status
npm run build  # Ensure clean build
npm run test   # Run tests
```

### 2. Making Changes
- **CREATE** feature branches
- **COMMIT** frequently with clear messages
- **REVIEW** changes before pushing

### 3. After Changes
```bash
npm run build  # Verify build
npm run test   # Run tests
npm run lint   # Check linting
```

## 📚 Documentation Requirements

### 1. Code Comments
- **MINIMAL** comments in code
- **FOCUS** on WHY, not WHAT
- **UPDATE** comments when code changes

### 2. API Documentation
- **DOCUMENT** all endpoints in `new-docs/api-reference/`
- **INCLUDE** request/response examples
- **MAINTAIN** up-to-date schemas

### 3. Architecture Documentation
- **KEEP** `new-docs/architecture/` current
- **UPDATE** flow diagrams when logic changes
- **DOCUMENT** major design decisions

## 🚨 Emergency Procedures

### 1. Build Failures
1. Check TypeScript errors first
2. Verify all imports are correct
3. Check for missing dependencies
4. Review recent changes

### 2. Runtime Errors
1. Check browser console
2. Review API response errors
3. Verify database connectivity
4. Check authentication state

### 3. Database Issues
1. Check Prisma schema
2. Verify migration status
3. Check connection strings
4. Review recent schema changes

## 📈 Monitoring & Maintenance

### 1. Regular Checks
- **WEEKLY**: Dependency updates
- **MONTHLY**: Performance review
- **QUARTERLY**: Security audit

### 2. Key Metrics
- Build time (should be < 2 minutes)
- Bundle size (monitor increases)
- API response times (< 500ms average)
- Test coverage (maintain > 80%)

### 3. Code Quality
- **ZERO** build warnings
- **ZERO** console errors in production
- **MINIMAL** technical debt
- **CONSISTENT** coding patterns

## 🎯 Success Metrics

### 1. Performance
- ✅ Clean builds (0 warnings/errors)
- ✅ Fast loading times
- ✅ Responsive UI

### 2. Maintainability
- ✅ Clear code structure
- ✅ Comprehensive documentation
- ✅ Easy to extend

### 3. Reliability
- ✅ Stable test execution
- ✅ Accurate proctoring
- ✅ Secure data handling

---

## 🏆 Remember Our Success

This codebase was cleaned from:
- **20,000+ lines** to **17,500+ lines** (12% reduction)
- **Messy email infrastructure** to **clean stubs**
- **Multiple unused dependencies** to **optimized packages**
- **Poor documentation** to **comprehensive guides**

**KEEP IT CLEAN. FOLLOW THE PATTERNS. PREVENT TECHNICAL DEBT.**

---

*Last Updated: January 2025*
*AI Cleanup Achievement: 2,500+ lines removed, 100% build success*
