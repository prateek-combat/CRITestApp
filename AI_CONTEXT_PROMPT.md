# AI Context Prompt for CRITestApp

## Copy and paste this prompt before giving any task to an AI assistant:

---

You are about to work on the CRITestApp codebase, a Next.js 15 application for managing technical assessments and job candidate evaluations. Before making any changes, you MUST:

**1. READ THESE CRITICAL DOCUMENTS FIRST:**
- `AI_DEVELOPMENT_GUIDE.md` - Essential development principles and patterns
- `CODE_REVIEW_CHECKLIST.md` - Quality checks before any commit
- `TECHNICAL_DEBT.md` - Known issues to avoid making worse
- `README.md` - Current architecture and setup

**2. UNDERSTAND THE TECH STACK:**
- Next.js 15.3.3 with App Router (not Pages Router)
- TypeScript with strict typing
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Tailwind CSS for styling (no inline styles)
- React 19.0.0

**3. FOLLOW THESE CORE RULES:**
- **Search First, Create Second**: Always search for existing implementations before creating new files
- **Read Before Edit**: Use the Read tool on files before modifying them
- **Preserve Patterns**: Match existing code style and architecture exactly
- **Security First**: Check authentication/authorization for all operations
- **Performance Matters**: Always use database column selection and pagination
- **No Inline Styles**: Use Tailwind classes exclusively
- **TypeScript Strict**: No `any` types, no `@ts-ignore`

**4. CRITICAL WARNINGS:**
- This app uses App Router, NOT Pages Router - components in `app/` directory
- Always check user roles: USER, ADMIN, SUPER_ADMIN
- Database operations must go through Prisma - no raw SQL
- All API routes need authentication checks using `auth()` from '@/lib/auth'
- Never expose sensitive data in client components
- Test attempts have both regular (TestAttempt) and public (PublicTestAttempt) tables

**5. BEFORE STARTING ANY TASK:**
1. Use Grep/Glob to find similar existing functionality
2. Check if required components already exist in `src/components/ui/`
3. Review the database schema in `prisma/schema.prisma`
4. Look for existing API endpoints before creating new ones
5. Check `TECHNICAL_DEBT.md` to avoid known issues

**6. ARCHITECTURE PATTERNS TO FOLLOW:**
- API Routes: `/app/api/[resource]/route.ts` for collections, `/app/api/[resource]/[id]/route.ts` for single items
- Admin Pages: All under `/app/admin/` with role-based protection
- Reusable Components: Place in `/components/` with TypeScript interfaces
- Utilities: Place in `/lib/` directory
- Database queries: Use Prisma with proper select/include optimization

**7. COMMIT STANDARDS:**
- Run `npm run lint` and `npm run typecheck` before committing
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Never commit console.log statements or commented code
- Include the AI signature in commit messages

**Remember**: This is a production codebase. Quality, security, and consistency are paramount. When in doubt, read more code before making changes.

---

## Example Usage:

"I've shared the AI Context Prompt with you. Please read the mentioned documentation files first, then [describe your task here]."