## Background / Problem

Testing 16 Oktober 2026: Edit baru meliputi nama, harga, deskripsi, kategori; Add Schedule terpisah di desktop/mobile. Permanent schedule API belum mencakup capacity/location sehingga parity memerlukan web dan academic.

## Goal

Satu Edit Class mencakup semua konfigurasi kelas yang sah dengan menjaga enrollment dan riwayat.

## Requirements

- Reuse model form create untuk kategori, detail dan jadwal; preload nilai existing.
- Dukung kategori existing/baru, seluruh mutable class details, penugasan pengajar yang relevan, tambah/edit/hapus jadwal group sesuai izin.
- Lengkapi kontrak academic untuk field create yang belum dapat diedit seperti capacity/location memakai effective-date/history semantics existing.
- Tampilkan tipe kelas read-only beserta alasan; private schedule tetap mengikuti enrollment.
- Jaga sold price snapshots, attendance, sesi historis, seat/enrollment associations, tenant isolation dan permission checks.
- Hapus Add Schedule desktop/mobile setelah capability tersedia lewat editor; tampilkan kegagalan per operasi dan state tersimpan secara jujur.

## Acceptance Criteria

- [ ] Edit memuat semua data existing dan dapat mengelola kategori, mutable class fields serta group schedules termasuk kelas tanpa jadwal.
- [ ] Day/time/tutor/capacity/location yang tersedia di create dapat dikelola sesuai aturan domain dan validation yang jelas.
- [ ] Tipe terlihat read-only dan private tidak mendapat jadwal group tanpa enrollment.
- [ ] Effective-date edits menjaga attendance/history/enrollment dan snapshot harga.
- [ ] Add Schedule tidak tampil di desktop/mobile, sementara tambah jadwal tetap tersedia dalam Edit Class.
- [ ] Foreign-tenant/unauthorized edits ditolak; kegagalan tidak ditampilkan sebagai sukses.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti ClassEditForm.tsx:48/:75, ClassListTable.tsx:249/:326; academic domain/schedule_dto.go:47/:72, class_usecase.go:112/:158, schedule_usecase.go:434. Risiko high: capacity/location/tutor edits dapat merusak seat dan history; mitigasi integration tests enrolled schedules dan validasi transaksi. Dependency wizard menstabilkan shared model. Asumsi eksplisit lengkap mencakup semua field mutable; konversi tipe memerlukan keputusan domain terpisah. Update API dan flow effective-date. Jangan ubah gateway jika route existing cukup.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassEditForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`
- `kelolakelas-academic-service/internal/domain/schedule_dto.go`
- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`

## Edge Cases

- Capacity di bawah enrollment aktif; tutor tidak aktif; effective date sebelum attendance.
- Class tanpa jadwal; private dengan enrollment; izin class:update tanpa schedule/category mutation.

## Testing / Validation

- [ ] Uji preload/save/reopen seluruh mutable fields, create category dan schedule management serta kedua layout list.
- [ ] Integration tests enrolled schedules/attendance: effective-date, capacity/location/tutor, tenant denial, rollback invalid changes, price snapshots.
- [ ] Uji partial failure UI dan pembacaan ulang state tersimpan.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Konversi group/private dan perubahan sesi historis.
- Kebijakan payment/enrollment baru.

## AI Orchestrator Contract

```json
{
  "draftKey": "complete-class-editor",
  "projectKey": "tenant-selling-operations",
  "title": "Lengkapi edit kelas dengan kategori dan jadwal, lalu hapus Add Schedule terpisah",
  "type": "Improvement",
  "priority": "High",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "web",
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "web",
    "academic"
  ],
  "blockedByDraftKeys": [
    "deferred-class-creation-wizard"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Testing 16 Oktober 2026: Edit baru meliputi nama, harga, deskripsi, kategori; Add Schedule terpisah di desktop/mobile. Permanent schedule API belum mencakup capacity/location sehingga parity memerlukan web dan academic.",
    "goal": "Satu Edit Class mencakup semua konfigurasi kelas yang sah dengan menjaga enrollment dan riwayat.",
    "requirements": [
      "Reuse model form create untuk kategori, detail dan jadwal; preload nilai existing.",
      "Dukung kategori existing/baru, seluruh mutable class details, penugasan pengajar yang relevan, tambah/edit/hapus jadwal group sesuai izin.",
      "Lengkapi kontrak academic untuk field create yang belum dapat diedit seperti capacity/location memakai effective-date/history semantics existing.",
      "Tampilkan tipe kelas read-only beserta alasan; private schedule tetap mengikuti enrollment.",
      "Jaga sold price snapshots, attendance, sesi historis, seat/enrollment associations, tenant isolation dan permission checks.",
      "Hapus Add Schedule desktop/mobile setelah capability tersedia lewat editor; tampilkan kegagalan per operasi dan state tersimpan secara jujur."
    ],
    "acceptanceCriteria": [
      "Edit memuat semua data existing dan dapat mengelola kategori, mutable class fields serta group schedules termasuk kelas tanpa jadwal.",
      "Day/time/tutor/capacity/location yang tersedia di create dapat dikelola sesuai aturan domain dan validation yang jelas.",
      "Tipe terlihat read-only dan private tidak mendapat jadwal group tanpa enrollment.",
      "Effective-date edits menjaga attendance/history/enrollment dan snapshot harga.",
      "Add Schedule tidak tampil di desktop/mobile, sementara tambah jadwal tetap tersedia dalam Edit Class.",
      "Foreign-tenant/unauthorized edits ditolak; kegagalan tidak ditampilkan sebagai sukses.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti ClassEditForm.tsx:48/:75, ClassListTable.tsx:249/:326; academic domain/schedule_dto.go:47/:72, class_usecase.go:112/:158, schedule_usecase.go:434. Risiko high: capacity/location/tutor edits dapat merusak seat dan history; mitigasi integration tests enrolled schedules dan validasi transaksi. Dependency wizard menstabilkan shared model. Asumsi eksplisit lengkap mencakup semua field mutable; konversi tipe memerlukan keputusan domain terpisah. Update API dan flow effective-date. Jangan ubah gateway jika route existing cukup.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassEditForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts",
      "kelolakelas-academic-service/internal/domain/schedule_dto.go",
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go"
    ],
    "edgeCases": [
      "Capacity di bawah enrollment aktif; tutor tidak aktif; effective date sebelum attendance.",
      "Class tanpa jadwal; private dengan enrollment; izin class:update tanpa schedule/category mutation."
    ],
    "testingValidation": [
      "Uji preload/save/reopen seluruh mutable fields, create category dan schedule management serta kedua layout list.",
      "Integration tests enrolled schedules/attendance: effective-date, capacity/location/tutor, tenant denial, rollback invalid changes, price snapshots.",
      "Uji partial failure UI dan pembacaan ulang state tersimpan.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Konversi group/private dan perubahan sesi historis.",
      "Kebijakan payment/enrollment baru."
    ]
  }
}
```
