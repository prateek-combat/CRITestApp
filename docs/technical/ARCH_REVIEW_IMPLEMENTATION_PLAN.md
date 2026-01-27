# Architecture Review Implementation Plan

## Context
This plan addresses the architectural review findings to strengthen boundary enforcement, reduce coupling, and improve long-term maintainability while keeping the current monolithic Next.js + worker shape intact.

## Goals
- Enforce consistent auth/security boundaries across API routes.
- Standardize Prisma connection lifecycle behavior.
- Eliminate duplicated/probably divergent risk scoring logic.
- Formalize worker boundaries and reduce schema coupling.
- Clarify module boundaries to align with layered architecture.

## Scope
- API routes in `src/app/api/**`
- Shared libraries in `src/lib/**`
- Proctoring worker in `workers/proctor/**`
- Documentation updates in `docs/technical/**`

## Non-Goals (for now)
- Full service decomposition or microservices split
- Replacing NextAuth or Prisma
- Redesigning the proctoring data model

## Architectural Findings (Summary)
- Admin boundary is inconsistent in core write paths (e.g., test creation).
- Prisma lifecycle is inconsistent across routes.
- Risk scoring is duplicated (TS + Python) with different weights/thresholds.
- Worker is tightly coupled to DB queue tables via raw SQL.
- Security helpers exist but are not consistently applied.

## Implementation Plan

### Phase 0: Preparation (Docs + Baseline)
- Add this plan document and keep it updated as changes land.
- Confirm canonical auth pattern for API routes (session-based admin check).
- Capture current risk scoring behavior for comparison (sample event sets + outputs).

### Phase 1: Authorization + Security Consistency
**Objective:** Centralize auth/CSRF/security headers for API routes.

1) **Define canonical route guard**
   - Use a single helper (e.g., `requireAdmin` or `withApiProtection + requireAdmin`).
   - Ensure uniform behavior for 401 vs 403.

2) **Adopt guard in admin write routes**
   - Apply in mutating endpoints (POST/PUT/DELETE).
   - Start with high-risk endpoints (`/api/tests`, `/api/questions`, `/api/invitations`).

3) **Ensure CSRF coverage for non-GET methods**
   - Wrap relevant handlers using `withApiProtection`.

4) **Cleanup unused/stub utilities**
   - Remove or complete `src/lib/auth-middleware.ts`.
   - Document the canonical auth entrypoints.

**Acceptance Criteria**
- All admin write routes enforce admin role checks in code (not just middleware).
- Consistent 401/403 responses for auth failures.
- CSRF protection active for non-GET routes.

### Phase 2: Prisma Lifecycle Standardization
**Objective:** Avoid per-request disconnects and align with singleton usage.

1) **Document Prisma usage contract**
   - Singleton client in `src/lib/prisma.ts`.
   - No per-request `$disconnect()` in API routes.

2) **Remove per-route disconnects**
   - Update routes currently calling `$disconnect()` in `finally` blocks.
   - Validate serverless behavior (no connection leaks in logs).

3) **Add lightweight guidance in docs**
   - Add a short section in `docs/technical/ARCHITECTURE.md` or a new doc.

**Acceptance Criteria**
- No API route calls `prisma.$disconnect()` directly.
- Connection reuse remains stable under local dev and CI.

### Phase 3: Risk Scoring Single Source of Truth
**Objective:** Ensure consistent risk scoring across app and worker.

Option A (Preferred): **Worker-only scoring**
- Remove TS risk scoring or restrict it to display-only calculations.
- Worker produces canonical `riskScore` + breakdown stored in DB.
- UI reads DB fields without recomputing.

Option B: **Shared spec**
- Define a JSON spec for weights/thresholds.
- Load the spec in both TS and Python (with tests to compare outputs).

**Acceptance Criteria**
- A single authoritative scoring algorithm exists.
- Results are consistent across environments and versions.

### Phase 4: Worker Boundary Hardening
**Objective:** Reduce tight coupling to DB internals.

1) **Define worker interface**
   - Either HTTP API for data access or stored procedures/views as explicit contracts.

2) **Encapsulate pg-boss access**
   - Avoid direct updates to `pgboss.job` if possible.
   - Prefer pg-boss API or a server-side job claim endpoint.

3) **Schema compatibility policy**
   - Version the job payload and DB contract.

**Acceptance Criteria**
- Worker uses a stable, versioned contract.
- DB schema changes can be made without worker breakage.

### Phase 5: Module Boundary Cleanup
**Objective:** Clarify layering and dependency direction.

1) **Refactor `src/lib` into coarse layers**
   - `src/lib/domain/**` (domain logic)
   - `src/lib/infra/**` (db, queues, external services)
   - `src/lib/app/**` (use cases)

2) **Enforce import direction**
   - Domain must not import infra.
   - App layer orchestrates domain + infra.

**Acceptance Criteria**
- New folder structure exists with clear README guidance.
- No import cycles or domain->infra dependencies.

## Implementation Status (This Branch)
- ✅ CSRF protection enforced for protected API routes; CSRF cookie issuance centralized in middleware.
- ✅ Client fetch calls updated to include CSRF headers via `fetchWithCSRF`.
- ✅ Admin checks added to core test/question write endpoints.
- ✅ Removed per-request `prisma.$disconnect()` usage.
- ✅ Risk scoring centralized on the worker; app-side persistence removed.
- ✅ Internal queue API added with versioned payloads; worker uses API when configured.
- ✅ Layering guidance added under `src/lib/*` with infra shims.

## Testing Strategy
- Add targeted API tests for auth boundary enforcement.
- Add regression checks for risk scoring (if shared spec is adopted).
- Verify proctor worker still processes jobs after lifecycle changes.

## Rollout Notes
- Deploy Phase 1 and Phase 2 independently with minimal user impact.
- Phase 3 and 4 should be staged behind feature flags or versioned contracts.
