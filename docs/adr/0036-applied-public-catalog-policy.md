# ADR 0036: Applied public catalog policy over the existing identity gRPC channel

## Status

Accepted and implemented for KEL-98: identity PR #23 (`225292705dfff275897e4a49a899c79fb485e5c8`), academic PR #21 (`d4033c1c6999cfb00660e4a59c8b7c330a59a41b`), gateway PR #20 (`3514762d40db44252c067a597f2ce6a67416fe4d`).

## Context

The public academic catalog already filters published/open classes and active tenant snapshots, but platform admins lacked one global switch for both list and detail. KEL-96 stores versioned non-secret configuration and operator application reports in identity. Simply hiding a web link, changing class publication, or independently caching an open state on list/detail would expose stale classes or alter tenant data.

## Decision

- Identity owns the typed boolean `academic/platform/PUBLIC_CATALOG_OPEN`, seeded by migration 000009 with a version-0 default-open head. The admin-only catalog-policy GET and open/close POST endpoints read applied state and append desired versions. Existing generic configuration history, applied report, and rollback endpoints provide audit and a manual acknowledgement path. A desired request does not itself mean applied. Once a desired version exists with no applied report, identity returns closed; an unreadable head/value/store is an error. Applied reports are operator acknowledgements, not independently verified deployment state.
- Identity exposes `tenant.CatalogPolicyService/GetPublicCatalogPolicy` using `structpb.Struct` on its existing gRPC listener. This avoids introducing a new credential or second channel in repositories without `.proto` sources. Academic strictly validates boolean and version fields, bounds the call at 2000 ms by default, and fails closed on absent, invalid or failed reads. The gRPC link has no application authentication/TLS in code and must remain network-restricted; hardening is separate work.
- One academic use-case policy gate precedes both list and detail queries and tenant snapshot refresh. Open is read on every request to avoid a stale-open exposure after closure. Only a successful closed answer may be cached, for at most 15 seconds by default; reopening may therefore be delayed. Closed list returns empty items, zero totals and `catalog_open: false`, while closed detail returns 404. An unreadable policy returns 503 without class data. Existing published/open and active-tenant predicates remain intact and no class or tenant row is mutated by a policy transition.
- Gateway protects the new platform admin routes with `RequirePlatform`; identity independently verifies the active platform assignment. The effective catalog gate is in academic, not merely at the gateway.

## Consequences and rollout

Apply identity migration 000009 and deploy identity first, then academic, then gateway. If academic precedes identity RPC or identity is unavailable, the public catalog intentionally returns 503 rather than exposing classes. If identity precedes academic, the old catalog continues its existing behavior until academic is deployed. A closed response may persist for up to the configured TTL after an applied reopening. Academic logs the enforced applied version; it does not automatically report application back to identity, so operators must reconcile the log with the acknowledgement and may not treat the report as proof of a deployed value. Future service-authenticated reporting would require its own trust and retry design.

## Verification

Identity repository PostgreSQL integration exercises seed, applied state and rollback; use-case, handler and gRPC tests exercise versions and failures. Academic tests exercise list/detail, closed cache expiry, malformed RPC and outage; gateway tests reject non-platform callers. Go formatting, vet, race tests and build passed in all three repos, as did PR and post-merge `gate` checks.
