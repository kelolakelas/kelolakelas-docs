## Background / Problem

Invoice internal menerima `VoucherID` dan `DiscountAmount` dari pemanggil tanpa validasi atau hitungan pemakaian (`kelolakelas-billing-service/internal/domain/transaction.go:185-187`, `internal/usecase/transaction_usecase.go:155`). Checkout web hanya memilih channel (`kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts:42-120`).

## Goal

Parent dapat memasukkan kode voucher saat checkout kelas grup, dan diskon dihitung serta dicatat server-side tanpa melebihi batas voucher.

## Requirements

- Academic meneruskan kode voucher dari checkout kelas grup ke billing; billing sebagai satu-satunya penentu validitas dan nilai diskon.
- Billing memvalidasi voucher milik tenant kelas, aktif, dalam masa berlaku, memenuhi minimum transaksi, dan belum mencapai max_uses; diskon dibatasi max_discount_amount dan tidak melebihi subtotal.
- Pemakaian direservasi atomik saat invoice dibuat dan dilepas saat transaksi expired, cancelled, atau failed.
- Platform fee dihitung dari gross setelah diskon; penolakan `platform_fee_exceeds_gross` yang ada tetap berlaku.
- Web menampilkan input kode, pratinjau diskon, dan error validasi; replay idempotency tidak mengubah diskon invoice yang sudah terbit.

## Acceptance Criteria

- [ ] Voucher valid mengurangi nominal invoice dan tercatat pada transaksi.
- [ ] Voucher dengan sisa satu pemakaian yang dipakai dua checkout serentak hanya berhasil di satu checkout.
- [ ] Voucher tenant lain, kedaluwarsa, atau nonaktif ditolak dengan pesan jelas.
- [ ] Transaksi expired melepas pemakaian voucher.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebenaran harga dan pemakaian voucher berlebih. Klien tidak pernah mengirim nominal diskon. Reservasi menggunakan update bersyarat atau lock baris voucher dalam transaksi yang sama dengan invoice claim. Ikuti snapshot platform fee (ADR 0044) dan klaim invoice (ADR 0020). Kelas private dan renewal di luar scope. Perbarui `kelolakelas-docs` (api/academic.md, api/billing.md, flows/billing-and-subscriptions.md) dan ADR voucher.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/domain/transaction.go`
- `kelolakelas-billing-service/internal/domain/voucher.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/pkg/billing/client.go`
- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`

## Edge Cases

- Diskon membuat gross di bawah platform fee.
- Parent membatalkan enrollment pending yang memakai voucher.
- Voucher dinonaktifkan di antara pratinjau dan checkout.

## Testing / Validation

- [ ] Postgres integration test reservasi serentak dan pelepasan pada expiry sebagai mitigasi risiko pemakaian berlebih.
- [ ] Unit test perhitungan diskon, batas maksimum, dan interaksi platform fee.
- [ ] go vet, go test -race, build academic dan billing; test, lint, type check, dan build web lulus.
- [ ] Verifikasi sandbox checkout dengan voucher persen dan nominal.

## Out of Scope

- Voucher untuk kelas private dan renewal.
- Voucher otomatis tanpa kode.

## AI Orchestrator Contract

```json
{
  "draftKey": "voucher-checkout-redemption",
  "projectKey": "tenant-storefront-growth",
  "title": "Parent dapat memakai voucher tenant saat checkout kelas grup",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "L",
  "complexity": "critical",
  "labels": [
    "billing",
    "academic",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "billing",
    "academic",
    "web"
  ],
  "blockedByDraftKeys": [
    "tenant-voucher-management"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Invoice internal menerima `VoucherID` dan `DiscountAmount` dari pemanggil tanpa validasi atau hitungan pemakaian (`kelolakelas-billing-service/internal/domain/transaction.go:185-187`, `internal/usecase/transaction_usecase.go:155`). Checkout web hanya memilih channel (`kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts:42-120`).",
    "goal": "Parent dapat memasukkan kode voucher saat checkout kelas grup, dan diskon dihitung serta dicatat server-side tanpa melebihi batas voucher.",
    "requirements": [
      "Academic meneruskan kode voucher dari checkout kelas grup ke billing; billing sebagai satu-satunya penentu validitas dan nilai diskon.",
      "Billing memvalidasi voucher milik tenant kelas, aktif, dalam masa berlaku, memenuhi minimum transaksi, dan belum mencapai max_uses; diskon dibatasi max_discount_amount dan tidak melebihi subtotal.",
      "Pemakaian direservasi atomik saat invoice dibuat dan dilepas saat transaksi expired, cancelled, atau failed.",
      "Platform fee dihitung dari gross setelah diskon; penolakan `platform_fee_exceeds_gross` yang ada tetap berlaku.",
      "Web menampilkan input kode, pratinjau diskon, dan error validasi; replay idempotency tidak mengubah diskon invoice yang sudah terbit."
    ],
    "acceptanceCriteria": [
      "Voucher valid mengurangi nominal invoice dan tercatat pada transaksi.",
      "Voucher dengan sisa satu pemakaian yang dipakai dua checkout serentak hanya berhasil di satu checkout.",
      "Voucher tenant lain, kedaluwarsa, atau nonaktif ditolak dengan pesan jelas.",
      "Transaksi expired melepas pemakaian voucher.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebenaran harga dan pemakaian voucher berlebih. Klien tidak pernah mengirim nominal diskon. Reservasi menggunakan update bersyarat atau lock baris voucher dalam transaksi yang sama dengan invoice claim. Ikuti snapshot platform fee (ADR 0044) dan klaim invoice (ADR 0020). Kelas private dan renewal di luar scope. Perbarui `kelolakelas-docs` (api/academic.md, api/billing.md, flows/billing-and-subscriptions.md) dan ADR voucher.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/domain/transaction.go",
      "kelolakelas-billing-service/internal/domain/voucher.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/pkg/billing/client.go",
      "kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts"
    ],
    "edgeCases": [
      "Diskon membuat gross di bawah platform fee.",
      "Parent membatalkan enrollment pending yang memakai voucher.",
      "Voucher dinonaktifkan di antara pratinjau dan checkout."
    ],
    "testingValidation": [
      "Postgres integration test reservasi serentak dan pelepasan pada expiry sebagai mitigasi risiko pemakaian berlebih.",
      "Unit test perhitungan diskon, batas maksimum, dan interaksi platform fee.",
      "go vet, go test -race, build academic dan billing; test, lint, type check, dan build web lulus.",
      "Verifikasi sandbox checkout dengan voucher persen dan nominal."
    ],
    "outOfScope": [
      "Voucher untuk kelas private dan renewal.",
      "Voucher otomatis tanpa kode."
    ]
  }
}
```
