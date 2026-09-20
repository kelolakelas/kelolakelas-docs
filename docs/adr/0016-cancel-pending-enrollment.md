# ADR 0016: Cancelling a pending enrollment by the parent who owns it

## Status

Accepted and implemented in KEL-27.

## Context

A parent could start an enrollment and receive a checkout URL, but had no way to
change their mind. Two mechanisms already returned the seat, and neither was
under the parent's control:

- Local invoice expiry ([ADR 0009](0009-local-invoice-expiry-without-losing-late-payments.md))
  only fires after `invoice_expires_at` passes.
- The failed-payment seat release ([ADR 0012](0012-release-enrollment-seat-on-failed-payment.md))
  only fires after Duitku reports a failure.

Until one of them happened, an abandoned enrollment kept occupying its seat,
because the academic capacity predicate counts `status IN ('pending','active')`.
A parent who wanted a different schedule had to wait for the invoice window to
elapse, and the seat was unsellable in the meantime.

Cancelling is not a local status write. The enrollment and its invoice live in
different databases owned by different services, and the outcome that matters is
not "the row says dropped" but "the seat is back in the catalog and no invoice
can still be paid for it". Three facts constrain the design:

1. **A `pending` enrollment can already be paid for.** The provider invoice stays
   payable until it expires, and Duitku can report `00` at any time. Dropping the
   seat first would revoke a seat for money that had already been collected.
2. **The provider invoice cannot be revoked.** Duitku exposes no cancellation
   call in this codebase, so the parent cancellation can only stop the money from
   being *accepted* as a seat activation, not stop the payment attempt.
3. **Dropping is already the seat-returning transition.** The capacity predicate
   excludes `dropped`, and the unique partial index on `(student_id, class_id)`
   is limited to `pending`/`active`, so a dropped enrollment both frees the seat
   and permits a later re-enrollment.

## Decision

Academic exposes a parent-scoped `POST /api/v1/enrollments/{id}/cancel`, behind
the ordinary JWT and parent identity, and the gateway proxies it to academic
unchanged. Cancellation is an action on an enrollment rather than a status
write, so it is a `POST` on a sub-resource path; `PUT
/api/v1/enrollments/{id}/status` remains unrouted.

Billing exposes an internal `POST /internal/billing/transactions/cancel` behind
the existing internal service credential, taking an enrollment ID and returning
the resulting transaction. The two services split the work along the ownership
boundary: billing decides whether the invoice can still be withdrawn, academic
decides whether the seat can still be released.

### Billing is written first, then academic

The order is deliberate and is the reverse of the intuitive "drop the seat, then
cancel the invoice":

- If academic dropped the seat first and billing then refused because the
  transaction was already `paid`, the seat would be gone for a payment that was
  actually collected. That is unrecoverable from the two services alone: there is
  no refund path, and the parent would have lost both the money and the place.
- Withdrawing the invoice first makes the refusal harmless. A refusal means
  nothing was changed anywhere, and the parent is told so with 409.

Both steps are safe to retry, so a partial failure converges instead of
double-applying:

- The withdrawal is idempotent: an already-cancelled transaction is returned as
  the current transaction and nothing changes, so a retry after a failed seat
  write does not withdraw anything twice.
- The seat write happens under a row lock and only from `pending`, so a retry
  that arrives after the enrollment was already dropped is refused with 409
  rather than rewriting the row a second time.
- An unexpected billing failure fails the request without touching the seat, so
  a transient billing outage costs the parent a retry instead of their hold.

### The withdrawal is a conditional transition, not a status write

`CancelUnpaid` is a single CTE that moves `pending`, `creating`, `failed`, or
`expired` rows to `cancelled` and inserts the seat-release reconciliation job in
the same statement. It is written as one statement for two reasons: a crash
between "cancel the invoice" and "queue the seat release" would otherwise strand
the seat with no job to free it, and the conditional predicate is what makes the
race with a concurrent paid callback safe.

- `paid` and `refunded` rows match no row, so the statement reports that it did
  not cancel anything. The caller then re-reads the transaction and answers 409.
  A settled payment is never downgraded.
- `creating` is included on purpose. A row stuck in `creating` is an invoice
  generation that never completed; without it, a failed provider call would leave
  the enrollment permanently un-cancellable.
- `cancelled` is answered idempotently with the current transaction.

The complementary guard is `MarkInvoiceIssued`, which stores a freshly created
payment link only while the row is still awaiting one. A cancellation and an
in-flight invoice creation therefore cannot resurrect each other: whichever
statement runs second matches no row and reports false. Without it, an invoice
generation that completed just after the withdrawal would put a payable link
back on a cancelled transaction.

When the repository does not implement the locking capability, the fallback path
performs the same conditional transition and enqueues the same release job, so a
repository without the capability still frees the seat instead of reporting a
successful cancellation over a still-held seat.

### Which enrollments can be cancelled

| Current state | Caller | Result |
|---|---|---|
| `pending`, invoice unpaid | owner parent | 200, enrollment `dropped`, transaction `cancelled`, seat released |
| `pending`, no transaction at all | owner parent | 200, enrollment `dropped`; there is nothing to withdraw |
| `pending`, invoice already `paid`/`refunded` | owner parent | 409, nothing changed anywhere |
| `dropped` | owner parent | 409, after the withdrawal is still attempted |
| `active` | owner parent | 409 before any billing call |
| `completed` | owner parent | 409 before any billing call |
| any | a different parent | 404, because the lookup is scoped to the caller |
| any | no parent identity | 403 |

Only a `pending` enrollment is cancellable. An enrollment that is already
`dropped` is answered with 409 like any other finished state: cancellation is
defined as "this request moved the enrollment out of `pending`", and a request
that changes nothing has not cancelled anything. The withdrawal is still
attempted first, because such an enrollment can hold an invoice that was paid
after its seat was released, and those cases must be refused on the invoice state
rather than reported as cancelled.

`active` and `completed` are refused before the billing call, so a fully enrolled
or finished enrollment can never have its invoice touched.

### A payment that arrives after the cancellation

The provider invoice stays payable until it expires, and this decision does not
try to prevent that. A `00` callback that arrives after the cancellation still
moves the transaction to `paid` so the money remains visible in the parent's
transaction list; it does not reactivate the enrollment. The activation attempt
is rejected by academic (`dropped` is not activatable), the rejection is stored
in the reconciliation row's `last_error`, and the transaction response exposes it
as `reconciliation_last_error`. Recording the paid-after-cancel case is the
point: an operator can see it and act, instead of the payment being swallowed.

## Alternatives considered

- **Drop the seat first, then cancel the invoice.** Rejected: on a refusal the
  seat is already gone for a payment that was collected, which no later step can
  undo.
- **Do both writes in one distributed transaction.** Rejected: the two services
  own separate databases, so this needs a distributed transaction coordinator for
  a two-step flow whose steps are already idempotent and whose only real risk is
  a retry.
- **Cancel the invoice at the provider.** Not possible: `pkg/duitku/client.go`
  exposes invoice creation and signature validation only. The consequence is
  recorded above rather than hidden: the link stays payable until expiry.
- **Refund a paid transaction and give the seat back.** Out of scope for this
  issue and rejected as a default because it needs a refund path, a reconciliation
  kind, and an operator policy.
- **Model cancellation as `PUT /api/v1/enrollments/{id}/status`.** Rejected: a
  general status-write endpoint invites callers to set arbitrary statuses, and the
  route is already asserted to be unrouted by
  `kelolakelas-api-gateway/internal/delivery/http/router_test.go`.
- **Return 200 for an already `dropped` enrollment.** Considered, because the
  desired end state is already true and the release endpoint answers success for
  that state. Rejected: the acceptance criteria for this change group "already
  dropped" with the states that answer 409, and reporting success for a request
  that changed nothing hides the case that actually matters — a dropped
  enrollment whose invoice was paid after release. Answering 409 keeps
  "cancellation happened" and "the state you asked for already existed"
  distinguishable, and the billing-first order still gives that dropped case the
  stronger refusal.
- **Treat a missing transaction as an error.** Rejected: an invoice creation that
  failed leaves a `pending` enrollment with no transaction, and erroring would
  leave its seat held forever with no endpoint to release it.

## Consequences

No migration was needed in either service. `transactions.status` and
`enrollments.status` are plain `varchar` columns with no check constraint, so
`cancelled` and the existing `dropped` value are usable as-is, and the
`idx_student_class_active` partial index already excludes `dropped`.

Deployment order is not constrained: both routes are additive. The gateway route
resolves to academic only, and academic only calls billing's new endpoint when a
parent actually cancels.

A cancelled transaction is distinguishable from an expired one, which matters
because both describe an enrollment whose seat was returned. `expired` means the
local deadline passed; `cancelled` means the parent ended the hold. Both appear
in the parent's transaction list, and `reconciliation_kind` still tells an
operator whether an outstanding job is an activation or a release.

Cancellation is not final in the direction of money: a payment that arrives after
cancellation is recorded as `paid` and its activation rejection is stored in
`reconciliation_last_error`. Nothing automatically refunds it, and no operator
notification is emitted when that error appears.

Known gaps this decision leaves open: a paid transaction's refund remains out of
scope, so the operator path for a paid-after-cancel payment is manual; the
provider invoice cannot be revoked, so the checkout link stays payable until
`invoice_expires_at`; deleting or hiding the enrollment in the web UI is a
separate change and this issue deliberately ships no UI; and the pre-existing
backfill gap for `failed`/`expired` transactions recorded in
[ADR 0012](0012-release-enrollment-seat-on-failed-payment.md) is unaffected.
