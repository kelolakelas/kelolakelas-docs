## Background / Problem

Teacher perlu bekerja pada beberapa tenant. Membership database sudah unik per tenant/user, tetapi login mengambil satu membership dengan First tanpa pemilihan tenant. JWT membawa satu tenant/role/member. Menambah membership tanpa cara memilih konteks aktif belum memenuhi outcome multi-tenant.

## Goal

Akun dengan beberapa membership aktif dapat memilih dan berpindah tenant secara aman; data, izin dan UI selalu mengikuti konteks aktif yang jelas.

## Requirements

- Identity menyediakan kontrak terautentikasi untuk membaca membership milik akun sendiri dan menerbitkan sesi/token tenant terpilih setelah live ownership/active membership checks.
- Gateway mendukung kontrak yang disepakati; tenant tetap berasal dari verified JWT, bukan header atau role/member ID yang dipercaya dari browser.
- Web menyediakan pemilihan/perpindahan tenant yang mudah ditemukan, menampilkan tenant/role aktif, dan tetap praktis untuk akun satu membership.
- Pergantian konteks mereset data/cache/navigation dan menutup atau menyambung ulang koneksi chat agar tenant lama tidak tampil di tenant baru; tangani perubahan konteks di tab lain dan request lama.
- Pertahankan revocation/session checks, MFA/platform boundaries, parent login dan Creator restrictions existing.
- Catat ADR ringan untuk kontrak/session behavior dan update auth/API/security/web docs.

## Acceptance Criteria

- [ ] Fixture satu user dengan dua membership aktif dapat login dan memilih A/B; token/session memuat tenant, role, member yang cocok dari database.
- [ ] Setelah switch, kelas, anggota, enrollment, chat, unread dan pending badges memakai tenant baru; delayed response dari tenant lama tidak muncul.
- [ ] Direct URL dan API setelah switch menjalankan permission tenant terpilih; forged tenant/member dan membership akun lain selalu ditolak.
- [ ] Inactive/deleted/revoked membership tidak dapat dipilih, termasuk perubahan concurrent setelah daftar pilihan dibaca.
- [ ] Single-membership login tetap dapat langsung bekerja; expired/invalid session dan upstream failure memiliki error/recovery yang jelas.
- [ ] Parent dan platform admin flows tidak mendapat kemampuan atau role tenant baru; password/wallet/identitas akun tidak diduplikasi.
- [ ] Context change pada beberapa tab tidak meninggalkan UI atau koneksi yang diam-diam beroperasi pada tenant lama.

## Technical Notes

Complexity high: session issuance, live permissions, caching dan realtime memerlukan konsistensi lintas identity/gateway/web. Mitigasi melalui ownership/race tests dan browser tenant-isolation acceptance.

Evidence:
- kelolakelas-identity-service/migrations/00000000000000_init_schema.up.sql:33 — unique tenant/user.
- kelolakelas-identity-service/internal/usecase/auth_usecase.go:164–182; internal/repository/user_repository.go:209; pkg/jwt/jwt.go:17.
- kelolakelas-identity-service/internal/repository/member_permission.go:21–40 — active membership/tenant/role predicates.
- kelolakelas-api-gateway/internal/delivery/http/router.go:129,161; middleware/auth_middleware.go:91–129; middleware/context_header_middleware.go:49 — existing session check dan claim-only tenant.
- kelolakelas-docs/docs/flows/authentication.md:83 — belum ada selection.

Ini fondasi untuk issue05, bukan izin menerima arbitrary role atau menambah membership. API names/shape dan UX tempat switch belum ditentukan; pilih implementasi minimal setelah meninjau auth/session existing. Jangan memakai public tenant lookup sebagai daftar membership. Tidak perlu membaca atau memigrasikan akun produksi untuk acceptance: buat fixture melalui jalur test/integration.

## Edge Cases

- Semua membership nonaktif, satu membership saja, banyak tenant bernama mirip.
- Switch gagal, session expired, factor challenge required, membership revoked saat switch.
- Form belum disimpan, operation sedang berlangsung, beberapa tab dan response in-flight.
- Berbeda role/permission antar tenant untuk akun sama.

## Testing / Validation

- [ ] Identity unit/integration tests own-membership scope, issuance, role correctness, revoke/delete/race dan session revocation.
- [ ] Gateway auth/header/session-boundary contract tests.
- [ ] Web tests cache/WS reset, stale responses, failure dan single-membership compatibility.
- [ ] Browser A→B→A dengan fixture role berbeda; verifikasi API response dan UI, termasuk dua tab.
- [ ] Formatter, Go tests/race checks, web tests/lint/typecheck/build dan required GitHub PR CI.
- [ ] ADR dan auth/API/security/web documentation sesuai hasil implementasi.

## Out of Scope

- Membuat membership lewat switch, parent-to-teacher dual persona dan arbitrary-role expansion.
- Undangan existing account (issue05), mengganti sistem auth atau global logout seluruh perangkat.
- Perubahan kebijakan Creator/platform approval.
