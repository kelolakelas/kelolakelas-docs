## Background / Problem

`ScheduleForm.tsx` (dipakai wizard kelas dan `AddScheduleModal.tsx`) mengharuskan tenant menambah slot satu per satu dengan hari, jam mulai, jam selesai, kapasitas, dan lokasi. Kelas dengan banyak sesi per hari atau per minggu lambat disiapkan dan rawan salah input.

## Goal

Tenant memilih hari melalui checkbox, lalu mengisi jam mulai, jam selesai, lama sesi, dan jeda antar sesi. Form menghasilkan slot yang dapat ditinjau dan diubah sebelum dikirim.

## Requirements

- Form jadwal menyediakan generator dengan checkbox hari Senin–Minggu, jam mulai, jam selesai (batas akhir), lama sesi dalam menit, jeda antar sesi dalam menit, serta kapasitas dan lokasi default.
- Untuk setiap hari terpilih, generator membuat sesi berurutan mulai dari jam mulai dengan durasi lama sesi dan dipisahkan jeda. Sesi yang tidak selesai sebelum atau tepat pada jam selesai tidak dibuat. Contoh: 08:00–12:00, 90 menit, jeda 15 menit menghasilkan 08:00–09:30 dan 09:45–11:15.
- Slot hasil generator masuk ke daftar slot yang ada dan tetap dapat diubah atau dihapus. Tambah slot manual tetap tersedia.
- Validasi mencakup minimal satu hari, lama sesi > 0, jeda ≥ 0, jam selesai setelah jam mulai, minimal satu sesi muat, dan slot duplikat (hari dan jam sama) dicegah.
- Payload ke `POST /api/v1/schedules` dan aturan kapasitas per slot (KEL-50) tidak berubah.

## Acceptance Criteria

- [ ] Contoh di atas menghasilkan tepat dua slot untuk setiap hari yang dicentang.
- [ ] Input tidak valid menampilkan pesan per field dan tidak menghasilkan slot.
- [ ] Slot yang dihasilkan tersimpan melalui endpoint yang ada dan tampil di detail kelas.
- [ ] Wizard kelas private tetap menampilkan notice yang ada tanpa generator.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Perubahan hanya di web. Letakkan logika generasi sebagai fungsi murni yang dapat diuji di `_lib`, di samping `scheduleItemSchema` (`app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts:186`). Waktu adalah wall-clock `HH:MM` tanpa zona waktu, sama dengan backend. Sesi yang melewati tengah malam tidak didukung. Academic tidak memvalidasi tumpang tindih jadwal (tidak ditemukan pengecekan overlap), sehingga pencegahan duplikat di form adalah perlindungan UI saja. Perbarui kelolakelas-docs `docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`

## Edge Cases

- Lama sesi lebih panjang dari rentang jam, sehingga tidak ada sesi yang dihasilkan.
- Jeda 0 menit, sehingga sesi bersambung.
- Generator dijalankan dua kali dengan parameter sama, dan duplikat tidak ditambahkan.
- Jumlah slot yang dihasilkan sangat besar.

## Testing / Validation

- [ ] Unit test fungsi generator untuk contoh di atas, batas akhir tepat, jeda 0, dan input tidak valid.
- [ ] Vitest untuk interaksi form (centang hari, generate, ubah, hapus).
- [ ] Existing tests pass (termasuk `ClassCreationWizard.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Validasi overlap jadwal di academic.
- Generator jadwal untuk kelas private.
- Tanggal berlaku (`valid_from`/`valid_until`).

## AI Orchestrator Contract

```json
{
  "draftKey": "weekly-schedule-slot-generator",
  "projectKey": null,
  "title": "Tenant dapat menghasilkan slot jadwal mingguan dari pilihan hari, jam, lama sesi, dan jeda",
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
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`ScheduleForm.tsx` (dipakai wizard kelas dan `AddScheduleModal.tsx`) mengharuskan tenant menambah slot satu per satu dengan hari, jam mulai, jam selesai, kapasitas, dan lokasi. Kelas dengan banyak sesi per hari atau per minggu lambat disiapkan dan rawan salah input.",
    "goal": "Tenant memilih hari melalui checkbox, lalu mengisi jam mulai, jam selesai, lama sesi, dan jeda antar sesi. Form menghasilkan slot yang dapat ditinjau dan diubah sebelum dikirim.",
    "requirements": [
      "Form jadwal menyediakan generator dengan checkbox hari Senin–Minggu, jam mulai, jam selesai (batas akhir), lama sesi dalam menit, jeda antar sesi dalam menit, serta kapasitas dan lokasi default.",
      "Untuk setiap hari terpilih, generator membuat sesi berurutan mulai dari jam mulai dengan durasi lama sesi dan dipisahkan jeda. Sesi yang tidak selesai sebelum atau tepat pada jam selesai tidak dibuat. Contoh: 08:00–12:00, 90 menit, jeda 15 menit menghasilkan 08:00–09:30 dan 09:45–11:15.",
      "Slot hasil generator masuk ke daftar slot yang ada dan tetap dapat diubah atau dihapus. Tambah slot manual tetap tersedia.",
      "Validasi mencakup minimal satu hari, lama sesi > 0, jeda ≥ 0, jam selesai setelah jam mulai, minimal satu sesi muat, dan slot duplikat (hari dan jam sama) dicegah.",
      "Payload ke `POST /api/v1/schedules` dan aturan kapasitas per slot (KEL-50) tidak berubah."
    ],
    "acceptanceCriteria": [
      "Contoh di atas menghasilkan tepat dua slot untuk setiap hari yang dicentang.",
      "Input tidak valid menampilkan pesan per field dan tidak menghasilkan slot.",
      "Slot yang dihasilkan tersimpan melalui endpoint yang ada dan tampil di detail kelas.",
      "Wizard kelas private tetap menampilkan notice yang ada tanpa generator.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Perubahan hanya di web. Letakkan logika generasi sebagai fungsi murni yang dapat diuji di `_lib`, di samping `scheduleItemSchema` (`app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts:186`). Waktu adalah wall-clock `HH:MM` tanpa zona waktu, sama dengan backend. Sesi yang melewati tengah malam tidak didukung. Academic tidak memvalidasi tumpang tindih jadwal (tidak ditemukan pengecekan overlap), sehingga pencegahan duplikat di form adalah perlindungan UI saja. Perbarui kelolakelas-docs `docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts"
    ],
    "edgeCases": [
      "Lama sesi lebih panjang dari rentang jam, sehingga tidak ada sesi yang dihasilkan.",
      "Jeda 0 menit, sehingga sesi bersambung.",
      "Generator dijalankan dua kali dengan parameter sama, dan duplikat tidak ditambahkan.",
      "Jumlah slot yang dihasilkan sangat besar."
    ],
    "testingValidation": [
      "Unit test fungsi generator untuk contoh di atas, batas akhir tepat, jeda 0, dan input tidak valid.",
      "Vitest untuk interaksi form (centang hari, generate, ubah, hapus).",
      "Existing tests pass (termasuk `ClassCreationWizard.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Validasi overlap jadwal di academic.",
      "Generator jadwal untuk kelas private.",
      "Tanggal berlaku (`valid_from`/`valid_until`)."
    ]
  }
}
```
