## Background / Problem

Owner memutuskan pesan baru muncul lewat WebSocket sejak awal. Web memanggil backend hanya dari server (`kelolakelas-web/lib/gateway.ts:148-176`, kelolakelas-docs `docs/components/web.md:60-64`) dan menyimpan JWT di cookie `httpOnly` (`app/(auth)/login/_actions/actions.ts:73-74`). Akibatnya browser tidak dapat mengirim header `Authorization` saat membuka WebSocket. Belum ada library WebSocket di repo Go mana pun.

## Goal

Klien terautentikasi dapat membuka WebSocket dengan tiket sekali pakai dan menerima event pesan baru serta status baca untuk percakapan yang boleh dilihatnya, tanpa polling.

## Requirements

- `POST /api/v1/chat/ws-tickets` (JWT wajib) mengembalikan `ticket` acak minimal 32 byte dan `expires_at`. Tiket berlaku paling lama 60 detik, sekali pakai, hanya disimpan sebagai hash, dan terikat ke `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent`, serta `exp` token.
- `GET /api/v1/chat/ws?ticket=` melakukan upgrade WebSocket hanya bila tiket valid, belum dipakai, dan belum kedaluwarsa. Selain itu request ditolak 401 sebelum upgrade.
- Server mengirim event JSON `message.created` (`conversation_id` dan pesan) dan `conversation.read` (`conversation_id`, `user_id`, penanda baca) hanya ke koneksi yang lolos fungsi visibilitas yang sama dengan REST.
- Pesan tetap dikirim lewat REST; selain ping/pong, WebSocket hanya berarah dari server ke klien.
- Ping dikirim setiap 30 detik. Koneksi ditutup bila pong tidak diterima dalam dua interval, saat `exp` token tercapai, atau setelah umur koneksi 30 menit (klien lalu meminta tiket baru). Hak `chat:manage`/`report:read` koneksi dievaluasi saat terhubung.
- Ada batas ukuran frame dari klien (mis. 4 KB) dan batas jumlah koneksi per pengguna (mis. 5) untuk mencegah penyalahgunaan.
- Fan-out memakai hub di memori untuk satu instance, dan shutdown menutup koneksi dengan close code normal.

## Acceptance Criteria

- [ ] Klien dengan tiket valid menerima `message.created` untuk pesan yang dikirim peserta lain lewat REST, tanpa reload.
- [ ] Klien yang tidak berhak melihat percakapan, termasuk anggota tenant lain dan parent lain, tidak menerima event-nya.
- [ ] Tiket kedaluwarsa, sudah dipakai, atau acak ditolak 401 tanpa upgrade.
- [ ] Koneksi ditutup saat token kedaluwarsa atau setelah batas umur koneksi tercapai.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: autentikasi WebSocket dan kebocoran event. Mitigasinya:
- tiket sekali pakai berumur pendek, dan JWT tidak pernah dikirim lewat query;
- tiket disimpan sebagai hash;
- fan-out lewat fungsi visibilitas tunggal.

Pilih library WebSocket Go yang aktif dipelihara dan lolos govulncheck, lalu catat alasannya di ADR. Gateway meneruskan upgrade dan menegakkan Origin lewat `CORSMiddleware` (api-gateway `internal/delivery/http/router.go:76`). Access log gateway hanya mencatat path tanpa query (`internal/delivery/http/middleware/access_log_middleware.go:35-40`), sehingga tiket tidak tercatat.

Asumsi: chat-service berjalan satu instance. Fan-out multi-instance (mis. PostgreSQL LISTEN/NOTIFY) di luar scope dan dicatat sebagai risiko.

Perbarui kelolakelas-docs: `docs/api/chat.md` (protokol event), `docs/components/chat-service.md`, dan ADR baru untuk autentikasi WebSocket berbasis tiket.

Relevant areas:

- `kelolakelas-chat-service/cmd/server`
- `kelolakelas-chat-service/internal/delivery`
- `kelolakelas-chat-service/internal/usecase`
- `kelolakelas-chat-service/migrations`

## Edge Cases

- Tiket yang sama dipakai dua kali bersamaan; hanya satu yang berhasil.
- Klien lambat yang buffer kirimnya penuh diputus agar tidak memblokir hub.
- Permission dicabut saat koneksi masih terbuka; perubahan berlaku paling lambat saat batas umur koneksi.
- Pengguna membuka beberapa tab.

## Testing / Validation

- [ ] Unit test tiket (kedaluwarsa, sekali pakai, hash) dan hub (fan-out hanya ke koneksi yang berhak).
- [ ] Integration test WebSocket dengan `httptest` untuk upgrade, event, isolasi tenant/parent sebagai mitigasi kebocoran, dan penutupan saat token kedaluwarsa.
- [ ] Test race untuk pemakaian tiket bersamaan dengan `go test -race`.
- [ ] CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Mengirim pesan lewat WebSocket.
- Fan-out multi-instance.
- Indikator mengetik dan status online.
- Route gateway (issue terpisah).

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "chat-service-websocket-realtime",
  "title": "Chat-service mengirim pesan baru secara realtime lewat WebSocket dengan tiket sekali pakai",
  "estimate": "L",
  "complexity": "high",
  "repositories": [
    "chat"
  ],
  "blockedByDraftKeys": [
    "chat-service-core-api",
    "chat-service-conversation-contexts"
  ],
  "body": {
    "backgroundProblem": "Owner memutuskan pesan baru muncul lewat WebSocket sejak awal. Web memanggil backend hanya dari server (`kelolakelas-web/lib/gateway.ts:148-176`, kelolakelas-docs `docs/components/web.md:60-64`) dan menyimpan JWT di cookie `httpOnly` (`app/(auth)/login/_actions/actions.ts:73-74`). Akibatnya browser tidak dapat mengirim header `Authorization` saat membuka WebSocket. Belum ada library WebSocket di repo Go mana pun.",
    "goal": "Klien terautentikasi dapat membuka WebSocket dengan tiket sekali pakai dan menerima event pesan baru serta status baca untuk percakapan yang boleh dilihatnya, tanpa polling.",
    "requirements": [
      "`POST /api/v1/chat/ws-tickets` (JWT wajib) mengembalikan `ticket` acak minimal 32 byte dan `expires_at`. Tiket berlaku paling lama 60 detik, sekali pakai, hanya disimpan sebagai hash, dan terikat ke `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent`, serta `exp` token.",
      "`GET /api/v1/chat/ws?ticket=` melakukan upgrade WebSocket hanya bila tiket valid, belum dipakai, dan belum kedaluwarsa. Selain itu request ditolak 401 sebelum upgrade.",
      "Server mengirim event JSON `message.created` (`conversation_id` dan pesan) dan `conversation.read` (`conversation_id`, `user_id`, penanda baca) hanya ke koneksi yang lolos fungsi visibilitas yang sama dengan REST.",
      "Pesan tetap dikirim lewat REST; selain ping/pong, WebSocket hanya berarah dari server ke klien.",
      "Ping dikirim setiap 30 detik. Koneksi ditutup bila pong tidak diterima dalam dua interval, saat `exp` token tercapai, atau setelah umur koneksi 30 menit (klien lalu meminta tiket baru). Hak `chat:manage`/`report:read` koneksi dievaluasi saat terhubung.",
      "Ada batas ukuran frame dari klien (mis. 4 KB) dan batas jumlah koneksi per pengguna (mis. 5) untuk mencegah penyalahgunaan.",
      "Fan-out memakai hub di memori untuk satu instance, dan shutdown menutup koneksi dengan close code normal."
    ],
    "acceptanceCriteria": [
      "Klien dengan tiket valid menerima `message.created` untuk pesan yang dikirim peserta lain lewat REST, tanpa reload.",
      "Klien yang tidak berhak melihat percakapan, termasuk anggota tenant lain dan parent lain, tidak menerima event-nya.",
      "Tiket kedaluwarsa, sudah dipakai, atau acak ditolak 401 tanpa upgrade.",
      "Koneksi ditutup saat token kedaluwarsa atau setelah batas umur koneksi tercapai.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: autentikasi WebSocket dan kebocoran event. Mitigasinya:\n- tiket sekali pakai berumur pendek, dan JWT tidak pernah dikirim lewat query;\n- tiket disimpan sebagai hash;\n- fan-out lewat fungsi visibilitas tunggal.\n\nPilih library WebSocket Go yang aktif dipelihara dan lolos govulncheck, lalu catat alasannya di ADR. Gateway meneruskan upgrade dan menegakkan Origin lewat `CORSMiddleware` (api-gateway `internal/delivery/http/router.go:76`). Access log gateway hanya mencatat path tanpa query (`internal/delivery/http/middleware/access_log_middleware.go:35-40`), sehingga tiket tidak tercatat.\n\nAsumsi: chat-service berjalan satu instance. Fan-out multi-instance (mis. PostgreSQL LISTEN/NOTIFY) di luar scope dan dicatat sebagai risiko.\n\nPerbarui kelolakelas-docs: `docs/api/chat.md` (protokol event), `docs/components/chat-service.md`, dan ADR baru untuk autentikasi WebSocket berbasis tiket.",
    "relevantAreas": [
      "kelolakelas-chat-service/cmd/server",
      "kelolakelas-chat-service/internal/delivery",
      "kelolakelas-chat-service/internal/usecase",
      "kelolakelas-chat-service/migrations"
    ],
    "edgeCases": [
      "Tiket yang sama dipakai dua kali bersamaan; hanya satu yang berhasil.",
      "Klien lambat yang buffer kirimnya penuh diputus agar tidak memblokir hub.",
      "Permission dicabut saat koneksi masih terbuka; perubahan berlaku paling lambat saat batas umur koneksi.",
      "Pengguna membuka beberapa tab."
    ],
    "testingValidation": [
      "Unit test tiket (kedaluwarsa, sekali pakai, hash) dan hub (fan-out hanya ke koneksi yang berhak).",
      "Integration test WebSocket dengan `httptest` untuk upgrade, event, isolasi tenant/parent sebagai mitigasi kebocoran, dan penutupan saat token kedaluwarsa.",
      "Test race untuk pemakaian tiket bersamaan dengan `go test -race`.",
      "CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Mengirim pesan lewat WebSocket.",
      "Fan-out multi-instance.",
      "Indikator mengetik dan status online.",
      "Route gateway (issue terpisah)."
    ]
  },
  "labels": [
    "chat",
    "ai-ready"
  ]
}
```
