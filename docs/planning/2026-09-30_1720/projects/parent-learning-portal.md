## Tujuan/outcome

Parent dapat melihat jadwal sesi berikutnya, riwayat kehadiran, dan laporan evaluasi milik anaknya sendiri tanpa dapat membaca data anak lain.

## Masalah yang diselesaikan

Parent hanya dapat melihat enrollment, data anak, dan chat; endpoint sesi, absensi, dan laporan tidak memiliki jalur parent, dan token parent yang membawa tenant claim berpotensi melewati pemeriksaan permission.

## Nilai dan prioritas

High: visibilitas progres anak adalah nilai inti bagi pembayar dan mendukung retensi perpanjangan.

## Scope

- Akses baca parent yang dibatasi kepemilikan untuk sesi, absensi, dan laporan anak.
- Navigasi parent serta layar jadwal, kehadiran, dan rapor per anak.

## Di luar scope

- Parent mengubah absensi atau laporan.
- Notifikasi otomatis ke parent (Project notifikasi).
- Ekspor rapor ke PDF.

## Success metrics

- Parent melihat jadwal, kehadiran, dan laporan anaknya sendiri dari satu area dashboard.
- Uji otorisasi membuktikan parent tidak dapat membaca data anak parent lain maupun data tenant lain.

## Dependencies/risiko

- Risiko kebocoran data anak lintas parent atau tenant; guard wajib di academic, bukan hanya di UI.
- Bergantung pada absensi per sesi dan guard sesi dari Project operasional pengajar agar data yang ditampilkan benar.

## Issue yang diusulkan

1. Parent dapat membaca sesi, kehadiran, dan laporan milik anaknya sendiri (`parent-learning-read-api`)
2. Parent melihat jadwal, riwayat kehadiran, dan rapor anak dari dashboard (`web-parent-learning-portal`)

## AI Orchestrator Project Contract

```json
{
  "key": "parent-learning-portal",
  "name": "Portal belajar parent: jadwal, kehadiran, dan rapor anak",
  "outcome": "Parent dapat melihat jadwal sesi berikutnya, riwayat kehadiran, dan laporan evaluasi milik anaknya sendiri tanpa dapat membaca data anak lain.",
  "problem": "Parent hanya dapat melihat enrollment, data anak, dan chat; endpoint sesi, absensi, dan laporan tidak memiliki jalur parent, dan token parent yang membawa tenant claim berpotensi melewati pemeriksaan permission.",
  "valueAndPriority": "High: visibilitas progres anak adalah nilai inti bagi pembayar dan mendukung retensi perpanjangan.",
  "scope": [
    "Akses baca parent yang dibatasi kepemilikan untuk sesi, absensi, dan laporan anak.",
    "Navigasi parent serta layar jadwal, kehadiran, dan rapor per anak."
  ],
  "outOfScope": [
    "Parent mengubah absensi atau laporan.",
    "Notifikasi otomatis ke parent (Project notifikasi).",
    "Ekspor rapor ke PDF."
  ],
  "successMetrics": [
    "Parent melihat jadwal, kehadiran, dan laporan anaknya sendiri dari satu area dashboard.",
    "Uji otorisasi membuktikan parent tidak dapat membaca data anak parent lain maupun data tenant lain."
  ],
  "dependenciesAndRisks": [
    "Risiko kebocoran data anak lintas parent atau tenant; guard wajib di academic, bukan hanya di UI.",
    "Bergantung pada absensi per sesi dan guard sesi dari Project operasional pengajar agar data yang ditampilkan benar."
  ]
}
```
