## Background / Problem

Web belum memiliki halaman chat maupun library WebSocket. Semua panggilan backend berjalan di Server Actions/Components ke `GATEWAY_API_URL`, yang sengaja server-only (`lib/gateway.ts:148-176`, kelolakelas-docs `docs/components/web.md:60-64`). Satu-satunya pola pembaruan berkala saat ini adalah `PaymentReturnRefresher` (`router.refresh()`). Navigasi tenant didefinisikan di `app/(dashboard)/dashboard/tenant/_constants/constants.ts`, dan halaman parent ada di `app/(dashboard)/dashboard/parent/{students,enrollments}`.

## Goal

Parent dan anggota tenant dapat melihat daftar percakapan, membuka percakapan, mengirim pesan, dan melihat pesan baru tanpa reload.

## Requirements

- Halaman `/dashboard/parent/chat` dan `/dashboard/tenant/chat` menampilkan daftar percakapan (jenis, konteks snapshot, pesan terakhir, jumlah belum dibaca) dan panel percakapan yang dipilih.
- Pesan dikirim lewat Server Action ke `POST /api/v1/chat/conversations/:id/messages` dengan `client_message_id` yang dibuat klien. Pesan tampil optimis, lalu dikonfirmasi atau ditandai gagal dengan opsi kirim ulang.
- Membuka percakapan memanggil `POST /api/v1/chat/conversations/:id/read`.
- Anggota tenant dapat memulai percakapan dengan admin tenant (`kind` `staff`) dari halaman chat tenant.
- Realtime berjalan begini: Server Action meminta tiket (`POST /api/v1/chat/ws-tickets`) memakai cookie auth, lalu komponen klien membuka WebSocket ke env publik baru `NEXT_PUBLIC_CHAT_WS_URL` (origin ws/wss gateway) + `/api/v1/chat/ws?ticket=`. Event `message.created` dan `conversation.read` memperbarui daftar dan panel.
- Saat koneksi putus atau ditutup server, klien reconnect dengan backoff dan tiket baru, lalu mengambil ulang pesan yang terlewat. Bila `NEXT_PUBLIC_CHAT_WS_URL` kosong atau koneksi gagal, halaman tetap berfungsi dengan refresh manual dan menampilkan status koneksi.
- Tautan ke chat ditambahkan di navigasi tenant dan di halaman parent yang sudah ada.
- Isi pesan dirender sebagai teks biasa tanpa HTML, dengan pemisah baris dipertahankan.

## Acceptance Criteria

- [ ] Parent dan admin tenant di dua browser melihat pesan satu sama lain muncul tanpa reload.
- [ ] Anggota tenant memulai percakapan dengan admin tenant, dan admin melihatnya di daftar.
- [ ] Pesan yang gagal terkirim ditandai dan dapat dikirim ulang tanpa duplikasi.
- [ ] Saat WebSocket tidak tersedia, halaman menampilkan status terputus dan tetap dapat mengirim serta memuat pesan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Sesuai keputusan owner, realtime memakai WebSocket sejak awal. `NEXT_PUBLIC_CHAT_WS_URL` sengaja membuka origin WebSocket gateway ke browser, sebagai pengecualian dari prinsip gateway server-only; JWT tetap tidak pernah dikirim ke browser, hanya tiket sekali pakai. Saat ini tidak ada CSP di `next.config.ts`. Error 404 dari chat ditampilkan sebagai "Percakapan tidak ditemukan". Nama tampilan pengirim di luar scope: tampilkan "Anda", "Tenant", "Pengajar", atau "Parent" berdasarkan `sender_kind` dan jenis percakapan. Perbarui `.env.example` web, serta kelolakelas-docs `docs/components/web.md` dan `docs/reference/environment-variables.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts`
- `kelolakelas-web/lib/gateway.ts`
- `kelolakelas-web/.env.example`

## Edge Cases

- Tiket kedaluwarsa sebelum koneksi dibuka; klien meminta tiket baru sekali.
- Event datang untuk percakapan yang belum ada di daftar; daftar dimuat ulang.
- Beberapa tab terbuka.
- Pesan panjang dan multi-baris.
- Cookie sesi kedaluwarsa saat meminta tiket; pengguna diarahkan ke login seperti di halaman lain.

## Testing / Validation

- [ ] Vitest untuk state chat: penerapan event, optimistic update, dan dedup `client_message_id`.
- [ ] Test komponen untuk status koneksi dan fallback tanpa WebSocket.
- [ ] Test Server Actions untuk pemetaan error 401, 404, dan 400.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Tombol memulai chat dari permintaan jadwal dan report (issue terpisah).
- Notifikasi di luar halaman chat.
- Lampiran dan nama tampilan pengirim.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "web-chat-inbox-realtime",
  "title": "Parent dan anggota tenant membaca dan membalas chat di web dengan pesan baru muncul realtime",
  "estimate": "L",
  "complexity": "medium",
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "gateway-chat-routes"
  ],
  "body": {
    "backgroundProblem": "Web belum memiliki halaman chat maupun library WebSocket. Semua panggilan backend berjalan di Server Actions/Components ke `GATEWAY_API_URL`, yang sengaja server-only (`lib/gateway.ts:148-176`, kelolakelas-docs `docs/components/web.md:60-64`). Satu-satunya pola pembaruan berkala saat ini adalah `PaymentReturnRefresher` (`router.refresh()`). Navigasi tenant didefinisikan di `app/(dashboard)/dashboard/tenant/_constants/constants.ts`, dan halaman parent ada di `app/(dashboard)/dashboard/parent/{students,enrollments}`.",
    "goal": "Parent dan anggota tenant dapat melihat daftar percakapan, membuka percakapan, mengirim pesan, dan melihat pesan baru tanpa reload.",
    "requirements": [
      "Halaman `/dashboard/parent/chat` dan `/dashboard/tenant/chat` menampilkan daftar percakapan (jenis, konteks snapshot, pesan terakhir, jumlah belum dibaca) dan panel percakapan yang dipilih.",
      "Pesan dikirim lewat Server Action ke `POST /api/v1/chat/conversations/:id/messages` dengan `client_message_id` yang dibuat klien. Pesan tampil optimis, lalu dikonfirmasi atau ditandai gagal dengan opsi kirim ulang.",
      "Membuka percakapan memanggil `POST /api/v1/chat/conversations/:id/read`.",
      "Anggota tenant dapat memulai percakapan dengan admin tenant (`kind` `staff`) dari halaman chat tenant.",
      "Realtime berjalan begini: Server Action meminta tiket (`POST /api/v1/chat/ws-tickets`) memakai cookie auth, lalu komponen klien membuka WebSocket ke env publik baru `NEXT_PUBLIC_CHAT_WS_URL` (origin ws/wss gateway) + `/api/v1/chat/ws?ticket=`. Event `message.created` dan `conversation.read` memperbarui daftar dan panel.",
      "Saat koneksi putus atau ditutup server, klien reconnect dengan backoff dan tiket baru, lalu mengambil ulang pesan yang terlewat. Bila `NEXT_PUBLIC_CHAT_WS_URL` kosong atau koneksi gagal, halaman tetap berfungsi dengan refresh manual dan menampilkan status koneksi.",
      "Tautan ke chat ditambahkan di navigasi tenant dan di halaman parent yang sudah ada.",
      "Isi pesan dirender sebagai teks biasa tanpa HTML, dengan pemisah baris dipertahankan."
    ],
    "acceptanceCriteria": [
      "Parent dan admin tenant di dua browser melihat pesan satu sama lain muncul tanpa reload.",
      "Anggota tenant memulai percakapan dengan admin tenant, dan admin melihatnya di daftar.",
      "Pesan yang gagal terkirim ditandai dan dapat dikirim ulang tanpa duplikasi.",
      "Saat WebSocket tidak tersedia, halaman menampilkan status terputus dan tetap dapat mengirim serta memuat pesan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Sesuai keputusan owner, realtime memakai WebSocket sejak awal. `NEXT_PUBLIC_CHAT_WS_URL` sengaja membuka origin WebSocket gateway ke browser, sebagai pengecualian dari prinsip gateway server-only; JWT tetap tidak pernah dikirim ke browser, hanya tiket sekali pakai. Saat ini tidak ada CSP di `next.config.ts`. Error 404 dari chat ditampilkan sebagai \"Percakapan tidak ditemukan\". Nama tampilan pengirim di luar scope: tampilkan \"Anda\", \"Tenant\", \"Pengajar\", atau \"Parent\" berdasarkan `sender_kind` dan jenis percakapan. Perbarui `.env.example` web, serta kelolakelas-docs `docs/components/web.md` dan `docs/reference/environment-variables.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts",
      "kelolakelas-web/lib/gateway.ts",
      "kelolakelas-web/.env.example"
    ],
    "edgeCases": [
      "Tiket kedaluwarsa sebelum koneksi dibuka; klien meminta tiket baru sekali.",
      "Event datang untuk percakapan yang belum ada di daftar; daftar dimuat ulang.",
      "Beberapa tab terbuka.",
      "Pesan panjang dan multi-baris.",
      "Cookie sesi kedaluwarsa saat meminta tiket; pengguna diarahkan ke login seperti di halaman lain."
    ],
    "testingValidation": [
      "Vitest untuk state chat: penerapan event, optimistic update, dan dedup `client_message_id`.",
      "Test komponen untuk status koneksi dan fallback tanpa WebSocket.",
      "Test Server Actions untuk pemetaan error 401, 404, dan 400.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Tombol memulai chat dari permintaan jadwal dan report (issue terpisah).",
      "Notifikasi di luar halaman chat.",
      "Lampiran dan nama tampilan pengirim."
    ]
  },
  "labels": [
    "web",
    "ai-ready"
  ]
}
```
