# KEL-223 chat inbox disappearance and recovery evidence

Date: 2026-10-27. Synthetic fixtures only; no existing application data changed.

## Fresh selection after task1

KEL-224's four implementation/docs PRs merged to main, required and post-merge
gates passed, merge ancestry was verified after fetch, and Linear was Done before
this discovery. A new full discovery returned 223 issues with no remaining
pagination; all descriptions/relations were fetched anew. Eleven unfinished
issues had no assignee, delegate, comments or open PRs.

KEL-223, KEL-225, KEL-226, KEL-227 and KEL-228 were eligible with zero newly
unblocked descendants. Their order follows priority, estimate and creation time:
223/225 High2,226 High3,227 Medium2,228 Medium3. KEL-223 precedes225 by creation
time. KEL-225's KEL-224 dependency was separately reverified via all four current
GitHub merged records and fresh origin/main ancestry; it was not automatically
selected because task1 opened it.

KEL-221/222 lacked verified real sandbox acceptance prerequisites. Automatic
approval rejected a read-only credential-derived Duitku probe; the user explicitly
chose to skip it and continue another eligible issue. No provider call, invoice or
payment was made. KEL-100/101/102 still lacked required external staging rollout/
secret-manager evidence;104 retained unfinished blockers. No third issue was
started in this batch, and no orchestrator repository was touched.

KEL-223 has no native or additional unfinished issue dependency. Reusing identity's
existing active-membership RPC introduced no stacked work: KEL-135 is Done with
no blockers; identity PR35 (`e094e32fd32e9d950c25dd23efcd52bd03bc5c1d`), academic
PR42 (`f77f3f9e8d620b723f041c9838230a1c3d3af5bc`) and docs PR136
(`496d65a6477c1ab74e1a49a4bca9564d274d4cb7`) are merged to main with GitHub
merged_at present, and each commit was proved reachable from its fresh origin/main.

## Before/after reproduction

The same test fixture was executed against an archived fresh chat origin/main
baseline and against the revised source, using actual PostgreSQL, migrations,
repository, service, HTTP handler and signed synthetic actors. A unique schema
isolates every test run and is dropped afterward. Identity availability/permission
is controlled by a test double; no real user's permission or membership is changed.

| Boundary | Baseline | Revised |
|---|---|---|
| Persisted request conversations | 105 | 105 |
| Page1/page2 | 100/5, oldest only on page2 | compatible 100/5 |
| Authorized oldest direct GET | 200 | 200 |
| Identity permission outage: list | 200 success with empty data | 503 unavailable |
| Same outage: existing detail/messages | 404 | 503 unavailable |
| Revoked membership: staff-owner detail | 200 | 404 |
| Revoked membership: list | 200 | 403 |
| Outage recovery | rows never deleted | older room readable/replyable |

The test also proves stable ordering after a new message, repeated send with the
same key has one message ID, read watermark works, cross-tenant and wrong-parent
data are excluded, and the parent-owned list remains paginated/readable. This
reproduces causal mechanisms; it does not claim to identify or repair a specific
historical production row without evidence.

## Automated verification

Go checks use Go1.26.10: gofmt, module verification, vet, race tests, build and the
existing vulnerability gate. `KEL223_TEST_DATABASE_URL` explicitly enables real
PostgreSQL acceptance; unrelated existing opt-in database suites remain opt-in.
gRPC wire tests cover active/denied, malformed response and deadline. Real WS tests
connect, revoke rights, queue a message and prove the connection closes before any
payload reaches it. Existing parent/read/unread/send/notification tests remain.

Client tests cover older-page navigation, active direct-link retention on the
actual timer, list reordering/deduplication, outage versus empty, retry/recovery,
revoked cache/selection removal, newer-request precedence and context remount.
Existing send/retry, reconnect, deep-link and system-notification tests are kept.
Final source revisions: chat `08d200bf5211d4f5ff2dd2b851bbbab3fe1ab730`, web
`c92b392f8cd698f2f25888ae8cda42f6e2165e0e`. Go checks above passed with real
PostgreSQL acceptance enabled and no vulnerabilities found. Web: **1,874 tests
passed**, eight unrelated existing opt-in skips, whole-repository ESLint,
`tsc --noEmit`, production build and production dependency audit all passed
(audit: zero vulnerabilities). The delayed-send regression includes a poll that
finishes before the failed send response, preserving the same retry key.

## Browser boundaries

The production web build uses the actual gateway, chat HTTP/WS, store and
PostgreSQL with 105 synthetic rooms. Identity principal/session and permission
state are controlled doubles; actual gRPC wire behavior is covered separately.
No academic/payment/email operation is invoked. The browser verifies older-room
navigation/poll, outage503/recovery, retry with one persisted message, live socket
revocation and parent mobile. It uses a separate port; the user's dev server and
existing AGENTS.md edit/current planning drafts remain untouched.


## Final browser acceptance

**Observed on the final production build:** 105 persisted rooms, authorized oldest
room outside page1, older-page navigation, 10-second poll retention and hard reload
retention all passed. Simulated permission outage returned503 for list and direct
GET, hid server data without claiming an empty inbox, and recovered manually.
A failed send survived a subsequent read outage; retry persisted exactly one
message with the same idempotency key. Revoking membership then queuing a parent
message delivered no matching frame to the already-connected tenant socket;
REST detail returned404 and cached room/message/reply disappeared. Parent mobile
390×844 retained older-room messages without horizontal overflow. Page errors:0.
This browser run uses real persistence and WS delivery, with the controlled
identity boundaries described above; it is not a production-provider test.

- [Older room after poll/reload, desktop](kel223/older-desktop.png)
- [Unavailable state, desktop](kel223/outage-desktop.png)
- [Revoked access, desktop](kel223/revoked-desktop.png)
- [Parent older room, mobile](kel223/parent-mobile.png)


## Delivery evidence

| Repository | Merged PR | Squash commit on main | GitHub merged_at | Required PR gate |
|---|---|---|---|---|
| Chat | [#7](https://github.com/kelolakelas/kelolakelas-chat-service/pull/7) | `cfc39eae70ce5507b151d2bb31de22bd04502e8f` | 2026-10-27T07:10:33Z | [successful](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/40465304259) |
| Web | [#130](https://github.com/kelolakelas/kelolakelas-web/pull/130) | `3a7b53e909282950cd6a877024bfa20cefc2a885` | 2026-10-27T07:11:05Z | [successful](https://github.com/kelolakelas/kelolakelas-web/actions/runs/40465334557) |

Each merge state, merged_at and commit came from GitHub; after a new `git fetch
origin`, `git merge-base --is-ancestor <commit> origin/main` returned0 in each
repository. Protected main required a current successful gate, PR merge and no
force pushes; required approval count was0. Squash merge used the exact tested
head without admin bypass. Documentation delivery is [PR230](https://github.com/kelolakelas/kelolakelas-docs/pull/230).


Post-merge chat [main CI](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/40465535656)
passed. Web merged-commit [Vercel deployment](https://vercel.com/faridzams-projects/kelolakelas/4rdWGMoANmDKV9w1guLd86HBr2No)
reported success. All fixture listeners were stopped; the user's port3000 dev
server and pre-existing edits/planning files were preserved.


Post-merge web [main CI](https://github.com/kelolakelas/kelolakelas-web/actions/runs/40465588277)
passed including tests, types, lint, audit and production build. Chat's main gate
also executed the PostgreSQL acceptance enabled in its workflow. Documentation's
own main merge and Linear Done are verified after this PR merges; they are not
inferred from source-PR completion.
