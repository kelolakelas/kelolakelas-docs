# KEL-229: Private approved-slot limit

## Source snapshot (2026-11-02)

Verified implementation commits: academic `7257ce0`, web `826b917`, gateway
`5c12504`. These are source snapshots, not claims that the commits are deployed.

Academic: domain/class.go, class/catalog repositories, class/simple/composite and
private-request usecases, HTTP errors, migration1790900006. Web: class schemas,
actions/forms, catalog and tenant approval explanation. Gateway routes unchanged;
TestPrivateSlotLimitExactForwarding covers raw create/composite/update bodies.
[Decision](../adr/0085-private-approved-slot-limit.md).

## Executed local acceptance

- PostgreSQL15 disposable local DB: migration forward/backward, legacy NULL,
  defaults/explicit limits, tenant/type guards, real update-lock vs approval,
  atomic over-cap rejection and unchanged materialized retry. Unit tests include
  recommendation acceptance, invoice timeout and permanent-error replay.
- Form integration: N=1 and N=3 pass through rendered create/edit forms in jsdom,
  real server actions, unmodified gateway, academic handlers/usecases and real
  PostgreSQL. Identity membership is a test double. This is not production login,
  payment, or browser-geometry acceptance. Start TestClassCreationAcceptanceStack
  with KEL229_STACK_CONFIG, KEL196_GATEWAY_BINARY and KEL196_TEST_DSN, then run
  PrivateSlotLimit.integration.test.tsx with KEL229_INTEGRATION_CONFIG.
- Gateway/academic: gofmt, go mod verify, go vet, full race tests and go build pass
  on the isolated DB, including the final changed-fixture regression.
  Older shared-schema session fixtures require a fresh database to avoid counting
  retained rows from previous runs.
- Web: final default suite1907pass/10opt-in skips; live-stack2pass separately;
  lint, tsc --noEmit and production next build --webpack pass. Turbopack cannot
  bind a child-process port in this executor; supported Webpack builder is used.

## Rollout and limits

Migration before academic, then web. No backfill. New private create omission
defaults to1; update omission/null preserves existing values. Maximum2147483647
is PostgreSQL integer storage, not a new product quota. KEL-230 subset selection
remains out of scope. No production/staging/payment-provider deployment claim.
