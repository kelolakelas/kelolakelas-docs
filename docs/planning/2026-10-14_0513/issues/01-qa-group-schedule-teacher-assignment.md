## Background / Problem

QA agent-browser pada 14 Oktober 2026 WIB, web b2d8b8c2 dan academic e4a67b91 (HEAD sama dengan origin/main setelah fetch). Tenant QA sudah mempunyai anggota Teacher aktif. Langkah: Classes → Create New Class → kategori QA Matematika → kelas grup QA Browser Grup, Rp100.000 → jadwal Senin 09:00–10:30 kapasitas 10 → Complete Class Setup. Form jadwal tidak menyediakan pemilihan teacher. GET /schedules mengembalikan tutor_id tidak terisi; GET /sessions?class_id=fba5b1e5-8fbc-43fc-8408-48cb1bf84b0f menunjukkan dua sesi (19 dan 26 Oktober) bertutor 00000000-0000-0000-0000-000000000000. GET /sessions?mine=true milik teacher tidak menampilkan kedua sesi. Kontrol positif: sesi fixture Rabu setelah ditugaskan ke member Teacher melalui endpoint substitute-tutor tampil pada Sesi Saya teacher. Ini jalur kelas GROUP; KEL-186 hanya membahas jadwal PRIVATE hasil approval.

## Goal

Tenant dapat menugaskan pengajar aktif ketika membuat jadwal grup sehingga sesi tersedia pada dashboard teacher yang ditugaskan.

## Requirements

- Sediakan penugasan pengajar tenant pada wizard grup dan Add Schedule
- Gunakan ID tenant_member, sesuai claim member_id dan kontrak tutor_id existing
- Simpan tutor_id pada jadwal sehingga sesi hasil generate mempunyai pengajar yang dipilih
- Berikan penjelasan yang jelas bila teacher belum tersedia; jangan menyatakan setup pengajar selesai jika sesi belum ditugaskan

## Acceptance Criteria

- [ ] Tenant dengan Teacher aktif dapat memilih teacher pada wizard dan Add Schedule
- [ ] GET /schedules dan sesi hasil generate mempunyai tutor_id membership yang dipilih
- [ ] Sesi terlihat pada Sesi Saya teacher untuk rentang tanggal yang sesuai
- [ ] Sesi tidak muncul pada mine=true teacher lain
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Scope web berdasarkan bukti: DTO academic ScheduleItemRequest sudah menerima tutor_id dan CreateInitialSchedules meneruskannya; tidak perlu endpoint baru. Web createScheduleSchema/ScheduleForm belum mengumpulkan tutor_id. Backend sessionsForScheduleBetween memakai UUID nol bila TutorID nil. Gunakan daftar anggota dan izin existing; jangan menyamakan user_id dengan member_id. Pembaruan docs menjelaskan alur penugasan grup. Tidak ada dependency backlog baru; beda scope dari KEL-186.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`

## Edge Cases

- Tenant belum mempunyai pengajar aktif
- Fetch anggota gagal atau permission berubah
- Slot generator membuat beberapa jadwal dengan tutor yang konsisten
- Jadwal grup existing tanpa tutor tetap dapat dibaca

## Testing / Validation

- [ ] Uji browser tenant membuat jadwal untuk Teacher; login Teacher dan cek sesi pada tanggal jadwal
- [ ] Uji payload tutor_id menggunakan member_id, bukan user_id
- [ ] Uji kondisi daftar anggota kosong/gagal dan error penyimpanan
- [ ] Regression test yang membuktikan acceptance criteria
- [ ] npm run test; npm run lint; npx tsc --noEmit; npm run build
- [ ] GitHub required CI sukses pada PR ke main sebelum merge
- [ ] Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING

## Out of Scope

- Approval jadwal private (KEL-186)
- Backfill otomatis sesi lama bertutor nol
- Perubahan policy otorisasi backend atau endpoint baru

## AI Orchestrator Contract

```json
{
  "draftKey": "qa-group-schedule-teacher-assignment",
  "projectKey": null,
  "title": "Wizard jadwal kelas grup menghasilkan sesi tanpa pengajar dan tidak menawarkan penugasan teacher",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "medium",
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
    "backgroundProblem": "QA agent-browser pada 14 Oktober 2026 WIB, web b2d8b8c2 dan academic e4a67b91 (HEAD sama dengan origin/main setelah fetch). Tenant QA sudah mempunyai anggota Teacher aktif. Langkah: Classes → Create New Class → kategori QA Matematika → kelas grup QA Browser Grup, Rp100.000 → jadwal Senin 09:00–10:30 kapasitas 10 → Complete Class Setup. Form jadwal tidak menyediakan pemilihan teacher. GET /schedules mengembalikan tutor_id tidak terisi; GET /sessions?class_id=fba5b1e5-8fbc-43fc-8408-48cb1bf84b0f menunjukkan dua sesi (19 dan 26 Oktober) bertutor 00000000-0000-0000-0000-000000000000. GET /sessions?mine=true milik teacher tidak menampilkan kedua sesi. Kontrol positif: sesi fixture Rabu setelah ditugaskan ke member Teacher melalui endpoint substitute-tutor tampil pada Sesi Saya teacher. Ini jalur kelas GROUP; KEL-186 hanya membahas jadwal PRIVATE hasil approval.",
    "goal": "Tenant dapat menugaskan pengajar aktif ketika membuat jadwal grup sehingga sesi tersedia pada dashboard teacher yang ditugaskan.",
    "requirements": [
      "Sediakan penugasan pengajar tenant pada wizard grup dan Add Schedule",
      "Gunakan ID tenant_member, sesuai claim member_id dan kontrak tutor_id existing",
      "Simpan tutor_id pada jadwal sehingga sesi hasil generate mempunyai pengajar yang dipilih",
      "Berikan penjelasan yang jelas bila teacher belum tersedia; jangan menyatakan setup pengajar selesai jika sesi belum ditugaskan"
    ],
    "acceptanceCriteria": [
      "Tenant dengan Teacher aktif dapat memilih teacher pada wizard dan Add Schedule",
      "GET /schedules dan sesi hasil generate mempunyai tutor_id membership yang dipilih",
      "Sesi terlihat pada Sesi Saya teacher untuk rentang tanggal yang sesuai",
      "Sesi tidak muncul pada mine=true teacher lain",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Scope web berdasarkan bukti: DTO academic ScheduleItemRequest sudah menerima tutor_id dan CreateInitialSchedules meneruskannya; tidak perlu endpoint baru. Web createScheduleSchema/ScheduleForm belum mengumpulkan tutor_id. Backend sessionsForScheduleBetween memakai UUID nol bila TutorID nil. Gunakan daftar anggota dan izin existing; jangan menyamakan user_id dengan member_id. Pembaruan docs menjelaskan alur penugasan grup. Tidak ada dependency backlog baru; beda scope dari KEL-186.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts"
    ],
    "edgeCases": [
      "Tenant belum mempunyai pengajar aktif",
      "Fetch anggota gagal atau permission berubah",
      "Slot generator membuat beberapa jadwal dengan tutor yang konsisten",
      "Jadwal grup existing tanpa tutor tetap dapat dibaca"
    ],
    "testingValidation": [
      "Uji browser tenant membuat jadwal untuk Teacher; login Teacher dan cek sesi pada tanggal jadwal",
      "Uji payload tutor_id menggunakan member_id, bukan user_id",
      "Uji kondisi daftar anggota kosong/gagal dan error penyimpanan",
      "Regression test yang membuktikan acceptance criteria",
      "npm run test; npm run lint; npx tsc --noEmit; npm run build",
      "GitHub required CI sukses pada PR ke main sebelum merge",
      "Perbarui dokumentasi current-state yang terdampak sesuai CONTRIBUTING"
    ],
    "outOfScope": [
      "Approval jadwal private (KEL-186)",
      "Backfill otomatis sesi lama bertutor nol",
      "Perubahan policy otorisasi backend atau endpoint baru"
    ]
  }
}
```
