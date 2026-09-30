# ADR 0050: Suspend, resume, and end enrollment through internal billing-driven endpoints

## Status

Accepted. Implemented in KEL-149: academic PR [#41](https://github.com/kelolakelas/kelolakelas-academic-service/pull/41) (`4afb40acde884a2c61639c304c5cb5d9fdbb0fb4`), web PR [#61](https://github.com/kelolakelas/kelolakelas-web/pull/61) (`6d2041957472deed1b10d550ca4be8b39a1eef2a`).

## Context

Before KEL-149 an enrollment knew only `pending`, `active`, `completed`, and `dropped`. Billing drove two internal transitions: `PUT /internal/enrollments/:id/activate` (confirm a paid seat) and `PUT /internal/enrollments/:id/release` (KEL-26, [ADR 0012](0012-release-enrollment-seat-on-failed-payment.md)), and release never revoked an `active` enrollment. Billing therefore had no way to park an active enrollment whose payment lapsed (the future dunning issue, KEL-150) nor to end one permanently (the future manual-refund issue, KEL-152). The parent and tenant web surfaces also had no vocabulary for such a state.

## Decision

- New status `suspended`, set only through the new internal-credential endpoints. No migration: `enrollments.status` is `varchar(50)` with no CHECK constraint.
- `PUT /internal/enrollments/:id/suspend`: `active` → `suspended`. Suspended rows fall outside every seat-counting predicate (which counts only `pending`/`active`), so the schedule slot is freed; the student disappears from upcoming session attendees (`FindForAttendance` refuses suspended rows) while history rows stay.
- `PUT /internal/enrollments/:id/resume`: `suspended` → `active` by reclaiming the seat under the enrollment row lock plus, for schedule-based enrollments, the schedule lock — the same checks a new signup passes, in the same order. Any failure (full schedule, schedule ended, student re-enrolled meanwhile) answers 409 (`ErrScheduleFull` / `ErrEnrollmentSuspendedConflict`) and the enrollment stays suspended; the caller can only retry.
- `PUT /internal/enrollments/:id/end`: `active`|`suspended` → `dropped`, the same terminal state a parent cancellation or a payment-failure release writes, so the seat is freed permanently and the student may enroll again. A `pending` enrollment is refused with 409: it has no seat of its own and must go through the parent cancellation or the payment-failure release, which also unwind billing.
- All three transitions are idempotent: repeating suspend on a suspended row, resume on an active row, or end on a dropped row answers the row unchanged. Every other starting state answers 409 (`ErrInvalidEnrollmentTransition`); unknown ids 404; malformed UUIDs 400.
- `CancelPendingEnrollment` refuses a `suspended` enrollment exactly like an `active` one: it already started, so the parent cannot withdraw it and its invoice stays untouched.
- Web shows the parked state as `Ditangguhkan`: `suspended` joins the tenant `enrollmentRecordStatusSchema` vocabulary (and its filter dropdown), the tenant table renders an amber badge, and `paymentPresentation` (`lib/payment-status.ts`) branches on `suspended` before every payment branch on both the parent and tenant surfaces, so even a paid suspended enrollment reads as parked rather than as an activation in progress. The invoice itself keeps its own state.

## Alternatives considered

- **Resume that queues or auto-retries when full.** Rejected: the service cannot know when a seat frees up, and a queued intent would hold an invisible claim on capacity. A synchronous conflict keeps the accounting observable; the caller (billing, KEL-150) owns the retry policy.
- **A separate terminal state for `end` instead of reusing `dropped`.** Rejected: `dropped` already means "seat freed permanently, student may re-enroll" in the capacity predicate and the `idx_student_class_active` partial index, and every consumer already treats it that way. A new value would need the same predicates updated with no new semantics.
- **Letting `end` accept `pending`.** Rejected: ending a pending enrollment without unwinding billing would strand its invoice; the existing cancel/release paths already own that unwinding.

## Consequences

- Suspend frees a seat that resume may not get back; a resumed-while-full enrollment stays suspended until billing retries after a seat frees up (KEL-150 owns that retry).
- Ended enrollments are indistinguishable from parent-cancelled ones downstream; both free the seat and allow re-enrollment.
- Evidence: academic `internal/domain/enrollment.go` (status constants, `ErrEnrollmentSuspendedConflict`), `internal/usecase/enrollment_usecase.go` (`SuspendEnrollment`, `ResumeEnrollment`, `EndEnrollment`), `internal/repository/enrollment_repository.go` (`ResumeUnderCapacity`), `internal/repository/session_repository.go` (`FindForAttendance`), `internal/delivery/http/handler/enrollment_handler.go` (`SuspendInternal`, `ResumeInternal`, `EndInternal`), `cmd/server/routes.go`, regenerated Swagger; tests `internal/usecase/enrollment_suspend_test.go`, `internal/delivery/http/handler/enrollment_lifecycle_handler_test.go`, `internal/repository/enrollment_suspend_postgres_test.go` (`KEL149_TEST_DSN`); web `app/(dashboard)/dashboard/tenant/enrollments/_lib/schema.ts`, `_components/EnrollmentTable.tsx`, `lib/payment-status.ts` and their tests.
