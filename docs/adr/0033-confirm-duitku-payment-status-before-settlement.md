# ADR 0033: Confirm Duitku payment status before settlement

Status: Implemented (KEL-56)

## Context

Duitku's callback signature covers merchant code, amount and merchant order ID, but not `resultCode`. Treating a signed `00` callback alone as proof of settlement could mark a transaction paid and credit a tenant wallet without a successful provider payment. Billing already has a bounded Duitku HTTP client (KEL-55).

## Decision

For a successful callback on an unpaid transaction, read the local transaction, then query Duitku `POST /transactionStatus` once before acquiring the transaction row lock. Inside the existing locked payment transition, require provider status `00` and matching merchant order ID, gross amount and nonempty reference; compare the reference against the saved payment intent and callback reference when available. Any provider error, non-success or mismatch fails the callback without changing financial state, allowing a future callback retry. A row that became paid while the query was in flight follows the existing idempotent replay branch; an already-paid row avoids the provider call. The callback signature and `01`/`02` paths stay unchanged.

## Consequences

The provider call does not hold a database row lock, but concurrent callbacks may each make one status request; the locked transition remains responsible for once-only wallet/ledger effects. Duitku outages delay settlement and yield a non-2xx callback response. No polling or scheduled status reconciliation is introduced, so provider retries are needed for eventual settlement. Sandbox validation was not possible without credentials; the client request/response and use case guard have automated tests.

Evidence: `kelolakelas-billing-service/pkg/duitku/client.go` (`TransactionStatus`), `internal/usecase/transaction_usecase.go` (`HandleDuitkuWebhook`, `handleDuitkuWebhookLocal`), `pkg/duitku/status_test.go`, `internal/usecase/transaction_status_confirmation_test.go`; billing PR #15, squash `66597cdd5a5a0ee570534d34824c8e64b4bf5737`.
