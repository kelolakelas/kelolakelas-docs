## Background / Problem

Chat membutuhkan cara menentukan siapa admin tenant yang menangani percakapan dengan parent dan pengajar. Katalog permission disimpan di tabel `permissions` dengan `name` unik (`migrations/00000000000000_init_schema.up.sql:29-30`) dan diisi oleh `seeders/000001_default_permissions_and_roles.sql`. Role sistem `Creator` hanya mendapat semua permission saat seed dijalankan (`seeders/000001_default_permissions_and_roles.sql:65-70`), sehingga permission baru tidak otomatis dimiliki tenant yang sudah ada. Role `Teacher` hanya memiliki permission `schedule`, `attendance`, `student_note`, dan `report` (`:72-79`).

## Goal

Permission `chat:manage` tersedia di semua lingkungan, dimiliki role sistem `Creator`, dan dapat diberikan ke role kustom lewat editor role yang sudah ada.

## Requirements

- Migration identity baru menambahkan permission `chat:manage` dengan deskripsi Bahasa Indonesia (mis. "Menangani chat tenant dengan parent dan pengajar") secara idempoten (`ON CONFLICT (name) DO NOTHING`).
- Migration yang sama memberikan `chat:manage` ke role sistem `Creator` (`tenant_id IS NULL`) secara idempoten, dan tidak memberikannya ke `Teacher`.
- Seeder default diperbarui sehingga database baru mendapat permission dan grant yang sama.
- Down migration menghapus grant `chat:manage`, lalu permission-nya.
- `CheckPermission` gRPC (`internal/delivery/grpc/permission_service.go:88`) menjawab `chat:manage` hanya dari data, tanpa perubahan kode.

## Acceptance Criteria

- [ ] Setelah migrate up, `GET /api/v1/permissions` memuat `chat:manage`.
- [ ] Anggota dengan role `Creator` mendapat `true` dari `CheckPermission` untuk `chat:manage`, sedangkan anggota dengan role `Teacher` mendapat `false`.
- [ ] Menjalankan migrate up dua kali, atau seed setelah migrate, tidak menghasilkan duplikat.
- [ ] Migrate down lalu up kembali berhasil.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Nama `chat:manage` dipakai chat-service (issue `chat-service-core-api`) untuk menentukan admin tenant, jadi jangan diganti tanpa memperbarui issue itu. Ikuti pola migration terbaru (`migrations/000013_platform_fee_policy.*.sql`). Permission baru otomatis tampil di editor role karena katalog dibaca dari database (`internal/repository/rbac_repository.go:22`, `GET /api/v1/permissions`). Asumsi yang belum dikonfirmasi owner: admin tenant adalah pemegang `chat:manage`, dan owner dapat memberikannya ke role kustom lewat editor role. Perbarui kelolakelas-docs `docs/data/identity-schema.md` dan daftar permission di `docs/05-security.md` bila ada.

Relevant areas:

- `kelolakelas-identity-service/migrations`
- `kelolakelas-identity-service/seeders/000001_default_permissions_and_roles.sql`
- `kelolakelas-identity-service/internal/delivery/grpc/permission_service.go`
- `kelolakelas-identity-service/internal/repository/rbac_repository.go`

## Edge Cases

- Database yang sudah memiliki permission `chat:manage` dari seed manual.
- Role `Creator` belum ada karena database belum diseed.
- Role kustom tenant yang meniru `Creator` tidak otomatis mendapat permission baru.

## Testing / Validation

- [ ] Test migration di PostgreSQL untuk up, up ulang, down, dan grant yang hanya ke `Creator`. Bila repo belum punya pola test migration, verifikasi manual di PostgreSQL lokal dan catat hasilnya di PR.
- [ ] Test `CheckPermission` untuk `Creator` dan `Teacher`.
- [ ] Existing tests pass, `gofmt`/`go vet` pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Pemakaian permission di service lain.
- UI khusus di luar editor role yang sudah ada.
- Memberikan permission ke role kustom yang sudah ada.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "chat-manage-permission",
  "title": "Identity menyediakan permission tenant `chat:manage` untuk admin yang menangani chat",
  "estimate": "S",
  "complexity": "medium",
  "repositories": [
    "identity"
  ],
  "blockedByDraftKeys": [],
  "body": {
    "backgroundProblem": "Chat membutuhkan cara menentukan siapa admin tenant yang menangani percakapan dengan parent dan pengajar. Katalog permission disimpan di tabel `permissions` dengan `name` unik (`migrations/00000000000000_init_schema.up.sql:29-30`) dan diisi oleh `seeders/000001_default_permissions_and_roles.sql`. Role sistem `Creator` hanya mendapat semua permission saat seed dijalankan (`seeders/000001_default_permissions_and_roles.sql:65-70`), sehingga permission baru tidak otomatis dimiliki tenant yang sudah ada. Role `Teacher` hanya memiliki permission `schedule`, `attendance`, `student_note`, dan `report` (`:72-79`).",
    "goal": "Permission `chat:manage` tersedia di semua lingkungan, dimiliki role sistem `Creator`, dan dapat diberikan ke role kustom lewat editor role yang sudah ada.",
    "requirements": [
      "Migration identity baru menambahkan permission `chat:manage` dengan deskripsi Bahasa Indonesia (mis. \"Menangani chat tenant dengan parent dan pengajar\") secara idempoten (`ON CONFLICT (name) DO NOTHING`).",
      "Migration yang sama memberikan `chat:manage` ke role sistem `Creator` (`tenant_id IS NULL`) secara idempoten, dan tidak memberikannya ke `Teacher`.",
      "Seeder default diperbarui sehingga database baru mendapat permission dan grant yang sama.",
      "Down migration menghapus grant `chat:manage`, lalu permission-nya.",
      "`CheckPermission` gRPC (`internal/delivery/grpc/permission_service.go:88`) menjawab `chat:manage` hanya dari data, tanpa perubahan kode."
    ],
    "acceptanceCriteria": [
      "Setelah migrate up, `GET /api/v1/permissions` memuat `chat:manage`.",
      "Anggota dengan role `Creator` mendapat `true` dari `CheckPermission` untuk `chat:manage`, sedangkan anggota dengan role `Teacher` mendapat `false`.",
      "Menjalankan migrate up dua kali, atau seed setelah migrate, tidak menghasilkan duplikat.",
      "Migrate down lalu up kembali berhasil.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Nama `chat:manage` dipakai chat-service (issue `chat-service-core-api`) untuk menentukan admin tenant, jadi jangan diganti tanpa memperbarui issue itu. Ikuti pola migration terbaru (`migrations/000013_platform_fee_policy.*.sql`). Permission baru otomatis tampil di editor role karena katalog dibaca dari database (`internal/repository/rbac_repository.go:22`, `GET /api/v1/permissions`). Asumsi yang belum dikonfirmasi owner: admin tenant adalah pemegang `chat:manage`, dan owner dapat memberikannya ke role kustom lewat editor role. Perbarui kelolakelas-docs `docs/data/identity-schema.md` dan daftar permission di `docs/05-security.md` bila ada.",
    "relevantAreas": [
      "kelolakelas-identity-service/migrations",
      "kelolakelas-identity-service/seeders/000001_default_permissions_and_roles.sql",
      "kelolakelas-identity-service/internal/delivery/grpc/permission_service.go",
      "kelolakelas-identity-service/internal/repository/rbac_repository.go"
    ],
    "edgeCases": [
      "Database yang sudah memiliki permission `chat:manage` dari seed manual.",
      "Role `Creator` belum ada karena database belum diseed.",
      "Role kustom tenant yang meniru `Creator` tidak otomatis mendapat permission baru."
    ],
    "testingValidation": [
      "Test migration di PostgreSQL untuk up, up ulang, down, dan grant yang hanya ke `Creator`. Bila repo belum punya pola test migration, verifikasi manual di PostgreSQL lokal dan catat hasilnya di PR.",
      "Test `CheckPermission` untuk `Creator` dan `Teacher`.",
      "Existing tests pass, `gofmt`/`go vet` pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Pemakaian permission di service lain.",
      "UI khusus di luar editor role yang sudah ada.",
      "Memberikan permission ke role kustom yang sudah ada."
    ]
  },
  "labels": [
    "identity",
    "ai-ready"
  ]
}
```
