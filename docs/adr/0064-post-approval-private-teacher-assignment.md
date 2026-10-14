# ADR 0064: Post-approval private teacher assignment reuses the permanent-tutor path in place

## Status

Accepted. Implemented in KEL-186: academic PR [#53](https://github.com/kelolakelas/kelolakelas-academic-service/pull/53) (squash `870cfb90b8803c30fcc51e8cc2711a82d984dbe2`), web PR [#97](https://github.com/kelolakelas/kelolakelas-web/pull/97) (squash `77dd8db8a4b64671aa0df28f46687a1990b19e69`).

## Context

Approving a private schedule request creates capacity-one `ClassSchedule` rows bound to the new enrollment with no `TutorID` (unassigned by design; the tenant picks a teacher afterwards). The existing `ChangeTutorPermanent` path always split the schedule: close the old row's validity, duplicate a new row with the new tutor, move enrollments (`TransferSchedule`) and reassign future sessions to the new row. For an initial assignment that split is wrong — the approval-created schedule and enrollment are the live records (invoice and generation worker reference them), so duplicating them would fork the schedule identity and risk duplicate enrollments/schedules.

Membership verification for tutor changes already existed on the substitute path ([ADR 0051](0051-substitute-tutor-active-membership-gate.md)): `CheckActiveMember`, fail-closed, `ErrSubstituteTutorNotEligible` (400) vs `ErrSubstituteTutorUnavailable` (503). `ChangeTutorPermanent` itself had no such check.

## Decision

- **In-place branch for initial assignment.** When the resolved schedule has `EnrollmentID != nil` and `TutorID == nil`, `ChangeTutorPermanent` updates the existing row's `TutorID` and reassigns its future sessions (`UpdateFutureSessionsTutor`) in the same transaction — no validity split, no new schedule, no `TransferSchedule`, no enrollment/invoice touch. A retry with the same teacher is a no-op returning the schedule unchanged. Group schedules (`EnrollmentID == nil`) and already-assigned private schedules keep the byte-identical KEL-51 split path.
- **Membership check on the permanent-tutor path.** `ChangeTutorPermanent` now runs the KEL-135 membership gate before any write: ownership resolved first (`GetByIDForTenant`, foreign/unknown stays 404 without a membership probe), then `CheckActiveMember` outside the transaction lock (no network call under a write lock) with the `ForUpdate` re-read inside the transaction. Ineligible (foreign/inactive/random id) is 400 `ErrSubstituteTutorNotEligible`; unreachable/malformed/unwired verification is 503 `ErrSubstituteTutorUnavailable` — fail-closed, never a silent pass. This also tightens the group permanent-tutor change, which previously accepted any UUID.
- **Contract unchanged.** Same route (`PATCH /api/v1/schedules/tutor-permanent` + `:id` alias), same `PermanentTutorChangeRequest` (`schedule_id`, `new_tutor_id`, `effective_date`), same 400-on-invalid-date permission/tenant-scope behaviour. The handler maps the two new sentinels to 400/503. The gateway already proxies the route; no gateway change.
- **Web surface.** The tenant Classes Schedules tab renders `Belum ditugaskan` + a `Tugaskan teacher` control on enrollment-bound schedules without a tutor (`AssignTeacherForm`: active-teacher dropdown of membership ids + date, server action `assignScheduleTeacher` sending `new_tutor_id` as `Member.id` and `effective_date` as RFC3339, per-status messages). Group schedules without an enrollment stay out of the flow.

## Alternatives considered

- **Reuse the split path for initial assignment.** Rejected: it would duplicate the approval-created schedule, move the enrollment to a new row, and leave the invoiced schedule/id behind — a second identity for the same private booking with duplicate risk on retry.
- **New dedicated assignment endpoint.** Rejected: the request/response shape, permission (`schedule:update`), tenant scoping and date validation are exactly the permanent-tutor contract; a second route would duplicate the handler, the membership gate and the gateway proxy for no behavioural difference.
- **Validate membership only inside the transaction.** Rejected: holding a row write lock across an identity gRPC call serialises concurrent assignments and risks lock waits on identity outages; the pre-transaction probe plus locked re-read gives the same safety without the lock window.

## Consequences

- Assignment preserves schedule/enrollment identity: invoice, price and payment status are untouched, and retries cannot create duplicates (verified by E2E count read-backs and rollback/retry unit tests).
- Assigned teachers see the private sessions under `mine=true` (JWT `member_id` derivation, KEL-135); before assignment the schedule renders `Belum ditugaskan` and the sessions appear in no teacher's list.
- Group permanent tutor changes are now membership-checked too (tightening, consistent with the KEL-135 substitute gate); callers passing a non-member tutor id that previously succeeded now receive 400/503.

## Evidence

Academic `internal/usecase/schedule_usecase.go` (`ChangeTutorPermanent` in-place branch + membership gate), `internal/delivery/http/handler/schedule_handler.go` (400/503 mapping), `internal/usecase/private_teacher_assignment_test.go`; web `app/(dashboard)/dashboard/tenant/classes/_components/AssignTeacherForm{,.test}.tsx`, `_actions/classActions{,.test}.ts`, `_components/ClassListTable{,.test}.tsx`; academic PR #53, web PR #97; real-stack `.kel-autopilot/kel186/manual-e2e.md` 20/20 PASS.
