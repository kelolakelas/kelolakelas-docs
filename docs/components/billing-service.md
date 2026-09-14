# Billing service (`kelolakelas-billing-service`)

**Implemented:** Gin HTTP server default `:8082`, GORM/PostgreSQL data store, Duitku client, Resend client, internal academic client, and optional subscription worker. Evidence: `cmd/server/main.go:31-111`.

Publicly reachable from the gateway are the callback `POST /api/v1/billing/webhooks/duitku` and JWT-protected transaction list/get routes. Invoice creation is only available at the internal credential-protected transaction endpoint for the academic enrollment flow. Callback signature checks happen in the handler before the use case; the use case reconciles state/amount and activates an enrollment through academic after eligible payment (`internal/usecase/transaction_usecase.go:252-373`).

The worker is enabled only by `SUBSCRIPTION_WORKER_ENABLED`; it creates/sends payment reminders and expires overdue unpaid transactions at the configured interval (`internal/usecase/subscription_worker.go`). No separate worker deployment, leader election, or distributed lock was found.
