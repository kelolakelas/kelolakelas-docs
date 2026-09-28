# Chat API (KEL-119, KEL-120, KEL-121)

The chat service directly serves these routes under `/api/v1/chat/conversations`; as of KEL-119 they are **not** wired through the existing gateway. Every route requires `Authorization: Bearer <JWT>` with the shared HS256 secret. Tenant, role, member and user identifiers come from verified claims, never a supplied tenant header. Responses use `{ "status": "success|error", "message": "...", "data": ... }`.

| Method | Route | Input | Success |
|---|---|---|---|
| GET | `/api/v1/chat/conversations` | `page` default 1, `page_size` default 20, max 100 | 200, visible conversation array |
| POST | `/api/v1/chat/conversations` | `{"kind":"staff"}` or `{"kind":"schedule_request","subject_id":"<UUID>"}` or `{"kind":"report","subject_id":"<UUID>"}` | 201 when new, 200 when existing; conversation |
| GET | `/api/v1/chat/conversations/{id}` | UUID | 200, conversation |
| GET | `/api/v1/chat/conversations/{id}/messages` | `limit` default 20, max 100; optional `before` message UUID | 200, newest-first message array |
| POST | `/api/v1/chat/conversations/{id}/messages` | `{"body":"plain text","client_message_id":"stable retry key"}` | 201, new or prior message for same key |
| POST | `/api/v1/chat/conversations/{id}/read` | no body required | 200, `data: null` |

Conversation fields: `id`, `tenant_id`, `kind` (`staff`, `schedule_request`, `report`), `subject_id`, `parent_user_id`, `member_user_id`, `context`, `created_by_user_id`, `created_at`, `last_message_at`, `last_message` (optional), `unread_count`. Message fields: `id`, `conversation_id`, `sender_user_id`, `sender_kind`, `body`, `client_message_id`, `created_at`. Body is trimmed and limited to 1–2000 Unicode code points; unrecognized JSON fields are rejected. A repeated client key for the same conversation and sender returns the originally stored message, not a new write.

Invalid JWT returns 401; invalid request 400; missing or invisible conversation 404; unsupported method 405; internal errors 500 with generic wording. A parent cannot access staff conversations. Staff owners can access their own conversation; other tenant members need `chat:manage` from identity, with permission errors denied. Staff listing is tenant-filtered; parent listing covers their conversations across tenants. Unauthorized detail is masked as 404. `GET /health` is unauthenticated and independent of the chat routes.

## Realtime WebSocket (KEL-121)

The socket is server-to-client only: messages keep flowing through REST `POST .../messages`, and the server fans out events over WebSocket. Browsers cannot send an `Authorization` header on upgrade, so the client first mints a single-use ticket over authenticated HTTP, then upgrades with it in the query string. The JWT itself is never sent in the query.

| Method | Route | Input | Success |
|---|---|---|---|
| POST | `/api/v1/chat/ws-tickets` | `Authorization: Bearer <JWT>` | 200, `data: {"ticket": "<opaque>", "expires_at": "<RFC3339Nano>"}` |
| GET | `/api/v1/chat/ws?ticket=<ticket>` | valid, unused, unexpired ticket | 101 upgrade; otherwise 401 with no upgrade |

Ticket rules: at least 32 bytes of crypto-random entropy, returned once as plaintext and stored only as a SHA-256 hash; valid at most 60 seconds; single-use with atomic consume (concurrent double-use lets exactly one caller win); bound to `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent` and the token `exp`. Missing/invalid JWT on the ticket endpoint answers 401; an unconfigured store answers 500.

Events are JSON `{ "type": ..., "conversation_id": ..., ... }`: `message.created` carries the conversation ID and the message after another participant's REST send; `conversation.read` carries the conversation ID, reader `user_id` and `read_at` after a REST `/read`. Fan-out reaches only connections whose frozen connect-time rights pass the same visibility boundary as REST (`internal/chat/chat.go` `Service.Visible`); rights `chat:manage`/`report:read` are evaluated once at connect, so a permission revoked mid-connection takes effect at most when the connection ends.

Liveness: server ping every 30 s, close after two missed pong intervals; close at token `exp` or after a 30-minute connection lifetime, whichever comes first (the client then mints a new ticket). Client frames are capped at 4 KB and each user holds at most 5 concurrent connections; a 6th registration is refused with a policy-violation close. A slow consumer whose 16-event buffer fills is disconnected instead of blocking the hub. Fan-out is in-memory for a single instance (multi-instance is out of scope; see known gaps). Shutdown closes every connection with the normal-close code.

**Implemented (KEL-121):** `internal/chat/wsticket.go` (`TicketStore`), `internal/chat/wshub.go` (`WSHub`, `WSEvent`), `internal/delivery/http/ws.go` (ticket issue, upgrade, connection pump), `internal/chat/chat.go` (`Service.Hub` broadcast on `Send`/`Read`, `Service.Rights`), `cmd/server/main.go` (hub/ticket wiring, `hub.Close()` on shutdown). Sources: [chat-service PR #3](https://github.com/kelolakelas/kelolakelas-chat-service/pull/3), squash `0fd73a2a69981677db3cf6fe6bb4914e40dffd5e`.

**Implemented (KEL-120):** For `schedule_request` and `report`, `subject_id` is mandatory and must resolve through academic's credential-protected internal context endpoint. Schedule-request creation allows the owning parent or a matching-tenant `chat:manage` member; report creation permits only a matching-tenant `report:read` member. The student parent and members with the kind's permission can see and reply to the persisted conversation; other callers see 404. Context snapshots include `class_name`, `student_first_name`, `report_title`, and `tenant_name`; read paths use stored participants and do not call academic. Academic not-found returns 404; academic outage/5xx yields generic 503 on creation while existing conversations remain readable. Staff creation remains `{"kind":"staff"}` without `subject_id`. Sources: `pkg/academic/client.go`, `internal/chat/chat.go`, `internal/postgres/store.go`, `internal/delivery/http/handler.go`, [PR #2](https://github.com/kelolakelas/kelolakelas-chat-service/pull/2), squash `d99fa2423426490396a9a64658a2d40d6a7e4135`.

Staff baseline: [PR #1](https://github.com/kelolakelas/kelolakelas-chat-service/pull/1), squash `b434adaf2ba849d6202d6c69e36337ea623305cb`.
