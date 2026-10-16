## Background / Problem

Testing 16 Oktober 2026: Form jadwal kurang rapi terutama weekday/start/end. Markup memakai tiga kolom dengan label belum terhubung ke field.

## Goal

Form jadwal responsive, sejajar dan accessible.

## Requirements

- Rapikan alignment, spacing, lebar dan susunan responsive day/start/end pada manual/generator area terkait.
- Hubungkan label/control ID/helper/error; pertahankan keyboard/focus.
- Pertahankan generator, teacher picker, capacity/location, overlap advisory dan validation/payload existing.

## Acceptance Criteria

- [ ] Mobile tidak overflow atau tumpang tindih; desktop sejajar dan label jelas.
- [ ] Semua field punya accessible name dan error terkait.
- [ ] Create dan editor memakai styling konsisten tanpa regresi generator/submit.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti ScheduleForm.tsx:553/:556/:576/:590. Dependency editor adalah sequencing shared component agar styling tidak tertimpa refactor. Styling bersumber dari testing pengguna, tanpa screenshot/reproduksi visual.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`

## Edge Cases

- 360px, zoom 200%, label panjang dan banyak error.
- Manual/generated slots, tutor kosong/loading/error.

## Testing / Validation

- [ ] Verifikasi visual desktop/mobile/zoom dan keyboard/label/error association.
- [ ] Regresi generator, overlap warning, teacher picker dan payload.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Mengubah generation/durasi/jeda atau desain dashboard lain.

## AI Orchestrator Contract

```json
{
  "draftKey": "schedule-form-layout",
  "projectKey": "tenant-selling-operations",
  "title": "Rapikan day of week, start time, dan end time pada form jadwal",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "complete-class-editor"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Testing 16 Oktober 2026: Form jadwal kurang rapi terutama weekday/start/end. Markup memakai tiga kolom dengan label belum terhubung ke field.",
    "goal": "Form jadwal responsive, sejajar dan accessible.",
    "requirements": [
      "Rapikan alignment, spacing, lebar dan susunan responsive day/start/end pada manual/generator area terkait.",
      "Hubungkan label/control ID/helper/error; pertahankan keyboard/focus.",
      "Pertahankan generator, teacher picker, capacity/location, overlap advisory dan validation/payload existing."
    ],
    "acceptanceCriteria": [
      "Mobile tidak overflow atau tumpang tindih; desktop sejajar dan label jelas.",
      "Semua field punya accessible name dan error terkait.",
      "Create dan editor memakai styling konsisten tanpa regresi generator/submit.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti ScheduleForm.tsx:553/:556/:576/:590. Dependency editor adalah sequencing shared component agar styling tidak tertimpa refactor. Styling bersumber dari testing pengguna, tanpa screenshot/reproduksi visual.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx"
    ],
    "edgeCases": [
      "360px, zoom 200%, label panjang dan banyak error.",
      "Manual/generated slots, tutor kosong/loading/error."
    ],
    "testingValidation": [
      "Verifikasi visual desktop/mobile/zoom dan keyboard/label/error association.",
      "Regresi generator, overlap warning, teacher picker dan payload.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Mengubah generation/durasi/jeda atau desain dashboard lain."
    ]
  }
}
```
