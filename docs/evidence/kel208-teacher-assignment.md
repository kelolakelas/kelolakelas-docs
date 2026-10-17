# KEL-208 schedule-driven group teacher assignment

**Implemented:** group creation chooses teachers on each manual/generated timetable slot. Bulk choice writes every current slot and is inherited by later additions/generation; a different per-slot choice clears the bulk field without rewriting other slots. Final `teacher_ids` is exactly the unique set of slot tutors. Removing a slot removes its unused tutor from the final request. No stale bulk choice is applied at submission.

Private classes retain a separate required assignment in final review and submit no timetable. Existing schedule editing and backend membership/tenant authorization remain authoritative. The web aggregate action rejects missing group tutors, unrelated assignment IDs and slot tutors outside the assignment set. Schema and authorization APIs do not change.

Evidence: web `app/(dashboard)/dashboard/tenant/classes/_components/{ClassCreationWizard,ScheduleForm}.tsx`, `_lib/class-creation.ts`; flow, schedule and aggregate action tests. Source revision: `d1612cf`.

## Validation on 2026-10-18 (Asia/Jakarta)

- `KEL197_INTEGRATION_CONFIG=<temporary fixture> npm test`: **1740 passed**, **4 skipped** (existing editor/migration opt-in suites); 159 test files passed. The four wizard integration cases actually ran: cancel with zero writes; injected session-write failure rolls back then original-request retry commits; group with two tutors writes exactly two assignments/two slots; private writes no slots/sessions.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit --omit=dev --audit-level=high` and `git diff --check`: passed; audit reports zero vulnerabilities. No formatter script/configuration is declared by this repository.
- Production Next.js browser → actual Server Action → unmodified main gateway binary → academic handlers/usecases → disposable PostgreSQL schema: created `KEL208 Browser Group`; read-back confirmed one class, two slots and tutor set A/B. Identity session/permission/membership replies were test doubles. No real tenant rows, email or payments were used.
- Browser verified no separate Assigned Teacher on group details, global A followed by slot B clears global and keeps A/B, successful save closes wizard; 390×844 viewport had no horizontal overflow; Tab remained usable; browser error list was empty. Mobile screenshot retained in temporary operator evidence `/private/tmp/kel208-mobile.png`.

## Limits

This verifies synthetic authentication and actual academic persistence, not live identity login. Ineligible/stale members remain rejected by academic's existing membership gate. Existing private scheduling and session tutor history are outside scope. No architecture decision or migration is required.

## Delivery

Web [PR #117](https://github.com/kelolakelas/kelolakelas-web/pull/117) merged to main on 2026-10-18 (Asia/Jakarta), squash `afafb2da79d0b03bf1161c96b151fbd14f3448dc`; required [gate](https://github.com/kelolakelas/kelolakelas-web/actions/runs/39058360070) and preview deployment succeeded. Commit reachability from fetched `origin/main` was verified.
