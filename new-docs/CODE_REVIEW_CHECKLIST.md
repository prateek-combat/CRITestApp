# Code Review Checklist for AI Assistants

Use this checklist before committing any changes to ensure code quality and consistency.

## 🔍 Pre-Commit Checklist

### 1. **Code Quality**
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] No `any` types added (use proper types)
- [ ] No `@ts-ignore` comments added
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code
- [ ] No TODO comments without tracking in TECHNICAL_DEBT.md

### 2. **Security**
- [ ] No hardcoded secrets or API keys
- [ ] All user inputs are validated
- [ ] SQL queries use parameterized queries (Prisma)
- [ ] Authentication checks are in place
- [ ] Proper authorization for admin actions
- [ ] No sensitive data exposed in client-side code

### 3. **Performance**
- [ ] Database queries use `select` to limit fields
- [ ] Large datasets are paginated
- [ ] No N+1 query problems
- [ ] Images use Next.js Image component
- [ ] Heavy operations are debounced/throttled
- [ ] Unnecessary re-renders are prevented

### 4. **Best Practices**
- [ ] Components are properly typed with TypeScript
- [ ] Functions have single responsibility
- [ ] DRY principle followed (no duplicate code)
- [ ] Error states are handled gracefully
- [ ] Loading states are implemented
- [ ] Proper status codes in API responses

### 5. **UI/UX**
- [ ] UI matches existing design patterns
- [ ] Tailwind classes used (no inline styles)
- [ ] Responsive design considered
- [ ] Accessibility attributes included
- [ ] Form validation provides clear feedback
- [ ] Success/error messages are user-friendly

### 6. **Architecture**
- [ ] Code follows existing patterns
- [ ] New code is in the correct directory
- [ ] Reusable code is extracted to utilities
- [ ] API routes follow RESTful conventions
- [ ] Database schema changes are backwards compatible

## 📋 Component Checklist

When creating/modifying components:

```typescript
// ✅ Good Component Structure
interface ComponentProps {
  // All props are typed
  required: string;
  optional?: number;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({ 
  required,
  optional = 42, // Default values
  children 
}) => {
  // 1. All hooks at the top
  const [state, setState] = useState<string>('');
  
  // 2. Memoized values
  const computed = useMemo(() => expensive(), [dependency]);
  
  // 3. Callbacks are memoized
  const handleClick = useCallback(() => {
    // Handle click
  }, [dependency]);
  
  // 4. Clean JSX with consistent formatting
  return (
    <div className="consistent-spacing">
      {children}
    </div>
  );
};
```

## 🔌 API Route Checklist

When creating/modifying API routes:

```typescript
// ✅ Good API Route Structure
export async function POST(request: Request) {
  // 1. Authentication first
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // 2. Input validation
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
  
  // 3. Validate required fields
  if (!body.required) {
    return NextResponse.json(
      { error: 'Missing required field' },
      { status: 400 }
    );
  }
  
  // 4. Try-catch for operations
  try {
    const result = await operation();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🗄️ Database Checklist

When working with database:

- [ ] Use transactions for related operations
- [ ] Select only needed fields
- [ ] Include relations efficiently
- [ ] Handle unique constraint violations
- [ ] Use proper Prisma types
- [ ] Consider adding indexes for frequent queries

## 🧪 Testing Checklist

Before marking feature complete:

- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Different user roles tested
- [ ] Form validation tested
- [ ] API endpoints tested with Postman/curl

## 📝 Documentation Checklist

- [ ] New APIs documented with examples
- [ ] Complex functions have JSDoc comments
- [ ] README updated if architecture changed
- [ ] Environment variables documented
- [ ] Breaking changes noted

## 🚀 Deployment Readiness

- [ ] No development/debug code
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Performance impact assessed
- [ ] Rollback plan identified

## ⚠️ Red Flags to Avoid

Never commit code with these issues:

1. **Infinite loops or recursion**
2. **Synchronous file operations in API routes**
3. **Direct DOM manipulation in React**
4. **Mutations of props or state**
5. **Memory leaks (cleanup effects)**
6. **Race conditions**
7. **SQL injection vulnerabilities**
8. **Cross-site scripting (XSS) vulnerabilities**

## 🎯 Final Checks

Before pushing:

- [ ] `npm run build` succeeds
- [ ] No new warnings introduced
- [ ] Commit message follows convention
- [ ] Changes are focused and atomic
- [ ] PR description explains the why

---

**Remember**: If you're unsure about something, it's better to ask or research than to introduce technical debt.