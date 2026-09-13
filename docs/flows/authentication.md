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
  W-->>U: sets HTTP-only cookie only if response contains token
```

## Parent registration

**Initiator/entry:** web `registerParent`, `POST /api/v1/auth/register`. It validates first/last name, email, password min 6, optional phone, and sends `is_parent:true` (`kelolakelas-web/app/(auth)/register/_schemas/schema.ts`, `_actions/actions.ts:25-83`). Identity binds the same essential fields, hashes password through its auth use case, and returns 201 user data without token (`kelolakelas-identity-service/internal/delivery/http/handler/auth_handler.go:24-91`).

**Observed discrepancy:** the web action conditionally sets a cookie if `result.data.token`, but current `Register` response does not include a token. It navigates to `/dashboard/parent`, which is protected by cookie-presence proxy. New parent registration therefore cannot establish the documented browser session without a later login or code change. This is **Implemented code behavior**.

## Tenant registration and login

Tenant registration atomically creates an owner user, active tenant, member, and token through `RegisterTenantTx`, then optionally caches role permissions in Redis (`internal/usecase/tenant_usecase.go:81-142`). Login validates credentials and returns the token/user/tenant context (`auth_handler.go:94-142`). JWT signs HS256 claims for 24 hours. Failure paths include binding 400, duplicate identity/tenant 409 and invalid credentials 401.

## Invitations

Authenticated callers create a role-targeted invitation using the tenant claim. The use case checks membership, persists token/expiry, and sends Resend email; verification/register check absent, expired, or used tokens. Evidence: `invitation_handler.go`, `internal/usecase/invitation_usecase.go`, `pkg/email/resend.go`. Email delivery is an external side effect; delivery was not executed in this review.

**Not found:** refresh token, logout, token denylist/revocation, password reset, email verification, OAuth, and multi-factor authentication routes.
