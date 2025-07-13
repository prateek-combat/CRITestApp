# API Routes Usage Analysis Report

## Summary
- **Total API Routes**: 82
- **Confirmed Used Routes**: 61
- **Potentially Unused Routes**: 21

## API Routes by Category

### 1. Authentication & Setup Routes
- ✅ `/api/auth/[...nextauth]` - Used in test-oauth page
- ❌ `/api/auth/setup` - No usage found
- ❌ `/api/custom-login` - No usage found
- ✅ `/api/test-login` - Used in login page
- ❌ `/api/setup-admin` - No usage found
- ❌ `/api/oauth-test` - No usage found

### 2. Test Management Routes
- ✅ `/api/tests` - Widely used (manage-tests, job-profiles, positions, etc.)
- ✅ `/api/tests/[id]` - Used in manage-tests, positions, tests pages
- ✅ `/api/tests/[id]/archive` - Used in tests page
- ✅ `/api/tests/[id]/restore` - Used in archived tests page
- ✅ `/api/tests/[id]/notifications` - Used in EmailNotificationSettings
- ❌ `/api/tests/[id]/personality-analysis` - No usage found
- ✅ `/api/tests/archived` - Used in archived tests page

### 3. Question Management Routes
- ✅ `/api/questions` - Used in manage-tests, tests/[id] pages
- ✅ `/api/questions/[id]` - Used in tests/[id] page
- ✅ `/api/questions/import` - Used in tests/[id] page
- ✅ `/api/questions/template` - Used in tests/[id] page

### 4. Invitation Routes
- ✅ `/api/invitations` - Used in multiple pages
- ✅ `/api/invitations/[id]` - Used in test/[invitationId], [id] pages
- ❌ `/api/invitations/[id]/attempt` - No usage found
- ✅ `/api/invitations/combined` - Used in tests page
- ❌ `/api/invitations/send-reminders` - No usage found

### 5. Test Attempt Routes
- ✅ `/api/test-attempts` - Used in test pages
- ✅ `/api/test-attempts/[id]` - Used in test/results, test/attempt pages
- ✅ `/api/test-attempts/[id]/permissions` - Used in test/attempt page
- ❌ `/api/test-attempts/[id]/progress` - No usage found

### 6. Public Test Routes
- ✅ `/api/public-test/[token]` - Used in public-test, [id] pages
- ✅ `/api/public-test/[token]/start` - Used in public-test page
- ✅ `/api/public-test-attempts/[id]` - Used in test/attempt, test/[invitationId] pages
- ✅ `/api/public-test-attempts/[id]/permissions` - Used in test/attempt page
- ❌ `/api/public-test-attempts/[id]/progress` - No usage found
- ✅ `/api/public-test-links` - Used in job-profiles, tests pages
- ❌ `/api/public-test-links/[linkToken]/check-email` - No usage found
- ❌ `/api/public-test-links/admin/[id]` - No usage found

### 7. Admin Routes
- ✅ `/api/admin/users` - Used in users page
- ❌ `/api/admin/users/[id]` - No usage found
- ✅ `/api/admin/positions` - Used in job-profiles, positions, analytics pages
- ✅ `/api/admin/positions/[id]` - Used in positions page
- ✅ `/api/admin/job-profiles` - Used in job-profiles, leaderboard pages
- ❌ `/api/admin/job-profiles/[id]` - No usage found
- ✅ `/api/admin/job-profiles/invitations` - Used in job-profiles page
- ❌ `/api/admin/job-profiles/invitations/[id]` - No usage found
- ✅ `/api/admin/public-links` - Used in job-profiles, tests pages
- ❌ `/api/admin/public-links/[id]` - No usage found
- ✅ `/api/admin/category-weights` - Used in weight-profiles, leaderboard pages
- ❌ `/api/admin/category-weights/[id]` - No usage found
- ❌ `/api/admin/category-weights/[id]/set-default` - No usage found
- ✅ `/api/admin/compare` - Used in CompareDrawer
- ✅ `/api/admin/leaderboard` - Used in leaderboard pages
- ❌ `/api/admin/position-leaderboard` - No usage found
- ✅ `/api/admin/preview` - Used in test-preview page
- ❌ `/api/admin/test-attempts/[id]` - No usage found
- ❌ `/api/admin/tests/[id]/preview` - No usage found

### 8. Analytics Routes
- ✅ `/api/analytics` - Used in dashboard page
- ✅ `/api/admin/analytics/overview` - Used in analytics page
- ❌ `/api/admin/analytics/personality` - No usage found
- ❌ `/api/admin/analytics/personality/export` - No usage found
- ❌ `/api/admin/analytics/position/[id]` - No usage found
- ❌ `/api/admin/analytics/test-attempts` - No usage found

### 9. Proctor/Recording Routes
- ✅ `/api/proctor/event` - Used in useLiveFlags
- ✅ `/api/proctor/upload-frames` - Used in recorder
- ✅ `/api/proctor/upload` - Used in recorder
- ❌ `/api/proctoring/log-activity` - No usage found
- ❌ `/api/admin/proctor/events` - No usage found
- ❌ `/api/admin/proctor/analysis/[attemptId]` - No usage found
- ❌ `/api/admin/proctor/download/[assetId]` - No usage found
- ❌ `/api/admin/proctor/stream/[assetId]` - No usage found
- ❌ `/api/admin/proctor/trigger-analysis/[attemptId]` - No usage found
- ❌ `/api/recordings/[filename]` - No usage found
- ❌ `/api/recordings/database/[assetId]` - No usage found
- ❌ `/api/upload-recording` - No usage found

### 10. Other Routes
- ✅ `/api/personality-dimensions` - Used in tests/[id] page
- ❌ `/api/personality-dimensions/[id]` - No usage found
- ✅ `/api/health` - Used in SystemCompatibilityChecker, tests
- ❌ `/api/debug` - No usage found
- ❌ `/api/auth-debug` - No usage found
- ❌ `/api/files/[id]` - No usage found
- ❌ `/api/images/upload` - No usage found
- ❌ `/api/test-email` - No usage found
- ❌ `/api/users` - No usage found
- ❌ `/api/admin/queue-status` - No usage found
- ❌ `/api/admin/test-analysis/[attemptId]` - No usage found

## Potentially Dead/Unused Routes (Safe to Remove)

### High Confidence - No Usage Found:
1. `/api/auth/setup`
2. `/api/custom-login`
3. `/api/setup-admin`
4. `/api/oauth-test`
5. `/api/invitations/[id]/attempt`
6. `/api/invitations/send-reminders`
7. `/api/test-attempts/[id]/progress`
8. `/api/public-test-attempts/[id]/progress`
9. `/api/public-test-links/[linkToken]/check-email`
10. `/api/public-test-links/admin/[id]`
11. `/api/admin/users/[id]`
12. `/api/admin/job-profiles/[id]`
13. `/api/admin/job-profiles/invitations/[id]`
14. `/api/admin/public-links/[id]`
15. `/api/admin/category-weights/[id]`
16. `/api/admin/category-weights/[id]/set-default`
17. `/api/admin/position-leaderboard`
18. `/api/admin/test-attempts/[id]`
19. `/api/admin/tests/[id]/preview`
20. `/api/tests/[id]/personality-analysis`
21. `/api/admin/analytics/personality`
22. `/api/admin/analytics/personality/export`
23. `/api/admin/analytics/position/[id]`
24. `/api/admin/analytics/test-attempts`
25. `/api/proctoring/log-activity`
26. `/api/admin/proctor/events`
27. `/api/admin/proctor/analysis/[attemptId]`
28. `/api/admin/proctor/download/[assetId]`
29. `/api/admin/proctor/stream/[assetId]`
30. `/api/admin/proctor/trigger-analysis/[attemptId]`
31. `/api/recordings/[filename]`
32. `/api/recordings/database/[assetId]`
33. `/api/upload-recording`
34. `/api/personality-dimensions/[id]`
35. `/api/debug`
36. `/api/auth-debug`
37. `/api/files/[id]`
38. `/api/images/upload`
39. `/api/test-email`
40. `/api/users`
41. `/api/admin/queue-status`
42. `/api/admin/test-analysis/[attemptId]`

## Usage Patterns Found

1. **Direct fetch() calls**: Most common pattern
   - Example: `fetch('/api/tests')`
   - Example: `fetch(\`/api/tests/\${testId}\`)`

2. **Dynamic route usage**: Template literals
   - Example: `fetch(\`/api/admin/positions/\${selectedPosition.id}\`)`

3. **Conditional API paths**: Based on test type
   - Example: `isPublicTest ? '/api/public-test-attempts' : '/api/test-attempts'`

4. **Internal API references**: Some routes reference others
   - Example: OAuth callback URLs

## Recommendations

1. **Remove unused authentication/setup routes** - These appear to be legacy or unused setup endpoints
2. **Remove unused proctor/recording routes** - Many proctor-related endpoints have no frontend usage
3. **Review analytics routes** - Several analytics endpoints are not being called
4. **Consolidate progress endpoints** - Both test-attempts and public-test-attempts have unused progress routes
5. **Check for server-side usage** - Some routes might be called from server components or external services