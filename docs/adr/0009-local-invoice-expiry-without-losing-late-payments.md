# ADR 0009: Local invoice expiry must never discard a late payment

## Status

Accepted and implemented in KEL-25.

## Context

Pending billing transactions previously had no local validity deadline. A
transaction stayed `pending` until Duitku sent a callback, so an abandoned
invoice kept an enrollment waiting indefinitely, and the subscription renewal
worker reused the `expired` status without any local process ever producing it.

The gateway inquiry already receives an `expiryPeriod` and Duitku stops accepting
payment after that window, but the billing database did not record the deadline
and had no way to move overdue rows out of `pending` on its own.

Making expiry local introduces a financial-correctness risk: a legitimate
payment can still be authorized close to the boundary, and its callback can
arrive in the seconds after billing has already marked the transaction
`expired`. Dropping such a payment, or refusing to reconcile it, would take the
parent's money without activating the enrollment.

## Decision

Billing records the invoice deadline in `transactions.invoice_expires_at` and the
actual expiry moment in `transactions.expired_at`. The deadline comes from the
same `expiryPeriod` value that is sent to Duitku, so the local window and the
channel window cannot drift apart.

An in-process expiry worker (`TRANSACTION_EXPIRY_WORKER_ENABLED`, default
enabled, interval `TRANSACTION_EXPIRY_WORKER_INTERVAL_MINUTES`, default 5
minutes) moves overdue `pending` transactions to `expired`. The claim is a single
conditional update — `WHERE status = 'pending' AND id IN (SELECT ... WHERE
status = 'pending' AND invoice_expires_at <= now ... FOR UPDATE SKIP LOCKED)` —
so the job is idempotent, batches safely, and lets concurrent replicas claim
disjoint rows. A transaction that has been paid in the meantime no longer
matches `status = 'pending'` and is never expired.

Local expiry is deliberately one-directional: it only moves rows **out of**
`pending`. A `resultCode=00` callback for a transaction that is already `expired`
is still honoured. It sets the transaction to `paid`, keeps `expired_at` as
evidence of the event order, and runs the ordinary subscription, wallet, ledger,
and durable reconciliation side effects. Expiry is a local bookkeeping signal,
not a verdict that the payment did not happen.

`resultCode=01`/`02` are also narrowed to transactions that are still `pending`
or `creating`, so no callback can downgrade a settled `paid` or `expired` row.

Expired transactions can be re-invoiced through the existing idempotent
flow while the enrollment is still valid: the repository claims the row with a
conditional update restricted to `expired`, or to `pending`/`failed` rows whose
payment link is missing or whose deadline has passed.

## Alternatives considered

- **Rely on the Duitku `expiryPeriod` only.** The provider rejects late
  payments, but billing would keep the row `pending` forever and the parent
  transaction list would keep showing a payable invoice that can no longer be
  paid.
- **Delete or ignore overdue pending transactions.** Destroys audit history and
  makes a late-but-valid callback unresolvable.
- **Reject a paid callback for an `expired` transaction and require the parent to
  pay again.** Rejected: it can charge the parent twice for the same enrollment
  obligation and is the direct financial-correctness risk this issue names.
- **A separate scheduler process or an external queue.** Adds deployment and
  infrastructure surface; the existing in-process worker pattern already covers
  reconciliation and renewal.

## Consequences

The billing database gains a migration that adds two nullable timestamp columns
and a partial index on `invoice_expires_at` limited to unpaid rows. The worker is
enabled by default and requires no separate deployment.

Because a callback may arrive after local expiry, `status = 'paid'` plus a
non-null `expired_at` is a normal, expected combination and must be read as
"paid after the local deadline", not as a data inconsistency. Operators should
treat `expired_at` as chronological evidence rather than as a reason to refund.

Unpaid transactions now reach a terminal-looking state on their own, so any
consumer that filters on `pending` must also consider `expired`. The expiry
worker now also enqueues a durable seat release for the expired transaction in
the same statement, which KEL-26 implemented on top of this decision; see
[ADR 0012](0012-release-enrollment-seat-on-failed-payment.md). Expiry
notifications and parent-initiated cancellation remain out of scope.
