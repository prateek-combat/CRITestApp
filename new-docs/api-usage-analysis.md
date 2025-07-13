# API Usage Analysis

## API Endpoints Used in Frontend

### Static Endpoints:
1. `/api/admin/analytics/overview`
2. `/api/admin/category-weights`
3. `/api/admin/compare`
4. `/api/admin/job-profiles`
5. `/api/admin/job-profiles/invitations`
6. `/api/admin/positions`
7. `/api/admin/public-links`
8. `/api/admin/users`
9. `/api/analytics?range=30d`
10. `/api/invitations`
11. `/api/invitations/combined`
12. `/api/personality-dimensions`
13. `/api/proctor/event`
14. `/api/proctor/upload-frames`
15. `/api/public-test-links`
16. `/api/questions`
17. `/api/questions/import`
18. `/api/test-attempts`
19. `/api/test-login`
20. `/api/tests`
21. `/api/tests/archived`

### Dynamic Endpoints:
1. `/api/admin/category-weights/${profileId}`
2. `/api/admin/job-profiles/${profile.id}`
3. `/api/admin/leaderboard?${params}`
4. `/api/admin/positions/${position.id}`
5. `/api/admin/preview?token=${token}`
6. `/api/admin/public-links/${linkId}`
7. `/api/admin/users/${userId}`
8. `/api/invitations/${id}`
9. `/api/invitations/${invitationId}`
10. `/api/public-test/${id}`
11. `/api/public-test/${token}`
12. `/api/public-test/${token}/start`
13. `/api/public-test-attempts/${invitationId}`
14. `/api/questions/${editingQuestion.id}`
15. `/api/questions/${questionId}`
16. `/api/test-attempts/${attemptId}`
17. `/api/tests/${id}`
18. `/api/tests/${id}/archive`
19. `/api/tests/${testId}`
20. `/api/tests/${testId}/archive`
21. `/api/tests/${testId}/notifications`
22. `/api/tests/${testId}/restore`

## Potentially Unused API Routes

Based on the analysis, the following API routes appear to be unused in the frontend:

### Admin Routes:
1. `/api/admin/analytics/personality/route.ts` - No frontend usage found
2. `/api/admin/analytics/personality/export/route.ts` - No frontend usage found
3. `/api/admin/analytics/test-attempts/route.ts` - No frontend usage found
4. `/api/admin/analytics/position/[id]/route.ts` - No frontend usage found
5. `/api/admin/category-weights/[id]/set-default/route.ts` - No frontend usage found
6. `/api/admin/job-profiles/invitations/[id]/route.ts` - No frontend usage found (only base route used)
7. `/api/admin/position-leaderboard/route.ts` - No frontend usage found
8. `/api/admin/preview/route.ts` - Used with query params but base route might be unused
9. `/api/admin/proctor/events/route.ts` - No frontend usage found
10. `/api/admin/proctor/stream/[assetId]/route.ts` - No frontend usage found
11. `/api/admin/proctor/download/[assetId]/route.ts` - No frontend usage found
12. `/api/admin/proctor/analysis/[attemptId]/route.ts` - No frontend usage found
13. `/api/admin/proctor/trigger-analysis/[attemptId]/route.ts` - No frontend usage found
14. `/api/admin/queue-status/route.ts` - No frontend usage found
15. `/api/admin/test-analysis/[attemptId]/route.ts` - No frontend usage found
16. `/api/admin/test-attempts/[id]/route.ts` - No frontend usage found
17. `/api/admin/tests/[id]/preview/route.ts` - No frontend usage found

### Other Routes:
1. `/api/health/route.ts` - No frontend usage found (might be used for health checks)
2. `/api/debug/route.ts` - No frontend usage found (might be for debugging)
3. `/api/files/[id]/route.ts` - No frontend usage found
4. `/api/images/upload/route.ts` - No frontend usage found
5. `/api/invitations/send-reminders/route.ts` - No frontend usage found
6. `/api/invitations/[id]/attempt/route.ts` - No frontend usage found
7. `/api/personality-dimensions/[id]/route.ts` - No frontend usage found (only base route used)
8. `/api/proctoring/log-activity/route.ts` - No frontend usage found
9. `/api/proctor/upload/route.ts` - No frontend usage found (upload-frames is used instead)
10. `/api/public-test-attempts/[id]/progress/route.ts` - No frontend usage found
11. `/api/public-test-attempts/[id]/permissions/route.ts` - No frontend usage found
12. `/api/public-test-links/admin/[id]/route.ts` - No frontend usage found
13. `/api/public-test-links/[linkToken]/check-email/route.ts` - No frontend usage found
14. `/api/questions/template/route.ts` - No frontend usage found
15. `/api/questions/[id]/route.ts` - Dynamic endpoints found but direct [id] route might be for DELETE/PUT
16. `/api/recordings/[filename]/route.ts` - No frontend usage found
17. `/api/recordings/database/[assetId]/route.ts` - No frontend usage found
18. `/api/test-attempts/[id]/progress/route.ts` - No frontend usage found
19. `/api/test-attempts/[id]/permissions/route.ts` - No frontend usage found
20. `/api/tests/[id]/personality-analysis/route.ts` - No frontend usage found
21. `/api/upload-recording/route.ts` - No frontend usage found
22. `/api/users/route.ts` - No frontend usage found (admin/users is used instead)

## Notes:
- Some routes might be used by external services or webhooks
- Health and debug endpoints are typically not called from frontend
- Some routes might be used in server-side code or API-to-API calls
- Auth routes (/api/auth/[...nextauth]) are handled by NextAuth.js
- Some dynamic routes might be used for DELETE/PUT operations even if not explicitly found