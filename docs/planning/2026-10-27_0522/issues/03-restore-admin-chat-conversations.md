## Background / Problem

Manual testing 25 Oktober 2026: chat room menghilang dari sisi admin. Root cause runtime belum diketahui. Source menunjukkan dua kandidat: polling inbox mengganti daftar dengan first100 conversations; permission-service error di chat dapat menjadi visibility false dan HTTP200 list kosong/berkurang. Tidak ditemukan production delete/archive path.

## Goal

Admin dapat menemukan, membuka dan melanjutkan chat yang masih diizinkan secara konsisten setelah poll, refresh dan reconnect; kegagalan dependency tidak menyamar sebagai daftar kosong sukses.

## Requirements

- Reproduksi dengan conversation IDs dan bandingkan list, direct GET, persisted row, tenant/member/permission serta perubahan ordering/pagination.
- Investigasi first-page replacement, active room recovery yang berbeda antara manual refresh dan timer, stale responses, serta identity outage.
- Implementasikan owner fix berdasarkan bukti; sediakan akses percakapan lama melalui pagination/incremental navigation yang sesuai.
- Bedakan unavailable dari empty dan genuine permission denial. Jangan mempertahankan akses ke percakapan setelah membership/permission dicabut.
- Pertahankan unread/read watermark, frozen participants, current tenant isolation dan REST/WS behavior yang kompatibel.

## Acceptance Criteria

- [ ] Bukti reproduksi menjelaskan list-vs-detail-vs-database sebelum/sesudah dan mengidentifikasi penyebab nyata.
- [ ] Admin dapat membuka authorized conversation di luar first100, dan active/direct-linked room tetap dapat diakses setelah polling, pesan baru serta reconnect.
- [ ] Identity/dependency failure tidak merender sukses “tidak ada chat”; ada status gagal dan retry yang jelas tanpa membocorkan room.
- [ ] Revoked permission/membership, tenant berbeda atau wrong parent tetap ditolak; room tidak dipertahankan melalui stale cache.
- [ ] Response lama tidak mengganti context/daftar yang lebih baru setelah tenant/navigation change.
- [ ] Read/unread, send/retry dan parent inbox tetap berfungsi tanpa conversation/message duplikat.

## Technical Notes

Relevant areas:
- kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx:74–95,175–181 — shared tenant/parent inbox refresh dan poll.
- kelolakelas-web/lib/chat-actions.ts:34; app/(dashboard)/dashboard/tenant/chat/page.tsx:42 — first100.
- kelolakelas-chat-service/internal/postgres/store.go:36–69 — persistence, scope dan deterministic paging.
- kelolakelas-chat-service/internal/chat/chat.go:96–137,230–242 — permission error collapsed, live REST visibility dan WS rights snapshot.
- kelolakelas-docs/docs/adr/0076-navigation-chat-unread-reconciliation.md — badge pagination tidak mengubah inbox.

KEL-123/202/217 Done mencakup inbox/layout/badge, bukan regresi ini. Tidak mengklaim data terhapus. Jika dependency error handling berubah, dokumentasikan status/error contract dan permission semantics; jangan melonggarkan authorization untuk menyembuhkan disappearance.

## Edge Cases

- >100 rooms, perubahan last_message_at, unread room di halaman berikutnya, direct deep link.
- Identity timeout, actual permission false, membership berubah saat WS masih terbuka.
- Parent-only notification room memang tidak terlihat oleh tenant.
- Reconnect, beberapa request selesai tidak berurutan, tab tidak terlihat lalu aktif kembali.

## Testing / Validation

- [ ] Deterministic integration test list/direct GET dengan pagination, dependency error vs denied, tenant/member isolation.
- [ ] Client tests polling/refresh/reconnect, older-room navigation dan stale-response races.
- [ ] Browser acceptance admin dengan >100 fixtures, permission outage/recovery, pencabutan akses, dan parent regression.
- [ ] Go tests/race checks, web tests/lint/typecheck/build, formatter dan required GitHub PR CI sesuai owner fix.
- [ ] Chat/web docs dan bukti reproduksi/pemulihan diperbarui.

## Out of Scope

- Redesign chat service, distributed WS fan-out, archive/delete feature baru.
- Badge unread baru atau bypass permission.
- Lifecycle auto messages (issue06).
