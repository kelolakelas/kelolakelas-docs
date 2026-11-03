## Background / Problem

Pengguna meminta menghapus wording `Class published. It is now visible in /kelas.` pada `/dashboard/tenant/classes` berdasarkan testing 31 Oktober 2026. Publication control masih merender state.message termasuk hasil sukses.

## Goal

Publikasi kelas tidak lagi menampilkan kalimat tersebut, tanpa menyembunyikan kegagalan atau mengubah status publikasi.

## Requirements

- Hapus rendering wording sukses yang dimaksud dari halaman daftar kelas.
- Pertahankan pembaruan state/status publikasi, pending state, aturan publish/unpublish dan error yang actionable.
- Jangan menghapus semua pesan feedback secara global atau mengganti copy dengan kalimat lain yang setara tanpa kebutuhan.

## Acceptance Criteria

- [ ] Setelah publish berhasil, wording tersebut tidak muncul pada halaman daftar kelas.
- [ ] Status published dan kontrol aksi sesuai hasil server setelah update/reload.
- [ ] Publish gagal tetap menampilkan error dan tidak memberi kesan published.
- [ ] Unpublish, loading state dan pencegahan submit ganda tidak berubah.

## Technical Notes

- Sumber literal: `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts:530`; rendering message: `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassPublicationControl.tsx:129`.
- Batasi perubahan message/rendering agar kontrak action untuk error tetap kompatibel.
- Ini perubahan copy/UI, bukan perubahan availability publik. Update dokumentasi web hanya bila menyebut wording/feedback ini; tidak ada perubahan API.

## Edge Cases

- Pesan error lama tidak tertinggal setelah aksi berikutnya berhasil.
- Kegagalan network/otorisasi tetap terlihat.
- Unpublish tidak terpengaruh penghapusan pesan publish.

## Testing / Validation

- [ ] Tambahkan/update regression test bahwa pesan yang dimaksud tidak dirender setelah sukses.
- [ ] Uji publish sukses, error dan unpublish dengan state server yang sesuai.
- [ ] Jalankan test terkait, formatter/lint/typecheck dan required GitHub CI checks sebelum merge.

## Out of Scope

- Perubahan aturan publikasi, katalog, izin tenant atau redesign tabel kelas.
