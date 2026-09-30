## Background / Problem

`app/(public)/kelas/[id]/_actions/actions.ts:86-92` langsung redirect ke checkout_session_url; halaman return KEL-44 hanya menampilkan status sesudah provider. Parent tidak melihat instruksi VA/QR di KelolaKelas.

## Goal

Parent dapat memilih channel saat checkout dan melihat instruksi VA/QR sendiri, sedangkan channel kartu tetap diarahkan ke provider.

## Requirements

- Tambahkan pilihan channel yang dapat diakses keyboard pada checkout group serta alur private setelah approval, terikat ke API channel baru.
- Tampilkan identitas order, nominal, VA atau QR sesuai respons backend, batas waktu, status dan aksi refresh; jangan membentuk QR dari informasi yang belum diverifikasi.
- Untuk kartu, terus gunakan redirect aman ke paymentUrl; saat instruksi belum tersedia, tampilkan fallback yang aman.
- Gunakan status backend (bukan query-string callback) sebagai sumber kebenaran; jangan paparkan data pembayaran parent lain.

## Acceptance Criteria

- [ ] Parent dapat memilih VA/QRIS dan membaca instruksinya di halaman KelolaKelas tanpa redirect.
- [ ] Pilihan kartu mengarahkan ke hosted provider, bukan meminta detail kartu di KelolaKelas.
- [ ] Transaksi dibayar, pending, expired dan gagal ditampilkan benar setelah refresh; user tidak berhak ditolak.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: tampilan paid palsu dan instruksi stale; baca status dari billing saja. Reuse pola `PaymentReturnRefresher`, batasi redirect http(s) seperti existing action, perhatikan private purchase flow dari KEL-108/116. Jangan memproses data kartu. Perbarui docs web/payment flow; ikuti Next.js docs lokal.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`
- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/return`
- `kelolakelas-web/lib/gateway.ts`

## Edge Cases

- Refresh saat pembayaran telah diterima tapi callback belum direkonsiliasi.
- Parent membuka URL transaksi milik user lain.
- Instruksi provider kosong atau expired.

## Testing / Validation

- [ ] Vitest untuk VA, QRIS, kartu, expired, 401/403 dan fallback data kosong.
- [ ] Verifikasi manual tiga channel di sandbox termasuk return/refresh dan private approval; periksa tidak ada input data kartu.
- [ ] Jalankan test, lint, type check, production build dan uji aksesibilitas pilihan channel.

## Out of Scope

- Memproses kartu/3DS di aplikasi sendiri.
- Voucher dan multi-class cart.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-payment-page",
  "projectKey": "payment-experience-owned-page",
  "title": "Parent membayar VA/QRIS dari halaman KelolaKelas dan kartu melalui redirect Duitku",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "web"
  ],
  "labels": [
    "web",
    "ai-ready"
  ],
  "blockedByDraftKeys": [
    "billing-payment-instructions"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`app/(public)/kelas/[id]/_actions/actions.ts:86-92` langsung redirect ke checkout_session_url; halaman return KEL-44 hanya menampilkan status sesudah provider. Parent tidak melihat instruksi VA/QR di KelolaKelas.",
    "goal": "Parent dapat memilih channel saat checkout dan melihat instruksi VA/QR sendiri, sedangkan channel kartu tetap diarahkan ke provider.",
    "requirements": [
      "Tambahkan pilihan channel yang dapat diakses keyboard pada checkout group serta alur private setelah approval, terikat ke API channel baru.",
      "Tampilkan identitas order, nominal, VA atau QR sesuai respons backend, batas waktu, status dan aksi refresh; jangan membentuk QR dari informasi yang belum diverifikasi.",
      "Untuk kartu, terus gunakan redirect aman ke paymentUrl; saat instruksi belum tersedia, tampilkan fallback yang aman.",
      "Gunakan status backend (bukan query-string callback) sebagai sumber kebenaran; jangan paparkan data pembayaran parent lain."
    ],
    "acceptanceCriteria": [
      "Parent dapat memilih VA/QRIS dan membaca instruksinya di halaman KelolaKelas tanpa redirect.",
      "Pilihan kartu mengarahkan ke hosted provider, bukan meminta detail kartu di KelolaKelas.",
      "Transaksi dibayar, pending, expired dan gagal ditampilkan benar setelah refresh; user tidak berhak ditolak.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: tampilan paid palsu dan instruksi stale; baca status dari billing saja. Reuse pola `PaymentReturnRefresher`, batasi redirect http(s) seperti existing action, perhatikan private purchase flow dari KEL-108/116. Jangan memproses data kartu. Perbarui docs web/payment flow; ikuti Next.js docs lokal.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts",
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/return",
      "kelolakelas-web/lib/gateway.ts"
    ],
    "edgeCases": [
      "Refresh saat pembayaran telah diterima tapi callback belum direkonsiliasi.",
      "Parent membuka URL transaksi milik user lain.",
      "Instruksi provider kosong atau expired."
    ],
    "testingValidation": [
      "Vitest untuk VA, QRIS, kartu, expired, 401/403 dan fallback data kosong.",
      "Verifikasi manual tiga channel di sandbox termasuk return/refresh dan private approval; periksa tidak ada input data kartu.",
      "Jalankan test, lint, type check, production build dan uji aksesibilitas pilihan channel."
    ],
    "outOfScope": [
      "Memproses kartu/3DS di aplikasi sendiri.",
      "Voucher dan multi-class cart."
    ]
  }
}
```
