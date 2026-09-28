# ADR 0047: Ticket-based chat WebSocket authentication

Status: Accepted (KEL-121, 2026-09-28)

## Context

Web calls the backend only from server actions and keeps the JWT in an `httpOnly` cookie, so a browser cannot send an `Authorization` header when opening a WebSocket. No Go repository had a WebSocket library yet. The main risks were WebSocket authentication and event leakage to callers who must not see a conversation.

## Decision

- The client mints a single-use ticket first: `POST /api/v1/chat/ws-tickets` behind JWT returns an opaque ticket (>= 32 crypto-random bytes, returned once as plaintext, stored only as SHA-256 hash) with `expires_at`. The ticket is valid at most 60 seconds, consumed atomically (exactly one concurrent caller wins), and bound to `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent` and the token `exp`.
- `GET /api/v1/chat/ws?ticket=` upgrades only when the ticket is valid, unused and unexpired; anything else answers 401 with no upgrade. The JWT itself is never sent in the query string.
- The socket is server-to-client only (besides ping/pong); messages keep flowing through REST. `Service.Send`/`Read` fan out `message.created`/`conversation.read` through an in-memory hub (`WSHub`), filtered strictly by the frozen connect-time rights (`Service.Rights`), which mirror `Service.Visible`. `chat:manage`/`report:read` are evaluated once at connect, so a revocation mid-connection takes effect at most when the connection ends (30-minute cap).
- Liveness: 30 s server ping, close after two missed pong intervals, close at token expiry or 30-minute lifetime; 4 KB client frame cap; at most 5 concurrent connections per user (6th refused with policy-violation close); slow consumers evicted without blocking the hub; shutdown closes every connection with the normal-close code.
- WebSocket library: `gorilla/websocket` v1.5.3 — the long-standing de-facto Go standard with a stable API and no known `govulncheck` findings at that version. Only its upgrade, ping/pong, read-limit and close-code primitives are used; client-initiated messaging stays on REST by design.
- Ticket store is in-memory (no DB table/migration): a process restart drops outstanding tickets and clients simply mint a new one. This fits the 60 s TTL; the contract only requires hash + TTL + single use.

## Consequences

- Fan-out is single-instance by design (out of scope: multi-instance, e.g. PostgreSQL LISTEN/NOTIFY — recorded as a known gap). Running two replicas splits audiences: a REST send reaching replica A never reaches WS clients on replica B.
- Permission changes apply to new connections immediately and to open ones at most 30 minutes later.
- The upgrade endpoint trusts the single-use ticket, not cookies or `Origin`; gateway upgrade forwarding and `Origin` enforcement remain a separate issue (KEL-122 gateway scope).

Evidence: chat-service [PR #3](https://github.com/kelolakelas/kelolakelas-chat-service/pull/3), squash `0fd73a2a69981677db3cf6fe6bb4914e40dffd5e`, `internal/chat/wsticket.go`, `internal/chat/wshub.go`, `internal/delivery/http/ws.go`, `internal/chat/chat.go` (`Service.Hub`, `Service.Rights`), `cmd/server/main.go`; [PR gate](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/36450783617) and [post-merge gate](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/36451252677) passed.
