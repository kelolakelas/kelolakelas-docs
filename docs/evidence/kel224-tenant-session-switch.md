# KEL-224 tenant session switch evidence

Date: 2026-10-27. All identities and tenant data below are synthetic fixtures.

## Selection and baseline

Fresh Linear discovery returned 223 full issues, including completed/canceled
items, with no remaining pagination. All 12 unfinished issues had no comments,
assignee or delegate; GitHub returned no open PRs. KEL-224 has no native or
additional issue dependency and opens KEL-225, so ranks ahead of independent
issues under the requested unblocking rule. KEL-225 remains blocked until this
issue's implementation and documentation merge to main. Related historical issues
were not treated as blockers merely because of `relatedTo`.

KEL-100/101/102 require external staging rollout/rollback or secret-manager proof
that is not present in the available development setup. KEL-104 retains those
unfinished blockers. This batch did not select or implement those issues. No
orchestrator repository was synchronized or changed. Existing web AGENTS.md edits
and untracked October 27 planning files were preserved and excluded from commits.

All seven allowed repository main branches were fetched and fast-forward checked
before selection. This issue changes identity, gateway, web and current-state
documentation only. Main protection requires strict `gate`, PRs, no force push,
and zero mandatory approving reviews on these four repositories.

## Data and API verification

The actual migration chain ran in a newly created, disposable acceptance database
on the documented development PostgreSQL server. Existing application databases
were not migrated or seeded. The integration test uses real handlers, usecases,
repository SQL and JWT signing. It covers own-membership list, two tenant/role
choices, non-owned/unknown tenant refusal, browser-forged role/member IDs, malformed
targets, anonymous/expired/invalid/parent/platform/pending-factor principals,
inactive/deleted memberships, reset boundary and a concurrent revoke holding the
membership row lock before switch. Claims match persisted tenant/role/member rows.

Gateway tests cover both routes, session 401/503, anonymous refusal, unchanged
switch payload and stripping forged tenant/internal headers. Web tests cover stale
scope rejection before fetch, no cookie writes on failure/malformed success,
HttpOnly cookie replacement plus layout invalidation, unavailable versus empty,
whole-subtree cleanup and delayed-response refusal, cross-tab storage events,
stale new-login marker reconciliation, action header binding and proxy 409 before
a stale action can execute.

## Local validation

Required Go checks use `GOTOOLCHAIN=go1.26.10`: formatter, `go mod verify`,
`go vet ./...`, `go test -race -count=1 ./...`, `go build ./...` and the existing
`govulncheck@v1.8.0` gate. The KEL-224 PostgreSQL integration test is explicitly
enabled; unrelated opt-in PostgreSQL suites keep their existing skip behavior.

Web: full Vitest suite, TypeScript, ESLint, production build and production npm
audit. Final counts and immutable implementation revisions are recorded with the
delivery PR links below after verification.

## Browser acceptance boundaries

Chrome runs the production web app on a separate port without stopping the user's
existing dev server. Login, membership choices, switch, membership reads and
session revocation use actual identity handlers and PostgreSQL, through the real
gateway router and session checker. Academic, billing and chat payloads are
deterministic tenant-labelled doubles; WebSocket transport is a browser test
double. This verifies web cache/navigation/socket lifecycle and JWT/header seams,
not a new academic, billing or distributed-chat implementation.

The browser checks two tabs A/Teacher → B/Creator → A/Teacher; class, enrollment,
member and chat page data; direct role-specific API permission; replacement JWT
claims; forged tenant-header refusal; stale action 409; desktop 1440×1000 and
mobile 390×844 without horizontal overflow. The final browser pass succeeded with no page errors; the old chat socket
closed. Evidence: [Alpha classes desktop](kel224/classes-alpha-desktop.png),
[Beta chat desktop](kel224/chat-beta-desktop.png), and
[Alpha classes mobile](kel224/classes-alpha-mobile.png). No email, payment or production rollout is
part of this issue's acceptance.

## Final local result

- Identity and gateway: Go 1.26.10 module verification, vet, race tests, build and
  reachable-vulnerability scan passed; KEL-224 real PostgreSQL acceptance ran.
- Web: 170 test files / 1,868 tests passed; 3 files / 8 unrelated opt-in tests
  skipped. TypeScript, ESLint, production build and npm production audit passed.
- Chrome production run: two tabs A→B→A; all four data pages passed, selected JWT
  matched storage, stale action 409 and forged-header Teacher member read 403.
  Desktop/mobile screenshots above; no page errors, old chat connection closed.
- Scope: no live payment/email calls or production changes. Existing dev server
  was left running; the acceptance server used its own port and database.

## Implementation source snapshot

- `kelolakelas-identity-service`: `e4ea3a5ada874dfcda5294d25837cb6748b6dfcf` (KEL-224 implementation commit).
- `kelolakelas-api-gateway`: `cf499e20742e6e11dfa9c8c71f72fa0b482ebef8` (KEL-224 implementation commit).
- `kelolakelas-web`: `9159ec2edc3e8aced32e1faa550fc8e49a14fedb` (KEL-224 implementation commit).
