# ADR 0080: distinguish initial purchase and renewal reconciliation

Status: accepted; implemented in billing PR #40, merge `03fb0815e7bb8ceaf83135a0dfc1cf5b27a3a9e2`. Real sandbox settlement and Academic/UI acceptance verified on 28 October 2026.

## Context

Billing `GenerateSubscriptionPayment` creates the initial transaction with `id = enrollment_id`, a subscription ID and `billing_period_start`. `SubscriptionWorker.processInvoice` creates each renewal with a new transaction UUID and merchant order `renewal-<uuid>`. The initial period metadata is already present in historical commit `ea30a0a`; it cannot serve alone as a renewal discriminator.

On baseline billing `2b2344c7d7a7cf553a0e9e66b77fc270c7a130e0`, the initial-purchase regression generates a real invoice-shaped record, then confirms payment through the use case. Both group and private cases become `paid` with zero activation jobs/calls because the renewal guard checks only subscription/period presence.

## Decision

`Transaction.IsRenewal` requires subscription/period metadata and a transaction ID different from the enrollment ID. Initial purchases retain their existing metadata and use durable activation/release. The expiry SQL uses the corresponding predicate. Legacy records without period metadata retain their former initial-purchase behavior.

An explicit new invoice-kind column was considered. It would require migration/backfill while the existing creation paths already persist an unambiguous identity; no new representation is needed for this fix. Any future creation path must preserve this identity rule or introduce an explicit compatible discriminator with migration evidence.

## Consequences

There is no API or schema migration. Provider confirmation, transaction/subscription locks, refund guards, worker leases/backoff and Academic's idempotent/terminal transition rules remain authoritative. Paid replay can recreate missing activation intent for an initial purchase; it must not create a new payment or force an enrollment state.

Historical remediation remains an individually diagnosed operation. There is no automatic backfill. Existing terminal jobs use the existing internal re-drive API. A paid initial transaction without a job needs verified callback replay after rollout, with the normal settlement evidence and correlation checks.

See [diagnosis and acceptance limits](../evidence/kel221-initial-payment-activation.md). Delivered source: billing `03fb0815e7bb8ceaf83135a0dfc1cf5b27a3a9e2`.
