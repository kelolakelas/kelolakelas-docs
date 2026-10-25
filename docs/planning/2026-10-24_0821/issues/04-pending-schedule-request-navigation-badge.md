## Background / Problem

Testing lokal 24 Oktober 2026: admin tenant tidak melihat penanda saat ada schedule request belum diproses. Entry Schedule Requests sudah ada dan permission-gated, tetapi belum memiliki badge.

## Goal

Admin tenant yang berhak dapat melihat antrean schedule request pending dari sidebar dan navigasi mobile tanpa membuka halaman daftar.

## Requirements

- Hitung hanya status pending milik tenant aktif, independen dari filter halaman dan ukuran list yang sedang ditampilkan. Approved dengan invoice belum tersedia tetap bukan pending.
- Tampilkan angka1–99; untuk100 atau lebih tampilkan99+; nol tidak menampilkan badge.
- Refresh setelah request masuk, approve/reject/cancel berhasil, navigasi kembali/focus dan pemulihan koneksi; tentukan strategi refresh ringan yang bekerja saat admin di halaman lain.
- Pertahankan gate enrollment:read dan isolasi tenant. Loading/error count tidak menghalangi navigasi atau terlihat sebagai nol terkonfirmasi. Gunakan pola badge aksesibel konsisten dengan navigasi lain.

## Acceptance Criteria

- [ ] Pending request tenant aktif menampilkan angka benar di sidebar dan mobile; 0/1/99/100/>100 sesuai aturan.
- [ ] Approved/rejected/cancelled tidak dihitung. Aksi berhasil memperbarui badge; aksi gagal tidak mengurangi hitungan secara keliru.
- [ ] Request baru terdeteksi saat admin di halaman lain melalui strategi refresh yang dapat diverifikasi; filter/status daftar tidak memengaruhi count.
- [ ] Permission denied tidak memicu kebocoran jumlah; tenant switch/logout menghapus state akun/tenant sebelumnya.
- [ ] Koneksi gagal dan pulih tidak menampilkan angka palsu; setelah refresh berhasil badge kembali sesuai state backend.

## Technical Notes

Existing GET /api/v1/schedule-requests?status=pending mengembalikan scoped array maksimum100. Untuk display terpotong99+, filtered array ini cukup: panjang0..99 adalah exact, panjang100 berarti99+. Tidak perlu mengklaim uncapped total atau menambah count endpoint tanpa kebutuhan. Query UI saat ini mengembalikan rows.length sebagai total; badge harus memakai filter pending terlepas filter daftar. Approval fix bukan dependency teknis: badge dapat dikerjakan independen.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts:22`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx:155`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx:16`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests/_queries/queries.ts:86`
- `kelolakelas-academic-service/internal/repository/private_schedule_request_repository.go:164`

Perbarui docs/components/web.md dengan eligibility pending, permission, cap dan refresh/error behavior. API akademik tidak perlu berubah bila filter/cap existing dipakai.

Related work (Done; bukan blocker): KEL-110.

## Edge Cases

- 100+ pending bercampur banyak request processed; list UI sedang filter approved.
- Approve sudah commit tetapi billing gagal; parent cancel bersamaan dengan admin refresh.
- Permission dicabut, tenant switch, mobile drawer terbuka, API timeout.

## Testing / Validation

- [ ] Uji batas badge, filter pending, tenant/permission isolation dan update success-versus-error.
- [ ] Verifikasi sidebar/mobile dengan backend nyata: create request dari parent lalu approve/reject/cancel, refresh di halaman lain dan reconnect.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Notifikasi push/email untuk antrean, redesign daftar review, atau mengubah lifecycle request.
- Menghitung seluruh histori request atau menunggu approval regression selesai untuk mulai implementasi badge.
