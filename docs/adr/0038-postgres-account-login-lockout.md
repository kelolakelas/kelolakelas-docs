# ADR 0038: PostgreSQL-backed ordinary account login lockout

Status: Accepted and implemented (KEL-23).

## Context

The ordinary identity login previously returned before bcrypt for an unknown email and had no per-account failed-attempt tracking. The gateway's IP rate limiter alone is Redis-dependent and can fail open. Identity treats Redis as optional, while PostgreSQL already owns users and is required for login.

## Decision

Add `failed_login_attempts` (integer, non-null, default 0) and nullable `login_locked_until` to `users` via migration `000010_login_lockout`. The ordinary login path performs case-insensitive lookup, bcrypt verification, and failure-state updates in a transaction with `FOR UPDATE` on the user row. This serializes simultaneous attempts and persists lockout through service restarts and Redis outages. Five consecutive failures lock the account for 15 minutes by default; `LOGIN_FAILURE_THRESHOLD` and `LOGIN_LOCKOUT_MINUTES` accept positive integers, with duration overflow rejected at configuration load. A failed attempt commits even though the response is 401. A correct password during lockout is still compared with bcrypt but rejected; once the deadline passes, the next failure starts at one and a successful login clears both fields.

An unknown email is checked against a precomputed default-cost bcrypt dummy hash. Unknown, wrong-password, and locked-account cases share `ErrInvalidCredentials` and the existing generic 401 response; persistence errors produce a generic 500 instead of authenticating without protection. JWT generation, tenant selection, and optional Redis permission caching stay unchanged. Platform-admin login is a separate flow and was not changed.

## Consequences and rollout

Apply migration 000010 before deploying the binary: without its columns the query fails and ordinary login returns 500 (fail closed). Rolling back the migration discards counters and active lockouts. A distributed store beyond the required PostgreSQL database is not needed. Row locks are held across bcrypt computation, intentionally serializing attempts per existing account and imposing database connection/latency cost under concentrated abuse. An attacker who knows an email can induce temporary denial of login for that account; gateway IP throttling remains complementary and still fails open on Redis outage. Unknown emails have no persisted failure state, so enumeration resistance relies on generic responses and dummy bcrypt rather than nonexistent-account lockouts. No claim of constant-time database lookup or network latency is made.

## Evidence

Identity [PR #26](https://github.com/kelolakelas/kelolakelas-identity-service/pull/26), squash `f04ba1d4ecc452a0324fc74b8f33494f2af8e221`: `migrations/000010_login_lockout.{up,down}.sql`, `internal/repository/login_attempts.go`, `internal/usecase/auth_usecase.go`, `internal/config/config.go`, and handler, unit, and migrated-PostgreSQL integration tests. The PR and main-push `gate` checks passed; local `go test -race -count=1 ./...` passed against an isolated migrated PostgreSQL database.
