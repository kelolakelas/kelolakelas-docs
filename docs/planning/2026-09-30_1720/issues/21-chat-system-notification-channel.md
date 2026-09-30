## Background / Problem

Semua route chat membutuhkan JWT pengguna (`internal/delivery/http/handler.go:73-113,157`); tidak ada route internal (`cmd/server/main.go:104-111`). `sender_kind` hanya parent atau member dengan `sender_user_id` wajib (`migrations/000001_chat.up.sql`), dan jenis percakapan hanya staff, schedule_request, dan report (`migrations/000002_context_chat.up.sql:2`).

## Goal

Service internal dapat mengirim pesan sistem yang idempoten ke percakapan notifikasi per parent per tenant, yang tersampaikan realtime dan tercatat sebagai belum dibaca.

## Requirements

- Endpoint internal dengan kredensial `X-Internal-Service-Credential` untuk mengirim pesan sistem ke parent tertentu pada tenant tertentu.
- Jenis percakapan notifikasi (satu per tenant dan parent) yang dibuat otomatis, dan sender sistem tanpa user id.
- Idempotency key dari pengirim mencegah pesan ganda.
- Parent dapat membaca tetapi tidak membalas percakapan notifikasi; anggota tenant tidak melihatnya di inbox.
- Pesan baru di-fan-out lewat WebSocket dan menambah unread count.

## Acceptance Criteria

- [ ] Pesan internal muncul di inbox parent dengan unread count bertambah.
- [ ] Mengirim ulang dengan idempotency key sama tidak menambah pesan.
- [ ] Request tanpa kredensial internal atau parent membalas percakapan notifikasi ditolak.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: endpoint internal adalah jalur tulis baru, dan kesalahan scope dapat mengirim pesan ke parent atau tenant yang salah. Kredensial dibandingkan secara constant-time dan tidak dirouting lewat gateway. Migration memperluas CHECK kind dan sender_kind secara kompatibel; perbarui daftar kind di `internal/chat/chat.go:106,152` dan `handler.go:188`. Fan-out hanya single-instance (ADR 0047). Perbarui `kelolakelas-docs` (komponen chat, ADR pesan sistem).

Relevant areas:

- `kelolakelas-chat-service/cmd/server/main.go`
- `kelolakelas-chat-service/internal/chat/chat.go`
- `kelolakelas-chat-service/internal/postgres/store.go`
- `kelolakelas-chat-service/internal/delivery/http/handler.go`
- `kelolakelas-chat-service/migrations`

## Edge Cases

- Parent belum pernah membuka chat.
- Pesan serentak dengan idempotency key sama.
- Parent tidak terhubung ke WebSocket.

## Testing / Validation

- [ ] Postgres integration test idempotensi serentak dan scope percakapan sebagai mitigasi risiko salah kirim.
- [ ] Unit test otorisasi kredensial internal dan larangan membalas.
- [ ] go vet, go test -race, dan build lulus.

## Out of Scope

- Pemicu notifikasi dari academic.
- Push notification, email, atau WhatsApp.

## AI Orchestrator Contract

```json
{
  "draftKey": "chat-system-notification-channel",
  "projectKey": "parent-schedule-notifications",
  "title": "Chat service menerima pesan notifikasi sistem dari service internal",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "chat",
    "ai-ready"
  ],
  "repositories": [
    "chat"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Semua route chat membutuhkan JWT pengguna (`internal/delivery/http/handler.go:73-113,157`); tidak ada route internal (`cmd/server/main.go:104-111`). `sender_kind` hanya parent atau member dengan `sender_user_id` wajib (`migrations/000001_chat.up.sql`), dan jenis percakapan hanya staff, schedule_request, dan report (`migrations/000002_context_chat.up.sql:2`).",
    "goal": "Service internal dapat mengirim pesan sistem yang idempoten ke percakapan notifikasi per parent per tenant, yang tersampaikan realtime dan tercatat sebagai belum dibaca.",
    "requirements": [
      "Endpoint internal dengan kredensial `X-Internal-Service-Credential` untuk mengirim pesan sistem ke parent tertentu pada tenant tertentu.",
      "Jenis percakapan notifikasi (satu per tenant dan parent) yang dibuat otomatis, dan sender sistem tanpa user id.",
      "Idempotency key dari pengirim mencegah pesan ganda.",
      "Parent dapat membaca tetapi tidak membalas percakapan notifikasi; anggota tenant tidak melihatnya di inbox.",
      "Pesan baru di-fan-out lewat WebSocket dan menambah unread count."
    ],
    "acceptanceCriteria": [
      "Pesan internal muncul di inbox parent dengan unread count bertambah.",
      "Mengirim ulang dengan idempotency key sama tidak menambah pesan.",
      "Request tanpa kredensial internal atau parent membalas percakapan notifikasi ditolak.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: endpoint internal adalah jalur tulis baru, dan kesalahan scope dapat mengirim pesan ke parent atau tenant yang salah. Kredensial dibandingkan secara constant-time dan tidak dirouting lewat gateway. Migration memperluas CHECK kind dan sender_kind secara kompatibel; perbarui daftar kind di `internal/chat/chat.go:106,152` dan `handler.go:188`. Fan-out hanya single-instance (ADR 0047). Perbarui `kelolakelas-docs` (komponen chat, ADR pesan sistem).",
    "relevantAreas": [
      "kelolakelas-chat-service/cmd/server/main.go",
      "kelolakelas-chat-service/internal/chat/chat.go",
      "kelolakelas-chat-service/internal/postgres/store.go",
      "kelolakelas-chat-service/internal/delivery/http/handler.go",
      "kelolakelas-chat-service/migrations"
    ],
    "edgeCases": [
      "Parent belum pernah membuka chat.",
      "Pesan serentak dengan idempotency key sama.",
      "Parent tidak terhubung ke WebSocket."
    ],
    "testingValidation": [
      "Postgres integration test idempotensi serentak dan scope percakapan sebagai mitigasi risiko salah kirim.",
      "Unit test otorisasi kredensial internal dan larangan membalas.",
      "go vet, go test -race, dan build lulus."
    ],
    "outOfScope": [
      "Pemicu notifikasi dari academic.",
      "Push notification, email, atau WhatsApp."
    ]
  }
}
```
