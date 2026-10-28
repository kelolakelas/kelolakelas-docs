# KEL-221 initial-payment activation diagnosis and acceptance

## Delivery and dependency evidence

**Observed, 28 October 2026 (Asia/Jakarta):** [billing PR #40](https://github.com/kelolakelas/kelolakelas-billing-service/pull/40) merged into `main` at `2026-10-28T08:12:17Z`, commit `03fb0815e7bb8ceaf83135a0dfc1cf5b27a3a9e2`. The [required PR gate](https://github.com/kelolakelas/kelolakelas-billing-service/actions/runs/40654709145) and [post-merge main gate](https://github.com/kelolakelas/kelolakelas-billing-service/actions/runs/40655125622) passed; the merge commit is reachable from freshly fetched `origin/main`. Main protection requires `gate`, an up-to-date branch and PR delivery, with admin enforcement and force pushes disabled; the required approving review count is zero. This document and [ADR 0080](../adr/0080-initial-invoice-reconciliation-identity.md) are delivered through [docs PR #231](https://github.com/kelolakelas/kelolakelas-docs/pull/231).

Fresh discovery returned 223 issues, including archived/completed/canceled entries, with no further page. Full descriptions and native relations were read. Six issues remained unfinished. KEL-221 already had active draft PRs and was initially excluded; the owner explicitly requested resuming it. KEL-222's real-payment acceptance was initially unverifiable; KEL-100/101/102 lacked verified staging rollout/secret integration and KEL-104 depends on them. No other implementation started before KEL-221 delivery.

KEL-221 has no native blocker. The KEL-8/KEL-29/KEL-215 foundations and KEL-8 → KEL-6 chain are Done, and their actual GitHub PRs were re-read with merge timestamps and commits reachable from freshly fetched `origin/main`: billing #2/#3/#8, gateway #3, web #123, docs #2/#9/#40/#222 (and archived planning #228). Linear Done alone was not used as proof.

## Reproduced failure and owner correction

**Observed:** `TestGeneratedInitialPurchaseStillOwesActivation` fails on the old baseline for generated group and private invoices: `paid=paid enqueues=0 activation calls=0 reconciled=false`. Unlike the older hand-built callback fixtures, it calls `GenerateSubscriptionPayment`, which persists subscription and period metadata on the initial purchase.

**Code-confirmed:** the former `ensureReconciliation`, `reconcilePayment` and initial seat-release guards treated any subscription/period metadata as renewal. No durable initial activation was therefore owed to the worker. This identifies a billing failure independently of browser staleness; it does not establish the cause of every historical incident.

**Implemented:** `Transaction.IsRenewal` requires subscription/period metadata and a transaction ID different from enrollment ID. Existing initial invoice creation uses the enrollment UUID; worker-created renewals allocate a different UUID. Initial paid purchases now reach durable activation and initial failure/expiry releases the seat. Legacy invoices without period metadata retain their previous behavior. No schema/public response change, replacement reconciliation system, forced UI state or bulk historical correction is included.

## Actual sandbox journey

**Observed, 27–28 October:** actual gateway requests created synthetic parent/tenant accounts, a student, published private class, two-slot request and approved initial invoice. Both approved slots persisted. The original sandbox checkout was blocked by HTTP 403/nonresponsive controls. On 28 October the owner completed the existing card fixture through the official sandbox checkout; automated Chrome continued to receive 403 and did not submit the payment.

An independent signed read to Duitku `transactionStatus` returned HTTP 200, `statusCode=00`, `statusMessage=SUCCESS`, matching the stored order, provider reference and IDR 40000 amount. No card number, CVV, credential, token or real customer data is retained here.

| Boundary | Before candidate replay | After candidate replay / reload |
| --- | --- | --- |
| Provider | `00 SUCCESS`, IDR 40000 | Same authoritative confirmed settlement |
| Billing transaction | `paid` | `paid`, same transaction |
| Academic enrollment | `pending` | persisted `active` |
| Activation outbox | Old discriminator omitted initial activation | one `activation`, status `active`, attempt count 1 |
| Agreed schedules | Two approved enrollment-owned slots | Same two slots: Tuesday10:00–11:00 and Thursday14:00–15:00 |
| Sessions | Existing fixture sessions | Two sessions; replay does not add any |
| Parent browser | Earlier pending state | “Aktif” and “Pembayaran diterima dan enrollment telah aktif.” after normal reload |
| Tenant browser | Earlier pending state | “AKTIF” enrollment and “Aktif” payment after normal reload |

The operator delivered a signed replay of this **already provider-confirmed settlement** to the candidate billing callback endpoint with request ID `kel221-card-settled-resume`. This was not a fabricated pending→paid notification, a direct database status update, or evidence that the provider itself delivered the replay to the candidate port. The ordinary billing service had already persisted paid while Academic remained pending, so verified replay also exercised the intended recovery path. Actual Academic HTTP and PostgreSQL, gateway reads and Next.js pages were used; these boundaries were not mocked.

Four concurrent signed paid replays each returned 200. Before/after snapshots were identical: paid transaction, active enrollment, one active job at attempt1, the same two schedule IDs and time slots, two sessions and zero ledger entries. Zero ledger effect is expected for this sandbox invoice; real financial effect uniqueness is covered in the isolated regression. An invalid callback signature returned401 with no state change.

The real parent and tenant pages passed at1440px and390px, including normal reload, with no page errors. The independent unpaid VA fixture stayed pending and displayed “Menunggu pembayaran”; no paid/active status was inferred from a redirect. Tenant mobile screenshot: [verified active fixture](kel221/tenant-mobile.png). The tenant-membership selector's separate unavailable message was observed in the existing local stack and is outside payment activation scope. Missing private schedule projection in the enrollment table remains KEL-222; the slots are present in Academic.

## Automated validation on the final source

Go1.26.10:

- `go mod verify`, `go vet ./...`, `go test -race -count=1 ./...`, `go build ./...`, formatting and `git diff --check` passed.
- Both KEL-221 initial purchase and KEL-226 scoped invoice PostgreSQL suites passed with race detection in a fresh isolated database; the database was removed afterward. The current-main PostgreSQL16 CI service and KEL-226 regression were retained, and `KEL221_TEST_DATABASE_URL` enables the additional regression in the required `gate`.
- Generated group/private initial purchase, Academic503 outage, pending durable intent, restarted worker, terminal diagnostics, existing re-drive and eventual success are verified against real migrations/repositories/locks/outbox and controlled provider/Academic HTTP peers. These tests supplement the real settlement journey; they do not claim a live outage of the shared Academic service.
- Concurrent first settlement and paid replay preserve one ledger effect, correct wallet balance and one outbox row. Initial expiry creates a release; renewal expiry does not. Renewal paid/failed exclusions and initial failed-payment release remain covered.
- Existing Academic focused race tests passed: dropped enrollment activation refusal, pending/completed/unknown/idempotent release and cancellation losing a race to paid activation. These are automated guard tests, not a manual mutation of a historical terminal record.
- `govulncheck@v1.8.0 ./...` reported no called/imported-package vulnerabilities; three module-only advisories were not called. Go1.26.10 is already the current-main minimum; this final diff changes no module or toolchain requirement.

## Rollout and residual scope

No migration is required. Deploy the merged binary through the normal reviewed rollout. A historical paid initial invoice without a job requires individually verified provider settlement and callback replay; an existing terminal job uses the existing internal re-drive API. Never create replacement payments, bulk-edit statuses or force terminal enrollments active. No production rollout or historical bulk repair is claimed. Existing local application processes were preserved; the temporary candidate is stopped after acceptance.
