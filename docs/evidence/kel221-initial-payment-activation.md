# KEL-221 initial-payment activation diagnosis

## Scope and delivery state

**Observed, 27 October 2026 (Asia/Jakarta):** fresh Linear discovery returned 223 issues without pagination remaining. KEL-221 had no native blockers, active owner/delegate or open implementation PR. Of the eligible backlog candidates it ranked first by High priority, estimate 2 and oldest creation time; none opened another backlog descendant. KEL-100/101/102 lacked verified staging rollout/secret integration, and KEL-104 depended on those unfinished issues.

The KEL-8/KEL-29/KEL-215 foundations and KEL-8 → KEL-6 chain have merged implementation/documentation PRs with merge timestamps and commits reachable from fetched `origin/main`. Relevant deliveries include billing PRs #2/#3/#8, gateway #3, web #123 and docs #2/#9/#40/#222. Repository protection requires the GitHub Actions `gate`, up-to-date branches and PR delivery; no reviewer approval is currently required.

**Not delivered:** the correction is on [billing draft PR #40](https://github.com/kelolakelas/kelolakelas-billing-service/pull/40), proposal revision `1b7b99fd348637d23b92cc9183f7db0f018349d3`. External settlement acceptance remains blocked, so the issue stays In Progress and PRs must remain draft. No second issue has started.

**Observed CI:** the required billing [PR gate](https://github.com/kelolakelas/kelolakelas-billing-service/actions/runs/40496939163) succeeds, including the PostgreSQL-backed race suite and vulnerability check. Documentation is tracked in [draft PR #231](https://github.com/kelolakelas/kelolakelas-docs/pull/231); its initial [gate](https://github.com/kelolakelas/kelolakelas-docs/actions/runs/40497232081) also succeeds. CI success does not replace the blocked external acceptance. The three disposable databases and the candidate billing server on port 18082 were removed/stopped after verification; existing application services and the pending live sandbox fixture remain available.

## Reproduced failure and proposed owner fix

**Observed:** `TestGeneratedInitialPurchaseStillOwesActivation` fails on the baseline for both group and private invoices: `paid=paid enqueues=0 activation calls=0 reconciled=false`. Unlike older hand-built callback fixtures, it calls `GenerateSubscriptionPayment`, which persists subscription and period metadata on the initial invoice.

**Code-confirmed:** `ensureReconciliation`, `reconcilePayment` and initial seat-release guards mistake that metadata for renewal. Consequently no durable activation is owed to the worker. This reproduces a billing failure independently of web staleness; it does not establish that every historical incident has the same cause. Academic's activation path and the UI's distinction between payment and enrollment state are unchanged.

**Proposed implementation:** the initial transaction uses the enrollment UUID; renewal creation allocates a different UUID. `Transaction.IsRenewal` applies that existing distinction, including initial failed/expired releases. See [ADR 0080](../adr/0080-initial-invoice-reconciliation-identity.md). No schema or public response changes, replacement reconciliation system, forced UI state or bulk data correction is included.

## Verified automated evidence

- Generated group/private initial payment now enqueues and dispatches activation. Paid callback replay retains one invoice and one successful dispatch in the sequential regression.
- A dedicated disposable PostgreSQL database runs the real migrations, repositories, HTTP clients, row locks, worker and outbox. Provider confirmation and Academic responses are controlled HTTP peers. This is persistence/contract evidence, not external Duitku settlement or actual Academic state evidence.
- Academic 503 preserves a pending job. A newly constructed worker retries with an advanced clock, records terminal failure, then existing re-drive and a successful peer response complete the job. A 409 rejection remains terminal/diagnostic.
- Four concurrent first callbacks and eight paid replays preserve one ledger entry, the correct wallet balance and a single active outbox row. Initial expiry creates a release; renewal expiry does not. Unit regressions also preserve renewal paid/failed exclusions and initial failed-payment release.
- Final PostgreSQL race run on Go 1.26.10 passes in 75.6 seconds. The CI proposal provisions PostgreSQL 18 and supplies `KEL221_TEST_DATABASE_URL`, so the required `gate` executes this test rather than skipping it.
- `go mod verify`, `go vet ./...`, `go test -race -count=1 ./...`, `go build ./...`, formatting and whitespace checks pass. `govulncheck@v1.8.0 ./...` reports zero reachable/imported-package vulnerabilities on Go 1.26.10; one module-only advisory is uncalled.
- The minimum patch increases Go 1.26.9 to 1.26.10 because [GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809) otherwise fails the required standard-library vulnerability check. No application module versions change.

## Actual sandbox journey and outstanding acceptance

**Observed:** all five local Go service health endpoints return 200. Billing has sandbox merchant/API configuration and internal credentials populated; a signed read-only payment-method query returns HTTP 200 / responseCode 00 with 25 methods. No secret is copied into this evidence.

Through the actual gateway, new synthetic parent/tenant accounts create a student, published private class, two-slot request and successful approval. Billing creates a Duitku sandbox BCA VA invoice; PostgreSQL confirms pending enrollment, pending payment and two enrollment-owned schedules. Parent and tenant browser reads display pending payment; tenant schedule projection remains the separate KEL-222 issue.

The official [Duitku testing reference](https://docs.duitku.com/api/en/#testing) links the sandbox simulator. The card checkout renders blank with a script failure, and the BCA simulator responds HTTP 403 with nonresponsive channel controls in both headless and ordinary Chrome. The owner independently reports that sandbox access also fails in their browser.

**Blocked:** no provider-confirmed successful settlement has occurred for the fixture. No signed success was fabricated, no pending payment was promoted, and no Academic enrollment was forced active. Persisted Academic activation, preserved schedules/sessions after settlement and refreshed active parent/tenant UI remain unverified. Controlled HTTP peers do not satisfy these remaining real-flow acceptance criteria.

To resume: restore access to the official sandbox, settle the same synthetic invoice through its supported simulator, verify authoritative `transactionStatus`, and replay/deliver its legitimate signed callback against the candidate billing binary. Compare request/enrollment/transaction/outbox correlation and DB counts, confirm terminal/unauthorized refusal through actual Academic, and refresh both UIs. Complete CI/review/merge and origin/main reachability checks before marking KEL-221 Done or rediscovering task 2.
