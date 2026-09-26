# ADR 0027: Configuration control plane records intent, not runtime state

## Status

Accepted and implemented for KEL-96 (identity `bb404b55e2bb83b4a6db222c90787da6f7f825a8`, gateway `f2e217f893651f9cc8fa3aa02d9365e1ba0fd498`).

## Context

Five applications consume deployment environment variables. A platform operator needs a complete catalog, versioned non-secret change requests, an audit trail, and explicit failure and rollback information, without disclosing credentials or changing how services load their runtime values. The control plane is implemented in identity and exposed by the gateway. No consumer adapter is included in KEL-96.

## Decision

- Identity maintains a static, source-inspected metadata catalog for web, api-gateway, identity, academic, and billing. Each entry names its owning application, type, redacted default, sensitivity, validation scope, required deployment application method (`restart`, `rotation`, or web `rebuild/redeploy`), and whether it is bootstrap-only. These are operator guidance, not automatic application: no key is currently dynamically applied by this control plane. Non-secret typed validation is limited to the control-plane validator; deployment loaders can enforce additional constraints. Secret validation occurs only at deployment; sensitive keys are catalog-only, with defaults and values never stored or returned. Inventory marks them `not_managed`, not whether a secret is actually deployed. A non-secret key without a request is `not_configured`; this describes the control plane, not the runtime environment.
- A platform admin with a platform JWT and an active assignment can list the inventory, inspect a non-secret key's history, submit a typed non-secret request, and record an application status. The gateway checks the platform claim; identity checks the current assignment for every route. Tenant and parent tokens cannot read this metadata or mutate it.
- Each `(application, environment, key)` has a monotonically increasing version, created by an atomic compare-and-swap against `expected_version`. New versions start `requested`; a conflict is returned as 409, and an unsuccessful persistence operation is never represented as successful. Versions retain the requesting operator and timestamp. Reports retain the reporting operator, timestamp, version ID and `applied`, `failed`, or `rollback` acknowledgement. Reports are **record-only**; the endpoint never applies a value or initiates rollback.
> **Superseded in part by ADR 0031 and ADR 0036:** KEL-97 adds an in-process consumer of applied `identity/platform/TENANT_REGISTRATION_OPEN`; KEL-98 adds an identity gRPC read consumed by academic for applied `academic/platform/PUBLIC_CATALOG_OPEN`. Other catalog entries retain the record-only behavior below.

- Effective values continue to come from each service's deployment environment, except the tenant-registration policy in identity. No other service reads identity for runtime configuration. `last_known_good_version` means the version most recently *reported* `applied` for the key and environment, not proof of runtime deployment. A failure report on the latest version displays `failed` while retaining that last-known-good reference. An operator may select that applied version as a manual rollback target; the API copies its non-secret value into a new `requested` version after checking `expected_version`. This action does not change runtime configuration. An operator must verify real deployment state externally before recording an acknowledgement.
- Reports use the existing admin-only API and credentials. KEL-96 introduces no service identity, shared secret, unauthenticated endpoint, consumer-side configuration read, or automatic apply/rollback.

## Consequences and follow-up

- The inventory is a metadata snapshot, not a live scan of deployed values. Keep it synchronized with environment readers in all five applications; see `internal/usecase/configuration_catalog.go` and `internal/usecase/configuration_test.go` in identity, and `docs/reference/environment-variables.md` for the source inventory. It cannot claim a requested value has taken effect without an operator's report, and a report itself is an acknowledgement, not independently verified deployment evidence.
- Platform operators must deploy or roll back values through the existing deployment mechanism before reporting status. KEL-100/KEL-101 own consumer adapters, cross-process application/runtime reads, and any eventual service-to-service reporting authentication. Those issues must revisit trust, authorization, idempotency, and reconciliation before automated reports can be accepted.
- Secrets remain in deployment secret management. Configuration writes for those keys are rejected; no plaintext secret is persisted by the control plane.
- Migration `000003_configuration_control_plane` adds heads, immutable requested versions, and append-only reports. The request head and version insertion share a transaction. Repeating the migration through the existing migration runner must follow that runner's versioning, not blindly reapply raw SQL.

## Verification

Identity usecase, handler, middleware, and repository tests cover inventory redaction, unknown/invalid keys, optimistic conflicts, failed application with last-known-good, rollback target restrictions, authorization, and write failures. Gateway route tests cover platform-only forwarding. The Go race, vet, build and formatting gates apply in both repositories.
