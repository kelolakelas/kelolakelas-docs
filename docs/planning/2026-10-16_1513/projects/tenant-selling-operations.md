## Tujuan/outcome

Tenant membuat kelas lengkap secara atomik, mengedit konfigurasi yang sah melalui satu entry, dan menghapus kelas sesuai aturan domain.

## Masalah yang diselesaikan

Kategori/kelas/jadwal ditulis terpisah dan editor belum lengkap.

## Nilai dan prioritas

High: cegah data parsial dan pulihkan alur operasional tenant.

## Scope

- Atomic final create dan draft wizard.
- Editor mutable fields/group schedules, hapus Add Schedule terpisah.
- Safe delete dan styling schedule.

## Di luar scope

- Konversi tipe, checkout/payment, private enrollment policy.

## Success metrics

- Nol record baru bila cancel/final transaction gagal.
- Semua konfigurasi mutable tersedia melalui Edit Class.
- Delete menjaga enrollment guard; form schedule responsive.

## Dependencies/risiko

- Reuse project existing P-KEL-7, bukan membuat duplikat; description ini adalah draft scope run, bukan otorisasi overwrite project existing.
- API sebelum wizard, editor mengikuti shared model, styling setelah editor.
- Jaga tenant isolation, enrollment/history dan tipe immutable.

## Issue yang diusulkan

1. Simpan kategori, kelas, pengajar, dan jadwal dalam satu transaksi final (`atomic-class-creation-api`)
2. Jadikan wizard kelas draft lokal sampai final submit berhasil (`deferred-class-creation-wizard`)
3. Lengkapi edit kelas dengan kategori dan jadwal, lalu hapus Add Schedule terpisah (`complete-class-editor`)
4. Tambahkan hapus kelas dengan konfirmasi dan penanganan konflik (`delete-class-action`)
5. Rapikan day of week, start time, dan end time pada form jadwal (`schedule-form-layout`)

## AI Orchestrator Project Contract

```json
{
  "key": "tenant-selling-operations",
  "name": "Operasional tenant untuk menjual kelas",
  "outcome": "Tenant membuat kelas lengkap secara atomik, mengedit konfigurasi yang sah melalui satu entry, dan menghapus kelas sesuai aturan domain.",
  "problem": "Kategori/kelas/jadwal ditulis terpisah dan editor belum lengkap.",
  "valueAndPriority": "High: cegah data parsial dan pulihkan alur operasional tenant.",
  "scope": [
    "Atomic final create dan draft wizard.",
    "Editor mutable fields/group schedules, hapus Add Schedule terpisah.",
    "Safe delete dan styling schedule."
  ],
  "outOfScope": [
    "Konversi tipe, checkout/payment, private enrollment policy."
  ],
  "successMetrics": [
    "Nol record baru bila cancel/final transaction gagal.",
    "Semua konfigurasi mutable tersedia melalui Edit Class.",
    "Delete menjaga enrollment guard; form schedule responsive."
  ],
  "dependenciesAndRisks": [
    "Reuse project existing P-KEL-7, bukan membuat duplikat; description ini adalah draft scope run, bukan otorisasi overwrite project existing.",
    "API sebelum wizard, editor mengikuti shared model, styling setelah editor.",
    "Jaga tenant isolation, enrollment/history dan tipe immutable."
  ]
}
```
