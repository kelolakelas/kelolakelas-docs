# ADR 0017: The gateway owns the context header trust boundary

## Status

Accepted and implemented in KEL-18.

## Context

[ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md) removed every
downstream read of `X-Tenant-ID` as a tenant source: academic and identity now
resolve tenant context from the verified JWT claim only, and billing already
read the claim from the middleware context. That closed the exploitable path —
a parent token carries no tenant, and no service would accept one from a header.

It deliberately left one thing in place. The gateway overwrote `X-Tenant-ID`
only when the token carried a tenant
(`proxy_handler.go`, `if tenantID != ""`), so a tenantless caller's own
`X-Tenant-ID` was forwarded unchanged to the downstream service. ADR 0010 named
this as out of scope and anticipated a separate gateway change: *"Strip or
overwrite `X-Tenant-ID` at the gateway for every request. This is a gateway
change and was explicitly out of scope for KEL-19 (KEL-18 covers gateway
work)."*

Two problems remained at the boundary:

1. **The header still crossed it.** A request that reaches a service directly,
   or a future handler that reads the header, would inherit a value the caller
   chose. "No current reader" is not a property the gateway can rely on
   indefinitely, and the header's presence in forwarded traffic means every
   downstream change is a re-audit.
2. **`X-Internal-Service-Credential` was never stripped at all.** The header is
   a real shared secret: it authenticates the academic `/internal` group
   (`PUT /enrollments/:id/activate`, `PUT /enrollments/:id/release`) and the
   billing `/internal/billing` group (`POST /transactions`,
   `POST /transactions/cancel`) through `InternalServiceAuth`. The gateway
   registers no `/internal` path, so no gateway route reaches those handlers —
   but nothing removed the header from a request that did pass through, and the
   CORS allow list already prevents a browser from setting it on a preflighted
   cross-origin call. A same-origin or non-browser client had no such obstacle.

A related question was unresolved: what the gateway should do with a token that
cannot name a subject, or that names a tenant-scoped caller without a tenant.
The academic service already refused the latter with 401 via
`tenantIDFromContext`, so a request could be admitted by the gateway and refused
one hop later.

## Decision

The gateway owns the context header trust boundary. Inbound context headers are
removed unconditionally, and the only value that can appear afterwards is
produced from the verified claim.

### Both headers are stripped on every route

`StripUntrustedContextHeaders()` is registered second, after request
correlation and before access logging, CORS, rate limiting, the public routes,
and the protected group. It deletes `X-Tenant-ID` and
`X-Internal-Service-Credential` from the inbound request, so no middleware,
route, or proxy observes a caller-supplied value of either header, on public and
protected routes alike. Because `http.Header.Del` canonicalises the key,
differently-cased and repeated copies are removed together rather than leaving a
surviving duplicate.

Position matters. Placing it first means the access log, the rate limiter, and
CORS decide on a request that no longer carries the caller's claim to a tenant
or a service credential, and it means the protection applies to the Swagger
proxy and prefix-strip proxies for free, which a per-route fix would not.

### The tenant header is published from the claim only

`AuthMiddleware` sets `X-Tenant-ID` on the forwarded request from the verified
`tenant_id` claim, and only when that claim names a tenant. Because the strip
runs first, the header downstream is either the claim value or absent: a forged
value can neither survive nor be appended alongside the real one.

Publishing in the middleware rather than in each proxy handler is what makes the
guarantee uniform. The previous per-handler writes covered academic and billing
and left the identity proxy uncovered; a single write on the shared middleware
covers every protected route, and removing the handler writes keeps one owner
for the header.

### The all-zero UUID counts as no tenant

An absent tenant claim reaches the gateway as the all-zero UUID, not as a
missing field. The identity service signs `tenant_id` as a `uuid.UUID`, and
`omitempty` cannot omit a fixed-size array type, so a parent token serialises
`"tenant_id":"00000000-0000-0000-0000-000000000000"`. A gateway that only
checked for an empty string would treat that as a real tenant and publish the
zero UUID downstream.

`absentTenantClaim` therefore treats both the empty string and the all-zero UUID
as "no tenant". This matches the two services: academic reports the all-zero
tenant as invalid (401) and identity treats it as missing (403). Both fall back
to `tenantIDFromContext`'s existing rule rather than introducing a third
interpretation of the same value.

### Unusable tokens are refused at the gateway

`AuthMiddleware` returns 401 `Unauthorized: Invalid token` when `user_id` is
empty, and when the token is not a parent and its tenant claim is absent. The
second rule mirrors the academic service, so a tenant-scoped caller without a
tenant is refused at the edge instead of after a hop. A parent token is exempt
because a parent legitimately operates without a tenant: the public catalog and
the parent-scoped enrollment routes must keep working with a tenantless token.

## Alternatives considered

- **Leave the header behaviour to the downstream services, as ADR 0010 did.**
  This is what the code did until now. It leaves the gateway forwarding a
  caller-chosen tenant and a service credential it does not own, and it makes
  every downstream read a security question. The gateway is the only component
  that sees the client request and the verified claim together, so it is the
  only place the boundary can be enforced once.
- **Strip `X-Tenant-ID` but keep forwarding `X-Internal-Service-Credential`.**
  The credential authenticates routes the gateway does not expose, so this
  looks harmless today. It is not: the value is a shared secret with no
  legitimate gateway client, and forwarding it means the gateway relays a
  credential that no gateway route can use. Stripping both is the same code and
  removes the relay entirely.
- **Reject any request that carries either header, instead of stripping.** This
  would break the web client, which sends `X-Tenant-ID` from a `tenant_id`
  cookie on tenant dashboard actions and queries
  (`kelolakelas-web/app/(dashboard)/dashboard/tenant/**/_actions/*.ts`,
  `_queries/*.ts`). The header agrees with the claim for legitimate traffic, and
  the value the gateway publishes comes from the claim, so ignoring the inbound
  copy is both compatible and safe. ADR 0010 rejected the same option on the
  consumer side for the same reason.
- **Reject tenantless tokens on all protected routes.** Too broad: it would
  break parent catalog and parent enrollment traffic, which is exactly the
  traffic that made the original defect reachable. The requirement is scoped to
  non-parent tokens, which is the same scope academic applies.
- **Publish the tenant header in each proxy handler, keeping the existing
  shape.** This is the status quo that left the identity proxy without the
  header and duplicated the rule per service. Centralising it in
  `AuthMiddleware` makes the header a property of the authenticated request
  rather than of the chosen downstream.
- **Add `X-User-ID` injection while touching this code.** Out of scope, and not
  needed: no service reads `X-User-ID`, and each service already derives the
  user from the token it validates.

## Consequences

Downstream services receive `X-Tenant-ID` if and only if the verified claim
names a tenant, on protected routes; on public routes and for tenantless tokens
they receive it not at all. `X-Internal-Service-Credential` never leaves the
gateway. A client can no longer influence either header.

Behaviour that previously succeeded now returns 401: a token with no `user_id`,
and a non-parent token with no usable tenant claim. No legitimate flow depends
on either. Requests that replay the header are unaffected — the web client's
cookie-derived `X-Tenant-ID` agrees with the claim, and the gateway discards the
inbound copy in favour of that same claim value.

The proxy handlers no longer set any context header, so their remaining
responsibility is target selection and prefix handling. The strip runs before
the rate limiter, which means the limiter and the access log see a normalised
request; existing correlation, CORS, rate-limit, and Swagger-proxy behaviour is
unchanged, and the CORS allow list still does not include either header, so a
browser cannot preflight either one.

Direct callers of the academic and billing services are outside this boundary.
They can still present `X-Internal-Service-Credential`, which is the intended
service-to-service contract for `/internal`: the two services call each other
through `ACADEMIC_SERVICE_URL` and `BILLING_SERVICE_URL` rather than through the
gateway, and those calls carry the credential by design. The gateway guarantee
is that no request it proxies carries a client-supplied one.

Residual risk is unchanged and outside this decision: `X-User-ID` is not
injected by the gateway and is read by no service, refresh tokens and token
revocation are separate work, and the downstream header fallbacks were already
removed by KEL-16 and KEL-19, so this change adds no dependency on them.
