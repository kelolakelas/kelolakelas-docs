# KEL-210 schedule controls — 2026-10-18 Asia/Jakarta

**Implemented:** web revision `6fc7ff5`, [PR #119](https://github.com/kelolakelas/kelolakelas-web/pull/119). Baseline `d8edeba`; KEL-200 PR #110 merge `23dec014c050b0b2e4b1570e937db6876e41a057` was confirmed reachable from freshly fetched origin/main.

## Selection audit

Discovery returned all 207 KEL issues including archived/completed/canceled, with full descriptions and native relations; eight were unfinished. All seven allowed repositories were fetched, working trees clean, and provider PR lists empty. KEL-210 and KEL-211 had no native or additional blocking dependency, no comments, no assignee/delegate and no corresponding active branch/PR. Both unblock zero backlog descendants; Medium KEL-210 ranks ahead of Low KEL-211. KEL-200 is related context, not a native blocker, and its merged baseline was verified anyway.

KEL-100/101/102 require verified staging rollout/rollback (and secret-manager integration for 102). Actual Railway inventory exposed production only, so their external gates were unverified. KEL-104 waits on those unfinished issues. KEL-155 requires a delivered academic sandbox email in Resend; no dashboard/delivery verification was available. KEL-156 waits on 155. Historical JSON/ai-ready labels were not schema gates. No orchestrator repository operation occurred.

## Observed verification

- Standalone native Chromium accepted 12:45 by sequential hour/minute keystrokes. This does not reproduce the reported problem universally, nor prove its original cause.
- Actual React ScheduleForm/ClassConfigurationEditor bundled in production mode with production Next CSS and synthetic server-action doubles: typing 08 selected positions 3–5; typing 05 then Tab moved to End time. Edit action received 08:05:45 and 10:00:30, preserving seconds. Create final payload received 08:00 and 15:30.
- Backspace over minutes left 08::45 invalid with caret at 3; inserting 59 produced valid 08:59:45. Unit tests additionally cover 00/23 boundaries, invalid 24:60, paste, single-digit normalization, empty entry, correction and no key interception.
- Chromium 390×844 and 1280×900, light/dark: weekday and time controls measured 44px; shared border/background and focus styles rendered. No document overflow after wrapping the fixture's diagnostic JSON output.
- SafariDriver session creation was attempted and refused: Allow remote automation is disabled in Safari Settings. WebKit and physical mobile keyboard/screen reader were not verified.
- npm test: 159 files / 1,751 tests passed; eight opt-in integration tests skipped. Focused suites: 41 passed including 12 new time-input tests. npm run lint, npx tsc --noEmit, GATEWAY_API_URL=http://127.0.0.1:8000 npm run build, npm audit --omit=dev --audit-level=high (zero vulnerabilities), git diff --check passed.

This is UI/serialization evidence with test doubles, not a claim of live backend or PostgreSQL acceptance. Existing action/schema tests continue to cover validation and payload handling. No backend contract or timezone changed. See [ADR 0071](../adr/0071-schedule-wall-clock-input.md).
