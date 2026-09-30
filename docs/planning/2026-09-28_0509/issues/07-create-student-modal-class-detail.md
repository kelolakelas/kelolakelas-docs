## Background / Problem

Saat parent belum memiliki student, `EnrollmentPanel.tsx:38` hanya menampilkan tautan ke `/dashboard/parent/students?returnTo=/kelas/<id>`. Parameter `returnTo` tidak dibaca di mana pun, sehingga setelah membuat student parent harus kembali ke katalog dan mencari kelasnya lagi. Ini memutus konversi enrollment.

## Goal

Parent dapat membuat profil student melalui modal di detail kelas dan langsung memilih student baru untuk enrollment tanpa meninggalkan halaman.

## Requirements

- Saat parent belum memiliki student, panel menampilkan tombol "Tambah student" yang membuka modal berisi field dan validasi yang sama dengan form student yang ada.
- Setelah student berhasil dibuat, modal tertutup, daftar student di panel diperbarui, dan student baru terpilih pada form enrollment.
- Parent tetap berada di URL detail kelas yang sama.
- Modal dapat diakses: `role="dialog"`, `aria-modal`, fokus awal pada field pertama, Escape menutup, dan fokus kembali ke tombol pemicu.
- Pembuatan student di dashboard parent tidak berubah.

## Acceptance Criteria

- [ ] Parent tanpa student dapat membuat student dari detail kelas dan langsung melihat form enrollment dengan student tersebut terpilih.
- [ ] Error validasi dan error API ditampilkan di dalam modal tanpa menutupnya.
- [ ] Membatalkan modal tidak membuat data.
- [ ] Halaman `/dashboard/parent/students` tetap berfungsi seperti sebelumnya.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Pakai ulang `createStudent` (`app/(dashboard)/dashboard/parent/students/_actions/actions.ts:44`) dan field `StudentForm.tsx` bila memungkinkan. Action tersebut hanya me-revalidate `/dashboard/parent/students`, sehingga detail kelas perlu memperoleh daftar student terbaru. Mekanismenya diserahkan ke implementasi dengan mengikuti konvensi Next.js App Router di repo. Ikuti pola dialog di `app/(dashboard)/dashboard/parent/students/_components/DeleteStudentButton.tsx`. Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/app/(public)/kelas/[id]/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_actions/actions.ts`

## Edge Cases

- Sesi parent kedaluwarsa saat submit modal.
- Gagal memuat ulang daftar student setelah create berhasil.
- Kelas group tanpa jadwal tersedia (panel tetap menampilkan pesan jadwal).

## Testing / Validation

- [ ] Vitest untuk membuka dan menutup modal, sukses yang memilih student baru, dan tampilan error.
- [ ] Existing tests pass (termasuk `EnrollmentPanel.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Edit atau hapus student dari detail kelas.
- Perubahan API academic.

## AI Orchestrator Contract

```json
{
  "draftKey": "create-student-modal-class-detail",
  "projectKey": null,
  "title": "Parent dapat menambah student lewat modal di detail kelas lalu langsung melanjutkan enrollment",
  "type": "Improvement",
  "priority": "High",
  "estimate": "S",
  "complexity": "low",
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
    "backgroundProblem": "Saat parent belum memiliki student, `EnrollmentPanel.tsx:38` hanya menampilkan tautan ke `/dashboard/parent/students?returnTo=/kelas/<id>`. Parameter `returnTo` tidak dibaca di mana pun, sehingga setelah membuat student parent harus kembali ke katalog dan mencari kelasnya lagi. Ini memutus konversi enrollment.",
    "goal": "Parent dapat membuat profil student melalui modal di detail kelas dan langsung memilih student baru untuk enrollment tanpa meninggalkan halaman.",
    "requirements": [
      "Saat parent belum memiliki student, panel menampilkan tombol \"Tambah student\" yang membuka modal berisi field dan validasi yang sama dengan form student yang ada.",
      "Setelah student berhasil dibuat, modal tertutup, daftar student di panel diperbarui, dan student baru terpilih pada form enrollment.",
      "Parent tetap berada di URL detail kelas yang sama.",
      "Modal dapat diakses: `role=\"dialog\"`, `aria-modal`, fokus awal pada field pertama, Escape menutup, dan fokus kembali ke tombol pemicu.",
      "Pembuatan student di dashboard parent tidak berubah."
    ],
    "acceptanceCriteria": [
      "Parent tanpa student dapat membuat student dari detail kelas dan langsung melihat form enrollment dengan student tersebut terpilih.",
      "Error validasi dan error API ditampilkan di dalam modal tanpa menutupnya.",
      "Membatalkan modal tidak membuat data.",
      "Halaman `/dashboard/parent/students` tetap berfungsi seperti sebelumnya.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Pakai ulang `createStudent` (`app/(dashboard)/dashboard/parent/students/_actions/actions.ts:44`) dan field `StudentForm.tsx` bila memungkinkan. Action tersebut hanya me-revalidate `/dashboard/parent/students`, sehingga detail kelas perlu memperoleh daftar student terbaru. Mekanismenya diserahkan ke implementasi dengan mengikuti konvensi Next.js App Router di repo. Ikuti pola dialog di `app/(dashboard)/dashboard/parent/students/_components/DeleteStudentButton.tsx`. Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/app/(public)/kelas/[id]/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/students/_actions/actions.ts"
    ],
    "edgeCases": [
      "Sesi parent kedaluwarsa saat submit modal.",
      "Gagal memuat ulang daftar student setelah create berhasil.",
      "Kelas group tanpa jadwal tersedia (panel tetap menampilkan pesan jadwal)."
    ],
    "testingValidation": [
      "Vitest untuk membuka dan menutup modal, sukses yang memilih student baru, dan tampilan error.",
      "Existing tests pass (termasuk `EnrollmentPanel.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Edit atau hapus student dari detail kelas.",
      "Perubahan API academic."
    ]
  }
}
```
