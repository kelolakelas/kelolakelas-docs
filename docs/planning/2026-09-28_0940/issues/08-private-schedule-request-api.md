## Background / Problem

Kelas private kini dapat dibeli langsung melalui `POST /api/v1/catalog/classes/:class_id/enrollments` tanpa jadwal. Pada academic `internal/usecase/enrollment_usecase.go:217`, hanya kelas group yang wajib `schedule_id`. Jadwal private hanya dapat dibuat tenant melalui `POST /schedules` dengan `enrollment_id` (`internal/usecase/schedule_usecase.go:221-239`) setelah enrollment ada. Parent tidak punya cara menyampaikan jadwal yang diinginkan, dan tenant tidak dapat meninjaunya sebelum pembayaran.

## Goal

Parent dapat mengajukan slot jadwal mingguan untuk kelas private bagi student miliknya. Tenant dapat melihat dan menolak ajuan, dengan atau tanpa alasan. Isolasi tenant dan kepemilikan student tetap terjaga.

## Requirements

- Academic menyimpan permintaan jadwal private dengan tenant, kelas, student, parent, billing cycle (`monthly`/`quarterly`/`yearly`), satu atau lebih slot mingguan (`day_of_week` ISO 1–7, `start_time`, `end_time`), catatan parent opsional, status (`pending`, `approved`, `rejected`, `cancelled`), alasan penolakan opsional, serta waktu dibuat dan diputuskan.
- Parent hanya dapat membuat permintaan untuk student miliknya, pada kelas bertipe `private` yang dipublikasikan dengan `enrollment_status` `open`. Kelas group ditolak.
- Satu student hanya boleh memiliki satu permintaan `pending` per kelas, dan tidak boleh mengajukan bila sudah memiliki enrollment `pending` atau `active` di kelas tersebut.
- Parent dapat melihat daftar dan detail permintaannya sendiri, serta membatalkan permintaan yang masih `pending`.
- Anggota tenant dengan `enrollment:read` dapat melihat daftar (dengan filter status) dan detail permintaan milik tenant-nya. Anggota dengan `enrollment:update` dapat menolak permintaan `pending`, dengan alasan opsional.
- Email parent dari klaim token terverifikasi disimpan pada permintaan agar invoice yang kelak dibuat tenant dapat dialamatkan, mengikuti pola KEL-75 di `internal/delivery/http/handler/enrollment_handler.go:198-201`.
- Checkout langsung kelas private melalui `POST /catalog/classes/:class_id/enrollments` ditolak dengan `code` error yang dapat dibaca mesin dan mengarahkan ke permintaan jadwal. Checkout kelas group tidak berubah.
- Semua route baru didaftarkan di gateway `internal/delivery/http/router.go` dengan autentikasi yang sama seperti route enrollment.

## Acceptance Criteria

- [ ] Parent membuat permintaan untuk student miliknya pada kelas private yang terbuka dan menerima 201 dengan status `pending`.
- [ ] Permintaan untuk student milik parent lain, kelas group, kelas yang tidak dipublikasikan atau tidak `open`, atau slot dengan `end_time` tidak setelah `start_time` ditolak 4xx dengan pesan yang jelas.
- [ ] Permintaan `pending` kedua untuk student dan kelas yang sama ditolak 409.
- [ ] Anggota tenant A tidak dapat membaca, menolak, atau mengetahui keberadaan permintaan tenant B.
- [ ] Tenant menolak dengan atau tanpa alasan, lalu parent melihat status `rejected` beserta alasannya bila ada.
- [ ] Parent membatalkan permintaan `pending`, dan permintaan yang sudah diputuskan tidak dapat dibatalkan.
- [ ] Checkout langsung kelas private ditolak dengan `code` terdokumentasi, sedangkan checkout kelas group tetap berhasil seperti sebelumnya.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran data lintas tenant atau lintas parent, karena resource baru dibaca oleh dua persona. Ikuti scoping tenant dan `RequirePermissionUnlessParent` di academic `cmd/server/routes.go:65-70`, serta sanitasi 5xx (KEL-64). Tambahkan migration academic baru; format waktu mengikuti `ScheduleItemRequest` (`internal/domain/schedule_dto.go:10-20`). Keputusan owner (2026-09-28): (1) kelas private hanya dapat dibeli melalui permintaan jadwal yang disetujui tenant, dan checkout langsung dihapus; (2) tenant dapat menolak begitu saja atau menolak dengan rekomendasi jadwal lain. Rekomendasi dikerjakan di issue terpisah (`private-schedule-recommendation-api`); issue ini menyediakan penolakan dengan alasan opsional, dan parent tetap dapat mengajukan permintaan baru setelah ditolak. Persetujuan, invoice, UI, email, dan chat ada di luar issue ini. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/api/endpoint-matrix.md`, `docs/api/gateway.md`, `docs/data/academic-schema.md`, dan `docs/flows/academic.md`.

Relevant areas:

- `kelolakelas-academic-service/internal/domain`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/repository`
- `kelolakelas-academic-service/internal/delivery/http/handler`
- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-academic-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Kelas di-unpublish atau ditutup saat permintaan masih `pending`.
- Student dihapus saat permintaan masih `pending`.
- Slot duplikat atau tumpang tindih dalam satu permintaan.
- Parent membatalkan bersamaan dengan tenant menolak (race).
- Token parent tanpa klaim email.

## Testing / Validation

- [ ] Unit test usecase untuk validasi, transisi status, dan aturan satu `pending` per student per kelas.
- [ ] Integration test PostgreSQL untuk isolasi tenant dan kepemilikan student (mitigasi risiko lintas tenant).
- [ ] Handler test untuk permission `enrollment:read`/`enrollment:update` serta akses parent.
- [ ] Gateway route test untuk route baru.
- [ ] Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Persetujuan permintaan beserta pembuatan enrollment, jadwal, dan invoice.
- UI web parent dan tenant.
- Notifikasi email atau chat.
- Penolakan dengan rekomendasi jadwal lain (issue terpisah).

## AI Orchestrator Contract

```json
{
  "draftKey": "private-schedule-request-api",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Parent dapat mengajukan jadwal kelas private dan tenant dapat meninjau atau menolaknya melalui API",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Kelas private kini dapat dibeli langsung melalui `POST /api/v1/catalog/classes/:class_id/enrollments` tanpa jadwal. Pada academic `internal/usecase/enrollment_usecase.go:217`, hanya kelas group yang wajib `schedule_id`. Jadwal private hanya dapat dibuat tenant melalui `POST /schedules` dengan `enrollment_id` (`internal/usecase/schedule_usecase.go:221-239`) setelah enrollment ada. Parent tidak punya cara menyampaikan jadwal yang diinginkan, dan tenant tidak dapat meninjaunya sebelum pembayaran.",
    "goal": "Parent dapat mengajukan slot jadwal mingguan untuk kelas private bagi student miliknya. Tenant dapat melihat dan menolak ajuan, dengan atau tanpa alasan. Isolasi tenant dan kepemilikan student tetap terjaga.",
    "requirements": [
      "Academic menyimpan permintaan jadwal private dengan tenant, kelas, student, parent, billing cycle (`monthly`/`quarterly`/`yearly`), satu atau lebih slot mingguan (`day_of_week` ISO 1–7, `start_time`, `end_time`), catatan parent opsional, status (`pending`, `approved`, `rejected`, `cancelled`), alasan penolakan opsional, serta waktu dibuat dan diputuskan.",
      "Parent hanya dapat membuat permintaan untuk student miliknya, pada kelas bertipe `private` yang dipublikasikan dengan `enrollment_status` `open`. Kelas group ditolak.",
      "Satu student hanya boleh memiliki satu permintaan `pending` per kelas, dan tidak boleh mengajukan bila sudah memiliki enrollment `pending` atau `active` di kelas tersebut.",
      "Parent dapat melihat daftar dan detail permintaannya sendiri, serta membatalkan permintaan yang masih `pending`.",
      "Anggota tenant dengan `enrollment:read` dapat melihat daftar (dengan filter status) dan detail permintaan milik tenant-nya. Anggota dengan `enrollment:update` dapat menolak permintaan `pending`, dengan alasan opsional.",
      "Email parent dari klaim token terverifikasi disimpan pada permintaan agar invoice yang kelak dibuat tenant dapat dialamatkan, mengikuti pola KEL-75 di `internal/delivery/http/handler/enrollment_handler.go:198-201`.",
      "Checkout langsung kelas private melalui `POST /catalog/classes/:class_id/enrollments` ditolak dengan `code` error yang dapat dibaca mesin dan mengarahkan ke permintaan jadwal. Checkout kelas group tidak berubah.",
      "Semua route baru didaftarkan di gateway `internal/delivery/http/router.go` dengan autentikasi yang sama seperti route enrollment."
    ],
    "acceptanceCriteria": [
      "Parent membuat permintaan untuk student miliknya pada kelas private yang terbuka dan menerima 201 dengan status `pending`.",
      "Permintaan untuk student milik parent lain, kelas group, kelas yang tidak dipublikasikan atau tidak `open`, atau slot dengan `end_time` tidak setelah `start_time` ditolak 4xx dengan pesan yang jelas.",
      "Permintaan `pending` kedua untuk student dan kelas yang sama ditolak 409.",
      "Anggota tenant A tidak dapat membaca, menolak, atau mengetahui keberadaan permintaan tenant B.",
      "Tenant menolak dengan atau tanpa alasan, lalu parent melihat status `rejected` beserta alasannya bila ada.",
      "Parent membatalkan permintaan `pending`, dan permintaan yang sudah diputuskan tidak dapat dibatalkan.",
      "Checkout langsung kelas private ditolak dengan `code` terdokumentasi, sedangkan checkout kelas group tetap berhasil seperti sebelumnya.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran data lintas tenant atau lintas parent, karena resource baru dibaca oleh dua persona. Ikuti scoping tenant dan `RequirePermissionUnlessParent` di academic `cmd/server/routes.go:65-70`, serta sanitasi 5xx (KEL-64). Tambahkan migration academic baru; format waktu mengikuti `ScheduleItemRequest` (`internal/domain/schedule_dto.go:10-20`). Keputusan owner (2026-09-28): (1) kelas private hanya dapat dibeli melalui permintaan jadwal yang disetujui tenant, dan checkout langsung dihapus; (2) tenant dapat menolak begitu saja atau menolak dengan rekomendasi jadwal lain. Rekomendasi dikerjakan di issue terpisah (`private-schedule-recommendation-api`); issue ini menyediakan penolakan dengan alasan opsional, dan parent tetap dapat mengajukan permintaan baru setelah ditolak. Persetujuan, invoice, UI, email, dan chat ada di luar issue ini. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/api/endpoint-matrix.md`, `docs/api/gateway.md`, `docs/data/academic-schema.md`, dan `docs/flows/academic.md`.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/repository",
      "kelolakelas-academic-service/internal/delivery/http/handler",
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-academic-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Kelas di-unpublish atau ditutup saat permintaan masih `pending`.",
      "Student dihapus saat permintaan masih `pending`.",
      "Slot duplikat atau tumpang tindih dalam satu permintaan.",
      "Parent membatalkan bersamaan dengan tenant menolak (race).",
      "Token parent tanpa klaim email."
    ],
    "testingValidation": [
      "Unit test usecase untuk validasi, transisi status, dan aturan satu `pending` per student per kelas.",
      "Integration test PostgreSQL untuk isolasi tenant dan kepemilikan student (mitigasi risiko lintas tenant).",
      "Handler test untuk permission `enrollment:read`/`enrollment:update` serta akses parent.",
      "Gateway route test untuk route baru.",
      "Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Persetujuan permintaan beserta pembuatan enrollment, jadwal, dan invoice.",
      "UI web parent dan tenant.",
      "Notifikasi email atau chat.",
      "Penolakan dengan rekomendasi jadwal lain (issue terpisah)."
    ]
  }
}
```
