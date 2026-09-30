## Background / Problem

KEL-108 membuat invoice di `academic-service/internal/usecase/private_schedule_request_usecase.go:209` dan menyimpan email parent dari token; billing hanya mengirim link pada worker renewal `subscription_worker.go:210-234`. Persetujuan pertama tidak mengirim link.

## Goal

Payment link private sampai ke email parent yang benar setelah invoice berhasil dibuat, tanpa mengubah keputusan approval bila email gagal.

## Requirements

- Kirim hanya setelah invoice berhasil tersedia dan email berasal dari data parent terverifikasi; jangan menerima alamat tujuan arbitrer dari tenant.
- Buat dispatch tahan retry dengan deduplikasi yang sesuai batasan provider; laporkan kegagalan delivery terpisah dari status enrollment/approval.
- Link aman dan expiry yang dikirim harus cocok dengan transaksi yang masih relevan; jangan kirim link bila invoice batal, expired, atau gagal dibuat.
- Pertahankan akses manual parent ke link checkout yang sudah ada.

## Acceptance Criteria

- [ ] Parent pemilik request menerima email dengan link, nominal dan expiry transaksi yang tepat.
- [ ] Approval berulang atau worker retry tidak menggandakan invoice dan tidak mengirim email berulang tanpa alasan.
- [ ] Kegagalan Resend tidak menggagalkan persetujuan atau kehilangan kesempatan retry yang terobservasi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: email lintas parent dan efek samping duplikat setelah crash. Billing memiliki `ClaimPaymentLinkEmail` pada subscription_worker untuk referensi; tinjau apakah dipakai untuk invoice pertama tanpa memicu reminder keliru. Pesan ke external provider tidak atomik dengan DB: dokumentasikan at-least-once dan idempotency/claim. Audit lokasi kebenaran transaksi sebelum memilih service pengirim. Perbarui docs billing/academic flow dan konfigurasi.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-billing-service/internal/usecase/subscription_worker.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/pkg/email/resend.go`

## Edge Cases

- Email claim kosong pada token lama, atau alamat tidak valid.
- Crash setelah email terkirim namun sebelum ack tersimpan.
- Invoice berhasil tetapi callback paid tiba sebelum dispatch.

## Testing / Validation

- [ ] Integration test approval/retry/crash/replayed request dengan fake email provider dan pemeriksaan penerima.
- [ ] Uji bila Resend gagal, status approval/payment tetap benar dan delivery dapat di-retry/diamati.
- [ ] Jalankan go test -race, go vet dan build pada dua repo; verifikasi sandbox email tanpa mengirim ke alamat produksi.

## Out of Scope

- Reminder marketing atau broadcast.
- Mengirim detail student sensitif dalam email.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-payment-link-email",
  "projectKey": "private-payment-link-delivery",
  "title": "Parent menerima email payment link setelah jadwal private disetujui",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "academic",
    "billing"
  ],
  "labels": [
    "academic",
    "billing",
    "ai-ready"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "KEL-108 membuat invoice di `academic-service/internal/usecase/private_schedule_request_usecase.go:209` dan menyimpan email parent dari token; billing hanya mengirim link pada worker renewal `subscription_worker.go:210-234`. Persetujuan pertama tidak mengirim link.",
    "goal": "Payment link private sampai ke email parent yang benar setelah invoice berhasil dibuat, tanpa mengubah keputusan approval bila email gagal.",
    "requirements": [
      "Kirim hanya setelah invoice berhasil tersedia dan email berasal dari data parent terverifikasi; jangan menerima alamat tujuan arbitrer dari tenant.",
      "Buat dispatch tahan retry dengan deduplikasi yang sesuai batasan provider; laporkan kegagalan delivery terpisah dari status enrollment/approval.",
      "Link aman dan expiry yang dikirim harus cocok dengan transaksi yang masih relevan; jangan kirim link bila invoice batal, expired, atau gagal dibuat.",
      "Pertahankan akses manual parent ke link checkout yang sudah ada."
    ],
    "acceptanceCriteria": [
      "Parent pemilik request menerima email dengan link, nominal dan expiry transaksi yang tepat.",
      "Approval berulang atau worker retry tidak menggandakan invoice dan tidak mengirim email berulang tanpa alasan.",
      "Kegagalan Resend tidak menggagalkan persetujuan atau kehilangan kesempatan retry yang terobservasi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: email lintas parent dan efek samping duplikat setelah crash. Billing memiliki `ClaimPaymentLinkEmail` pada subscription_worker untuk referensi; tinjau apakah dipakai untuk invoice pertama tanpa memicu reminder keliru. Pesan ke external provider tidak atomik dengan DB: dokumentasikan at-least-once dan idempotency/claim. Audit lokasi kebenaran transaksi sebelum memilih service pengirim. Perbarui docs billing/academic flow dan konfigurasi.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-billing-service/internal/usecase/subscription_worker.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/pkg/email/resend.go"
    ],
    "edgeCases": [
      "Email claim kosong pada token lama, atau alamat tidak valid.",
      "Crash setelah email terkirim namun sebelum ack tersimpan.",
      "Invoice berhasil tetapi callback paid tiba sebelum dispatch."
    ],
    "testingValidation": [
      "Integration test approval/retry/crash/replayed request dengan fake email provider dan pemeriksaan penerima.",
      "Uji bila Resend gagal, status approval/payment tetap benar dan delivery dapat di-retry/diamati.",
      "Jalankan go test -race, go vet dan build pada dua repo; verifikasi sandbox email tanpa mengirim ke alamat produksi."
    ],
    "outOfScope": [
      "Reminder marketing atau broadcast.",
      "Mengirim detail student sensitif dalam email."
    ]
  }
}
```
