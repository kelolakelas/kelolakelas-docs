# KEL-217 navigation unread verification

**Implemented:** web navigation consumes viewer-specific unread message totals through `lib/chat-unread-actions.ts` and `components/chat/ChatUnreadProvider.tsx`. [ADR 0076](../adr/0076-navigation-chat-unread-reconciliation.md) records pagination, scope and refresh tradeoffs. Repository scope is web plus docs; no service/API/migration changes.

## Fresh second-task audit

KEL-220 web #125 / docs #224 merged to main at 2026-10-24T16:28:25Z / 16:28:29Z, commits `ca7df7700eb47318a2d256faf12e7735b20a602d` / `64b5785dda928d29902759c7470c2e219dc23590`. Both reachable after fetch; required PR gates, post-merge CI and web deployment succeeded, and Linear KEL-220 was read back Done before task two.

New discovery fetched 216 issues (including archived/completed, no pagination) and full descriptions/relations from scratch. Eight remain unfinished. Native graph, comments, all seven allowed remote main refs and open PRs were refreshed. KEL-216 still has open web124/academic62/docs223 and QRIS acceptance blocker. KEL-100/101 still require unverified staging/deployment consumer integration; KEL-102 explicitly awaits staging secret manager/rollout integration. KEL-104 depends on those unfinished issues. Eligible ranking is KEL-217, KEL-218, KEL-219: zero newly unblocked descendants, all Medium, estimates 2/2/3, then earlier creation breaks the 217/218 tie. KEL-217 has no blockedBy or explicit implementation blocker, active comments, delegate or open PR. KEL-123/202 are related work, explicitly not blockers. Fresh web/docs main was checked out and pulled fast-forward-only before branching. User untracked planning drafts were preserved.

## Automated checks

- Full suite: 1,800 tests passed, eight unrelated opt-in integration skips; 162 files passed, three skipped.
- TypeScript, ESLint, production webpack build, whitespace check and production dependency audit passed; zero vulnerabilities.
- Server aggregation tests cover unread after the first 100 read conversations, message sums (not conversation counts), 0/1/99/100/>100, cap early stop, reordered duplicate IDs, malformed/repeating pages, partial failure and old-scope rejection before fetch.
- Provider tests cover duplicate invalidation without inflation, errors as unknown, recovery to confirmed zero, ten-second polling outside inbox, cross-tab invalidation, queued reconciliation during a pending read, discarded late old-account results, disabled eligibility and unavailable/denied BroadcastChannel. Existing inbox and tenant permission/navigation tests remain passing.

## Real local-stack verification

Story: dashboard navigation → Server Action → authenticated gateway → chat REST visibility/unread SQL → PostgreSQL → accessible badge.

The production build ran on a separate loopback port3317 against the existing local gateway/chat services and synthetic reset fixture accounts. Credentials stayed in temporary files and were never committed or printed. A schedule-request conversation was created through the real API from an existing synthetic KEL-215 request; no invoice or payment was created.

| Boundary | Evidence |
| --- | --- |
| Browser renders outside inbox | parent students navigation and tenant overview show Chat count; desktop and 375px drawer/grid screenshots |
| Client to server | hydrated provider reconciles on ten-second poll/focus/online and uses the authenticated Server Action |
| API to data | owner REST send and replay returned the same message UUID `21d5087a-5af5-4c8d-a8e8-541c2b668f45`; parent REST list returned unread1; source `internal/postgres/store.go` filters before pagination and excludes reader's sender UUID |
| Data to UI | parent nav changed to Chat1 while outside inbox; duplicate send remained1; opening inbox in a second tab committed read and returning to the first tab showed Chat with no badge |
| Own-message semantics | parent reply left parent unread0 and made owner unread1; tenant desktop/mobile displayed1 |
| Permission gate | actual fixture Teacher login rendered zero Chat links and zero badges in tenant overview |
| Failure and recovery | browser offline + focus displayed Chat…; online reconciliation returned confirmed zero; navigation remained available |
| Responsive | 375px parent and tenant document scroll widths equal viewport; no uncaught browser errors before intentional offline failure |

Pagination beyond 100, cap boundaries and delayed scope races were verified with isolated action/provider tests, not bulk mutations to the shared remote database. Automatic approval review rejected a proposed direct 101-row remote SQL fixture because shared-database mutation authorization/blast radius was not proven. That SQL was never executed; no workaround or database cleanup was attempted. Normal verification used the existing synthetic account API flow. No approval remains required for delivery.

Browser coverage is Chromium desktop/mobile viewport; Safari/Firefox are untested. Outside-inbox incoming messages normally reconcile within ten seconds while visible; timer throttling/network delay and offset-pagination reordering are documented in ADR0076. No claim of an exact transactional snapshot, push delivery or multi-instance realtime is made.

## Final build captures

Web source revision `8f427b5`. Browser inspection confirmed all three parent Chat anchors (including responsive hidden counterpart) read Chat1 from one provider after final build restart.

- [Parent desktop](kel217/parent-desktop-unread-final.png), [parent mobile](kel217/parent-mobile-unread-final.png)
- [Tenant desktop](kel217/tenant-desktop-unread-final.png), [tenant mobile drawer](kel217/tenant-mobile-unread-final.png)
- [Parent after confirmed read in another tab](kel217/parent-mobile-read.png)

## CI regression follow-up

The first web PR run40112914521 caught two existing enrollment-cancellation tests querying an unscoped single `status` role after the accessible badge introduced another status. Their assertions now target the enrollment history region, preserving the original success-after-refresh acceptance. The complete final local suite was rerun:1,800 passed/8 opt-in skips; types/lint/whitespace passed. Runtime/build behavior and captures are unchanged. Delivery waits for a successful new required PR gate.
