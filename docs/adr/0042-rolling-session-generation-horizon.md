# ADR 0042: Academic keeps class sessions generated through a rolling horizon with a watermark and a unique key

## Status

Accepted and implemented in KEL-90.

## Context

Academic only created `class_sessions` when a schedule was created (`CreateInitialSchedules`) or changed permanently (`ChangeSchedulePermanent`). Both paths generated from the start date through the end of that calendar month and nothing ran afterwards. From the next month on, every live schedule had no sessions, so `GET /sessions` came back empty and attendance could not be recorded, because it needs an existing session. `class_sessions` also had no uniqueness on `(schedule_id, session_date)`, so nothing stopped a repeated run from duplicating sessions.

A session the tenant removed must stay removed. Deleting a session soft-deletes its row. A one-off reschedule keeps the original row with status `rescheduled` and inserts a new row with `schedule_id = NULL`. A permanent schedule change cancels the old schedule's future rows, and a permanent tutor change moves them to the replacement schedule. Deciding by "is there a live row for this date" alone would therefore revive deleted sessions.

Academic can run as several replicas, and the trigger must not multiply database load or create duplicates when it does.

## Decision

- **Trigger: an in-process periodic worker**, following billing's transaction expiry and reconciliation workers ([ADR 0009](0009-local-invoice-expiry-without-losing-late-payments.md)). `SessionGenerationWorker` (`internal/usecase/session_generation_worker.go`) runs once at startup and then every `SESSION_GENERATION_INTERVAL_MINUTES` (default 60). `SESSION_GENERATION_WORKER_ENABLED` (default `true`) can turn it off per replica. The alternative, generating on demand when sessions are listed, was rejected: it would put writes on a read path and still leave attendance for future dates dependent on someone listing first.
- **Horizon:** through the end of the month `SESSION_GENERATION_HORIZON_MONTHS` after the current one. The default of 1 means the end of next month; values above 12 stop startup and non-positive values use the default. The worker never generates before the first day of the current month.
- **Watermark:** a new column `class_schedules.sessions_generated_until` (DATE, internal, not in the API). The worker only generates dates after it and then advances it with `GREATEST`, so it never moves backwards. A date on or before the watermark is never generated again, which is what keeps tenant-deleted, cancelled and rescheduled sessions away.
  - `CreateInitialSchedules` and `ChangeSchedulePermanent` set the watermark to the end of the month they already generate.
  - The replacement created by `ChangeTutorPermanent` inherits the old schedule's watermark, because that schedule's future sessions move to it.
- **Unique key:** a partial unique index `uq_class_sessions_schedule_date ON class_sessions (schedule_id, session_date) WHERE schedule_id IS NOT NULL`. The worker inserts with `ON CONFLICT DO NOTHING` against it. The index covers soft-deleted, cancelled and rescheduled rows too, so a missing or reset watermark still cannot duplicate or revive a session. One-off reschedule rows (`schedule_id IS NULL`) are not constrained.
- **Concurrency:** one schedule per transaction, selected with `FOR UPDATE SKIP LOCKED` and ordered by id with a cursor. Replicas split the work instead of waiting on each other, and the lock serialises generation with permanent changes and deletion of the same schedule. When one schedule fails, only that schedule rolls back; its watermark stays put and the next tick retries it. When the lookup itself fails, the pass ends.
- **Eligibility:** a schedule gets new sessions only if all of these hold:
  - the schedule is not soft-deleted;
  - its class is not soft-deleted;
  - a private schedule's enrollment is `pending` or `active` and not deleted;
  - `valid_until` is after the watermark.

  `valid_from` and `valid_until` clip the range as calendar dates.
- **Migration `00001790492411_session_generation_horizon`:**
  - adds the column;
  - backfills the watermark of every schedule that has sessions to the end of the month of its latest session, counting soft-deleted rows too, so they cannot come back;
  - fails with an explicit error, instead of deleting anything, if duplicate `(schedule_id, session_date)` rows already exist;
  - then builds the index.

  Every statement is idempotent. The init schema carries the same column and index.

## Consequences

- Every live schedule has sessions for the current and the next month within one interval of deploy or of month change. The first pass after deploy creates next month's sessions for every live schedule: at most about five per schedule per month of horizon.
- Before deploying, operators should check that there are no duplicate `(schedule_id, session_date)` rows. If there are, the migration refuses to apply until they are resolved by hand.
- "Today" is the calendar date in the process time zone, the same calendar the request paths use through `normalizeDate`.
- Sessions of past months are never backfilled. A schedule whose watermark is NULL (no sessions ever) starts from the first day of the current month, bounded by `valid_from`.
- Ending a private enrollment stops further generation for its schedule, but already generated future sessions are left as they are.
- `CreateInitialSchedules` and `ChangeSchedulePermanent` keep their existing responses: they still return only the sessions of the start month.

## Evidence

Academic [PR #31](https://github.com/kelolakelas/kelolakelas-academic-service/pull/31), squash `f1f96d822bcb4f81efb9e04cd9bf81c8d354ca38`.

- Code: `internal/usecase/session_generation_worker.go`, `internal/usecase/schedule_usecase.go` (`sessionsForScheduleBetween`, watermark on the create and permanent-change paths), `internal/repository/session_generation_repository.go`, `internal/repository/interfaces.go` (`SessionGenerationRepository`), `internal/domain/class_schedule.go`, `internal/config/config.go` (`applySessionGeneration`), `cmd/server/main.go`, `migrations/00001790492411_session_generation_horizon.{up,down}.sql`, `migrations/00000000000000_init_schema.up.sql`.
- Tests: `internal/usecase/session_generation_worker_test.go`, `internal/usecase/session_generation_postgres_test.go` (sequential and 4-way parallel runs create no duplicates; deleted and rescheduled sessions stay; the `valid_until` boundary), `internal/config/session_generation_config_test.go`.
- CI: PR and post-merge `gate` passed.
