# ADR 0024: Billing enforces `billing:read` on tenant transaction reads through identity

## Status

Accepted and implemented in KEL-57.

## Context

Billing exposes two browser-facing reads through the gateway:
`GET /api/v1/billing/transactions` and `GET /api/v1/billing/transactions/:id`.
Until KEL-57 both ran only `AuthMiddleware`. For a non-parent token the handler
scoped the query to the JWT `tenant_id`, so every active member of a tenant could
list and read every transaction of that tenant — amounts, parent ids, and student
ids — including members of the built-in Teacher role, whose seeded permissions
cover schedules, attendance, student notes, and reports but nothing in billing.

Identity already seeds `billing:read`, and academic already enforces tenant
permissions at its own boundary by calling identity's
`tenant.PermissionService/CheckPermission` over gRPC
([ADR 0002](0002-academic-permission-enforcement.md)). Billing had no gRPC
dependency, and its `Claims` did not read `role_id`, although identity signs it.

The tenant enrollment page added in KEL-33
([ADR 0023](0023-tenant-enrollment-payment-join-per-row.md)) reads one
transaction per enrollment row and, because the transaction list was not
permission-guarded, treated any failed lookup as "no transaction yet".

## Decision

Billing checks `billing:read` itself, at the route, by calling identity's
existing `CheckPermission` contract — the same mechanism and the same failure
semantics academic uses.

- `middleware.RequirePermissionUnlessParent(permissions, "billing:read")` guards
  only the two tenant-facing GET routes
  (`kelolakelas-billing-service/cmd/server/routes.go`).
- A parent token passes without an identity call. Parents carry ownership, not a
  role, and the handler already scopes their query to `parent_id`.
- A tenant token must carry a UUID `role_id` and `tenant_id`. A token without
  them — for example one issued before the claim was read — is refused with
  `403` before identity is consulted.
- The request to identity carries `tenant_id`, `role_id`, and `permission`.
  Identity counts only a role that belongs to that tenant or is a system role,
  so a role from another tenant cannot authorize a read.
- Denied → `403 Insufficient permission`. Identity unreachable, erroring, or
  slower than `IDENTITY_PERMISSION_TIMEOUT_MS` (default 3000) →
  `503 Authorization service unavailable`, and the handler never runs, so no
  transaction data is returned while authorization is unknown.
- The Duitku webhook (provider HMAC) and the `/internal/billing/*` routes
  (static internal credential) are not tenant-member calls and stay outside the
  check; none of them depends on identity.
- The gRPC connection is created lazily (`grpc.NewClient`), so billing starts
  and keeps serving webhooks, internal calls, and parents while identity is down.
  The identity address is `IDENTITY_GRPC_HOST` (default `localhost:50051`).

The web tenant enrollment page distinguishes the new `403` from every other
lookup failure: the row is marked `paymentForbidden` and renders
"Tidak tersedia untuk role Anda" / "Nominal tidak tersedia" in both layouts,
while `500`, `503`, and network failures keep the ADR 0023 degradation
("Menunggu transaksi"). The shared parent-facing `paymentPresentation` is not
changed.

## Consequences

- Tenant transaction reads now depend on identity's availability. An identity
  outage turns them into `503` for tenant members; parents, the webhook, and the
  internal routes are unaffected.
- A misconfigured `IDENTITY_GRPC_HOST` does not lock anyone out of data they are
  entitled to silently: it produces `503`, never an empty list or a `403`.
- Every tenant transaction read costs one gRPC call. On the tenant enrollment
  page that is up to one call per row (20 per page, see ADR 0023). Identity
  answers from `role_permissions`; no cache is added.
- Custom tenant roles gain transaction access exactly when an owner grants them
  `billing:read`, which is now a meaningful permission.
- The billing → identity gRPC transport is plaintext and unauthenticated, the
  same known gap as academic → identity. mTLS or transport authentication is
  out of scope here and remains tracked in
  [known gaps and risks](../08-known-gaps-and-risks.md).
- ADR 0023's statement that the billing transaction list cannot produce a `403`
  no longer holds; the page now handles that state explicitly.

## Alternatives considered

**Enforce the permission in the gateway.** Rejected for the same reason as in
ADR 0002: billing is reachable without the gateway inside the deployment
network, and the gateway would need its own identity dependency and knowledge of
each route's permission.

**Trust a permission list embedded in the JWT.** Rejected: tokens live for 24
hours, so a role change or revocation would not take effect until expiry, and
identity treats persisted role permissions as authoritative.

**Filter the transaction response instead of refusing it.** Rejected: there is no
field-level subset of a transaction that a role without `billing:read` should
see, and an empty `200` would read as "no transactions" to the caller — exactly
the ambiguity this change removes.

**Hide the payment column for members without the permission.** Rejected for the
web: the page cannot know a member's permissions without another request, and
the billing response is the authoritative answer. Marking the row keeps the
enrollment information visible and states why the payment is not.
