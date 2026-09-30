## Background / Problem

Tidak ada kode web yang memanggil `/api/v1/sessions`, `/sessions/:id/attendees`, atau `/attendance`; tipe `ClassSession` di `app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts:440-449` tidak pernah dirender. Pengajar tidak dapat mengelola sesi dari aplikasi.

## Goal

Pengajar membuka satu halaman untuk melihat sesinya hari ini atau minggu ini dan mencatat kehadiran seluruh siswa satu sesi.

## Requirements

- Halaman sesi di dashboard tenant dengan tampilan hari ini dan minggu ini, filter sesi milik sendiri sebagai default untuk pengajar, dan filter kelas.
- Detail sesi menampilkan attendees dan form kehadiran massal (hadir, telat, izin, alfa) yang memakai API absensi per sesi.
- Item menu sesi mengikuti pemetaan permission dari menu sadar-permission.
- State loading, kosong, forbidden, dan error ditangani sesuai pola halaman tenant yang ada.

## Acceptance Criteria

- [ ] Pengajar melihat sesinya sendiri untuk hari ini dan minggu ini, termasuk sesi reschedule.
- [ ] Pengajar menyimpan kehadiran seluruh siswa satu sesi dan melihat hasilnya setelah refresh.
- [ ] Anggota tanpa permission melihat panel forbidden, bukan error mentah.
- [ ] Form dapat dioperasikan dengan keyboard dan label status terbaca screen reader.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti konvensi `_queries`, `_actions` ('use server'), `_components`, dan `_lib/schema.ts` (zod v4); gunakan `normalizeListEnvelope` dari `lib/list-envelope.ts`. Tanggal ditampilkan dalam Asia/Jakarta, dan batas hari untuk filter harus sesuai kontrak backend. Swagger lokal `_docs/api` untuk sesi usang, jadi pakai kontrak dari issue backend. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`
- `kelolakelas-web/lib/list-envelope.ts`

## Edge Cases

- Tidak ada sesi pada rentang yang dipilih.
- Sesi dibatalkan atau di-reschedule setelah halaman dimuat.
- Sebagian simpan gagal karena enrollment sudah tidak aktif.

## Testing / Validation

- [ ] Vitest untuk query, schema, dan komponen form kehadiran termasuk state forbidden dan error.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual sebagai Teacher dan Creator terhadap backend lokal.

## Out of Scope

- Reschedule dan tutor pengganti.
- Laporan evaluasi.
- Tampilan kalender bulanan.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tutor-sessions-attendance",
  "projectKey": "tutor-session-operations",
  "title": "Pengajar melihat sesi hari ini dan minggu ini serta mencatat kehadiran dari dashboard",
  "type": "Feature",
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
  "blockedByDraftKeys": [
    "attendance-by-session",
    "tutor-session-scope-guards",
    "role-aware-tenant-nav"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada kode web yang memanggil `/api/v1/sessions`, `/sessions/:id/attendees`, atau `/attendance`; tipe `ClassSession` di `app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts:440-449` tidak pernah dirender. Pengajar tidak dapat mengelola sesi dari aplikasi.",
    "goal": "Pengajar membuka satu halaman untuk melihat sesinya hari ini atau minggu ini dan mencatat kehadiran seluruh siswa satu sesi.",
    "requirements": [
      "Halaman sesi di dashboard tenant dengan tampilan hari ini dan minggu ini, filter sesi milik sendiri sebagai default untuk pengajar, dan filter kelas.",
      "Detail sesi menampilkan attendees dan form kehadiran massal (hadir, telat, izin, alfa) yang memakai API absensi per sesi.",
      "Item menu sesi mengikuti pemetaan permission dari menu sadar-permission.",
      "State loading, kosong, forbidden, dan error ditangani sesuai pola halaman tenant yang ada."
    ],
    "acceptanceCriteria": [
      "Pengajar melihat sesinya sendiri untuk hari ini dan minggu ini, termasuk sesi reschedule.",
      "Pengajar menyimpan kehadiran seluruh siswa satu sesi dan melihat hasilnya setelah refresh.",
      "Anggota tanpa permission melihat panel forbidden, bukan error mentah.",
      "Form dapat dioperasikan dengan keyboard dan label status terbaca screen reader.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti konvensi `_queries`, `_actions` ('use server'), `_components`, dan `_lib/schema.ts` (zod v4); gunakan `normalizeListEnvelope` dari `lib/list-envelope.ts`. Tanggal ditampilkan dalam Asia/Jakarta, dan batas hari untuk filter harus sesuai kontrak backend. Swagger lokal `_docs/api` untuk sesi usang, jadi pakai kontrak dari issue backend. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts",
      "kelolakelas-web/lib/list-envelope.ts"
    ],
    "edgeCases": [
      "Tidak ada sesi pada rentang yang dipilih.",
      "Sesi dibatalkan atau di-reschedule setelah halaman dimuat.",
      "Sebagian simpan gagal karena enrollment sudah tidak aktif."
    ],
    "testingValidation": [
      "Vitest untuk query, schema, dan komponen form kehadiran termasuk state forbidden dan error.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual sebagai Teacher dan Creator terhadap backend lokal."
    ],
    "outOfScope": [
      "Reschedule dan tutor pengganti.",
      "Laporan evaluasi.",
      "Tampilan kalender bulanan."
    ]
  }
}
```
