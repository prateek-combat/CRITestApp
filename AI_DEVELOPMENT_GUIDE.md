# AI Development Guide for CRITestApp

This guide provides essential instructions for AI assistants making feature changes or fixes to this codebase. Following these guidelines will ensure minimal technical debt, clean architecture, and scalable solutions.

## 🎯 Core Principles

### 1. **Understand Before Modifying**
- Always read and understand existing code patterns before making changes
- Use search tools (Grep, Glob, Task) to find similar implementations
- Check for existing utilities, components, or APIs before creating new ones
- Review related files to understand the full context

### 2. **Maintain Consistency**
- Follow existing code style and conventions religiously
- Use the same libraries and frameworks already in the project
- Match naming conventions for files, functions, and variables
- Preserve existing architectural patterns

### 3. **Security First**
- Never expose sensitive data in client-side code
- Always validate and sanitize user inputs
- Use proper authentication and authorization checks
- Never commit secrets, API keys, or credentials
- Follow the principle of least privilege for database queries

## 📁 Project Structure & Architecture

### Directory Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes (RESTful endpoints)
│   ├── admin/          # Admin panel pages
│   └── (public)/       # Public-facing pages
├── components/         # Reusable React components
│   └── ui/            # UI-specific components
├── lib/               # Utility functions and configurations
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── styles/            # Global styles and Tailwind config
```

### Key Architectural Decisions
1. **Next.js App Router** - Use server/client components appropriately
2. **Prisma ORM** - All database operations go through Prisma
3. **NextAuth.js** - Authentication and session management
4. **TypeScript** - Strict typing for all new code
5. **Tailwind CSS** - Utility-first CSS (avoid inline styles)

## 🛠️ Development Guidelines

### 1. **Database Operations**
```typescript
// ❌ BAD - Fetching all columns
const users = await prisma.user.findMany();

// ✅ GOOD - Select only needed columns
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
});
```

### 2. **API Routes**
- Always check authentication first
- Return consistent error responses
- Use proper HTTP status codes
- Implement request validation

```typescript
// Example API route structure
export async function POST(request: Request) {
  // 1. Authentication check
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate request body
  const body = await request.json();
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Missing required field' }, { status: 400 });
  }

  // 3. Perform operation with error handling
  try {
    const result = await performOperation(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Operation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. **Component Development**
```typescript
// ✅ GOOD - Typed, documented, reusable component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  // Implementation
};
```

### 4. **State Management**
- Use React hooks for local state
- Use URL parameters for shareable state
- Consider Zustand for complex client-side state
- Server state should be managed through React Query or SWR

### 5. **Error Handling**
```typescript
// Always handle errors gracefully
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  setError(error instanceof Error ? error.message : 'An error occurred');
  // Show user-friendly error message
}
```

## 📋 Pre-Development Checklist

Before starting any feature:

- [ ] Search for similar existing functionality
- [ ] Check if required utilities/components already exist
- [ ] Review the database schema for related tables
- [ ] Understand the authentication/authorization requirements
- [ ] Plan the implementation to follow existing patterns

## 🚀 Best Practices

### 1. **Performance**
- Implement pagination for large datasets
- Use proper database indexes
- Optimize images and assets
- Implement lazy loading where appropriate
- Minimize client-side JavaScript bundles

### 2. **Code Quality**
- Write self-documenting code (clear variable/function names)
- Add TypeScript types for all parameters and returns
- Keep functions small and focused (single responsibility)
- Extract reusable logic into utilities or hooks
- Avoid deeply nested code

### 3. **Testing Approach**
- Test critical business logic
- Ensure API endpoints handle edge cases
- Validate form inputs thoroughly
- Test error states and loading states

### 4. **UI/UX Consistency**
- Use existing UI components from `src/components/ui/`
- Follow the established color scheme (brand colors)
- Maintain consistent spacing (use Tailwind classes)
- Keep interactions predictable and intuitive
- Provide loading states and error feedback

## 🚫 Common Pitfalls to Avoid

1. **Don't create new files unnecessarily** - Check if functionality can be added to existing files
2. **Don't bypass authentication** - Always verify user permissions
3. **Don't use inline styles** - Use Tailwind classes instead
4. **Don't fetch all data** - Always paginate and select specific fields
5. **Don't ignore TypeScript errors** - Fix them properly
6. **Don't create duplicate utilities** - Search first, create second
7. **Don't hardcode values** - Use environment variables or constants
8. **Don't skip error handling** - Always handle potential failures

## 🔄 Git Workflow

### Commit Messages
```bash
# Format: <type>: <description>
feat: Add user profile management
fix: Resolve pagination issue in leaderboard
refactor: Optimize database queries for analytics
docs: Update API documentation
```

### Before Committing
1. Run linters: `npm run lint`
2. Check TypeScript: `npm run typecheck`
3. Test your changes thoroughly
4. Review your own code for consistency
5. Ensure no console.logs or debug code remains

## 📊 Database Guidelines

### Query Optimization
```typescript
// ❌ BAD - N+1 query problem
const profiles = await prisma.jobProfile.findMany();
for (const profile of profiles) {
  const tests = await prisma.test.findMany({ where: { profileId: profile.id } });
}

// ✅ GOOD - Single query with includes
const profiles = await prisma.jobProfile.findMany({
  include: {
    tests: {
      select: {
        id: true,
        title: true
      }
    }
  }
});
```

### Transactions
Use transactions for operations that must succeed or fail together:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const profile = await tx.profile.create({ data: { ...profileData, userId: user.id } });
  return { user, profile };
});
```

## 🔒 Security Checklist

- [ ] Validate all user inputs
- [ ] Check permissions for every operation
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Sanitize data before displaying
- [ ] Implement rate limiting for APIs
- [ ] Log security-relevant events
- [ ] Never trust client-side data

## 📝 Documentation

When adding new features:
1. Update relevant README files
2. Add JSDoc comments for complex functions
3. Document API endpoints with expected inputs/outputs
4. Update type definitions
5. Add inline comments for non-obvious logic

## 🎨 UI Development Guidelines

### Component Structure
```typescript
// Follow this structure for new components
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Derived state
  const derivedValue = useMemo(() => computeValue(state), [state]);
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 4. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 5. Render
  return (
    <div className="consistent-tailwind-classes">
      {/* Component JSX */}
    </div>
  );
};
```

### Responsive Design
- Design desktop-first (primary use case)
- Use Tailwind responsive modifiers sparingly
- Test on common screen sizes
- Ensure tables are scrollable on smaller screens

## 🚨 Emergency Procedures

If you encounter:
1. **Database migration issues** - Never modify migrations, create new ones
2. **Authentication problems** - Check NextAuth configuration first
3. **Performance issues** - Profile before optimizing
4. **Security vulnerabilities** - Report immediately, don't attempt fixes without review

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Remember**: Good code is code that humans can understand. Write for the next developer (or AI) who will work on this codebase.