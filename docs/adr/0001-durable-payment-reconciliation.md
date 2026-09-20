# ADR 0001: Durable payment-to-enrollment reconciliation

## Status

Accepted and implemented in KEL-8. Extended with a job kind in KEL-26 (see
[ADR 0011](0011-release-enrollment-seat-on-failed-payment.md)).

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

## Alternatives considered

- An external message broker would provide durable delivery but adds a new
  infrastructure dependency outside this issue's scope.
- Callback-only retry does not satisfy recovery when the provider does not
  resend a callback.
- A scheduled database query without a claim lease could duplicate activation
  calls when billing has more than one instance.
- A second reconciliation table for seat release was rejected: it would allow a
  transaction to owe an activation and a release simultaneously, which has no
  coherent resolution. See [ADR 0011](0011-release-enrollment-seat-on-failed-payment.md).

## Consequences

The billing database gains a migration and the worker is enabled by default.
Operators can inspect reconciliation fields through the parent-scoped billing
transaction endpoints. Terminal failures require operational follow-up; refund
automation and renewal reconciliation remain out of scope.
