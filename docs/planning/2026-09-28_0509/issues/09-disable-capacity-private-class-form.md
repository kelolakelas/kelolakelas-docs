## Background / Problem

`ClassForm.tsx:180-201` menampilkan input "Max Student Capacity" untuk semua tipe kelas, termasuk Private. Nilainya dikirim `createClass` (`_actions/classActions.ts:128`) ke `POST /api/v1/classes`, tetapi academic tidak menyimpannya: `Class.Capacity` deprecated dengan `json:"-"` (`internal/domain/class.go:37`) dan `CreateClassRequest` tidak memiliki field kapasitas (`class.go:47`). Kapasitas yang berlaku diisi per jadwal (KEL-50). Tenant mengisi field yang diam-diam dibuang.

## Goal

Form buat kelas tidak lagi meminta kapasitas untuk tipe apa pun. Tenant menetapkan kapasitas hanya pada jadwal, dan kelas private jelas ditujukan untuk satu student.

## Requirements

- Input kapasitas beserta pesan error-nya dihapus dari `ClassForm.tsx` untuk kelas group dan private.
- `createClass` tidak lagi membaca atau mengirim `capacity`, dan `createClassSchema` tidak lagi memiliki field `capacity`.
- Saat tipe Private dipilih, form menampilkan teks bantuan bahwa kelas private untuk satu student dan jadwalnya disepakati per enrollment.
- Saat tipe Group dipilih, form menampilkan teks bantuan bahwa kapasitas diatur per jadwal pada langkah jadwal.
- Input kapasitas per jadwal (`scheduleItemSchema`, `ScheduleForm.tsx`, `AddScheduleModal.tsx`) tidak berubah.

## Acceptance Criteria

- [ ] Form buat kelas tidak menampilkan input kapasitas pada tipe Private maupun Group.
- [ ] Body request `POST /api/v1/classes` dari form tidak mengandung `capacity`.
- [ ] Kelas private dan group tetap dapat dibuat, dan wizard tetap lanjut ke langkah jadwal seperti sebelumnya.
- [ ] Input kapasitas per jadwal tetap tampil dan tervalidasi seperti sebelumnya.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Keputusan owner (2026-09-28): field kapasitas dihapus dari form kelas, dan kapasitas hanya diisi per jadwal. Perubahan hanya di web; academic sudah mengabaikan field ini, jadi tidak ada perubahan kontrak API. Tipe `ClassEntity.capacity` (`_lib/schema.ts:262`) boleh dipertahankan sebagai field respons opsional, atau dihapus bila tidak ada pemakai; periksa dengan pencarian sebelum menghapus. Test `ClassListTable.test.tsx` yang memastikan tidak ada klaim kapasitas tingkat kelas harus tetap lulus. Perbarui kelolakelas-docs `docs/components/web.md` bila form kelas didokumentasikan.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`

## Edge Cases

- Tenant berpindah tipe Group ↔ Private: teks bantuan mengikuti tipe terpilih.
- Error validasi server dikembalikan: form tidak lagi mencoba menampilkan error `capacity`.

## Testing / Validation

- [ ] Vitest untuk form tanpa input kapasitas pada kedua tipe, teks bantuan per tipe, dan payload `createClass` tanpa `capacity`.
- [ ] Test `createClassSchema` diperbarui; test `scheduleItemSchema capacity` tetap lulus tanpa perubahan.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Menghapus kolom `capacity` di tabel classes academic (migration backend).
- Perubahan kapasitas per jadwal.
- Perubahan API academic.

## AI Orchestrator Contract

```json
{
  "draftKey": "disable-capacity-private-class-form",
  "projectKey": null,
  "title": "Form buat kelas tidak lagi menampilkan field kapasitas karena kapasitas diatur per jadwal",
  "type": "Improvement",
  "priority": "Medium",
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
    "backgroundProblem": "`ClassForm.tsx:180-201` menampilkan input \"Max Student Capacity\" untuk semua tipe kelas, termasuk Private. Nilainya dikirim `createClass` (`_actions/classActions.ts:128`) ke `POST /api/v1/classes`, tetapi academic tidak menyimpannya: `Class.Capacity` deprecated dengan `json:\"-\"` (`internal/domain/class.go:37`) dan `CreateClassRequest` tidak memiliki field kapasitas (`class.go:47`). Kapasitas yang berlaku diisi per jadwal (KEL-50). Tenant mengisi field yang diam-diam dibuang.",
    "goal": "Form buat kelas tidak lagi meminta kapasitas untuk tipe apa pun. Tenant menetapkan kapasitas hanya pada jadwal, dan kelas private jelas ditujukan untuk satu student.",
    "requirements": [
      "Input kapasitas beserta pesan error-nya dihapus dari `ClassForm.tsx` untuk kelas group dan private.",
      "`createClass` tidak lagi membaca atau mengirim `capacity`, dan `createClassSchema` tidak lagi memiliki field `capacity`.",
      "Saat tipe Private dipilih, form menampilkan teks bantuan bahwa kelas private untuk satu student dan jadwalnya disepakati per enrollment.",
      "Saat tipe Group dipilih, form menampilkan teks bantuan bahwa kapasitas diatur per jadwal pada langkah jadwal.",
      "Input kapasitas per jadwal (`scheduleItemSchema`, `ScheduleForm.tsx`, `AddScheduleModal.tsx`) tidak berubah."
    ],
    "acceptanceCriteria": [
      "Form buat kelas tidak menampilkan input kapasitas pada tipe Private maupun Group.",
      "Body request `POST /api/v1/classes` dari form tidak mengandung `capacity`.",
      "Kelas private dan group tetap dapat dibuat, dan wizard tetap lanjut ke langkah jadwal seperti sebelumnya.",
      "Input kapasitas per jadwal tetap tampil dan tervalidasi seperti sebelumnya.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Keputusan owner (2026-09-28): field kapasitas dihapus dari form kelas, dan kapasitas hanya diisi per jadwal. Perubahan hanya di web; academic sudah mengabaikan field ini, jadi tidak ada perubahan kontrak API. Tipe `ClassEntity.capacity` (`_lib/schema.ts:262`) boleh dipertahankan sebagai field respons opsional, atau dihapus bila tidak ada pemakai; periksa dengan pencarian sebelum menghapus. Test `ClassListTable.test.tsx` yang memastikan tidak ada klaim kapasitas tingkat kelas harus tetap lulus. Perbarui kelolakelas-docs `docs/components/web.md` bila form kelas didokumentasikan.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts"
    ],
    "edgeCases": [
      "Tenant berpindah tipe Group ↔ Private: teks bantuan mengikuti tipe terpilih.",
      "Error validasi server dikembalikan: form tidak lagi mencoba menampilkan error `capacity`."
    ],
    "testingValidation": [
      "Vitest untuk form tanpa input kapasitas pada kedua tipe, teks bantuan per tipe, dan payload `createClass` tanpa `capacity`.",
      "Test `createClassSchema` diperbarui; test `scheduleItemSchema capacity` tetap lulus tanpa perubahan.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Menghapus kolom `capacity` di tabel classes academic (migration backend).",
      "Perubahan kapasitas per jadwal.",
      "Perubahan API academic."
    ]
  }
}
```
