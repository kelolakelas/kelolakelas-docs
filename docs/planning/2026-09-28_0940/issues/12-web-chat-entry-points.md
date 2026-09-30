## Background / Problem

Owner menginginkan parent dapat chat dengan admin tenant saat mengajukan jadwal private, dan pengajar dapat chat dengan parent terkait report student. Halaman status permintaan untuk parent dan halaman tinjauan untuk tenant dibangun di KEL-109 dan KEL-110. Web belum memiliki halaman report, tetapi daftar report sudah tersedia lewat `GET /api/v1/reports` untuk anggota dengan `report:read` (academic `cmd/server/attendance_report_routes.go:17`, route gateway `/reports`).

## Goal

Chat untuk permintaan jadwal private dan report dapat dimulai langsung dari konteksnya, dan membuka percakapan yang sama bila sudah ada.

## Requirements

- Di halaman permintaan jadwal private parent (KEL-109), setiap permintaan memiliki tombol "Chat dengan tenant". Tombol ini membuat atau membuka percakapan `schedule_request`, lalu menuju percakapan tersebut.
- Di halaman tinjauan permintaan tenant (KEL-110), pemegang `chat:manage` mendapat tombol "Chat dengan parent" dengan perilaku yang sama.
- Di halaman chat tenant, anggota dengan `report:read` dapat memilih report (dari `GET /api/v1/reports`, dengan pencarian dan paginasi), lalu memulai percakapan `report` dengan parent student.
- Bila pengguna tidak berhak (chat-service menjawab 403/404), tombol disembunyikan atau pesan yang jelas ditampilkan.

## Acceptance Criteria

- [ ] Parent menekan "Chat dengan tenant" pada permintaan miliknya dan masuk ke percakapan permintaan itu. Menekan lagi membuka percakapan yang sama.
- [ ] Admin tenant memulai chat dari permintaan yang sama dan masuk ke percakapan yang sama dengan parent.
- [ ] Pengajar memilih report dan memulai percakapan, lalu parent student melihatnya di daftar chat parent.
- [ ] Anggota tanpa `report:read` tidak melihat pemilih report.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Issue ini bergantung pada halaman yang dibuat KEL-109 dan KEL-110; ikuti struktur file yang ada di `main` saat dikerjakan. Pemeriksaan hak akses di UI hanya kosmetik, karena chat-service tetap menjadi penegaknya. Asumsi yang belum dikonfirmasi owner: chat permintaan jadwal tersedia setelah permintaan terkirim (butuh ID permintaan), bukan di dalam form sebelum submit. Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant`

## Edge Cases

- Permintaan sudah dibatalkan atau ditolak; tombol tetap tersedia.
- Report yang student-nya sudah dihapus; tampilkan pesan yang jelas.
- Chat-service menjawab 503; tampilkan pesan untuk mencoba lagi.

## Testing / Validation

- [ ] Test komponen tombol untuk get-or-create dan navigasi.
- [ ] Test pemilih report untuk paginasi, daftar kosong, dan error izin.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Halaman report lengkap untuk tenant.
- Menampilkan isi report ke parent.
- Perubahan API.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "web-chat-entry-points",
  "title": "Parent, admin tenant, dan pengajar dapat memulai chat dari permintaan jadwal private dan dari report student",
  "estimate": "M",
  "complexity": "medium",
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "web-chat-inbox-realtime",
    "parent-private-schedule-request-web",
    "tenant-private-schedule-review-web"
  ],
  "body": {
    "backgroundProblem": "Owner menginginkan parent dapat chat dengan admin tenant saat mengajukan jadwal private, dan pengajar dapat chat dengan parent terkait report student. Halaman status permintaan untuk parent dan halaman tinjauan untuk tenant dibangun di KEL-109 dan KEL-110. Web belum memiliki halaman report, tetapi daftar report sudah tersedia lewat `GET /api/v1/reports` untuk anggota dengan `report:read` (academic `cmd/server/attendance_report_routes.go:17`, route gateway `/reports`).",
    "goal": "Chat untuk permintaan jadwal private dan report dapat dimulai langsung dari konteksnya, dan membuka percakapan yang sama bila sudah ada.",
    "requirements": [
      "Di halaman permintaan jadwal private parent (KEL-109), setiap permintaan memiliki tombol \"Chat dengan tenant\". Tombol ini membuat atau membuka percakapan `schedule_request`, lalu menuju percakapan tersebut.",
      "Di halaman tinjauan permintaan tenant (KEL-110), pemegang `chat:manage` mendapat tombol \"Chat dengan parent\" dengan perilaku yang sama.",
      "Di halaman chat tenant, anggota dengan `report:read` dapat memilih report (dari `GET /api/v1/reports`, dengan pencarian dan paginasi), lalu memulai percakapan `report` dengan parent student.",
      "Bila pengguna tidak berhak (chat-service menjawab 403/404), tombol disembunyikan atau pesan yang jelas ditampilkan."
    ],
    "acceptanceCriteria": [
      "Parent menekan \"Chat dengan tenant\" pada permintaan miliknya dan masuk ke percakapan permintaan itu. Menekan lagi membuka percakapan yang sama.",
      "Admin tenant memulai chat dari permintaan yang sama dan masuk ke percakapan yang sama dengan parent.",
      "Pengajar memilih report dan memulai percakapan, lalu parent student melihatnya di daftar chat parent.",
      "Anggota tanpa `report:read` tidak melihat pemilih report.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Issue ini bergantung pada halaman yang dibuat KEL-109 dan KEL-110; ikuti struktur file yang ada di `main` saat dikerjakan. Pemeriksaan hak akses di UI hanya kosmetik, karena chat-service tetap menjadi penegaknya. Asumsi yang belum dikonfirmasi owner: chat permintaan jadwal tersedia setelah permintaan terkirim (butuh ID permintaan), bukan di dalam form sebelum submit. Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant"
    ],
    "edgeCases": [
      "Permintaan sudah dibatalkan atau ditolak; tombol tetap tersedia.",
      "Report yang student-nya sudah dihapus; tampilkan pesan yang jelas.",
      "Chat-service menjawab 503; tampilkan pesan untuk mencoba lagi."
    ],
    "testingValidation": [
      "Test komponen tombol untuk get-or-create dan navigasi.",
      "Test pemilih report untuk paginasi, daftar kosong, dan error izin.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Halaman report lengkap untuk tenant.",
      "Menampilkan isi report ke parent.",
      "Perubahan API."
    ]
  },
  "labels": [
    "web",
    "ai-ready"
  ]
}
```
