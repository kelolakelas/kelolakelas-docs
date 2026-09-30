## Background / Problem

Panel enrollment di detail kelas (`app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`) menampilkan form checkout yang sama untuk kelas private dan group. Setelah API permintaan jadwal tersedia dan checkout langsung kelas private ditolak, parent membutuhkan UI untuk mengajukan jadwal dan mengikuti hasil peninjauan.

## Goal

Parent dapat mengajukan satu atau lebih slot jadwal untuk kelas private langsung dari detail kelas, lalu melihat status permintaan, alasan penolakan bila ada, dan kelanjutan pembayaran setelah disetujui.

## Requirements

- Untuk kelas private dan pengguna parent, panel detail kelas menampilkan form permintaan jadwal: student, periode pembayaran, satu atau lebih slot (hari, jam mulai, jam selesai), dan catatan opsional. Form checkout kelas private tidak lagi ditampilkan.
- Kelas group tetap memakai form checkout yang ada tanpa perubahan.
- Parent dapat melihat daftar permintaannya dengan status, slot, dan alasan penolakan bila ada, serta membatalkan permintaan `pending`.
- Permintaan yang disetujui mengarahkan parent ke enrollment terkait di halaman status enrollment yang ada, tempat tautan pembayaran sudah tersedia (KEL-53).
- Error API (409 permintaan ganda, 4xx validasi, 403, error jaringan) ditampilkan dengan pesan berbahasa Indonesia yang jelas.

## Acceptance Criteria

- [ ] Parent pada kelas private melihat form permintaan jadwal, bukan tombol "Lanjut ke pembayaran".
- [ ] Mengirim permintaan valid menampilkan konfirmasi, dan permintaan muncul dengan status menunggu peninjauan.
- [ ] Slot dengan jam selesai tidak setelah jam mulai ditolak di form sebelum request dikirim.
- [ ] Permintaan ganda menampilkan pesan bahwa permintaan sebelumnya masih menunggu.
- [ ] Permintaan yang ditolak menampilkan alasan dari tenant bila ada, beserta opsi mengajukan ulang.
- [ ] Kelas group tetap berfungsi seperti sebelumnya.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola Server Action dan `useActionState` di `app/(public)/kelas/[id]/_actions/actions.ts`, serta penanganan gateway di `lib/gateway.ts`. Kontrak endpoint mengikuti hasil issue API permintaan jadwal. Jangan mengarang field di luar kontrak tersebut. Hari memakai ISO 1–7 dengan label bahasa Indonesia, konsisten dengan `enrollmentScheduleLabel` (KEL-70). Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments`
- `kelolakelas-web/lib`

## Edge Cases

- Parent belum memiliki student.
- Kelas ditutup saat form sedang diisi.
- Sesi login kedaluwarsa saat submit.
- Permintaan disetujui tetapi invoice gagal dibuat.

## Testing / Validation

- [ ] Vitest untuk render form private versus group, validasi slot, dan pemetaan error.
- [ ] Test daftar permintaan untuk status pending, rejected, approved, dan cancelled.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan API academic.
- Chat atau email.
- Halaman tenant.
- Menampilkan dan menerima rekomendasi jadwal dari tenant (issue terpisah).

## AI Orchestrator Contract

```json
{
  "draftKey": "parent-private-schedule-request-web",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Parent mengajukan jadwal kelas private dari detail kelas dan memantau status permintaannya",
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
    "private-schedule-request-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Panel enrollment di detail kelas (`app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`) menampilkan form checkout yang sama untuk kelas private dan group. Setelah API permintaan jadwal tersedia dan checkout langsung kelas private ditolak, parent membutuhkan UI untuk mengajukan jadwal dan mengikuti hasil peninjauan.",
    "goal": "Parent dapat mengajukan satu atau lebih slot jadwal untuk kelas private langsung dari detail kelas, lalu melihat status permintaan, alasan penolakan bila ada, dan kelanjutan pembayaran setelah disetujui.",
    "requirements": [
      "Untuk kelas private dan pengguna parent, panel detail kelas menampilkan form permintaan jadwal: student, periode pembayaran, satu atau lebih slot (hari, jam mulai, jam selesai), dan catatan opsional. Form checkout kelas private tidak lagi ditampilkan.",
      "Kelas group tetap memakai form checkout yang ada tanpa perubahan.",
      "Parent dapat melihat daftar permintaannya dengan status, slot, dan alasan penolakan bila ada, serta membatalkan permintaan `pending`.",
      "Permintaan yang disetujui mengarahkan parent ke enrollment terkait di halaman status enrollment yang ada, tempat tautan pembayaran sudah tersedia (KEL-53).",
      "Error API (409 permintaan ganda, 4xx validasi, 403, error jaringan) ditampilkan dengan pesan berbahasa Indonesia yang jelas."
    ],
    "acceptanceCriteria": [
      "Parent pada kelas private melihat form permintaan jadwal, bukan tombol \"Lanjut ke pembayaran\".",
      "Mengirim permintaan valid menampilkan konfirmasi, dan permintaan muncul dengan status menunggu peninjauan.",
      "Slot dengan jam selesai tidak setelah jam mulai ditolak di form sebelum request dikirim.",
      "Permintaan ganda menampilkan pesan bahwa permintaan sebelumnya masih menunggu.",
      "Permintaan yang ditolak menampilkan alasan dari tenant bila ada, beserta opsi mengajukan ulang.",
      "Kelas group tetap berfungsi seperti sebelumnya.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola Server Action dan `useActionState` di `app/(public)/kelas/[id]/_actions/actions.ts`, serta penanganan gateway di `lib/gateway.ts`. Kontrak endpoint mengikuti hasil issue API permintaan jadwal. Jangan mengarang field di luar kontrak tersebut. Hari memakai ISO 1–7 dengan label bahasa Indonesia, konsisten dengan `enrollmentScheduleLabel` (KEL-70). Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments",
      "kelolakelas-web/lib"
    ],
    "edgeCases": [
      "Parent belum memiliki student.",
      "Kelas ditutup saat form sedang diisi.",
      "Sesi login kedaluwarsa saat submit.",
      "Permintaan disetujui tetapi invoice gagal dibuat."
    ],
    "testingValidation": [
      "Vitest untuk render form private versus group, validasi slot, dan pemetaan error.",
      "Test daftar permintaan untuk status pending, rejected, approved, dan cancelled.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan API academic.",
      "Chat atau email.",
      "Halaman tenant.",
      "Menampilkan dan menerima rekomendasi jadwal dari tenant (issue terpisah)."
    ]
  }
}
```
