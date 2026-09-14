# Billing API

| Method/path | Authentication | Request/response | Evidence |
|---|---|---|---|
| `POST /api/v1/billing/webhooks/duitku` | public; Duitku HMAC validation | `DuitkuCallbackPayload`; success/error envelope | `transaction_handler.go:220-255` |
| `GET /api/v1/billing/transactions` | user JWT | filtered/list transaction response | `transaction_handler.go` |
| `GET /api/v1/billing/transactions/:id` | user JWT | transaction response | `transaction_handler.go` |
| `POST /internal/billing/transactions` | internal bearer credential | internal invoice request → transaction ID/checkout URL | `cmd/server/main.go:92-94` |

Invoice creation is available only at `POST /internal/billing/transactions`, after academic has verified the enrollment and supplied the internal bearer credential. `DuitkuCallbackPayload` requires merchant code, amount, merchant order ID, result code, reference, and signature according to `internal/domain/payment_gateway.go`. The handler rejects a failed signature before business processing. Full processing and response outcomes are in [payment callback flow](../flows/payment-callback.md).
