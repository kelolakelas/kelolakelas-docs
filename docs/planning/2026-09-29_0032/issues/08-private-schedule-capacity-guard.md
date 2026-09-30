## Background / Problem

`Class.Capacity` sudah deprecated (`domain/class.go:37`); kapasitas jadwal masih diteruskan dari `ScheduleItemRequest.Capacity` (`schedule_usecase.go:218-231`) tanpa aturan pembeda private/group. KEL-113 hanya menghapus input kapasitas di form kelas.

## Goal

Jadwal private baru konsisten dengan satu student per enrollment tanpa mengubah data kelas group.

## Requirements

- Verifikasi seluruh pembuat jadwal private (request approval/recommendation, mutasi jadwal, internal) dan tentukan invariant kapasitas satu student pada boundary academic yang relevan.
- Tolak input kapasitas private di luar invariant dengan respons validasi stabil; jangan menerima nilai >1 hanya karena UI menyembunyikannya.
- Pertahankan jadwal group dan data private lama; audit baris historis sebelum migration atau enforcement yang dapat memutus pembacaan.

## Acceptance Criteria

- [ ] Jadwal private baru tidak dapat menyimpan kapasitas lebih dari satu, termasuk lewat API langsung.
- [ ] Jadwal group tetap menerima kapasitas valid lebih dari satu, dan approval private existing tetap membuat jadwal.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: enforcement yang salah memutus approval private atau merusak data historis. Repo memiliki `ErrPrivateSchedulesNotAllowed` yang tidak dipakai (`class_creation_usecase.go:15`); jangan menyamakan jenis class dengan enrollment ownership. Tinjau migration dan query kapasitas sebelum perubahan; tidak boleh overwrite data lama tanpa rencana recovery. Perbarui docs academic/security dan jelaskan keputusan rollout.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-academic-service/internal/domain/schedule_dto.go`
- `kelolakelas-academic-service/internal/repository/schedule_repository.go`

## Edge Cases

- Baris private historis kapasitas >1.
- Mutasi jadwal sesudah enrollment aktif.
- Dua approval konkuren pada kelas private yang sama.

## Testing / Validation

- [ ] Integration test private create/approval/recommendation, group >1, dan foreign-tenant resource.
- [ ] Uji data lama pada database fixture dengan capacity >1 tanpa destructive migration, go test -race, go vet dan build.

## Out of Scope

- Migrasi destruktif kapasitas lama tanpa audit.
- Menghapus input kapasitas per jadwal group.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-schedule-capacity-guard",
  "projectKey": null,
  "title": "Academic menolak kapasitas jadwal private yang tidak sesuai satu student",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "academic"
  ],
  "labels": [
    "academic",
    "ai-ready"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`Class.Capacity` sudah deprecated (`domain/class.go:37`); kapasitas jadwal masih diteruskan dari `ScheduleItemRequest.Capacity` (`schedule_usecase.go:218-231`) tanpa aturan pembeda private/group. KEL-113 hanya menghapus input kapasitas di form kelas.",
    "goal": "Jadwal private baru konsisten dengan satu student per enrollment tanpa mengubah data kelas group.",
    "requirements": [
      "Verifikasi seluruh pembuat jadwal private (request approval/recommendation, mutasi jadwal, internal) dan tentukan invariant kapasitas satu student pada boundary academic yang relevan.",
      "Tolak input kapasitas private di luar invariant dengan respons validasi stabil; jangan menerima nilai >1 hanya karena UI menyembunyikannya.",
      "Pertahankan jadwal group dan data private lama; audit baris historis sebelum migration atau enforcement yang dapat memutus pembacaan."
    ],
    "acceptanceCriteria": [
      "Jadwal private baru tidak dapat menyimpan kapasitas lebih dari satu, termasuk lewat API langsung.",
      "Jadwal group tetap menerima kapasitas valid lebih dari satu, dan approval private existing tetap membuat jadwal.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: enforcement yang salah memutus approval private atau merusak data historis. Repo memiliki `ErrPrivateSchedulesNotAllowed` yang tidak dipakai (`class_creation_usecase.go:15`); jangan menyamakan jenis class dengan enrollment ownership. Tinjau migration dan query kapasitas sebelum perubahan; tidak boleh overwrite data lama tanpa rencana recovery. Perbarui docs academic/security dan jelaskan keputusan rollout.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-academic-service/internal/domain/schedule_dto.go",
      "kelolakelas-academic-service/internal/repository/schedule_repository.go"
    ],
    "edgeCases": [
      "Baris private historis kapasitas >1.",
      "Mutasi jadwal sesudah enrollment aktif.",
      "Dua approval konkuren pada kelas private yang sama."
    ],
    "testingValidation": [
      "Integration test private create/approval/recommendation, group >1, dan foreign-tenant resource.",
      "Uji data lama pada database fixture dengan capacity >1 tanpa destructive migration, go test -race, go vet dan build."
    ],
    "outOfScope": [
      "Migrasi destruktif kapasitas lama tanpa audit.",
      "Menghapus input kapasitas per jadwal group."
    ]
  }
}
```
