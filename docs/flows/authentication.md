# Authentication, registration, and identity flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web action
  participant G as Gateway
  participant I as Identity
  participant DB as Identity DB
  U->>W: registration or login form
  W->>W: Zod validation
  W->>G: POST /api/v1/auth/* or /tenants/register
  G->>I: proxy unchanged path/body
  I->>DB: validate/create/find user and membership
  I-->>W: standardized response; login/tenant register include JWT
  W-->>U: parent register returns to login; login/tenant register set HTTP-only cookie
```

## Parent registration

**Initiator/entry:** web `registerParent`, `POST /api/v1/auth/register`. It validates first/last name, email, password min 6, optional phone, and sends `is_parent:true` (`kelolakelas-web/app/(auth)/register/_schemas/schema.ts`, `_actions/actions.ts:25-83`). Identity binds the same essential fields, hashes password through its auth use case, and returns 201 user data without token (`kelolakelas-identity-service/internal/delivery/http/handler/auth_handler.go:24-91`).

**Implemented behavior:** the identity register response intentionally contains no token. The web action therefore does not create a session and returns to `/login?registered=1` with a confirmation message. The parent signs in explicitly; successful parent login routes to `/kelas`, which is an available public entry point for the purchase journey.

## Tenant registration and login

Tenant registration atomically creates an owner user, active tenant, member, and token through `RegisterTenantTx`, then optionally caches role permissions in Redis (`internal/usecase/tenant_usecase.go:81-142`). Login validates credentials and returns the token/user/tenant context (`auth_handler.go:94-142`). The web stores both the HTTP-only auth cookie and tenant-context cookie, then routes tenant users to `/dashboard/tenant` or a compatible requested dashboard path. JWT signs HS256 claims for 24 hours. Failure paths include binding 400, duplicate identity/tenant 409 and invalid credentials 401.

The web proxy performs an optimistic structural/expiry check to avoid treating malformed or expired cookies as sessions and clears those cookies before redirecting to login. It does not verify the JWT signature; protected backend routes remain the authoritative validation boundary.

## Invitations

Authenticated callers create a role-targeted invitation using the tenant claim. The use case checks membership, persists token/expiry, and sends Resend email; verification/register check absent, expired, or used tokens. Evidence: `invitation_handler.go`, `internal/usecase/invitation_usecase.go`, `pkg/email/resend.go`. Email delivery is an external side effect; delivery was not executed in this review.

**Not found:** refresh token, logout, token denylist/revocation, password reset, email verification, OAuth, and multi-factor authentication routes.
