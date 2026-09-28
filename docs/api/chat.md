# Chat API (KEL-119, KEL-120)

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

**Implemented (KEL-120):** For `schedule_request` and `report`, `subject_id` is mandatory and must resolve through academic's credential-protected internal context endpoint. Schedule-request creation allows the owning parent or a matching-tenant `chat:manage` member; report creation permits only a matching-tenant `report:read` member. The student parent and members with the kind's permission can see and reply to the persisted conversation; other callers see 404. Context snapshots include `class_name`, `student_first_name`, `report_title`, and `tenant_name`; read paths use stored participants and do not call academic. Academic not-found returns 404; academic outage/5xx yields generic 503 on creation while existing conversations remain readable. Staff creation remains `{"kind":"staff"}` without `subject_id`. Sources: `pkg/academic/client.go`, `internal/chat/chat.go`, `internal/postgres/store.go`, `internal/delivery/http/handler.go`, [PR #2](https://github.com/kelolakelas/kelolakelas-chat-service/pull/2), squash `d99fa2423426490396a9a64658a2d40d6a7e4135`.

Staff baseline: [PR #1](https://github.com/kelolakelas/kelolakelas-chat-service/pull/1), squash `b434adaf2ba849d6202d6c69e36337ea623305cb`.
