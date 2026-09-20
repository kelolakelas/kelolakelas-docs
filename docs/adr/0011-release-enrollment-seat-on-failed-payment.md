# ADR 0011: Releasing an enrollment seat when payment fails or expires

## Status

Accepted and implemented in KEL-26.

## Context

The durable reconciliation job ([ADR 0001](0001-durable-payment-reconciliation.md))
exists to confirm a paid seat, and local invoice expiry
([ADR 0009](0009-local-invoice-expiry-without-losing-late-payments.md)) moves
overdue invoices out of `pending`. Neither of them gave the seat back.

A parent who selected a schedule, received a checkout URL, and never paid kept
the enrollment row `pending`. The academic capacity predicate counts
`status IN ('pending','active')`, so that abandoned enrollment kept occupying the
seat: the schedule showed as full to every other parent, and the place could not
be sold again even though no money was ever collected. Expiry ended the
*invoice*, not the *hold*.

Two properties made this awkward:

- Billing and Academic own separate databases, so the seat cannot be returned in
  the same transaction that marks a payment failed. The call can fail.
- Payment outcomes are not final in either direction. A `01`/`02` callback can be
  followed by a late `00` callback
  ([ADR 0009](0009-local-invoice-expiry-without-losing-late-payments.md)), and a
  parent can request a new invoice for the same enrollment at any moment.

A release that races a payment must never take the seat from a paying parent,
and a release that is issued but never delivered must not leak the seat forever.

## Decision

Seat release reuses the existing durable reconciliation row rather than adding a
second delivery mechanism. The row gains a `kind` column with two values:

- `activation` — confirm the seat after a confirmed payment (existing).
- `release` — give the seat back after a failed or expired payment.

Because `payment_reconciliations.transaction_id` is unique, one transaction
describes at most one outstanding Academic action. The two directions are
mutually exclusive by construction, and release jobs inherit the retry loop,
backoff, five-minute claim lease, attempt limit, and operator-visible
`last_error` that already existed for activation.

Academic exposes `PUT /internal/enrollments/{id}/release`, behind the same
internal service credential as activation. It moves a `pending` enrollment to
`dropped`. Dropping is what returns the seat: the capacity predicate already
counts only `pending` and `active`, and the unique partial index on
`(student_id, class_id)` is already limited to those two statuses, so a dropped
enrollment frees the seat and does not block a later re-enrollment.

How each direction is enqueued:

- **Expiry** inserts the release row inside the same statement that expires the
  transaction (a single CTE), so a seat can never be stranded by a crash between
  the two writes.
- **A failed payment callback** enqueues the release with `ON CONFLICT DO
  NOTHING`, so a late failure can never overwrite — and therefore never undo —
  an activation that is already recorded or already accepted.
- **A paid callback** claims only `activation` jobs, so the paid path can never
  dispatch a release. The worker's own sweep stays kind-agnostic and drains both.

Release is idempotent and asymmetric:

- Repeating a release notification succeeds without a second transition, so the
  retry loop converges instead of accumulating errors.
- A release never revokes an `active` enrollment. A late failure for a payment
  that already activated the seat is a no-op, not a refund-by-accident.
- A dropped enrollment that is later activated is rejected with 409 and the
  rejection is recorded in `last_error`, so "the parent paid after the seat was
  released" is visible to an operator instead of silently swallowed.
- Re-invoicing withdraws a release job that has **not** been claimed yet, so a
  replacement invoice cannot race the worker into dropping a seat the parent is
  about to pay for. A release that already ran is left alone, because that seat
  is genuinely gone and the later paid callback must surface the rejection.

## Alternatives considered

- **Let the expiry worker call Academic directly.** Billing and Academic use
  separate databases, so the call can fail with nothing recording that the seat
  is still held. The seat would leak with no retry and no operator-visible trace.
- **Release synchronously in the failed-callback handler.** A transient Academic
  outage would leave the hold in place until the next notification arrives, which
  for an abandoned invoice is never.
- **A second `payment_reconciliation_releases` table.** Two rows per transaction
  would let an activation and a release coexist with no defined precedence, and
  it would duplicate the lease, backoff, and attempt-limit logic.
- **Backfill releases for rows that were already `failed`/`expired` before this
  change.** Rejected: there is no way to tell from billing alone whether an old
  enrollment is still legitimately held, so deploying this feature would silently
  mass-drop seats in production. Left as a known gap for an explicit, supervised
  operation instead.
- **Release by expiring the enrollment instead of dropping it.** `expired` is not
  part of the capacity predicate, so a later support action could not distinguish
  "expired because unpaid" from "expired because the schedule ended". `dropped`
  is the status the academic enrollment model already uses for a
  released-by-billing seat.
- **Cancel the seat when a `01`/`02` callback arrives, regardless of status.**
  A settled `paid` or `expired` row must not be downgraded; the release is
  enqueued only from a transaction that actually transitions to `failed`.

## Consequences

Billing gains migration `20260921000000_reconciliation_kind`
(`kind varchar(20) NOT NULL DEFAULT 'activation'` plus an index on
`(kind, status, next_attempt_at)`) and the transaction response exposes
`reconciliation_kind`. The default keeps the meaning of every pre-existing row,
so the migration is backwards compatible. Academic gains one internal endpoint
and one use-case method; no capacity query, index, or schema change was needed.

Deployment order is not constrained: the endpoint is additive, and billing only
calls it for rows whose `kind` is `release`.

Operators now have a second kind of outstanding reconciliation to interpret.
`reconciliation_kind` distinguishes "waiting to confirm a paid seat" from
"waiting to return an unpaid seat", and a `release` row that reaches
`terminal_failed` means a seat is still held for a payment that failed, which is
the case that needs intervention.

Known gaps this decision leaves open: existing `failed`/`expired` transactions
are not retro-actively released, refunds and parent-initiated cancellation remain
out of scope, and the reconciliation worker still has no leader election, so
release jobs are safe only because the claim uses `FOR UPDATE SKIP LOCKED`.
