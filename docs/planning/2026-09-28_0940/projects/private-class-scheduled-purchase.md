## Tujuan/outcome

Parent dapat mengajukan jadwal kelas private, tenant meninjau lalu menyetujui, menolak, atau menolak dengan rekomendasi jadwal lain, lalu parent membayar melalui payment link sehingga enrollment aktif dengan jadwal yang disepakati.

## Masalah yang diselesaikan

Kelas private kini dibeli langsung tanpa jadwal (academic `internal/usecase/enrollment_usecase.go:168,217`). Jadwal private hanya dapat dibuat tenant melalui `POST /schedules` dengan `enrollment_id` setelah enrollment ada (`internal/usecase/schedule_usecase.go:221-239`), dan tidak ada UI untuk itu. Akibatnya kelas private terjual tanpa jadwal yang disepakati.

## Nilai dan prioritas

High. Kelas private adalah produk inti bimbel. Confidence tinggi karena alur memakai ulang enrollment, invoice billing, aktivasi internal, dan generator sesi yang sudah ada. Effort total L.

## Scope

- Resource permintaan jadwal private di academic beserta route gateway.
- Form permintaan jadwal dan status permintaan untuk parent di web.
- Persetujuan tenant yang membuat enrollment, jadwal private, dan invoice.
- Halaman tenant untuk meninjau, menyetujui, dan menolak permintaan.
- Penolakan dengan rekomendasi jadwal lain dan penerimaan rekomendasi oleh parent.

## Di luar scope

- Chat tenant–parent (menunggu keputusan arsitektur).
- Pengiriman payment link lewat email atas permintaan tenant (kandidat run berikutnya).
- Negosiasi bolak-balik di luar rekomendasi tenant dan pengajuan ulang oleh parent.
- Halaman pembayaran tanpa redirect ke Duitku.

## Success metrics

- Kelas private hanya dapat dibeli melalui permintaan jadwal yang disetujui tenant.
- Setiap enrollment private yang dibayar memiliki jadwal aktif yang sama dengan slot yang disetujui dan sesi yang dihasilkan.
- Tidak ada permintaan atau enrollment yang dapat diakses lintas tenant atau lintas parent (dibuktikan test isolasi).

## Dependencies/risiko

- Invoice memakai `GenerateInvoice` billing yang ada (academic `pkg/billing/client.go`); tidak ada perubahan billing.
- Risiko utama adalah idempotensi persetujuan dan kebocoran data lintas tenant.

## Issue yang diusulkan

1. Parent dapat mengajukan jadwal kelas private dan tenant dapat meninjau atau menolaknya melalui API (`private-schedule-request-api`)
2. Persetujuan tenant atas permintaan jadwal private membuat enrollment, jadwal, dan payment link (`approve-private-schedule-request`)
3. Parent mengajukan jadwal kelas private dari detail kelas dan memantau status permintaannya (`parent-private-schedule-request-web`)
4. Tenant meninjau, menyetujui, atau menolak permintaan jadwal private dari dashboard (`tenant-private-schedule-review-web`)

## AI Orchestrator Project Contract

```json
{
  "key": "private-class-scheduled-purchase",
  "name": "Pembelian kelas private dengan jadwal yang disepakati",
  "outcome": "Parent dapat mengajukan jadwal kelas private, tenant meninjau lalu menyetujui, menolak, atau menolak dengan rekomendasi jadwal lain, lalu parent membayar melalui payment link sehingga enrollment aktif dengan jadwal yang disepakati.",
  "problem": "Kelas private kini dibeli langsung tanpa jadwal (academic `internal/usecase/enrollment_usecase.go:168,217`). Jadwal private hanya dapat dibuat tenant melalui `POST /schedules` dengan `enrollment_id` setelah enrollment ada (`internal/usecase/schedule_usecase.go:221-239`), dan tidak ada UI untuk itu. Akibatnya kelas private terjual tanpa jadwal yang disepakati.",
  "valueAndPriority": "High. Kelas private adalah produk inti bimbel. Confidence tinggi karena alur memakai ulang enrollment, invoice billing, aktivasi internal, dan generator sesi yang sudah ada. Effort total L.",
  "scope": [
    "Resource permintaan jadwal private di academic beserta route gateway.",
    "Form permintaan jadwal dan status permintaan untuk parent di web.",
    "Persetujuan tenant yang membuat enrollment, jadwal private, dan invoice.",
    "Halaman tenant untuk meninjau, menyetujui, dan menolak permintaan.",
    "Penolakan dengan rekomendasi jadwal lain dan penerimaan rekomendasi oleh parent."
  ],
  "outOfScope": [
    "Chat tenant–parent (menunggu keputusan arsitektur).",
    "Pengiriman payment link lewat email atas permintaan tenant (kandidat run berikutnya).",
    "Negosiasi bolak-balik di luar rekomendasi tenant dan pengajuan ulang oleh parent.",
    "Halaman pembayaran tanpa redirect ke Duitku."
  ],
  "successMetrics": [
    "Kelas private hanya dapat dibeli melalui permintaan jadwal yang disetujui tenant.",
    "Setiap enrollment private yang dibayar memiliki jadwal aktif yang sama dengan slot yang disetujui dan sesi yang dihasilkan.",
    "Tidak ada permintaan atau enrollment yang dapat diakses lintas tenant atau lintas parent (dibuktikan test isolasi)."
  ],
  "dependenciesAndRisks": [
    "Invoice memakai `GenerateInvoice` billing yang ada (academic `pkg/billing/client.go`); tidak ada perubahan billing.",
    "Risiko utama adalah idempotensi persetujuan dan kebocoran data lintas tenant."
  ]
}
```
