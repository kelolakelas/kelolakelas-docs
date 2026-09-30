## Tujuan/outcome

Parent dapat memilih VA atau QRIS dan melihat instruksi pembayaran di KelolaKelas; channel kartu yang membutuhkan otorisasi eksternal tetap diarahkan ke Duitku.

## Masalah yang diselesaikan

Billing memaksa VC dan hanya menyimpan paymentUrl, sehingga web harus redirect dan tidak dapat menampilkan VA atau QR.

## Nilai dan prioritas

High: konversi checkout dan kejelasan status transaksi; perubahan finansial dikerjakan berlapis dengan kontrak kompatibel.

## Scope

- Pemilihan channel pada invoicing yang terikat enrollment dan validasi server.
- Instruksi pembayaran VA/QR dan status/expiry pada API yang terotorisasi.
- Halaman pembayaran parent yang mengonsumsi instruksi dan tetap mengarahkan kartu ke provider.

## Di luar scope

- Mengumpulkan nomor kartu/CVV di KelolaKelas atau menghilangkan 3DS provider.
- Cart, voucher, refund, dan payout.

## Success metrics

- Parent melihat detail pembayaran VA/QR yang sesuai transaksi miliknya tanpa redirect; kartu tetap melalui hosted provider.
- Tidak ada instruksi pembayaran yang terlihat lintas parent/tenant dan callback tidak menghasilkan invoice ganda.

## Dependencies/risiko

- Owner menyatakan seluruh channel merchant Duitku aktif; verifikasi respons sandbox per channel sebelum deploy.
- Risiko instruksi kedaluwarsa dan duplikasi provider ditangani oleh invariant invoice claim/idempotency yang ada.

## Issue yang diusulkan

1. Billing menerima pilihan channel VA/QRIS atau kartu untuk invoice baru (`billing-payment-channel-selection`)
2. Billing menyimpan dan menyajikan instruksi pembayaran VA/QR untuk transaksi milik parent (`billing-payment-instructions`)
3. Parent membayar VA/QRIS dari halaman KelolaKelas dan kartu melalui redirect Duitku (`web-payment-page`)

## AI Orchestrator Project Contract

```json
{
  "key": "payment-experience-owned-page",
  "name": "Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas",
  "outcome": "Parent dapat memilih VA atau QRIS dan melihat instruksi pembayaran di KelolaKelas; channel kartu yang membutuhkan otorisasi eksternal tetap diarahkan ke Duitku.",
  "problem": "Billing memaksa VC dan hanya menyimpan paymentUrl, sehingga web harus redirect dan tidak dapat menampilkan VA atau QR.",
  "valueAndPriority": "High: konversi checkout dan kejelasan status transaksi; perubahan finansial dikerjakan berlapis dengan kontrak kompatibel.",
  "scope": [
    "Pemilihan channel pada invoicing yang terikat enrollment dan validasi server.",
    "Instruksi pembayaran VA/QR dan status/expiry pada API yang terotorisasi.",
    "Halaman pembayaran parent yang mengonsumsi instruksi dan tetap mengarahkan kartu ke provider."
  ],
  "outOfScope": [
    "Mengumpulkan nomor kartu/CVV di KelolaKelas atau menghilangkan 3DS provider.",
    "Cart, voucher, refund, dan payout."
  ],
  "successMetrics": [
    "Parent melihat detail pembayaran VA/QR yang sesuai transaksi miliknya tanpa redirect; kartu tetap melalui hosted provider.",
    "Tidak ada instruksi pembayaran yang terlihat lintas parent/tenant dan callback tidak menghasilkan invoice ganda."
  ],
  "dependenciesAndRisks": [
    "Owner menyatakan seluruh channel merchant Duitku aktif; verifikasi respons sandbox per channel sebelum deploy.",
    "Risiko instruksi kedaluwarsa dan duplikasi provider ditangani oleh invariant invoice claim/idempotency yang ada."
  ]
}
```
