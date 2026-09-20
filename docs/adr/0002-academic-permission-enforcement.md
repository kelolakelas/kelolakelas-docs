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
The request contains `role_id` and `permission`; the response contains `allowed`.
Identity reads `role_permissions` joined to `permissions` and returns the current
persisted assignment. Missing role context and denied permissions return HTTP 403.
Identity connectivity or lookup failures return HTTP 503 and the academic handler is
not invoked.

Permission mapping:

| Mutation | Permission |
|---|---|
| Category create/delete | `category:create` / `category:delete` |
| Class create/delete/attribute update/publication | `class:create` / `class:delete` / `class:update` (see [ADR 0013](0013-tenant-scoped-class-update.md)) |
| Schedule create/delete | `schedule:create` / `schedule:delete` |
| Schedule and session changes | `schedule:update` |

Public catalog list/detail routes remain unauthenticated and are not passed through
the permission middleware. Existing use-case tenant/resource ownership checks remain
the second authorization layer.

## Consequences

Role permission changes take effect on the next mutation request even when a JWT is
still valid. Academic mutation availability now depends on identity gRPC; operators
must keep that internal network path reachable. The gRPC connection remains plaintext
and unauthenticated in the current deployment, so network restriction and a future
mTLS/service-authentication change remain required hardening work.

## Alternatives considered

- Put permissions in JWT claims: rejected because active tokens would retain stale
  access after role changes.
- Enforce only in the gateway: rejected because direct academic exposure can bypass
  the gateway.
- Query identity over public HTTP: rejected because the existing internal identity
  data boundary is gRPC and would add another service URL/credential contract.
