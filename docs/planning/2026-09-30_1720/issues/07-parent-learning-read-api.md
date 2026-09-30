## Background / Problem

Handler sesi, absensi, dan laporan membutuhkan tenant claim sehingga parent tanpa tenant mendapat 401 (`internal/delivery/http/handler/attendance_handler.go:75-78`). Middleware melewati pemeriksaan permission untuk parent (`internal/delivery/http/middleware/permission_middleware.go:51-66`), sementara list usecase hanya memfilter tenant (`internal/usecase/attendance_usecase.go:32-44`, `report_usecase.go:31-43`). Akibatnya token parent yang membawa tenant_id berpotensi membaca seluruh data tenant. Enrollment dan student sudah punya pola kepemilikan parent (`internal/repository/enrollment_repository.go:162-168`).

## Goal

Parent dapat membaca sesi mendatang, riwayat kehadiran, dan laporan untuk anak miliknya saja, dan tidak ada jalur parent yang dapat membaca data anak lain.

## Requirements

- Token parent pada endpoint baca sesi, absensi, dan laporan selalu dibatasi pada student dengan `parent_id` pemanggil, terlepas dari ada tidaknya tenant claim.
- Sesi untuk parent hanya sesi dari jadwal enrollment aktif anaknya; attendees tidak mengekspos siswa lain.
- Parent tidak dapat melakukan mutasi absensi, sesi, atau laporan.
- Perilaku anggota tenant tidak berubah.

## Acceptance Criteria

- [ ] Parent melihat sesi, absensi, dan laporan anaknya di beberapa tenant sekaligus.
- [ ] Parent tidak dapat membaca data anak parent lain meski memberikan student_id, enrollment_id, atau tenant header milik orang lain.
- [ ] Token parent yang membawa tenant_id tidak lagi dapat membaca seluruh data tenant.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebocoran data anak (kehadiran dan evaluasi) lintas parent atau tenant. Penegakan wajib di repository atau usecase, bukan di UI atau gateway. Gateway `RequireTenant` meloloskan parent tanpa tenant (`principal_middleware.go:22-31`), jadi tidak ada perubahan gateway. Perbarui anotasi `@x-permission` (`parent_tokens`) dan swagger. Perbarui `kelolakelas-docs` (api/academic.md bagian KEL-22 yang menyatakan parent tidak punya akses, 05-security.md) dan catat ADR untuk model akses parent.

Relevant areas:

- `kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/attendance_handler.go`
- `kelolakelas-academic-service/internal/usecase/attendance_usecase.go`
- `kelolakelas-academic-service/internal/usecase/report_usecase.go`
- `kelolakelas-academic-service/internal/repository/session_repository.go`
- `kelolakelas-academic-service/internal/repository/enrollment_repository.go`

## Edge Cases

- Parent dengan anak di dua tenant.
- Enrollment yang sudah dropped: riwayat kehadiran dan laporan lama tetap terbaca, tetapi sesi mendatang tidak.
- Sesi group dengan banyak siswa dari parent berbeda.
- Student dihapus secara soft delete.

## Testing / Validation

- [ ] Postgres integration test matriks otorisasi: parent pemilik, parent lain, parent dengan tenant header asing, anggota tenant, dan tenant lain, sebagai mitigasi risiko kebocoran.
- [ ] Unit test penolakan mutasi oleh parent.
- [ ] Swagger contract test, go vet, go test -race, dan build lulus.
- [ ] Acceptance criteria diverifikasi dengan token parent nyata dari identity lokal.

## Out of Scope

- Layar web parent.
- Student notes untuk parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "parent-learning-read-api",
  "projectKey": "parent-learning-portal",
  "title": "Parent dapat membaca sesi, kehadiran, dan laporan milik anaknya sendiri",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [
    "tutor-session-scope-guards"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Handler sesi, absensi, dan laporan membutuhkan tenant claim sehingga parent tanpa tenant mendapat 401 (`internal/delivery/http/handler/attendance_handler.go:75-78`). Middleware melewati pemeriksaan permission untuk parent (`internal/delivery/http/middleware/permission_middleware.go:51-66`), sementara list usecase hanya memfilter tenant (`internal/usecase/attendance_usecase.go:32-44`, `report_usecase.go:31-43`). Akibatnya token parent yang membawa tenant_id berpotensi membaca seluruh data tenant. Enrollment dan student sudah punya pola kepemilikan parent (`internal/repository/enrollment_repository.go:162-168`).",
    "goal": "Parent dapat membaca sesi mendatang, riwayat kehadiran, dan laporan untuk anak miliknya saja, dan tidak ada jalur parent yang dapat membaca data anak lain.",
    "requirements": [
      "Token parent pada endpoint baca sesi, absensi, dan laporan selalu dibatasi pada student dengan `parent_id` pemanggil, terlepas dari ada tidaknya tenant claim.",
      "Sesi untuk parent hanya sesi dari jadwal enrollment aktif anaknya; attendees tidak mengekspos siswa lain.",
      "Parent tidak dapat melakukan mutasi absensi, sesi, atau laporan.",
      "Perilaku anggota tenant tidak berubah."
    ],
    "acceptanceCriteria": [
      "Parent melihat sesi, absensi, dan laporan anaknya di beberapa tenant sekaligus.",
      "Parent tidak dapat membaca data anak parent lain meski memberikan student_id, enrollment_id, atau tenant header milik orang lain.",
      "Token parent yang membawa tenant_id tidak lagi dapat membaca seluruh data tenant.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebocoran data anak (kehadiran dan evaluasi) lintas parent atau tenant. Penegakan wajib di repository atau usecase, bukan di UI atau gateway. Gateway `RequireTenant` meloloskan parent tanpa tenant (`principal_middleware.go:22-31`), jadi tidak ada perubahan gateway. Perbarui anotasi `@x-permission` (`parent_tokens`) dan swagger. Perbarui `kelolakelas-docs` (api/academic.md bagian KEL-22 yang menyatakan parent tidak punya akses, 05-security.md) dan catat ADR untuk model akses parent.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/attendance_handler.go",
      "kelolakelas-academic-service/internal/usecase/attendance_usecase.go",
      "kelolakelas-academic-service/internal/usecase/report_usecase.go",
      "kelolakelas-academic-service/internal/repository/session_repository.go",
      "kelolakelas-academic-service/internal/repository/enrollment_repository.go"
    ],
    "edgeCases": [
      "Parent dengan anak di dua tenant.",
      "Enrollment yang sudah dropped: riwayat kehadiran dan laporan lama tetap terbaca, tetapi sesi mendatang tidak.",
      "Sesi group dengan banyak siswa dari parent berbeda.",
      "Student dihapus secara soft delete."
    ],
    "testingValidation": [
      "Postgres integration test matriks otorisasi: parent pemilik, parent lain, parent dengan tenant header asing, anggota tenant, dan tenant lain, sebagai mitigasi risiko kebocoran.",
      "Unit test penolakan mutasi oleh parent.",
      "Swagger contract test, go vet, go test -race, dan build lulus.",
      "Acceptance criteria diverifikasi dengan token parent nyata dari identity lokal."
    ],
    "outOfScope": [
      "Layar web parent.",
      "Student notes untuk parent."
    ]
  }
}
```
