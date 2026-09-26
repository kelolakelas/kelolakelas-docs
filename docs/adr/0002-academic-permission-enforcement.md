# ADR 0002: Enforce academic catalog permissions at the service boundary

## Status

Accepted

## Context

Academic catalog mutation routes already authenticate JWTs and scope resources by
tenant, while identity owns the persisted role-permission assignments. JWTs may be
older than a role change and Redis is an optional cache, so neither token claims nor
cached permission arrays are authoritative for a mutation. Gateway-only enforcement
would also leave direct academic service exposure unprotected.

## Decision

Academic calls an internal `tenant.PermissionService/CheckPermission` gRPC method on
identity before category, class, schedule, or schedule-related session mutations.
The request contains `role_id`, `permission`, and `tenant_id`; the response contains
`allowed`. Identity reads `role_permissions` joined to `permissions` and returns the
current persisted assignment. Missing role context and denied permissions return HTTP
403. Identity connectivity or lookup failures return HTTP 503 and the academic handler
is not invoked.

> **Superseded in part by ADR 0034:** a request that also carries the optional `member_id`
> is answered only for that active, non-deleted membership in the tenant that still holds
> `role_id`; the role-only lookup above now applies only to requests without `member_id`.
> Since KEL-80 academic and billing send `member_id` on every tenant check. See
> [ADR 0034](0034-permission-requires-active-membership.md).

The check is scoped to the tenant the caller is operating on, because a role identifier
alone does not describe who the caller may act as. Identity counts an assignment only
when the role belongs to that tenant or is a system role (`roles.tenant_id IS NULL`), so
a role from another tenant never satisfies a check. Academic resolves the tenant from
the same verified JWT claim the rest of the request uses — never from a request header —
and rejects a caller whose claim carries no usable tenant before consulting identity.

Permission mapping:

| Mutation | Permission |
|---|---|
| Category create/delete | `category:create` / `category:delete` |
| Class create/delete/attribute update/publication | `class:create` / `class:delete` / `class:update` (see [ADR 0013](0013-tenant-scoped-class-update.md)) |
| Schedule create/delete | `schedule:create` / `schedule:delete` |
| Schedule and session changes | `schedule:update` |
| Student list/detail | `student:read` |
| Student create/update/delete | `student:create` / `student:update` / `student:delete` |
| Enrollment create (`POST /tenants/:tenant_id/enrollments`) | `enrollment:create` |
| Enrollment list/detail | `enrollment:read` |

Public catalog list/detail routes remain unauthenticated and are not passed through
the permission middleware. Existing use-case tenant/resource ownership checks remain
the second authorization layer.

### Routes shared with parents

Some student and enrollment routes are reached by tenant members and by parents. The
parent token is verified by the same `AuthMiddleware` but carries ownership instead of a
role, so it has no `role_id` and no `tenant_id`; the permission question therefore cannot
be asked for it. These routes use a middleware variant that applies the persisted check
only to non-parent callers:

| Route | Caller | Decision |
|---|---|---|
| Student and enrollment routes above | non-parent | persisted permission check as mapped |
| Student routes | parent | the handler's owned-resource rules only, with no identity lookup |
| `POST /tenants/:tenant_id/enrollments` | parent | public enrollment flow, with no identity lookup |
| `POST /catalog/classes/:class_id/enrollments` | parent only | handler rejects non-parents with 403; no permission check |
| `POST /enrollments/:id/cancel`, `PATCH /enrollments/:id/schedule` | parent only | handler rejects non-parents; no permission check |

Skipping the check for parents is deliberate rather than a gap: identity has no role to
evaluate for such a token, and the alternative — denying parents— would break the
ownership-based parent flows this service exists to serve. A parent token that also
carries a tenant membership claim still counts as a parent, so the parent path stays
authoritative and the permission table is not consulted for it.

Because the check is skipped before any identity call, a parent request succeeds on these
routes even while identity gRPC is unavailable. Non-parent callers keep the 503 behaviour
described above.

## Adding `tenant_id` to a live contract

The `tenant_id` field is additive: `role_id` and `permission` keep their names and
meaning, and the response shape is unchanged. An identity deployment that does not read
`tenant_id` yet ignores the extra key, so academic may start sending it before identity
enforces it. Because the two services are separate deployables, the documented order is:

1. Deploy identity with `PERMISSION_REQUIRE_TENANT_ID=false`, which still answers requests
   that omit `tenant_id` using the previous tenant-blind lookup.
2. Deploy academic, which begins sending the tenant on every check.
3. Set `PERMISSION_REQUIRE_TENANT_ID=true` and restart identity, after which a request
   without a valid `tenant_id` is rejected as `InvalidArgument` instead of answered.

Step 3 is the point at which scoping is guaranteed for every caller. It is deliberately a
configuration change rather than part of step 1, so the rollout can be paused or rolled
back without another deployment. Identity logs which mode it started in. The same tenant
rule is applied by identity's own in-process checks, so invitation creation, tenant
settings and location updates, custom-role mutations, and member role changes are not
subject to the transition window: `CreateInvitation` additionally resolves the invited
`role_id` and rejects one that is neither owned by the tenant nor a system role with a 400
validation error before anything is persisted.

## Consequences

Role permission changes take effect on the next mutation request even when a JWT is
still valid. Academic mutation availability now depends on identity gRPC; operators
must keep that internal network path reachable. The gRPC connection remains plaintext
and unauthenticated in the current deployment, so network restriction and a future
mTLS/service-authentication change remain required hardening work.

A role deleted after a token was issued yields no rows in the scoped lookup, so it is
denied rather than treated as an error, and the caller learns nothing about whether the
role still exists. System roles seeded with a null tenant remain usable by every tenant,
which is what keeps the built-in `Creator` and `Teacher` roles working. The `Teacher`
role is deliberately seeded without the student and enrollment permissions, so it cannot
read or mutate tenant students and enrollments through these routes.

A tenant member whose verified token carries no `role_id` cannot be authorized and is
denied with 403 before identity is consulted, matching the "missing role context" rule
above.

## Alternatives considered

- Put permissions in JWT claims: rejected because active tokens would retain stale
  access after role changes.
- Enforce only in the gateway: rejected because direct academic exposure can bypass
  the gateway.
- Query identity over public HTTP: rejected because the existing internal identity
  data boundary is gRPC and would add another service URL/credential contract.
- Make `tenant_id` mandatory in the first identity release: rejected because academic
  would then be broken during the window before it is redeployed, turning a security
  fix into an outage; the flag keeps enforcement and deployment independently
  controllable.
- Derive the tenant from the resource being mutated instead of the caller's claim:
  rejected because it would let a caller holding a role in tenant A act on tenant B
  whenever they can name a resource there, and because the gateway already establishes
  the claim as the only trusted tenant source (see
  [ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md)).
