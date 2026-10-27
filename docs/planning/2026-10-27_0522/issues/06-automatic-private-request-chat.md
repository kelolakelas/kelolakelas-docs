## Background / Problem

Manual testing 25 Oktober 2026 meminta chat otomatis: parent mengajukan jadwal private→pesan dari parent ke admin; admin approve/reject→pesan dari admin ke parent; approval menyertakan payment link dan batas pembayaran tanggal/jam. Existing chat entry point dan payment-link send masih manual. Payment-link writer existing memakai sender system dan body belum menampilkan deadline.

## Goal

Setiap request dan keputusan private menghasilkan pesan tepat satu kali secara logis pada percakapan request yang sama, dengan pengirim yang benar dan informasi pembayaran yang dapat dipercaya.

## Requirements

- Setelah request berhasil dipersist, otomatis create/reuse schedule_request conversation dan kirim pesan dengan parent actor dari authenticated request, berisi identitas kelas/student yang boleh diakses serta slot yang diajukan.
- Setelah admin memutuskan approve/reject, kirim pesan dengan admin actor terverifikasi. Approval menjelaskan slot yang disetujui, checkout link invoice terkait dan tanggal/jam kedaluwarsa dengan timezone eksplisit; rejection memuat hasil/alasan serta rekomendasi jika memang ada.
- Capture delivery intent secara durable bersama transition yang sah; chat outage tidak menghilangkan pesan atau memaksa mengulang pembuatan enrollment/invoice. Sediakan retry/recovery yang observable.
- Deduplicate menurut logical event/version dan scope yang tervalidasi; actor tidak boleh berasal dari sender ID arbitrary dalam browser payload.
- Reuse percakapan request dua arah; jangan memakai parent-only notification room atau mengganti pengirim menjadi system untuk memenuhi requirement.
- Ambil pembayaran/expiry dari invoice authoritative existing. Recheck eligibility/expiry ketika delivery tertunda; jangan kirim tautan yang sudah tidak dapat dibayar atau deadline buatan web.
- Jaga kompatibilitas manual open/send link dan notification channel existing. Dokumentasikan ADR ringan tentang event capture, actor attribution, deduplication dan retry.

## Acceptance Criteria

- [ ] Parent submit sukses membuat satu pesan parent-authored di request conversation dan terlihat pada admin yang berwenang, termasuk bila conversation sebelumnya belum ada.
- [ ] Admin approve sukses menghasilkan pesan admin-authored pada percakapan yang sama; parent membaca jadwal disetujui, checkout link benar dan deadline tanggal/jam/timezone dari invoice yang sama.
- [ ] Admin reject menghasilkan satu pesan admin-authored dengan status dan alasan/rekomendasi yang benar; tidak ada payment link approval pada penolakan.
- [ ] Retry request, replay transition/delivery dan concurrent workers tidak menghasilkan pesan/enrollment/invoice duplikat; send/read/realtime/unread tetap konsisten.
- [ ] Chat unavailable lalu pulih/restart tetap mengirim pesan owed melalui retry tanpa mengulang business transition; status tertunda/gagal dapat didiagnosis dan dipulihkan.
- [ ] Missing/unavailable/expired/paid invoice tidak menghasilkan pesan approval dengan link payable menyesatkan. Keputusan yang sudah commit tetap konsisten dan recovery jelas.
- [ ] Wrong actor, tenant, parent, request atau transaction ditolak; tenant lain dan parent lain tidak menerima pesan.
- [ ] Manual payment-link action, private invoice email dan system notifications existing tetap berfungsi sesuai kontrak masing-masing.

## Technical Notes

Complexity high: durable cross-service delivery, trustworthy human attribution dan payment expiry/replay harus konsisten. Mitigasi dengan transaction/outage/concurrency/isolation tests serta real-flow message acceptance.

Evidence/relevant areas:
- kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go:31–43,187–225,333–343,361–382 — mutations belum mempunyai automatic dispatcher.
- kelolakelas-academic-service/internal/usecase/private_payment_link.go:30–79; pkg/paymentlink/client.go:19–35,91 — current invoice validation dan system-only response assertion.
- kelolakelas-academic-service/internal/usecase/parent_notification_worker.go; internal/repository/parent_notification_repository.go — durable session-notification precedent, bukan request implementation.
- kelolakelas-chat-service/internal/chat/chat.go:149–219; internal/postgres/store.go:112–119 — same request room dan parent/member message attribution.
- kelolakelas-chat-service/internal/chat/payment_link.go:23–75; internal/postgres/payment_link.go:24–70 — manual system link, dedup dan wall-clock expiry under lock.
- kelolakelas-billing-service/internal/usecase/transaction_usecase.go:352–367,547–561 — authoritative checkout URL/expiry existing; tidak membutuhkan perubahan billing jika contract cukup.
- kelolakelas-docs/docs/adr/0063-private-payment-link-chat.md; docs/adr/0072-parent-session-notification-outbox.md; docs/data/chat-schema.md.

KEL-124/129 Done manual, KEL-128 Done email. Ini follow-up baru, tidak mendraft ulang fondasi chat/payment. Backend adalah pemilik event supaya notifikasi tidak bergantung browser tetap terbuka. Kontrak internal baru mengikuti credential boundary existing, revalidasi request/participant dan evidence actor dari transition; pertahankan izin operasi, jangan membuat general-purpose impersonation API. Scope mencakup request/approve/reject; recommendation acceptance hanya perlu konsisten jika memakai approval transition yang sama, bukan workflow baru. Update academic/chat API/schema/flows/security/operations dan evidence index berdasarkan implementasi yang benar-benar diuji.

## Edge Cases

- Chat belum ada, parent submit retry, approval retry setelah invoice timeout, decision tersimpan tetapi response hilang.
- Delivery tertunda melewati expiry, invoice sudah dibayar, link tidak tersedia atau upstream billing gagal.
- Admin berganti antara request dan decision; attribution mengikuti actor yang benar-benar melakukan masing-masing transition.
- Reject dengan/ tanpa rekomendasi existing, cancellation/decision race, parent/student snapshot changes.
- Manual link send terjadi sebelum atau sesudah automatic approval delivery; pastikan dedup retry tidak menimbulkan spam.

## Testing / Validation

- [ ] Transactional/durable capture tests: rollback tidak mengirim; commit tetap owed saat chat down.
- [ ] Integration tests request/approve/reject, parent/admin sender IDs/kinds, same-room, scope/credential refusal.
- [ ] Concurrent/replay delivery dan worker restart tests, delayed expiry/lock waits, missing/paid invoice.
- [ ] Browser real-flow parent request→admin terima chat→approve/reject→parent terima pesan; cocokkan link dan deadline invoice, realtime serta unread.
- [ ] Regression manual KEL-129 system link, parent-only notifications dan existing private email.
- [ ] Go formatter/tests/race checks dan required GitHub PR CI; checks web hanya jika consumer berubah.
- [ ] ADR dan academic/chat/operations docs mencatat deployment order, configuration prerequisites, retry dan recovery yang terverifikasi.

## Out of Scope

- Email/SMS baru, provider pembayaran baru, invoice regeneration otomatis.
- Sender system sebagai pengganti parent/admin, atau notification room satu arah.
- Pengubahan keputusan, pembayaran atau enrollment hanya karena chat gagal.
- Redesign inbox/distributed WS; disappearance bug ditangani issue03.
