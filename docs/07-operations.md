# Operations

**Implemented health endpoints:** gateway `GET /health`, identity `GET /health`, academic `GET /health`, and billing `GET /health` return `{"status":"healthy","service":...}` without dependency probes. Evidence: gateway router `:29-35`; `cmd/server/health.go` in services.

Identity and billing install JSON `slog` as default; gateway uses default slog; academic uses slog in startup but no access-log middleware is registered. Gin recovery is registered in every Go HTTP server. No Prometheus/metrics endpoint, distributed tracing, request correlation, readiness probe, liveness dependency check, backup/restore procedure, or alert configuration was found.

Billing handles SIGINT/SIGTERM and performs a 10-second HTTP shutdown. Its subscription worker is optional and runs in-process when enabled; its payment reconciliation worker and its transaction expiry worker are enabled by default and run in-process (`kelolakelas-billing-service/cmd/server/main.go:69-115`). The reconciliation worker retries durable Academic activation state; the expiry worker marks overdue unpaid transactions `expired` in bounded batches with a conditional update that is safe across replicas. Identity/academic/gateway use `r.Run`, with no analogous graceful shutdown shown. Terminal reconciliation failures require operator follow-up through the billing transaction response fields.

Operators monitoring unpaid invoices should treat `status = 'expired'` as expected steady state rather than an incident, and should read `paid` with a non-null `expired_at` as a payment that arrived after the local deadline — not as a data conflict. Expiry timing is tunable through `TRANSACTION_EXPIRY_WORKER_INTERVAL_MINUTES` and the invoice window through `SUBSCRIPTION_PAYMENT_EXPIRY_PERIOD_DAYS`.
