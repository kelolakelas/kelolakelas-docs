# ADR 0052: Reschedule replacement origin link and session-addressed attendance

## Status

Accepted. Implemented in KEL-134: academic PR [#43](https://github.com/kelolakelas/kelolakelas-academic-service/pull/43) (`8cdb738c3833e1bf8a8e356f67b586a9f9628ccb`).

## Context

`RescheduleSession` keeps the original session row with status `rescheduled` and inserts a one-off replacement row with `schedule_id = NULL` ([ADR 0042](0042-rolling-session-generation-horizon.md)). Attendance, however, was addressed by `enrollment_id + schedule_id + date` and resolved through `FindForAttendance`, which matches on `schedule_id`. A replacement therefore could not have attendance recorded at all, and `GetSessionAttendees` for a group replacement failed with `ErrScheduleNotFound` because it derived the cohort from the session's own (nil) schedule. Nothing linked a replacement back to the session it replaced, so the origin schedule could not be recovered from stored data: the only candidates were same-class rows with status `rescheduled`, which is ambiguous once a class has rescheduled more than once. There was also no way to record a whole session's students in one request, and no unique-key-backed upsert path for attendance.

KEL-134 needs attendance to work for reschedule replacements and to be recordable in bulk per session, without breaking the legacy `schedule_id + date` request form.

## Decision

- **Origin link.** `class_sessions` gains a nullable self-FK `rescheduled_from_session_id` (migration `00001790812223`, plus FK `fk_class_sessions_rescheduled_from` and partial index `idx_class_sessions_rescheduled_from WHERE rescheduled_from_session_id IS NOT NULL`). `RescheduleSession` writes the origin session's id into every replacement it creates. The column is nullable and there is **no backfill**: rows created before the migration keep `NULL` and are resolved through the legacy fallback below, because no stored data can prove which `rescheduled` row a given replacement came from once a class has more than one.
- **Cohort resolution.** `resolveSessionCohort` (attendance writes) and `GetSessionAttendees` (reads) resolve the cohort schedule of a session with a nil schedule by following `rescheduled_from_session_id` to the origin session and using the origin's schedule. Only when the link is absent (pre-migration replacement) do they fall back to "the single same-class session with status `rescheduled`"; zero or several candidates is an error, never a guess. A private session (non-nil `enrollment_id`) keeps covering exactly that enrollment.
- **Request forms.** `POST /api/v1/attendance` keeps the legacy `schedule_id + date` form and additionally accepts `session_id` — exactly one form per request (XOR). New routes: `POST /api/v1/attendance/by-session` (single, `attendance:create`), `GET /api/v1/attendance/by-session?session_id=&enrollment_id=` (`attendance:read`), and `POST /api/v1/attendance/bulk` (`attendance:create`). `PATCH /attendance/:id` stays id-addressed and already passes the assigned-tutor check, so replacement rows update through it unchanged.
- **Bulk upsert.** One request records every student of one session: `CreateBulk` → `AttendanceRepository.UpsertBulk`, a single `INSERT ... SELECT ... ON CONFLICT (session_id, enrollment_id) DO UPDATE` inside one transaction. The tenant predicate is part of the write statement (the subselect joins `classes` on `tenant_id`), not only of a preceding guard read, so another tenant's session id writes zero rows even under a race. Rows carry the session's own `session_date`, keeping legacy date-scoped reads correct. Repeating the same request updates rows instead of duplicating; two concurrent identical requests serialize on the unique index. Duplicate enrollment ids inside one request keep the last status.
- **Guard order** (single and bulk): session exists for the calling tenant (cross-tenant is 404, not 403) → session not cancelled (400) → caller is the session's tutor via `IsTutorForSession` (403) → every enrollment belongs to the session's cohort and is active (400 `ErrAttendanceEnrollmentMismatch`) → duplicate single write 409. This preserves the KEL-22 permission table and the assigned-tutor rule; tenant scoping stays in SQL per [ADR 0019](0019-tenant-scoped-session-and-schedule-mutations.md).

## Alternatives considered

- **Backfill `rescheduled_from_session_id` for existing replacements.** Rejected: with multiple same-class `rescheduled` rows the origin cannot be proven, and a wrong link would attach attendance to the wrong cohort — exactly the high-risk failure the issue flags. The status-based fallback keeps old data working without inventing facts.
- **Address replacements by `schedule_id + new date`.** Rejected: the replacement has no schedule, and the pair is not unique across classes; `session_id` is the only stable address of a one-off row.
- **Separate replacement-attendance table.** Rejected: `attendances` already carries `session_id` with a unique `(session_id, enrollment_id)` index; a second table would split the read model and the legacy form for no invariant gained.
- **Row-by-row bulk loop with per-row upserts.** Rejected: a partial write on mid-request failure and N round trips; one statement is atomic and idempotent by construction.

## Consequences

- New replacements are self-describing; old ones depend on the single-`rescheduled`-row fallback and fail closed when the class has rescheduled several times (recorded as a known limitation, not silently guessed).
- The three new routes are registered on the academic service only; the gateway does not proxy them yet. They are unreachable through `/api/v1` until the tutor attendance web work registers the gateway routes (known-gaps entry).
- Rollback drops the link column only; attendance rows are untouched because they never stored the link.

## Evidence

Academic `internal/domain/{attendance,class_session}.go`, `internal/usecase/attendance_usecase.go` (`CreateBySession`, `CreateBulk`, `GetBySession`, `resolveSessionCohort`), `internal/usecase/schedule_usecase.go` (`RescheduleSession`, `GetSessionAttendees`), `internal/repository/{attendance,session}_repository.go` (`UpsertBulk`, `GetBySessionEnrollment`, `FindSessionForAttendance`, `ListSessionsForAttendanceCohort`), `internal/delivery/http/handler/attendance_handler.go`, `cmd/server/attendance_report_routes.go`, `cmd/server/main.go`, `migrations/00001790812223_add_rescheduled_from_to_class_sessions.{up,down}.sql`, regenerated Swagger; tests `internal/usecase/attendance_kel134_test.go`, `internal/usecase/attendance_schedule_test.go`, `internal/repository/attendance_bulk_postgres_test.go` (`KEL134_TEST_DSN`), `cmd/server/attendance_kel134_postgres_test.go` (HTTP acceptance against PostgreSQL), `cmd/server/attendance_report_routes_test.go`, `cmd/server/swagger_contract_test.go`.
