# ADR 0001: Durable payment-to-enrollment reconciliation

## Status

Accepted and implemented in KEL-8. Extended with a job kind in KEL-26 (see
[ADR 0012](0012-release-enrollment-seat-on-failed-payment.md)) and with an
operator-visible list, re-drive, and transition log in KEL-29.

## Context

Billing commits a successful Duitku transaction and then calls Academic to
activate the enrollment. The two services use separate databases, so a
successful billing commit can be followed by an unavailable or failed Academic
call. A callback replay was previously the only retry mechanism.

## Decision

Billing owns a `payment_reconciliations` table and creates one row in the same
database transaction as the paid transaction and its subscription/ledger side
effects. An in-process billing worker claims pending rows with a PostgreSQL row
lock and a five-minute lease, calls the existing internal activation endpoint,
and records `active`, retryable `pending`, or `terminal_failed` after the
configured attempt limit. Retry delay uses exponential backoff capped at six
hours. Callback replays use the same idempotent state and may trigger an
immediate claimed attempt; they do not create another transaction, subscription,
or ledger entry.

The transaction query response exposes the reconciliation state and latest
failure details. `active` means Academic acknowledged activation;
`reconciling` means the activation remains pending or is being retried; and
`terminal_failed` means the configured attempt limit was reached.

The row carries a `kind` that names the Academic action it owes. `activation`
confirms a paid seat and is the original behaviour; `release` gives the seat back
after the payment failed or the invoice expired, which KEL-26 introduced on the
same row and the same retry loop. The unique `transaction_id` therefore
constrains a transaction to at most one outstanding action at a time.

A `terminal_failed` row is a state nothing retried again, so KEL-29 added a
recovery path that does not depend on the provider resending a callback. Two
internal-credential endpoints, `GET /internal/billing/reconciliations` and
`POST /internal/billing/reconciliations/requeue`, list jobs by status and move
failed ones back to `pending`. The status guard is part of the update statement,
not a read-then-write in the caller, so replaying the re-drive cannot reset a job
that is pending, in flight, or already completed, and the attempt count is kept
so the configured limit still bounds the next round. The accepted status filter
is derived from the statuses the state machine writes, so a status an operator
observes on a row is always one the endpoint accepts.

Every transition is logged as one structured JSON line carrying the transaction
and enrollment ids, the kind, the status, and the attempt count. The repository
is the only logging site because it is the only layer that knows whether a
statement actually changed a row: an insert skipped by `ON CONFLICT` or a
conflict update that matched nothing is not a transition and stays silent.
Retries log at `WARN` with the next attempt instant, the attempt limit logs at
`ERROR`, and successful completion logs at `INFO`. Transition lines add no
credential, provider payload, or request header value.

## Alternatives considered

- An external message broker would provide durable delivery but adds a new
  infrastructure dependency outside this issue's scope.
- Callback-only retry does not satisfy recovery when the provider does not
  resend a callback.
- A scheduled database query without a claim lease could duplicate activation
  calls when billing has more than one instance.
- A second reconciliation table for seat release was rejected: it would allow a
  transaction to owe an activation and a release simultaneously, which has no
  coherent resolution. See [ADR 0012](0012-release-enrollment-seat-on-failed-payment.md).

## Consequences

The billing database gains a migration and the worker is enabled by default.
Operators can inspect reconciliation fields through the parent-scoped billing
transaction endpoints, and KEL-29 adds the internal list and re-drive endpoints
for the state that no worker will revisit on its own. Re-driving preserves the
attempt count, so a repeatedly failing activation stays bounded and still ends
at `terminal_failed` rather than looping forever. Every transition is visible in
the service log with the ids an operator already has from the transaction
response. Terminal failures still require operational follow-up; refund
automation and renewal reconciliation remain out of scope.
