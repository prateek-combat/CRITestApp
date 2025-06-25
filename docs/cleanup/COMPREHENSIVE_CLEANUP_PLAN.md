# Comprehensive Codebase Cleanup Plan

## Executive Summary

After thorough analysis of the entire codebase, I've identified significant opportunities for cleanup:
- **42 unused API endpoints** (51% of all endpoints)
- **65 unused exports** across components and utilities
- **37 unused TypeScript types** (71% of all types)
- **191 unused database columns** (90.5% of all columns)
- **99 files with console.log statements** needing proper logging

## 1. Database Cleanup

### Current State
- 20 tables defined, all are used
- 211 columns defined, only 20 are actively queried (9.5% utilization)
- Heavy reliance on implicit full-record fetches

### Action Items

#### High Priority
1. **Add explicit column selection to Prisma queries**
   ```typescript
   // Instead of: prisma.user.findMany()
   // Use: prisma.user.findMany({ select: { id: true, email: true, role: true } })
   ```

2. **Review and remove unused columns** (after verifying frontend usage):
   - Audit columns in rarely-used tables (categoryWeightProfile, personalityDimension)
   - Check if proctoring columns are needed for all test attempts

#### Medium Priority
3. **Optimize database indexes** based on actual query patterns
4. **Document which columns are essential vs optional**

## 2. API Routes Cleanup

### Unused Endpoints to Remove (42 total)

#### Authentication & Setup (6 routes) - **Remove Immediately**
```
/api/auth/setup
/api/custom-login
/api/setup-admin
/api/oauth-test
/api/auth-debug
/api/test-email
```

#### Proctor/Recording System (11 routes) - **Review Before Removal**
```
/api/proctoring/log-activity
/api/admin/proctor/events
/api/admin/proctor/analysis/[attemptId]
/api/admin/proctor/download/[assetId]
/api/admin/proctor/stream/[assetId]
/api/admin/proctor/trigger-analysis/[attemptId]
/api/recordings/[filename]
/api/recordings/database/[assetId]
/api/upload-recording
/api/admin/queue-status
/api/admin/test-analysis/[attemptId]
```

#### Analytics Endpoints (5 routes) - **Remove if Unused**
```
/api/admin/analytics/personality
/api/admin/analytics/personality/export
/api/admin/analytics/position/[id]
/api/admin/analytics/test-attempts
/api/admin/position-leaderboard
```

## 3. Code Cleanup

### Unused Exports (65 total)

#### Files to Remove Entirely
1. **`src/app/api/debug-utils.ts`** - All 6 debug functions are unused
2. **`src/types/personality-api.ts`** - All 18 interfaces are unused

#### Components to Remove
1. **Skeleton Components** (`src/components/LoadingSkeleton.tsx`):
   - ListSkeleton, FormSkeleton, PageSkeleton, NavigationSkeleton, FilterSkeleton

2. **UI Components**:
   - `src/components/ui/dropdown/Dropdown.tsx`
   - `src/components/ui/dropdown/DropdownItem.tsx`

#### Functions to Remove
1. **Email Templates** (`src/lib/email-templates.ts`) - All 5 templates unused
2. **Rate Limiting** (`src/lib/rate-limit.ts`) - All 4 functions unused
3. **Validation Utils** - 8 unused functions in `validation-utils.ts`
4. **Auth Middleware** - 4 unused functions in `auth-middleware.ts`

### Unused Types (37 total)

#### Remove These Type Files
1. **`src/types/personality-api.ts`** - Entire file (18 types)
2. **Legacy types in `src/types/categories.ts`**:
   - CommonCategory, QuestionCategoryLegacy

#### Clean Up These Types
1. **Logging types** - LogContext, LoggerConfig, LogLevel
2. **Scoring types** - CombinedScoringResult, EnhancedQuestion, ObjectiveResult
3. **Auth types** - AuthenticatedUser

## 4. Additional Cleanup

### Console.log Statements (99 files)
Replace all console.log statements with proper logging using the logger utility:
```typescript
// Instead of: console.log('User created:', user)
// Use: logger.info('User created', { userId: user.id })
```

### Commented Code
Remove large commented code block in:
- `/src/app/api/admin/proctor/trigger-analysis/[attemptId]/route.ts` (100+ lines)

### Dependencies to Remove
```bash
# Remove unused production dependencies (18 packages)
npm uninstall @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction \
  @fullcalendar/react @fullcalendar/timegrid @google-cloud/vision \
  @next-auth/prisma-adapter @types/multer classnames eslint-config-next \
  highlight.js multer network-speed pg recordrtc rehype-highlight \
  rehype-raw tailwind-merge

# Remove unused dev dependencies (9 packages)
npm uninstall -D @testing-library/user-event @types/jest @types/recordrtc \
  autoprefixer jest-environment-jsdom postcss prettier \
  prettier-plugin-tailwindcss ts-node
```

## 5. Implementation Strategy

### Phase 1: Quick Wins (1-2 days)
1. Remove unused dependencies
2. Delete unused type files and debug utilities
3. Remove unused API routes in auth/setup category
4. Fix ESLint errors

### Phase 2: Code Cleanup (3-4 days)
1. Remove unused components and exports
2. Clean up unused utility functions
3. Replace console.log statements
4. Remove commented code blocks

### Phase 3: Database Optimization (1 week)
1. Add explicit column selection to queries
2. Review and document column usage
3. Consider schema optimization

### Phase 4: API Consolidation (1 week)
1. Remove remaining unused endpoints
2. Consolidate similar endpoints
3. Document API surface

## 6. Expected Impact

### Code Reduction
- **~500+ lines** of unused TypeScript types
- **~1000+ lines** of unused functions and components
- **~2000+ lines** of unused API route code
- **27 npm packages** removed

### Performance Improvements
- Smaller bundle size from removed dependencies
- Faster database queries with explicit column selection
- Reduced API surface area

### Maintenance Benefits
- Clearer codebase with less dead code
- Easier to understand actual vs planned features
- Reduced cognitive load for developers

## 7. Verification Steps

Before removing any code:
1. Run full test suite
2. Check for dynamic imports
3. Verify no external services use removed endpoints
4. Test in staging environment
5. Keep backups of removed code for 1 sprint

## 8. Next Steps

1. Review this plan with the team
2. Prioritize which phases to implement first
3. Create tickets for each cleanup task
4. Set up monitoring to prevent future dead code accumulation