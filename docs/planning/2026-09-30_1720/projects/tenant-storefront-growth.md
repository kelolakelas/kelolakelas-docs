## Tujuan/outcome

Calon parent dapat melihat profil publik tenant dan ulasan kelas, dan tenant dapat membuat voucher yang ditukar dengan aman saat checkout kelas grup.

## Masalah yang diselesaikan

Nama tenant di katalog hanya memfilter daftar kelas; tidak ada profil publik, ulasan, maupun penukaran voucher meski tabel dan permission voucher sudah ada.

## Nilai dan prioritas

Medium: meningkatkan kepercayaan dan konversi katalog; dikerjakan setelah operasional dan keuangan inti.

## Scope

- Endpoint dan halaman profil publik tenant.
- Ulasan dan rating kelas oleh parent yang pernah terdaftar.
- Manajemen voucher tenant dan penukaran voucher di checkout kelas grup.

## Di luar scope

- Moderasi ulasan oleh platform admin.
- Voucher untuk kelas private dan tagihan perpanjangan.
- Upload logo atau media tenant.

## Success metrics

- Halaman profil tenant hanya menampilkan data publik tenant aktif.
- Tidak ada voucher yang dipakai melebihi batas penggunaan atau di luar masa berlaku.

## Dependencies/risiko

- Kolom `about` pada tenant berbentuk jsonb bebas; hanya subset yang disepakati boleh dipublikasikan.
- Penukaran voucher menyentuh kebenaran harga dan platform fee; butuh reservasi pemakaian yang atomik.

## Issue yang diusulkan

1. Calon parent dapat membuka profil publik tenant beserta kelas yang dipublikasikan (`tenant-public-profile-page`)
2. Parent yang pernah terdaftar dapat memberi rating dan ulasan kelas (`class-reviews-api`)
3. Detail kelas menampilkan rating dan ulasan, dan parent dapat menulis ulasan (`web-class-reviews`)
4. Tenant dapat membuat, mengubah, dan menonaktifkan voucher (`tenant-voucher-management`)
5. Parent dapat memakai voucher tenant saat checkout kelas grup (`voucher-checkout-redemption`)

## AI Orchestrator Project Contract

```json
{
  "key": "tenant-storefront-growth",
  "name": "Profil tenant publik, ulasan kelas, dan voucher",
  "outcome": "Calon parent dapat melihat profil publik tenant dan ulasan kelas, dan tenant dapat membuat voucher yang ditukar dengan aman saat checkout kelas grup.",
  "problem": "Nama tenant di katalog hanya memfilter daftar kelas; tidak ada profil publik, ulasan, maupun penukaran voucher meski tabel dan permission voucher sudah ada.",
  "valueAndPriority": "Medium: meningkatkan kepercayaan dan konversi katalog; dikerjakan setelah operasional dan keuangan inti.",
  "scope": [
    "Endpoint dan halaman profil publik tenant.",
    "Ulasan dan rating kelas oleh parent yang pernah terdaftar.",
    "Manajemen voucher tenant dan penukaran voucher di checkout kelas grup."
  ],
  "outOfScope": [
    "Moderasi ulasan oleh platform admin.",
    "Voucher untuk kelas private dan tagihan perpanjangan.",
    "Upload logo atau media tenant."
  ],
  "successMetrics": [
    "Halaman profil tenant hanya menampilkan data publik tenant aktif.",
    "Tidak ada voucher yang dipakai melebihi batas penggunaan atau di luar masa berlaku."
  ],
  "dependenciesAndRisks": [
    "Kolom `about` pada tenant berbentuk jsonb bebas; hanya subset yang disepakati boleh dipublikasikan.",
    "Penukaran voucher menyentuh kebenaran harga dan platform fee; butuh reservasi pemakaian yang atomik."
  ]
}
```
