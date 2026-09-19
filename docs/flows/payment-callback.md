# Duitku payment callback

```mermaid
sequenceDiagram
  participant D as Duitku
  participant G as Gateway
  participant B as Billing
  participant DB as Billing DB
  participant A as Academic
  D->>G: POST /api/v1/billing/webhooks/duitku
  G->>B: unchanged request path
  B->>B: bind payload + validate HMAC
  B->>DB: lock/read transaction, verify amount, mark paid
  B->>DB: activate subscription / ledger where applicable
  B->>DB: enqueue payment reconciliation
  B->>A: PUT internal enrollment activation
  A-->>B: active enrollment
  B-->>D: success envelope
  B->>B: retry durable reconciliation when activation fails
```

A separate local job moves overdue unpaid invoices out of `pending`:

```mermaid
sequenceDiagram
  participant W as Expiry worker
  participant DB as Billing DB
  W->>DB: UPDATE ... WHERE status='pending' AND invoice_expires_at <= now FOR UPDATE SKIP LOCKED
  DB-->>W: rows expired
  Note over W,DB: safe across replicas; never matches a paid row
```

**Authentication:** the route is public by design; callback integrity comes from `DuitkuAdapter.ValidateCallbackSignature`. **Validation:** binding requires callback fields; signature failure is 401; use case loads/locks a transaction, treats paid callbacks as replay reconciliation, parses and compares amount, and handles result code `00` as paid. Evidence: `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go:205-247`, `internal/usecase/transaction_usecase.go:384-602`, `pkg/duitku/client.go:96-104`.

**Result code handling.** `00` marks the transaction `paid` and runs the paid side effects. `01`/`02` mark it `failed`, but only when the transaction is still `pending` or `creating`, so a callback can never downgrade a settled `paid` or `expired` row. A code outside `00`/`01`/`02` changes nothing: the service writes a structured `WARN` log with `merchant_order_id`, `transaction_id`, `enrollment_id`, `result_code`, `payment_code`, `reference`, and `transaction_status`, and still answers `200` so Duitku does not retry. Evidence: `internal/usecase/transaction_usecase.go:480-602`.

**Late payment after local expiry.** Billing records `transactions.invoice_expires_at` (the same window sent to Duitku) and `transactions.expired_at`. The expiry worker moves overdue `pending` rows to `expired` with a single conditional update guarded by `status = 'pending'` plus `FOR UPDATE SKIP LOCKED`, so it is idempotent and safe with several replicas. A `00` callback that arrives after that still wins: the transaction becomes `paid`, `expired_at` is retained as evidence, and subscription, wallet/ledger, and reconciliation side effects run normally. `01`/`02` cannot undo it. See [ADR 0009](../adr/0009-local-invoice-expiry-without-losing-late-payments.md). Evidence: `internal/repository/transaction_repository.go:125-166`, `internal/usecase/transaction_expiry_worker.go`, `internal/usecase/transaction_usecase.go:480-573`.

**Writes/side effects:** transaction status/paid timestamp; subscription activation/next billing date; where non-sandbox, wallet/ledger update; and a durable `payment_reconciliations` row in the same billing transaction. The source comment explicitly says sandbox callbacks must not create real tenant balance or ledger entries. Academic activation is attempted after the billing transaction commits. A failure is stored with the next retry time and does not require a provider callback replay; the in-process reconciliation worker retries it with a claim lease. Repeated callbacks reuse the existing transaction, subscription, ledger uniqueness, and reconciliation row.

The billing transaction response includes `reconciliation_status` (`active`,
`reconciling`, or `terminal_failed`), attempt count, next attempt time, and the
latest redacted error message where available. It also exposes
`invoice_expires_at` and `expired_at` so a parent-scoped list or detail view can
show the invoice deadline and whether billing already expired it locally.
Academic's internal activation endpoint remains idempotent: an already-active
enrollment is returned as a successful result.
