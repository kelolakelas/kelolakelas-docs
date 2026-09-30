## Background / Problem

KEL-111 menambahkan modal pada `EnrollmentPanel.tsx:52-74` hanya saat daftar student kosong; saat sudah ada satu student, tombol tambah tidak tersedia tanpa meninggalkan detail kelas.

## Goal

Parent dengan satu atau lebih student dapat menambah student lagi dari detail kelas dan langsung melanjutkan enrollment untuk student baru.

## Requirements

- Tampilkan affordance Tambah student juga saat daftar student tidak kosong untuk group dan private.
- Gunakan modal/StudentForm yang sama seperti KEL-111, perbarui opsi dan pilih student baru tanpa pindah URL.
- Pertahankan pemilihan student lama, modal empty state, aksesibilitas dan error handling existing.

## Acceptance Criteria

- [ ] Parent dengan student existing dapat menambah dan langsung memilih student baru di kelas yang sama.
- [ ] Cancel/error tidak mengubah pilihan sebelumnya dan fokus kembali ke pemicu.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

KEL-111 Done; jangan mengubah API. `EnrollmentPanel.tsx:52-74` memiliki modal pada early-return empty state; saat memindahkan/berbagi markup, periksa dua tipe kelas dan pemulihan fokus pada trigger. Perbarui docs web.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx`

## Edge Cases

- Parent memiliki banyak student dan form private sedang memuat request.
- Modal dibatalkan lalu dibuka kembali; create gagal/401.

## Testing / Validation

- [ ] Vitest dua jalur (zero-state dan existing students), group/private, sukses/cancel/error dan focus return.
- [ ] Jalankan test, lint, type check dan build; verifikasi manual detail kelas.

## Out of Scope

- Edit dan hapus student dari detail kelas.

## AI Orchestrator Contract

```json
{
  "draftKey": "student-modal-existing-list",
  "projectKey": null,
  "title": "Parent yang sudah memiliki student dapat menambah student lain dari detail kelas",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "repositories": [
    "web"
  ],
  "labels": [
    "web",
    "ai-ready"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "KEL-111 menambahkan modal pada `EnrollmentPanel.tsx:52-74` hanya saat daftar student kosong; saat sudah ada satu student, tombol tambah tidak tersedia tanpa meninggalkan detail kelas.",
    "goal": "Parent dengan satu atau lebih student dapat menambah student lagi dari detail kelas dan langsung melanjutkan enrollment untuk student baru.",
    "requirements": [
      "Tampilkan affordance Tambah student juga saat daftar student tidak kosong untuk group dan private.",
      "Gunakan modal/StudentForm yang sama seperti KEL-111, perbarui opsi dan pilih student baru tanpa pindah URL.",
      "Pertahankan pemilihan student lama, modal empty state, aksesibilitas dan error handling existing."
    ],
    "acceptanceCriteria": [
      "Parent dengan student existing dapat menambah dan langsung memilih student baru di kelas yang sama.",
      "Cancel/error tidak mengubah pilihan sebelumnya dan fokus kembali ke pemicu.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "KEL-111 Done; jangan mengubah API. `EnrollmentPanel.tsx:52-74` memiliki modal pada early-return empty state; saat memindahkan/berbagi markup, periksa dua tipe kelas dan pemulihan fokus pada trigger. Perbarui docs web.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx"
    ],
    "edgeCases": [
      "Parent memiliki banyak student dan form private sedang memuat request.",
      "Modal dibatalkan lalu dibuka kembali; create gagal/401."
    ],
    "testingValidation": [
      "Vitest dua jalur (zero-state dan existing students), group/private, sukses/cancel/error dan focus return.",
      "Jalankan test, lint, type check dan build; verifikasi manual detail kelas."
    ],
    "outOfScope": [
      "Edit dan hapus student dari detail kelas."
    ]
  }
}
```
