## Background / Problem

`app/(dashboard)/dashboard/parent/enrollments/page.tsx:21` membangun `new Map(transactions.map(t => [t.enrollment_id, t]))` sehingga baris terakhir menang, padahal billing mengembalikan transaksi `created_at DESC`. Parent dengan renewal melihat transaksi tertua; halaman tenant sudah memilih `transactions[0]`.

## Goal

Parent melihat status pembayaran terbaru dan tagihan perpanjangan yang masih harus dibayar untuk setiap enrollment.

## Requirements

- Pilih transaksi terbaru per enrollment secara eksplisit berdasarkan waktu, bukan urutan array.
- Tandai transaksi renewal (order id `renewal-`) sebagai tagihan perpanjangan dengan periode dan batas waktu bila tersedia, serta aksi bayar melalui alur resume yang ada.
- Status enrollment yang tidak dikenal web ditampilkan dengan label netral yang terbaca.

## Acceptance Criteria

- [ ] Enrollment dengan transaksi awal paid dan renewal pending menampilkan renewal pending beserta aksi bayar.
- [ ] Urutan respons API yang berbeda tidak mengubah transaksi yang dipilih.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan helper yang ada di `lib/payment-status.ts` (deteksi renewal di baris 28) dan `resumePayment`. Samakan logika pemilihan dengan halaman tenant bila memungkinkan. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Enrollment tanpa transaksi.
- Dua transaksi dengan created_at sama.

## Testing / Validation

- [ ] Vitest untuk pemilihan transaksi terbaru dengan berbagai urutan dan renewal.
- [ ] Test, lint, type check, dan production build lulus.

## Out of Scope

- Status tangguh dari backend (issue suspend).
- Riwayat seluruh transaksi.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-parent-latest-payment-status",
  "projectKey": "renewal-dunning-refund",
  "title": "Parent melihat status transaksi terbaru dan tagihan perpanjangan pada setiap enrollment",
  "type": "Improvement",
  "priority": "High",
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
    "backgroundProblem": "`app/(dashboard)/dashboard/parent/enrollments/page.tsx:21` membangun `new Map(transactions.map(t => [t.enrollment_id, t]))` sehingga baris terakhir menang, padahal billing mengembalikan transaksi `created_at DESC`. Parent dengan renewal melihat transaksi tertua; halaman tenant sudah memilih `transactions[0]`.",
    "goal": "Parent melihat status pembayaran terbaru dan tagihan perpanjangan yang masih harus dibayar untuk setiap enrollment.",
    "requirements": [
      "Pilih transaksi terbaru per enrollment secara eksplisit berdasarkan waktu, bukan urutan array.",
      "Tandai transaksi renewal (order id `renewal-`) sebagai tagihan perpanjangan dengan periode dan batas waktu bila tersedia, serta aksi bayar melalui alur resume yang ada.",
      "Status enrollment yang tidak dikenal web ditampilkan dengan label netral yang terbaca."
    ],
    "acceptanceCriteria": [
      "Enrollment dengan transaksi awal paid dan renewal pending menampilkan renewal pending beserta aksi bayar.",
      "Urutan respons API yang berbeda tidak mengubah transaksi yang dipilih.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan helper yang ada di `lib/payment-status.ts` (deteksi renewal di baris 28) dan `resumePayment`. Samakan logika pemilihan dengan halaman tenant bila memungkinkan. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Enrollment tanpa transaksi.",
      "Dua transaksi dengan created_at sama."
    ],
    "testingValidation": [
      "Vitest untuk pemilihan transaksi terbaru dengan berbagai urutan dan renewal.",
      "Test, lint, type check, dan production build lulus."
    ],
    "outOfScope": [
      "Status tangguh dari backend (issue suspend).",
      "Riwayat seluruh transaksi."
    ]
  }
}
```
