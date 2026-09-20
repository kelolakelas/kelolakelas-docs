# ADR 0010: Tenant context comes from the verified JWT claim only

## Status

Accepted and implemented in KEL-19 (academic) and KEL-16 (identity). The
gateway half of the same decision was completed separately in KEL-18
([ADR 0017](0017-gateway-context-header-trust-boundary.md)).

## Context

The gateway terminates authentication and forwarded a caller's `X-Tenant-ID`
header to the downstream service, replacing it with the tenant value taken from
the validated JWT only when the token carried one
(`kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`, the
`if tenantID != ""` guard). When the token had no tenant claim, the gateway left
whatever `X-Tenant-ID` the caller sent in place and forwarded it untouched.
That behaviour has since been replaced by an unconditional strip at the gateway
boundary (KEL-18, [ADR 0017](0017-gateway-context-header-trust-boundary.md));
the defect described below is what the consumer-side fix addressed while it was
still in place.

Several academic handlers treated that header as a tenant source of truth. The
category, class, list, and schedule handlers resolved the request tenant with
`c.GetHeader("X-Tenant-ID")` and only failed when the result was empty or not a
UUID. A parent token — which by design carries no `tenant_id`, because
`AuthMiddleware` accepts a parent with an empty tenant claim — could therefore
name an arbitrary tenant by setting the header itself and read or mutate that
tenant's categories, classes, and schedules.

The same defect existed independently in the identity service. A single helper,
`extractTenantID` (`internal/delivery/http/handler/role_handler.go:22-38`),
resolved the tenant for the member, role, and tenant handlers and fell back to
the caller-supplied header whenever the context value was absent, nil, or
unparseable. `AuthUsecase.Login` leaves `tenantID` at its zero value when the
user has no active membership (`internal/usecase/auth_usecase.go:77-84`), which
includes every parent.
An authenticated parent could therefore set `X-Tenant-ID` to any tenant and read
`GET /members`, `GET /tutors`, `GET /roles`, `GET /tenant/settings`, and
`GET /tenant/settings/location`, and reach the corresponding mutations whenever
it also held a `role_id`. Only the invitation handler resolved the tenant
strictly from the claim (`invitation_handler.go:55-73`).

The header is not an authorization artifact. Nothing about it is signed,
audience-bound, or verified by the service that acts on it, and the gateway
cannot distinguish an injected value from a caller-supplied one. Trusting it
made the header an alternative, unauthenticated path to tenant scoping next to
the JWT that the same request had already been validated against.

## Decision

Tenant context is derived exclusively from the validated JWT claim, in every
service that acts on it. The identity service follows the same rule through the
same helper shape (`tenantIDFromContext` in
`internal/delivery/http/handler/tenant_context.go`), so both services resolve a
tenant one way only.

A single helper, `tenantIDFromContext` in
`internal/delivery/http/handler/tenant_context.go`, is the only way handlers
obtain a tenant. It reads the `tenant_id` value that `AuthMiddleware` stored in
the Gin context from the verified token. It never reads a request header. An
empty claim is reported as missing and a claim that is not a parseable,
non-nil UUID is reported as invalid; both are distinct sentinel errors so that
status mapping stays explicit.

The category, class, list, and schedule handlers drop their header fallback in
favour of the helper. `list_handler.go` keeps its `tenantID` wrapper as a thin
indirection onto the same helper so its call sites are unchanged. Handlers that
already read the context value only — students, attendance, reports, sessions,
enrollment queries — are unaffected and now share the same resolution path.

In identity, `extractTenantID` is deleted and its ten call sites across the
member (5), role (4), and tenant (1) handlers use the shared helper. `tenant_handler.go`
keeps its `currentTenant` wrapper as a thin indirection, mirroring the academic
`list_handler.go` treatment. An all-zero UUID is treated as "no tenant"
whichever representation produced it — a nil `uuid.UUID` claim, an empty
string, or the all-zeros string form — so the same logical condition always
yields the same status code. Rejection happens in the handler, before the use
case, so a rejected caller causes no repository query and no foreign tenant
data is read or written.

Status codes are chosen so that a caller cannot use them to probe tenant
existence:

- A missing tenant claim is **403**. A parent calling a route that requires
  tenant context is authenticated but not authorised for that context. It is
  deliberately not 400, because the request is well formed, and not 500,
  because nothing failed internally.
- An unparseable or nil claim is **401**. The token was accepted by the
  middleware but does not carry a usable tenant, which makes the presented
  credential inadequate for the requested operation.

Enrollment is tenant-scoped by path rather than by header. A non-parent caller
of `POST /api/v1/tenants/:tenant_id/enrollments` must present a claim that
equals the `:tenant_id` path segment; a mismatch is 403 and no use case runs.
A parent caller keeps the pre-existing public catalog flow, which is already
scoped by student ownership instead of by tenant.

Handlers still fail closed: `writeTenantError` maps any unrecognised tenant
error to 403 rather than defaulting to allow.

## Alternatives considered

- **Keep the header fallback but validate the header against the claim.** This
  only adds a comparison to a value that is already available in a verified
  form. It preserves a second, redundant tenant source that must be kept
  consistent, and it still leaves the header meaningful when the claim is
  absent.
- **Reject requests that carry `X-Tenant-ID` at all.** Breaks the web client,
  which sends the header from a `tenant_id` cookie alongside the bearer token
  (`kelolakelas-web/app/(dashboard)/dashboard/tenant/**/_actions/*.ts`,
  `_queries/*.ts`). The header is harmless once nothing reads it as
  authorization, and rejecting it would turn a compatible client into a
  failing one.
- **Strip or overwrite `X-Tenant-ID` at the gateway for every request.** This is
  a gateway change and was explicitly out of scope for KEL-19 (KEL-18 covers
  gateway work). It also would not have helped a caller reaching the academic
  service directly, which is the deployment the service must not assume away.
  This option was later adopted on its own terms in KEL-18
  ([ADR 0017](0017-gateway-context-header-trust-boundary.md)): the gateway now
  strips the header on every route and republishes it from the verified claim,
  as defence in depth alongside — not instead of — the consumer-side fix, which
  remains what protects a direct caller.
- **Move the check into `AuthMiddleware` and reject tenantless tokens for all
  protected routes.** Too broad: parent catalog enrollment and parent student
  routes legitimately operate without a tenant claim, so the requirement is
  per-route and belongs with the handler that needs the tenant.

## Consequences

The fix is on the consuming side, so the services do not depend on the gateway
to enforce tenant context: a direct caller of the academic or identity service
is subject to the same rule. The gateway was subsequently hardened as well
(KEL-18, [ADR 0017](0017-gateway-context-header-trust-boundary.md)) — it now
strips `X-Tenant-ID` and `X-Internal-Service-Credential` from every inbound
request and republishes the tenant header from the verified claim on protected
routes, so the conditional replacement described in the Context section no
longer exists.

`X-Tenant-ID` may still appear in a client's request, but it carries no
authority: no service reads it, and the gateway replaces it with the claim value
or removes it. The generated Swagger for both the academic and the identity
service no longer documents it as a parameter, so the published contracts no
longer advertise a tenant input that has no effect.

Behaviour that previously succeeded now returns 403: any request that relied on
a header to supply a tenant the token did not carry. Legitimate web traffic is
not affected, because the web client reads its tenant cookie from the login
response's `user.tenant_id`, which is derived from the same identity record
that signs the token's `tenant_id` claim.

Residual risk is unchanged and outside this decision: routes that do not accept
a tenant at all — session and schedule mutations — still perform their own
scoping, and authorization beyond authentication plus the persisted
catalog/schedule permission check remains a separate task. In identity,
permission checks on the GET endpoints remain a separate concern as well: the
member and role reads are scoped to the caller's tenant but are not gated by
`member:read` or `tenant:read`. Selecting a tenant for a user with more than one
active membership is likewise a separate decision, since a token currently
carries at most one `tenant_id`.
