# Operations

**Implemented health endpoints:** gateway `GET /health`, identity `GET /health`, academic `GET /health`, and billing `GET /health` return `{"status":"healthy","service":...}` without dependency probes. Evidence: gateway router `:29-35`; `cmd/server/health.go` in services.

Identity and billing install JSON `slog` as default; gateway uses default slog; academic uses slog in startup but no access-log middleware is registered. Gin recovery is registered in every Go HTTP server. No Prometheus/metrics endpoint, distributed tracing, request correlation, readiness probe, liveness dependency check, backup/restore procedure, or alert configuration was found.

Billing handles SIGINT/SIGTERM and performs a 10-second HTTP shutdown. Its subscription worker is optional and runs in-process when enabled (`kelolakelas-billing-service/cmd/server/main.go:94-111`). Identity/academic/gateway use `r.Run`, with no analogous graceful shutdown shown.
