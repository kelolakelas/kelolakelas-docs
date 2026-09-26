# ADR 0034: Permissions are granted only through an active membership with the token's role

Status: Implemented (KEL-76)

## Context

Removing a tenant member soft-deletes its `tenant_members` row, and changing a member's
role updates `tenant_members.role_id`. Identity's permission decisions nevertheless
matched only the token's `role_id` (and, since ADR 0002/0010, its tenant) against
`role_permissions`. Tokens are HS256, valid for 24 hours, and there is no denylist, so a
removed member kept every permission of their role until the token expired, and a demoted
member kept the permissions of the old role. This applied both to identity's own HTTP
routes and to the `tenant.PermissionService/CheckPermission` gRPC answers that academic and
billing rely on.

## Decision

A permission is granted only through a `tenant_members` row that:

- belongs to the tenant being operated on;
- is active (`is_active`) and not soft-deleted (`deleted_at IS NULL`, stated explicitly
  because the lookup uses a raw table name, so GORM's soft-delete scope does not apply);
- currently carries the role in the token (`tm.role_id = token role_id`);
- and whose role belongs to that tenant or is a system role (`roles.tenant_id IS NULL`,
  e.g. Creator, Teacher), preserving the ADR 0010 tenant scope.

One shared query, `repository.ActiveMemberHasPermission`, answers both the HTTP checks and
the gRPC `member_id` path, so the two cannot drift.

**Identity HTTP.** `AuthMiddleware` attaches the verified caller (`domain.Caller{UserID,
MemberID}`) to the request context. All in-process permission checks
(`usecase.callerHasPermission`, used by invitations, tenant settings/location, custom roles
and member update/delete) require that caller's membership. A request context without a
caller, or a query missing tenant, role or user, is denied without a lookup.

**Legacy-token handling.** A token carrying the `member_id` claim is pinned to that exact
row (`tm.id = member_id AND tm.user_id = user`), so a token minted for a removed membership
never authorizes a later re-invitation. A token issued without the claim is matched by
`(tenant, user, role)`: it still loses access when the member is removed, deactivated or
re-roled, but a user deleted and re-invited with the same role regains access with such a
token. This case disappears once every pre-claim token has expired (24 hours).

**gRPC `CheckPermission`.** The request gains an optional `member_id` field. When present
it must be a UUID string (a non-UUID, nil UUID or non-string value is `InvalidArgument`) and
the request must carry `tenant_id` (otherwise `InvalidArgument`, never the unscoped legacy
lookup); `allowed` is then true only for that active membership in that tenant with that
role. An absent field, JSON null or empty string means "not named": the request is answered
by the previous role/tenant-only lookup, unchanged, so academic and billing deployments
that do not send `member_id` keep working.

**Failure handling.** A database error is never an allow: HTTP returns the error to the
existing mapping, gRPC returns `Internal`, and academic/billing already map that to 503.

## Transition: requiring `member_id`

This mirrors the `tenant_id` transition of ADR 0002. The field is additive and an identity
that ignores it is compatible with clients that send it. The planned order:

1. Deploy identity with this change (done, KEL-76). Requests without `member_id` are
   answered as before.
2. Update academic and billing to forward the JWT `member_id` claim on every check (done,
   KEL-80: academic PR #20 `ebb6902010ab89ef7d2788e16f21ac5f23245767`, billing PR #16
   `9ee1dc233d08bcefa566fcde97cc62fd90cbdd0e`; both also refuse a tenant token without a
   usable `member_id` with 403 before calling identity).
3. Add an identity flag analogous to `PERMISSION_REQUIRE_TENANT_ID` that rejects a request
   without `member_id` as `InvalidArgument`, and enable it once step 2 is deployed.

Until step 2 was deployed, a revoked or demoted member could still pass academic and billing
permission checks with an unexpired token; identity's own HTTP routes are protected from
step 1. Step 3 is still open: it hardens identity against a client that omits `member_id`,
but no current academic or billing path omits it.

## Consequences

- Revoked, deactivated and re-roled members lose identity HTTP permissions immediately,
  without a denylist; re-login issues a token for the new role.
- Each permission check adds a join on `tenant_members`; the membership-per-user index
  (KEL-59) is relevant for its cost.
- Routes that are not permission-gated (for example `GET /api/v1/members`, see ADR 0010)
  are unchanged; this ADR adds no new gate.
- The Redis permission cache is still written and never read; it is not consulted.

## Alternatives considered

- Token denylist or refresh tokens: out of scope and larger; the membership join gives the
  same outcome for permission-gated operations without new state.
- Require `member_id` in the first release: rejected, it would break academic and billing
  until they are redeployed (same reasoning as ADR 0002).
- Change every use-case signature to take the caller: rejected in favour of the request
  context, which keeps the 11 call sites unchanged and fails closed when absent.

Evidence: `kelolakelas-identity-service/internal/repository/member_permission.go`
(`ActiveMemberHasPermission`), `internal/domain/caller.go`, `internal/usecase/permission.go`
(`callerHasPermission`), `internal/delivery/http/middleware/auth_middleware.go`,
`internal/delivery/grpc/permission_service.go` (`optionalMemberID`, member_id branch),
tests `internal/delivery/grpc/{permission_service_member_test,kel76_permission_integration_test}.go`,
`internal/delivery/http/middleware/kel76_permission_integration_test.go`,
`internal/usecase/permission_test.go`; identity PR #21, squash
`8bf0bf8b842c518730994602475cdf205525f03c`.
