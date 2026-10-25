## Background / Problem

Testing lokal 24 Oktober 2026: tombol Chat tidak memiliki badge saat ada pesan baru. Inbox sudah memiliki unread_count per conversation, tetapi parent navigation dan tenant sidebar hanya menampilkan label, sehingga pengguna tidak melihat pesan masuk saat berada di halaman lain.

## Goal

Parent dan tenant member yang berhak melihat jumlah pesan belum dibaca langsung dari navigasi Chat, termasuk ketika berada di luar inbox.

## Requirements

- Gunakan jumlah pesan belum dibaca milik viewer pada seluruh conversation yang boleh dilihatnya, bukan jumlah conversation. Parent mengikuti ownership lintas tenant yang sah; member mengikuti tenant aktif dan permission existing.
- Pada semua entry navigasi Chat desktop/mobile yang relevan: nol tanpa badge, 1–99 angka tepat, 100 atau lebih 99+.
- Perbarui badge saat pesan baru, read berhasil, pergantian halaman, reconnect dan pergantian akun/tenant; sinkronkan kembali ke sumber authoritative setelah gangguan.
- Gunakan komponen badge reusable dengan label aksesibel dan styling konsisten. Kegagalan fetch tidak boleh ditafsirkan sebagai jumlah nol terkonfirmasi atau menghalangi navigasi Chat.

## Acceptance Criteria

- [ ] Di luar inbox, pesan masuk dari pihak lain menambah badge; pesan sendiri tidak menambahnya; read terkonfirmasi mengurangi hitungan hingga badge hilang saat nol.
- [ ] Nilai 0, 1, 99, 100 dan >100 menghasilkan tampilan yang diminta pada navigasi desktop dan mobile.
- [ ] Unread yang ada di conversation halaman kedua atau sesudahnya tetap diperhitungkan; first100 conversation yang sudah dibaca tidak menghasilkan false zero.
- [ ] Event replay/duplikat, reconnect dan read dari tab lain tidak menggelembungkan badge; setelah reconciliation, badge sesuai unread authoritative.
- [ ] Tidak ada hitungan akun/tenant sebelumnya atau conversation yang tidak berhak dilihat; nav yang tidak diizinkan tetap tersembunyi.
- [ ] Badge dapat dipahami screen reader, fokus/target navigasi tetap jelas, dan layout responsif tidak terpotong.

## Technical Notes

API existing mendukung pagination page/page_size maksimal100 dan unread_count per conversation; web listConversations saat ini hanya first100. Gunakan seluruh cakupan yang diperlukan atau berhenti setelah total unread mencapai100, karena display sudah99+. Aggregate endpoint baru tidak diwajibkan. WS message.created dan conversation.read tersedia; REST retry Send dapat menyiarkan pesan yang sama sehingga increment lokal perlu dedup/reconciliation. Backend tetap authoritative. Reuse pattern existing; tidak menetapkan provider transport baru.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/_components/ParentNav.tsx:33`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx:155`
- `kelolakelas-web/lib/chat-actions.ts:33`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx:133`
- `kelolakelas-chat-service/internal/postgres/store.go:66`
- `kelolakelas-chat-service/internal/chat/wshub.go:15`

Perbarui docs/components/web.md untuk count semantics, cap, cakupan navigasi dan refresh/error behavior. Jika kontrak API benar-benar berubah, perbarui docs/api/chat.md serta label repository sesuai perubahan yang terbukti.

Related work (Done; bukan blocker): KEL-123, KEL-202.

## Edge Cases

- Lebih dari100 conversation dengan unread hanya di halaman lama; system notification termasuk unread bila viewer berhak.
- Read bersamaan dengan pesan baru; beberapa tab; event replay; reconnect tanpa event historis.
- API unavailable, session expired, tenant switch dan logout saat fetch pending.

## Testing / Validation

- [ ] Uji agregasi lintas halaman, cap 0/1/99/100+, own/system messages, read dan duplicate-event reconciliation.
- [ ] Verifikasi desktop/mobile di luar inbox, pesan masuk lewat real backend, read lintas tab, reconnect dan permission/tenant isolation.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Push notification/browser permission, email/WhatsApp, redesign inbox, atau multi-instance WebSocket infrastructure.
- Unread conversation count baru atau perubahan read-marker backend tanpa kebutuhan yang terbukti.
