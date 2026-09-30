## Background / Problem

Owner menetapkan dua alur: parent dapat chat dengan admin tenant saat mengajukan jadwal private, dan pengajar dapat chat dengan parent terkait report student. Hak akses keduanya hanya dapat dibuktikan dari data academic, yang disediakan lewat endpoint internal (issue `academic-chat-context-internal-api`). Parent tidak dapat membaca report lewat API publik (academic `internal/usecase/report_usecase.go:62` hanya menyediakan `GetByIDForTenant`).

## Goal

Parent dan admin tenant dapat membuka percakapan untuk satu permintaan jadwal private, dan pengajar dapat membuka percakapan dengan parent untuk satu report. Hak akses diverifikasi dari academic.

## Requirements

- `POST /api/v1/chat/conversations` menerima `kind` `schedule_request` dan `report`, dengan `subject_id` berupa ID permintaan atau ID report. Chat-service memanggil endpoint internal academic dengan `X-Internal-Service-Credential` (env `ACADEMIC_SERVICE_URL` dan `INTERNAL_SERVICE_CREDENTIAL`).
- `schedule_request`: parent dapat membuat bila `parent_id` konteks sama dengan `user_id` token parent, dan anggota dengan `chat:manage` dapat membuat bila `tenant_id` konteks sama dengan tenant token. Percakapan terlihat oleh parent tersebut dan pemegang `chat:manage` di tenant itu.
- `report`: anggota dengan `report:read` di tenant report dapat membuat, sedangkan parent tidak dapat membuat. Percakapan terlihat oleh parent student (`parent_id` konteks) dan anggota tenant itu yang memiliki `report:read`.
- Snapshot konteks disimpan saat percakapan dibuat: `class_name`, `student_first_name`, `report_title` bila ada, dan nama tenant dari gRPC identity `GetTenantPublicInfo`. Dengan begitu daftar percakapan parent lintas tenant tetap informatif.
- Parent (token tanpa tenant) melihat semua percakapan miliknya lintas tenant di `GET /api/v1/chat/conversations`.
- Aturan visibilitas baru ditambahkan ke fungsi visibilitas yang sama dari issue `chat-service-core-api`. Visibilitas setelah pembuatan memakai kolom tersimpan, bukan panggilan ulang ke academic.
- Bila academic tidak tersedia atau menjawab 5xx, pembuatan percakapan gagal dengan 503 tersanitasi; percakapan yang sudah ada tetap dapat dibaca.

## Acceptance Criteria

- [ ] Parent pemilik permintaan membuat percakapan `schedule_request`, dan pemegang `chat:manage` di tenant itu dapat membalas.
- [ ] Parent lain, anggota tenant lain, dan anggota tanpa `chat:manage` tidak dapat membuat maupun melihat percakapan permintaan itu (404).
- [ ] Pengajar dengan `report:read` membuat percakapan `report`, parent student melihat dan membalasnya, sedangkan parent lain mendapat 404.
- [ ] Parent yang mencoba membuat percakapan `report` ditolak.
- [ ] ID permintaan atau report yang tidak ada ditolak 404.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran lintas tenant dan lintas parent, karena endpoint internal academic tidak memfilter tenant. Chat-service wajib membandingkan `tenant_id` dan `parent_id` konteks dengan token sebelum membuat percakapan.

Asumsi yang belum dikonfirmasi owner:
- percakapan permintaan jadwal boleh dibuka pada status apa pun, termasuk setelah ditolak atau dibatalkan;
- sisi tenant pada percakapan report adalah semua pemegang `report:read` di tenant, bukan hanya pembuat report.

Perbarui kelolakelas-docs `docs/api/chat.md`, `docs/components/chat-service.md`, dan `docs/reference/environment-variables.md`.

Relevant areas:

- `kelolakelas-chat-service/internal/usecase`
- `kelolakelas-chat-service/internal/repository`
- `kelolakelas-chat-service/pkg`
- `kelolakelas-identity-service/pkg/proto/tenant`

## Edge Cases

- Permintaan dibatalkan setelah percakapan dibuat; percakapan tetap bisa dipakai.
- Student dihapus setelah percakapan report dibuat; snapshot konteks tetap ditampilkan.
- Parent memiliki percakapan di beberapa tenant.
- Dua anggota tenant membuat percakapan yang sama secara bersamaan.

## Testing / Validation

- [ ] Unit test usecase untuk setiap kombinasi pemanggil, jenis percakapan, dan kepemilikan.
- [ ] Integration test PostgreSQL dengan academic palsu (`httptest`) untuk isolasi parent dan tenant, sebagai mitigasi kebocoran.
- [ ] Test bahwa kegagalan academic menghasilkan 503 tersanitasi.
- [ ] CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi.

## Out of Scope

- WebSocket (issue terpisah).
- Menampilkan isi report ke parent.
- Tombol di halaman permintaan jadwal atau report (issue web).

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "chat-service-conversation-contexts",
  "title": "Chat-service mendukung percakapan parent–admin tenant per permintaan jadwal private dan pengajar–parent per report",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "chat"
  ],
  "blockedByDraftKeys": [
    "chat-service-core-api",
    "academic-chat-context-internal-api"
  ],
  "body": {
    "backgroundProblem": "Owner menetapkan dua alur: parent dapat chat dengan admin tenant saat mengajukan jadwal private, dan pengajar dapat chat dengan parent terkait report student. Hak akses keduanya hanya dapat dibuktikan dari data academic, yang disediakan lewat endpoint internal (issue `academic-chat-context-internal-api`). Parent tidak dapat membaca report lewat API publik (academic `internal/usecase/report_usecase.go:62` hanya menyediakan `GetByIDForTenant`).",
    "goal": "Parent dan admin tenant dapat membuka percakapan untuk satu permintaan jadwal private, dan pengajar dapat membuka percakapan dengan parent untuk satu report. Hak akses diverifikasi dari academic.",
    "requirements": [
      "`POST /api/v1/chat/conversations` menerima `kind` `schedule_request` dan `report`, dengan `subject_id` berupa ID permintaan atau ID report. Chat-service memanggil endpoint internal academic dengan `X-Internal-Service-Credential` (env `ACADEMIC_SERVICE_URL` dan `INTERNAL_SERVICE_CREDENTIAL`).",
      "`schedule_request`: parent dapat membuat bila `parent_id` konteks sama dengan `user_id` token parent, dan anggota dengan `chat:manage` dapat membuat bila `tenant_id` konteks sama dengan tenant token. Percakapan terlihat oleh parent tersebut dan pemegang `chat:manage` di tenant itu.",
      "`report`: anggota dengan `report:read` di tenant report dapat membuat, sedangkan parent tidak dapat membuat. Percakapan terlihat oleh parent student (`parent_id` konteks) dan anggota tenant itu yang memiliki `report:read`.",
      "Snapshot konteks disimpan saat percakapan dibuat: `class_name`, `student_first_name`, `report_title` bila ada, dan nama tenant dari gRPC identity `GetTenantPublicInfo`. Dengan begitu daftar percakapan parent lintas tenant tetap informatif.",
      "Parent (token tanpa tenant) melihat semua percakapan miliknya lintas tenant di `GET /api/v1/chat/conversations`.",
      "Aturan visibilitas baru ditambahkan ke fungsi visibilitas yang sama dari issue `chat-service-core-api`. Visibilitas setelah pembuatan memakai kolom tersimpan, bukan panggilan ulang ke academic.",
      "Bila academic tidak tersedia atau menjawab 5xx, pembuatan percakapan gagal dengan 503 tersanitasi; percakapan yang sudah ada tetap dapat dibaca."
    ],
    "acceptanceCriteria": [
      "Parent pemilik permintaan membuat percakapan `schedule_request`, dan pemegang `chat:manage` di tenant itu dapat membalas.",
      "Parent lain, anggota tenant lain, dan anggota tanpa `chat:manage` tidak dapat membuat maupun melihat percakapan permintaan itu (404).",
      "Pengajar dengan `report:read` membuat percakapan `report`, parent student melihat dan membalasnya, sedangkan parent lain mendapat 404.",
      "Parent yang mencoba membuat percakapan `report` ditolak.",
      "ID permintaan atau report yang tidak ada ditolak 404.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran lintas tenant dan lintas parent, karena endpoint internal academic tidak memfilter tenant. Chat-service wajib membandingkan `tenant_id` dan `parent_id` konteks dengan token sebelum membuat percakapan.\n\nAsumsi yang belum dikonfirmasi owner:\n- percakapan permintaan jadwal boleh dibuka pada status apa pun, termasuk setelah ditolak atau dibatalkan;\n- sisi tenant pada percakapan report adalah semua pemegang `report:read` di tenant, bukan hanya pembuat report.\n\nPerbarui kelolakelas-docs `docs/api/chat.md`, `docs/components/chat-service.md`, dan `docs/reference/environment-variables.md`.",
    "relevantAreas": [
      "kelolakelas-chat-service/internal/usecase",
      "kelolakelas-chat-service/internal/repository",
      "kelolakelas-chat-service/pkg",
      "kelolakelas-identity-service/pkg/proto/tenant"
    ],
    "edgeCases": [
      "Permintaan dibatalkan setelah percakapan dibuat; percakapan tetap bisa dipakai.",
      "Student dihapus setelah percakapan report dibuat; snapshot konteks tetap ditampilkan.",
      "Parent memiliki percakapan di beberapa tenant.",
      "Dua anggota tenant membuat percakapan yang sama secara bersamaan."
    ],
    "testingValidation": [
      "Unit test usecase untuk setiap kombinasi pemanggil, jenis percakapan, dan kepemilikan.",
      "Integration test PostgreSQL dengan academic palsu (`httptest`) untuk isolasi parent dan tenant, sebagai mitigasi kebocoran.",
      "Test bahwa kegagalan academic menghasilkan 503 tersanitasi.",
      "CI `gate` pass (`gofmt`, `go vet`, `go test -race`, build, govulncheck), existing tests pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "WebSocket (issue terpisah).",
      "Menampilkan isi report ke parent.",
      "Tombol di halaman permintaan jadwal atau report (issue web)."
    ]
  },
  "labels": [
    "chat",
    "ai-ready"
  ]
}
```
