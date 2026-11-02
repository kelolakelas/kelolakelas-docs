# KEL-230: Immutable private approved-slot selection

## Source snapshot (2026-11-02)

Verified source commits: academic `48ae548`, gateway `cad4c4f`, web `d298ab3`.
These identify tested code, not a production deployment.

**Implemented:** academic domain/request DTO, snapshot/index helper, locked purchase,
tenant-scoped decision persistence, approval chat capture and migration1790900007.
Gateway routing is unchanged; forwarding regression covers exact JSON and verified
tenant headers. Web request normalization, approval dialog/action and parent/tenant
lists distinguish proposals and decisions. [Contract](../adr/0087-private-approved-slot-selection.md).

## Executed local evidence

- Academic unit/handler tests: second-of-three N=1, two-of-three N=2, canonical
  ordering, empty/duplicate/foreign indexes, stale proposal/cap, tenant/status
  guards, legacy bodyless behavior and invoice recovery.
- Isolated PostgreSQL race tests: eight concurrent callers for same/different
  choices and invoice fault injection; one enrollment, unchanged100000 price,
  selected schedules/session days, retained proposals and selected-only durable
  chat. Existing legacy, recommendation, activation, session and group regression
  suites remain enabled.
- Academic/gateway Go gates: formatting, module verification, vet, race tests and
  build. PostgreSQL-enabled academic suite uses a fresh disposable database;
  isolated schemas avoid cross-scenario contamination.
- Native Chromium desktop/mobile checks explicit keyboard radio choice, initial
  empty state, retained selection/error on failed action, modal geometry, focus,
  cancellation and drawer behavior. Its actions are doubles, not real providers.
- Live-stack acceptance passes parent HTTP submission, rendered tenant dialog and
  real server action, unmodified gateway, academic handlers/usecases, PostgreSQL
  selected-only enrollment projection, unchanged invoice amount, bodyless replay
  and internal activation of the same enrollment. Start
  `TestClassCreationAcceptanceStack` with `KEL230_STACK_CONFIG`,
  `KEL196_GATEWAY_BINARY`, `KEL196_TEST_DSN`; run
  `PrivateSelection.integration.test.tsx` with `KEL230_INTEGRATION_CONFIG`.
  Identity and invoice provider are controlled doubles; activation uses the real
  internal handler with a fixture credential, not an external payment callback.
- Web default suite1917PASS/11opt-in skips; live stack1PASS separately; targeted
  dialog21PASS including native reset regression. Lint, TypeScript and production
  Webpack build pass. Turbopack cannot
  bind its child-process port in this executor. Exact source revisions and
  delivery are recorded separately from deployment claims.

## Operational boundaries

Migration precedes academic rollout; web follows. No chat-service/billing contract
change, backfill or new pricing rule. Identity/provider availability and production
deployment are not inferred from local tests. Down migration intentionally refuses
destructive removal of saved decisions.
