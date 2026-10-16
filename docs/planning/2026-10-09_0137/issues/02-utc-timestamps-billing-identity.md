## Background / Problem

QA end-to-end pada stack lokal (proses berjalan dengan zona host `Asia/Jakarta`) menemukan tenggat yang tampil 7 jam terlalu lambat. Checkout VA pada 9 Okt 2026 00:26 WIB menyimpan `transactions.invoice_expires_at` = `2026-10-23 00:26`, API mengembalikannya sebagai `2026-10-23T00:26:00Z`, dan web menampilkan "23 Okt 2026, 07.26 WIB". `created_at` pada baris yang sama (default DB `now()`) benar (`17:26Z`). Undangan anggota yang dibuat 00:31 WIB menampilkan "Valid until 11 Oct 2026, 07:31 WIB" padahal masa berlaku 48 jam. Penyebab: billing dan identity menulis `time.Now()` waktu lokal proses ke kolom `timestamp without time zone`, sementara koneksi memakai `TimeZone=UTC` (`pkg/database/db.go`), sehingga nilai dibaca kembali sebagai UTC. Perbandingan sisi server (mis. `transaction_usecase.go` `InvoiceExpiresAt.After(time.Now())`, query expiry `invoice_expires_at <= ?` di `transaction_repository.go`, `time.Now().After(invitation.ExpiresAt)` di identity) ikut bergantung pada zona proses. Proses dengan TZ=UTC tidak terdampak, jadi ini bug yang bergantung pada konfigurasi.

## Goal

Timestamp yang ditulis aplikasi billing dan identity selalu bermakna UTC, terlepas dari zona waktu proses, sehingga tenggat invoice dan undangan yang dikembalikan API dan ditampilkan web benar.

## Requirements

- Billing menyimpan dan membandingkan `invoice_expires_at`, `expired_at`, `paid_at`, `updated_at`, dan timestamp lain yang ditulis aplikasi sebagai UTC, terlepas dari zona proses.
- Identity menyimpan dan membandingkan `tenant_invitations.expires_at` dan timestamp lain yang ditulis aplikasi sebagai UTC, terlepas dari zona proses.
- Respons API untuk transaksi dan undangan mengembalikan instant yang benar (mis. invoice dibuat 17:26Z dengan validitas 14 hari kedaluwarsa 14 hari setelah 17:26Z).
- Job expiry invoice, reminder, dan pengecekan kedaluwarsa undangan memakai instant yang konsisten dengan nilai tersimpan.
- Kontrak JSON (nama field dan format RFC 3339) tidak berubah.

## Acceptance Criteria

- [ ] Dengan proses billing dan identity dijalankan pada `TZ=Asia/Jakarta`, invoice baru menampilkan tenggat yang sama dengan waktu pembuatan ditambah masa berlaku di halaman instruksi pembayaran.
- [ ] Dengan `TZ=Asia/Jakarta`, undangan baru menampilkan "Valid until" tepat 48 jam setelah dibuat.
- [ ] Hasil di atas sama ketika proses dijalankan pada `TZ=UTC`.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: financial correctness, karena expiry invoice menentukan apakah pembayaran masih diterima atau transaksi ditandai `expired` (lihat ADR 0009 local invoice expiry). Perubahan cara penulisan timestamp tidak boleh membuat invoice yang masih berlaku dianggap kedaluwarsa atau sebaliknya. Pendekatan (normalisasi UTC saat menulis, konfigurasi `NowFunc` GORM, dan/atau migrasi kolom ke `timestamptz`) belum disepakati dan diserahkan ke implementasi, dengan syarat kompatibel ke belakang. Asumsi eksplisit: zona proses di deployment belum diverifikasi, sehingga backfill data lama tidak termasuk issue ini. Academic juga menulis `time.Now()` ke kolom `timestamp` tetapi tidak menunjukkan gejala yang teramati di QA, sehingga tidak termasuk. Perbarui kelolakelas-docs `docs/data/billing-schema.md`, `docs/data/identity-schema.md`, dan `docs/08-known-gaps-and-risks.md`.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/domain/transaction.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/pkg/database/db.go`
- `kelolakelas-identity-service/internal/usecase/invitation_usecase.go`
- `kelolakelas-identity-service/pkg/database/db.go`

## Edge Cases

- Invoice yang dibuat sebelum perubahan dan masih pending saat deploy.
- Callback pembayaran yang tiba tepat di sekitar tenggat invoice.
- Undangan yang dibuat sebelum perubahan lalu diverifikasi sesudahnya.
- Proses berjalan pada zona dengan offset negatif.

## Testing / Validation

- [ ] Unit/integration test yang menjalankan pembuatan dan pengecekan expiry dengan `time.Local` atau `TZ` non-UTC (mis. `Asia/Jakarta`) dan memastikan nilai tersimpan serta respons API dalam UTC.
- [ ] Validasi risiko: test bahwa invoice dengan tenggat di masa depan tidak ditandai `expired` oleh job expiry pada zona proses non-UTC.
- [ ] Existing tests pass, `go test ./...` dan lint pass di billing dan identity, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Backfill atau koreksi data lama yang sudah tersimpan dalam waktu lokal.
- Normalisasi timestamp di academic dan chat.
- Perubahan tampilan zona waktu di web.

## AI Orchestrator Contract

```json
{
  "draftKey": "utc-timestamps-billing-identity",
  "projectKey": null,
  "title": "Batas waktu invoice dan undangan tampil bergeser +7 jam karena timestamp lokal disimpan tanpa zona",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "billing",
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "billing",
    "identity"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "QA end-to-end pada stack lokal (proses berjalan dengan zona host `Asia/Jakarta`) menemukan tenggat yang tampil 7 jam terlalu lambat. Checkout VA pada 9 Okt 2026 00:26 WIB menyimpan `transactions.invoice_expires_at` = `2026-10-23 00:26`, API mengembalikannya sebagai `2026-10-23T00:26:00Z`, dan web menampilkan \"23 Okt 2026, 07.26 WIB\". `created_at` pada baris yang sama (default DB `now()`) benar (`17:26Z`). Undangan anggota yang dibuat 00:31 WIB menampilkan \"Valid until 11 Oct 2026, 07:31 WIB\" padahal masa berlaku 48 jam. Penyebab: billing dan identity menulis `time.Now()` waktu lokal proses ke kolom `timestamp without time zone`, sementara koneksi memakai `TimeZone=UTC` (`pkg/database/db.go`), sehingga nilai dibaca kembali sebagai UTC. Perbandingan sisi server (mis. `transaction_usecase.go` `InvoiceExpiresAt.After(time.Now())`, query expiry `invoice_expires_at <= ?` di `transaction_repository.go`, `time.Now().After(invitation.ExpiresAt)` di identity) ikut bergantung pada zona proses. Proses dengan TZ=UTC tidak terdampak, jadi ini bug yang bergantung pada konfigurasi.",
    "goal": "Timestamp yang ditulis aplikasi billing dan identity selalu bermakna UTC, terlepas dari zona waktu proses, sehingga tenggat invoice dan undangan yang dikembalikan API dan ditampilkan web benar.",
    "requirements": [
      "Billing menyimpan dan membandingkan `invoice_expires_at`, `expired_at`, `paid_at`, `updated_at`, dan timestamp lain yang ditulis aplikasi sebagai UTC, terlepas dari zona proses.",
      "Identity menyimpan dan membandingkan `tenant_invitations.expires_at` dan timestamp lain yang ditulis aplikasi sebagai UTC, terlepas dari zona proses.",
      "Respons API untuk transaksi dan undangan mengembalikan instant yang benar (mis. invoice dibuat 17:26Z dengan validitas 14 hari kedaluwarsa 14 hari setelah 17:26Z).",
      "Job expiry invoice, reminder, dan pengecekan kedaluwarsa undangan memakai instant yang konsisten dengan nilai tersimpan.",
      "Kontrak JSON (nama field dan format RFC 3339) tidak berubah."
    ],
    "acceptanceCriteria": [
      "Dengan proses billing dan identity dijalankan pada `TZ=Asia/Jakarta`, invoice baru menampilkan tenggat yang sama dengan waktu pembuatan ditambah masa berlaku di halaman instruksi pembayaran.",
      "Dengan `TZ=Asia/Jakarta`, undangan baru menampilkan \"Valid until\" tepat 48 jam setelah dibuat.",
      "Hasil di atas sama ketika proses dijalankan pada `TZ=UTC`.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: financial correctness, karena expiry invoice menentukan apakah pembayaran masih diterima atau transaksi ditandai `expired` (lihat ADR 0009 local invoice expiry). Perubahan cara penulisan timestamp tidak boleh membuat invoice yang masih berlaku dianggap kedaluwarsa atau sebaliknya. Pendekatan (normalisasi UTC saat menulis, konfigurasi `NowFunc` GORM, dan/atau migrasi kolom ke `timestamptz`) belum disepakati dan diserahkan ke implementasi, dengan syarat kompatibel ke belakang. Asumsi eksplisit: zona proses di deployment belum diverifikasi, sehingga backfill data lama tidak termasuk issue ini. Academic juga menulis `time.Now()` ke kolom `timestamp` tetapi tidak menunjukkan gejala yang teramati di QA, sehingga tidak termasuk. Perbarui kelolakelas-docs `docs/data/billing-schema.md`, `docs/data/identity-schema.md`, dan `docs/08-known-gaps-and-risks.md`.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/domain/transaction.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/pkg/database/db.go",
      "kelolakelas-identity-service/internal/usecase/invitation_usecase.go",
      "kelolakelas-identity-service/pkg/database/db.go"
    ],
    "edgeCases": [
      "Invoice yang dibuat sebelum perubahan dan masih pending saat deploy.",
      "Callback pembayaran yang tiba tepat di sekitar tenggat invoice.",
      "Undangan yang dibuat sebelum perubahan lalu diverifikasi sesudahnya.",
      "Proses berjalan pada zona dengan offset negatif."
    ],
    "testingValidation": [
      "Unit/integration test yang menjalankan pembuatan dan pengecekan expiry dengan `time.Local` atau `TZ` non-UTC (mis. `Asia/Jakarta`) dan memastikan nilai tersimpan serta respons API dalam UTC.",
      "Validasi risiko: test bahwa invoice dengan tenggat di masa depan tidak ditandai `expired` oleh job expiry pada zona proses non-UTC.",
      "Existing tests pass, `go test ./...` dan lint pass di billing dan identity, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Backfill atau koreksi data lama yang sudah tersimpan dalam waktu lokal.",
      "Normalisasi timestamp di academic dan chat.",
      "Perubahan tampilan zona waktu di web."
    ]
  }
}
```
