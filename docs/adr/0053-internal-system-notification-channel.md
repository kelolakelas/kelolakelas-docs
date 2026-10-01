# ADR 0053: Internal system notification channel for chat-service

Status: Accepted (KEL-154, 2026-10-01)

## Context

Before KEL-154 every chat route required a user JWT, and only `parent`/`member` senders existed. The parent notification work (project `parent-schedule-notifications`) needs sibling services to deliver system messages into a parent's inbox — a server-to-server write path with no user token, and with the high-risk requirement that a write can never land in the wrong parent's or tenant's conversation. The gateway strips client-supplied `X-Internal-Service-Credential` on every inbound request, so the credential survives only on direct service-to-service calls. Academic already protects its inbound internal routes with a SHA-256 + `subtle.ConstantTimeCompare` middleware (Gin); chat-service needed the same boundary ported to its `net/http` handler.

## Decision

- `POST /internal/notifications` lives in chat-service and is deliberately not routed through the gateway. It authenticates with the shared `INTERNAL_SERVICE_CREDENTIAL` (`X-Internal-Service-Credential`, SHA-256 + constant-time compare, fail-closed when unconfigured) and never accepts a user JWT on this path.
- One notification conversation per `(tenant_id, parent_user_id)`: `kind = 'notification'`, `subject_id = parent_user_id`, enforced by the `conversations_participants_check` CHECK and re-checked in `Store.Notify` after the get-or-create upsert. Tenant and parent travel in the request body, not the path, so a misrouted URL can never change the write scope.
- System rows use `sender_kind = 'system'` with `sender_user_id = NULL` (`messages_sender_shape_check` keeps that pairing exact), and are idempotent through the partial unique index `messages_system_idempotency` on `(conversation_id, client_message_id) WHERE sender_kind = 'system'` plus `ON CONFLICT DO NOTHING` then SELECT, all inside one transaction. A partial index was chosen over widening the existing unique key with `NULLS NOT DISTINCT` so the user-facing constraint stays untouched and the migration works on every supported PostgreSQL version.
- Reads stay on the existing JWT routes: the owning parent reads notification conversations through the same inbox/list/detail paths (unread counts system rows), but any send into one answers 403. Tenant members never see notification rows on any path; `Service.Visible` and `visibleFrozen` share the `conversationKinds` allowlist so a kind added to one cannot be forgotten in the other.
- WS fan-out (`message.created`) fires only for newly created messages — an idempotent replay returns 200 with the existing row but never re-broadcasts.
- KEL-154 is the channel only: no trigger from academic and no push/email/WhatsApp delivery.

## Alternatives considered

- **Routing the write through the gateway.** Rejected: the gateway would need to forward a service credential it currently strips by design, adding a trust-boundary exception for a write path the gateway cannot further authorize. Direct service-to-service calls keep the credential boundary where the academic precedent already is.
- **Tenant/parent in the path (`/internal/notifications/:tenant/:parent`).** Rejected: a misrouted URL could then silently target the wrong conversation; body-scoped parameters make such a mistake impossible by construction.
- **`NULLS NOT DISTINCT` on the existing unique key.** Rejected: it would touch the user-facing idempotency constraint and requires PostgreSQL 15+; the partial index is additive and version-agnostic.

## Consequences

- Fan-out stays single-instance (ADR 0047); an internal write reaching replica A never reaches WS clients on replica B.
- JSON `sender_user_id` is `null` for system rows only; consumers of chat JSON must handle a null sender there.
- `000003_notification.down.sql` refuses to roll back while any notification data exists, mirroring the `000002` rollback guard.

Evidence: chat-service [PR #4](https://github.com/kelolakelas/kelolakelas-chat-service/pull/4), squash `db7136962a3fff585fece2992c3025e1f8215296`, `migrations/000003_notification.{up,down}.sql`, `internal/chat/chat.go` (`Service.NotifyInternal`, `conversationKinds`), `internal/postgres/store.go` (`Store.Notify`), `internal/delivery/http/handler.go` (`notifyInternal`, `internalCredentialOk`), `cmd/server/main.go`; [PR gate](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/36800605009) and [post-merge gate](https://github.com/kelolakelas/kelolakelas-chat-service/actions/runs/36800688220) passed.
