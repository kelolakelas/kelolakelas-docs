## Background / Problem

Setelah API rekomendasi tersedia, tenant membutuhkan cara menyertakan slot alternatif saat menolak dari dashboard, dan parent membutuhkan cara melihat serta menerima atau menolak rekomendasi dari daftar permintaannya. Dialog tolak tenant dan daftar permintaan parent dibuat oleh issue web tenant dan issue web parent.

## Goal

Tenant dapat memilih menolak begitu saja atau menolak dengan rekomendasi jadwal lain. Parent dapat melihat rekomendasi, menerimanya lalu melanjutkan pembayaran, atau menolaknya.

## Requirements

- Dialog tolak tenant menyediakan pilihan "Tolak" dan "Tolak dengan rekomendasi jadwal". Pilihan kedua menampilkan input satu atau lebih slot (hari, jam mulai, jam selesai) dan alasan opsional.
- Daftar permintaan parent menampilkan slot rekomendasi pada permintaan yang ditolak dengan rekomendasi, beserta tombol "Terima jadwal ini" dan "Tolak rekomendasi".
- Menerima rekomendasi mengarahkan parent ke pembayaran melalui `checkout_session_url` yang dikembalikan API, hanya bila skemanya http/https (pola `resumePayment` di `lib/payment-status.ts`).
- Tenant melihat status rekomendasi (menunggu parent, diterima, ditolak) di daftar permintaan.
- Error API (409, 403, validasi, jaringan) ditampilkan dengan pesan berbahasa Indonesia yang jelas.

## Acceptance Criteria

- [ ] Tenant menolak dengan rekomendasi, lalu parent melihat slot rekomendasi pada permintaannya.
- [ ] Parent menerima rekomendasi dan diarahkan ke pembayaran; enrollment terkait tampil di halaman status enrollment.
- [ ] Parent menolak rekomendasi, lalu tombol terima tidak lagi tersedia dan status tampil ditolak.
- [ ] Slot rekomendasi dengan jam selesai tidak setelah jam mulai dicegah di form tenant.
- [ ] Penolakan tanpa rekomendasi tetap berfungsi seperti sebelumnya.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Pakai ulang input slot dari form permintaan parent bila memungkinkan. Kontrak endpoint mengikuti hasil issue API rekomendasi; jangan mengarang field. Hari memakai ISO 1–7 dengan label bahasa Indonesia seperti `enrollmentScheduleLabel` (KEL-70). Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments`
- `kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Rekomendasi diterima tetapi invoice gagal dibuat.
- Parent membuka rekomendasi yang sudah ditolak di tab lain.
- Kelas ditutup sebelum parent menerima rekomendasi.

## Testing / Validation

- [ ] Vitest untuk dialog tolak dengan dan tanpa rekomendasi, validasi slot, serta aksi terima dan tolak rekomendasi oleh parent.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan API.
- Notifikasi email atau chat.
- Parent mengusulkan balik jadwal atas rekomendasi.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-schedule-recommendation-web",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Tenant mengirim rekomendasi jadwal saat menolak dan parent dapat menerima atau menolaknya di web",
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
    "private-schedule-recommendation-api",
    "parent-private-schedule-request-web",
    "tenant-private-schedule-review-web"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Setelah API rekomendasi tersedia, tenant membutuhkan cara menyertakan slot alternatif saat menolak dari dashboard, dan parent membutuhkan cara melihat serta menerima atau menolak rekomendasi dari daftar permintaannya. Dialog tolak tenant dan daftar permintaan parent dibuat oleh issue web tenant dan issue web parent.",
    "goal": "Tenant dapat memilih menolak begitu saja atau menolak dengan rekomendasi jadwal lain. Parent dapat melihat rekomendasi, menerimanya lalu melanjutkan pembayaran, atau menolaknya.",
    "requirements": [
      "Dialog tolak tenant menyediakan pilihan \"Tolak\" dan \"Tolak dengan rekomendasi jadwal\". Pilihan kedua menampilkan input satu atau lebih slot (hari, jam mulai, jam selesai) dan alasan opsional.",
      "Daftar permintaan parent menampilkan slot rekomendasi pada permintaan yang ditolak dengan rekomendasi, beserta tombol \"Terima jadwal ini\" dan \"Tolak rekomendasi\".",
      "Menerima rekomendasi mengarahkan parent ke pembayaran melalui `checkout_session_url` yang dikembalikan API, hanya bila skemanya http/https (pola `resumePayment` di `lib/payment-status.ts`).",
      "Tenant melihat status rekomendasi (menunggu parent, diterima, ditolak) di daftar permintaan.",
      "Error API (409, 403, validasi, jaringan) ditampilkan dengan pesan berbahasa Indonesia yang jelas."
    ],
    "acceptanceCriteria": [
      "Tenant menolak dengan rekomendasi, lalu parent melihat slot rekomendasi pada permintaannya.",
      "Parent menerima rekomendasi dan diarahkan ke pembayaran; enrollment terkait tampil di halaman status enrollment.",
      "Parent menolak rekomendasi, lalu tombol terima tidak lagi tersedia dan status tampil ditolak.",
      "Slot rekomendasi dengan jam selesai tidak setelah jam mulai dicegah di form tenant.",
      "Penolakan tanpa rekomendasi tetap berfungsi seperti sebelumnya.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Pakai ulang input slot dari form permintaan parent bila memungkinkan. Kontrak endpoint mengikuti hasil issue API rekomendasi; jangan mengarang field. Hari memakai ISO 1–7 dengan label bahasa Indonesia seperti `enrollmentScheduleLabel` (KEL-70). Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments",
      "kelolakelas-web/app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Rekomendasi diterima tetapi invoice gagal dibuat.",
      "Parent membuka rekomendasi yang sudah ditolak di tab lain.",
      "Kelas ditutup sebelum parent menerima rekomendasi."
    ],
    "testingValidation": [
      "Vitest untuk dialog tolak dengan dan tanpa rekomendasi, validasi slot, serta aksi terima dan tolak rekomendasi oleh parent.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan API.",
      "Notifikasi email atau chat.",
      "Parent mengusulkan balik jadwal atas rekomendasi."
    ]
  }
}
```
