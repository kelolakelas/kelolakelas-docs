## Background / Problem

Parent dapat menyimpan student dengan tanggal lahir di masa depan (QA: 2030-01-15 pada 9 Okt 2026), dan daftar student menampilkannya tanpa error. Web `lib/students.ts` (`studentFormSchema.date_of_birth`) hanya memvalidasi format tanggal, input `type="date"` di `StudentForm.tsx` tidak memiliki `max`, dan academic `internal/usecase/student_usecase.go` (create dan update) hanya melakukan `time.Parse("2006-01-02", ...)` tanpa pengecekan tanggal.

## Goal

Tanggal lahir student yang lebih besar dari hari ini ditolak di web dan di academic.

## Requirements

- Academic menolak create dan update student dengan tanggal lahir setelah tanggal hari ini (kalender `Asia/Jakarta`) dengan 400 "Invalid student payload".
- Tanggal lahir hari ini dan tanggal lampau tetap diterima.
- Form student web menampilkan pesan validasi per field untuk tanggal lahir di masa depan, dan input tanggal membatasi pilihan hingga hari ini.
- Validasi format tanggal dan field lain yang ada tidak berubah.

## Acceptance Criteria

- [ ] Menyimpan student dengan tanggal lahir besok gagal dengan pesan validasi di form.
- [ ] `POST` dan `PUT` student ke academic dengan tanggal lahir di masa depan dijawab 400.
- [ ] Menyimpan student dengan tanggal lahir hari ini berhasil.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Asumsi eksplisit: batas "hari ini" memakai kalender `Asia/Jakarta`, sesuai zona pengguna; batas usia minimum tidak termasuk. Handler academic memetakan error input lewat `isStudentInputError`, jadi error baru perlu ikut dipetakan ke 400. Data lama dengan tanggal di masa depan tidak dimigrasi. Perbarui kelolakelas-docs `docs/components/academic-service.md` dan `docs/components/web.md` pada bagian student.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/student_usecase.go`
- `kelolakelas-academic-service/internal/domain/student.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go`
- `kelolakelas-web/lib/students.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx`

## Edge Cases

- Submit tepat sekitar tengah malam WIB.
- Edit student lama yang sudah tersimpan dengan tanggal di masa depan.
- Tanggal tidak valid seperti 2026-02-30 tetap ditolak sebagai format tidak valid.

## Testing / Validation

- [ ] Unit test academic untuk tanggal besok (400), hari ini (sukses), dan tanggal lampau (sukses) pada create dan update.
- [ ] Vitest `lib/students.test.ts` untuk tanggal di masa depan.
- [ ] Existing tests pass, `go test ./...` dan `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Batas usia minimum atau maksimum student.
- Koreksi data student yang sudah tersimpan.

## AI Orchestrator Contract

```json
{
  "draftKey": "student-dob-not-future",
  "projectKey": null,
  "title": "Tanggal lahir student di masa depan diterima tanpa validasi",
  "type": "Improvement",
  "priority": "Low",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "academic",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Parent dapat menyimpan student dengan tanggal lahir di masa depan (QA: 2030-01-15 pada 9 Okt 2026), dan daftar student menampilkannya tanpa error. Web `lib/students.ts` (`studentFormSchema.date_of_birth`) hanya memvalidasi format tanggal, input `type=\"date\"` di `StudentForm.tsx` tidak memiliki `max`, dan academic `internal/usecase/student_usecase.go` (create dan update) hanya melakukan `time.Parse(\"2006-01-02\", ...)` tanpa pengecekan tanggal.",
    "goal": "Tanggal lahir student yang lebih besar dari hari ini ditolak di web dan di academic.",
    "requirements": [
      "Academic menolak create dan update student dengan tanggal lahir setelah tanggal hari ini (kalender `Asia/Jakarta`) dengan 400 \"Invalid student payload\".",
      "Tanggal lahir hari ini dan tanggal lampau tetap diterima.",
      "Form student web menampilkan pesan validasi per field untuk tanggal lahir di masa depan, dan input tanggal membatasi pilihan hingga hari ini.",
      "Validasi format tanggal dan field lain yang ada tidak berubah."
    ],
    "acceptanceCriteria": [
      "Menyimpan student dengan tanggal lahir besok gagal dengan pesan validasi di form.",
      "`POST` dan `PUT` student ke academic dengan tanggal lahir di masa depan dijawab 400.",
      "Menyimpan student dengan tanggal lahir hari ini berhasil.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Asumsi eksplisit: batas \"hari ini\" memakai kalender `Asia/Jakarta`, sesuai zona pengguna; batas usia minimum tidak termasuk. Handler academic memetakan error input lewat `isStudentInputError`, jadi error baru perlu ikut dipetakan ke 400. Data lama dengan tanggal di masa depan tidak dimigrasi. Perbarui kelolakelas-docs `docs/components/academic-service.md` dan `docs/components/web.md` pada bagian student.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/student_usecase.go",
      "kelolakelas-academic-service/internal/domain/student.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go",
      "kelolakelas-web/lib/students.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx"
    ],
    "edgeCases": [
      "Submit tepat sekitar tengah malam WIB.",
      "Edit student lama yang sudah tersimpan dengan tanggal di masa depan.",
      "Tanggal tidak valid seperti 2026-02-30 tetap ditolak sebagai format tidak valid."
    ],
    "testingValidation": [
      "Unit test academic untuk tanggal besok (400), hari ini (sukses), dan tanggal lampau (sukses) pada create dan update.",
      "Vitest `lib/students.test.ts` untuk tanggal di masa depan.",
      "Existing tests pass, `go test ./...` dan `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Batas usia minimum atau maksimum student.",
      "Koreksi data student yang sudah tersimpan."
    ]
  }
}
```
