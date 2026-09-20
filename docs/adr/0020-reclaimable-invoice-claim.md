# ADR 0020: A reclaimable invoice claim instead of a stranded `creating` row

## Status

Accepted and implemented in KEL-24.

## Context

`creating` is billing's transient exclusivity status: a request moves a
transaction to `creating` before calling Duitku so that two concurrent enrollment
attempts cannot each create an invoice for the same enrollment. The status was
written but never unwound, which made it a terminal state with no exit:

- If the provider call failed, the row stayed `creating`. `ClaimInvoice` only
  matched `pending` and `failed`, so the row could not be claimed again, and the
  enrollment was permanently un-invoiceable.
- If the process died between taking the claim and storing the payment link, the
  row stayed `creating` with no link and no way for anyone to tell whether the
  request was still in flight.
- The failure was invisible. `transactions` had no column recording why invoice
  creation failed (`last_error` exists only on `payment_reconciliations`), so the
  reason was reachable only in logs, and the only observable symptom was an
  enrollment that the parent could neither pay nor reuse.

The parent-facing consequence was worse than a stuck record. The academic seat
capacity predicate counts `status IN ('pending','active')`, and admission uses a
unique partial index over the same set, so an enrollment whose invoice could
never be created kept holding the seat.

Recovery has to satisfy two requirements that pull in opposite directions:

1. A `creating` row must become claimable again, or the enrollment is stranded
   forever.
2. A `creating` row whose request is *genuinely still in flight* must not be
   claimable, or the recovery itself creates the duplicate invoice that
   `creating` exists to prevent.

Nothing in the row distinguished those two cases, because a row being created
carried no information about when creation started.

## Decision

The claim is recorded in the row and is made reclaimable by age.

Migration `20260922000000_invoice_claim_recovery` adds two nullable columns and a
partial index:

- `invoice_claimed_at` — when the current attempt took exclusive ownership.
- `invoice_failure_reason` — why the last attempt failed.
- `idx_transactions_stale_invoice_claim` — on `invoice_claimed_at`, limited to
  `status = 'creating'`, which is the only query that reads the column by range.

`ClaimInvoice` and `ClaimReinvoice` accept a `claimTimeoutMinutes` and gain one
extra matching arm: a `creating` row whose `checkout_session_url IS NULL` and
whose `invoice_claimed_at` is `NULL` or older than the timeout. Exclusivity is
unchanged in kind — it is still a single conditional `UPDATE` whose
`RowsAffected == 1` decides the winner, so the decision remains inside the
database and no lock or lease table is introduced.

The timeout comes from `TRANSACTION_CLAIM_TIMEOUT_MINUTES`
(`internal/config/config.go:47`), defaulting to
`domain.DefaultTransactionClaimTimeoutMinutes` (10) both in config and again
inside the repository, so a zero value is never interpreted as "no timeout".

### The claim is released on the provider failure path, not only by the timeout

The timeout alone would mean every ordinary provider error made the enrollment
un-invoiceable for ten minutes. `RestoreFailedInvoiceClaim` therefore returns the
row to `failed` as soon as the provider call fails, and the next request can claim
it immediately.

The release is deliberately narrower than the claim. It matches only
`status = 'creating' AND checkout_session_url IS NULL`, so:

- An invoice that was issued in the meantime is never pulled back to `failed`.
- A cancellation that won the race is never overwritten. (`CancelUnpaid` also
  matches `creating`, and ADR
  [0016](0016-cancel-pending-enrollment.md) documents why the withdrawal must
  win.)
- A late provider response means the link really does exist, and the predicate
  notices.

The release is best-effort: it never replaces the provider error the caller
already has, so the parent still learns why the invoice was not created.

### The release records the attempt rather than erasing it

`RestoreFailedInvoiceClaim` sets `invoice_failure_reason` but deliberately leaves
`invoice_claimed_at` populated. The timestamp then reads as "when the last attempt
ran", which is what an operator needs to reconstruct a failure, while `failed` is
what makes the row claimable again. Clearing the timestamp would have made the
timestamp column mean "an attempt is currently in flight", a claim the row cannot
support once the attempt is over.

`MarkInvoiceIssued` clears both fields in the same write that stores the payment
link, because the row is no longer being created and neither field has a meaning
afterwards.

### The backfill uses each row's own age

The migration backfills existing `creating` rows with
`invoice_claimed_at = updated_at` rather than `now()`. This is the whole reason
the column is a timestamp and not a boolean:

- Stamping with `now()` would make every pre-existing row freshly claimed,
  including one whose request is still in flight, delaying recovery by a full
  timeout and hiding the age of genuinely stuck rows.
- Using `updated_at` makes a long-stuck row reclaimable immediately — the age is
  real, so it is correctly judged stale — while a row touched seconds ago waits
  out the timeout like any other fresh claim.

## Alternatives considered

- **A boolean `invoice_claimed` flag.** Rejected: it cannot distinguish a live
  claim from an abandoned one, so it cannot satisfy both requirements above
  without a second column. A timestamp answers the age question with no extra
  state and is what the partial index needs.
- **A lease/expiry column with a background reaper.** Rejected: it adds a worker,
  a deployment concern, and a second code path that can strand a row, to solve a
  problem the next request can solve for itself. Every caller that could be
  blocked by a stale claim already performs the conditional update that reclaims
  it.
- **An advisory lock or `SELECT ... FOR UPDATE` held across the provider call.**
  Rejected: it holds a transaction open across a network call to a third party,
  which turns a slow provider into connection-pool exhaustion. It also fails
  exactly the case that matters, because a process that dies takes the lock's
  owner with it and the lock has no durable evidence of who held it.
- **Clearing the claim on provider failure without a timeout.** Rejected: it only
  covers the failure the process survives. A crashed process never reaches the
  release, so the timeout is required regardless.
- **Also treating a stored payment link as reclaimable.** Rejected: a `creating`
  row that already holds a `checkout_session_url` means the provider answered and
  the link was stored. Reclaiming it would create a second invoice for the same
  merchant order ID, and `MarkInvoiceIssued` already reported success.
- **Failing the request without releasing the claim.** Rejected: a transient
  Duitku error would cost the parent ten minutes of retry backoff for no reason,
  and the failure path is the common case rather than the exceptional one.
- **Reusing `payment_reconciliations.last_error` for the failure reason.**
  Rejected: a reconciliation row is a durable job owed to academic, and invoice
  creation is a billing-local failure that has no academic work attached. Coping
  with "no job exists yet" would have made the reason unreachable in exactly the
  case it was added for.
- **Exposing `creating` in the API but not the failure fields.** Rejected: an
  operator seeing a `creating` transaction through the API would still need
  database access to learn why, which is the diagnosis problem this change was
  meant to remove.

## Consequences

The `transactions` status set gains no new value; `creating` was already written.
What changes is that it is now reachable as a filter value through
`domain.TransactionStatusFilterValues`, and `internal/domain/transaction_status_test.go`
parses `transaction.go` with `go/parser` and fails if the statuses the code writes
and the accepted filter set diverge, so a status can no longer be written without
being filterable.

`TRANSACTION_CLAIM_TIMEOUT_MINUTES` becomes operationally meaningful. Setting it
below the longest legitimate gateway response would allow an in-flight attempt to
be invoiced twice, so the correct response to a slow provider is to raise the
timeout rather than lower it. This is a real operational risk and is documented in
[billing and subscriptions](../flows/billing-and-subscriptions.md) rather than
left implicit.

A duplicate invoice is still possible in one case: a process that is alive but
stalled past the timeout, whose provider call later succeeds. A second invoice
then reuses the same merchant order ID, because `ClaimReinvoice` does not rewrite
it, and that is what Duitku deduplicates on. This is why the timeout is measured
in minutes rather than seconds.

`invoice_claimed_at` is retained on a released claim, so it is evidence of the
last attempt rather than only of a live one. A reader that treats it as "a claim
is in flight" would be wrong; `status = 'creating'` is the field that says that.

The claim is billing-local and the migration is additive, so deployment order is
not constrained and no consumer outside billing reads either column.
