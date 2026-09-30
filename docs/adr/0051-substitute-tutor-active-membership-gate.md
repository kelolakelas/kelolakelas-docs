# ADR 0051: Substitute tutor must be an active same-tenant member (and session reads need `schedule:read`)

## Status

Accepted. Implemented in KEL-135: identity PR [#35](https://github.com/kelolakelas/kelolakelas-identity-service/pull/35) (`e094e32fd32e9d950c25dd23efcd52bd03bc5c1d`), academic PR [#42](https://github.com/kelolakelas/kelolakelas-academic-service/pull/42) (`f77f3f9e8d620b723f041c9838230a1c3d3af5bc`).

## Context

KEL-135 closed three authorization gaps in the session/report area that the earlier permission work ([ADR 0002](0002-academic-permission-enforcement.md), [ADR 0019](0019-tenant-scoped-session-and-schedule-mutations.md), [ADR 0034](0034-permission-requires-active-membership.md)) had left open:

1. The session read routes (`GET /api/v1/sessions`, `GET /api/v1/sessions/:id`, `GET /api/v1/sessions/:id/attendees`) required only a valid JWT — any authenticated member of the tenant, regardless of role permissions, could read sessions and attendee lists. Every other session/schedule operation already required `schedule:read`-family permissions.
2. `GET /api/v1/sessions` accepted a client-supplied `tutor_id` filter, so "my sessions" was whatever the client asked for; the tutor identity was not derived from the token.
3. `ChangeTutorTemporary` (substitute tutor) overwrote `tutor_id` with any UUID the caller supplied. A substitute from another tenant, an inactive or removed member, or a random id was accepted silently — no cross-tenant or liveness check existed anywhere in the flow.
4. Report `Update`/`Delete` lacked the `IsTutorForEnrollment` assigned-tutor check that `Create` already enforced, so a tutor unassigned to the enrollment could edit or delete another tutor's report.

## Decision

- **Session reads**: the three read routes use `RequirePermissionForTenantResource(schedule:read)` — the KEL-22 attendance/report pattern. Parent tokens keep their existing skip (ownership, not role; ADR 0002), so no parent path changes.
- **Own-session filter**: with `mine=true`, the handler ignores any client-supplied `tutor_id` and forces `query.TutorID` to the `member_id` from the verified JWT; a tenant caller without a usable member claim gets 401. Without `mine=true`, an explicit `tutor_id` filter still works as before.
- **Substitute tutor — identity side**: new gRPC `tenant.MembershipService/CheckActiveMembership` on the existing `:50051` listener, contract as `structpb.Struct` (`member_id`, `tenant_id`). It answers `{"active": bool}` where `true` requires one `tenant_members` row with exactly that id and tenant, active and not soft-deleted; everything else is `false` with no error, a malformed contract is `InvalidArgument`, and a storage error is `Internal` (so the caller can distinguish "verified not eligible" from "could not verify").
- **Substitute tutor — academic side**: `ChangeTutorTemporary` resolves the session tenant-scoped first (unknown/foreign session → 404, no membership probe, so the endpoint is not a membership oracle), then requires an explicit `active: true` before any write. Not eligible → 400 `ErrSubstituteTutorNotEligible`; identity unreachable, slow, malformed, or the client unwired → 503 `ErrSubstituteTutorUnavailable`. The check is fail-closed: no verdict, no write. The new `pkg/grpcclient/membership_client.go` applies a per-call `IDENTITY_PERMISSION_TIMEOUT_MS` deadline and `ParseActiveMember` accepts only an explicit boolean verdict.
- **Reports**: `Update`/`Delete` take the caller's member id and apply the same `IsTutorForEnrollment` rule as `Create`: unassigned tutor → 403 `ErrReportForbidden` with zero writes; missing member claim → 401.
- The deployment order is identity first, academic second: until academic is updated, the old academic keeps accepting unvalidated substitutes; after academic is updated, an identity without the new method fails the check closed (503), which is the safe direction.

## Alternatives considered

- **Validate through the existing `CheckPermission` contract.** Rejected: it answers "does this role hold a permission", not "is this membership active in this tenant"; a tutor-shaped answer would overload the permission semantics and still need a second lookup for liveness.
- **Validate locally against an academic-side copy of membership data.** Rejected: `tenant_members` lives in identity's database; duplicating it would create a consistency window exactly on a tenant-isolation boundary.
- **Let the identity outage degrade to a warning and proceed.** Rejected: substituting a tutor is a write; failing open on the tenant boundary would let a cross-tenant assignment through precisely when verification is weakest.
- **Fold the report tutor-assignment check into the route permission.** Rejected: the permission answers a role question; assignment is per-enrollment data. Keeping `IsTutorForEnrollment` in the use case preserves the Create-path semantics.

## Consequences

- A substitute tutor must already be an active member of the class's tenant; inviting an external tutor is an identity-level membership concern, not an academic one.
- When identity is unavailable, substitute-tutor changes fail with 503 rather than queuing; the caller retries. Other session operations are unaffected.
- Sessions and attendees are no longer readable by arbitrary authenticated members: a custom role needs `schedule:read` granted explicitly. Creator and Teacher hold it from the seeded catalog, so existing roles are unaffected.
- The membership endpoint is another plaintext `:50051` service on the same trust boundary as `CheckPermission` (see the known gRPC hardening gap); it carries no credentials and answers only a boolean.

## Evidence

Academic: `cmd/server/routes.go`, `internal/delivery/http/handler/{session,schedule,report}_handler.go`, `internal/usecase/{schedule,report}_usecase.go`, `pkg/grpcclient/membership_client.go`; tests `internal/delivery/http/handler/session_mine_filter_test.go`, `internal/usecase/substitute_tutor_membership_test.go`, `internal/usecase/report_permission_test.go`, `pkg/grpcclient/membership_client_test.go`, `cmd/server/attendance_report_routes_test.go`, `cmd/server/swagger_contract_test.go`. Identity: `internal/delivery/grpc/membership_service.go`, `internal/repository/membership_active.go`, tests `internal/delivery/grpc/membership_service_active_test.go`.
