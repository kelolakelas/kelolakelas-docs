## Background / Problem

Testing 16 Oktober 2026: Create Category menutup modal dan langsung persist; class juga sudah dibuat sebelum schedule. CategoryForm dan ClassForm mengirim mutasi terpisah. Intended advance callback ada, akar modal close belum direproduksi.

## Goal

Tenant menyelesaikan kategori, kelas dan jadwal sebagai satu draft sebelum penyimpanan final.

## Requirements

- Simpan draft kategori baru, class details, teacher selection dan slots di state lokal; jangan panggil createCategory/createClass/createSchedule pada langkah perantara.
- Create Category memilih kategori draft lalu maju ke detail kelas dengan modal tetap terbuka.
- Back/Next mempertahankan input; cancel/close/navigation membuang draft tanpa mutasi.
- Final submit memanggil aggregate API satu kali, menampilkan pending/error, mencegah klik ganda; gagal tetap membuka form dengan input utuh.
- Pertahankan kategori standalone CRUD, generator/manual slots, overlap guidance dan teacher picker; private memiliki final submit tanpa creation-time schedule.

## Acceptance Criteria

- [ ] Create Category maju ke langkah berikutnya dengan kategori input terpilih dan tanpa request mutasi.
- [ ] Sebelum final submit, termasuk semua jalur cancel/navigation, tidak ada kategori/class/schedule/session baru.
- [ ] Final submit sukses menampilkan seluruh hasil commit; gagal tidak membuat partial data dan mempertahankan draft.
- [ ] Private dapat diselesaikan tanpa group schedule; standalone category CRUD tetap bekerja.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti CategoryForm.tsx:55, ClassForm.tsx:55, ClassCreationWizard.tsx:93/:98 dan classActions.ts:189/:254. Depends on aggregate API. Jangan menyimpulkan revalidate sebagai akar modal close tanpa reproduksi. Update docs web/flow academic.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/CategoryForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`

## Edge Cases

- Back lalu mengganti kategori; close di setiap langkah.
- Timeout dengan hasil commit belum diketahui, double submit dan retry.

## Testing / Validation

- [ ] Flow test interaktif mengamati nol mutasi sebelum final, Back/Next/cancel, satu final aggregate request, draft retention saat error.
- [ ] Integrasi API/DB membuktikan cancel nol writes, final sukses complete writes dan gagal nol partial writes.
- [ ] Verifikasi keyboard/focus, group/private, manual/generator, teacher selection dan standalone category CRUD.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Persistensi draft lintas browser/session.
- Redesign halaman kategori.

## AI Orchestrator Contract

```json
{
  "draftKey": "deferred-class-creation-wizard",
  "projectKey": "tenant-selling-operations",
  "title": "Jadikan wizard kelas draft lokal sampai final submit berhasil",
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
  "blockedByDraftKeys": [
    "atomic-class-creation-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Testing 16 Oktober 2026: Create Category menutup modal dan langsung persist; class juga sudah dibuat sebelum schedule. CategoryForm dan ClassForm mengirim mutasi terpisah. Intended advance callback ada, akar modal close belum direproduksi.",
    "goal": "Tenant menyelesaikan kategori, kelas dan jadwal sebagai satu draft sebelum penyimpanan final.",
    "requirements": [
      "Simpan draft kategori baru, class details, teacher selection dan slots di state lokal; jangan panggil createCategory/createClass/createSchedule pada langkah perantara.",
      "Create Category memilih kategori draft lalu maju ke detail kelas dengan modal tetap terbuka.",
      "Back/Next mempertahankan input; cancel/close/navigation membuang draft tanpa mutasi.",
      "Final submit memanggil aggregate API satu kali, menampilkan pending/error, mencegah klik ganda; gagal tetap membuka form dengan input utuh.",
      "Pertahankan kategori standalone CRUD, generator/manual slots, overlap guidance dan teacher picker; private memiliki final submit tanpa creation-time schedule."
    ],
    "acceptanceCriteria": [
      "Create Category maju ke langkah berikutnya dengan kategori input terpilih dan tanpa request mutasi.",
      "Sebelum final submit, termasuk semua jalur cancel/navigation, tidak ada kategori/class/schedule/session baru.",
      "Final submit sukses menampilkan seluruh hasil commit; gagal tidak membuat partial data dan mempertahankan draft.",
      "Private dapat diselesaikan tanpa group schedule; standalone category CRUD tetap bekerja.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti CategoryForm.tsx:55, ClassForm.tsx:55, ClassCreationWizard.tsx:93/:98 dan classActions.ts:189/:254. Depends on aggregate API. Jangan menyimpulkan revalidate sebagai akar modal close tanpa reproduksi. Update docs web/flow academic.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/CategoryForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts"
    ],
    "edgeCases": [
      "Back lalu mengganti kategori; close di setiap langkah.",
      "Timeout dengan hasil commit belum diketahui, double submit dan retry."
    ],
    "testingValidation": [
      "Flow test interaktif mengamati nol mutasi sebelum final, Back/Next/cancel, satu final aggregate request, draft retention saat error.",
      "Integrasi API/DB membuktikan cancel nol writes, final sukses complete writes dan gagal nol partial writes.",
      "Verifikasi keyboard/focus, group/private, manual/generator, teacher selection dan standalone category CRUD.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Persistensi draft lintas browser/session.",
      "Redesign halaman kategori."
    ]
  }
}
```
