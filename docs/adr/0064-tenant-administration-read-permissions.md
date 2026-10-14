# ADR 0064: Matching permissions for tenant administration reads

Status: Implemented (KEL-185)

## Context and decision

Previously tenant members, roles and settings reads accepted tenant context without their matching read permission. The owner chose matching read permissions rather than allowing every active tenant member to read administration data.

Require `member:read` for member list/detail, `role:read` for tenant role list and `tenant:read` for settings and location. Reuse the live active-membership and tenant-scoped role check from ADR 0034. A verified JWT alone is insufficient. Keep own-membership bootstrap available to active members regardless of `member:read`; preserve tutor teaching lookup and public tenant profile behavior.

Web direct URLs apply corresponding live permission gates and show `Akses ditolak`. Existing permission-based navigation stays authoritative for visibility, while identity remains the trusted data authorization boundary. Member-only custom roles do not fetch the role list.

## Consequences and evidence

This intentionally restricts Teacher/custom-role reads that previously worked without matching grants. Creator retains its existing grants. No migration, new permission, endpoint or request body is introduced; backend merged before web. Error/lookup failure paths remain fail closed. No payment/refund policy or unrelated domain authorization changes.

Identity PR #46, squash `8f38948f28de639e3f8638986fba40fff02a6525`; web PR #94, squash `9fd095b0fcc730f6acadb4489cd8136835c83db1`. Source: identity `internal/usecase/{member_usecase,role_usecase,tenant_usecase}.go`, matching HTTP handlers, `admin_read_test.go`, PostgreSQL HTTP read matrix; web tenant layouts and `AdminReadGate`. Local real-stack API/direct-URL matrix PASS (`.kel-autopilot/kel185/manual-e2e.md`, stack `ba5d666b19d3`); final Go gate and web 1530 tests / 138 files plus typecheck/lint/build PASS; required PR gates and identity post-merge gate passed. PostgreSQL HTTP integration skips in CI without its test DSN and was exercised explicitly locally.
