## Background / Problem

Chat-service mendukung `schedule_request` (KEL-120) dan gateway memproxy-nya (KEL-122); inbox dan entry point web KEL-123/124 masih Backlog. Approval private sudah menghasilkan checkout URL, tetapi tidak ada aksi tenant yang membagikannya ke percakapan parent.

## Goal

Tenant berizin dapat membagikan payment link dari request yang disetujui ke percakapan parent yang sama tanpa bocor ke tenant atau parent lain.

## Requirements

- Dari request yang approved dan invoice masih valid, sediakan aksi kirim link ke percakapan `schedule_request` yang terikat ID request dan parent pemiliknya; otorisasi server-side dan idempotency wajib.
- Tautkan aksi pada UI tenant yang ada tanpa membangun ulang inbox KEL-123 atau entry point KEL-124; bila inbox belum tersedia, nyatakan prasyarat UI untuk uji E2E.
- Jangan izinkan URL arbitrer dari klien; server mendapatkan link dari transaksi terotorisasi, memeriksa expiry/status sebelum mengirim, dan pesan tidak memuat data pribadi berlebihan.
- Gagal kirim chat tidak mengubah enrollment atau invoice; retry aman dan status delivery teramati.

## Acceptance Criteria

- [ ] Admin tenant yang berizin mengirim link ke percakapan request yang benar; parent pemilik melihatnya ketika inbox KEL-123 tersedia.
- [ ] Tenant/parent lain tidak bisa memicu atau membaca pesan/link; request ditolak/expired tidak dapat dibagikan sebagai link aktif.
- [ ] Retry dan dua klik bersamaan tidak menciptakan dua invoice atau banyak pesan yang tak disengaja.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: bocornya checkout URL lintas tenant/parent, serta pesan ganda pada retry. Hak akses wajib dicek oleh academic + chat, bukan hanya UI; kontrak internal baru harus diautentikasi dan menghindari input URL bebas. KEL-123/124 sudah Backlog: backend contract boleh dibangun lebih awal, tetapi sebelum label ai-ready dan penerimaan end-to-end, relasi native `blockedBy` ke KEL-123/124 harus ditambahkan secara eksplisit pada write phase atau issue baru menunggu keduanya Done; `blockedByDraftKeys` hanya memuat issue dalam run ini. Jika kedua issue belum selesai saat persetujuan, jangan aktifkan `ai-ready` untuk item ini sampai relasi native dan kontrak dapat direkonsiliasi sesuai mekanisme lintas-run. Perbarui docs chat/private flow/security.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-chat-service/internal/chat/chat.go`
- `kelolakelas-chat-service/internal/delivery/http/handler.go`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests`

## Edge Cases

- Request telah ditolak atau invoice expired di antara read dan send.
- Percakapan belum dibuat; tenant mengirim bersamaan dari dua tab.
- Chat-service 503 setelah invoice dibuat.

## Testing / Validation

- [ ] Uji end-to-end isolasi tenant/parent, status invoice, claim retry dan concurrent send dengan stub chat.
- [ ] Setelah KEL-123/124 selesai, uji manual tenant kirim lalu parent membaca di inbox; catat jika belum bisa karena blocker.
- [ ] Jalankan test, lint, type check/build pada semua repo yang berubah.

## Out of Scope

- Membangun ulang inbox atau entry point KEL-123/124.
- Memperbolehkan klien mengirim URL checkout arbitrer.

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
    "web"
  ],
  "labels": [
    "academic",
    "chat",
    "web",
    "ai-ready"
  ],
  "blockedByDraftKeys": [
    "private-payment-link-email"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Chat-service mendukung `schedule_request` (KEL-120) dan gateway memproxy-nya (KEL-122); inbox dan entry point web KEL-123/124 masih Backlog. Approval private sudah menghasilkan checkout URL, tetapi tidak ada aksi tenant yang membagikannya ke percakapan parent.",
    "goal": "Tenant berizin dapat membagikan payment link dari request yang disetujui ke percakapan parent yang sama tanpa bocor ke tenant atau parent lain.",
    "requirements": [
      "Dari request yang approved dan invoice masih valid, sediakan aksi kirim link ke percakapan `schedule_request` yang terikat ID request dan parent pemiliknya; otorisasi server-side dan idempotency wajib.",
      "Tautkan aksi pada UI tenant yang ada tanpa membangun ulang inbox KEL-123 atau entry point KEL-124; bila inbox belum tersedia, nyatakan prasyarat UI untuk uji E2E.",
      "Jangan izinkan URL arbitrer dari klien; server mendapatkan link dari transaksi terotorisasi, memeriksa expiry/status sebelum mengirim, dan pesan tidak memuat data pribadi berlebihan.",
      "Gagal kirim chat tidak mengubah enrollment atau invoice; retry aman dan status delivery teramati."
    ],
    "acceptanceCriteria": [
      "Admin tenant yang berizin mengirim link ke percakapan request yang benar; parent pemilik melihatnya ketika inbox KEL-123 tersedia.",
      "Tenant/parent lain tidak bisa memicu atau membaca pesan/link; request ditolak/expired tidak dapat dibagikan sebagai link aktif.",
      "Retry dan dua klik bersamaan tidak menciptakan dua invoice atau banyak pesan yang tak disengaja.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: bocornya checkout URL lintas tenant/parent, serta pesan ganda pada retry. Hak akses wajib dicek oleh academic + chat, bukan hanya UI; kontrak internal baru harus diautentikasi dan menghindari input URL bebas. KEL-123/124 sudah Backlog: backend contract boleh dibangun lebih awal, tetapi sebelum label ai-ready dan penerimaan end-to-end, relasi native `blockedBy` ke KEL-123/124 harus ditambahkan secara eksplisit pada write phase atau issue baru menunggu keduanya Done; `blockedByDraftKeys` hanya memuat issue dalam run ini. Jika kedua issue belum selesai saat persetujuan, jangan aktifkan `ai-ready` untuk item ini sampai relasi native dan kontrak dapat direkonsiliasi sesuai mekanisme lintas-run. Perbarui docs chat/private flow/security.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-chat-service/internal/chat/chat.go",
      "kelolakelas-chat-service/internal/delivery/http/handler.go",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests"
    ],
    "edgeCases": [
      "Request telah ditolak atau invoice expired di antara read dan send.",
      "Percakapan belum dibuat; tenant mengirim bersamaan dari dua tab.",
      "Chat-service 503 setelah invoice dibuat."
    ],
    "testingValidation": [
      "Uji end-to-end isolasi tenant/parent, status invoice, claim retry dan concurrent send dengan stub chat.",
      "Setelah KEL-123/124 selesai, uji manual tenant kirim lalu parent membaca di inbox; catat jika belum bisa karena blocker.",
      "Jalankan test, lint, type check/build pada semua repo yang berubah."
    ],
    "outOfScope": [
      "Membangun ulang inbox atau entry point KEL-123/124.",
      "Memperbolehkan klien mengirim URL checkout arbitrer."
    ]
  }
}
```
