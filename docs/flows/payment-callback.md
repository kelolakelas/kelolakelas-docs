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
  B->>A: PUT internal enrollment activation
  A-->>B: active enrollment
  B-->>D: success envelope
```

**Authentication:** the route is public by design; callback integrity comes from `DuitkuAdapter.ValidateCallbackSignature`. **Validation:** binding requires callback fields; signature failure is 400; use case loads/locks a transaction, treats paid callbacks as replay reconciliation, parses and compares amount, and handles result code `00` as paid. Evidence: `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go:220-255`, `internal/usecase/transaction_usecase.go:252-373`, `pkg/duitku/client.go:96-112`.

**Writes/side effects:** transaction status/paid timestamp; subscription activation/next billing date; where non-sandbox, wallet/ledger update; after the database transaction the academic enrollment activation call is attempted. The source comment explicitly says sandbox callbacks must not create real tenant balance/ledger entries. A downstream academic activation failure is returned after billing state is committed, creating a reconciliation concern; callback replay attempts activation again for paid rows.
