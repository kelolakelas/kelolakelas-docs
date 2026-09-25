# ADR 0031: Applied tenant-registration policy in identity

## Status
Accepted and implemented for KEL-97 (identity PRs #17 and #18; gateway PR #18).

## Context
The KEL-96 control plane records desired configuration versions and operator reports but does not apply deployment configuration. Platform administrators need to suspend and resume *new tenant* registration without changing existing tenant access. Reporting a desired close as if it were effective before acknowledgement would mislead operators and could violate the registration boundary.

## Decision
- `identity/platform/TENANT_REGISTRATION_OPEN` is a typed, non-secret boolean. Migration `000007_registration_policy` seeds a version-0 default-open head. The identity service is its sole in-process consumer. Other catalog entries remain record-only; this does not introduce an inter-service call or deployment adapter.
- Platform-admin-only GET `/api/v1/platform/registration-policy` reports the effective `open` state and `applied_version` alongside `desired_version`. POST `/close` and `/open` append desired versions using optimistic head advancement; their responses re-evaluate the applied state rather than reporting the requested value as effective. A concurrent change can yield 409. The existing configuration history and report endpoint retain actor and timestamp audit. Only an `applied` report makes a requested version effective; a requested, failed, or rollback report by itself does not.
- Tenant registration checks the effective policy before writes and rechecks under the same head's shared transaction lock as user, tenant, wallet and Creator creation. An applied acknowledgement takes an exclusive lock, serializing the transition against in-flight registrations. When closed, or if policy data is missing, malformed, or unavailable, registration returns a stable 403 without partial records. Existing tenant sessions, login, platform bootstrap, and invited-user registration remain available.
- Identity still trusts the authenticated platform operator's `applied` acknowledgement; it is not an independently verified deployment claim. Apply migration 000007 before exposing the new routes.

## Consequences
The close/open request is not an instantaneous switch: operators must report the desired version `applied` before the state changes, and should inspect `applied_version` versus `desired_version`. Version history remains auditable. A database outage denies new tenant creation rather than failing open; monitor this path and restore policy storage to recover. No other control-plane value gains runtime application through this decision.

## Evidence
Identity `internal/usecase/registration_policy.go`, `internal/repository/registration_policy.go`, `internal/delivery/http/handler/configuration_handler.go`, `migrations/000007_registration_policy.up.sql`, registration transaction tests and pending-state response tests; gateway `internal/delivery/http/router.go` and route tests. Identity PR #17 squash `c1fa5e3234e787ec7932dc958fdc16972bf517e5`, correction PR #18 squash `c8893abd4a39c931ea1c67a11f162a1b01e2136a`, gateway PR #18 squash `39fa40fb6f3af78e4ad59f35f594f65a0edd90e4`. Go vet, race tests, build and CI gate passed; database-backed integration tests were not run without `KEL97_TEST_DATABASE_URL`.
