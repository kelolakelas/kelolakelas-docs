## Background / Problem

API laporan (`/api/v1/reports`, model `Report` dengan title, evaluation_notes, score 0-100) sudah ada, tetapi web hanya memanggilnya dari picker chat (`app/(dashboard)/dashboard/tenant/chat/_queries/queries.ts:94`) dan tidak pernah menampilkan isi laporan.

## Goal

Pengajar dapat membuat, membaca, mengubah, dan menghapus laporan evaluasi untuk siswa di kelas yang diajarnya.

## Requirements

- Halaman laporan dengan filter kelas, siswa, dan rentang tanggal.
- Form buat dan ubah laporan (judul, catatan evaluasi, skor opsional 0-100) serta hapus dengan konfirmasi.
- Pilihan enrollment hanya dari kelas yang dapat diakses pemanggil.
- Item menu laporan mengikuti pemetaan permission.

## Acceptance Criteria

- [ ] Pengajar dapat membuat laporan dan melihatnya di daftar.
- [ ] Pengajar tidak dapat mengubah laporan kelas yang tidak diajarnya dan melihat pesan yang jelas.
- [ ] Validasi skor di luar 0-100 dan judul kosong ditampilkan di form.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan kembali tipe laporan yang sudah ada di chat query bila cocok. Tambahkan tombol ke `ReportChatStarter` bila relevan, tanpa mengubah perilaku chat. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/chat/_queries/queries.ts`

## Edge Cases

- Siswa dengan enrollment dropped.
- Catatan evaluasi panjang.
- Laporan dihapus oleh anggota lain.

## Testing / Validation

- [ ] Vitest untuk schema form, query, dan state forbidden.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual CRUD laporan sebagai Teacher dan Creator.

## Out of Scope

- Akses parent ke laporan.
- Ekspor rapor ke PDF.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tutor-student-reports",
  "projectKey": "tutor-session-operations",
  "title": "Pengajar menulis dan mengelola laporan evaluasi siswa dari dashboard",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "tutor-session-scope-guards",
    "role-aware-tenant-nav"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "API laporan (`/api/v1/reports`, model `Report` dengan title, evaluation_notes, score 0-100) sudah ada, tetapi web hanya memanggilnya dari picker chat (`app/(dashboard)/dashboard/tenant/chat/_queries/queries.ts:94`) dan tidak pernah menampilkan isi laporan.",
    "goal": "Pengajar dapat membuat, membaca, mengubah, dan menghapus laporan evaluasi untuk siswa di kelas yang diajarnya.",
    "requirements": [
      "Halaman laporan dengan filter kelas, siswa, dan rentang tanggal.",
      "Form buat dan ubah laporan (judul, catatan evaluasi, skor opsional 0-100) serta hapus dengan konfirmasi.",
      "Pilihan enrollment hanya dari kelas yang dapat diakses pemanggil.",
      "Item menu laporan mengikuti pemetaan permission."
    ],
    "acceptanceCriteria": [
      "Pengajar dapat membuat laporan dan melihatnya di daftar.",
      "Pengajar tidak dapat mengubah laporan kelas yang tidak diajarnya dan melihat pesan yang jelas.",
      "Validasi skor di luar 0-100 dan judul kosong ditampilkan di form.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan kembali tipe laporan yang sudah ada di chat query bila cocok. Tambahkan tombol ke `ReportChatStarter` bila relevan, tanpa mengubah perilaku chat. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/chat/_queries/queries.ts"
    ],
    "edgeCases": [
      "Siswa dengan enrollment dropped.",
      "Catatan evaluasi panjang.",
      "Laporan dihapus oleh anggota lain."
    ],
    "testingValidation": [
      "Vitest untuk schema form, query, dan state forbidden.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual CRUD laporan sebagai Teacher dan Creator."
    ],
    "outOfScope": [
      "Akses parent ke laporan.",
      "Ekspor rapor ke PDF."
    ]
  }
}
```
