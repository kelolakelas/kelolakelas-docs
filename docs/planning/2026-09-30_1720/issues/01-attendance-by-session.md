## Background / Problem

Request absensi memakai `enrollment_id + schedule_id + date` (`internal/domain/attendance.go:92-97`) lalu dicari lewat `FindForAttendance` yang mencocokkan `schedule_id` dan `session_date` (`internal/repository/session_repository.go:59-65`). Sesi hasil `RescheduleSession` dibuat dengan `ScheduleID=nil` (`internal/usecase/schedule_usecase.go:338-348`), sehingga absensinya tidak dapat dicatat dan `GetSessionAttendees` gagal dengan ErrScheduleNotFound (`schedule_usecase.go:620-623`). Tidak ada pencatatan massal per sesi.

## Goal

Pengajar dapat mencatat dan membaca kehadiran berdasarkan sesi, termasuk sesi yang di-reschedule, untuk seluruh siswa satu sesi dalam satu request.

## Requirements

- Sediakan cara mencatat absensi yang dialamatkan ke sesi (session id) sambil mempertahankan request lama berbasis schedule_id + date.
- Sediakan pencatatan massal status kehadiran untuk banyak enrollment dalam satu sesi, atomik per request, dengan upsert terhadap unique key (session_id, enrollment_id).
- Daftar attendees dan pencatatan absensi harus bekerja untuk sesi hasil reschedule, memakai enrollment dari jadwal asal sesi tersebut.
- Pertahankan guard yang ada: pengajar hanya dapat mencatat untuk sesi yang `tutor_id`-nya adalah dirinya, dan permission `attendance:create|update` tetap berlaku.
- Hanya enrollment berstatus aktif pada sesi tersebut yang dapat diabsen.

## Acceptance Criteria

- [ ] Absensi untuk sesi reschedule dapat dibuat, diubah, dan dibaca.
- [ ] Satu request massal mencatat status seluruh siswa satu sesi; mengulang request yang sama tidak membuat duplikat.
- [ ] Pengajar yang bukan tutor sesi tersebut ditolak 403 dan enrollment yang bukan milik sesi ditolak dengan error validasi.
- [ ] Request lama berbasis schedule_id + date tetap berfungsi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: relasi sesi reschedule ke jadwal asal tidak tersimpan, sehingga perbaikan yang keliru dapat menautkan absensi ke enrollment kelas lain atau tenant lain. Tentukan dari data yang ada bagaimana sesi reschedule terhubung ke jadwal asalnya; bila tidak ada kolom yang cukup, tambahkan migration kompatibel (golang-migrate di `migrations/`) dan isi data lama bila dapat dibuktikan, jika tidak dokumentasikan batasannya. Semua query tetap di-scope tenant di SQL (ADR 0019). Tambahkan anotasi `@x-permission` dan perbarui swagger agar `cmd/server/swagger_contract_test.go` lulus. Perbarui `kelolakelas-docs` (api/academic.md, flows/academic.md, data/academic-schema.md) dan catat ADR bila model relasi sesi berubah.

Relevant areas:

- `kelolakelas-academic-service/internal/domain/attendance.go`
- `kelolakelas-academic-service/internal/usecase/attendance_usecase.go`
- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/repository/session_repository.go`
- `kelolakelas-academic-service/cmd/server/attendance_report_routes.go`

## Edge Cases

- Sesi reschedule untuk kelas private dengan satu enrollment.
- Request massal berisi enrollment yang sudah dropped atau milik sesi lain.
- Dua pengajar mengirim absensi sesi yang sama secara bersamaan.
- Sesi yang sudah dibatalkan.

## Testing / Validation

- [ ] Unit test usecase untuk sesi biasa, sesi reschedule, request massal, dan penolakan enrollment asing.
- [ ] Postgres integration test untuk upsert massal serentak dan scope tenant di SQL sebagai mitigasi risiko penautan lintas tenant.
- [ ] Swagger contract test, go vet, go test -race, dan build lulus.
- [ ] Acceptance criteria diverifikasi melalui request API terhadap database lokal.

## Out of Scope

- Layar web absensi.
- Notifikasi absen ke parent.
- Akses parent ke absensi.

## AI Orchestrator Contract

```json
{
  "draftKey": "attendance-by-session",
  "projectKey": "tutor-session-operations",
  "title": "Absensi dapat dicatat per sesi, termasuk sesi reschedule dan secara massal",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Request absensi memakai `enrollment_id + schedule_id + date` (`internal/domain/attendance.go:92-97`) lalu dicari lewat `FindForAttendance` yang mencocokkan `schedule_id` dan `session_date` (`internal/repository/session_repository.go:59-65`). Sesi hasil `RescheduleSession` dibuat dengan `ScheduleID=nil` (`internal/usecase/schedule_usecase.go:338-348`), sehingga absensinya tidak dapat dicatat dan `GetSessionAttendees` gagal dengan ErrScheduleNotFound (`schedule_usecase.go:620-623`). Tidak ada pencatatan massal per sesi.",
    "goal": "Pengajar dapat mencatat dan membaca kehadiran berdasarkan sesi, termasuk sesi yang di-reschedule, untuk seluruh siswa satu sesi dalam satu request.",
    "requirements": [
      "Sediakan cara mencatat absensi yang dialamatkan ke sesi (session id) sambil mempertahankan request lama berbasis schedule_id + date.",
      "Sediakan pencatatan massal status kehadiran untuk banyak enrollment dalam satu sesi, atomik per request, dengan upsert terhadap unique key (session_id, enrollment_id).",
      "Daftar attendees dan pencatatan absensi harus bekerja untuk sesi hasil reschedule, memakai enrollment dari jadwal asal sesi tersebut.",
      "Pertahankan guard yang ada: pengajar hanya dapat mencatat untuk sesi yang `tutor_id`-nya adalah dirinya, dan permission `attendance:create|update` tetap berlaku.",
      "Hanya enrollment berstatus aktif pada sesi tersebut yang dapat diabsen."
    ],
    "acceptanceCriteria": [
      "Absensi untuk sesi reschedule dapat dibuat, diubah, dan dibaca.",
      "Satu request massal mencatat status seluruh siswa satu sesi; mengulang request yang sama tidak membuat duplikat.",
      "Pengajar yang bukan tutor sesi tersebut ditolak 403 dan enrollment yang bukan milik sesi ditolak dengan error validasi.",
      "Request lama berbasis schedule_id + date tetap berfungsi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: relasi sesi reschedule ke jadwal asal tidak tersimpan, sehingga perbaikan yang keliru dapat menautkan absensi ke enrollment kelas lain atau tenant lain. Tentukan dari data yang ada bagaimana sesi reschedule terhubung ke jadwal asalnya; bila tidak ada kolom yang cukup, tambahkan migration kompatibel (golang-migrate di `migrations/`) dan isi data lama bila dapat dibuktikan, jika tidak dokumentasikan batasannya. Semua query tetap di-scope tenant di SQL (ADR 0019). Tambahkan anotasi `@x-permission` dan perbarui swagger agar `cmd/server/swagger_contract_test.go` lulus. Perbarui `kelolakelas-docs` (api/academic.md, flows/academic.md, data/academic-schema.md) dan catat ADR bila model relasi sesi berubah.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain/attendance.go",
      "kelolakelas-academic-service/internal/usecase/attendance_usecase.go",
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/repository/session_repository.go",
      "kelolakelas-academic-service/cmd/server/attendance_report_routes.go"
    ],
    "edgeCases": [
      "Sesi reschedule untuk kelas private dengan satu enrollment.",
      "Request massal berisi enrollment yang sudah dropped atau milik sesi lain.",
      "Dua pengajar mengirim absensi sesi yang sama secara bersamaan.",
      "Sesi yang sudah dibatalkan."
    ],
    "testingValidation": [
      "Unit test usecase untuk sesi biasa, sesi reschedule, request massal, dan penolakan enrollment asing.",
      "Postgres integration test untuk upsert massal serentak dan scope tenant di SQL sebagai mitigasi risiko penautan lintas tenant.",
      "Swagger contract test, go vet, go test -race, dan build lulus.",
      "Acceptance criteria diverifikasi melalui request API terhadap database lokal."
    ],
    "outOfScope": [
      "Layar web absensi.",
      "Notifikasi absen ke parent.",
      "Akses parent ke absensi."
    ]
  }
}
```
