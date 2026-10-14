## Background / Problem

Chat-service mendukung percakapan schedule_request (KEL-120), gateway menghubungkannya (KEL-122), dan inbox serta entry point web (KEL-123/KEL-124) telah tersedia pada main. KEL-128 menyediakan email payment link private. Approval menghasilkan checkout URL, tetapi belum ada aksi tenant yang mengirim payment link terotorisasi ke percakapan parent pemilik request. Pada 14 Oktober 2026, status Done seluruh dependency dan 29 PR terkait diperiksa ulang melalui provider; semuanya merged ke main, commit reachable setelah fetch dan checks reported SUCCESS. Bukti runtime tersimpan terpisah pada pr-evidence.json, bukan dianggap benar hanya karena klaim contract.

## Goal

Tenant berizin dapat membagikan payment link dari request yang disetujui ke percakapan parent yang sama tanpa bocor ke tenant atau parent lain.

## Requirements

- Dari request yang approved dan invoice masih valid, sediakan aksi kirim link ke percakapan `schedule_request` yang terikat ID request dan parent pemiliknya; otorisasi server-side dan idempotency wajib.
- Tautkan aksi kirim payment link pada UI tenant existing, memakai inbox KEL-123 dan entry point KEL-124 yang sudah tersedia; sediakan loading/success/error serta retry yang jelas.
- Jangan izinkan URL arbitrer dari klien; server mendapatkan link dari transaksi terotorisasi, memeriksa expiry/status sebelum mengirim, dan pesan tidak memuat data pribadi berlebihan.
- Gagal kirim chat tidak mengubah enrollment atau invoice; retry aman dan status delivery teramati.
- Tambahkan route protected gateway menuju aksi academic yang memverifikasi request, invoice, parent dan tenant sebelum pengiriman; jangan mengekspos internal credential atau endpoint chat internal sebagai public proxy.

## Acceptance Criteria

- [ ] Admin tenant yang berizin mengirim payment link invoice valid ke percakapan schedule_request yang benar; parent pemilik membaca pesan melalui inbox existing.
- [ ] Tenant/parent lain tidak bisa memicu atau membaca pesan/link; request ditolak/expired tidak dapat dibagikan sebagai link aktif.
- [ ] Retry dan dua klik bersamaan tidak menciptakan dua invoice atau banyak pesan yang tak disengaja.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly
- [ ] Aksi web melewati gateway authenticated dan server authorization tetap fail-closed; permission ditetapkan dari mapping existing academic/chat sesuai kebutuhan aksi.
- [ ] Invoice tanpa checkout URL, expired/paid/cancelled atau request yang tidak approved ditolak untuk pengiriman link pembayaran aktif dengan pesan jelas.

## Technical Notes

Penyelarasan readiness diotorisasi pengguna pada 14 Oktober 2026 WIB melalui “lanjutkan sesuai rekomendasi anda”. Scope academic + chat + web + api-gateway. Bukti kode: gateway internal/delivery/http/router.go mendaftarkan setiap route schedule-request secara eksplisit dan belum memiliki aksi kirim payment link; route protected baru dibutuhkan untuk alur web → gateway → academic → chat. Academic adalah sumber trusted request/parent/enrollment dan mengambil invoice melalui API billing yang sudah ada; billing tidak berubah. Jangan menaruh kredensial service pada web atau menerima URL arbitrer dari browser. Risiko high: link lintas tenant/parent, invoice expired di antara read/send, dan pesan duplikat pada retry. Gunakan boundary internal authenticated academic/chat dan idempotency pengiriman per request/invoice, pertahankan enrollment/invoice saat delivery gagal. KEL-128, KEL-123 dan KEL-124 menjadi dependency langsung pada native blockedBy dan contract; seluruh dependency turunannya dicakup snapshot graph validasi. Klaim status lama Backlog telah dibuang; sebelum implementasi selalu refresh bukti merge/CI/reachability serta pekerjaan aktif. Hermes kel-autopilot berjalan pada mesin lain menurut pengguna; runtime cron/kanban tidak terverifikasi dari workspace ini. Perbarui docs API gateway/academic/chat, private flow dan security; catat ADR bila kontrak internal baru menjadi keputusan arsitektur.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-chat-service/internal/chat/chat.go`
- `kelolakelas-chat-service/internal/delivery/http/handler.go`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`

## Edge Cases

- Request telah ditolak atau invoice expired di antara read dan send.
- Percakapan belum dibuat; tenant mengirim bersamaan dari dua tab.
- Chat-service 503 setelah invoice dibuat.

## Testing / Validation

- [ ] Uji end-to-end isolasi tenant/parent, status invoice, claim retry dan concurrent send dengan stub chat.
- [ ] Uji browser tenant kirim lalu parent membaca pada inbox existing, termasuk conversation yang belum dibuat, retry delivery, expired invoice dan foreign tenant/parent.
- [ ] Jalankan test, lint, type check/build pada semua repo yang berubah.
- [ ] Regression gateway authenticated proxy dan internal credential tidak diterima dari header client; permission/membership/session revocation fail-closed.
- [ ] Uji invoice VA/QRIS/kartu sesuai URL/status backend yang didukung; jangan membuat invoice baru saat hanya mengirim chat.
- [ ] Required GitHub CI seluruh repository yang berubah sukses, PR menuju main dan documentation current sebelum Done.

## Out of Scope

- Membangun ulang inbox atau entry point KEL-123/124.
- Memperbolehkan klien mengirim URL checkout arbitrer.
- Mengubah cron, state atau konfigurasi Hermes kel-autopilot.
- Mengubah pilihan metode pembayaran private KEL-133 atau menciptakan invoice baru saat send.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-payment-link-chat",
  "projectKey": "private-payment-link-delivery",
  "title": "Payment link private dapat dikirim lewat percakapan request yang tepat",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "academic",
    "chat",
    "web",
    "api-gateway"
  ],
  "labels": [
    "academic",
    "chat",
    "web",
    "api-gateway",
    "ai-ready"
  ],
  "blockedByDraftKeys": [
    "private-payment-link-email",
    "web-chat-inbox-realtime",
    "web-chat-entry-points"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Chat-service mendukung percakapan schedule_request (KEL-120), gateway menghubungkannya (KEL-122), dan inbox serta entry point web (KEL-123/KEL-124) telah tersedia pada main. KEL-128 menyediakan email payment link private. Approval menghasilkan checkout URL, tetapi belum ada aksi tenant yang mengirim payment link terotorisasi ke percakapan parent pemilik request. Pada 14 Oktober 2026, status Done seluruh dependency dan 29 PR terkait diperiksa ulang melalui provider; semuanya merged ke main, commit reachable setelah fetch dan checks reported SUCCESS. Bukti runtime tersimpan terpisah pada pr-evidence.json, bukan dianggap benar hanya karena klaim contract.",
    "goal": "Tenant berizin dapat membagikan payment link dari request yang disetujui ke percakapan parent yang sama tanpa bocor ke tenant atau parent lain.",
    "requirements": [
      "Dari request yang approved dan invoice masih valid, sediakan aksi kirim link ke percakapan `schedule_request` yang terikat ID request dan parent pemiliknya; otorisasi server-side dan idempotency wajib.",
      "Tautkan aksi kirim payment link pada UI tenant existing, memakai inbox KEL-123 dan entry point KEL-124 yang sudah tersedia; sediakan loading/success/error serta retry yang jelas.",
      "Jangan izinkan URL arbitrer dari klien; server mendapatkan link dari transaksi terotorisasi, memeriksa expiry/status sebelum mengirim, dan pesan tidak memuat data pribadi berlebihan.",
      "Gagal kirim chat tidak mengubah enrollment atau invoice; retry aman dan status delivery teramati.",
      "Tambahkan route protected gateway menuju aksi academic yang memverifikasi request, invoice, parent dan tenant sebelum pengiriman; jangan mengekspos internal credential atau endpoint chat internal sebagai public proxy."
    ],
    "acceptanceCriteria": [
      "Admin tenant yang berizin mengirim payment link invoice valid ke percakapan schedule_request yang benar; parent pemilik membaca pesan melalui inbox existing.",
      "Tenant/parent lain tidak bisa memicu atau membaca pesan/link; request ditolak/expired tidak dapat dibagikan sebagai link aktif.",
      "Retry dan dua klik bersamaan tidak menciptakan dua invoice atau banyak pesan yang tak disengaja.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly",
      "Aksi web melewati gateway authenticated dan server authorization tetap fail-closed; permission ditetapkan dari mapping existing academic/chat sesuai kebutuhan aksi.",
      "Invoice tanpa checkout URL, expired/paid/cancelled atau request yang tidak approved ditolak untuk pengiriman link pembayaran aktif dengan pesan jelas."
    ],
    "technicalNotes": "Penyelarasan readiness diotorisasi pengguna pada 14 Oktober 2026 WIB melalui “lanjutkan sesuai rekomendasi anda”. Scope academic + chat + web + api-gateway. Bukti kode: gateway internal/delivery/http/router.go mendaftarkan setiap route schedule-request secara eksplisit dan belum memiliki aksi kirim payment link; route protected baru dibutuhkan untuk alur web → gateway → academic → chat. Academic adalah sumber trusted request/parent/enrollment dan mengambil invoice melalui API billing yang sudah ada; billing tidak berubah. Jangan menaruh kredensial service pada web atau menerima URL arbitrer dari browser. Risiko high: link lintas tenant/parent, invoice expired di antara read/send, dan pesan duplikat pada retry. Gunakan boundary internal authenticated academic/chat dan idempotency pengiriman per request/invoice, pertahankan enrollment/invoice saat delivery gagal. KEL-128, KEL-123 dan KEL-124 menjadi dependency langsung pada native blockedBy dan contract; seluruh dependency turunannya dicakup snapshot graph validasi. Klaim status lama Backlog telah dibuang; sebelum implementasi selalu refresh bukti merge/CI/reachability serta pekerjaan aktif. Hermes kel-autopilot berjalan pada mesin lain menurut pengguna; runtime cron/kanban tidak terverifikasi dari workspace ini. Perbarui docs API gateway/academic/chat, private flow dan security; catat ADR bila kontrak internal baru menjadi keputusan arsitektur.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-chat-service/internal/chat/chat.go",
      "kelolakelas-chat-service/internal/delivery/http/handler.go",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go"
    ],
    "edgeCases": [
      "Request telah ditolak atau invoice expired di antara read dan send.",
      "Percakapan belum dibuat; tenant mengirim bersamaan dari dua tab.",
      "Chat-service 503 setelah invoice dibuat."
    ],
    "testingValidation": [
      "Uji end-to-end isolasi tenant/parent, status invoice, claim retry dan concurrent send dengan stub chat.",
      "Uji browser tenant kirim lalu parent membaca pada inbox existing, termasuk conversation yang belum dibuat, retry delivery, expired invoice dan foreign tenant/parent.",
      "Jalankan test, lint, type check/build pada semua repo yang berubah.",
      "Regression gateway authenticated proxy dan internal credential tidak diterima dari header client; permission/membership/session revocation fail-closed.",
      "Uji invoice VA/QRIS/kartu sesuai URL/status backend yang didukung; jangan membuat invoice baru saat hanya mengirim chat.",
      "Required GitHub CI seluruh repository yang berubah sukses, PR menuju main dan documentation current sebelum Done."
    ],
    "outOfScope": [
      "Membangun ulang inbox atau entry point KEL-123/124.",
      "Memperbolehkan klien mengirim URL checkout arbitrer.",
      "Mengubah cron, state atau konfigurasi Hermes kel-autopilot.",
      "Mengubah pilihan metode pembayaran private KEL-133 atau menciptakan invoice baru saat send."
    ]
  }
}
```
