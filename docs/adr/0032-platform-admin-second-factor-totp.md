# ADR 0032: Platform admin second factor (TOTP)

Date: 2026-09-26 (implemented in KEL-105)

## Status

Accepted. Supersedes the second-factor portion of [ADR 0026](0026-platform-admin-assignment-and-principal.md)'s "follow-up MFA" posture; the assignment/principal design itself is unchanged. The implementation also carries an in-repo decision record (`kelolakelas-identity-service/ADR-KEL-105.md`) written at implementation time; this page is the canonical docs copy.

## Context

KEL-93 gave platform admins an assignment principal, but `POST /api/v1/platform/auth/login` issued a privileged, tenantless `is_platform_admin` JWT directly after a password check. The platform control plane decides Creator grants (KEL-95), tenant-registration policy (KEL-97), and configuration records (KEL-96), so a compromised password yields control-plane access until revocation. `08-known-gaps-and-risks.md` carried this as a High residual risk.

## Decision

- **Factor: RFC 6238 TOTP** (SHA-1, six digits, 30-second interval, ±1 step window), not an external MFA provider. One testable method, no multi-provider framework, no remembered-device bypass, no SMS/email factor.
- **Pending stage:** a correct platform password now returns a five-minute pending JWT (`platform_pending` claim, bound to the assignment's current factor version). It is not a platform principal: identity middleware, the gateway, and the internal session checker all reject it (401) before any protected handler.
- **Challenges:** `POST /api/v1/platform/auth/challenge` (purpose `enroll`|`verify`) and `/platform/auth/verify`. Each challenge is a random 256-bit token shown once to the browser; only its SHA-256 hash is stored. Challenges are bound to user, purpose, and factor version, expire in five minutes, allow five attempts, and are consumed inside one transaction that locks the assignment and challenge rows (`SELECT ... FOR UPDATE`), so two concurrent verifications cannot both accept. Failure paths answer 401 without a session; verifier or storage failure answers 503 and never falls back to password-only.
- **Seed storage:** TOTP seeds are encrypted with AES-256-GCM under a dedicated 32-byte hex key `PLATFORM_FACTOR_KEY` (separate from `JWT_SECRET`). Identity refuses to start without a valid key. Migration `000008_platform_factor` adds the factor columns and the challenge table; existing assignments remain unenrolled (`enrollment_allowed = false`) after migration.
- **Versioned sessions:** successful enrollment or verification issues a verified tenantless JWT carrying `platform_factor_version`. Identity re-checks live assignment and version on every platform request (`/platform/me`, middleware, session checker); a version mismatch or revoked assignment denies access. Legacy versionless platform JWTs (pre-KEL-105) and pending JWTs are rejected everywhere.
- **Recovery is operator-only:** `go run ./cmd/platform-admin -user-id <uuid>` now also clears old factor material and challenges, re-enables one enrollment, and increments `factor_version`, invalidating every old platform/pending JWT. There is no public, password-only recovery path. Audit (actor/change ticket) stays at the operations boundary; application logs record only user IDs, never seeds, codes, or challenge tokens.
- **Browser flow:** web `/platform/login` → `/platform/challenge` → `/platform` stores pending/challenge material only in short-lived HttpOnly cookies scoped to `/platform`; the session `auth_token` cookie is set only after a 200 verify response, and `/platform` re-validates through the gateway on every request, failing closed when the gateway is unavailable.

## Consequences

- Deployment order is mandatory: run migration `000008` and provision `PLATFORM_FACTOR_KEY` before identity, then gateway, then web. Old platform sessions are invalidated rather than grandfathered; every existing admin needs an operator recovery step before their next platform login (intentional fail-closed posture).
- Losing `PLATFORM_FACTOR_KEY` locks enrollment/verification out (fail-closed 503) and requires operator recovery for every admin; the key must be retained across replicas and restarts and never logged or backed up beside the encrypted rows.
- Key/algorithm rotation is not automated: rotating the factor key or migrating off TOTP requires a planned re-enrollment of every platform administrator.
- Tenant and parent logins deliberately keep single-factor authentication (out of scope for KEL-105).

## Evidence

Identity PR #19 (squash `5ca2ddb1aee4946143e8ecacd5c18e4648bb9ed9`), gateway PR #19 (squash `bdbdee308c8c9dda722782d4c871b31876e4f9d7`), web PR #28 (squash `c259903f4e94deeb368b7e5bd3e75033eb019fcd`); `kelolakelas-identity-service/internal/{usecase/platform_factor.go,repository/platform_factor.go,migrations/000008_platform_factor.*.sql}`, `cmd/platform-admin/main.go`; concurrency and replay tests including a Postgres integration test (`TestPlatformFactorPostgresSingleUseAndRecovery`).
