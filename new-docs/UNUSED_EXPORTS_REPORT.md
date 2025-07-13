# Unused Exports Analysis Report

## Summary

- **Total exports found**: 373
- **Exports used by other files**: 74
- **Exports used only internally**: 84
- **Truly unused exports**: 65 (safe to remove)

## Unused Exports by Category

### 1. Debug Utilities (`app/api/debug-utils.ts`)
These debug functions appear to be unused:
- `debugAuth`
- `debugLogin`
- `debugNextAuth`
- `debugClient`
- `debugServer`
- `debugError`

### 2. Skeleton Components (`components/LoadingSkeleton.tsx`)
Several skeleton components are exported but never imported:
- `ListSkeleton`
- `FormSkeleton`
- `PageSkeleton`
- `NavigationSkeleton`
- `FilterSkeleton`

### 3. UI Components
- `components/ui/dropdown/Dropdown.tsx`: `Dropdown`
- `components/ui/dropdown/DropdownItem.tsx`: `DropdownItem`

### 4. Authentication Utilities (`lib/auth-middleware.ts`)
Some auth helper functions are unused:
- `requireSuperAdminAuth`
- `getCurrentSession`
- `hasRole`
- `isAdmin`

### 5. Configuration and Constants (`lib/constants.ts`)
Many constants are exported but never used:
- `DEFAULT_PORT`
- `TEST_DATABASE_URL`
- `EMAIL_FROM`
- `DEFAULT_QUESTION_TIMER`
- `MAX_FILE_UPLOAD_SIZE`
- `DEFAULT_PAGE_SIZE`
- `MAX_PAGE_SIZE`
- `SESSION_TIMEOUT`
- `API_RATE_LIMIT`

### 6. Email Templates (`lib/email-templates.ts`)
All email template functions appear unused:
- `invitationEmailTemplate`
- `testCompletionAdminTemplate`
- `testCompletionCandidateTemplate`
- `reminderEmailTemplate`
- `genericEmailTemplate`

### 7. Utility Functions
- `lib/validation-utils.ts`:
  - `parseMultipleEmails`
  - `validateRequiredFields`
  - `sanitizeText`
  - `validateUrl`
  - `safePercentage`
  - `formatDuration`
  - `debounce`
  - `generateRandomString`
- `lib/logger.ts`: `testLogger`
- `lib/logging-middleware.ts`:
  - `loggedApiHandler`
  - `withDbLogging`

### 8. Rate Limiting (`lib/rate-limit.ts`)
- `getClientIdentifier`
- `getRateLimitRule`
- `checkRateLimit`
- `createRateLimitResponse`

### 9. Category Types (`types/categories.ts`)
- `getCategoryDisplayName`
- `ALL_CATEGORIES`
- `isCoreCategory`
- `getDefaultWeights`
- `isCommonCategory`
- `DEFAULT_CATEGORIES_LEGACY`

### 10. Other Notable Unused Exports
- `middleware.ts`: `config` (Next.js middleware config)
- `app/layout.tsx`: `metadata` (Next.js metadata export)
- `lib/auth.ts`: `getAuthConfig`
- `lib/risk-calculator.ts`: `RiskCalculator`
- `lib/scoring/scoringEngine.ts`: `calculateObjectiveTestScore`
- `utils/pdfReportGenerator.ts`: `generatePDFReport`

## Recommendations

1. **Debug Utilities**: If these are only used during development, consider moving them to a separate development-only file or removing them if no longer needed.

2. **Skeleton Components**: These loading skeletons seem to be defined but not used. Either implement them in the UI or remove them.

3. **Constants**: Review which constants are actually needed and remove the unused ones. Some might be intended for future use.

4. **Email Templates**: These might be used dynamically or planned for future implementation. Verify if they're needed before removal.

5. **Utility Functions**: Many validation and utility functions are defined but unused. Consider creating a streamlined utils file with only the functions actually in use.

## Action Items

Before removing any exports, consider:
1. Whether they might be used in configuration files
2. Whether they're part of a public API
3. Whether they're used in tests (check test files)
4. Whether they're planned for future features

## Safe to Remove

Based on the analysis, the following exports appear to be safely removable:
- All debug functions in `debug-utils.ts`
- Unused skeleton components
- Unused dropdown components
- Most unused utility functions
- Unused email templates (after verification)

Total potential code reduction: ~65 unused exports