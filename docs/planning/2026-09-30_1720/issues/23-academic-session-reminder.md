## Background / Problem

Tidak ada pengingat sesi; session generation worker sudah membuat sesi hingga horizon satu bulan (`internal/usecase/session_generation_worker.go:14-18,61-99`).

## Goal

Parent dengan enrollment aktif menerima satu pengingat untuk setiap sesi anaknya sekitar satu hari sebelumnya.

## Requirements

- Worker berkala menulis event pengingat ke outbox notifikasi untuk sesi terjadwal dalam jendela H-1 (Asia/Jakarta).
- Satu pengingat per sesi per enrollment, idempoten terhadap eksekusi ulang.
- Sesi dibatalkan atau enrollment tidak aktif tidak diingatkan.
- Jendela dan pengaktifan worker dapat dikonfigurasi.

## Acceptance Criteria

- [ ] Sesi besok menghasilkan tepat satu pengingat per parent terdampak.
- [ ] Menjalankan worker dua kali tidak menggandakan pengingat.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan outbox dan pengirim dari issue notifikasi. Sesi yang di-reschedule setelah pengingat terkirim mengikuti notifikasi reschedule. Perbarui `kelolakelas-docs` (04-configuration.md, components/academic-service.md).

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/session_generation_worker.go`
- `kelolakelas-academic-service/cmd/server/main.go`

## Edge Cases

- Sesi dekat tengah malam WIB.
- Sesi di-reschedule ke besok setelah worker berjalan.

## Testing / Validation

- [ ] Unit test dengan clock palsu untuk batas jendela.
- [ ] Postgres integration test idempotensi.
- [ ] go vet, go test -race, dan build lulus.

## Out of Scope

- Pengingat untuk pengajar.
- Pengaturan waktu pengingat per parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-session-reminder",
  "projectKey": "parent-schedule-notifications",
  "title": "Parent menerima pengingat sehari sebelum sesi anaknya",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [
    "academic-parent-notification-outbox"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada pengingat sesi; session generation worker sudah membuat sesi hingga horizon satu bulan (`internal/usecase/session_generation_worker.go:14-18,61-99`).",
    "goal": "Parent dengan enrollment aktif menerima satu pengingat untuk setiap sesi anaknya sekitar satu hari sebelumnya.",
    "requirements": [
      "Worker berkala menulis event pengingat ke outbox notifikasi untuk sesi terjadwal dalam jendela H-1 (Asia/Jakarta).",
      "Satu pengingat per sesi per enrollment, idempoten terhadap eksekusi ulang.",
      "Sesi dibatalkan atau enrollment tidak aktif tidak diingatkan.",
      "Jendela dan pengaktifan worker dapat dikonfigurasi."
    ],
    "acceptanceCriteria": [
      "Sesi besok menghasilkan tepat satu pengingat per parent terdampak.",
      "Menjalankan worker dua kali tidak menggandakan pengingat.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan outbox dan pengirim dari issue notifikasi. Sesi yang di-reschedule setelah pengingat terkirim mengikuti notifikasi reschedule. Perbarui `kelolakelas-docs` (04-configuration.md, components/academic-service.md).",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/session_generation_worker.go",
      "kelolakelas-academic-service/cmd/server/main.go"
    ],
    "edgeCases": [
      "Sesi dekat tengah malam WIB.",
      "Sesi di-reschedule ke besok setelah worker berjalan."
    ],
    "testingValidation": [
      "Unit test dengan clock palsu untuk batas jendela.",
      "Postgres integration test idempotensi.",
      "go vet, go test -race, dan build lulus."
    ],
    "outOfScope": [
      "Pengingat untuk pengajar.",
      "Pengaturan waktu pengingat per parent."
    ]
  }
}
```
