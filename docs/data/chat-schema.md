# Chat schema (KEL-119)

Chat data resides in a service-owned PostgreSQL database, installed by `kelolakelas-chat-service/migrations/000001_chat.up.sql`. Cross-service user, member and tenant UUIDs are application references, not foreign keys into identity.

- `conversations`: UUID primary key; required `tenant_id`, `kind` constrained to `staff`, `subject_id` (member UUID), `member_user_id`, creator UUID and timestamps. `parent_user_id` nullable, `context` defaults to `{}`. Unique `(tenant_id, kind, subject_id)` prevents duplicate creation, including concurrent attempts. Tenant/recent-order index supports listing.
- `messages`: UUID primary key, conversation foreign key with cascade delete, sender UUID, `sender_kind` constrained to `parent|member`, plain-text `body` length 1–2000 database characters, nonempty `client_message_id`, timestamp. Unique `(conversation_id, sender_user_id, client_message_id)` handles retries. `(conversation_id, created_at DESC, id DESC)` supports timeline pagination. KEL-119 only writes `sender_kind=member`; the schema's `parent` value does not imply a parent API exists.
- `conversation_reads`: `(conversation_id, user_id)` primary key, cascade conversation foreign key, monotonically updated `last_read_at`. Unread counts exclude messages by that user and messages at or before the watermark.

`000001_chat.down.sql` removes these tables for explicit rollback; this is destructive to chat data. Apply migration before starting the server. See [component](../components/chat-service.md) and [API](../api/chat.md). Source [PR #1](https://github.com/kelolakelas/kelolakelas-chat-service/pull/1), squash `b434adaf2ba849d6202d6c69e36337ea623305cb`.
