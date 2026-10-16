## Background / Problem

QA membuat kelas grup lewat wizard. Generator slot (Senin & Selasa, 08:00, 90 menit, jeda 15) menambahkan 4 slot ke slot manual awal Senin 09:00–10:30, sehingga kelas tersimpan dengan 5 jadwal dan Senin 08:00–09:30 tumpang tindih dengan Senin 09:00–10:30 tanpa peringatan. Menambahkan slot generator ke slot manual adalah perilaku yang disengaja dan diuji (`ScheduleForm.test.tsx`), dan pencegahan duplikat di form hanya mencegah slot dengan hari dan jam yang persis sama. Academic tidak memvalidasi overlap, dan hal itu sengaja dikeluarkan dari scope KEL-112. Akibatnya tenant dapat menyimpan jadwal bentrok tanpa menyadarinya.

## Goal

Tenant mendapat peringatan yang jelas di form jadwal ketika dua slot pada hari yang sama saling tumpang tindih, sebelum menyimpan, tanpa mengubah aturan bisnis bahwa overlap boleh disimpan.

## Requirements

- Form jadwal (wizard kelas dan modal tambah jadwal) menandai setiap slot yang waktunya tumpang tindih dengan slot lain pada hari yang sama dan menampilkan pesan peringatan yang menyebut slot terkait.
- Peringatan diperbarui saat slot diubah, dihapus, atau ditambah lewat generator.
- Peringatan tidak memblokir penyimpanan; slot yang hanya bersentuhan (akhir satu = mulai berikutnya) tidak dianggap tumpang tindih.
- Generator, pencegahan duplikat, dan payload `POST /api/v1/schedules` tidak berubah.

## Acceptance Criteria

- [ ] Slot Senin 08:00–09:30 dan Senin 09:00–10:30 menampilkan peringatan tumpang tindih.
- [ ] Slot Senin 08:00–09:30 dan Senin 09:30–11:00 tidak menampilkan peringatan.
- [ ] Menghapus salah satu slot yang bentrok menghilangkan peringatan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Apakah overlap jadwal grup boleh disimpan (mis. ruang atau tutor berbeda) adalah keputusan produk yang belum diambil, sehingga issue ini hanya menambah peringatan non-blokir di web. Waktu adalah wall-clock `HH:MM` tanpa zona. Letakkan logika deteksi overlap sebagai fungsi murni di `_lib` di samping logika generator. Perbarui kelolakelas-docs `docs/components/web.md` pada bagian form jadwal.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.test.tsx`

## Edge Cases

- Tiga slot atau lebih yang saling tumpang tindih.
- Slot dengan jam belum lengkap diisi.
- Slot yang bersentuhan tepat di batas waktu.

## Testing / Validation

- [ ] Unit test fungsi deteksi overlap untuk overlap, bersentuhan, hari berbeda, dan jam belum lengkap.
- [ ] Vitest form bahwa peringatan muncul dan hilang sesuai perubahan slot.
- [ ] Existing tests pass (termasuk `ScheduleForm.test.tsx` dan `ClassCreationWizard.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Validasi atau penolakan overlap di academic.
- Perubahan slot manual awal atau perilaku generator.
- Pengurutan tampilan jadwal di katalog dan detail kelas.

## AI Orchestrator Contract

```json
{
  "draftKey": "schedule-overlap-warning",
  "projectKey": null,
  "title": "Form jadwal kelas memperingatkan slot yang tumpang tindih pada hari yang sama sebelum disimpan",
  "type": "Improvement",
  "priority": "Low",
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
    "backgroundProblem": "QA membuat kelas grup lewat wizard. Generator slot (Senin & Selasa, 08:00, 90 menit, jeda 15) menambahkan 4 slot ke slot manual awal Senin 09:00–10:30, sehingga kelas tersimpan dengan 5 jadwal dan Senin 08:00–09:30 tumpang tindih dengan Senin 09:00–10:30 tanpa peringatan. Menambahkan slot generator ke slot manual adalah perilaku yang disengaja dan diuji (`ScheduleForm.test.tsx`), dan pencegahan duplikat di form hanya mencegah slot dengan hari dan jam yang persis sama. Academic tidak memvalidasi overlap, dan hal itu sengaja dikeluarkan dari scope KEL-112. Akibatnya tenant dapat menyimpan jadwal bentrok tanpa menyadarinya.",
    "goal": "Tenant mendapat peringatan yang jelas di form jadwal ketika dua slot pada hari yang sama saling tumpang tindih, sebelum menyimpan, tanpa mengubah aturan bisnis bahwa overlap boleh disimpan.",
    "requirements": [
      "Form jadwal (wizard kelas dan modal tambah jadwal) menandai setiap slot yang waktunya tumpang tindih dengan slot lain pada hari yang sama dan menampilkan pesan peringatan yang menyebut slot terkait.",
      "Peringatan diperbarui saat slot diubah, dihapus, atau ditambah lewat generator.",
      "Peringatan tidak memblokir penyimpanan; slot yang hanya bersentuhan (akhir satu = mulai berikutnya) tidak dianggap tumpang tindih.",
      "Generator, pencegahan duplikat, dan payload `POST /api/v1/schedules` tidak berubah."
    ],
    "acceptanceCriteria": [
      "Slot Senin 08:00–09:30 dan Senin 09:00–10:30 menampilkan peringatan tumpang tindih.",
      "Slot Senin 08:00–09:30 dan Senin 09:30–11:00 tidak menampilkan peringatan.",
      "Menghapus salah satu slot yang bentrok menghilangkan peringatan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Apakah overlap jadwal grup boleh disimpan (mis. ruang atau tutor berbeda) adalah keputusan produk yang belum diambil, sehingga issue ini hanya menambah peringatan non-blokir di web. Waktu adalah wall-clock `HH:MM` tanpa zona. Letakkan logika deteksi overlap sebagai fungsi murni di `_lib` di samping logika generator. Perbarui kelolakelas-docs `docs/components/web.md` pada bagian form jadwal.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AddScheduleModal.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.test.tsx"
    ],
    "edgeCases": [
      "Tiga slot atau lebih yang saling tumpang tindih.",
      "Slot dengan jam belum lengkap diisi.",
      "Slot yang bersentuhan tepat di batas waktu."
    ],
    "testingValidation": [
      "Unit test fungsi deteksi overlap untuk overlap, bersentuhan, hari berbeda, dan jam belum lengkap.",
      "Vitest form bahwa peringatan muncul dan hilang sesuai perubahan slot.",
      "Existing tests pass (termasuk `ScheduleForm.test.tsx` dan `ClassCreationWizard.test.tsx`), `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Validasi atau penolakan overlap di academic.",
      "Perubahan slot manual awal atau perilaku generator.",
      "Pengurutan tampilan jadwal di katalog dan detail kelas."
    ]
  }
}
```
