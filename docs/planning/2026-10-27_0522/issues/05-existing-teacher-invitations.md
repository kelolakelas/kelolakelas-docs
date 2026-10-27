## Background / Problem

Manual testing 25 Oktober 2026: mengundang member yang sudah berada pada tenant lain ditolak, padahal Teacher dapat bekerja di beberapa tenant. Create invitation menolak semua email existing; acceptance hanya mendukung pembuatan akun baru. Database membership sendiri mendukung satu user di beberapa tenant.

## Goal

Teacher existing dapat menerima undangan tenant lain dengan akun yang sama dan bekerja pada tenant tersebut tanpa kehilangan membership lama.

## Requirements

- Izinkan undangan untuk akun Teacher existing ke tenant lain melalui validasi role/permission invitation existing.
- Tambahkan authenticated acceptance yang mengikat akun/email terverifikasi ke undangan; link saja tidak boleh membuktikan kepemilikan akun existing.
- Tambah membership target secara atomic dan idempotent tanpa akun/password/wallet baru atau mutasi membership tenant lama.
- Web membedakan new-account registration dari existing-account acceptance; login yang diperlukan mempertahankan tujuan undangan dan menjelaskan account mismatch.
- Existing same-tenant membership ditangani eksplisit tanpa role overwrite; inactive/deleted collision tidak dipulihkan diam-diam.
- Setelah accept, tenant baru tersedia lewat tenant selection issue04; Creator approval dan alur akun baru tetap kompatibel.

## Acceptance Criteria

- [ ] Teacher aktif A dapat diundang B, login dengan akun yang sama, accept dan berpindah A/B; satu user/password/wallet dan membership A tetap utuh.
- [ ] Email invitation dinormalisasi seperti existing; akun yang emailnya berbeda tidak dapat accept walaupun memiliki token link.
- [ ] Repeated/concurrent accept menghasilkan paling banyak satu membership B dan hasil sukses/replay yang konsisten; used/expired/revoked token ditangani aman.
- [ ] Existing membership pada target tidak digandakan atau diubah rolenya; inactive/deleted target menghasilkan penjelasan konflik tanpa auto-reactivation.
- [ ] Role asing tenant, Creator grant terlarang dan unauthorized inviter tetap ditolak; tenant/role berasal dari invitation tervalidasi.
- [ ] New-user invitation registration dan delivery outcome existing tetap berjalan.
- [ ] UX menunjukkan tenant/role yang dituju, konfirmasi hasil dan langkah memilih tenant; error tidak menghilangkan konteks undangan.

## Technical Notes

Blocked by draft tenant-membership-selection (issue04); buat native Linear relation setelah kedua issue dibuat. KEL-35 Done hanya registrasi baru, sehingga bukan duplikat.

Complexity high: ownership email, atomic invite consumption, membership uniqueness dan reuse identitas; mitigasi PostgreSQL concurrency/isolation dan wrong-account acceptance tests.

Relevant areas:
- kelolakelas-identity-service/internal/usecase/invitation_usecase.go:43–112 — existing-email guard, role validation, 48h token.
- kelolakelas-identity-service/internal/repository/user_repository.go:220–313 — locked invitation tetapi acceptance hanya new user.
- kelolakelas-identity-service/internal/usecase/invitation_lifecycle_test.go:120 — existing rejection test perlu penyesuaian scope.
- kelolakelas-identity-service/internal/repository/creator_decision_repository.go:69–99 — preseden linking existing dan deleted-member collision, bukan reuse jalur privilege Creator.
- kelolakelas-api-gateway/internal/delivery/http/router.go:109–110,153–161 — existing routes; authenticated acceptance belum ada.
- kelolakelas-web/app/(auth)/invitations/verify/page.tsx:71–143; app/(dashboard)/dashboard/tenant/members/_actions/actions.ts:52.
- kelolakelas-docs/docs/api/identity.md:28; docs/flows/authentication.md:27.

Batas scope existing Teacher; kebijakan arbitrary role dan dual persona parent tidak diperluas. Dokumentasikan kontrak/error/UX dan perubahan expected existing-email behavior. Endpoint shape diputuskan dalam implementasi mengikuti pola repository, bukan diinventarisasi sebagai API yang sudah ada.

## Edge Cases

- Perbedaan casing email, user logout/login akun salah, session expired selama accept.
- Dua invitations target sama, dua acceptance bersamaan, invite revoked saat request berjalan.
- Membership target soft-deleted/nonaktif dan user sudah anggota target.
- Email delivery gagal, token expired/used dan pengguna baru.

## Testing / Validation

- [ ] Unit/integration tests create dan authenticated acceptance untuk existing Teacher, salah akun, role/tenant scope, expiry/revoke/replay.
- [ ] PostgreSQL uniqueness/rollback/concurrent acceptance: tidak ada akun, wallet atau membership duplikat.
- [ ] Web/gateway contract tests login-return-to-invite, account mismatch dan error preservation.
- [ ] Browser end-to-end Teacher A→invite B→accept→pilih B→kembali A dengan authorization berbeda.
- [ ] Formatter, Go tests/race checks, web tests/lint/typecheck/build dan required GitHub PR CI.
- [ ] Update identity/auth/security/web docs dan evidence sebelum penutupan.

## Out of Scope

- Arbitrary existing-role invitation, parent-to-teacher conversion dan auto-reactivation.
- Creator/owner role granting tanpa approval existing.
- Reset password, migrasi identitas atau membuat akun kedua.
