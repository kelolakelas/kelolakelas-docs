## Background / Problem

Dashboard tenant memiliki halaman enrollments (`app/(dashboard)/dashboard/tenant/enrollments`) tetapi tidak memiliki tempat untuk permintaan jadwal private. Tanpa UI, API peninjauan dan persetujuan tidak dapat dipakai tenant. Chat dan email payment link belum tersedia, sehingga tenant juga membutuhkan cara membagikan payment link secara manual.

## Goal

Anggota tenant yang berizin dapat melihat permintaan jadwal private, menyetujui atau menolaknya dengan alasan opsional, dan menyalin payment link hasil persetujuan.

## Requirements

- Dashboard tenant menampilkan daftar permintaan jadwal private dengan filter status, nama student, kelas, slot yang diminta, periode pembayaran, catatan parent, dan waktu pengajuan.
- Aksi setujui memakai dialog konfirmasi. Setelah berhasil, UI menampilkan payment link beserta tombol salin dan batas waktu bila tersedia.
- Aksi tolak memakai dialog konfirmasi dengan alasan opsional.
- Anggota tanpa `enrollment:read` melihat pesan izin, dan aksi disembunyikan atau ditolak dengan pesan jelas untuk anggota tanpa `enrollment:update`.
- State loading, kosong, dan error API ditampilkan dengan jelas.

## Acceptance Criteria

- [ ] Permintaan `pending` milik tenant tampil beserta detail slotnya.
- [ ] Menyetujui permintaan menampilkan payment link yang dapat disalin, dan status berubah menjadi disetujui.
- [ ] Menolak dengan atau tanpa alasan mengubah status menjadi ditolak.
- [ ] Member tanpa izin melihat pesan izin, bukan error teknis.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola dialog yang dapat diakses di `app/(dashboard)/dashboard/tenant/roles/_components/RoleEditModal.tsx` dan pola tabel di `tenant/enrollments/_components/EnrollmentTable.tsx`. Kontrak endpoint mengikuti hasil issue API permintaan jadwal dan persetujuan. Payment link hanya ditampilkan bila skemanya http/https, mengikuti `resumePayment` di `lib/payment-status.ts`. Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Permintaan sudah dibatalkan parent saat tenant membuka dialog.
- Persetujuan gagal karena biaya platform melebihi pembayaran (KEL-106).
- Dua anggota tenant memproses permintaan yang sama bersamaan.

## Testing / Validation

- [ ] Vitest untuk daftar, dialog setujui, dialog tolak dengan dan tanpa alasan, serta pemetaan 403/409.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Pengiriman payment link lewat email atau chat.
- Menolak dengan rekomendasi jadwal lain (issue terpisah).
- Perubahan API.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-private-schedule-review-web",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Tenant meninjau, menyetujui, atau menolak permintaan jadwal private dari dashboard",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "approve-private-schedule-request"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Dashboard tenant memiliki halaman enrollments (`app/(dashboard)/dashboard/tenant/enrollments`) tetapi tidak memiliki tempat untuk permintaan jadwal private. Tanpa UI, API peninjauan dan persetujuan tidak dapat dipakai tenant. Chat dan email payment link belum tersedia, sehingga tenant juga membutuhkan cara membagikan payment link secara manual.",
    "goal": "Anggota tenant yang berizin dapat melihat permintaan jadwal private, menyetujui atau menolaknya dengan alasan opsional, dan menyalin payment link hasil persetujuan.",
    "requirements": [
      "Dashboard tenant menampilkan daftar permintaan jadwal private dengan filter status, nama student, kelas, slot yang diminta, periode pembayaran, catatan parent, dan waktu pengajuan.",
      "Aksi setujui memakai dialog konfirmasi. Setelah berhasil, UI menampilkan payment link beserta tombol salin dan batas waktu bila tersedia.",
      "Aksi tolak memakai dialog konfirmasi dengan alasan opsional.",
      "Anggota tanpa `enrollment:read` melihat pesan izin, dan aksi disembunyikan atau ditolak dengan pesan jelas untuk anggota tanpa `enrollment:update`.",
      "State loading, kosong, dan error API ditampilkan dengan jelas."
    ],
    "acceptanceCriteria": [
      "Permintaan `pending` milik tenant tampil beserta detail slotnya.",
      "Menyetujui permintaan menampilkan payment link yang dapat disalin, dan status berubah menjadi disetujui.",
      "Menolak dengan atau tanpa alasan mengubah status menjadi ditolak.",
      "Member tanpa izin melihat pesan izin, bukan error teknis.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola dialog yang dapat diakses di `app/(dashboard)/dashboard/tenant/roles/_components/RoleEditModal.tsx` dan pola tabel di `tenant/enrollments/_components/EnrollmentTable.tsx`. Kontrak endpoint mengikuti hasil issue API permintaan jadwal dan persetujuan. Payment link hanya ditampilkan bila skemanya http/https, mengikuti `resumePayment` di `lib/payment-status.ts`. Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Permintaan sudah dibatalkan parent saat tenant membuka dialog.",
      "Persetujuan gagal karena biaya platform melebihi pembayaran (KEL-106).",
      "Dua anggota tenant memproses permintaan yang sama bersamaan."
    ],
    "testingValidation": [
      "Vitest untuk daftar, dialog setujui, dialog tolak dengan dan tanpa alasan, serta pemetaan 403/409.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Pengiriman payment link lewat email atau chat.",
      "Menolak dengan rekomendasi jadwal lain (issue terpisah).",
      "Perubahan API."
    ]
  }
}
```
