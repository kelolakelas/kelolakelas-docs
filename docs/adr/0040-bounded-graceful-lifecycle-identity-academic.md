# ADR 0040: Identity and academic stop gracefully within one bounded shutdown deadline

## Status

Accepted and implemented in KEL-69.

## Context

Identity and academic started gin with `r.Run("0.0.0.0:" + PORT)`. That leaves every `http.Server` timeout at zero and installs no signal handler, so every deploy or restart cut in-flight requests (enrollment checkout, billing's internal activate/release calls), and a client that stalled while sending headers or a body held a goroutine and a file descriptor indefinitely. Identity also served gRPC `:50051` from a goroutine that only logged a bind failure, so identity could keep running with HTTP only, and gRPC was never drained. The gateway already built its own `http.Server` with configured timeouts (KEL-37, [ADR 0021](0021-bounded-gateway-proxy-and-error-envelope.md)), and billing already paired `signal.NotifyContext` with `Shutdown`.

## Decision

- Both services build `http.Server{Addr: "0.0.0.0:" + PORT}` through `newHTTPServer` with `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout` and `IdleTimeout` from `SERVER_READ_HEADER_TIMEOUT_SECONDS`, `SERVER_READ_TIMEOUT_SECONDS`, `SERVER_WRITE_TIMEOUT_SECONDS` and `SERVER_IDLE_TIMEOUT_SECONDS`. Defaults follow the gateway: 5, 30, 60 and 120 seconds.
- A zero, negative or unset value uses the default, so configuration can never disable a bound. A value too large for a Go `time.Duration` stops startup, and so does a non-numeric value (viper's decode).
- Academic rejects `SERVER_WRITE_TIMEOUT_SECONDS` at or below the billing client timeout at startup rather than clamping it. That timeout is now the exported constant `billing.RequestTimeout` (the same 10 seconds), so the check and the client cannot drift apart.
- Listeners are bound before any server starts. In identity a gRPC `:50051` bind failure is now fatal (exit 1), like an HTTP bind failure.
- SIGINT/SIGTERM cancel a `signal.NotifyContext` context. The services then stop accepting connections and drain in-flight work under one `SERVER_SHUTDOWN_TIMEOUT_SECONDS` deadline (default 15): HTTP with `Shutdown`, and in identity gRPC with `GracefulStop`, concurrently. When the deadline passes, the remaining HTTP connections are closed and gRPC falls back to `Stop`.
- Exit codes: a clean drain exits 0; a forced stop at the deadline, a serve failure or a bind failure exits 1. In identity a serve failure of one server shuts down the other one too, so identity never runs with half of its interfaces.
- The signal registration stays in place for the whole drain, so a second SIGTERM does not skip the drain; the deadline alone bounds the exit.
- Routes, middleware and ports are unchanged.

## Consequences

- The deployment platform's termination grace period must exceed `SERVER_SHUTDOWN_TIMEOUT_SECONDS`, or SIGKILL still cuts the drain. The default of 15 seconds fits inside a typical 30-second grace period. The actual platform setting is not in any repository and remains **Unknown**.
- A response that takes longer than `SERVER_WRITE_TIMEOUT_SECONDS` (60 by default) is now cut by the server. No such route was found; the slowest outbound calls are billing (10 seconds, academic) and Resend or geocoding (identity).
- An identity host where `:50051` is already taken now fails to start instead of serving HTTP only. That is intended: a half-started identity breaks academic and billing permission checks silently.
- Graceful shutdown of the gateway and HTTP server timeouts in billing remain out of scope for KEL-69.

  > **Superseded in part by ADR 0043:** both are now implemented (KEL-71); see [ADR 0043](0043-gateway-graceful-shutdown-and-billing-server-timeouts.md).

## Evidence

Identity [PR #29](https://github.com/kelolakelas/kelolakelas-identity-service/pull/29), squash `c13e15c2177c27a102b5a9e61bf0709d0bcde9bf`: `cmd/server/{main,lifecycle,lifecycle_test}.go`, `internal/config/{config,server_timeouts_test}.go`, `.env.example`. Academic [PR #28](https://github.com/kelolakelas/kelolakelas-academic-service/pull/28), squash `5219e468642eacd11dce89931a56ee354ec1362b`: `cmd/server/{main,lifecycle,lifecycle_test}.go`, `internal/config/{config,server_timeouts_test}.go`, `pkg/billing/client.go`, `.env.example`. Tests prove an in-flight request completes with 200 during shutdown while new connections are refused and the process exits before the deadline, a request outliving the deadline is force-closed, incomplete headers are cut at `ReadHeaderTimeout`, an in-flight gRPC call completes during `GracefulStop`, the `Stop` fallback, and the config defaults and rejections. PR and main-push `gate` checks passed in both repositories.
