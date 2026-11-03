# KEL-233: parent schedule time entry reuses shared hour-to-minute input

**Implemented**, web commit `f65fb7fe4aa47acc13a8ca1e3f762e460a8988df`.
The parent private schedule-request
form no longer uses native `input[type=time]` for start/end slots; both fields
reuse `app/(dashboard)/dashboard/tenant/classes/_components/ScheduleTimeInput.tsx`
with the existing public palette (`publicScheduleControlClass`). Valid two-digit
typed hours advance selection to minutes on the same field; Tab/Shift+Tab,
corrections, backspace/delete, paste, range and start/end order validation are
unchanged. Draft payload stays `HH:MM` strings, `scheduleRequestTimeForBackend`
still expands to `HH:MM:SS`, and server zod schemas are untouched.

The tenant reschedule dialog (`app/(dashboard)/dashboard/tenant/sessions/_components/RescheduleDialog.tsx`)
reuses the same component for `new_start_time`/`new_end_time` with its existing
tenant styling and `name` attributes, so the reschedule action payload and
`SESSION_TIME_PATTERN` (`HH:MM` or `HH:MM:SS`) are unchanged. No new parallel
time-input semantics were introduced; the tenant class editor keeps its
previously fixed behavior. `ScheduleTimeInput` now guards missing or throwing
selection APIs so focus and manual entry remain usable without an exception.

## Verification

Reverified on 2026-11-04 after explicitly authorized takeover of the existing
implementation and integration with current `main` (including KEL-234).

- Focused Vitest covers the parent panel, shared input, reschedule dialog,
  session schema and request validation. Parent tests exercise both fields,
  invalid/incomplete values, bulk paste events, deletion and correction;
  shared tests cover midnight/23:59, seconds, and unavailable selection APIs.
- `npm run test:time-browser`: Chromium passed at 1280x900 desktop and
  390x844 mobile emulation, using real React parent/reschedule components and
  isolated server-action doubles. CDP keyboard/input events verify incomplete
  hours, minute advancement without field focus transfer, invalid hour 24,
  correction, Backspace/Delete, full-string insertion, Tab/Shift+Tab, unchanged
  submitted slot JSON, end-before-start rejection and server-error retention.
  Both reschedule fields advance. A simulated throwing selection API leaves
  manual entry usable. The fixture is an interaction check, not a layout audit.
- Browser runner: `kelolakelas-web/scripts/verify-schedule-time-entry.mjs`;
  requires the existing external `agent-browser` CLI and Chromium. No new npm
  dependency is added. It does not connect to a live gateway or production.
- Physical mobile keyboards, WebKit/Safari and OS clipboard integration are
  not proven by Chromium emulation or jsdom. Full-string browser insertion and
  unit `insertFromPaste` coverage do not claim a real clipboard paste check.
- Local `npm run test`: 1,941 passed, 11 skipped (176 passed files, five
  skipped files). The skips are existing opt-in integration coverage, not
  successful live-backend checks.
- Local `npm run lint`, `tsc --noEmit`, `git diff --check`, and
  `GATEWAY_API_URL=http://localhost:8000 npm run build -- --webpack` passed.
  Required GitHub CI uses the default production build; PR CI and merge
  reachability must be verified separately before marking the issue Done.

## Out of scope kept

No date-picker, timezone, availability-rule, slot-policy, payload-format, or
catalog/permission change. Voucher datetime and tenant rejection-recommendation
native time inputs were left untouched.
