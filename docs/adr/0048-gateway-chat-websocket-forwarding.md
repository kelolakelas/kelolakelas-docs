# ADR 0048: Gateway chat forwarding with a WebSocket exception to the bounded proxy

Status: Accepted (KEL-122, 2026-09-28)

## Context

Chat-service serves its REST routes and a ticket-based WebSocket upgrade
(see [ADR 0047](0047-ticket-based-chat-websocket-auth.md)), but no gateway
route reached it: docs stated the gateway and web do not expose chat routes.
KEL-122 connects the gateway to chat-service. Two properties of the upgrade
conflict with the bounded-proxy rule in
[ADR 0021](0021-bounded-gateway-proxy-and-error-envelope.md):

1. The `PROXY_UPSTREAM_TIMEOUT_SECONDS` per-request deadline would cut every
   long-lived socket instead of protecting it: a hijacked WebSocket
   connection outlives any single request bound by design.
2. Browsers cannot send an `Authorization` header on upgrade, so gateway JWT
   validation cannot authenticate the handshake; chat-service owns the
   single-use ticket in the query string instead.

## Decision

- Seven REST chat routes (`GET`/`POST /api/v1/chat/conversations`,
  `GET /api/v1/chat/conversations/:id`,
  `GET`/`POST /api/v1/chat/conversations/:id/messages`,
  `POST /api/v1/chat/conversations/:id/read`,
  `POST /api/v1/chat/ws-tickets`) are proxied behind the existing
  `AuthMiddlewareWithSessionCheck` + `RequireTenant` protected group, using
  the standard bounded `proxyRoute` (deadline, body limit, one error
  envelope). The ticket endpoint is gateway-authenticated; chat-service
  validates the JWT again when minting the ticket.
- `GET /api/v1/chat/ws` is forwarded with the standard-library reverse proxy
  directly, with **no upstream deadline** and **no gateway authentication**.
  It keeps an explicit `Origin` check mirroring `CORSMiddleware` (a foreign
  `Origin` is rejected with 403 before any byte reaches chat-service), and it
  stays behind the global CORS middleware, the global rate limiter, and
  `StripUntrustedContextHeaders`.
- `CHAT_SERVICE_URL` is optional with no localhost default. When empty, every
  chat route answers `503` `Chat service is unavailable` without touching a
  downstream, and readiness ignores chat. When set, readiness probes chat at
  `/health` (chat-service serves only the liveness endpoint, not `/ready`).

## Consequences

- The WebSocket route is the only gateway proxy exempt from the upstream
  deadline. Ticket expiry (60 s), the 30-minute connection cap, the 4 KB
  frame cap, 5-connections-per-user limit, and slow-consumer eviction in
  chat-service remain the bounds on a socket; the gateway adds none of its
  own beyond the server-level timeouts.
- Gateway authentication on the upgrade is intentionally absent: a stolen
  ticket, not a missing gateway check, is the threat, and the ticket is
  single-use, hash-stored, and bound to actor claims and token `exp`.
- An operator that never sets `CHAT_SERVICE_URL` gets an explicit 503 rather
  than a 502 aimed at a port nothing listens on; a deployment without
  chat-service stays `/ready`-healthy.
- Multi-instance fan-out stays out of scope (see known gaps): scaling the
  gateway does not fix the single-instance hub in chat-service.

Evidence: gateway [PR #31](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/31),
squash `51a8a23876e18495f220bc115671b2125daa9230`,
`internal/delivery/http/router.go` (chat registration),
`internal/delivery/http/handler/proxy_handler.go`
(`ProxyToChatService`, `ProxyToChatWS`), `internal/delivery/http/readiness.go`
(optional chat probe), `internal/config/config.go` (`CHAT_SERVICE_URL`),
`internal/delivery/http/chat_route_test.go`, `internal/config/chat_config_test.go`.
