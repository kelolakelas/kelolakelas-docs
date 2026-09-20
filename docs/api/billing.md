# Billing API

| Method/path | Authentication | Request/response | Evidence |
|---|---|---|---|
| `POST /api/v1/billing/webhooks/duitku` | public; Duitku HMAC validation | `DuitkuCallbackPayload`; success/error envelope | `transaction_handler.go:205-247` |
| `GET /api/v1/billing/transactions` | user JWT | filtered/list transaction response; `status` filter accepts `expired` | `transaction_handler.go:29-103` |
| `GET /api/v1/billing/transactions/:id` | user JWT | transaction response | `transaction_handler.go:105-158` |
| `POST /internal/billing/transactions` | internal bearer credential | internal invoice request → transaction ID/checkout URL | `cmd/server/main.go:100-102` |

Invoice creation is available only at `POST /internal/billing/transactions`, after academic has verified the enrollment and supplied the internal bearer credential. `DuitkuCallbackPayload` requires merchant code, amount, merchant order ID, result code, reference, and signature according to `internal/domain/payment_gateway.go`. The handler rejects a failed signature before business processing. Full processing and response outcomes are in [payment callback flow](../flows/payment-callback.md).

For paid transactions, the list/detail response also exposes `reconciliation_status`, `reconciliation_attempts`, `reconciliation_next_attempt_at`, and `reconciliation_last_error`. `active` means Academic activation succeeded, `reconciling` means durable retry is pending/in progress, and `terminal_failed` means the configured retry limit was reached.

`reconciliation_kind` names the Academic action an outstanding job owes: `activation` confirms a paid seat, `release` gives the seat back after the payment failed or the invoice expired (KEL-26, [ADR 0012](../adr/0012-release-enrollment-seat-on-failed-payment.md)). It is omitted when no reconciliation row exists, so an operator can tell a payment that is still settling from a failed payment that freed the seat again.

Every transaction response also exposes `invoice_expires_at` (the deadline sent to Duitku and enforced locally) and `expired_at` (set when the local expiry worker moved an unpaid transaction to `expired`). Both are omitted when unset. A transaction can legitimately be `paid` with a non-null `expired_at` when a valid payment callback arrived after the local deadline; see [ADR 0009](../adr/0009-local-invoice-expiry-without-losing-late-payments.md). Callback result codes outside `00`/`01`/`02` change nothing and are recorded as structured `WARN` logs.
