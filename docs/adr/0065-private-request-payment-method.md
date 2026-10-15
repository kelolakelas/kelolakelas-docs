# ADR 0065: Persist payment choice before private approval

Status: Accepted (KEL-133, owner decision 2026-10-14)

## Decision

Parent chooses `payment_method` when submitting a private schedule request, rather than adding checkout after approval. Academic persists `VC`, `VA`, `BC`, `SP` or `NQ` on the request. Approve and recommendation acceptance forward that saved value through the existing billing client. Recommendations change slots, not the method. Existing request locking, invoice idempotency keys and active-invoice replay remain authoritative; changing an active invoice channel is unsupported.

Omitted/empty legacy methods normalize to VC. Additive migration `00001790900000_private_request_payment_method.up.sql` adds a non-null varchar(2) with VC default for existing rows and older writers. Unknown methods are rejected before writes/provider calls. Deploy migration, academic, then web; revert application before down migration. No billing/gateway implementation, fee policy or card-data handling changes.

## Consequences and evidence

This partially supersedes ADR 0049's private-VC-only scope, not its immutable-invoice policy. Fresh deterministic real stack d435456fd0ba covered all five methods plus omitted through both purchase paths, invalid 400 before write and three concurrent calls followed by successful retry with one enrollment/schedule/invoice. Losing concurrent billing calls can return 500 while one succeeds; subsequent retry is successful. No live payment or sandbox success is established.

Evidence: academic `internal/domain/private_schedule_request.go`, `internal/usecase/private_schedule_request_usecase.go`, `internal/usecase/private_schedule_payment_test.go`, migration above; [academic PR #54](https://github.com/kelolakelas/kelolakelas-academic-service/pull/54), squash `752536482927191187a1017b5cff01d34467a01c`; web `ScheduleRequestForm.tsx`, `ScheduleRequestList.tsx`, `lib/schedule-request.ts`, action body tests; [web PR #99](https://github.com/kelolakelas/kelolakelas-web/pull/99), squash `6a8e78756aa89d378994813d63c3fb4568f6438c`. Local evidence: `.kel-autopilot/kel133/manual-e2e.md`.
