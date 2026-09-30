## Tujuan/outcome

Tenant dapat melihat saldo, mutasi, dan transaksi yang dapat diekspor, lalu mengajukan penarikan ke rekening terdaftar yang diproses manual oleh platform admin.

## Masalah yang diselesaikan

Pembayaran parent sudah dikreditkan ke wallet dan ledger tenant, tetapi tenant tidak dapat melihat saldo, mendaftarkan rekening, atau menarik dana; laporan transaksi hanya berupa kartu ringkasan tanpa daftar lengkap maupun ekspor.

## Nilai dan prioritas

High: tanpa pencairan dana, tenant tidak menerima hasil penjualan; laporan transaksi dibutuhkan untuk pembukuan dan rekonsiliasi.

## Scope

- API saldo, mutasi ledger, dan rekening bank tenant.
- Pengajuan penarikan oleh tenant dengan penahanan saldo yang atomik.
- Pemrosesan penarikan manual oleh platform admin dengan pengecekan assignment aktif.
- Daftar transaksi tenant dengan filter dan ekspor CSV.
- Layar keuangan tenant dan antrean penarikan platform.

## Di luar scope

- Disbursement otomatis via API provider.
- Payout terjadwal otomatis dan biaya admin penarikan selain nol.
- Faktur pajak atau integrasi akuntansi.

## Success metrics

- Setiap penarikan yang dibayar atau ditolak tercermin di ledger dengan saldo akhir yang sama dengan jumlah mutasinya.
- Tenant dapat mengekspor transaksi untuk rentang tanggal yang dipilih dan totalnya cocok dengan ringkasan penjualan.

## Dependencies/risiko

- Risiko kebenaran finansial: double spend saldo, penarikan ganda, dan perubahan rekening saat penarikan berjalan.
- Billing belum memiliki cara memverifikasi platform admin secara live; butuh kemampuan baru dari identity.
- Ledger saat ini tidak dikreditkan untuk transaksi sandbox; perilaku ini harus dipertahankan dan didokumentasikan.

## Issue yang diusulkan

1. Tenant dapat melihat saldo dan mutasi ledger serta mengelola rekening pencairan (`billing-tenant-balance-bank-account`)
2. Tenant dapat mengajukan dan membatalkan penarikan dengan saldo yang ditahan secara atomik (`billing-tenant-withdrawal-request`)
3. Platform admin memproses penarikan tenant secara manual dengan jejak audit (`platform-withdrawal-processing`)
4. Tenant melihat saldo, mutasi, rekening, dan mengajukan penarikan dari halaman keuangan (`web-tenant-finance`)
5. Platform admin memproses antrean penarikan tenant dari dashboard platform (`web-platform-withdrawal-queue`)
6. Tenant dapat memfilter transaksi berdasarkan tanggal bayar dan mengekspornya ke CSV (`billing-transaction-report-export`)
7. Tenant melihat daftar transaksi dengan filter dan mengunduh CSV (`web-tenant-transactions-page`)

## AI Orchestrator Project Contract

```json
{
  "key": "tenant-finance-payout",
  "name": "Keuangan tenant: laporan transaksi dan pencairan dana manual",
  "outcome": "Tenant dapat melihat saldo, mutasi, dan transaksi yang dapat diekspor, lalu mengajukan penarikan ke rekening terdaftar yang diproses manual oleh platform admin.",
  "problem": "Pembayaran parent sudah dikreditkan ke wallet dan ledger tenant, tetapi tenant tidak dapat melihat saldo, mendaftarkan rekening, atau menarik dana; laporan transaksi hanya berupa kartu ringkasan tanpa daftar lengkap maupun ekspor.",
  "valueAndPriority": "High: tanpa pencairan dana, tenant tidak menerima hasil penjualan; laporan transaksi dibutuhkan untuk pembukuan dan rekonsiliasi.",
  "scope": [
    "API saldo, mutasi ledger, dan rekening bank tenant.",
    "Pengajuan penarikan oleh tenant dengan penahanan saldo yang atomik.",
    "Pemrosesan penarikan manual oleh platform admin dengan pengecekan assignment aktif.",
    "Daftar transaksi tenant dengan filter dan ekspor CSV.",
    "Layar keuangan tenant dan antrean penarikan platform."
  ],
  "outOfScope": [
    "Disbursement otomatis via API provider.",
    "Payout terjadwal otomatis dan biaya admin penarikan selain nol.",
    "Faktur pajak atau integrasi akuntansi."
  ],
  "successMetrics": [
    "Setiap penarikan yang dibayar atau ditolak tercermin di ledger dengan saldo akhir yang sama dengan jumlah mutasinya.",
    "Tenant dapat mengekspor transaksi untuk rentang tanggal yang dipilih dan totalnya cocok dengan ringkasan penjualan."
  ],
  "dependenciesAndRisks": [
    "Risiko kebenaran finansial: double spend saldo, penarikan ganda, dan perubahan rekening saat penarikan berjalan.",
    "Billing belum memiliki cara memverifikasi platform admin secara live; butuh kemampuan baru dari identity.",
    "Ledger saat ini tidak dikreditkan untuk transaksi sandbox; perilaku ini harus dipertahankan dan didokumentasikan."
  ]
}
```
