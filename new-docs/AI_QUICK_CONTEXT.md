# Quick AI Context for CRITestApp

## For minor fixes/changes, use this shortened prompt:

---

You're working on CRITestApp (Next.js 15 App Router, TypeScript, Prisma, Tailwind). 

**MUST DO:**
1. Read files before editing: `Read tool first, Edit tool second`
2. Search for similar code before creating new files
3. Check auth with `const session = await auth()` in API routes
4. Use Prisma for all database operations with `select` for specific fields
5. Use Tailwind classes only (no inline styles)
6. Follow existing patterns exactly

**KEY INFO:**
- App Router in `/app` (NOT Pages Router)
- Auth roles: USER, ADMIN, SUPER_ADMIN
- UI components in `/components/ui/`
- Test attempts have two tables: TestAttempt and PublicTestAttempt

**BEFORE COMMITTING:**
- Run: `npm run lint && npm run typecheck`
- No console.log, no `any` types
- Check `AI_DEVELOPMENT_GUIDE.md` if unsure

Task: [Your task description here]

---