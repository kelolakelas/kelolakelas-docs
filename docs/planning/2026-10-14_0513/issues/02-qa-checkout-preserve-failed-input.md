## Background / Problem

QA agent-browser pada 14 Oktober 2026 WIB, web b2d8b8c2. Parent membuat Anak QA, membuka /kelas/fba5b1e5-8fbc-43fc-8408-48cb1bf84b0f, memilih student, Senin 09:00–10:30, periode bulanan dan Virtual Account, lalu Lanjut ke pembayaran. Provider sandbox mengembalikan 404 (billing /internal/billing/transactions 500); UI menampilkan Checkout belum tersedia karena layanan pembayaran sedang bermasalah. Sesudah response, student dan jadwal kosong serta radio berubah ke Kartu (VC). Reproduksi lanjutan memakai quarterly dan QRIS mendapatkan conflict; input kembali kosong, cycle=monthly, method=VC. Teks halaman meminta kirim ulang intent yang sama, tetapi pilihan transaksi hilang. Screenshot: checkout-reset.png. Provider 404 adalah batasan environment terpisah; bug yang dilaporkan ialah kehilangan input pada error path.

## Goal

Parent dapat memperbaiki atau mencoba ulang checkout gagal dengan pilihan transaksi yang tetap terlihat dan konsisten.

## Requirements

- Pertahankan pilihan student, jadwal, billing_cycle dan payment_method pada kegagalan validasi/domain/backend
- Pertahankan voucher dan konsistensi idempotency intent sesuai kontrak existing
- Jangan mengganti metode pembayaran atau periode secara diam-diam pada retry
- Tetap tampilkan error dan link recovery backend yang sesuai

## Acceptance Criteria

- [ ] Setelah error checkout, semua input masih sama dengan submission terakhir
- [ ] Quarterly/yearly dan VA/QRIS tidak kembali menjadi monthly/VC setelah error
- [ ] Retry intent yang sama membawa pilihan dan idempotency yang konsisten
- [ ] Jika student/jadwal tidak lagi valid, tampilkan error eksplisit dan minta pilihan baru
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

EnrollmentPanel memakai useActionState; schedule/cycle/radio uncontrolled dengan default monthly/VC, sehingga action completion mereset form. Student memakai controlled state tetapi DOM sesudah response juga kembali kosong dalam QA; validasi melalui browser diperlukan, jangan mengandalkan markup statis. Source enrolInClass mengembalikan error tanpa pemulihan draft form. Tidak perlu perubahan academic/billing untuk memperbaiki UI ini. KEL-172 hanya auth forms, bukan checkout. Regression harus memakai error response deterministic agar tidak tergantung sandbox Duitku. Perbarui docs flow retry.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`
- `kelolakelas-web/lib/enrollment.ts`

## Edge Cases

- Provider timeout/5xx
- Enrollment duplikat atau jadwal penuh
- Student/jadwal dihapus saat checkout
- Voucher invalid; retry setelah perubahan intent

## Testing / Validation

- [ ] Browser test: submission quarterly+QRIS dan yearly+VA dengan error terkontrol, lalu verifikasi nilai input dan payload retry
- [ ] Uji field validation, 409, 5xx dan happy path
- [ ] Verifikasi idempotency retry tanpa invoice/enrollment tambahan
- [ ] Regression test yang membuktikan acceptance criteria
- [ ] npm run test; npm run lint; npx tsc --noEmit; npm run build
- [ ] GitHub required CI sukses pada PR ke main sebelum merge
- [ ] Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING

## Out of Scope

- Memperbaiki konfigurasi sandbox Duitku
- Mengubah policy harga atau billing
- Form login/registrasi (KEL-172)

## AI Orchestrator Contract

```json
{
  "draftKey": "qa-checkout-preserve-failed-input",
  "projectKey": null,
  "title": "Checkout parent menghapus pilihan student, jadwal, periode, dan metode pembayaran setelah gagal",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "QA agent-browser pada 14 Oktober 2026 WIB, web b2d8b8c2. Parent membuat Anak QA, membuka /kelas/fba5b1e5-8fbc-43fc-8408-48cb1bf84b0f, memilih student, Senin 09:00–10:30, periode bulanan dan Virtual Account, lalu Lanjut ke pembayaran. Provider sandbox mengembalikan 404 (billing /internal/billing/transactions 500); UI menampilkan Checkout belum tersedia karena layanan pembayaran sedang bermasalah. Sesudah response, student dan jadwal kosong serta radio berubah ke Kartu (VC). Reproduksi lanjutan memakai quarterly dan QRIS mendapatkan conflict; input kembali kosong, cycle=monthly, method=VC. Teks halaman meminta kirim ulang intent yang sama, tetapi pilihan transaksi hilang. Screenshot: checkout-reset.png. Provider 404 adalah batasan environment terpisah; bug yang dilaporkan ialah kehilangan input pada error path.",
    "goal": "Parent dapat memperbaiki atau mencoba ulang checkout gagal dengan pilihan transaksi yang tetap terlihat dan konsisten.",
    "requirements": [
      "Pertahankan pilihan student, jadwal, billing_cycle dan payment_method pada kegagalan validasi/domain/backend",
      "Pertahankan voucher dan konsistensi idempotency intent sesuai kontrak existing",
      "Jangan mengganti metode pembayaran atau periode secara diam-diam pada retry",
      "Tetap tampilkan error dan link recovery backend yang sesuai"
    ],
    "acceptanceCriteria": [
      "Setelah error checkout, semua input masih sama dengan submission terakhir",
      "Quarterly/yearly dan VA/QRIS tidak kembali menjadi monthly/VC setelah error",
      "Retry intent yang sama membawa pilihan dan idempotency yang konsisten",
      "Jika student/jadwal tidak lagi valid, tampilkan error eksplisit dan minta pilihan baru",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "EnrollmentPanel memakai useActionState; schedule/cycle/radio uncontrolled dengan default monthly/VC, sehingga action completion mereset form. Student memakai controlled state tetapi DOM sesudah response juga kembali kosong dalam QA; validasi melalui browser diperlukan, jangan mengandalkan markup statis. Source enrolInClass mengembalikan error tanpa pemulihan draft form. Tidak perlu perubahan academic/billing untuk memperbaiki UI ini. KEL-172 hanya auth forms, bukan checkout. Regression harus memakai error response deterministic agar tidak tergantung sandbox Duitku. Perbarui docs flow retry.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts",
      "kelolakelas-web/lib/enrollment.ts"
    ],
    "edgeCases": [
      "Provider timeout/5xx",
      "Enrollment duplikat atau jadwal penuh",
      "Student/jadwal dihapus saat checkout",
      "Voucher invalid; retry setelah perubahan intent"
    ],
    "testingValidation": [
      "Browser test: submission quarterly+QRIS dan yearly+VA dengan error terkontrol, lalu verifikasi nilai input dan payload retry",
      "Uji field validation, 409, 5xx dan happy path",
      "Verifikasi idempotency retry tanpa invoice/enrollment tambahan",
      "Regression test yang membuktikan acceptance criteria",
      "npm run test; npm run lint; npx tsc --noEmit; npm run build",
      "GitHub required CI sukses pada PR ke main sebelum merge",
      "Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING"
    ],
    "outOfScope": [
      "Memperbaiki konfigurasi sandbox Duitku",
      "Mengubah policy harga atau billing",
      "Form login/registrasi (KEL-172)"
    ]
  }
}
```
