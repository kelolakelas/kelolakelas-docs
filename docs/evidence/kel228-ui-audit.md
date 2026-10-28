# KEL-228 UI/UX audit

**Observed,28 October2026 (Asia/Jakarta).** Scope recorded after the initial browser audit and before product
code changes. Baseline web `6aefe7430591ba6f01918f6a1701800747b71dcc`.

The inventory contains34 routes:33 surfaces and one compatibility redirect.
Initial Chrome coverage:100 visits across public, parent, Creator/admin, Teacher
and platform admin at1440×1000 and390×844. Four baseline services use disposable
databases with synthetic records. Platform authentication uses an operator-enabled
fixture assignment and the real password/challenge/TOTP flow.

## Selected implementation scope

1. **F1, P1, tenant mobile navigation:** open the drawer, press Escape or traverse
   all controls with Tab. It has no modal semantics or focus containment and Escape
   leaves it open. Use a native modal dialog with a name, dismissal, focus return
   and containment; close it when the viewport becomes desktop.
2. **F2, P2, class editor:** open Edit at1440px, change the name without saving,
   then resize to390px. The dialog disappears because its responsive ancestor is
   hidden, while the draft remains in the DOM. Render the modal in a document
   portal/native top layer so the same draft remains visible across breakpoints.

3. **F3, P1, parent report chat:** the later report journey reproduced404 from
   the parent-only “Diskusikan laporan ini via chat” button. `Service.Create`
   deliberately refuses parent report-room creation, consistent with KEL-120.
   Before coding this fix, scope was recorded in Linear: replace the invalid
   creation action with an inbox link and explain that staff start report rooms.
   Parent reading/replying to existing rooms remains available.

These are the only three selected fixes. API, permissions, class read strategy and
domain behavior remain outside this change. Student create validation was also
tested: surname, nickname and DOB survived failure, so no recovery defect is
claimed there. The coverage and validation below record the resulting audit.


## Eligibility and baseline

Task2 was selected only after KEL-227 reached Done, all four PRs merged and
required/post-merge checks passed. Fresh discovery retrieved223 full Linear
issues (including archived/completed/canceled), all7 unfinished discussions,
seven fresh origin/main refs and open PRs. KEL-228 was the only eligible issue:
KEL-221 still has active draft billing40/docs231; KEL-222 needs actual paid-flow
acceptance (official simulator403); KEL-100/101/102 still lack actual staging,
rollout and secret-manager proof (Railway requires reauthentication);104 is blocked.
KEL-228 has no native blockedBy. Conservative foundation review includes13 Done
issues and33 merged PRs, with provider timestamps/SHA/main targets and fresh-fetch
ancestry in [dependency evidence](kel228/dependency-merges.json). Related items
were context/foundations, not automatically converted into native blockers.
Web and docs were synchronized from main before branching; the billing KEL-221
checkout and its draft work were untouched.

## Route/persona/state coverage

[34-route matrix and paired screenshots](kel228/route-matrix.md),
[all100 observations](kel228/coverage.json). Public4, auth5, parent6, tenant14
(including compatibility redirect), platform5:33 surfaces plus1 redirect.
Each current page has desktop1440×1000 and mobile390×844 captures. Additional
Teacher direct-URL checks cover every tenant page: allowed class/session/report/
chat reads remain available, restricted member/role/settings/enrollment/finance/
transaction/voucher reads show denied states. The compatibility route resolves to
Members with its owner-account anchor. All100 final baseline observations have
no page errors and document width equal to viewport. HTTP200 alone is not treated
as proof of access: semantic denied states are recorded in rendered text.

The matrix is route coverage, not an exhaustive Cartesian product of all possible
records, state transitions, languages, browsers or permissions. Relevant empty
sections (sessions, chats before creation, queues, transactions, vouchers), owned
student/report/enrollment data, forms, invalid invitation, missing payment and
Teacher forbidden states were observed. Long Members/permissions pages remain
vertically scrollable. Visual review includes hierarchy, copy, field labels,
feedback, navigation, form recovery and responsive layout. The raw `unlabelled` heuristic flags the class-search input; source inspection
confirms it relies on a placeholder rather than an explicit persistent label.
This lower-impact F4/P3 is retained as a follow-up after the three higher-impact
fixes; no blanket accessibility verdict or global styling redesign is claimed.

## Reproduction and fixed behavior

| Finding | Reproduction / actual → expected | Impact | Before | After |
| --- | --- | --- | --- | --- |
| F1/P1 | Creator/Teacher mobile: open navigation, Escape leaves it open; no dialog semantics/focus containment → named native modal, background inert, Escape/close/backdrop return focus, desktop transition closes drawer | Keyboard users can operate the active menu without reaching obscured content | [mobile](kel228/finding-drawer-mobile.png) | [mobile](kel228/after-drawer-mobile.png), [dark](kel228/after-drawer-dark.png) |
| F2/P2 | Creator Classes: edit without saving at1440px, resize390px → dialog hidden under responsive ancestor despite retained DOM draft; expected editor/draft remain visible | Orientation/viewport changes interrupt class work | [desktop](kel228/finding-class-desktop.png), [hidden mobile](kel228/finding-class-hidden-mobile.png) | [desktop](kel228/after-class-desktop.png), [mobile](kel228/after-class-mobile.png), [dark loading](kel228/after-editor-dark.png) |
| F3/P1 | Parent owns report: click Discuss → backend404 by explicit report-creation policy; expected a permitted route with accurate copy | Main report-to-chat action always fails | [mobile error](kel228/finding-report-chat-mobile.png) | [desktop](kel228/after-report-chat-desktop.png), [mobile](kel228/after-report-chat-mobile.png) |

F3 aligns the UI with `chat.Service.Create`: staff initiate report rooms; parents
can read/reply to an existing room. The old web component/comment and current-state
web documentation incorrectly described parent get-or-create. They are corrected;
chat/gateway/academic policy is unchanged. Inbox navigation is general, so copy
asks the parent to select the shared report conversation rather than promising a
specific deep link. This does not repeat KEL-202 layout or KEL-227 read optimization.

## Journey and state evidence

Actual production web → gateway/session → identity/gRPC, academic, billing and
chat → isolated PostgreSQL; synthetic accounts/records only. A controlled local
payment-provider double returns pending invoices/VA instructions. No production
DB or live payment was mutated. Platform access uses real password authentication,
operator-enabled fixture factor enrollment and a valid TOTP challenge; no privileged
cookie was forged and setup keys/cookies are excluded from evidence.

- Catalog→student creation succeeded. Whitespace first-name validation retained
  surname/nickname/DOB ([before](kel228/finding-student-before-submit.png),
  [failure](kel228/finding-student-failed.png)); this candidate was not a defect.
- Parent private request→admin approval→invoice/enrollment link:
  [submission](kel228/journey-private-request-mobile.png),
  [approval](kel228/journey-private-approval-mobile.png),
  [approved request](kel228/journey-private-invoice-mobile.png).
- Group checkout→pending VA instructions: [capture](kel228/journey-group-checkout-mobile.png),
  [response text](kel228/checkout.json). Existing active enrollment was separately
  seeded for report access; it is not evidence of successful settlement.
- Staff creates a report room in tenant chat; parent finds it and sends a reply:
  [capture](kel228/journey-report-chat-mobile.png), [journey results](kel228/journeys.json).
  The corrected parent report link also works with keyboard Enter.
- Creator submits an Owner Account Request; factor-verified platform admin reviews
  and rejects it, without creating a privileged account:
  [decision result](kel228/journey-platform-review-mobile.png).
- Login empty validation, guest protected-URL login redirect preserving return,
  reset-password mismatch, chat service unavailable→retry→same existing room:
  [state results](kel228/states.json), [login](kel228/state-login-validation.png),
  [reset](kel228/state-reset-validation.png), [outage](kel228/state-chat-outage.png),
  [recovered](kel228/state-chat-recovered.png). No input-loss claim is made from
  intermediate action-pending captures.

## Verification and limits

Web source `3c250dee68ce13f3f880ffaf46bb9714d423c0ec`,
[PR134](https://github.com/kelolakelas/kelolakelas-web/pull/134).
`npm test`:1900 passed,8 existing opt-in integration tests skipped (not counted as
passing); full ESLint, `npx tsc --noEmit`, production `npm run build -- --webpack`,
`npm audit --omit=dev --audit-level=high` (zero production vulnerabilities),
`git diff --check` passed. The final report-copy adjustment additionally passed
its4 targeted tests and production build. Native-dialog regressions cover portal
placement/lifecycle/cancel and drawer breakpoint closure; jsdom does not emulate
browser inert/focus behavior. Actual Chrome checks do: Escape/visible trigger
return, keyboard traversal, draft preservation1440→390→320, no320px overflow,
scroll-lock cleanup and no page errors ([results](kel228/after-results.json)).
Dark presentation/loading of changed dialogs and report desktop/mobile were inspected.

Initial harness auth-secret mismatch was corrected and all affected persona
observations rerun; failed setup observations were excluded. Selector/timing
errors were corrected before claiming journey success. Modal captures use viewport
screenshots because full-page screenshots can temporarily resize the document;
measurements wait for media-query layout after viewport changes.

### Open coverage / follow-up candidates (not passing)

- **F4/P3, Classes search:** open Classes and type into Search classes; the
  placeholder disappears and no persistent explicit label remains. Add an
  associated label/accessible name in a later web task, then verify typed/empty
  states with a screen reader. Baseline Classes screenshots/raw unlabelled
  observation document the control. Deferred because this batch already fixes
  the three higher-impact findings; it is not claimed resolved.

- Real Duitku paid callbacks, bank settlement, renewal and manual transfers were
  not tested. Continue existing domain issues/controlled sandbox acceptance with
  actual provider access; pending fixture invoices cannot substitute for this.
- Email delivery, valid emailed reset/invitation links and expired-token timing
  were not exercised. Sender is deliberately disabled. Resume with an approved
  test sender, fresh test invitation/reset token and an isolated account; verify
  success/expiry without publishing token URLs. Invalid-invitation and reset
  validation states are covered, not the email success journey.
- Platform withdrawals has authorized empty pending/history coverage. A funded
  fixture withdrawal and independently verified destination/amount are required
  before auditing decision success; no external transfer was attempted.
- Safari/Firefox, screen-reader speech output, exhaustive large-record/string
  combinations and every modal on every route remain untested. Run the same
  viewport/keyboard scenarios with those clients. This batch fixes exactly three
  proven findings, without asserting blanket accessibility compliance.

No migration/configuration/API/permission change or new architectural decision.
No ADR is needed for these local UI changes. Roll back the web PR to revert;
current domain records/contracts remain compatible. Documentation delivery includes
this report, screenshots/raw results, web component correction, README snapshot
and evidence-index links. No third issue is part of the batch.


Web PR134 merged2026-10-28T06:48:54Z, squash `2cf9f31e98e1a8ba4b117395b884a6dc830e731e`. Required [PR CI40643708580](https://github.com/kelolakelas/kelolakelas-web/actions/runs/40643708580) and Vercel preview succeeded; fresh origin/main ancestry verified. Docs delivery and post-merge checks remain part of issue closure.
