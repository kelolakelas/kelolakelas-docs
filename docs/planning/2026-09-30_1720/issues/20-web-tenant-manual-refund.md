## Background / Problem

Tidak ada UI untuk refund. Halaman transaksi tenant didraft pada issue terpisah.

## Goal

Anggota dengan `billing:refund` dapat mencatat refund manual untuk transaksi paid dari daftar transaksi.

## Requirements

- Aksi catat refund pada transaksi paid, disembunyikan tanpa permission.
- Dialog dengan alasan dan referensi transfer wajib serta peringatan bahwa enrollment akan diakhiri.
- Status transaksi dan enrollment diperbarui setelah berhasil.

## Acceptance Criteria

- [ ] Refund tercatat dan transaksi tampil sebagai refunded.
- [ ] Form tanpa alasan atau referensi tidak dapat dikirim.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Dialog in-page yang dapat diakses keyboard. Label refunded sudah dikenal di `lib/enrollment-cancellation.ts:34`, jadi tambahkan ke presentasi status bila belum ada. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Transaksi sudah di-refund oleh anggota lain.
- Backend gagal mengakhiri enrollment.

## Testing / Validation

- [ ] Vitest untuk dialog dan state error.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual alur refund.

## Out of Scope

- Refund parsial.
- Notifikasi refund ke parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-manual-refund",
  "projectKey": "renewal-dunning-refund",
  "title": "Tenant mencatat refund manual dari halaman transaksi",
  "type": "Feature",
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
  "blockedByDraftKeys": [
    "billing-manual-refund",
    "web-tenant-transactions-page"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada UI untuk refund. Halaman transaksi tenant didraft pada issue terpisah.",
    "goal": "Anggota dengan `billing:refund` dapat mencatat refund manual untuk transaksi paid dari daftar transaksi.",
    "requirements": [
      "Aksi catat refund pada transaksi paid, disembunyikan tanpa permission.",
      "Dialog dengan alasan dan referensi transfer wajib serta peringatan bahwa enrollment akan diakhiri.",
      "Status transaksi dan enrollment diperbarui setelah berhasil."
    ],
    "acceptanceCriteria": [
      "Refund tercatat dan transaksi tampil sebagai refunded.",
      "Form tanpa alasan atau referensi tidak dapat dikirim.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Dialog in-page yang dapat diakses keyboard. Label refunded sudah dikenal di `lib/enrollment-cancellation.ts:34`, jadi tambahkan ke presentasi status bila belum ada. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Transaksi sudah di-refund oleh anggota lain.",
      "Backend gagal mengakhiri enrollment."
    ],
    "testingValidation": [
      "Vitest untuk dialog dan state error.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual alur refund."
    ],
    "outOfScope": [
      "Refund parsial.",
      "Notifikasi refund ke parent."
    ]
  }
}
```
