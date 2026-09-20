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

Every tenant-scoped identity route (members, tutors, roles, tenant settings, and tenant location) resolves its tenant from the `tenant_id` claim of the validated token only (`internal/delivery/http/handler/tenant_context.go`). A token that carries no tenant claim — which is the case for every parent, because login issues a nil `tenant_id` when there is no active membership — is refused with 403 before the use case runs, so a parent cannot read or mutate another tenant's members, roles, or settings. The gateway removes any client-supplied `X-Tenant-ID` before proxying and republishes the header from the verified claim, and it refuses a non-parent token without a usable tenant claim with 401, so the header carries no caller authority (KEL-16 and KEL-18, [ADR 0010](../adr/0010-tenant-context-from-verified-jwt-claim-only.md), [ADR 0017](../adr/0017-gateway-context-header-trust-boundary.md)). There is no route for a user with several active memberships to choose among them; the token carries at most one `tenant_id`.

Authenticated callers create a role-targeted invitation using the tenant claim. The use case checks membership, persists token/expiry, and sends Resend email; verification/register check absent, expired, or used tokens. Evidence: `invitation_handler.go`, `internal/usecase/invitation_usecase.go`, `pkg/email/resend.go`. Email delivery is an external side effect; delivery was not executed in this review.

**Implemented:** the invitation email link is now followed in the browser. The recipient opens `/invitations/verify?token=…` in `kelolakelas-web`, which loads on the public surface (neither protected nor redirected by `proxy.ts`). The page performs `GET /api/v1/invitations/verify` server-side with `cache: 'no-store'` before rendering, and the result is classified into exactly one state: `valid`, `missing_token`, `not_found`, `expired`, `used`, `unavailable`, or `invalid`. Identity answers an expired token and an already-used token with the same `400` status, so the web classifier distinguishes them by the backend message; anything it cannot interpret — a `5xx`, malformed JSON, a network failure, or an unconfigured `GATEWAY_API_URL` — becomes `unavailable` and never `invalid`, so an infrastructure failure is not reported to the invitee as a bad link. On the valid path the invitee sees the invited address and the invitation expiry (formatted for `Asia/Jakarta`) and submits first/last name plus password through the `registerInvitedUser` Server Action to the public `POST /api/v1/invitations/register`; the email is read-only and never submitted from the browser, because identity reads the address, tenant, and role from the invitation row inside `RegisterInvitedUserTx`. Success redirects to `/login?registered=1` without a session, consistent with parent registration. The invitation token is stripped from the normalised invitation data and cannot be rendered or logged; the gateway access log records `URL.Path` only, so the `?token=…` query string never appears there ([ADR 0015](../adr/0015-gateway-request-correlation-and-access-log.md)). **Not implemented:** the identity verify response exposes `tenant_id` and `role_id` without display names and no public endpoint resolves them, so the page shows a generic tenant heading when the public catalog does not already expose that tenant, and it does not render the invited role. Evidence: `kelolakelas-web/app/(auth)/invitations/verify/page.tsx`, `_actions/actions.ts`, `_components/InvitationRegisterForm.tsx`, `lib/invitation.ts`, `lib/invitation.test.ts`.

**Not found:** refresh token, logout, token denylist/revocation, password reset, email verification, OAuth, and multi-factor authentication routes.
