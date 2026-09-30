## Background / Problem

Chat-service harus memastikan parent hanya membuka percakapan untuk permintaan jadwal miliknya, dan pengajar hanya membuka percakapan report di tenant-nya. Datanya hanya ada di academic:
- permintaan jadwal private (`internal/domain/private_schedule_request.go`: `tenant_id`, `parent_id`, `class_id`, `student_id`, `status`);
- report (`internal/domain/report.go`: `TenantID`, `EnrollmentID`, `ReporterID`);
- relasi enrollment ke student (`internal/domain/enrollment.go:54`) dan pemilik student (`internal/domain/student.go:22` `ParentID`).

Endpoint publik report hanya untuk anggota tenant (`cmd/server/attendance_report_routes.go:17-21`). Academic sudah memiliki grup internal ber-`InternalServiceAuth` (`cmd/server/routes.go:99-102`, header `X-Internal-Service-Credential`).

## Goal

Chat-service dapat mengambil konteks minimal satu permintaan jadwal private atau satu report lewat endpoint internal yang dilindungi credential, tanpa membuka data tersebut ke publik.

## Requirements

- `GET /internal/chat-context/schedule-requests/:id` mengembalikan `id`, `tenant_id`, `parent_id`, `class_id`, `class_name`, `student_id`, `student_first_name`, dan `status`.
- `GET /internal/chat-context/reports/:id` mengembalikan `id`, `tenant_id`, `enrollment_id`, `student_id`, `student_first_name`, `parent_id`, `class_name`, `title`, dan `reporter_id`.
- Kedua endpoint hanya terdaftar di grup `/internal` dengan `InternalServiceAuth`, dan tidak ada route gateway baru.
- ID tidak valid dijawab 400. Resource yang tidak ada atau sudah soft-deleted (termasuk report yang student-nya soft-deleted) dijawab 404 dengan envelope standar.
- Response tidak memuat field lain: tanpa catatan parent, email parent, skor, atau isi evaluasi report.

## Acceptance Criteria

- [ ] Request tanpa credential atau dengan credential salah ditolak 401 tanpa menyentuh database.
- [ ] Dengan credential benar, kedua endpoint mengembalikan konteks yang sesuai untuk permintaan jadwal dan report yang ada.
- [ ] Resource yang sudah soft-deleted dijawab 404.
- [ ] Perilaku endpoint publik report dan permintaan jadwal tidak berubah.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran data lintas tenant, karena endpoint internal ini tidak memfilter tenant. Chat-service wajib membandingkan `tenant_id` dan `parent_id` dengan token pemanggil (diatur di issue `chat-service-conversation-contexts`). Mitigasi di sisi academic adalah payload minimal dan credential wajib. Ikuti pola `ActivateInternal` (`internal/delivery/http/handler/enrollment_handler.go:390`). Nama field dan path di atas adalah kontrak untuk chat-service. Perbarui kelolakelas-docs `docs/api/academic.md` (bagian internal) dan `docs/api/endpoint-matrix.md`.

Relevant areas:

- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-academic-service/internal/delivery/http/handler`
- `kelolakelas-academic-service/internal/delivery/http/middleware/auth_middleware.go`
- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-academic-service/internal/usecase/report_usecase.go`
- `kelolakelas-academic-service/internal/repository`

## Edge Cases

- Permintaan jadwal berstatus `cancelled` atau `rejected` tetap dikembalikan beserta statusnya.
- UUID valid tetapi milik jenis resource lain, misalnya ID report di endpoint schedule-request, dijawab 404.
- Kelas terkait sudah di-unpublish; `class_name` tetap dikembalikan.

## Testing / Validation

- [ ] Handler test kedua endpoint untuk 401 (tanpa credential dan credential salah), 400, 404, dan 200.
- [ ] Test bahwa response hanya memuat field yang ditentukan, sebagai mitigasi kebocoran data.
- [ ] Route test bahwa kedua endpoint tidak terdaftar di luar `/internal`.
- [ ] Existing tests pass, `gofmt`/`go vet`/`go test -race` pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Perubahan endpoint publik report atau permintaan jadwal.
- Akses parent ke isi report.
- Route gateway.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "academic-chat-context-internal-api",
  "title": "Academic menyediakan konteks permintaan jadwal private dan report untuk chat-service melalui endpoint internal",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "body": {
    "backgroundProblem": "Chat-service harus memastikan parent hanya membuka percakapan untuk permintaan jadwal miliknya, dan pengajar hanya membuka percakapan report di tenant-nya. Datanya hanya ada di academic:\n- permintaan jadwal private (`internal/domain/private_schedule_request.go`: `tenant_id`, `parent_id`, `class_id`, `student_id`, `status`);\n- report (`internal/domain/report.go`: `TenantID`, `EnrollmentID`, `ReporterID`);\n- relasi enrollment ke student (`internal/domain/enrollment.go:54`) dan pemilik student (`internal/domain/student.go:22` `ParentID`).\n\nEndpoint publik report hanya untuk anggota tenant (`cmd/server/attendance_report_routes.go:17-21`). Academic sudah memiliki grup internal ber-`InternalServiceAuth` (`cmd/server/routes.go:99-102`, header `X-Internal-Service-Credential`).",
    "goal": "Chat-service dapat mengambil konteks minimal satu permintaan jadwal private atau satu report lewat endpoint internal yang dilindungi credential, tanpa membuka data tersebut ke publik.",
    "requirements": [
      "`GET /internal/chat-context/schedule-requests/:id` mengembalikan `id`, `tenant_id`, `parent_id`, `class_id`, `class_name`, `student_id`, `student_first_name`, dan `status`.",
      "`GET /internal/chat-context/reports/:id` mengembalikan `id`, `tenant_id`, `enrollment_id`, `student_id`, `student_first_name`, `parent_id`, `class_name`, `title`, dan `reporter_id`.",
      "Kedua endpoint hanya terdaftar di grup `/internal` dengan `InternalServiceAuth`, dan tidak ada route gateway baru.",
      "ID tidak valid dijawab 400. Resource yang tidak ada atau sudah soft-deleted (termasuk report yang student-nya soft-deleted) dijawab 404 dengan envelope standar.",
      "Response tidak memuat field lain: tanpa catatan parent, email parent, skor, atau isi evaluasi report."
    ],
    "acceptanceCriteria": [
      "Request tanpa credential atau dengan credential salah ditolak 401 tanpa menyentuh database.",
      "Dengan credential benar, kedua endpoint mengembalikan konteks yang sesuai untuk permintaan jadwal dan report yang ada.",
      "Resource yang sudah soft-deleted dijawab 404.",
      "Perilaku endpoint publik report dan permintaan jadwal tidak berubah.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran data lintas tenant, karena endpoint internal ini tidak memfilter tenant. Chat-service wajib membandingkan `tenant_id` dan `parent_id` dengan token pemanggil (diatur di issue `chat-service-conversation-contexts`). Mitigasi di sisi academic adalah payload minimal dan credential wajib. Ikuti pola `ActivateInternal` (`internal/delivery/http/handler/enrollment_handler.go:390`). Nama field dan path di atas adalah kontrak untuk chat-service. Perbarui kelolakelas-docs `docs/api/academic.md` (bagian internal) dan `docs/api/endpoint-matrix.md`.",
    "relevantAreas": [
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-academic-service/internal/delivery/http/handler",
      "kelolakelas-academic-service/internal/delivery/http/middleware/auth_middleware.go",
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-academic-service/internal/usecase/report_usecase.go",
      "kelolakelas-academic-service/internal/repository"
    ],
    "edgeCases": [
      "Permintaan jadwal berstatus `cancelled` atau `rejected` tetap dikembalikan beserta statusnya.",
      "UUID valid tetapi milik jenis resource lain, misalnya ID report di endpoint schedule-request, dijawab 404.",
      "Kelas terkait sudah di-unpublish; `class_name` tetap dikembalikan."
    ],
    "testingValidation": [
      "Handler test kedua endpoint untuk 401 (tanpa credential dan credential salah), 400, 404, dan 200.",
      "Test bahwa response hanya memuat field yang ditentukan, sebagai mitigasi kebocoran data.",
      "Route test bahwa kedua endpoint tidak terdaftar di luar `/internal`.",
      "Existing tests pass, `gofmt`/`go vet`/`go test -race` pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Perubahan endpoint publik report atau permintaan jadwal.",
      "Akses parent ke isi report.",
      "Route gateway."
    ]
  },
  "labels": [
    "academic",
    "ai-ready"
  ]
}
```
