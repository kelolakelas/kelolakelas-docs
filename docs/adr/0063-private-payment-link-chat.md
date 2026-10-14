# ADR 0063: Private payment links use a trusted internal chat write

Status: Implemented (KEL-129)

## Decision

Academic owns eligibility, not the web or chat client. The tenant-only public POST `/api/v1/schedule-requests/:id/send-payment-link` accepts no payload. It requires live `enrollment:update` and `chat:manage`, resolves the approved tenant request and its pending enrollment, and reads the current billing transaction with the caller Bearer token. Billing additionally requires `billing:read`. Invoice state, tenant, parent, student, enrollment, checkout URL and future expiry must match before delivery. This operation never creates or replaces an invoice.

Academic calls chat `POST /internal/schedule-request-payment-links` using `X-Internal-Service-Credential`. The JSON contract is `request_id`, `tenant_id`, `parent_user_id`, `transaction_id`, `checkout_session_url`, `invoice_expires_at` (RFC3339 timestamp from billing). This endpoint is not gateway-proxied. Missing/invalid fields are rejected; expired delivery is 409. Chat independently resolves academic context and tenant name, rejects mismatched scope, and formats the plain-text system message itself.

The store transaction upserts/locks the unique schedule-request conversation without replacing its frozen parent, verifies the participants, and checks the trusted expiry using PostgreSQL `clock_timestamp()` after lock acquisition and again in the INSERT predicate. This avoids the transaction-start timestamp allowing a write after a lock wait. New and replayed expired sends fail closed and roll back. The message key `private-payment:<request UUID>:<transaction UUID>` makes retries/concurrent sends return one persisted system message; `last_message_at` and WebSocket fan-out change only for a new insertion. Existing conversation, inbox, pagination and visibility rules remain in use.

## Consequences and limits

No distributed transaction spans billing and chat: invoice status is observed before delivery; expiry is additionally enforced at the local write boundary, not a guarantee that an already-shared URL remains payable. No automatic sender, new chat UI, invoice regeneration, billing schema change or payment-provider settlement claim is included. Deploy chat before academic; configure academic `CHAT_SERVICE_URL` and the matching existing internal credential. An unavailable upstream is fail-closed and retry is safe.

## Evidence

- Chat `internal/chat/payment_link.go`, `internal/postgres/payment_link.go`, HTTP handler and regression tests; PR #6, squash `4a3f9d6b6bdf12ec21cfdb390127ee24e025c807`.
- Academic `internal/usecase/private_payment_link.go`, `pkg/paymentlink/client.go`, handler and expiry tests; PR #52, squash `9f9031d7ff1d6875ee623db2d2bb8ef3d7711334`.
- Gateway PR #44, squash `622e61d835e815a40f3e8778a599f908c9273f11`; web PR #93, squash `81c19df846d0156571f099e1cadbe8db7b97a75b`.
- Real-stack evidence `.kel-autopilot/kel129/manual-e2e.md`, stack `50beede1be82` (removed): tenant send, parent existing inbox, concurrent retry, isolation/refusal, delayed expiry and lock-wait regression. PostgreSQL integration binary was static/non-race in the container; host suites ran with race enabled. No separate review session (owner decision).
