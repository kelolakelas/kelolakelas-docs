## Background / Problem

Testing 16 Oktober 2026: Waktu valid from/until belum default ke awal/akhir hari. Existing form memotong detik ke menit; action memakai konversi local datetime ke ISO.

## Goal

Tanggal voucher baru menggunakan default 00:00:00 dan 23:59:59 dengan detik terjaga.

## Requirements

- Saat memilih tanggal baru, default valid from ke 00:00:00 dan valid until ke 23:59:59.
- Pertahankan detik di input/action/API roundtrip serta timezone semantics existing secara konsisten.
- Jangan menimpa waktu yang sengaja diubah atau waktu voucher tersimpan saat edit tanpa perubahan field.
- Pertahankan validasi urutan rentang dan eligibility voucher existing.

## Acceptance Criteria

- [ ] Payload new date merepresentasikan waktu lokal 00:00:00/23:59:59 setelah ISO conversion.
- [ ] Edit tanpa perubahan waktu mempertahankan detik/waktu existing.
- [ ] Tanggal tidak bergeser dan rentang invalid menghasilkan pesan error.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti VoucherForm.tsx:19/:60/:229/:246; voucherActions.ts:59. Asumsi default berlaku tanggal baru, bukan otomatis memilih hari ini atau memaksa overwrite edit. Tidak ada evidence perlu billing change. Dokumentasikan timezone dan default.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/vouchers/_components/VoucherForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/vouchers/_actions/voucherActions.ts`

## Edge Cases

- Tanggal sama, akhir bulan/tahun, saved nonzero seconds.
- UTC/Asia Jakarta, tanggal diubah setelah waktu sengaja diatur.

## Testing / Validation

- [ ] Uji create/edit serta action payload: 23:59:59 tidak menjadi 23:59:00.
- [ ] Uji UTC dan Asia/Jakarta roundtrip, stored times dan invalid ranges.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Redemption policy, discount calculation dan billing API baru.

## AI Orchestrator Contract

```json
{
  "draftKey": "voucher-day-boundary-defaults",
  "projectKey": null,
  "title": "Default waktu voucher dari 00:00:00 sampai 23:59:59",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
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
    "backgroundProblem": "Testing 16 Oktober 2026: Waktu valid from/until belum default ke awal/akhir hari. Existing form memotong detik ke menit; action memakai konversi local datetime ke ISO.",
    "goal": "Tanggal voucher baru menggunakan default 00:00:00 dan 23:59:59 dengan detik terjaga.",
    "requirements": [
      "Saat memilih tanggal baru, default valid from ke 00:00:00 dan valid until ke 23:59:59.",
      "Pertahankan detik di input/action/API roundtrip serta timezone semantics existing secara konsisten.",
      "Jangan menimpa waktu yang sengaja diubah atau waktu voucher tersimpan saat edit tanpa perubahan field.",
      "Pertahankan validasi urutan rentang dan eligibility voucher existing."
    ],
    "acceptanceCriteria": [
      "Payload new date merepresentasikan waktu lokal 00:00:00/23:59:59 setelah ISO conversion.",
      "Edit tanpa perubahan waktu mempertahankan detik/waktu existing.",
      "Tanggal tidak bergeser dan rentang invalid menghasilkan pesan error.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti VoucherForm.tsx:19/:60/:229/:246; voucherActions.ts:59. Asumsi default berlaku tanggal baru, bukan otomatis memilih hari ini atau memaksa overwrite edit. Tidak ada evidence perlu billing change. Dokumentasikan timezone dan default.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/vouchers/_components/VoucherForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/vouchers/_actions/voucherActions.ts"
    ],
    "edgeCases": [
      "Tanggal sama, akhir bulan/tahun, saved nonzero seconds.",
      "UTC/Asia Jakarta, tanggal diubah setelah waktu sengaja diatur."
    ],
    "testingValidation": [
      "Uji create/edit serta action payload: 23:59:59 tidak menjadi 23:59:00.",
      "Uji UTC dan Asia/Jakarta roundtrip, stored times dan invalid ranges.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Redemption policy, discount calculation dan billing API baru."
    ]
  }
}
```
