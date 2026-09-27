# ADR 0041: Account email is case-insensitive, enforced by a lower(email) unique index

Status: Accepted and implemented (KEL-89).

## Context

`users.email` had only the case-sensitive `users_email_key` unique constraint from the initial schema. Ordinary lookups (`GetByEmail`, login lockout) already compared `LOWER(email)`. New rows were stored exactly as typed, though, and the invited-user existence check compared `email = ?`. So `Parent@x.com` and `parent@x.com` could become two accounts, and a later lookup could then match either of them. Some environments may already hold such pairs. Rewriting or merging them automatically could hand one person's account to another, which is out of scope.

## Decision

- **One canonical form.** `domain.NormalizeEmail` (trim + lowercase) is the canonical form of an account email. The `domain.EmailAddress` JSON request type applies it before binding validation in the register, login, platform login, password-reset request, tenant registration and invitation creation payloads. The use cases and repositories normalize again, so non-HTTP callers get the same rule.
- **No data rewrite.** New users and invitations are stored in canonical form. Existing rows are not rewritten. Every lookup compares `LOWER(email)` with the normalized input, so legacy mixed-case accounts keep working.
- **Uniqueness enforced by the database.** Migration `000011_users_email_case_insensitive` adds `UNIQUE INDEX uq_users_email_lower ON users (lower(email))`. The application's pre-insert lookup is advisory only. A 23505 unique violation on `uq_users_email_lower` or `users_email_key` maps to `ErrUserAlreadyExists` (HTTP 409), so a concurrent race gives the same result as a sequential duplicate. No other unique violation is mapped. A lookup error is returned instead of being read as "email available".
- **Fail-closed preflight.** Before creating the index, the migration counts the `lower(email)` groups that have more than one row (soft-deleted rows included, as the index covers them). If any exist, it raises `email case conflict: ...` and names the conflicting user ids, never the addresses. It changes nothing. The operator resolves the accounts manually and then re-runs the migration.
- **Old constraint kept.** `users_email_key` stays, because it is strictly weaker than the new index. Keeping it makes rollback a plain `DROP INDEX IF EXISTS uq_users_email_lower`.
- **JWT claim.** Every token kind carries the `email` claim in canonical form (`pkg/jwt` `sign`).

## Consequences and rollout

- Apply migration 000011 before deploying the binary. In a database with case-variant duplicates the migration stops, and golang-migrate leaves version 11 dirty although nothing was applied. To recover: resolve the accounts, mark version 10 clean (`migrate force 10`, or `UPDATE schema_migrations SET version = 10, dirty = false`), then migrate up.
- The index is built without `CONCURRENTLY`, so it locks `users` against writes while it is built. That is acceptable at the current table size.
- Addresses are compared with PostgreSQL `lower()` and Go `strings.ToLower`. Both fold ASCII the same way. For non-ASCII local parts the two could in theory differ, depending on database collation. No production data was inspected for such addresses, and the preflight still refuses any group the index would reject.
- Automatic account merging and email verification at registration are not implemented.

## Evidence

Identity [PR #31](https://github.com/kelolakelas/kelolakelas-identity-service/pull/31), squash `6dd2c7a163668526fe06ed14256c7cc74cfa0cb6`:

- `internal/domain/email.go`;
- `internal/repository/{user_repository,invitation_repository,login_attempts}.go`;
- `internal/usecase/{auth_usecase,tenant_usecase,invitation_usecase,platform_auth}.go`;
- `pkg/jwt/jwt.go`;
- `migrations/000011_users_email_case_insensitive.{up,down}.sql`;
- unit, handler, sqlmock and PostgreSQL migration tests (`internal/migration/email_case_migration_integration_test.go`).

The PR `gate` and the post-merge main `gate` passed.
