## Background / Problem

Testing 31 Oktober 2026 melaporkan beberapa modal muncul di kiri atas, termasuk tambah anak dari detail kelas ketika parent belum memiliki anak. Wrapper ModalDialog memakai body portal/native dialog tetapi belum menyediakan alignment default bersama; class editor menambahkan centering sendiri dan approval memakai dialog tersendiri.

Lampiran: `http://localhost:3000/kelas/a2055414-5076-4c48-9d76-3d9e02c55cf3`. Server lokal tidak tersedia saat discovery; posisi visual merupakan laporan pengguna, belum reproduksi browser.

## Goal

Seluruh modal web mempunyai posisi tengah viewport yang konsisten dan tetap dapat digunakan pada layar kecil.

## Requirements

- Inventarisasi shared ModalDialog serta dialog/modal independen pada web; konsistenkan positioning tanpa merusak styling caller.
- Pusatkan modal horizontal dan vertikal terhadap viewport, bukan terhadap ancestor layout yang memiliki transform/position.
- Modal melebihi tinggi viewport harus tetap memiliki margin aman serta konten/actions yang dapat di-scroll; jangan memotong judul, tombol tutup atau tombol submit demi centering matematis.
- Pertahankan portal/top-layer, backdrop, focus management, pengembalian focus ke pemicu, Escape dan perilaku close/loading existing.
- Cakup tambah anak di detail kelas, edit kelas, approval jadwal dan reschedule; verifikasi seluruh hasil inventarisasi, bukan hanya contoh.

## Acceptance Criteria

- [ ] Tambah anak dari detail kelas tanpa anak tampil di tengah, bukan kiri atas; setelah berhasil parent tetap dapat melanjutkan flow existing.
- [ ] Semua modal hasil inventarisasi memiliki posisi tengah pada viewport desktop dan mobile saat konten muat.
- [ ] Konten panjang, zoom 200%, viewport pendek dan keyboard mobile tidak membuat kontrol tidak terjangkau.
- [ ] Scroll halaman/ancestor tidak menggeser modal keluar viewport; backdrop dan stacking tetap benar.
- [ ] Focus berada di modal saat terbuka, kembali ke pemicu saat ditutup, dan Escape/backdrop mengikuti kebijakan dialog existing.
- [ ] Tidak mengubah drawer/menu menjadi modal baru atau mengubah submit/validasi bisnis.

## Technical Notes

- Bukti: `kelolakelas-web/components/ModalDialog.tsx:31`, `:39`; `app/(dashboard)/dashboard/tenant/classes/_components/ClassEditModal.tsx:100`; `app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx:162`; `app/(dashboard)/dashboard/tenant/schedule-requests/_components/ApproveScheduleRequestDialog.tsx:159`.
- Test `components/ModalDialog.test.tsx:9` memeriksa lifecycle/portal tetapi tidak membuktikan geometri browser. Jangan menyimpulkan centering hanya dari DOM assertions.
- Follow-up konkret KEL-228 (Done), bukan pengulangan audit lintas seluruh halaman atau klaim audit lama gagal.
- Update dokumentasi web/quality mengenai perilaku modal bersama dan evidence hasil verifikasi bila berubah. Tidak memerlukan dependency dialog baru tanpa alasan.

## Edge Cases

- Caller memiliki positioning, transform, max-height atau class centering sendiri.
- Modal sudah terbuka lalu viewport di-resize/rotasi atau error menambah panjang konten.
- Modal di halaman yang sudah di-scroll dan pemicu hilang setelah submit.

## Testing / Validation

- [ ] Tambahkan/update test default wrapper dan regresi caller independen.
- [ ] Verifikasi browser bounding box terhadap viewport, dengan toleransi layout yang eksplisit, pada desktop/mobile.
- [ ] Uji keyboard/focus/Escape, zoom, konten panjang, scroll dan flow tambah anak hingga kembali ke enrollment.
- [ ] Jalankan test terkait, lint/typecheck/formatter dan required GitHub CI checks sebelum merge.

## Out of Scope

- Redesign semua halaman, modal detail anak baru, perubahan CRUD anak atau kebijakan approval jadwal.
