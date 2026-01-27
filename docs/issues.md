# Architecture Hardening — Issues (Completed)

All items below were resolved as part of the architecture hardening implementation.

## Resolved

1. **Timing-safe worker auth** — `src/lib/worker-auth.ts` now uses `crypto.timingSafeEqual` and fail-closed 503 behavior when unconfigured.
2. **CSRF handling for internal queue** — `/api/internal/queue/*` is explicitly allowed in middleware and uses worker token auth.
3. **Server-side external fetch** — AI service calls use plain `fetch` in `src/app/api/admin/proctor/trigger-analysis/[attemptId]/route.ts`.
4. **Unified admin auth** — Admin APIs use `requireAdmin` helper for consistent 401/403 handling.
5. **Worker endpoint rate limiting** — Internal queue endpoints are rate limited.
6. **CSRF cookie comment** — Documented why `httpOnly: false` is required for double-submit.
7. **Queue complete validation** — `result` payload validated when provided.
8. **Secure CSRF generation** — Server-side fallback uses `crypto.randomBytes`.
9. **Env validation behavior** — Partial worker config throws in production.
10. **Security tests expanded** — Added CSRF validation + admin auth + worker token edge cases.
11. **Security boundary docs** — Added to `docs/technical/ARCHITECTURE.md`.
