## Background / Problem

`GET /sessions`, `/sessions/:id`, dan `/sessions/:id/attendees` hanya di-scope tenant tanpa permission (`cmd/server/routes.go:93,94,100`). Filter `tutor_id` ada (`internal/delivery/http/handler/session_handler.go:37`) tetapi tidak diturunkan dari JWT. Tutor pengganti hanya menimpa `tutor_id` tanpa memeriksa bahwa ia anggota aktif tenant (`internal/usecase/schedule_usecase.go:473-506`). Update dan delete laporan tidak memeriksa pengajar (`internal/usecase/report_usecase.go:65-85`), berbeda dengan create yang memeriksa `class_teachers` (`internal/repository/enrollment_repository.go:227-231`). Identity hanya mengekspos gRPC ValidateTenantStatus, GetTenantPublicInfo, dan CheckPermission yang membutuhkan roleID (`kelolakelas-identity-service/internal/delivery/grpc/permission_service.go:88`).

## Goal

Pengajar dapat meminta daftar sesinya sendiri, dan akses baca sesi, penugasan tutor pengganti, serta perubahan laporan mengikuti aturan permission dan penugasan yang konsisten.

## Requirements

- Endpoint baca sesi mewajibkan permission `schedule:read` untuk anggota tenant.
- Sediakan filter sesi milik pemanggil yang diturunkan dari `member_id` JWT, bukan dari input klien.
- Tutor pengganti hanya dapat ditugaskan kepada anggota aktif tenant yang sama; identity menyediakan pemeriksaan keanggotaan aktif lewat gRPC internal.
- Update dan delete laporan menerapkan aturan penugasan pengajar yang sama dengan create laporan.
- Perilaku token parent tidak diubah pada issue ini.

## Acceptance Criteria

- [ ] Anggota tanpa `schedule:read` ditolak 403 pada endpoint baca sesi; Creator dan Teacher tetap dapat membaca.
- [ ] Filter sesi milik sendiri hanya mengembalikan sesi dengan `tutor_id` pemanggil.
- [ ] Penugasan tutor pengganti ke member tenant lain, member nonaktif, atau ID acak ditolak dengan error validasi.
- [ ] Pengajar yang tidak mengajar kelas terkait tidak dapat mengubah atau menghapus laporan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: pengetatan guard dapat memblokir role kustom tenant yang sebelumnya bisa membaca sesi, dan cek keanggotaan lintas service menambah titik gagal. Mitigasi: tolak secara fail-closed bila identity tidak tersedia untuk mutasi tutor pengganti, dan dokumentasikan permission baru yang diwajibkan untuk role kustom. Ikuti pola gRPC identity yang ada (TenantService/PermissionService dengan struct atau proto yang sudah dipakai academic di `pkg/proto/tenant`); keanggotaan aktif mengikuti ADR 0034. Tambahkan `@x-permission` dan perbarui swagger. Perbarui `kelolakelas-docs` (api/academic.md, components/identity-service.md, ADR bila kontrak gRPC baru) serta baris usang di `08-known-gaps-and-risks.md` tentang attendance/report tanpa permission.

Relevant areas:

- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/session_handler.go`
- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/usecase/report_usecase.go`
- `kelolakelas-academic-service/pkg/grpcclient`
- `kelolakelas-identity-service/internal/delivery/grpc`

## Edge Cases

- Pengajar yang juga Creator.
- Anggota tanpa member_id pada token lama.
- Identity gRPC tidak tersedia saat menugaskan tutor pengganti.
- Laporan untuk enrollment yang kelasnya sudah tidak diajar pengajar tersebut.

## Testing / Validation

- [ ] Unit test academic untuk setiap guard, filter sesi milik sendiri, dan jalur fail-closed identity.
- [ ] Unit test gRPC identity untuk anggota aktif, nonaktif, dan lintas tenant sebagai mitigasi risiko akses lintas tenant.
- [ ] Swagger contract test, go vet, go test -race, dan build lulus di kedua repo.
- [ ] Acceptance criteria diverifikasi dengan token Creator, Teacher, dan role kustom.

## Out of Scope

- Akses parent ke sesi dan laporan.
- Layar web sesi dan laporan.
- Perubahan role sistem.

## AI Orchestrator Contract

```json
{
  "draftKey": "tutor-session-scope-guards",
  "projectKey": "tutor-session-operations",
  "title": "Pengajar melihat sesinya sendiri dan akses sesi, tutor pengganti, serta laporan dijaga konsisten",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "identity"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`GET /sessions`, `/sessions/:id`, dan `/sessions/:id/attendees` hanya di-scope tenant tanpa permission (`cmd/server/routes.go:93,94,100`). Filter `tutor_id` ada (`internal/delivery/http/handler/session_handler.go:37`) tetapi tidak diturunkan dari JWT. Tutor pengganti hanya menimpa `tutor_id` tanpa memeriksa bahwa ia anggota aktif tenant (`internal/usecase/schedule_usecase.go:473-506`). Update dan delete laporan tidak memeriksa pengajar (`internal/usecase/report_usecase.go:65-85`), berbeda dengan create yang memeriksa `class_teachers` (`internal/repository/enrollment_repository.go:227-231`). Identity hanya mengekspos gRPC ValidateTenantStatus, GetTenantPublicInfo, dan CheckPermission yang membutuhkan roleID (`kelolakelas-identity-service/internal/delivery/grpc/permission_service.go:88`).",
    "goal": "Pengajar dapat meminta daftar sesinya sendiri, dan akses baca sesi, penugasan tutor pengganti, serta perubahan laporan mengikuti aturan permission dan penugasan yang konsisten.",
    "requirements": [
      "Endpoint baca sesi mewajibkan permission `schedule:read` untuk anggota tenant.",
      "Sediakan filter sesi milik pemanggil yang diturunkan dari `member_id` JWT, bukan dari input klien.",
      "Tutor pengganti hanya dapat ditugaskan kepada anggota aktif tenant yang sama; identity menyediakan pemeriksaan keanggotaan aktif lewat gRPC internal.",
      "Update dan delete laporan menerapkan aturan penugasan pengajar yang sama dengan create laporan.",
      "Perilaku token parent tidak diubah pada issue ini."
    ],
    "acceptanceCriteria": [
      "Anggota tanpa `schedule:read` ditolak 403 pada endpoint baca sesi; Creator dan Teacher tetap dapat membaca.",
      "Filter sesi milik sendiri hanya mengembalikan sesi dengan `tutor_id` pemanggil.",
      "Penugasan tutor pengganti ke member tenant lain, member nonaktif, atau ID acak ditolak dengan error validasi.",
      "Pengajar yang tidak mengajar kelas terkait tidak dapat mengubah atau menghapus laporan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: pengetatan guard dapat memblokir role kustom tenant yang sebelumnya bisa membaca sesi, dan cek keanggotaan lintas service menambah titik gagal. Mitigasi: tolak secara fail-closed bila identity tidak tersedia untuk mutasi tutor pengganti, dan dokumentasikan permission baru yang diwajibkan untuk role kustom. Ikuti pola gRPC identity yang ada (TenantService/PermissionService dengan struct atau proto yang sudah dipakai academic di `pkg/proto/tenant`); keanggotaan aktif mengikuti ADR 0034. Tambahkan `@x-permission` dan perbarui swagger. Perbarui `kelolakelas-docs` (api/academic.md, components/identity-service.md, ADR bila kontrak gRPC baru) serta baris usang di `08-known-gaps-and-risks.md` tentang attendance/report tanpa permission.",
    "relevantAreas": [
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/session_handler.go",
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/usecase/report_usecase.go",
      "kelolakelas-academic-service/pkg/grpcclient",
      "kelolakelas-identity-service/internal/delivery/grpc"
    ],
    "edgeCases": [
      "Pengajar yang juga Creator.",
      "Anggota tanpa member_id pada token lama.",
      "Identity gRPC tidak tersedia saat menugaskan tutor pengganti.",
      "Laporan untuk enrollment yang kelasnya sudah tidak diajar pengajar tersebut."
    ],
    "testingValidation": [
      "Unit test academic untuk setiap guard, filter sesi milik sendiri, dan jalur fail-closed identity.",
      "Unit test gRPC identity untuk anggota aktif, nonaktif, dan lintas tenant sebagai mitigasi risiko akses lintas tenant.",
      "Swagger contract test, go vet, go test -race, dan build lulus di kedua repo.",
      "Acceptance criteria diverifikasi dengan token Creator, Teacher, dan role kustom."
    ],
    "outOfScope": [
      "Akses parent ke sesi dan laporan.",
      "Layar web sesi dan laporan.",
      "Perubahan role sistem."
    ]
  }
}
```
