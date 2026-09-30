## Background / Problem

Setelah permintaan jadwal private tersedia, tenant perlu mengubah permintaan yang disetujui menjadi pembelian yang dapat dibayar. Academic sudah mampu membuat enrollment `pending` beserta invoice billing (`internal/usecase/enrollment_usecase.go:331` `EnrollStudent`, `pkg/billing/client.go` `GenerateInvoice`) dan membuat jadwal private terikat `enrollment_id` (`internal/usecase/schedule_usecase.go:221-239`). Billing juga sudah mengaktifkan enrollment setelah pembayaran melalui `/internal/enrollments/:id/activate` (`cmd/server/routes.go:94`). Namun belum ada operasi yang menyatukan langkah-langkah tersebut dari sebuah permintaan.

## Goal

Anggota tenant dengan izin menyetujui permintaan `pending`, dan sistem menghasilkan enrollment `pending`, jadwal private sesuai slot yang disetujui, serta payment link yang dapat dibayar parent. Setelah pembayaran terkonfirmasi, enrollment aktif dengan jadwal tersebut.

## Requirements

- Anggota tenant dengan `enrollment:update` dapat menyetujui permintaan `pending` milik tenant-nya.
- Persetujuan mengubah status permintaan menjadi `approved`, membuat satu enrollment `pending` untuk student, kelas, dan billing cycle dari permintaan, serta membuat jadwal private per slot yang terikat enrollment tersebut dengan kapasitas 1.
- Invoice dibuat melalui `GenerateInvoice` billing yang ada dengan idempotency key yang diturunkan dari permintaan dan email parent yang tersimpan. Checkout URL disimpan pada enrollment dengan cara yang sama seperti `EnrollPublic`.
- Respons persetujuan memuat enrollment id, transaction id, dan `checkout_session_url` agar tenant dapat membagikannya.
- Persetujuan berulang untuk permintaan yang sama idempoten: tidak membuat enrollment, jadwal, atau invoice ganda, dan mengembalikan hasil yang sama.
- Kegagalan invoice mengikuti jalur `invoiceFailure` yang ada (termasuk `platform_fee_exceeds_gross`, KEL-106) dan tidak meninggalkan permintaan `approved` tanpa enrollment yang dapat dibayar. Tenant dapat mencoba lagi.
- Aktivasi setelah pembayaran dan pelepasan saat invoice kedaluwarsa memakai jalur internal yang ada tanpa perubahan billing.

## Acceptance Criteria

- [ ] Menyetujui permintaan `pending` menghasilkan enrollment `pending`, jadwal private sesuai slot, dan `checkout_session_url` yang valid.
- [ ] Parent melihat enrollment baru beserta tautan "Lanjutkan pembayaran" di halaman status enrollment yang ada (KEL-53).
- [ ] Setelah webhook pembayaran terkonfirmasi, enrollment menjadi `active` dan sesi dihasilkan dari jadwal yang disetujui.
- [ ] Persetujuan kedua atau paralel untuk permintaan yang sama tidak membuat data ganda.
- [ ] Permintaan milik tenant lain, permintaan yang tidak `pending`, dan anggota tanpa `enrollment:update` ditolak dengan 404/409/403 yang sesuai.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: financial correctness dan idempotensi. Persetujuan ganda atau parsial dapat menghasilkan invoice ganda atau enrollment tanpa jadwal. Jaga penulisan permintaan, enrollment, dan jadwal dalam satu transaksi database, dan jangan menahan lock database selama I/O ke billing (pola `EnrollPublic` di `enrollment_usecase.go:168-240`). Pakai ulang `CreateIfCapacityAvailable` dan penanganan duplikat enrollment (KEL-54). Tidak ada perubahan billing. Route persetujuan harus didaftarkan di gateway. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/flows/academic.md`, dan `docs/flows/billing-and-subscriptions.md` untuk alur private.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/pkg/billing/client.go`
- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Billing menolak invoice karena biaya platform melebihi gross (KEL-106).
- Billing timeout setelah enrollment dibuat.
- Student sudah memiliki enrollment aktif di kelas yang sama saat disetujui.
- Kelas ditutup di antara pengajuan dan persetujuan.
- Invoice kedaluwarsa sebelum dibayar, sehingga enrollment dilepas oleh jalur yang ada.

## Testing / Validation

- [ ] Unit test usecase untuk persetujuan sukses, kegagalan invoice, dan replay idempoten.
- [ ] Integration test PostgreSQL untuk persetujuan paralel yang tidak menghasilkan data ganda (mitigasi risiko finansial).
- [ ] Test isolasi tenant dan permission untuk handler persetujuan.
- [ ] Gateway route test.
- [ ] Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Pengiriman payment link lewat email atau chat.
- Perubahan billing atau provider pembayaran.
- UI web.

## AI Orchestrator Contract

```json
{
  "draftKey": "approve-private-schedule-request",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Persetujuan tenant atas permintaan jadwal private membuat enrollment, jadwal, dan payment link",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "private-schedule-request-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Setelah permintaan jadwal private tersedia, tenant perlu mengubah permintaan yang disetujui menjadi pembelian yang dapat dibayar. Academic sudah mampu membuat enrollment `pending` beserta invoice billing (`internal/usecase/enrollment_usecase.go:331` `EnrollStudent`, `pkg/billing/client.go` `GenerateInvoice`) dan membuat jadwal private terikat `enrollment_id` (`internal/usecase/schedule_usecase.go:221-239`). Billing juga sudah mengaktifkan enrollment setelah pembayaran melalui `/internal/enrollments/:id/activate` (`cmd/server/routes.go:94`). Namun belum ada operasi yang menyatukan langkah-langkah tersebut dari sebuah permintaan.",
    "goal": "Anggota tenant dengan izin menyetujui permintaan `pending`, dan sistem menghasilkan enrollment `pending`, jadwal private sesuai slot yang disetujui, serta payment link yang dapat dibayar parent. Setelah pembayaran terkonfirmasi, enrollment aktif dengan jadwal tersebut.",
    "requirements": [
      "Anggota tenant dengan `enrollment:update` dapat menyetujui permintaan `pending` milik tenant-nya.",
      "Persetujuan mengubah status permintaan menjadi `approved`, membuat satu enrollment `pending` untuk student, kelas, dan billing cycle dari permintaan, serta membuat jadwal private per slot yang terikat enrollment tersebut dengan kapasitas 1.",
      "Invoice dibuat melalui `GenerateInvoice` billing yang ada dengan idempotency key yang diturunkan dari permintaan dan email parent yang tersimpan. Checkout URL disimpan pada enrollment dengan cara yang sama seperti `EnrollPublic`.",
      "Respons persetujuan memuat enrollment id, transaction id, dan `checkout_session_url` agar tenant dapat membagikannya.",
      "Persetujuan berulang untuk permintaan yang sama idempoten: tidak membuat enrollment, jadwal, atau invoice ganda, dan mengembalikan hasil yang sama.",
      "Kegagalan invoice mengikuti jalur `invoiceFailure` yang ada (termasuk `platform_fee_exceeds_gross`, KEL-106) dan tidak meninggalkan permintaan `approved` tanpa enrollment yang dapat dibayar. Tenant dapat mencoba lagi.",
      "Aktivasi setelah pembayaran dan pelepasan saat invoice kedaluwarsa memakai jalur internal yang ada tanpa perubahan billing."
    ],
    "acceptanceCriteria": [
      "Menyetujui permintaan `pending` menghasilkan enrollment `pending`, jadwal private sesuai slot, dan `checkout_session_url` yang valid.",
      "Parent melihat enrollment baru beserta tautan \"Lanjutkan pembayaran\" di halaman status enrollment yang ada (KEL-53).",
      "Setelah webhook pembayaran terkonfirmasi, enrollment menjadi `active` dan sesi dihasilkan dari jadwal yang disetujui.",
      "Persetujuan kedua atau paralel untuk permintaan yang sama tidak membuat data ganda.",
      "Permintaan milik tenant lain, permintaan yang tidak `pending`, dan anggota tanpa `enrollment:update` ditolak dengan 404/409/403 yang sesuai.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: financial correctness dan idempotensi. Persetujuan ganda atau parsial dapat menghasilkan invoice ganda atau enrollment tanpa jadwal. Jaga penulisan permintaan, enrollment, dan jadwal dalam satu transaksi database, dan jangan menahan lock database selama I/O ke billing (pola `EnrollPublic` di `enrollment_usecase.go:168-240`). Pakai ulang `CreateIfCapacityAvailable` dan penanganan duplikat enrollment (KEL-54). Tidak ada perubahan billing. Route persetujuan harus didaftarkan di gateway. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/flows/academic.md`, dan `docs/flows/billing-and-subscriptions.md` untuk alur private.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/pkg/billing/client.go",
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Billing menolak invoice karena biaya platform melebihi gross (KEL-106).",
      "Billing timeout setelah enrollment dibuat.",
      "Student sudah memiliki enrollment aktif di kelas yang sama saat disetujui.",
      "Kelas ditutup di antara pengajuan dan persetujuan.",
      "Invoice kedaluwarsa sebelum dibayar, sehingga enrollment dilepas oleh jalur yang ada."
    ],
    "testingValidation": [
      "Unit test usecase untuk persetujuan sukses, kegagalan invoice, dan replay idempoten.",
      "Integration test PostgreSQL untuk persetujuan paralel yang tidak menghasilkan data ganda (mitigasi risiko finansial).",
      "Test isolasi tenant dan permission untuk handler persetujuan.",
      "Gateway route test.",
      "Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Pengiriman payment link lewat email atau chat.",
      "Perubahan billing atau provider pembayaran.",
      "UI web."
    ]
  }
}
```
