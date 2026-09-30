## Background / Problem

Area parent hanya berisi enrollments, students, dan chat tanpa layout atau navigasi bersama; halaman saling menautkan secara manual (`app/(public)/kelas/page.tsx:32`, `parent/enrollments/page.tsx:33-35`, `StudentsManager.tsx:41`, `parent/chat/page.tsx:33`). Jadwal sesi, kehadiran, dan laporan anak belum ditampilkan.

## Goal

Parent memiliki area dashboard yang konsisten untuk melihat jadwal sesi mendatang, riwayat kehadiran, dan laporan evaluasi per anak.

## Requirements

- Layout dan navigasi parent bersama (kelas saya, anak, jadwal dan progres, chat) yang berfungsi di desktop dan mobile.
- Halaman progres per anak: sesi mendatang (misalnya dua minggu ke depan), riwayat kehadiran dengan ringkasan, dan daftar serta detail laporan.
- Pemilih anak bila parent memiliki lebih dari satu anak.
- Tautan untuk memulai chat dari laporan memakai entry point chat yang sudah ada.

## Acceptance Criteria

- [ ] Parent dengan dua anak dapat berpindah anak dan melihat data yang benar.
- [ ] State kosong ditampilkan saat anak belum punya sesi, kehadiran, atau laporan.
- [ ] Halaman parent yang ada tetap dapat diakses melalui navigasi baru.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

`proxy.ts:74` sudah menjaga `/dashboard/parent` hanya untuk parent. Ikuti konvensi `_queries` dan result type web; teks antarmuka parent berbahasa Indonesia. Waktu ditampilkan dalam Asia/Jakarta. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent`
- `kelolakelas-web/proxy.ts`
- `kelolakelas-web/lib/list-envelope.ts`

## Edge Cases

- Parent tanpa anak.
- Anak dengan enrollment di beberapa tenant.
- Laporan tanpa skor.

## Testing / Validation

- [ ] Vitest untuk query, pemilih anak, dan state kosong atau error.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual sebagai parent dengan satu dan dua anak serta pemeriksaan aksesibilitas navigasi.

## Out of Scope

- Notifikasi.
- Mengubah data kehadiran atau laporan.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-parent-learning-portal",
  "projectKey": "parent-learning-portal",
  "title": "Parent melihat jadwal, riwayat kehadiran, dan rapor anak dari dashboard",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "parent-learning-read-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Area parent hanya berisi enrollments, students, dan chat tanpa layout atau navigasi bersama; halaman saling menautkan secara manual (`app/(public)/kelas/page.tsx:32`, `parent/enrollments/page.tsx:33-35`, `StudentsManager.tsx:41`, `parent/chat/page.tsx:33`). Jadwal sesi, kehadiran, dan laporan anak belum ditampilkan.",
    "goal": "Parent memiliki area dashboard yang konsisten untuk melihat jadwal sesi mendatang, riwayat kehadiran, dan laporan evaluasi per anak.",
    "requirements": [
      "Layout dan navigasi parent bersama (kelas saya, anak, jadwal dan progres, chat) yang berfungsi di desktop dan mobile.",
      "Halaman progres per anak: sesi mendatang (misalnya dua minggu ke depan), riwayat kehadiran dengan ringkasan, dan daftar serta detail laporan.",
      "Pemilih anak bila parent memiliki lebih dari satu anak.",
      "Tautan untuk memulai chat dari laporan memakai entry point chat yang sudah ada."
    ],
    "acceptanceCriteria": [
      "Parent dengan dua anak dapat berpindah anak dan melihat data yang benar.",
      "State kosong ditampilkan saat anak belum punya sesi, kehadiran, atau laporan.",
      "Halaman parent yang ada tetap dapat diakses melalui navigasi baru.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "`proxy.ts:74` sudah menjaga `/dashboard/parent` hanya untuk parent. Ikuti konvensi `_queries` dan result type web; teks antarmuka parent berbahasa Indonesia. Waktu ditampilkan dalam Asia/Jakarta. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent",
      "kelolakelas-web/proxy.ts",
      "kelolakelas-web/lib/list-envelope.ts"
    ],
    "edgeCases": [
      "Parent tanpa anak.",
      "Anak dengan enrollment di beberapa tenant.",
      "Laporan tanpa skor."
    ],
    "testingValidation": [
      "Vitest untuk query, pemilih anak, dan state kosong atau error.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual sebagai parent dengan satu dan dua anak serta pemeriksaan aksesibilitas navigasi."
    ],
    "outOfScope": [
      "Notifikasi.",
      "Mengubah data kehadiran atau laporan."
    ]
  }
}
```
