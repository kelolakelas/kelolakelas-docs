## Tujuan/outcome

Enrollment yang tagihan perpanjangannya tidak dibayar melewati masa tenggang ditangguhkan dan kursinya dilepas, dapat pulih bila pembayaran terlambat diterima, dan tenant dapat mencatat refund manual dengan konsekuensi yang konsisten.

## Masalah yang diselesaikan

Setelah masa penagihan lewat, worker renewal berhenti tanpa konsekuensi dan subscription tetap aktif; status enrollment tidak punya bentuk tangguh, refund tidak pernah ditulis, dan parent melihat transaksi tertua alih-alih yang terbaru.

## Nilai dan prioritas

High untuk tunggakan (akses tanpa bayar dan kursi terkunci), Medium untuk refund (kebutuhan administratif dengan keputusan manual).

## Scope

- Status tangguh enrollment beserta endpoint internal suspend, resume, dan end.
- Masa tenggang renewal lalu suspend, serta resume saat pembayaran terlambat.
- Status pembayaran terbaru dan tagihan perpanjangan di web parent.
- Pencatatan refund manual oleh tenant beserta permission-nya.

## Di luar scope

- Refund otomatis melalui API provider.
- Refund parsial.
- Penagihan denda atau bunga keterlambatan.

## Success metrics

- Tidak ada enrollment aktif yang periodenya lewat masa tenggang tanpa pembayaran.
- Setiap refund tercatat dengan alasan, referensi, pelaku, dan enrollment terkait diakhiri.

## Dependencies/risiko

- Keputusan owner: masa tenggang lalu suspend dengan kursi dilepas; refund dicatat manual oleh tenant.
- Pertanyaan terbuka: apakah refund manual juga mengurangi saldo wallet tenant. Default draft: pencatatan saja tanpa mutasi ledger.
- Risiko race antara pembayaran terlambat dan suspend; wajib idempoten dan dapat direkonsiliasi.

## Issue yang diusulkan

1. Enrollment dapat ditangguhkan, dipulihkan, dan diakhiri melalui endpoint internal (`academic-enrollment-suspension`)
2. Renewal yang tidak dibayar setelah masa tenggang menangguhkan enrollment dan pulih saat dibayar (`billing-renewal-grace-suspend`)
3. Parent melihat status transaksi terbaru dan tagihan perpanjangan pada setiap enrollment (`web-parent-latest-payment-status`)
4. Tenant dapat mencatat refund manual untuk transaksi paid dan mengakhiri enrollment terkait (`billing-manual-refund`)
5. Tenant mencatat refund manual dari halaman transaksi (`web-tenant-manual-refund`)

## AI Orchestrator Project Contract

```json
{
  "key": "renewal-dunning-refund",
  "name": "Penanganan tunggakan perpanjangan dan refund manual",
  "outcome": "Enrollment yang tagihan perpanjangannya tidak dibayar melewati masa tenggang ditangguhkan dan kursinya dilepas, dapat pulih bila pembayaran terlambat diterima, dan tenant dapat mencatat refund manual dengan konsekuensi yang konsisten.",
  "problem": "Setelah masa penagihan lewat, worker renewal berhenti tanpa konsekuensi dan subscription tetap aktif; status enrollment tidak punya bentuk tangguh, refund tidak pernah ditulis, dan parent melihat transaksi tertua alih-alih yang terbaru.",
  "valueAndPriority": "High untuk tunggakan (akses tanpa bayar dan kursi terkunci), Medium untuk refund (kebutuhan administratif dengan keputusan manual).",
  "scope": [
    "Status tangguh enrollment beserta endpoint internal suspend, resume, dan end.",
    "Masa tenggang renewal lalu suspend, serta resume saat pembayaran terlambat.",
    "Status pembayaran terbaru dan tagihan perpanjangan di web parent.",
    "Pencatatan refund manual oleh tenant beserta permission-nya."
  ],
  "outOfScope": [
    "Refund otomatis melalui API provider.",
    "Refund parsial.",
    "Penagihan denda atau bunga keterlambatan."
  ],
  "successMetrics": [
    "Tidak ada enrollment aktif yang periodenya lewat masa tenggang tanpa pembayaran.",
    "Setiap refund tercatat dengan alasan, referensi, pelaku, dan enrollment terkait diakhiri."
  ],
  "dependenciesAndRisks": [
    "Keputusan owner: masa tenggang lalu suspend dengan kursi dilepas; refund dicatat manual oleh tenant.",
    "Pertanyaan terbuka: apakah refund manual juga mengurangi saldo wallet tenant. Default draft: pencatatan saja tanpa mutasi ledger.",
    "Risiko race antara pembayaran terlambat dan suspend; wajib idempoten dan dapat direkonsiliasi."
  ]
}
```
