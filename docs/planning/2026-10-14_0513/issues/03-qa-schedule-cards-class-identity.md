## Background / Problem

QA agent-browser pada 14 Oktober 2026 WIB. Tenant membuat QA Browser Grup dan QA Browser Bahasa, masing-masing memiliki Senin 09:00–10:30, kapasitas 10, Room 101. Buka /dashboard/tenant/classes → Schedules (3). Kedua kartu Senin tampil identik: Mon 09:00 - 10:30, 10 seats, Room 101; tidak ada nama kelas. GET /schedules menyediakan class_id dan class.name yang benar. Screenshot schedules.png membuktikan kehilangan konteks kelas. KEL-190 adalah kategori pada tabel Classes, bukan identitas kelas pada kartu Schedules.

## Goal

Tenant dapat mengenali kelas pemilik setiap kartu jadwal meski waktu, kapasitas dan lokasi sama.

## Requirements

- Tampilkan nama kelas pemilik jadwal pada setiap kartu Schedules
- Gunakan data relasi kelas existing dari API
- Tangani relasi kelas absent dengan fallback yang tidak menyatakan kelas yang salah
- Pertahankan informasi waktu, kapasitas, dan lokasi

## Acceptance Criteria

- [ ] Dua jadwal identik dari kelas berbeda menampilkan nama kelas masing-masing
- [ ] Nama kelas terlihat pada desktop dan mobile
- [ ] Relasi class yang kosong tidak menyebabkan crash atau label kelas keliru
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

SchedulesGrid di ClassListTable.tsx hanya merender hari, waktu, capacity dan location. GET /schedules telah menyediakan nested class.name; scope web saja, mapping/type dapat diselaraskan bila perlu. Tidak membutuhkan perubahan kontrak API. Dokumentasikan hasil tampilan baru. Duplikasi diperiksa melalui issue jadwal, teacher, tutor dan backlog KEL; KEL-190 berbeda field/komponen.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_queries/queries.ts`

## Edge Cases

- Dua kelas punya jam/lokasi/kapasitas identik
- Nama kelas panjang
- Relasi kelas hilang atau jadwal kosong

## Testing / Validation

- [ ] Render regression dua kartu jadwal dari kelas berbeda dengan detail identik
- [ ] Manual desktop/mobile dan data relasi kosong
- [ ] Regression test yang membuktikan acceptance criteria
- [ ] npm run test; npm run lint; npx tsc --noEmit; npm run build
- [ ] GitHub required CI sukses pada PR ke main sebelum merge
- [ ] Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING

## Out of Scope

- Kategori tabel Classes (KEL-190)
- Edit/hapus jadwal
- Perubahan backend atau API baru

## AI Orchestrator Contract

```json
{
  "draftKey": "qa-schedule-cards-class-identity",
  "projectKey": null,
  "title": "Tab Schedules tenant tidak menampilkan nama kelas sehingga jadwal antar kelas tidak dapat dibedakan",
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
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "QA agent-browser pada 14 Oktober 2026 WIB. Tenant membuat QA Browser Grup dan QA Browser Bahasa, masing-masing memiliki Senin 09:00–10:30, kapasitas 10, Room 101. Buka /dashboard/tenant/classes → Schedules (3). Kedua kartu Senin tampil identik: Mon 09:00 - 10:30, 10 seats, Room 101; tidak ada nama kelas. GET /schedules menyediakan class_id dan class.name yang benar. Screenshot schedules.png membuktikan kehilangan konteks kelas. KEL-190 adalah kategori pada tabel Classes, bukan identitas kelas pada kartu Schedules.",
    "goal": "Tenant dapat mengenali kelas pemilik setiap kartu jadwal meski waktu, kapasitas dan lokasi sama.",
    "requirements": [
      "Tampilkan nama kelas pemilik jadwal pada setiap kartu Schedules",
      "Gunakan data relasi kelas existing dari API",
      "Tangani relasi kelas absent dengan fallback yang tidak menyatakan kelas yang salah",
      "Pertahankan informasi waktu, kapasitas, dan lokasi"
    ],
    "acceptanceCriteria": [
      "Dua jadwal identik dari kelas berbeda menampilkan nama kelas masing-masing",
      "Nama kelas terlihat pada desktop dan mobile",
      "Relasi class yang kosong tidak menyebabkan crash atau label kelas keliru",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "SchedulesGrid di ClassListTable.tsx hanya merender hari, waktu, capacity dan location. GET /schedules telah menyediakan nested class.name; scope web saja, mapping/type dapat diselaraskan bila perlu. Tidak membutuhkan perubahan kontrak API. Dokumentasikan hasil tampilan baru. Duplikasi diperiksa melalui issue jadwal, teacher, tutor dan backlog KEL; KEL-190 berbeda field/komponen.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_queries/queries.ts"
    ],
    "edgeCases": [
      "Dua kelas punya jam/lokasi/kapasitas identik",
      "Nama kelas panjang",
      "Relasi kelas hilang atau jadwal kosong"
    ],
    "testingValidation": [
      "Render regression dua kartu jadwal dari kelas berbeda dengan detail identik",
      "Manual desktop/mobile dan data relasi kosong",
      "Regression test yang membuktikan acceptance criteria",
      "npm run test; npm run lint; npx tsc --noEmit; npm run build",
      "GitHub required CI sukses pada PR ke main sebelum merge",
      "Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING"
    ],
    "outOfScope": [
      "Kategori tabel Classes (KEL-190)",
      "Edit/hapus jadwal",
      "Perubahan backend atau API baru"
    ]
  }
}
```
