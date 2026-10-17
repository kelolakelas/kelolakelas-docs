# ADR 0070: Unique migration version for class creation retry storage

Status: Implemented (KEL-204, 2026-10-17).

## Evidence and problem

Academic main contained both `00001790900000_private_request_payment_method` and `00001790900000_class_creation_requests`. The file source used by `cmd/migrate` rejects the directory with `duplicate migration file`. A read-only development metadata query found version `1790900000`, `dirty=false`, and no `class_creation_requests`. The class creation path inserts its retry claim before domain writes, so every keyed final wizard save in that schema fails and rolls back. Previous PostgreSQL tests executed selected SQL files directly and therefore missed the migration-source collision.

## Decision

Keep the already deployed payment-method migration at `1790900000`. Move class-creation retry storage to `1790900001`, with `CREATE TABLE IF NOT EXISTS` for deployments that already created the identical table. Preserve retry records on down-versioning: the down migration is a no-op because deleting committed keys/responses would allow duplicate creation after re-upgrade. No API, payload, transaction, membership, or private scheduling policy changes.

The normal migration command must run before the academic rollout. Do not force or rewrite the old migration version, rerun the init schema on an existing database, or drop retry records. This change does not automatically migrate the shared development or production database.

## Alternatives and consequences

Reusing the old numeric version leaves the source unreadable; editing only the old table SQL cannot repair a database already at that version. Runtime automatic DDL would change deployment ownership and schema permissions. A distinct forward migration makes upgrades explicit and retains existing responses. A new migration-source test reads the entire directory; PostgreSQL tests exercise the actual driver from the deployed version with missing and existing retry storage, saves/replay, private creation and down/up history preservation.

Evidence: academic migration files, `internal/migration/tools_test.go`, `internal/usecase/class_creation_migration_postgres_test.go`, opt-in acceptance fixture and web class-creation migration integration test.
