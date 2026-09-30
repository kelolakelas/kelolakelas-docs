## Background / Problem

Pembacaan statis menunjukkan `billing-service/internal/usecase/transaction_usecase.go:290` memaksa PaymentMethod VC, sementara `academic-service/internal/usecase/enrollment_usecase.go:197,270,400` dan private flow `private_schedule_request_usecase.go:209` membuat invoice tanpa pilihan channel.

## Goal

Parent dapat memilih channel pembayaran sebelum invoice dibuat, tanpa mematahkan pemanggil lama atau idempotensi.

## Requirements

- Perluas request enrollment publik dan request invoice internal dengan channel opsional yang dibatasi ke channel Duitku yang benar-benar diverifikasi; pemanggil lama tanpa pilihan mempertahankan VC.
- Tentukan dan validasi channel pada boundary tepercaya sebelum menulis transaksi; channel pada replay idempotency tidak boleh mengganti invoice yang telah diterbitkan.
- Channel untuk pembelian private harus dapat dipilih parent hanya setelah persetujuan tenant, tanpa membuat enrollment/jadwal kedua; pertahankan link lama dan aturan fee policy.
- Jangan menerima data kartu atau CVV di sistem.

## Acceptance Criteria

- [ ] Invoice VA dan QRIS baru menggunakan channel yang diminta dan terbukti aktif di sandbox; kartu tetap mengikuti mekanisme provider.
- [ ] Request tanpa field channel dan transaksi yang sudah ada tetap berfungsi seperti sebelumnya.
- [ ] Replay atau dua request serentak dengan channel berbeda tidak menghasilkan dua invoice atau perubahan channel transaksi yang sudah terbit.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: harga/invoice ganda dan status paid yang tidak sesuai enrollment saat channel berubah atau request diulang. Jangan mengganti link transaksi existing. Tinjau `ClaimInvoice`, `ClaimReinvoice`, `merchant_order_id`, fee snapshot dan `PrivateScheduleRequest.purchase`; rancangan pemilihan ulang channel saat invoice belum lunas membutuhkan keputusan eksplisit, default: tolak perubahan terhadap invoice yang masih valid. Owner menyatakan merchant telah mengaktifkan semua channel; ini bukan bukti sandbox. Kontrak request harus kompatibel dengan klien lama. Perbarui docs API academic/billing, billing flow dan ADR bila model berubah.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/domain/transaction.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-academic-service/pkg/billing/client.go`

## Edge Cases

- Provider tidak mengaktifkan channel tertentu meski merchant menyatakan aktif.
- Dua request checkout simultan memakai channel berbeda untuk enrollment sama.
- Parent menerima rekomendasi jadwal setelah invoice lama diterbitkan.

## Testing / Validation

- [ ] Uji sandbox provider dengan VA, QRIS dan kartu; catat kode channel dan respons aktual tanpa data rahasia.
- [ ] Integration test idempotensi serta race dua channel, callback paid, expiry, dan fee snapshot tanpa duplikasi.
- [ ] Uji kompatibilitas request lama tanpa channel dan penolakan channel tak dikenal; jalankan go test -race, go vet dan build.
- [ ] Verifikasi alur private dari persetujuan sampai invoice tanpa enrollment kedua.

## Out of Scope

- Penyimpanan data kartu/PCI dan halaman payment UI.
- Ganti channel pada invoice aktif sebelum keputusan produk terpisah.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-payment-channel-selection",
  "projectKey": "payment-experience-owned-page",
  "title": "Billing menerima pilihan channel VA/QRIS atau kartu untuk invoice baru",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "repositories": [
    "academic",
    "billing"
  ],
  "labels": [
    "academic",
    "billing",
    "ai-ready"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Pembacaan statis menunjukkan `billing-service/internal/usecase/transaction_usecase.go:290` memaksa PaymentMethod VC, sementara `academic-service/internal/usecase/enrollment_usecase.go:197,270,400` dan private flow `private_schedule_request_usecase.go:209` membuat invoice tanpa pilihan channel.",
    "goal": "Parent dapat memilih channel pembayaran sebelum invoice dibuat, tanpa mematahkan pemanggil lama atau idempotensi.",
    "requirements": [
      "Perluas request enrollment publik dan request invoice internal dengan channel opsional yang dibatasi ke channel Duitku yang benar-benar diverifikasi; pemanggil lama tanpa pilihan mempertahankan VC.",
      "Tentukan dan validasi channel pada boundary tepercaya sebelum menulis transaksi; channel pada replay idempotency tidak boleh mengganti invoice yang telah diterbitkan.",
      "Channel untuk pembelian private harus dapat dipilih parent hanya setelah persetujuan tenant, tanpa membuat enrollment/jadwal kedua; pertahankan link lama dan aturan fee policy.",
      "Jangan menerima data kartu atau CVV di sistem."
    ],
    "acceptanceCriteria": [
      "Invoice VA dan QRIS baru menggunakan channel yang diminta dan terbukti aktif di sandbox; kartu tetap mengikuti mekanisme provider.",
      "Request tanpa field channel dan transaksi yang sudah ada tetap berfungsi seperti sebelumnya.",
      "Replay atau dua request serentak dengan channel berbeda tidak menghasilkan dua invoice atau perubahan channel transaksi yang sudah terbit.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: harga/invoice ganda dan status paid yang tidak sesuai enrollment saat channel berubah atau request diulang. Jangan mengganti link transaksi existing. Tinjau `ClaimInvoice`, `ClaimReinvoice`, `merchant_order_id`, fee snapshot dan `PrivateScheduleRequest.purchase`; rancangan pemilihan ulang channel saat invoice belum lunas membutuhkan keputusan eksplisit, default: tolak perubahan terhadap invoice yang masih valid. Owner menyatakan merchant telah mengaktifkan semua channel; ini bukan bukti sandbox. Kontrak request harus kompatibel dengan klien lama. Perbarui docs API academic/billing, billing flow dan ADR bila model berubah.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/domain/transaction.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-academic-service/pkg/billing/client.go"
    ],
    "edgeCases": [
      "Provider tidak mengaktifkan channel tertentu meski merchant menyatakan aktif.",
      "Dua request checkout simultan memakai channel berbeda untuk enrollment sama.",
      "Parent menerima rekomendasi jadwal setelah invoice lama diterbitkan."
    ],
    "testingValidation": [
      "Uji sandbox provider dengan VA, QRIS dan kartu; catat kode channel dan respons aktual tanpa data rahasia.",
      "Integration test idempotensi serta race dua channel, callback paid, expiry, dan fee snapshot tanpa duplikasi.",
      "Uji kompatibilitas request lama tanpa channel dan penolakan channel tak dikenal; jalankan go test -race, go vet dan build.",
      "Verifikasi alur private dari persetujuan sampai invoice tanpa enrollment kedua."
    ],
    "outOfScope": [
      "Penyimpanan data kartu/PCI dan halaman payment UI.",
      "Ganti channel pada invoice aktif sebelum keputusan produk terpisah."
    ]
  }
}
```
