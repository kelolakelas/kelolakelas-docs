# ADR 0043: Gateway drains in-flight requests on shutdown and billing bounds its HTTP server

## Status

Accepted and implemented in KEL-71.

## Context

Two gaps from KEL-37 and KEL-69 were still open.

The gateway built its own `http.Server` with bounded timeouts (KEL-37, [ADR 0021](0021-bounded-gateway-proxy-and-error-envelope.md)), but ran `ListenAndServe` with no signal handler. A deploy or restart therefore cut every request still being proxied, including the public Duitku callback.

Billing already paired `signal.NotifyContext` with a 10-second `Shutdown`, but built its server as `&http.Server{Addr, Handler}` with every timeout at zero. A client stalling on the public webhook route could hold a goroutine and a file descriptor indefinitely.

Identity and academic already solved both halves (KEL-69, [ADR 0040](0040-bounded-graceful-lifecycle-identity-academic.md)).

## Decision

- **Gateway: same lifecycle as identity/academic.**
  - `cmd/server/lifecycle.go` `serveUntilDone` serves on a pre-bound listener until SIGINT/SIGTERM cancel a `signal.NotifyContext` context.
  - It then calls `Shutdown` under `SERVER_SHUTDOWN_TIMEOUT_SECONDS` (default 15; a zero, negative or unset value uses the default; a value too large for a duration or non-numeric stops startup).
  - `Shutdown` does not cancel request contexts, so the KEL-37 per-request `PROXY_UPSTREAM_TIMEOUT_SECONDS` stays the only bound on one proxied exchange.
  - At the deadline, the remaining connections are closed and the process exits 1. A clean drain exits 0, and a bind or serve failure exits 1.
  - The KEL-37 server and proxy timeouts, the routes and the proxy handler are unchanged.
- **Billing: bounded server, lifecycle unchanged.**
  - `cmd/server/server.go` `newHTTPServer` applies `SERVER_READ_HEADER_TIMEOUT_SECONDS`, `SERVER_READ_TIMEOUT_SECONDS`, `SERVER_WRITE_TIMEOUT_SECONDS` and `SERVER_IDLE_TIMEOUT_SECONDS`, with defaults of 5, 30, 60 and 120 like the other services and the same fallback and overflow rules.
  - The signal context, the in-process workers and the 10-second `Shutdown` are unchanged. Workers still stop on the same context as the server.
- **Billing write timeout is checked against the webhook's sequential outbound chain, not only the single longest call.**
  - The Duitku webhook confirms the payment with Duitku, sends the outcome email through Resend and activates the enrollment in Academic, one after another on the request context.
  - Startup fails, naming the setting, when `SERVER_WRITE_TIMEOUT_SECONDS` is at or below `DUITKU_HTTP_TIMEOUT_SECONDS + RESEND_HTTP_TIMEOUT_SECONDS + academic.RequestTimeout` (10 s), or at or below `IDENTITY_PERMISSION_TIMEOUT_MS` when that is larger. The value is never clamped.
  - The Academic client's 10-second timeout is exported as `academic.RequestTimeout` so the check and the client cannot drift apart. This mirrors academic's `billing.RequestTimeout` from KEL-69.
  - Alternative rejected: comparing only against the longest single call (the literal KEL-71 wording). It would accept a write timeout that cuts a webhook whose three calls are all slow but each within its own bound.

## Consequences

- The deployment platform's termination grace period must exceed the gateway's `SERVER_SHUTDOWN_TIMEOUT_SECONDS`, or SIGKILL still cuts the drain. The platform setting is not in any repository and remains **Unknown**.
- With the defaults, billing's webhook chain is 30 s against a 60 s write timeout. An operator who raises the Duitku or Resend timeout far enough now gets a startup error and must raise the write timeout too.
- A billing response slower than 60 s, or a request body that takes longer than 30 s to arrive, is now cut by the server. No such route was found.
- Out of scope and still open: leader election for billing's workers, and billing's own shutdown bound (still a fixed 10 s, not configurable).

## Evidence

- Gateway [PR #26](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/26), squash `d7d61fc4a0fc14f440bddb87f6207322f290017e`: `cmd/server/{main,lifecycle,lifecycle_test}.go`, `internal/config/{config,config_test}.go`, `.env.example`. Tests prove:
  - a proxied Duitku webhook in flight at shutdown completes with 200 while new connections are refused;
  - the upstream context is not cancelled;
  - a request outliving the deadline is force-closed with an error;
  - an idle shutdown returns at once;
  - a serve failure is reported;
  - the config defaults and rejections.
- Billing [PR #23](https://github.com/kelolakelas/kelolakelas-billing-service/pull/23), squash `6ac91c3d7981bc0015ee46320ce93e7a74619d3e`: `cmd/server/{main,server,server_test}.go`, `internal/config/{config,server_timeouts_test}.go`, `internal/usecase/reconciliation_worker_test.go`, `pkg/academic/client.go`, `.env.example`. Tests prove:
  - a client that stalls mid-header is disconnected after `ReadHeaderTimeout`, while a prompt client is served;
  - the configured timeouts are applied;
  - the defaults, the overrides, and the write-timeout rule;
  - the reconciliation worker still stops on context cancellation.
- PR and main-push `gate` checks passed in both repositories.
