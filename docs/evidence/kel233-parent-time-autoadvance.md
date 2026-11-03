# KEL-233: parent schedule time entry reuses shared hour-to-minute input

**Implemented**, web working tree KEL-233. The parent private schedule-request
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
previously fixed behavior with no changes to `ScheduleTimeInput` itself.

## Verification

- `npm run lint -- --max-warnings=0` on the two components plus the panel test: passed.
- `npx tsc --noEmit -p tsconfig.json`: passed.
- Focused vitest: `ScheduleRequestPanel.test.tsx` (18, incl. new KEL-233
  hour-to-minute test on both parent fields), `ScheduleTimeInput.test.tsx`
  (12, regression), `ScheduleDialogs.test.tsx` (7, reschedule dialog),
  `sessions/_lib/schema.test.ts` (66), `lib/schedule-request.test.ts` (72): all passed.
- Full web suite was attempted; the local runner stalled in this environment
  (background jobs produced no summary), so the full-suite result is recorded
  as not obtained locally and remains covered by the required GitHub CI gate.
- `npm run build` fails identically on unmodified `main` with
  `next/font` fetch errors in this offline sandbox, so the failure is
  environmental and unrelated to this change; the PR gate build is authoritative.
- Manual browser check on desktop/mobile viewports is still required before
  merge because jsdom cannot prove native segment selection; the shared
  selection API has the same Safari/WebKit automation limit already stated for
  KEL-210.

## Out of scope kept

No date-picker, timezone, availability-rule, slot-policy, payload-format, or
catalog/permission change. Voucher datetime and tenant rejection-recommendation
native time inputs were left untouched.
