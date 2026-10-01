# ADR 0057 — Platform-admin manual withdrawal processing

- Status: Accepted and implemented (KEL-144)
- Date: 2026-10-02

## Context

KEL-143 left tenant withdrawals in `requested` with held balance and no processing path: the `processing` state was a reserved future transition and the docs stated "No platform-admin processing or automatic disbursement exists in this slice". Tenants could request and cancel, but no actor could record an off-chain manual transfer or a rejection. A signed platform JWT alone is not sufficient after an assignment is revoked, and two admins (or an admin racing a tenant cancel) must not both win the same request.

## Decision

Billing owns three platform routes behind live platform authorization; the gateway exposes them as protected proxies without making a balance decision.

- Identity serves `tenant.PlatformAdminService/CheckActive` on `:50051` (`internal/delivery/grpc/platform_admin_service.go`, registered in `cmd/server/main.go`). It parses `user_id` plus `platform_factor_version` from a `structpb.Struct`, answers `{allowed: false}` for malformed input, delegates to `usecase.PlatformAuth.CheckVersion` for the live assignment/factor verdict, and returns `Unavailable` only for store errors so callers fail closed.
- Billing middleware `RequireActivePlatform` (`internal/delivery/http/middleware/platform_admin.go`) requires the signed `is_platform_admin` claim plus a usable user id and positive factor version, then calls `PlatformAdminClient.CheckActive` on every request. Invalid claims are 403; an identity outage is 503 with no data.
- Billing mounts `GET /api/v1/platform/withdrawals`, `POST /api/v1/platform/withdrawals/:id/paid`, `POST /api/v1/platform/withdrawals/:id/reject` (`cmd/server/routes.go`) behind JWT plus that middleware. The client (`pkg/identity/platform_admin_client.go`) bounds each check with `IDENTITY_PERMISSION_TIMEOUT_MS`.
- The queue lists only `requested` rows oldest-first with `page`/`page_size` (max 100), returning the frozen full payout destination to admins; tenant reads stay masked.
- A decision runs in one transaction: lock the tenant wallet row first (same lock order as tenant cancel), then conditionally claim `requested` → `paid`/`rejected` with `decided_by`, `decided_at`, and `transfer_reference` (paid) or `reject_reason` (rejected). Paid consumes the held balance and writes a positive `withdrawal_release` plus a negative `withdrawal_paid` ledger entry; rejected returns the hold to available with one positive `withdrawal_release`. A lost claim is 409; a duplicate transfer reference rolls the whole decision back to 409 via the partial unique index `uq_withdrawals_transfer_reference`; unknown ids are 404.
- Migration `20261002010000_manual_withdrawal_decisions` adds `decided_by`, `decided_at`, `transfer_reference`, `reject_reason` with `IF NOT EXISTS` plus the unique reference index and a `requested` queue index. Historical rows keep null decision fields. Deploy the migration before the new billing binary; the down migration drops the added columns/indexes and would discard decision evidence.
- Gateway proxies the three routes in the protected group with `RequirePlatform()` before the tenant-only middleware (`internal/delivery/http/router.go`); billing rechecks the live assignment, so gateway authentication alone never authorizes a payout.

## Consequences and limits

The wallet row serializes admin decisions, tenant cancels, and payment credits. One winner per withdrawal is enforced by the conditional claim under that lock, not by a status unique index; future writers must keep the same lock/claim order. Transfer references are globally unique when present; a reused reference is 409 even across tenants, which is intentional for external traceability. Disbursement itself stays manual and off-chain: `paid` records that money moved, it does not move money. The plaintext/unauthenticated gRPC listener is reused, so network restriction remains essential. PostgreSQL decision tests need a test database and skip in CI without it.

## Evidence

Identity `internal/delivery/grpc/platform_admin_service.go`, `cmd/server/main.go`; tests `internal/delivery/grpc/platform_admin_service_test.go` (`TestPlatformAdminServiceLiveAssignment`). Billing `internal/usecase/platform_withdrawal.go`, `internal/repository/withdrawal_repository.go` (`ListRequested`, `ClaimDecision`), `internal/delivery/http/handler/platform_withdrawal_handler.go`, `internal/delivery/http/middleware/platform_admin.go`, `pkg/identity/platform_admin_client.go`, `cmd/server/routes.go`, `migrations/20261002010000_manual_withdrawal_decisions.{up,down}.sql`; tests `internal/repository/kel144_withdrawal_postgres_test.go`, `pkg/identity/platform_admin_client_test.go`, `cmd/server/platform_routes_test.go`. Gateway `internal/delivery/http/router.go`, `router_test.go`. Identity [PR #37](https://github.com/kelolakelas/kelolakelas-identity-service/pull/37), squash `9ee07d3b17c508ce30c2a2ea3a5dc946706cbf2c`; billing [PR #30](https://github.com/kelolakelas/kelolakelas-billing-service/pull/30), squash `fcfd003c782bf15fc1830050085301508bc69f8c`; gateway [PR #35](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/35), squash `d269d9b93c365c21c97ddae315785be963c67ee7`.
