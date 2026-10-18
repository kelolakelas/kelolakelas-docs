# KEL-211 teacher read recovery — 2026-10-18 Asia/Jakarta

**Implemented:** web revision `4f7fea1`, [PR #120](https://github.com/kelolakelas/kelolakelas-web/pull/120). Baselines fetched/pulled before work: web `316d2b26a58ef8b5de7a61006fc43718a734f07f`, docs `b933e50e78ba8a1bccb5e41348d689ee294fe9c0`.

## Fresh second-task eligibility audit

After KEL-210 merged and was marked Done, discovery fetched all 207 KEL issues including archived/completed/canceled and full descriptions/native relations again. Seven unfinished issues had no new comments. All seven allowed repositories were fetched; provider open PR lists were empty and working trees clean. KEL-211 had no assignee/delegate, comments, active branch, PR, native blocker or additional dependency. It was the only eligible candidate (Low, estimate 1, zero unblocked descendants).

External gates remained unverified: the actual Railway environment list again contained production only, not staging/rollback for KEL-100/101/102; KEL-104 waits on those. KEL-155 still had no verifiable Resend sandbox delivery evidence, and KEL-156 waits on it. Historical contracts/labels were not schema gates. The orchestrator repository was excluded. No third task was started.

## Behavior and evidence

- `useScheduleTeachers` wraps the existing paginated server loader. It owns only read/attempt/loading state, locks retry synchronously and discards results after effect cleanup. No form remount or draft reset occurs.
- `TeacherLoadStatus` shows retry only for transient read error; a polite live region and aria-busy announce progress. Pending retry is disabled; repeated failure is an alert. Forbidden and empty lists retain specific guidance.
- Private wizard, group/add schedule, class editor and saved schedule editor share this behavior. Existing membership IDs and fields remain; newly ineligible saved teachers produce validation guidance. Private final save validates an active eligible selection; unknown original-request replays remain unchanged.
- Full unit suite: 160 files / 1,759 tests passed; eight opt-in integration tests skipped. New regression tests cover failure→success/failure, forbidden/empty, synchronous duplicate retry, late unmounted result, category/class/timetable retention for group/private, saved assignment retention/new ineligibility, and later-page failure followed by complete re-read from page 1.
- Formatter on new files, npm run lint, npx tsc --noEmit, GATEWAY_API_URL=http://127.0.0.1:8000 npm run build, npm audit --omit=dev --audit-level=high (0 vulnerabilities) and git diff --check passed.
- Chromium actual production React components and Next CSS with synthetic action doubles: create teacher load failed, a timetable slot and edited room were retained; repeated Retry clicks generated exactly one read while the button was disabled/aria-busy. Resolving success exposed Teacher One, removed Retry and retained byte-identical timetable JSON and room. This validates UI/serialization with doubles, not live backend/PostgreSQL. Physical mobile/screen-reader execution was not performed.

No API, database, authorization policy, background polling or offline persistence changed. Existing server loader still rejects incomplete pagination rather than exposing partial options. No architecture decision beyond existing component/hook conventions required a new ADR.
