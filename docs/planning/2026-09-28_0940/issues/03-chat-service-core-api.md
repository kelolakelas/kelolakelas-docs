## Background / Problem

Owner memutuskan (2026-09-28) bahwa chat dibangun sebagai service dan repo baru `kelolakelas-chat-service` dengan WebSocket. Operator membuat repo berisi kerangka Go dan CI `gate` sebelum issue ini diberi `ai-ready`, tetapi domain chat belum ada. Service lain menyediakan pola yang bisa diikuti:
- JWT HS256 dengan `JWT_SECRET` bersama dan klaim `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent` (identity `pkg/jwt/jwt.go:17-29`, academic `internal/delivery/http/middleware/auth_middleware.go:26-92`);
- cek permission lewat gRPC identity `/tenant.PermissionService/CheckPermission` (academic `pkg/grpcclient/permission_client.go`);
- migration golang-migrate dan envelope `{status, message, data}`.

## Goal

Anggota tenant dapat membuka satu percakapan dengan admin tenant. Anggota tersebut dan pemegang `chat:manage` di tenant yang sama dapat membaca, mengirim, dan menandai pesan terbaca lewat REST, dengan isolasi tenant yang teruji.

## Requirements

- Schema PostgreSQL (migration golang-migrate) mencakup tiga tabel:
  - percakapan: `id`, `tenant_id`, `kind`, `subject_id`, `parent_user_id` (nullable), `member_user_id` (nullable), snapshot `context` jsonb, `created_by_user_id`, `created_at`, `last_message_at`, dengan unik (`tenant_id`, `kind`, `subject_id`);
  - pesan: `id`, `conversation_id`, `sender_user_id`, `sender_kind` (`parent`/`member`), `body`, `client_message_id`, `created_at`, dengan unik (`conversation_id`, `sender_user_id`, `client_message_id`);
  - status baca per pengguna per percakapan.
- Autentikasi JWT mengikuti academic `AuthMiddleware`. Token tanpa `user_id`, atau token non-parent tanpa `tenant_id`, ditolak 401.
- Endpoint berikut disediakan:
  - `GET /api/v1/chat/conversations`: percakapan yang boleh dilihat pemanggil, beserta pesan terakhir dan `unread_count`, dengan paginasi `page`/`page_size`;
  - `POST /api/v1/chat/conversations`: get-or-create, menjawab 201 bila baru dan 200 bila sudah ada;
  - `GET /api/v1/chat/conversations/:id`;
  - `GET /api/v1/chat/conversations/:id/messages`: pesan terbaru dulu, dengan paginasi `before` + `limit` (maksimum 100);
  - `POST /api/v1/chat/conversations/:id/messages`;
  - `POST /api/v1/chat/conversations/:id/read`.
- Issue ini hanya mendukung `kind` `staff`. Anggota tenant membuat percakapannya sendiri (`subject_id` = `member_id` pemanggil); parent tidak dapat membuat `staff`.
- Aturan visibilitas dipusatkan di satu fungsi yang nanti juga dipakai WebSocket. Percakapan `staff` terlihat oleh anggota pemiliknya (`member_user_id` = `user_id` pemanggil, tenant sama) dan oleh anggota tenant yang sama yang memiliki `chat:manage`, dicek lewat gRPC identity dengan `tenant_id`, `role_id`, dan `member_id`.
- Percakapan yang tidak boleh dilihat dijawab 404, bukan 403, agar keberadaannya tidak bocor.
- Isi pesan di-trim, wajib 1–2000 karakter, lalu disimpan dan dikembalikan sebagai teks biasa. `client_message_id` wajib, dan pengiriman ulang dengan nilai yang sama mengembalikan pesan yang sudah ada (idempoten).
- Error 5xx disanitasi sehingga tidak membocorkan error database atau nama host.
- Konfigurasi lewat env yang didokumentasikan di `.env.example`: `DATABASE_URL`/`DB_*`, `JWT_SECRET`, `IDENTITY_GRPC_HOST`, `IDENTITY_PERMISSION_TIMEOUT_MS`, `PORT`, dan timeout server.

## Acceptance Criteria

- [ ] Anggota tenant membuat percakapan `staff` dan mengirim pesan, lalu pemegang `chat:manage` di tenant yang sama melihat percakapan itu di daftarnya dengan `unread_count` 1.
- [ ] Setelah pemegang `chat:manage` membalas lalu memanggil `read`, `unread_count` miliknya menjadi 0.
- [ ] Anggota lain tanpa `chat:manage`, anggota tenant lain, dan parent mendapat 404 untuk percakapan itu dan tidak melihatnya di daftar.
- [ ] Membuat `staff` dua kali mengembalikan percakapan yang sama.
- [ ] Pesan kosong, hanya berisi spasi, atau lebih dari 2000 karakter ditolak 400, dan `client_message_id` yang sama tidak menduplikasi pesan.
- [ ] Bila gRPC identity tidak tersedia, pemeriksaan `chat:manage` gagal tertutup (akses ditolak).
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran pesan lintas tenant di service baru. Mitigasinya satu fungsi visibilitas yang dipakai semua handler (dan kelak fan-out WebSocket), ditambah integration test isolasi.

Prasyarat Project yang dikerjakan operator: repo `kelolakelas-chat-service` dengan kerangka Go, CI `gate`, dan branch protection, serta `chat` sudah ada di kontrak orchestrator. Ikuti struktur academic: `cmd/server`, `cmd/migrate`, `internal/{config,domain,repository,usecase,delivery}`, dan `pkg/grpcclient`.

Path endpoint di atas adalah kontrak untuk issue `gateway-chat-routes` dan `web-chat-inbox-realtime`, jadi jangan diubah tanpa memperbarui issue tersebut. Pada tahap ini chat-service berjalan satu instance. Nama tampilan pengirim di luar scope; response memuat `sender_user_id` dan `sender_kind`.

Asumsi yang belum dikonfirmasi owner:
- admin tenant adalah pemegang `chat:manage`;
- pengajar adalah anggota tenant aktif mana pun;
- percakapan `staff` hanya dimulai oleh anggota, bukan oleh admin.

Perbarui kelolakelas-docs: `docs/components/chat-service.md` (baru), `docs/api/chat.md` (baru), `docs/data/chat-schema.md` (baru), `docs/reference/environment-variables.md`, `docs/reference/repository-map.md`, dan `docs/02-architecture.md`.

Relevant areas:

- `kelolakelas-chat-service/cmd`
- `kelolakelas-chat-service/internal`
- `kelolakelas-chat-service/migrations`
- `kelolakelas-academic-service/internal/delivery/http/middleware/auth_middleware.go`
- `kelolakelas-academic-service/pkg/grpcclient/permission_client.go`

## Edge Cases

- Anggota dinonaktifkan atau role-nya diubah setelah percakapan dibuat. Permission dicek per request.
- Dua request create `staff` bersamaan dari anggota yang sama menghasilkan satu percakapan lewat unique constraint.
- Paginasi `before` memakai ID pesan dari percakapan lain.
- Token parent (tenant nol) memanggil daftar percakapan dan menerima daftar kosong, bukan error.

## Testing / Validation

- [ ] Unit test usecase untuk aturan visibilitas, validasi pesan, dan idempotensi `client_message_id`.
- [ ] Integration test PostgreSQL untuk isolasi tenant dan pemegang `chat:manage` sebagai mitigasi kebocoran lintas tenant, termasuk create bersamaan.
- [ ] Handler test untuk 401, 404 tersembunyi, 400, dan fail-closed saat gRPC identity gagal.
- [ ] CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Percakapan `schedule_request` dan `report` (issue terpisah).
- WebSocket dan tiket (issue terpisah).
- Route gateway dan UI web.
- Lampiran, edit, dan hapus pesan.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "chat-service-core-api",
  "title": "Chat-service menyimpan percakapan pengajar–admin tenant dan pesannya melalui REST API",
  "estimate": "L",
  "complexity": "high",
  "repositories": [
    "chat"
  ],
  "blockedByDraftKeys": [
    "chat-manage-permission"
  ],
  "body": {
    "backgroundProblem": "Owner memutuskan (2026-09-28) bahwa chat dibangun sebagai service dan repo baru `kelolakelas-chat-service` dengan WebSocket. Operator membuat repo berisi kerangka Go dan CI `gate` sebelum issue ini diberi `ai-ready`, tetapi domain chat belum ada. Service lain menyediakan pola yang bisa diikuti:\n- JWT HS256 dengan `JWT_SECRET` bersama dan klaim `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent` (identity `pkg/jwt/jwt.go:17-29`, academic `internal/delivery/http/middleware/auth_middleware.go:26-92`);\n- cek permission lewat gRPC identity `/tenant.PermissionService/CheckPermission` (academic `pkg/grpcclient/permission_client.go`);\n- migration golang-migrate dan envelope `{status, message, data}`.",
    "goal": "Anggota tenant dapat membuka satu percakapan dengan admin tenant. Anggota tersebut dan pemegang `chat:manage` di tenant yang sama dapat membaca, mengirim, dan menandai pesan terbaca lewat REST, dengan isolasi tenant yang teruji.",
    "requirements": [
      "Schema PostgreSQL (migration golang-migrate) mencakup tiga tabel:\n  - percakapan: `id`, `tenant_id`, `kind`, `subject_id`, `parent_user_id` (nullable), `member_user_id` (nullable), snapshot `context` jsonb, `created_by_user_id`, `created_at`, `last_message_at`, dengan unik (`tenant_id`, `kind`, `subject_id`);\n  - pesan: `id`, `conversation_id`, `sender_user_id`, `sender_kind` (`parent`/`member`), `body`, `client_message_id`, `created_at`, dengan unik (`conversation_id`, `sender_user_id`, `client_message_id`);\n  - status baca per pengguna per percakapan.",
      "Autentikasi JWT mengikuti academic `AuthMiddleware`. Token tanpa `user_id`, atau token non-parent tanpa `tenant_id`, ditolak 401.",
      "Endpoint berikut disediakan:\n  - `GET /api/v1/chat/conversations`: percakapan yang boleh dilihat pemanggil, beserta pesan terakhir dan `unread_count`, dengan paginasi `page`/`page_size`;\n  - `POST /api/v1/chat/conversations`: get-or-create, menjawab 201 bila baru dan 200 bila sudah ada;\n  - `GET /api/v1/chat/conversations/:id`;\n  - `GET /api/v1/chat/conversations/:id/messages`: pesan terbaru dulu, dengan paginasi `before` + `limit` (maksimum 100);\n  - `POST /api/v1/chat/conversations/:id/messages`;\n  - `POST /api/v1/chat/conversations/:id/read`.",
      "Issue ini hanya mendukung `kind` `staff`. Anggota tenant membuat percakapannya sendiri (`subject_id` = `member_id` pemanggil); parent tidak dapat membuat `staff`.",
      "Aturan visibilitas dipusatkan di satu fungsi yang nanti juga dipakai WebSocket. Percakapan `staff` terlihat oleh anggota pemiliknya (`member_user_id` = `user_id` pemanggil, tenant sama) dan oleh anggota tenant yang sama yang memiliki `chat:manage`, dicek lewat gRPC identity dengan `tenant_id`, `role_id`, dan `member_id`.",
      "Percakapan yang tidak boleh dilihat dijawab 404, bukan 403, agar keberadaannya tidak bocor.",
      "Isi pesan di-trim, wajib 1–2000 karakter, lalu disimpan dan dikembalikan sebagai teks biasa. `client_message_id` wajib, dan pengiriman ulang dengan nilai yang sama mengembalikan pesan yang sudah ada (idempoten).",
      "Error 5xx disanitasi sehingga tidak membocorkan error database atau nama host.",
      "Konfigurasi lewat env yang didokumentasikan di `.env.example`: `DATABASE_URL`/`DB_*`, `JWT_SECRET`, `IDENTITY_GRPC_HOST`, `IDENTITY_PERMISSION_TIMEOUT_MS`, `PORT`, dan timeout server."
    ],
    "acceptanceCriteria": [
      "Anggota tenant membuat percakapan `staff` dan mengirim pesan, lalu pemegang `chat:manage` di tenant yang sama melihat percakapan itu di daftarnya dengan `unread_count` 1.",
      "Setelah pemegang `chat:manage` membalas lalu memanggil `read`, `unread_count` miliknya menjadi 0.",
      "Anggota lain tanpa `chat:manage`, anggota tenant lain, dan parent mendapat 404 untuk percakapan itu dan tidak melihatnya di daftar.",
      "Membuat `staff` dua kali mengembalikan percakapan yang sama.",
      "Pesan kosong, hanya berisi spasi, atau lebih dari 2000 karakter ditolak 400, dan `client_message_id` yang sama tidak menduplikasi pesan.",
      "Bila gRPC identity tidak tersedia, pemeriksaan `chat:manage` gagal tertutup (akses ditolak).",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran pesan lintas tenant di service baru. Mitigasinya satu fungsi visibilitas yang dipakai semua handler (dan kelak fan-out WebSocket), ditambah integration test isolasi.\n\nPrasyarat Project yang dikerjakan operator: repo `kelolakelas-chat-service` dengan kerangka Go, CI `gate`, dan branch protection, serta `chat` sudah ada di kontrak orchestrator. Ikuti struktur academic: `cmd/server`, `cmd/migrate`, `internal/{config,domain,repository,usecase,delivery}`, dan `pkg/grpcclient`.\n\nPath endpoint di atas adalah kontrak untuk issue `gateway-chat-routes` dan `web-chat-inbox-realtime`, jadi jangan diubah tanpa memperbarui issue tersebut. Pada tahap ini chat-service berjalan satu instance. Nama tampilan pengirim di luar scope; response memuat `sender_user_id` dan `sender_kind`.\n\nAsumsi yang belum dikonfirmasi owner:\n- admin tenant adalah pemegang `chat:manage`;\n- pengajar adalah anggota tenant aktif mana pun;\n- percakapan `staff` hanya dimulai oleh anggota, bukan oleh admin.\n\nPerbarui kelolakelas-docs: `docs/components/chat-service.md` (baru), `docs/api/chat.md` (baru), `docs/data/chat-schema.md` (baru), `docs/reference/environment-variables.md`, `docs/reference/repository-map.md`, dan `docs/02-architecture.md`.",
    "relevantAreas": [
      "kelolakelas-chat-service/cmd",
      "kelolakelas-chat-service/internal",
      "kelolakelas-chat-service/migrations",
      "kelolakelas-academic-service/internal/delivery/http/middleware/auth_middleware.go",
      "kelolakelas-academic-service/pkg/grpcclient/permission_client.go"
    ],
    "edgeCases": [
      "Anggota dinonaktifkan atau role-nya diubah setelah percakapan dibuat. Permission dicek per request.",
      "Dua request create `staff` bersamaan dari anggota yang sama menghasilkan satu percakapan lewat unique constraint.",
      "Paginasi `before` memakai ID pesan dari percakapan lain.",
      "Token parent (tenant nol) memanggil daftar percakapan dan menerima daftar kosong, bukan error."
    ],
    "testingValidation": [
      "Unit test usecase untuk aturan visibilitas, validasi pesan, dan idempotensi `client_message_id`.",
      "Integration test PostgreSQL untuk isolasi tenant dan pemegang `chat:manage` sebagai mitigasi kebocoran lintas tenant, termasuk create bersamaan.",
      "Handler test untuk 401, 404 tersembunyi, 400, dan fail-closed saat gRPC identity gagal.",
      "CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Percakapan `schedule_request` dan `report` (issue terpisah).",
      "WebSocket dan tiket (issue terpisah).",
      "Route gateway dan UI web.",
      "Lampiran, edit, dan hapus pesan."
    ]
  },
  "labels": [
    "chat",
    "ai-ready"
  ]
}
```
