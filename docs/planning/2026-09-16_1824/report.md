# Backlog pengembangan KelolaKelas — run planning 2026-09-16

## Ringkasan eksekutif

**Bukti utama.** Discovery dilakukan read-only terhadap Linear (4 Project, 15 Issue termasuk 4 onboarding), `AGENTS.md`, `kelolakelas-docs` (README, executive summary, system context, architecture, known gaps, komponen, API, flow, data, security, testing, operations, ADR 0001–0003, ADR 014), kontrak intake `planning-contract.ts` dan contoh `planning-backlog.example.yaml`, serta inspeksi source code kelima repository (route registration, migrasi, use case, repository, middleware, test, CI, `git ls-files`). Klaim berisiko tinggi (fallback header tenant di identity dan academic, proxy gateway tidak menghapus header, lima use case sesi/jadwal tanpa tenant, klaim invoice yang tertahan, mapping result code callback) diverifikasi langsung pada baris kode yang dikutip.

**Current state paling penting.**

- Seluruh 10 issue run sebelumnya (KEL-5 s.d. KEL-15) berstatus Done dengan PR ter-merge; kode saat ini sudah memuat hasilnya (JWT secret wajib, invoice hanya internal, rekonsiliasi durable, permission tenant-admin dan katalog, katalog publik, student parent, checkout, status pembayaran). Tidak ada yang diusulkan ulang.
- Jalur akses lintas tenant masih terbuka dan terkonfirmasi: identity `extractTenantID` dan academic `tenantIDFromContext` memakai `X-Tenant-ID` dari client ketika claim tenant kosong (semua token parent), sementara proxy gateway tidak menghapus header tersebut. Lima operasi sesi/jadwal academic tidak menerima tenant sama sekali. Permission dievaluasi tanpa tenant.
- Siklus enrollment belum lengkap: enrollment `pending` menahan kuota selamanya, tidak ada status `expired`/`dropped` yang pernah ditulis, kegagalan pembuatan invoice meninggalkan transaksi `creating` yang tidak bisa diklaim ulang, `terminal_failed` tidak dapat diulang, dan `DUITKU_RETURN_URL` jatuh ke URL webhook.
- Dashboard tenant web tidak memiliki kontrol publikasi, edit kelas (API pun belum ada), tampilan enrollment/pembayaran, halaman pengaturan (masih placeholder), dan halaman penerimaan undangan yang ditautkan email identity.
- Operabilitas: health statis, tanpa request ID/access log, tanpa timeout proxy; binary build dan `dump.rdb` ter-commit; `.env.example` billing memuat kredensial nyata.

**Batasan discovery.** Review statis tanpa menjalankan service, migrasi, atau provider. Topologi deployment, TLS, dan jaringan tetap **Unknown**. Di Linear belum ada label `ai-ready`; label repository (`web`, `api-gateway`, `academic`, `identity`, `billing`) tersedia di team KelolaKelas. Estimate Linear memakai poin; issue sebelumnya memetakan S=1, M=2, L=3 dan pemetaan itu dipakai lagi. Ketiga Project lama masih berstatus Backlog meskipun seluruh issue-nya Done; penyesuaian status Project tidak termasuk usulan ini.

Payload lengkap (5 Project, 33 Issue) tervalidasi dengan `npm --prefix kelolakelas-ai-orchestrator run intake:validate -- ../planning-backlog-2026-09-16.yaml` → `{"event":"planning_backlog_validated","projects":5,"issues":33}`.

## 1. Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Tenant onboarding dan administrasi organisasi | `Implemented` | identity `cmd/server/main.go:103-131`; `tenant_usecase.go:93-156`; web `dashboard/tenant/{members,roles}` | Tautan undangan email menuju route web yang tidak ada; email undangan gagal tetap dilaporkan sukses (`invitation_usecase.go:78`); halaman settings web placeholder; status tenant hanya pernah `active` (tidak ada lifecycle) | KEL-7 selesai (permission admin). Lifecycle tenant ditunda (butuh keputusan) |
| Katalog, detail kelas, harga, kuota, jadwal, publikasi | `Implemented` (backend) / sebagian di web | academic `main.go:105-146`; migrasi `classes.is_published`, `class_schedules.capacity`; web `tenant/classes` | Tidak ada endpoint update kelas; web tidak punya kontrol publikasi maupun edit; katalog memanggil gRPC dan menulis snapshot tiap request; visibility tenant nonaktif tidak konsisten list vs detail | KEL-10, KEL-11 selesai |
| Discovery, pencarian, checkout, pembayaran, konfirmasi | `Implemented` | web `(public)/kelas`, `[id]/_actions`; academic `enrollment_usecase.go`; billing `transaction_usecase.go` | Return URL jatuh ke webhook (`config.go:127-128`); status harus reload manual; tidak ada metadata/canonical halaman katalog; `lang="en"` | KEL-11/14/15 selesai |
| Enrollment, akses materi, progres, notifikasi, dukungan | `Implemented` sebagian | statuses `enrollment.go:27`; billing email `subscription_worker.go:238,254` | Hanya transisi pending→active; tidak ada email hasil pembayaran; materi/progres/notifikasi in-app `Not found` | KEL-8 selesai (aktivasi durable) |
| Pesanan, refund/cancellation, laporan penjualan, settlement, administrasi tenant | `Not found` (cancel, refund, laporan, settlement) / `Configured` (wallet, ledger non-sandbox) | `enrollmentRepo.Delete` tak dipakai; billing `interfaces.go:23-40` tanpa implementasi; web tenant tanpa halaman enrollment | Pembatalan pending, tampilan enrollment/pembayaran tenant, pelepasan kuota; settlement/withdrawal butuh keputusan produk | Refund tetap di luar scope seperti Project sebelumnya |
| Peran/izin | `Implemented` (tenant admin, katalog) / `Not found` (student, enrollment, attendance, report) | academic `main.go:109-156`; identity `member_repository.go:78-82`; seeder 47 permission | Permission tidak di-scope tenant; role undangan tidak divalidasi; domain non-katalog hanya JWT | KEL-7/10 selesai; residual gap tercatat di docs 08 |
| Isolasi tenant | `Implemented` sebagian, **gap terkonfirmasi** | identity `role_handler.go:22-38`; academic `category_handler.go:143-152`, `schedule_usecase.go:275-479`; gateway `proxy_handler.go:39-95` | Fallback header client; proxy tidak strip header; lima operasi sesi/jadwal tanpa tenant; path tenant enrollment tidak dicocokkan | Belum pernah ada issue |
| Keamanan autentikasi | `Implemented` (JWT secret wajib) / `Not found` (logout, refresh, reset, MFA, lockout) | identity `pkg/jwt/jwt.go`; `auth_usecase.go:61-100`; web tanpa logout | Brute force per akun dan enumerasi timing; logout web; gRPC plaintext (`Unknown` jaringan) | KEL-5 selesai; refresh/MFA sengaja di luar scope |
| Reliabilitas pembayaran | `Implemented` (rekonsiliasi durable) | billing `reconciliation_worker.go`; `transaction_usecase.go:176-207,474-486` | Transaksi tertahan `creating`; tidak ada kedaluwarsa lokal; result code tak dikenal diabaikan; `terminal_failed` tanpa jalur ulang; `creating` tidak ada di whitelist filter | KEL-6/8 selesai |
| Observabilitas, performa, operasi | `Not found` (metrics, tracing, request ID, readiness) / `Configured` (CI gate 6 repo) | `cmd/server/health.go` statis; gateway tanpa timeout; tiada Dockerfile/IaC | Request ID + access log, readiness probe, timeout/body limit/error envelope proxy, caching tenant info katalog | Docker/IaC ditunda (keputusan platform) |
| Developer experience dan kebersihan repo | `Inferred` debt | `git ls-files` binary `server`/`main`, `dump.rdb`; billing `.env.example:1,11`; swagger academic 6 Sep vs `main.go` 15 Sep; `lastå_name` (`student.go:24`) | Bersihkan artefak, placeholder env, Makefile seed, migrasi down hilang, kontrak Swagger, branding Tutorin | Belum pernah ada issue |

## 2. Rekomendasi Linear Project

### [PROJECT] Isolasi tenant dan otorisasi menyeluruh

- **Orchestrator key:** `tenant-isolation-and-authorization`
- **Tujuan/outcome:** Setiap operasi tenant hanya berjalan dalam konteks tenant yang berasal dari membership terverifikasi, dan seluruh domain akademik sisi tenant memiliki permission enforcement yang konsisten.
- **Masalah yang diselesaikan:** Identity dan academic masih menerima header `X-Tenant-ID` dari client ketika claim tenant kosong, gateway tidak menetralkan header tersebut, lima operasi sesi/jadwal academic tidak di-scope tenant, permission dievaluasi tanpa tenant, dan domain student/enrollment/attendance/report masih hanya memerlukan JWT.
- **Nilai dan prioritas:** Dampak sangat tinggi karena jalur akses lintas tenant terkonfirmasi di kode; urgensi Urgent; confidence tinggi; effort keseluruhan M.
- **Scope:** Netralisasi header di gateway dan penghapusan fallback di identity/academic; tenant scoping mutasi sesi/jadwal; evaluasi role/permission terikat tenant termasuk kontrak gRPC; permission student/enrollment/attendance/report; perlindungan login.
- **Di luar scope:** mTLS gRPC; refresh token, logout backend, MFA, password reset; redesign RBAC atau UI permission-aware.
- **Success metrics:** Token parent/tanpa membership tidak dapat membaca atau mengubah data tenant mana pun lewat header; setiap operasi sesi/jadwal menolak ID tenant lain tanpa perubahan data; operasi student/enrollment/attendance/report sisi tenant menghasilkan 403 tanpa permission; login gagal berulang dibatasi dan terobservasi.
- **Dependencies/risiko:** Perubahan kontrak gRPC CheckPermission harus dikoordinasikan identity–academic dan memperbarui ADR 0002; penghapusan fallback header dapat memutus client yang bergantung pada header (web mengirim `X-Tenant-ID` dari cookie, tetapi login selalu memberi claim tenant untuk member).
- **Issue yang diusulkan:** Ambil konteks tenant identity hanya dari claim JWT → Scope mutasi sesi dan jadwal ke tenant pemilik → Netralkan header konteks tenant dan internal dari client di gateway → Ambil konteks tenant academic hanya dari claim JWT dan cocokkan tenant pada path → Evaluasi role dan permission hanya dalam tenant yang sama → Terapkan permission pada operasi student dan enrollment sisi tenant → Terapkan permission pada attendance dan report → Lindungi login dari brute force dan enumerasi akun.

### [PROJECT] Siklus hidup enrollment dan pembayaran yang lengkap

- **Orchestrator key:** `enrollment-payment-lifecycle`
- **Tujuan/outcome:** Setiap enrollment berakhir pada status final yang benar (aktif, dibatalkan, atau kedaluwarsa), kuota selalu mencerminkan pembayaran nyata, dan parent menerima konfirmasi hasil pembayaran.
- **Masalah yang diselesaikan:** Enrollment pending menahan kuota tanpa batas waktu, transaksi tidak pernah kedaluwarsa secara lokal, kegagalan pembuatan invoice meninggalkan transaksi di `creating`, callback dengan result code tidak dikenal diabaikan, tidak ada pembatalan, tidak ada email hasil pembayaran, dan rekonsiliasi `terminal_failed` tidak dapat ditemukan atau diulang.
- **Nilai dan prioritas:** Dampak tinggi pada kebenaran kuota dan kepercayaan pembeli; urgensi High; confidence tinggi; effort keseluruhan L.
- **Scope:** Pemulihan transaksi tertahan dan kedaluwarsa transaksi; pelepasan kuota saat gagal/kedaluwarsa/dibatalkan; pembatalan enrollment pending (backend); email hasil pembayaran; observability dan re-drive rekonsiliasi terminal.
- **Di luar scope:** Refund, withdrawal, settlement, voucher; pergantian payment gateway; reconciliation renewal di luar enrollment awal.
- **Success metrics:** Tidak ada transaksi tetap `creating` setelah kegagalan provider; enrollment tak dibayar melepaskan kuota setelah invoice kedaluwarsa; parent menerima email berhasil/gagal tepat satu kali; setiap `terminal_failed` dapat dilihat dan diulang tanpa callback provider.
- **Dependencies/risiko:** Transisi status lintas billing–academic harus idempotent mengikuti ADR 0001; callback paid yang datang setelah kedaluwarsa/pembatalan lokal harus tetap tercatat dan terobservasi.
- **Issue yang diusulkan:** Pulihkan transaksi yang tertahan di status creating → Kedaluwarsakan transaksi yang tidak dibayar dan tangani result code callback → Lepaskan kuota enrollment ketika pembayaran gagal atau kedaluwarsa → Sediakan pembatalan enrollment pending oleh parent → Kirim email konfirmasi pembayaran berhasil dan gagal → Jadikan rekonsiliasi terminal_failed dapat ditemukan dan diulang.

### [PROJECT] Operasional tenant untuk menjual kelas

- **Orchestrator key:** `tenant-selling-operations`
- **Tujuan/outcome:** Owner dan staf tenant dapat memublikasikan, memperbarui, dan memantau penjualan kelas serta mengelola profil dan tim mereka dari web tanpa akses API langsung.
- **Masalah yang diselesaikan:** Dashboard tenant hanya dapat membuat kelas; tidak ada kontrol publikasi, edit kelas (API pun belum ada), tampilan enrollment/pembayaran, halaman pengaturan masih placeholder, dan tautan undangan email mengarah ke halaman web yang tidak ada.
- **Nilai dan prioritas:** Dampak tinggi karena tanpa publikasi dan edit dari web tenant tidak dapat menjual; urgensi High; confidence tinggi; effort keseluruhan L.
- **Scope:** Publikasi dan edit kelas termasuk endpoint update; tampilan enrollment dan status pembayaran tenant; halaman pengaturan dan lokasi; penerimaan undangan dari web dan status pengiriman email undangan.
- **Di luar scope:** Laporan penjualan agregat, settlement, payout; kalender jadwal, absensi, rapor di web; redesign visual.
- **Success metrics:** Tenant dapat memublikasikan kelas dan melihatnya di katalog; memperbaiki nama/deskripsi/harga/kategori tanpa menghapus kelas; melihat pendaftar dan status pembayarannya; staf yang diundang dapat menyelesaikan pendaftaran dari tautan email.
- **Dependencies/risiko:** Endpoint update kelas memerlukan keputusan pengaruh perubahan harga/tipe terhadap enrollment yang ada; tampilan enrollment tenant bergantung pada `enrollment:read` setelah enforcement.
- **Issue yang diusulkan:** Sediakan kontrol publikasi kelas di dashboard tenant → Sediakan endpoint pembaruan kelas untuk tenant → Sediakan edit kelas di dashboard tenant → Tampilkan enrollment dan status pembayaran kepada tenant → Sediakan halaman penerimaan undangan anggota tenant → Laporkan kegagalan pengiriman email undangan → Hadirkan halaman pengaturan profil dan lokasi tenant.

### [PROJECT] Operabilitas, ketahanan, dan kebersihan repository

- **Orchestrator key:** `platform-operability`
- **Tujuan/outcome:** Operator dapat mendiagnosis request lintas service, mendeteksi dependency yang tidak sehat, dan gateway tetap stabil saat downstream lambat; repository bebas artefak build dan kredensial contoh nyata.
- **Masalah yang diselesaikan:** Tidak ada request ID, access log, readiness check, atau timeout proxy; binary build dan dump Redis ter-commit; contoh env billing berisi nilai kredensial nyata; katalog memanggil gRPC dan menulis snapshot untuk setiap request; kontrak API academic memiliki typo field dan Swagger usang.
- **Nilai dan prioritas:** Dampak sedang–tinggi pada kemampuan operasi dan performa katalog; urgensi Medium; confidence tinggi; effort keseluruhan M.
- **Scope:** Timeout, batas body, error envelope proxy; request ID dan access log di gateway dan ketiga service; readiness check; pembersihan artefak dan contoh konfigurasi; caching info tenant katalog; perbaikan kontrak API academic.
- **Di luar scope:** Containerization, IaC, deployment pipeline, metrics/tracing stack; kebijakan fail-closed rate limiter; penulisan ulang git history.
- **Success metrics:** Setiap request memiliki request ID yang sama di log gateway dan service; downstream mati menghasilkan JSON 502/504 dalam batas waktu; readiness gagal ketika DB/dependency wajib tidak tersedia; tidak ada binary/dump yang dilacak git.
- **Dependencies/risiko:** Access log tidak boleh mencatat token/kredensial/PII; perubahan visibility tenant nonaktif memengaruhi hasil katalog publik.
- **Issue yang diusulkan:** Terapkan timeout, batas body, dan error envelope pada proxy gateway → Tambahkan request ID dan access log terstruktur di gateway → Catat request dan event domain dengan request ID di identity, academic, dan billing → Sediakan readiness check dengan probe dependency → Bersihkan artefak build, dump data, dan contoh kredensial → Batasi pemanggilan gRPC dan penulisan snapshot tenant pada katalog → Perbaiki field last_name student dan segarkan kontrak Swagger academic.

### [PROJECT] Pengalaman pembeli yang lengkap di web

- **Orchestrator key:** `buyer-web-experience`
- **Tujuan/outcome:** Parent dapat menyelesaikan siklus akun dan pembelian di web tanpa jalan buntu: kembali dari pembayaran dengan status terkini, membatalkan enrollment pending, keluar dari sesi, dan menemukan halaman katalog melalui mesin pencari.
- **Masalah yang diselesaikan:** Setelah membayar parent diarahkan ke URL callback billing, halaman status harus dimuat ulang manual, tidak ada logout, halaman katalog tanpa metadata dengan `lang="en"` dan branding Tutorin, sebagian route tanpa error boundary.
- **Nilai dan prioritas:** Dampak tinggi pada konversi dan kepercayaan; urgensi High untuk return page dan logout; confidence tinggi; effort keseluruhan M.
- **Scope:** Halaman kembali dari pembayaran dan pembaruan status otomatis; pembatalan enrollment pending dari web; logout; metadata publik, bahasa, branding; error boundary dan not-found.
- **Di luar scope:** Review/rating, promo, cart, rekomendasi; materi, progres, notifikasi in-app; redesign visual.
- **Success metrics:** Parent yang kembali dari Duitku melihat status backend terkini tanpa reload; parent dapat logout dari setiap halaman terautentikasi; halaman katalog memiliki title/description/canonical benar; error pada route publik dan dashboard menampilkan halaman yang dapat dipulihkan.
- **Dependencies/risiko:** Return page memerlukan `DUITKU_RETURN_URL` billing mengarah ke web (dependency eksternal terstruktur); pembatalan dari web bergantung pada endpoint backend.
- **Issue yang diusulkan:** Sediakan halaman kembali dari pembayaran dengan pembaruan status otomatis → Sediakan logout untuk parent dan tenant → Sediakan pembatalan enrollment pending dari halaman parent → Rapikan metadata halaman publik, bahasa dokumen, dan branding web → Lengkapi error boundary dan halaman not-found.

## 3. Draft Linear Issue

Diurutkan menurut Project, prioritas, dan dependency. Setiap draft identik secara makna dengan entry pada payload di bagian 6 (dirender dari payload yang sama).

### [IMPROVEMENT] Netralkan header konteks tenant dan internal dari client di gateway

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Urgent`
- **Estimate:** `S`
- **Complexity:** `high`
- **Complexity rationale:** Kode kecil, tetapi boundary keamanan pertama untuk akses lintas tenant; salah strip/set memutus parent sah atau meneruskan tenant palsu.
- **Labels:** `api-gateway`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `gateway-strip-untrusted-context-headers`

## Background / Problem

Proxy academic dan billing hanya menetapkan `X-Tenant-ID` ketika claim tenant JWT tidak kosong (`internal/delivery/http/handler/proxy_handler.go:66-74,88-95`), proxy identity tidak menyentuh header sama sekali (`:50-52`), dan tidak ada header client yang dihapus. Middleware JWT gateway tidak mewajibkan claim apa pun non-empty (`internal/delivery/http/middleware/auth_middleware.go:78-83`). Token parent membawa tenant kosong, sehingga header `X-Tenant-ID` dan `X-Internal-Service-Credential` buatan client diteruskan apa adanya ke downstream yang masih memakai header tersebut sebagai fallback (identity `role_handler.go:32-35`, academic `list_handler.go:28-34`).

## Goal

Request yang melewati gateway tidak pernah membawa header konteks tenant atau kredensial internal buatan client; header tenant selalu merepresentasikan claim JWT yang tervalidasi.

## Requirements

- Hapus `X-Tenant-ID` dan `X-Internal-Service-Credential` dari setiap request masuk sebelum diproksikan, pada route publik maupun protected.
- Pada route protected, tetapkan `X-Tenant-ID` dari claim JWT untuk proxy identity, academic, dan billing; jangan menetapkan header ketika claim kosong.
- Middleware JWT gateway menolak token tanpa `user_id`, serta token non-parent tanpa `tenant_id`, konsisten dengan academic.
- Route publik, CORS, rate limiting, dan proxy Swagger tetap berfungsi seperti sekarang.

## Acceptance Criteria

- [ ] Request protected dengan header X-Tenant-ID buatan client tiba di downstream dengan nilai dari claim, atau tanpa header ketika claim kosong
- [ ] Request publik maupun protected dengan X-Internal-Service-Credential dari client tiba di downstream tanpa header tersebut
- [ ] Token tanpa user_id atau token non-parent tanpa tenant_id ditolak 401 di gateway
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: gateway adalah boundary pertama terhadap akses lintas tenant; kesalahan strip/set dapat meneruskan tenant palsu atau memutus request parent yang sah dengan claim tenant kosong. Downstream tetap tidak boleh mempercayai header ini karena direct service exposure masih mungkin; penghapusan fallback di identity dan academic ditangani issue terpisah. Jangan mengubah path, body, atau header Authorization.

Relevant areas:

- `kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`
- `kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go`
- `kelolakelas-api-gateway/internal/delivery/http/router_test.go`

## Edge Cases

- Token parent tanpa tenant_id disertai header X-Tenant-ID buatan client.
- Header dikirim dengan kapitalisasi berbeda atau duplikat.
- Route proxy Swagger dan webhook Duitku yang tidak melewati middleware JWT.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test regresi membuktikan header buatan client tidak pernah mencapai downstream pada route publik dan protected

## Out of Scope

- Penghapusan fallback header di identity dan academic.
- Injeksi X-User-ID atau penggantian validasi JWT downstream.
- Refresh token dan revocation.

## AI Orchestrator Contract

```json
{
  "draftKey": "gateway-strip-untrusted-context-headers",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Netralkan header konteks tenant dan internal dari client di gateway",
  "type": "Improvement",
  "priority": "Urgent",
  "estimate": "S",
  "complexity": "high",
  "labels": [
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Proxy academic dan billing hanya menetapkan `X-Tenant-ID` ketika claim tenant JWT tidak kosong (`internal/delivery/http/handler/proxy_handler.go:66-74,88-95`), proxy identity tidak menyentuh header sama sekali (`:50-52`), dan tidak ada header client yang dihapus. Middleware JWT gateway tidak mewajibkan claim apa pun non-empty (`internal/delivery/http/middleware/auth_middleware.go:78-83`). Token parent membawa tenant kosong, sehingga header `X-Tenant-ID` dan `X-Internal-Service-Credential` buatan client diteruskan apa adanya ke downstream yang masih memakai header tersebut sebagai fallback (identity `role_handler.go:32-35`, academic `list_handler.go:28-34`).",
    "goal": "Request yang melewati gateway tidak pernah membawa header konteks tenant atau kredensial internal buatan client; header tenant selalu merepresentasikan claim JWT yang tervalidasi.",
    "requirements": [
      "Hapus `X-Tenant-ID` dan `X-Internal-Service-Credential` dari setiap request masuk sebelum diproksikan, pada route publik maupun protected.",
      "Pada route protected, tetapkan `X-Tenant-ID` dari claim JWT untuk proxy identity, academic, dan billing; jangan menetapkan header ketika claim kosong.",
      "Middleware JWT gateway menolak token tanpa `user_id`, serta token non-parent tanpa `tenant_id`, konsisten dengan academic.",
      "Route publik, CORS, rate limiting, dan proxy Swagger tetap berfungsi seperti sekarang."
    ],
    "acceptanceCriteria": [
      "Request protected dengan header X-Tenant-ID buatan client tiba di downstream dengan nilai dari claim, atau tanpa header ketika claim kosong",
      "Request publik maupun protected dengan X-Internal-Service-Credential dari client tiba di downstream tanpa header tersebut",
      "Token tanpa user_id atau token non-parent tanpa tenant_id ditolak 401 di gateway",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: gateway adalah boundary pertama terhadap akses lintas tenant; kesalahan strip/set dapat meneruskan tenant palsu atau memutus request parent yang sah dengan claim tenant kosong. Downstream tetap tidak boleh mempercayai header ini karena direct service exposure masih mungkin; penghapusan fallback di identity dan academic ditangani issue terpisah. Jangan mengubah path, body, atau header Authorization.",
    "relevantAreas": [
      "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go",
      "kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go",
      "kelolakelas-api-gateway/internal/delivery/http/router_test.go"
    ],
    "edgeCases": [
      "Token parent tanpa tenant_id disertai header X-Tenant-ID buatan client.",
      "Header dikirim dengan kapitalisasi berbeda atau duplikat.",
      "Route proxy Swagger dan webhook Duitku yang tidak melewati middleware JWT."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test regresi membuktikan header buatan client tidak pernah mencapai downstream pada route publik dan protected"
    ],
    "outOfScope": [
      "Penghapusan fallback header di identity dan academic.",
      "Injeksi X-User-ID atau penggantian validasi JWT downstream.",
      "Refresh token dan revocation."
    ]
  }
}
```

---

### [IMPROVEMENT] Ambil konteks tenant identity hanya dari claim JWT

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Urgent`
- **Estimate:** `S`
- **Complexity:** `critical`
- **Complexity rationale:** Jalur akses lintas tenant terkonfirmasi di kode (PII member, mutasi role tenant lain); scope kecil tetapi dampak keamanan serius.
- **Labels:** `identity`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `identity-tenant-context-from-jwt-only`

## Background / Problem

`extractTenantID` (`internal/delivery/http/handler/role_handler.go:22-38`) memakai header `X-Tenant-ID` dari client ketika claim tenant bernilai nil. Login memberi `tenant_id` nil untuk user tanpa membership aktif, termasuk semua parent (`internal/usecase/auth_usecase.go:77-86`). Akibatnya parent terautentikasi dapat membaca `GET /members`, `GET /tutors`, `GET /roles`, `GET /tenant/settings`, dan `GET /tenant/settings/location` tenant mana pun, dan mencapai mutasi bila memiliki `role_id`. Pola ini dipakai member, role, dan tenant handler; hanya invitation handler yang mengambil tenant ketat dari JWT (`invitation_handler.go:55-73`).

## Goal

Endpoint tenant identity hanya beroperasi pada tenant dari membership aktif caller; caller tanpa membership ditolak sebelum data apa pun dibaca.

## Requirements

- Hapus fallback header X-Tenant-ID pada seluruh handler member, role, dan tenant.
- Token dengan tenant_id kosong menerima 403 pada setiap endpoint tenant, tanpa query ke repository.
- Member dengan claim tenant valid tetap mendapatkan perilaku yang sama seperti sekarang.
- Perilaku invitation creation, login, dan registrasi tidak berubah.

## Acceptance Criteria

- [ ] Token parent dengan header X-Tenant-ID milik tenant lain menerima 403 pada GET /members, GET /tutors, GET /roles, GET /tenant/settings, dan seluruh mutasinya tanpa data tenant tersebut terbaca atau berubah
- [ ] Member dengan claim tenant valid tetap dapat memakai endpoint yang sama
- [ ] Header X-Tenant-ID apa pun diabaikan sepenuhnya oleh identity
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran PII daftar member dan mutasi role/member tenant lain, terkonfirmasi di kode. Perubahan harus berdiri sendiri tanpa bergantung pada gateway karena service dapat diakses langsung. Penolakan harus terjadi di handler sebelum use case atau repository dipanggil, dan dibedakan dari 401 (token tidak valid) serta 400 (input tidak valid).

Relevant areas:

- `kelolakelas-identity-service/internal/delivery/http/handler/role_handler.go`
- `kelolakelas-identity-service/internal/delivery/http/handler/member_handler.go`
- `kelolakelas-identity-service/internal/delivery/http/handler/tenant_handler.go`

## Edge Cases

- Claim tenant_id berupa string kosong versus UUID nil.
- User dengan membership yang dinonaktifkan setelah token diterbitkan.
- Header berisi UUID tenant milik caller sendiri; tetap harus diabaikan dan claim yang dipakai.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test regresi lintas tenant membuktikan token parent plus header tenant lain menghasilkan 403 pada setiap route tenant tanpa perubahan data

## Out of Scope

- Pemilihan tenant untuk user dengan lebih dari satu membership.
- Permission read (member:read, tenant:read) pada endpoint GET.
- Perubahan gateway.

## AI Orchestrator Contract

```json
{
  "draftKey": "identity-tenant-context-from-jwt-only",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Ambil konteks tenant identity hanya dari claim JWT",
  "type": "Improvement",
  "priority": "Urgent",
  "estimate": "S",
  "complexity": "critical",
  "labels": [
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "identity"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`extractTenantID` (`internal/delivery/http/handler/role_handler.go:22-38`) memakai header `X-Tenant-ID` dari client ketika claim tenant bernilai nil. Login memberi `tenant_id` nil untuk user tanpa membership aktif, termasuk semua parent (`internal/usecase/auth_usecase.go:77-86`). Akibatnya parent terautentikasi dapat membaca `GET /members`, `GET /tutors`, `GET /roles`, `GET /tenant/settings`, dan `GET /tenant/settings/location` tenant mana pun, dan mencapai mutasi bila memiliki `role_id`. Pola ini dipakai member, role, dan tenant handler; hanya invitation handler yang mengambil tenant ketat dari JWT (`invitation_handler.go:55-73`).",
    "goal": "Endpoint tenant identity hanya beroperasi pada tenant dari membership aktif caller; caller tanpa membership ditolak sebelum data apa pun dibaca.",
    "requirements": [
      "Hapus fallback header X-Tenant-ID pada seluruh handler member, role, dan tenant.",
      "Token dengan tenant_id kosong menerima 403 pada setiap endpoint tenant, tanpa query ke repository.",
      "Member dengan claim tenant valid tetap mendapatkan perilaku yang sama seperti sekarang.",
      "Perilaku invitation creation, login, dan registrasi tidak berubah."
    ],
    "acceptanceCriteria": [
      "Token parent dengan header X-Tenant-ID milik tenant lain menerima 403 pada GET /members, GET /tutors, GET /roles, GET /tenant/settings, dan seluruh mutasinya tanpa data tenant tersebut terbaca atau berubah",
      "Member dengan claim tenant valid tetap dapat memakai endpoint yang sama",
      "Header X-Tenant-ID apa pun diabaikan sepenuhnya oleh identity",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran PII daftar member dan mutasi role/member tenant lain, terkonfirmasi di kode. Perubahan harus berdiri sendiri tanpa bergantung pada gateway karena service dapat diakses langsung. Penolakan harus terjadi di handler sebelum use case atau repository dipanggil, dan dibedakan dari 401 (token tidak valid) serta 400 (input tidak valid).",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/delivery/http/handler/role_handler.go",
      "kelolakelas-identity-service/internal/delivery/http/handler/member_handler.go",
      "kelolakelas-identity-service/internal/delivery/http/handler/tenant_handler.go"
    ],
    "edgeCases": [
      "Claim tenant_id berupa string kosong versus UUID nil.",
      "User dengan membership yang dinonaktifkan setelah token diterbitkan.",
      "Header berisi UUID tenant milik caller sendiri; tetap harus diabaikan dan claim yang dipakai."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test regresi lintas tenant membuktikan token parent plus header tenant lain menghasilkan 403 pada setiap route tenant tanpa perubahan data"
    ],
    "outOfScope": [
      "Pemilihan tenant untuk user dengan lebih dari satu membership.",
      "Permission read (member:read, tenant:read) pada endpoint GET.",
      "Perubahan gateway."
    ]
  }
}
```

---

### [IMPROVEMENT] Ambil konteks tenant academic hanya dari claim JWT dan cocokkan tenant pada path

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Urgent`
- **Estimate:** `S`
- **Complexity:** `high`
- **Complexity rationale:** Kebocoran data katalog belum publik dan enrollment atas nama tenant lain; beberapa handler harus diubah konsisten.
- **Labels:** `academic`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `academic-tenant-context-from-jwt-only`

## Background / Problem

`tenantIDFromContext` (`internal/delivery/http/handler/category_handler.go:143-152`), `list_handler.go:28-34`, dan `class_handler.go:42-44,88-90` memakai header `X-Tenant-ID` ketika claim tenant kosong. Middleware auth mengizinkan tenant kosong untuk parent (`internal/delivery/http/middleware/auth_middleware.go:50`), sehingga parent dapat membaca `GET /categories`, `GET /classes`, dan `GET /schedules` tenant mana pun termasuk kelas yang belum dipublikasikan. `POST /tenants/:tenant_id/enrollments` mengambil tenant dari path tanpa dicocokkan dengan claim (`enrollment_handler.go:74`). Anotasi Swagger masih mendokumentasikan header ini sebagai wajib.

## Goal

Seluruh operasi tenant academic memakai tenant dari claim JWT; tenant pada path harus sama dengan claim, dan caller tanpa tenant ditolak pada route yang memerlukan tenant.

## Requirements

- Hapus fallback header X-Tenant-ID pada category, class, list, dan schedule handler.
- Caller non-parent dengan tenant pada path yang berbeda dari claim menerima 403 pada POST /tenants/:tenant_id/enrollments.
- Parent pada route yang memerlukan konteks tenant menerima 403, bukan 400 atau 500.
- Alur enrollment katalog parent, public catalog, dan permission middleware yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Token parent dengan header X-Tenant-ID menerima 403 pada GET /categories, GET /classes, dan GET /schedules tanpa data tenant terbaca
- [ ] Member tenant A yang memanggil POST /tenants/{tenant B}/enrollments menerima 403 tanpa enrollment dibuat
- [ ] Member dengan claim tenant valid tetap dapat menjalankan seluruh operasi katalog dan enrollment tenantnya
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebocoran data katalog yang belum dipublikasikan dan pembuatan enrollment atas nama tenant lain. Permission middleware sudah menolak parent tanpa role_id pada mutasi, tetapi route GET tidak dilindungi. Perbarui anotasi Swagger yang menyebut X-Tenant-ID sebagai parameter wajib dan dokumentasi API academic.

Relevant areas:

- `kelolakelas-academic-service/internal/delivery/http/handler/category_handler.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/list_handler.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go`

## Edge Cases

- Parent memanggil POST /tenants/:tenant_id/enrollments; alur EnrollPublic yang ada harus tetap dipakai.
- Path tenant bukan UUID valid.
- Claim tenant valid tetapi tenant nonaktif menurut identity.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test regresi lintas tenant untuk setiap handler yang sebelumnya memakai fallback header

## Out of Scope

- Scoping mutasi sesi/jadwal yang tidak menerima tenant sama sekali.
- Permission untuk student, enrollment, attendance, dan report.
- Perubahan gateway.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-tenant-context-from-jwt-only",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Ambil konteks tenant academic hanya dari claim JWT dan cocokkan tenant pada path",
  "type": "Improvement",
  "priority": "Urgent",
  "estimate": "S",
  "complexity": "high",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`tenantIDFromContext` (`internal/delivery/http/handler/category_handler.go:143-152`), `list_handler.go:28-34`, dan `class_handler.go:42-44,88-90` memakai header `X-Tenant-ID` ketika claim tenant kosong. Middleware auth mengizinkan tenant kosong untuk parent (`internal/delivery/http/middleware/auth_middleware.go:50`), sehingga parent dapat membaca `GET /categories`, `GET /classes`, dan `GET /schedules` tenant mana pun termasuk kelas yang belum dipublikasikan. `POST /tenants/:tenant_id/enrollments` mengambil tenant dari path tanpa dicocokkan dengan claim (`enrollment_handler.go:74`). Anotasi Swagger masih mendokumentasikan header ini sebagai wajib.",
    "goal": "Seluruh operasi tenant academic memakai tenant dari claim JWT; tenant pada path harus sama dengan claim, dan caller tanpa tenant ditolak pada route yang memerlukan tenant.",
    "requirements": [
      "Hapus fallback header X-Tenant-ID pada category, class, list, dan schedule handler.",
      "Caller non-parent dengan tenant pada path yang berbeda dari claim menerima 403 pada POST /tenants/:tenant_id/enrollments.",
      "Parent pada route yang memerlukan konteks tenant menerima 403, bukan 400 atau 500.",
      "Alur enrollment katalog parent, public catalog, dan permission middleware yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Token parent dengan header X-Tenant-ID menerima 403 pada GET /categories, GET /classes, dan GET /schedules tanpa data tenant terbaca",
      "Member tenant A yang memanggil POST /tenants/{tenant B}/enrollments menerima 403 tanpa enrollment dibuat",
      "Member dengan claim tenant valid tetap dapat menjalankan seluruh operasi katalog dan enrollment tenantnya",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebocoran data katalog yang belum dipublikasikan dan pembuatan enrollment atas nama tenant lain. Permission middleware sudah menolak parent tanpa role_id pada mutasi, tetapi route GET tidak dilindungi. Perbarui anotasi Swagger yang menyebut X-Tenant-ID sebagai parameter wajib dan dokumentasi API academic.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/delivery/http/handler/category_handler.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/list_handler.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go"
    ],
    "edgeCases": [
      "Parent memanggil POST /tenants/:tenant_id/enrollments; alur EnrollPublic yang ada harus tetap dipakai.",
      "Path tenant bukan UUID valid.",
      "Claim tenant valid tetapi tenant nonaktif menurut identity."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test regresi lintas tenant untuk setiap handler yang sebelumnya memakai fallback header"
    ],
    "outOfScope": [
      "Scoping mutasi sesi/jadwal yang tidak menerima tenant sama sekali.",
      "Permission untuk student, enrollment, attendance, dan report.",
      "Perubahan gateway."
    ]
  }
}
```

---

### [IMPROVEMENT] Scope mutasi sesi dan jadwal ke tenant pemilik

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Urgent`
- **Estimate:** `M`
- **Complexity:** `critical`
- **Complexity rationale:** Mutasi dan kebocoran PII lintas tenant terkonfirmasi pada lima operasi tanpa tenant; use case terbesar dan belum memiliki test.
- **Labels:** `academic`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `academic-scope-session-schedule-mutations`

## Background / Problem

`RescheduleSession`, `ChangeSchedulePermanent`, `ChangeTutorTemporary`, `ChangeTutorPermanent`, dan `GetSessionAttendees` (`internal/usecase/schedule_usecase.go:275,326,395,416,476`) tidak menerima tenant ID, dan handler-nya (`internal/delivery/http/handler/schedule_handler.go:151-168,210-227,269-286,328-345,386-398`) tidak menyelesaikan tenant. Mereka memuat sesi/jadwal lewat `GetByID` yang tidak di-scope, padahal `GetByIDForTenant` sudah tersedia (`internal/repository/session_repository.go:44`). Member tenant A dengan `schedule:update` dapat mengubah sesi tenant B atau membaca daftar attendee (data student) tenant B.

## Goal

Setiap operasi sesi dan jadwal hanya dapat menyentuh data milik tenant caller; ID milik tenant lain diperlakukan seperti tidak ada.

## Requirements

- Kelima use case menerima tenant dari claim JWT dan seluruh pemuatan sesi/jadwal/kelas terkait di-scope tenant.
- ID sesi atau jadwal milik tenant lain menghasilkan 404 tanpa perubahan data.
- Route alias body-param dan path-param yang ada tetap didukung.
- Permission middleware schedule:update yang ada tetap berjalan sebelum handler.

## Acceptance Criteria

- [ ] Member tenant A tidak dapat mereschedule, mengubah permanen, mengganti tutor, atau membaca attendee sesi tenant B
- [ ] Member tenant yang berwenang tetap dapat menjalankan kelima operasi pada sesinya sendiri melalui route alias maupun path
- [ ] Kelima operasi memiliki test lintas tenant yang membuktikan 404 dan tidak ada perubahan data
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: mutasi dan kebocoran data lintas tenant terkonfirmasi di kode, termasuk PII student pada attendee. Gunakan pola repository scoped yang sudah ada; jangan mengandalkan pemeriksaan di handler saja. Pemuatan jadwal/kelas turunan di dalam use case juga harus memastikan kepemilikan tenant yang sama.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/schedule_handler.go`
- `kelolakelas-academic-service/internal/repository/session_repository.go`
- `kelolakelas-academic-service/internal/repository/schedule_repository.go`

## Edge Cases

- Request memakai session_id di body sekaligus id di path yang berbeda.
- Tutor pengganti berasal dari tenant lain.
- Jadwal target perubahan permanen milik kelas tenant lain.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test lintas tenant untuk kelima operasi membuktikan tidak ada baris yang berubah pada tenant lain

## Out of Scope

- Penghapusan route alias.
- Validasi tutor terhadap membership identity.
- Permission attendance dan report.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-scope-session-schedule-mutations",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Scope mutasi sesi dan jadwal ke tenant pemilik",
  "type": "Improvement",
  "priority": "Urgent",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`RescheduleSession`, `ChangeSchedulePermanent`, `ChangeTutorTemporary`, `ChangeTutorPermanent`, dan `GetSessionAttendees` (`internal/usecase/schedule_usecase.go:275,326,395,416,476`) tidak menerima tenant ID, dan handler-nya (`internal/delivery/http/handler/schedule_handler.go:151-168,210-227,269-286,328-345,386-398`) tidak menyelesaikan tenant. Mereka memuat sesi/jadwal lewat `GetByID` yang tidak di-scope, padahal `GetByIDForTenant` sudah tersedia (`internal/repository/session_repository.go:44`). Member tenant A dengan `schedule:update` dapat mengubah sesi tenant B atau membaca daftar attendee (data student) tenant B.",
    "goal": "Setiap operasi sesi dan jadwal hanya dapat menyentuh data milik tenant caller; ID milik tenant lain diperlakukan seperti tidak ada.",
    "requirements": [
      "Kelima use case menerima tenant dari claim JWT dan seluruh pemuatan sesi/jadwal/kelas terkait di-scope tenant.",
      "ID sesi atau jadwal milik tenant lain menghasilkan 404 tanpa perubahan data.",
      "Route alias body-param dan path-param yang ada tetap didukung.",
      "Permission middleware schedule:update yang ada tetap berjalan sebelum handler."
    ],
    "acceptanceCriteria": [
      "Member tenant A tidak dapat mereschedule, mengubah permanen, mengganti tutor, atau membaca attendee sesi tenant B",
      "Member tenant yang berwenang tetap dapat menjalankan kelima operasi pada sesinya sendiri melalui route alias maupun path",
      "Kelima operasi memiliki test lintas tenant yang membuktikan 404 dan tidak ada perubahan data",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: mutasi dan kebocoran data lintas tenant terkonfirmasi di kode, termasuk PII student pada attendee. Gunakan pola repository scoped yang sudah ada; jangan mengandalkan pemeriksaan di handler saja. Pemuatan jadwal/kelas turunan di dalam use case juga harus memastikan kepemilikan tenant yang sama.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/schedule_handler.go",
      "kelolakelas-academic-service/internal/repository/session_repository.go",
      "kelolakelas-academic-service/internal/repository/schedule_repository.go"
    ],
    "edgeCases": [
      "Request memakai session_id di body sekaligus id di path yang berbeda.",
      "Tutor pengganti berasal dari tenant lain.",
      "Jadwal target perubahan permanen milik kelas tenant lain."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test lintas tenant untuk kelima operasi membuktikan tidak ada baris yang berubah pada tenant lain"
    ],
    "outOfScope": [
      "Penghapusan route alias.",
      "Validasi tutor terhadap membership identity.",
      "Permission attendance dan report."
    ]
  }
}
```

---

### [IMPROVEMENT] Evaluasi role dan permission hanya dalam tenant yang sama

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Mengubah kontrak gRPC internal lintas dua service dengan urutan deploy; kesalahan dapat memutus semua mutasi katalog.
- **Labels:** `identity`, `academic`, `ai-ready`
- **Dependencies:** `identity-tenant-context-from-jwt-only`
- **draftKey:** `identity-scope-role-checks-to-tenant`

## Background / Problem

`HasPermission` (`kelolakelas-identity-service/internal/repository/member_repository.go:78-82`) dan gRPC `CheckPermission` (`internal/delivery/grpc/permission_service.go:63-88`) memeriksa `role_id` secara global tanpa tenant, sehingga role tenant A memenuhi permission saat beroperasi pada tenant B. `CreateInvitation` (`internal/usecase/invitation_usecase.go:38-75`) tidak memvalidasi bahwa `role_id` undangan milik tenant tersebut atau system role, sehingga undangan dapat memberikan role tenant lain. Academic mengirim hanya `role_id` dan `permission` (`kelolakelas-academic-service/pkg/grpcclient/permission_client.go:31-40`).

## Goal

Keputusan permission selalu terikat pada tenant yang sedang dioperasikan, dan role yang diberikan lewat undangan atau perubahan role selalu milik tenant tersebut atau system role.

## Requirements

- Pemeriksaan permission menerima tenant dan hanya lolos bila role milik tenant tersebut atau system role.
- Kontrak gRPC CheckPermission menerima tenant_id; academic mengirim tenant dari claim; identity menolak request tanpa tenant setelah masa transisi yang disepakati di ADR 0002.
- Invitation menolak role_id yang bukan milik tenant atau bukan system role dengan error validasi.
- Perilaku member role update yang sudah memvalidasi role tenant tetap terjaga.

## Acceptance Criteria

- [ ] Undangan dengan role_id milik tenant lain ditolak tanpa undangan dibuat
- [ ] Permission dengan role milik tenant lain ditolak pada jalur HTTP identity maupun gRPC
- [ ] Mutasi katalog academic oleh member berwenang tetap berhasil setelah academic mengirim tenant_id
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: perubahan kontrak gRPC internal lintas dua service; deploy identity yang menerima tenant_id opsional harus mendahului academic, lalu identity mewajibkannya. Perbarui ADR 0002 dan dokumentasi security. Permission client academic memakai structpb tanpa proto; jaga kompatibilitas payload.

Relevant areas:

- `kelolakelas-identity-service/internal/repository/member_repository.go`
- `kelolakelas-identity-service/internal/delivery/grpc/permission_service.go`
- `kelolakelas-identity-service/internal/usecase/invitation_usecase.go`
- `kelolakelas-academic-service/pkg/grpcclient/permission_client.go`
- `kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go`

## Edge Cases

- System role (tenant_id NULL) dipakai pada tenant mana pun.
- Role dihapus setelah token diterbitkan.
- Academic versi lama memanggil identity versi baru tanpa tenant_id.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test kompatibilitas kontrak gRPC membuktikan urutan deploy identity lalu academic tidak memutus mutasi katalog

## Out of Scope

- Caching hasil permission.
- mTLS gRPC.
- Redesign RBAC.

## AI Orchestrator Contract

```json
{
  "draftKey": "identity-scope-role-checks-to-tenant",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Evaluasi role dan permission hanya dalam tenant yang sama",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "academic"
  ],
  "blockedByDraftKeys": [
    "identity-tenant-context-from-jwt-only"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`HasPermission` (`kelolakelas-identity-service/internal/repository/member_repository.go:78-82`) dan gRPC `CheckPermission` (`internal/delivery/grpc/permission_service.go:63-88`) memeriksa `role_id` secara global tanpa tenant, sehingga role tenant A memenuhi permission saat beroperasi pada tenant B. `CreateInvitation` (`internal/usecase/invitation_usecase.go:38-75`) tidak memvalidasi bahwa `role_id` undangan milik tenant tersebut atau system role, sehingga undangan dapat memberikan role tenant lain. Academic mengirim hanya `role_id` dan `permission` (`kelolakelas-academic-service/pkg/grpcclient/permission_client.go:31-40`).",
    "goal": "Keputusan permission selalu terikat pada tenant yang sedang dioperasikan, dan role yang diberikan lewat undangan atau perubahan role selalu milik tenant tersebut atau system role.",
    "requirements": [
      "Pemeriksaan permission menerima tenant dan hanya lolos bila role milik tenant tersebut atau system role.",
      "Kontrak gRPC CheckPermission menerima tenant_id; academic mengirim tenant dari claim; identity menolak request tanpa tenant setelah masa transisi yang disepakati di ADR 0002.",
      "Invitation menolak role_id yang bukan milik tenant atau bukan system role dengan error validasi.",
      "Perilaku member role update yang sudah memvalidasi role tenant tetap terjaga."
    ],
    "acceptanceCriteria": [
      "Undangan dengan role_id milik tenant lain ditolak tanpa undangan dibuat",
      "Permission dengan role milik tenant lain ditolak pada jalur HTTP identity maupun gRPC",
      "Mutasi katalog academic oleh member berwenang tetap berhasil setelah academic mengirim tenant_id",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: perubahan kontrak gRPC internal lintas dua service; deploy identity yang menerima tenant_id opsional harus mendahului academic, lalu identity mewajibkannya. Perbarui ADR 0002 dan dokumentasi security. Permission client academic memakai structpb tanpa proto; jaga kompatibilitas payload.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/repository/member_repository.go",
      "kelolakelas-identity-service/internal/delivery/grpc/permission_service.go",
      "kelolakelas-identity-service/internal/usecase/invitation_usecase.go",
      "kelolakelas-academic-service/pkg/grpcclient/permission_client.go",
      "kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go"
    ],
    "edgeCases": [
      "System role (tenant_id NULL) dipakai pada tenant mana pun.",
      "Role dihapus setelah token diterbitkan.",
      "Academic versi lama memanggil identity versi baru tanpa tenant_id."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test kompatibilitas kontrak gRPC membuktikan urutan deploy identity lalu academic tidak memutus mutasi katalog"
    ],
    "outOfScope": [
      "Caching hasil permission.",
      "mTLS gRPC.",
      "Redesign RBAC."
    ]
  }
}
```

---

### [IMPROVEMENT] Terapkan permission pada operasi student dan enrollment sisi tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Pola middleware sudah ada, tetapi keputusan bergantung pada is_parent sehingga perlu varian kondisional yang tidak memutus parent.
- **Labels:** `academic`, `ai-ready`
- **Dependencies:** `academic-tenant-context-from-jwt-only`
- **draftKey:** `academic-permission-students-enrollments`

## Background / Problem

Route student (`cmd/server/main.go:118-122`) dan enrollment (`:132-136`) hanya memerlukan JWT. Permission `student:create|read|update|delete` dan `enrollment:create|read|update|delete` sudah di-seed di identity dan role Teacher tidak memilikinya, tetapi setiap member tenant dengan token dapat membaca dan memutasi student maupun enrollment tenant. Jalur parent pada route yang sama memakai ownership dan tidak memiliki role_id, sehingga pola middleware route-level yang dipakai KEL-10 tidak dapat diterapkan mentah-mentah.

## Goal

Operasi student dan enrollment yang dijalankan atas nama tenant hanya dapat dilakukan oleh role dengan permission terkait, sementara jalur parent yang berbasis ownership tetap tidak berubah.

## Requirements

- Caller non-parent memerlukan student:read untuk list/get, student:create, student:update, dan student:delete untuk mutasi student.
- Caller non-parent memerlukan enrollment:read untuk list/get enrollment dan enrollment:create untuk POST /tenants/:tenant_id/enrollments.
- Caller parent tetap memakai aturan ownership yang ada tanpa pemeriksaan permission.
- Denial menghasilkan 403 tanpa perubahan data; kegagalan identity menghasilkan 503 seperti mutasi katalog.

## Acceptance Criteria

- [ ] Member dengan role Teacher menerima 403 saat membaca atau mengubah student dan enrollment tenant
- [ ] Member Creator tetap dapat menjalankan seluruh operasi student dan enrollment tenantnya
- [ ] Parent tetap dapat mengelola student miliknya dan membuat enrollment katalog tanpa role_id
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Permission middleware yang ada bekerja per route; di sini keputusan bergantung pada claim is_parent, sehingga diperlukan varian yang hanya memeriksa permission untuk caller non-parent atau pemeriksaan di use case. Ikuti ADR 0002 dan perbarui tabel pemetaan permission di dokumentasi.

Relevant areas:

- `kelolakelas-academic-service/cmd/server/main.go`
- `kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_query_handler.go`

## Edge Cases

- Token parent yang juga memiliki membership tenant.
- Member tanpa role_id pada route tenant.
- Identity gRPC tidak tersedia saat parent mengakses route yang tidak memerlukan permission.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Permission attendance dan report.
- PATCH /enrollments/:id/schedule oleh tenant (saat ini parent-only).
- UI permission-aware di web.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-permission-students-enrollments",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Terapkan permission pada operasi student dan enrollment sisi tenant",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [
    "academic-tenant-context-from-jwt-only"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Route student (`cmd/server/main.go:118-122`) dan enrollment (`:132-136`) hanya memerlukan JWT. Permission `student:create|read|update|delete` dan `enrollment:create|read|update|delete` sudah di-seed di identity dan role Teacher tidak memilikinya, tetapi setiap member tenant dengan token dapat membaca dan memutasi student maupun enrollment tenant. Jalur parent pada route yang sama memakai ownership dan tidak memiliki role_id, sehingga pola middleware route-level yang dipakai KEL-10 tidak dapat diterapkan mentah-mentah.",
    "goal": "Operasi student dan enrollment yang dijalankan atas nama tenant hanya dapat dilakukan oleh role dengan permission terkait, sementara jalur parent yang berbasis ownership tetap tidak berubah.",
    "requirements": [
      "Caller non-parent memerlukan student:read untuk list/get, student:create, student:update, dan student:delete untuk mutasi student.",
      "Caller non-parent memerlukan enrollment:read untuk list/get enrollment dan enrollment:create untuk POST /tenants/:tenant_id/enrollments.",
      "Caller parent tetap memakai aturan ownership yang ada tanpa pemeriksaan permission.",
      "Denial menghasilkan 403 tanpa perubahan data; kegagalan identity menghasilkan 503 seperti mutasi katalog."
    ],
    "acceptanceCriteria": [
      "Member dengan role Teacher menerima 403 saat membaca atau mengubah student dan enrollment tenant",
      "Member Creator tetap dapat menjalankan seluruh operasi student dan enrollment tenantnya",
      "Parent tetap dapat mengelola student miliknya dan membuat enrollment katalog tanpa role_id",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Permission middleware yang ada bekerja per route; di sini keputusan bergantung pada claim is_parent, sehingga diperlukan varian yang hanya memeriksa permission untuk caller non-parent atau pemeriksaan di use case. Ikuti ADR 0002 dan perbarui tabel pemetaan permission di dokumentasi.",
    "relevantAreas": [
      "kelolakelas-academic-service/cmd/server/main.go",
      "kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_query_handler.go"
    ],
    "edgeCases": [
      "Token parent yang juga memiliki membership tenant.",
      "Member tanpa role_id pada route tenant.",
      "Identity gRPC tidak tersedia saat parent mengakses route yang tidak memerlukan permission."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Permission attendance dan report.",
      "PATCH /enrollments/:id/schedule oleh tenant (saat ini parent-only).",
      "UI permission-aware di web."
    ]
  }
}
```

---

### [IMPROVEMENT] Terapkan permission pada attendance dan report

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Pemetaan route ke permission yang sudah di-seed dengan pola yang ada; risiko utama regresi Teacher.
- **Labels:** `academic`, `ai-ready`
- **Dependencies:** `academic-tenant-context-from-jwt-only`
- **draftKey:** `academic-permission-attendance-reports`

## Background / Problem

Route attendance (`cmd/server/main.go:123-126`) dan report (`:127-131`) hanya memerlukan JWT. Otorisasi bergantung pada pemeriksaan ad-hoc tutor yang ditugaskan (`internal/usecase/attendance_usecase.go:54-60,85-90`, `report_usecase.go:49-55`). Permission `attendance:create|read|update` dan `report:create|read|update|delete` sudah di-seed dan dimiliki role Teacher, tetapi tidak pernah dievaluasi.

## Goal

Operasi attendance dan report hanya dapat dilakukan oleh role dengan permission terkait, dengan aturan tutor yang ditugaskan tetap menjadi lapisan kedua.

## Requirements

- Pemetaan permission per route mengikuti nama permission yang di-seed.
- Aturan tutor yang ditugaskan tetap diberlakukan setelah permission lolos.
- Denial menghasilkan 403 tanpa perubahan data.
- Perilaku akses untuk caller non-tenant yang ada saat ini tidak berubah tanpa keputusan terpisah.

## Acceptance Criteria

- [ ] Member tanpa permission attendance atau report menerima 403 pada operasi terkait
- [ ] Teacher yang ditugaskan tetap dapat mencatat attendance dan membuat report sesinya
- [ ] Tabel pemetaan permission di dokumentasi mencantumkan route attendance dan report
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan permission middleware yang ada; attendance tidak memiliki permission delete yang di-seed dan tidak ada route delete, jadi tidak perlu menambah permission baru. Perbarui ADR 0002 dan dokumentasi API academic.

Relevant areas:

- `kelolakelas-academic-service/cmd/server/main.go`
- `kelolakelas-academic-service/internal/usecase/attendance_usecase.go`
- `kelolakelas-academic-service/internal/usecase/report_usecase.go`

## Edge Cases

- Tutor dengan permission tetapi bukan tutor sesi tersebut.
- Role custom dengan report:read tanpa report:create.
- Identity tidak tersedia.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Akses parent ke attendance dan report anaknya.
- Student note.
- UI attendance dan report.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-permission-attendance-reports",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Terapkan permission pada attendance dan report",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [
    "academic-tenant-context-from-jwt-only"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Route attendance (`cmd/server/main.go:123-126`) dan report (`:127-131`) hanya memerlukan JWT. Otorisasi bergantung pada pemeriksaan ad-hoc tutor yang ditugaskan (`internal/usecase/attendance_usecase.go:54-60,85-90`, `report_usecase.go:49-55`). Permission `attendance:create|read|update` dan `report:create|read|update|delete` sudah di-seed dan dimiliki role Teacher, tetapi tidak pernah dievaluasi.",
    "goal": "Operasi attendance dan report hanya dapat dilakukan oleh role dengan permission terkait, dengan aturan tutor yang ditugaskan tetap menjadi lapisan kedua.",
    "requirements": [
      "Pemetaan permission per route mengikuti nama permission yang di-seed.",
      "Aturan tutor yang ditugaskan tetap diberlakukan setelah permission lolos.",
      "Denial menghasilkan 403 tanpa perubahan data.",
      "Perilaku akses untuk caller non-tenant yang ada saat ini tidak berubah tanpa keputusan terpisah."
    ],
    "acceptanceCriteria": [
      "Member tanpa permission attendance atau report menerima 403 pada operasi terkait",
      "Teacher yang ditugaskan tetap dapat mencatat attendance dan membuat report sesinya",
      "Tabel pemetaan permission di dokumentasi mencantumkan route attendance dan report",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan permission middleware yang ada; attendance tidak memiliki permission delete yang di-seed dan tidak ada route delete, jadi tidak perlu menambah permission baru. Perbarui ADR 0002 dan dokumentasi API academic.",
    "relevantAreas": [
      "kelolakelas-academic-service/cmd/server/main.go",
      "kelolakelas-academic-service/internal/usecase/attendance_usecase.go",
      "kelolakelas-academic-service/internal/usecase/report_usecase.go"
    ],
    "edgeCases": [
      "Tutor dengan permission tetapi bukan tutor sesi tersebut.",
      "Role custom dengan report:read tanpa report:create.",
      "Identity tidak tersedia."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Akses parent ke attendance dan report anaknya.",
      "Student note.",
      "UI attendance dan report."
    ]
  }
}
```

---

### [IMPROVEMENT] Lindungi login dari brute force dan enumerasi akun

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Isolasi tenant dan otorisasi menyeluruh
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Butuh state percobaan gagal yang tahan restart tanpa bergantung Redis opsional dan tanpa membocorkan status akun.
- **Labels:** `identity`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `identity-login-abuse-protection`

## Background / Problem

Identity tidak memiliki pelacakan percobaan gagal, lockout, atau throttling per akun (pencarian repo-wide tidak menemukan apa pun). Satu-satunya pembatas adalah rate limit gateway 5 request per menit per IP yang fail-open saat Redis bermasalah dan, dengan `SetTrustedProxies(nil)`, menggabungkan semua klien di belakang load balancer ke satu IP. `Login` mengembalikan lebih cepat untuk email yang tidak terdaftar karena bcrypt tidak dijalankan (`internal/usecase/auth_usecase.go:63-74`), sehingga keberadaan akun dapat ditebak dari waktu respons.

## Goal

Percobaan login gagal berulang pada satu akun dibatasi secara sementara dan terobservasi, dan respons login tidak membedakan akun yang ada dari yang tidak ada.

## Requirements

- Percobaan gagal dicatat per akun; setelah ambang yang dapat dikonfigurasi, login akun tersebut ditolak sementara dengan respons yang sama seperti kredensial salah.
- Login berhasil mengatur ulang hitungan; lockout kedaluwarsa otomatis.
- Jalur email tidak terdaftar dan password salah memiliki biaya komputasi dan respons yang setara.
- Login valid, klaim JWT, dan penyimpanan cache permission tidak berubah.

## Acceptance Criteria

- [ ] Setelah N kegagalan berturut-turut, login akun tersebut ditolak selama periode lockout meskipun password benar
- [ ] Setelah periode lockout berakhir atau login berhasil, akun dapat login kembali
- [ ] Respons dan waktu untuk email tidak terdaftar setara dengan password salah
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Redis bersifat opsional di identity; mekanisme pelacakan tidak boleh membuat login gagal ketika Redis tidak tersedia. Ambang dan durasi harus dapat dikonfigurasi dengan default yang aman dan didokumentasikan. Jangan mengungkap status lockout secara berbeda dari kredensial salah.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase/auth_usecase.go`
- `kelolakelas-identity-service/internal/delivery/http/handler/auth_handler.go`
- `kelolakelas-identity-service/internal/config/config.go`

## Edge Cases

- Percobaan paralel pada akun yang sama.
- Email dengan perbedaan kapitalisasi.
- Restart service di tengah periode lockout.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- CAPTCHA, MFA, dan password reset.
- Kebijakan fail-closed rate limiter gateway.
- Notifikasi email lockout.

## AI Orchestrator Contract

```json
{
  "draftKey": "identity-login-abuse-protection",
  "projectKey": "tenant-isolation-and-authorization",
  "title": "Lindungi login dari brute force dan enumerasi akun",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "identity"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Identity tidak memiliki pelacakan percobaan gagal, lockout, atau throttling per akun (pencarian repo-wide tidak menemukan apa pun). Satu-satunya pembatas adalah rate limit gateway 5 request per menit per IP yang fail-open saat Redis bermasalah dan, dengan `SetTrustedProxies(nil)`, menggabungkan semua klien di belakang load balancer ke satu IP. `Login` mengembalikan lebih cepat untuk email yang tidak terdaftar karena bcrypt tidak dijalankan (`internal/usecase/auth_usecase.go:63-74`), sehingga keberadaan akun dapat ditebak dari waktu respons.",
    "goal": "Percobaan login gagal berulang pada satu akun dibatasi secara sementara dan terobservasi, dan respons login tidak membedakan akun yang ada dari yang tidak ada.",
    "requirements": [
      "Percobaan gagal dicatat per akun; setelah ambang yang dapat dikonfigurasi, login akun tersebut ditolak sementara dengan respons yang sama seperti kredensial salah.",
      "Login berhasil mengatur ulang hitungan; lockout kedaluwarsa otomatis.",
      "Jalur email tidak terdaftar dan password salah memiliki biaya komputasi dan respons yang setara.",
      "Login valid, klaim JWT, dan penyimpanan cache permission tidak berubah."
    ],
    "acceptanceCriteria": [
      "Setelah N kegagalan berturut-turut, login akun tersebut ditolak selama periode lockout meskipun password benar",
      "Setelah periode lockout berakhir atau login berhasil, akun dapat login kembali",
      "Respons dan waktu untuk email tidak terdaftar setara dengan password salah",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Redis bersifat opsional di identity; mekanisme pelacakan tidak boleh membuat login gagal ketika Redis tidak tersedia. Ambang dan durasi harus dapat dikonfigurasi dengan default yang aman dan didokumentasikan. Jangan mengungkap status lockout secara berbeda dari kredensial salah.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase/auth_usecase.go",
      "kelolakelas-identity-service/internal/delivery/http/handler/auth_handler.go",
      "kelolakelas-identity-service/internal/config/config.go"
    ],
    "edgeCases": [
      "Percobaan paralel pada akun yang sama.",
      "Email dengan perbedaan kapitalisasi.",
      "Restart service di tengah periode lockout."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "CAPTCHA, MFA, dan password reset.",
      "Kebijakan fail-closed rate limiter gateway.",
      "Notifikasi email lockout."
    ]
  }
}
```

---

### [IMPROVEMENT] Pulihkan transaksi yang tertahan di status creating saat pembuatan invoice gagal

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Improvement`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `medium`
- **Complexity rationale:** Perubahan jalur error yang terlokalisasi, tetapi harus menjaga eksklusivitas klaim dan idempotency invoice.
- **Labels:** `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `billing-recover-stuck-invoice-claim`

## Background / Problem

`GenerateSubscriptionPayment` mengklaim transaksi ke status `creating` melalui `ClaimInvoice` (`internal/repository/transaction_repository.go:111-116`) lalu memanggil Duitku; jika `CreateInvoice` gagal, fungsi mengembalikan error tanpa memulihkan status (`internal/usecase/transaction_usecase.go:176-207`). `ClaimInvoice` hanya mencocokkan `pending` atau `failed`, sehingga setiap retry dengan idempotency key yang sama mengembalikan `invoice creation is already in progress` selamanya; parent tidak pernah mendapat checkout URL sementara enrollment pending tetap menahan kuota. Status `creating` juga tidak ada dalam whitelist filter list transaksi (`internal/delivery/http/handler/transaction_handler.go:42`).

## Goal

Kegagalan sementara provider tidak pernah meninggalkan transaksi dalam status yang tidak dapat diklaim ulang, dan retry berikutnya berhasil menghasilkan invoice.

## Requirements

- Ketika pembuatan invoice gagal, transaksi dikembalikan ke status yang dapat diklaim secara atomik dan alasan kegagalan tercatat.
- Klaim yang ditinggalkan karena proses mati dapat diklaim ulang setelah batas waktu yang ditentukan.
- Klaim tetap eksklusif: dua request paralel menghasilkan tepat satu invoice.
- Filter status list transaksi mengenali seluruh status yang benar-benar ditulis kode.

## Acceptance Criteria

- [ ] Setelah kegagalan provider yang disimulasikan, request berikutnya dengan enrollment yang sama berhasil membuat invoice
- [ ] Dua request paralel untuk enrollment yang sama menghasilkan tepat satu invoice Duitku
- [ ] Transaksi berstatus creating yang lebih tua dari batas waktu dapat diklaim ulang
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Pemulihan harus terjadi pada jalur error yang sama dan tidak boleh menimpa transaksi yang sudah memiliki checkout URL. Batas waktu klaim harus dapat dikonfigurasi. Perbarui dokumentasi flow billing.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go`

## Edge Cases

- Provider berhasil membuat invoice tetapi respons hilang; klaim berikutnya membuat invoice kedua dengan merchant order ID yang sama.
- Update status setelah kegagalan juga gagal.
- Transaksi renewal yang dibuat subscription worker.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Kedaluwarsa transaksi pending.
- Perubahan payment method atau provider.
- Notifikasi ke parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-recover-stuck-invoice-claim",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Pulihkan transaksi yang tertahan di status creating saat pembuatan invoice gagal",
  "type": "Improvement",
  "priority": "High",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`GenerateSubscriptionPayment` mengklaim transaksi ke status `creating` melalui `ClaimInvoice` (`internal/repository/transaction_repository.go:111-116`) lalu memanggil Duitku; jika `CreateInvoice` gagal, fungsi mengembalikan error tanpa memulihkan status (`internal/usecase/transaction_usecase.go:176-207`). `ClaimInvoice` hanya mencocokkan `pending` atau `failed`, sehingga setiap retry dengan idempotency key yang sama mengembalikan `invoice creation is already in progress` selamanya; parent tidak pernah mendapat checkout URL sementara enrollment pending tetap menahan kuota. Status `creating` juga tidak ada dalam whitelist filter list transaksi (`internal/delivery/http/handler/transaction_handler.go:42`).",
    "goal": "Kegagalan sementara provider tidak pernah meninggalkan transaksi dalam status yang tidak dapat diklaim ulang, dan retry berikutnya berhasil menghasilkan invoice.",
    "requirements": [
      "Ketika pembuatan invoice gagal, transaksi dikembalikan ke status yang dapat diklaim secara atomik dan alasan kegagalan tercatat.",
      "Klaim yang ditinggalkan karena proses mati dapat diklaim ulang setelah batas waktu yang ditentukan.",
      "Klaim tetap eksklusif: dua request paralel menghasilkan tepat satu invoice.",
      "Filter status list transaksi mengenali seluruh status yang benar-benar ditulis kode."
    ],
    "acceptanceCriteria": [
      "Setelah kegagalan provider yang disimulasikan, request berikutnya dengan enrollment yang sama berhasil membuat invoice",
      "Dua request paralel untuk enrollment yang sama menghasilkan tepat satu invoice Duitku",
      "Transaksi berstatus creating yang lebih tua dari batas waktu dapat diklaim ulang",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Pemulihan harus terjadi pada jalur error yang sama dan tidak boleh menimpa transaksi yang sudah memiliki checkout URL. Batas waktu klaim harus dapat dikonfigurasi. Perbarui dokumentasi flow billing.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go"
    ],
    "edgeCases": [
      "Provider berhasil membuat invoice tetapi respons hilang; klaim berikutnya membuat invoice kedua dengan merchant order ID yang sama.",
      "Update status setelah kegagalan juga gagal.",
      "Transaksi renewal yang dibuat subscription worker."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Kedaluwarsa transaksi pending.",
      "Perubahan payment method atau provider.",
      "Notifikasi ke parent."
    ]
  }
}
```

---

### [FEATURE] Kedaluwarsakan transaksi yang tidak dibayar dan tangani result code callback secara eksplisit

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Financial correctness: kedaluwarsa lokal tidak boleh menghilangkan pembayaran sah yang callback-nya terlambat; menyentuh worker dan migrasi.
- **Labels:** `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `billing-expire-unpaid-transactions`

## Background / Problem

Invoice Duitku dibuat dengan `ExpiryPeriod: 0` yang berarti 1440 menit (`pkg/duitku/client.go:61-63`), tetapi billing tidak menyimpan waktu kedaluwarsa dan tidak pernah menulis status `expired`; status itu hanya dibaca oleh subscription worker untuk renewal (`internal/usecase/subscription_worker.go:100-101`). Callback dengan result code selain `00`, `01`, `02` mengembalikan sukses tanpa perubahan atau log (`internal/usecase/transaction_usecase.go:474-486`). Akibatnya transaksi pending yang tidak dibayar hidup selamanya dan enrollment terkait menahan kuota.

## Goal

Setiap transaksi pending mencapai status final kedaluwarsa setelah invoice tidak lagi dapat dibayar, dan setiap callback yang tidak dikenali tercatat dan tidak diabaikan diam-diam.

## Requirements

- Transaksi menyimpan waktu kedaluwarsa invoice; job periodik menandai pending yang lewat waktu sebagai expired secara idempotent.
- Transaksi expired dapat dibuatkan invoice baru melalui alur idempotent yang ada ketika enrollment masih valid.
- Callback paid untuk transaksi yang sudah expired tetap diterima, ditandai paid, dan direkonsiliasi seperti biasa.
- Result code yang tidak dikenali dicatat dengan log terstruktur dan tidak mengubah status.

## Acceptance Criteria

- [ ] Transaksi pending yang melewati waktu kedaluwarsa berubah menjadi expired dan terlihat pada list/detail transaksi parent
- [ ] Callback paid setelah expired menghasilkan status paid dan rekonsiliasi aktivasi
- [ ] Callback dengan result code tidak dikenal menghasilkan log dan tidak mengubah transaksi
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: kebenaran finansial; pembayaran sah yang callback-nya terlambat tidak boleh hilang karena kedaluwarsa lokal, dan renewal subscription worker sudah memakai status expired. Keputusan apakah callback tak dikenal menjawab sukses ke provider harus didokumentasikan berdasarkan `_docs/duitku/api.md`. Perbarui dokumentasi flow callback dan billing.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/usecase/subscription_worker.go`
- `kelolakelas-billing-service/migrations`
- `kelolakelas-billing-service/internal/domain/transaction.go`

## Edge Cases

- Callback paid tiba beberapa detik setelah job menandai expired.
- Transaksi renewal dengan masa kedaluwarsa berbeda.
- Beberapa replika billing menjalankan job kedaluwarsa bersamaan.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test membuktikan callback paid setelah expired tetap menghasilkan paid dan rekonsiliasi tanpa transaksi ganda

## Out of Scope

- Pelepasan kuota di academic.
- Email pemberitahuan kedaluwarsa.
- Pembatalan oleh parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-expire-unpaid-transactions",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Kedaluwarsakan transaksi yang tidak dibayar dan tangani result code callback secara eksplisit",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Invoice Duitku dibuat dengan `ExpiryPeriod: 0` yang berarti 1440 menit (`pkg/duitku/client.go:61-63`), tetapi billing tidak menyimpan waktu kedaluwarsa dan tidak pernah menulis status `expired`; status itu hanya dibaca oleh subscription worker untuk renewal (`internal/usecase/subscription_worker.go:100-101`). Callback dengan result code selain `00`, `01`, `02` mengembalikan sukses tanpa perubahan atau log (`internal/usecase/transaction_usecase.go:474-486`). Akibatnya transaksi pending yang tidak dibayar hidup selamanya dan enrollment terkait menahan kuota.",
    "goal": "Setiap transaksi pending mencapai status final kedaluwarsa setelah invoice tidak lagi dapat dibayar, dan setiap callback yang tidak dikenali tercatat dan tidak diabaikan diam-diam.",
    "requirements": [
      "Transaksi menyimpan waktu kedaluwarsa invoice; job periodik menandai pending yang lewat waktu sebagai expired secara idempotent.",
      "Transaksi expired dapat dibuatkan invoice baru melalui alur idempotent yang ada ketika enrollment masih valid.",
      "Callback paid untuk transaksi yang sudah expired tetap diterima, ditandai paid, dan direkonsiliasi seperti biasa.",
      "Result code yang tidak dikenali dicatat dengan log terstruktur dan tidak mengubah status."
    ],
    "acceptanceCriteria": [
      "Transaksi pending yang melewati waktu kedaluwarsa berubah menjadi expired dan terlihat pada list/detail transaksi parent",
      "Callback paid setelah expired menghasilkan status paid dan rekonsiliasi aktivasi",
      "Callback dengan result code tidak dikenal menghasilkan log dan tidak mengubah transaksi",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: kebenaran finansial; pembayaran sah yang callback-nya terlambat tidak boleh hilang karena kedaluwarsa lokal, dan renewal subscription worker sudah memakai status expired. Keputusan apakah callback tak dikenal menjawab sukses ke provider harus didokumentasikan berdasarkan `_docs/duitku/api.md`. Perbarui dokumentasi flow callback dan billing.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/usecase/subscription_worker.go",
      "kelolakelas-billing-service/migrations",
      "kelolakelas-billing-service/internal/domain/transaction.go"
    ],
    "edgeCases": [
      "Callback paid tiba beberapa detik setelah job menandai expired.",
      "Transaksi renewal dengan masa kedaluwarsa berbeda.",
      "Beberapa replika billing menjalankan job kedaluwarsa bersamaan."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test membuktikan callback paid setelah expired tetap menghasilkan paid dan rekonsiliasi tanpa transaksi ganda"
    ],
    "outOfScope": [
      "Pelepasan kuota di academic.",
      "Email pemberitahuan kedaluwarsa.",
      "Pembatalan oleh parent."
    ]
  }
}
```

---

### [FEATURE] Lepaskan kuota enrollment ketika pembayaran gagal atau kedaluwarsa

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `high`
- **Complexity rationale:** Transisi status durable lintas dua database dengan retry dan edge case bayar-setelah-lepas; memperluas ADR 0001.
- **Labels:** `academic`, `billing`, `ai-ready`
- **Dependencies:** `billing-expire-unpaid-transactions`
- **draftKey:** `academic-release-seat-on-payment-failure`

## Background / Problem

Enrollment `pending` dihitung terhadap kapasitas jadwal (`internal/repository/enrollment_repository.go:54`, `catalog_repository.go:73`) tanpa batas waktu. Status `dropped` dan `completed` didefinisikan (`internal/domain/enrollment.go:27`) tetapi tidak ada kode yang menulisnya. Billing hanya memiliki jalur aktivasi (`pkg/academic/client.go:39-52`) dan tidak memberi tahu academic ketika transaksi gagal atau kedaluwarsa, sehingga kursi tetap terkunci untuk pembeli lain.

## Goal

Kuota jadwal selalu mencerminkan enrollment yang aktif atau masih dapat dibayar; enrollment yang pembayarannya gagal atau kedaluwarsa dilepaskan secara durable dan idempotent.

## Requirements

- Academic menyediakan endpoint internal untuk mentransisikan enrollment pending menjadi dropped secara idempotent.
- Billing memberi tahu academic saat transaksi menjadi failed atau expired melalui mekanisme durable dengan retry, mengikuti pola ADR 0001.
- Kapasitas yang dilepaskan langsung terlihat pada public catalog dan pemeriksaan kapasitas enrollment.
- Callback paid untuk enrollment yang sudah dropped menghasilkan kegagalan aktivasi yang terobservasi, bukan aktivasi diam-diam.

## Acceptance Criteria

- [ ] Setelah transaksi expired atau failed, enrollment terkait menjadi dropped dan kursinya tersedia kembali di katalog
- [ ] Retry pemberitahuan tidak menghasilkan transisi ganda atau error
- [ ] Aktivasi enrollment yang sudah dropped menghasilkan 409 dan tercatat pada rekonsiliasi
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: konsistensi kuota dan finansial lintas dua database; pembayaran yang tiba setelah pelepasan kursi memerlukan tindak lanjut operator dan harus terlihat. Reuse `payment_reconciliations` dengan jenis pekerjaan tambahan atau tabel setara; keputusan dicatat sebagai pembaruan ADR 0001. Enrollment dropped tidak boleh memblokir enrollment baru untuk student dan kelas yang sama (indeks unik parsial hanya mencakup pending/active).

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go`
- `kelolakelas-billing-service/internal/usecase/reconciliation_worker.go`
- `kelolakelas-billing-service/pkg/academic/client.go`

## Edge Cases

- Parent membuat invoice baru untuk enrollment yang sama tepat sebelum pelepasan.
- Academic tidak tersedia lebih lama dari batas retry.
- Transaksi failed lalu paid pada callback berikutnya.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Test membuktikan kursi yang dilepaskan dapat dipakai enrollment baru dan callback paid setelah dropped tercatat sebagai kegagalan yang terlihat

## Out of Scope

- Refund otomatis.
- Pembatalan oleh parent.
- Notifikasi email.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-release-seat-on-payment-failure",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Lepaskan kuota enrollment ketika pembayaran gagal atau kedaluwarsa",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [
    "billing-expire-unpaid-transactions"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Enrollment `pending` dihitung terhadap kapasitas jadwal (`internal/repository/enrollment_repository.go:54`, `catalog_repository.go:73`) tanpa batas waktu. Status `dropped` dan `completed` didefinisikan (`internal/domain/enrollment.go:27`) tetapi tidak ada kode yang menulisnya. Billing hanya memiliki jalur aktivasi (`pkg/academic/client.go:39-52`) dan tidak memberi tahu academic ketika transaksi gagal atau kedaluwarsa, sehingga kursi tetap terkunci untuk pembeli lain.",
    "goal": "Kuota jadwal selalu mencerminkan enrollment yang aktif atau masih dapat dibayar; enrollment yang pembayarannya gagal atau kedaluwarsa dilepaskan secara durable dan idempotent.",
    "requirements": [
      "Academic menyediakan endpoint internal untuk mentransisikan enrollment pending menjadi dropped secara idempotent.",
      "Billing memberi tahu academic saat transaksi menjadi failed atau expired melalui mekanisme durable dengan retry, mengikuti pola ADR 0001.",
      "Kapasitas yang dilepaskan langsung terlihat pada public catalog dan pemeriksaan kapasitas enrollment.",
      "Callback paid untuk enrollment yang sudah dropped menghasilkan kegagalan aktivasi yang terobservasi, bukan aktivasi diam-diam."
    ],
    "acceptanceCriteria": [
      "Setelah transaksi expired atau failed, enrollment terkait menjadi dropped dan kursinya tersedia kembali di katalog",
      "Retry pemberitahuan tidak menghasilkan transisi ganda atau error",
      "Aktivasi enrollment yang sudah dropped menghasilkan 409 dan tercatat pada rekonsiliasi",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: konsistensi kuota dan finansial lintas dua database; pembayaran yang tiba setelah pelepasan kursi memerlukan tindak lanjut operator dan harus terlihat. Reuse `payment_reconciliations` dengan jenis pekerjaan tambahan atau tabel setara; keputusan dicatat sebagai pembaruan ADR 0001. Enrollment dropped tidak boleh memblokir enrollment baru untuk student dan kelas yang sama (indeks unik parsial hanya mencakup pending/active).",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go",
      "kelolakelas-billing-service/internal/usecase/reconciliation_worker.go",
      "kelolakelas-billing-service/pkg/academic/client.go"
    ],
    "edgeCases": [
      "Parent membuat invoice baru untuk enrollment yang sama tepat sebelum pelepasan.",
      "Academic tidak tersedia lebih lama dari batas retry.",
      "Transaksi failed lalu paid pada callback berikutnya."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Test membuktikan kursi yang dilepaskan dapat dipakai enrollment baru dan callback paid setelah dropped tercatat sebagai kegagalan yang terlihat"
    ],
    "outOfScope": [
      "Refund otomatis.",
      "Pembatalan oleh parent.",
      "Notifikasi email."
    ]
  }
}
```

---

### [FEATURE] Sediakan pembatalan enrollment pending oleh parent

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Feature`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Tiga repository dengan urutan penulisan yang harus aman terhadap retry, mengikuti mekanisme pelepasan kursi yang sudah ada.
- **Labels:** `academic`, `billing`, `api-gateway`, `ai-ready`
- **Dependencies:** `academic-release-seat-on-payment-failure`
- **draftKey:** `cancel-pending-enrollment-backend`

## Background / Problem

Tidak ada jalur pembatalan enrollment di academic maupun billing; `enrollmentRepo.Delete` tidak dipakai handler mana pun dan status `cancelled` hanya ada di whitelist filter billing tanpa pernah ditulis. Parent yang berubah pikiran sebelum membayar tetap menahan kursi sampai invoice kedaluwarsa.

## Goal

Parent dapat membatalkan enrollment miliknya yang masih pending sehingga kursi dilepaskan dan transaksi terkait ditandai dibatalkan.

## Requirements

- Endpoint academic parent-scoped membatalkan enrollment pending milik parent menjadi dropped; enrollment aktif atau milik parent lain ditolak.
- Billing menandai transaksi pending terkait sebagai cancelled melalui jalur internal yang idempotent.
- Gateway mendaftarkan route baru pada grup protected dengan test routing.
- Callback paid setelah pembatalan diperlakukan seperti pada pelepasan kursi: tercatat dan terlihat, tidak mengaktifkan enrollment.

## Acceptance Criteria

- [ ] Parent dapat membatalkan enrollment pending miliknya dan kursinya kembali tersedia
- [ ] Enrollment aktif, milik parent lain, atau sudah dropped menghasilkan 409 atau 404 sesuai kasus
- [ ] Transaksi terkait berstatus cancelled pada list transaksi parent
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Tidak ditemukan bukti API Duitku untuk membatalkan invoice di `_docs/duitku`; invoice tetap dapat dibayar di sisi provider sampai kedaluwarsa, sehingga edge case bayar-setelah-batal wajib dicatat. Urutan penulisan academic lalu billing harus didefinisikan agar retry aman.

Relevant areas:

- `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Pembatalan bersamaan dengan callback paid.
- Enrollment pending tanpa transaksi karena invoice gagal dibuat.
- Parent membatalkan lalu mendaftar ulang kelas dan jadwal yang sama.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Pembatalan enrollment aktif dan refund.
- UI web pembatalan.
- Pembatalan invoice di sisi provider.

## AI Orchestrator Contract

```json
{
  "draftKey": "cancel-pending-enrollment-backend",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Sediakan pembatalan enrollment pending oleh parent",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "academic",
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "billing",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "academic-release-seat-on-payment-failure"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada jalur pembatalan enrollment di academic maupun billing; `enrollmentRepo.Delete` tidak dipakai handler mana pun dan status `cancelled` hanya ada di whitelist filter billing tanpa pernah ditulis. Parent yang berubah pikiran sebelum membayar tetap menahan kursi sampai invoice kedaluwarsa.",
    "goal": "Parent dapat membatalkan enrollment miliknya yang masih pending sehingga kursi dilepaskan dan transaksi terkait ditandai dibatalkan.",
    "requirements": [
      "Endpoint academic parent-scoped membatalkan enrollment pending milik parent menjadi dropped; enrollment aktif atau milik parent lain ditolak.",
      "Billing menandai transaksi pending terkait sebagai cancelled melalui jalur internal yang idempotent.",
      "Gateway mendaftarkan route baru pada grup protected dengan test routing.",
      "Callback paid setelah pembatalan diperlakukan seperti pada pelepasan kursi: tercatat dan terlihat, tidak mengaktifkan enrollment."
    ],
    "acceptanceCriteria": [
      "Parent dapat membatalkan enrollment pending miliknya dan kursinya kembali tersedia",
      "Enrollment aktif, milik parent lain, atau sudah dropped menghasilkan 409 atau 404 sesuai kasus",
      "Transaksi terkait berstatus cancelled pada list transaksi parent",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Tidak ditemukan bukti API Duitku untuk membatalkan invoice di `_docs/duitku`; invoice tetap dapat dibayar di sisi provider sampai kedaluwarsa, sehingga edge case bayar-setelah-batal wajib dicatat. Urutan penulisan academic lalu billing harus didefinisikan agar retry aman.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Pembatalan bersamaan dengan callback paid.",
      "Enrollment pending tanpa transaksi karena invoice gagal dibuat.",
      "Parent membatalkan lalu mendaftar ulang kelas dan jadwal yang sama."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Pembatalan enrollment aktif dan refund.",
      "UI web pembatalan.",
      "Pembatalan invoice di sisi provider."
    ]
  }
}
```

---

### [FEATURE] Kirim email konfirmasi pembayaran berhasil dan gagal kepada parent

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Feature`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Perlu penanda idempotent baru pada transaksi dan pengiriman pasca-commit yang tidak boleh memengaruhi callback.
- **Labels:** `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `billing-payment-outcome-emails`

## Background / Problem

Billing hanya mengirim dua email dari subscription worker: tautan pembayaran dan pengingat (`internal/usecase/subscription_worker.go:238,254`). Tidak ada email saat pembayaran berhasil atau gagal, sehingga parent hanya tahu hasilnya dengan membuka halaman status. Klien Resend memakai `http.Client{}` tanpa timeout (`pkg/email/resend.go:97,109-119`). Alamat email berasal dari `sender_email` request internal yang tidak divalidasi dan disimpan pada subscription sebagai `billing_email` nullable.

## Goal

Parent menerima tepat satu email untuk setiap pembayaran yang berhasil dan setiap pembayaran yang gagal, tanpa memengaruhi keberhasilan pemrosesan callback.

## Requirements

- Setelah callback paid di-commit, kirim email tanda terima berisi kelas, nominal, dan ID transaksi; setelah failed, kirim pemberitahuan dengan cara melanjutkan pembayaran.
- Pengiriman idempotent terhadap replay callback dan retry worker.
- Kegagalan pengiriman dicatat dan tidak menggagalkan callback; email dilewati bila alamat tidak tersedia.
- Klien Resend memiliki timeout; email yang ada tetap terkirim seperti sekarang.

## Acceptance Criteria

- [ ] Callback paid menghasilkan satu email tanda terima meskipun callback diulang
- [ ] Callback failed menghasilkan satu email pemberitahuan
- [ ] Kegagalan Resend tidak mengubah status transaksi atau respons callback
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Alamat email harus berasal dari data yang sudah disimpan billing; jangan memanggil identity. Penanda pengiriman perlu disimpan pada transaksi agar idempotent. Template mengikuti gaya HTML Bahasa Indonesia yang ada dengan escaping. Perbarui dokumentasi flow callback.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/pkg/email/resend.go`
- `kelolakelas-billing-service/migrations`

## Edge Cases

- billing_email kosong pada subscription lama.
- Resend timeout setelah email sebenarnya terkirim.
- Transaksi sandbox.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Email kedaluwarsa dan pembatalan.
- Notifikasi ke tenant.
- Template i18n atau SMS.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-payment-outcome-emails",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Kirim email konfirmasi pembayaran berhasil dan gagal kepada parent",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Billing hanya mengirim dua email dari subscription worker: tautan pembayaran dan pengingat (`internal/usecase/subscription_worker.go:238,254`). Tidak ada email saat pembayaran berhasil atau gagal, sehingga parent hanya tahu hasilnya dengan membuka halaman status. Klien Resend memakai `http.Client{}` tanpa timeout (`pkg/email/resend.go:97,109-119`). Alamat email berasal dari `sender_email` request internal yang tidak divalidasi dan disimpan pada subscription sebagai `billing_email` nullable.",
    "goal": "Parent menerima tepat satu email untuk setiap pembayaran yang berhasil dan setiap pembayaran yang gagal, tanpa memengaruhi keberhasilan pemrosesan callback.",
    "requirements": [
      "Setelah callback paid di-commit, kirim email tanda terima berisi kelas, nominal, dan ID transaksi; setelah failed, kirim pemberitahuan dengan cara melanjutkan pembayaran.",
      "Pengiriman idempotent terhadap replay callback dan retry worker.",
      "Kegagalan pengiriman dicatat dan tidak menggagalkan callback; email dilewati bila alamat tidak tersedia.",
      "Klien Resend memiliki timeout; email yang ada tetap terkirim seperti sekarang."
    ],
    "acceptanceCriteria": [
      "Callback paid menghasilkan satu email tanda terima meskipun callback diulang",
      "Callback failed menghasilkan satu email pemberitahuan",
      "Kegagalan Resend tidak mengubah status transaksi atau respons callback",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Alamat email harus berasal dari data yang sudah disimpan billing; jangan memanggil identity. Penanda pengiriman perlu disimpan pada transaksi agar idempotent. Template mengikuti gaya HTML Bahasa Indonesia yang ada dengan escaping. Perbarui dokumentasi flow callback.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/pkg/email/resend.go",
      "kelolakelas-billing-service/migrations"
    ],
    "edgeCases": [
      "billing_email kosong pada subscription lama.",
      "Resend timeout setelah email sebenarnya terkirim.",
      "Transaksi sandbox."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Email kedaluwarsa dan pembatalan.",
      "Notifikasi ke tenant.",
      "Template i18n atau SMS."
    ]
  }
}
```

---

### [IMPROVEMENT] Jadikan rekonsiliasi terminal_failed dapat ditemukan dan diulang

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Siklus hidup enrollment dan pembayaran yang lengkap
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `medium`
- **Complexity rationale:** Endpoint internal dan logging pada worker yang sudah memiliki lease; risiko utama interaksi re-queue dengan lease aktif.
- **Labels:** `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `billing-reconciliation-observability-and-retry`

## Background / Problem

Setelah `PAYMENT_RECONCILIATION_MAX_ATTEMPTS` tercapai, baris menjadi `terminal_failed` dan tidak ada kode yang membacanya kembali; `RunOnce` menelan seluruh error repository (`internal/usecase/reconciliation_worker.go:56-70`) dan tidak ada satu pun log di handler, use case, atau worker billing. Satu-satunya jalur pemulihan adalah replay callback dari provider, dan satu-satunya visibilitas adalah field rekonsiliasi pada respons transaksi parent.

## Goal

Operator dapat melihat rekonsiliasi yang gagal permanen dan mengulanginya tanpa bergantung pada provider, dan setiap transisi rekonsiliasi terekam di log.

## Requirements

- Setiap transisi rekonsiliasi dan error worker menghasilkan log terstruktur dengan ID transaksi dan enrollment, tanpa kredensial.
- Endpoint internal berkredensial mengembalikan daftar rekonsiliasi per status.
- Endpoint internal berkredensial mengantrekan ulang baris terminal_failed secara idempotent.
- Respons transaksi parent dan perilaku worker yang ada tetap sama.

## Acceptance Criteria

- [ ] Baris terminal_failed dapat dilihat melalui endpoint internal dan diulang sampai aktif
- [ ] Mengulang baris yang sudah aktif tidak mengubah apa pun
- [ ] Log mencatat setiap transisi pending, processing, active, dan terminal_failed
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan middleware kredensial internal yang ada; tidak ada persona platform admin sehingga endpoint ini bukan untuk browser. Redaksi error tetap seperti sekarang. Perbarui dokumentasi operasi dan ADR 0001.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/reconciliation_worker.go`
- `kelolakelas-billing-service/internal/repository/payment_reconciliation_repository.go`
- `kelolakelas-billing-service/cmd/server/main.go`

## Edge Cases

- Re-queue saat worker sedang memegang lease baris tersebut.
- Enrollment sudah dihapus di academic.
- Kredensial internal salah.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- UI admin.
- Alerting.
- Rekonsiliasi renewal.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-reconciliation-observability-and-retry",
  "projectKey": "enrollment-payment-lifecycle",
  "title": "Jadikan rekonsiliasi terminal_failed dapat ditemukan dan diulang",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Setelah `PAYMENT_RECONCILIATION_MAX_ATTEMPTS` tercapai, baris menjadi `terminal_failed` dan tidak ada kode yang membacanya kembali; `RunOnce` menelan seluruh error repository (`internal/usecase/reconciliation_worker.go:56-70`) dan tidak ada satu pun log di handler, use case, atau worker billing. Satu-satunya jalur pemulihan adalah replay callback dari provider, dan satu-satunya visibilitas adalah field rekonsiliasi pada respons transaksi parent.",
    "goal": "Operator dapat melihat rekonsiliasi yang gagal permanen dan mengulanginya tanpa bergantung pada provider, dan setiap transisi rekonsiliasi terekam di log.",
    "requirements": [
      "Setiap transisi rekonsiliasi dan error worker menghasilkan log terstruktur dengan ID transaksi dan enrollment, tanpa kredensial.",
      "Endpoint internal berkredensial mengembalikan daftar rekonsiliasi per status.",
      "Endpoint internal berkredensial mengantrekan ulang baris terminal_failed secara idempotent.",
      "Respons transaksi parent dan perilaku worker yang ada tetap sama."
    ],
    "acceptanceCriteria": [
      "Baris terminal_failed dapat dilihat melalui endpoint internal dan diulang sampai aktif",
      "Mengulang baris yang sudah aktif tidak mengubah apa pun",
      "Log mencatat setiap transisi pending, processing, active, dan terminal_failed",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan middleware kredensial internal yang ada; tidak ada persona platform admin sehingga endpoint ini bukan untuk browser. Redaksi error tetap seperti sekarang. Perbarui dokumentasi operasi dan ADR 0001.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/reconciliation_worker.go",
      "kelolakelas-billing-service/internal/repository/payment_reconciliation_repository.go",
      "kelolakelas-billing-service/cmd/server/main.go"
    ],
    "edgeCases": [
      "Re-queue saat worker sedang memegang lease baris tersebut.",
      "Enrollment sudah dihapus di academic.",
      "Kredensial internal salah."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "UI admin.",
      "Alerting.",
      "Rekonsiliasi renewal."
    ]
  }
}
```

---

### [FEATURE] Sediakan endpoint pembaruan kelas untuk tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `medium`
- **Complexity rationale:** Endpoint CRUD standar dengan permission yang ada; keputusan tentang perubahan tipe dan harga terhadap enrollment perlu didokumentasikan.
- **Labels:** `academic`, `api-gateway`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `academic-class-update-endpoint`

## Background / Problem

Route kelas hanya mencakup list, create, create-with-category, delete, dan toggle publikasi (`kelolakelas-academic-service/cmd/server/main.go:112-116`; gateway `router.go:87-91`). Tidak ada cara memperbarui nama, deskripsi, harga, tipe, atau kategori; tenant harus menghapus dan membuat ulang kelas, yang memutus enrollment dan jadwal yang sudah ada. Permission `class:update` sudah di-seed dan dipakai untuk publikasi.

## Goal

Tenant dapat memperbaiki informasi jual kelas yang sudah ada tanpa memengaruhi enrollment dan jadwal yang berjalan.

## Requirements

- Endpoint update kelas tenant-scoped dengan permission class:update untuk nama, deskripsi, harga, dan kategori milik tenant yang sama.
- Enrollment yang sudah ada mempertahankan gross_amount yang tersimpan; harga baru hanya berlaku untuk enrollment berikutnya.
- Gateway mendaftarkan route pada grup protected dengan test routing; Swagger dan dokumentasi API diperbarui.
- Perilaku create, delete, publikasi, dan public catalog tetap sama.

## Acceptance Criteria

- [ ] Member berwenang dapat mengubah nama, deskripsi, harga, dan kategori kelas dan perubahannya terlihat di catalog publik
- [ ] Kelas atau kategori milik tenant lain menghasilkan 404 atau 422 tanpa perubahan
- [ ] Enrollment yang ada tidak berubah nominalnya setelah harga diperbarui
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Perubahan tipe kelas (group/private) memengaruhi kewajiban jadwal dan kapasitas; putuskan apakah tipe dapat diubah ketika jadwal atau enrollment sudah ada dan dokumentasikan. Validasi mengikuti DTO create yang ada.

Relevant areas:

- `kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go`
- `kelolakelas-academic-service/internal/usecase`
- `kelolakelas-academic-service/internal/repository/class_repository.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Harga diubah menjadi 0 atau negatif.
- Kategori dihapus (soft delete) saat dipilih.
- Kelas sedang dipublikasikan dan memiliki enrollment pending.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- UI web edit kelas.
- Riwayat harga dan diskon.
- Pembaruan jadwal (sudah ada endpoint terpisah).

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-class-update-endpoint",
  "projectKey": "tenant-selling-operations",
  "title": "Sediakan endpoint pembaruan kelas untuk tenant",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Route kelas hanya mencakup list, create, create-with-category, delete, dan toggle publikasi (`kelolakelas-academic-service/cmd/server/main.go:112-116`; gateway `router.go:87-91`). Tidak ada cara memperbarui nama, deskripsi, harga, tipe, atau kategori; tenant harus menghapus dan membuat ulang kelas, yang memutus enrollment dan jadwal yang sudah ada. Permission `class:update` sudah di-seed dan dipakai untuk publikasi.",
    "goal": "Tenant dapat memperbaiki informasi jual kelas yang sudah ada tanpa memengaruhi enrollment dan jadwal yang berjalan.",
    "requirements": [
      "Endpoint update kelas tenant-scoped dengan permission class:update untuk nama, deskripsi, harga, dan kategori milik tenant yang sama.",
      "Enrollment yang sudah ada mempertahankan gross_amount yang tersimpan; harga baru hanya berlaku untuk enrollment berikutnya.",
      "Gateway mendaftarkan route pada grup protected dengan test routing; Swagger dan dokumentasi API diperbarui.",
      "Perilaku create, delete, publikasi, dan public catalog tetap sama."
    ],
    "acceptanceCriteria": [
      "Member berwenang dapat mengubah nama, deskripsi, harga, dan kategori kelas dan perubahannya terlihat di catalog publik",
      "Kelas atau kategori milik tenant lain menghasilkan 404 atau 422 tanpa perubahan",
      "Enrollment yang ada tidak berubah nominalnya setelah harga diperbarui",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Perubahan tipe kelas (group/private) memengaruhi kewajiban jadwal dan kapasitas; putuskan apakah tipe dapat diubah ketika jadwal atau enrollment sudah ada dan dokumentasikan. Validasi mengikuti DTO create yang ada.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go",
      "kelolakelas-academic-service/internal/usecase",
      "kelolakelas-academic-service/internal/repository/class_repository.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Harga diubah menjadi 0 atau negatif.",
      "Kategori dihapus (soft delete) saat dipilih.",
      "Kelas sedang dipublikasikan dan memiliki enrollment pending."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "UI web edit kelas.",
      "Riwayat harga dan diskon.",
      "Pembaruan jadwal (sudah ada endpoint terpisah)."
    ]
  }
}
```

---

### [FEATURE] Sediakan kontrol publikasi kelas di dashboard tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `Urgent`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Backend sudah lengkap; pekerjaan UI mengikuti pola Server Action yang ada.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-tenant-class-publication`

## Background / Problem

Halaman `app/(dashboard)/dashboard/tenant/classes` hanya menampilkan daftar kelas dan wizard pembuatan; pencarian kata `published` di direktori tersebut tidak menemukan kontrol apa pun. Endpoint `PATCH /api/v1/classes/:id/published` sudah tersedia di academic dan gateway dengan permission `class:update`. Tanpa kontrol ini tenant tidak dapat membuat kelasnya muncul di katalog publik dari web.

## Goal

Tenant dapat memublikasikan dan menarik publikasi kelas dari dashboard dan langsung melihat statusnya.

## Requirements

- Daftar kelas menampilkan status publikasi dan enrollment_status setiap kelas.
- Aksi publish/unpublish memanggil endpoint publikasi melalui Server Action dengan session cookie dan me-revalidate daftar.
- State loading, sukses, 403 tanpa permission, dan error API ditampilkan dengan jelas.
- Wizard pembuatan kelas dan daftar yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Tenant dapat memublikasikan kelas dan kelas tersebut muncul di /kelas
- [ ] Tenant dapat menarik publikasi dan kelas hilang dari /kelas
- [ ] Member tanpa class:update melihat pesan forbidden tanpa perubahan
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola Server Action dan query tenant yang ada; baca panduan Next.js 16 di node_modules sebelum coding sesuai AGENTS.md web. Jangan mengirim tenant ID dari browser sebagai sumber otorisasi.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`

## Edge Cases

- Kelas tanpa jadwal dipublikasikan (backend mungkin menolak; tampilkan pesan backend).
- Double click pada tombol publikasi.
- Sesi kedaluwarsa saat aksi dijalankan.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Edit kelas.
- Pengaturan enrollment_status manual.
- Preview kelas.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-class-publication",
  "projectKey": "tenant-selling-operations",
  "title": "Sediakan kontrol publikasi kelas di dashboard tenant",
  "type": "Feature",
  "priority": "Urgent",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Halaman `app/(dashboard)/dashboard/tenant/classes` hanya menampilkan daftar kelas dan wizard pembuatan; pencarian kata `published` di direktori tersebut tidak menemukan kontrol apa pun. Endpoint `PATCH /api/v1/classes/:id/published` sudah tersedia di academic dan gateway dengan permission `class:update`. Tanpa kontrol ini tenant tidak dapat membuat kelasnya muncul di katalog publik dari web.",
    "goal": "Tenant dapat memublikasikan dan menarik publikasi kelas dari dashboard dan langsung melihat statusnya.",
    "requirements": [
      "Daftar kelas menampilkan status publikasi dan enrollment_status setiap kelas.",
      "Aksi publish/unpublish memanggil endpoint publikasi melalui Server Action dengan session cookie dan me-revalidate daftar.",
      "State loading, sukses, 403 tanpa permission, dan error API ditampilkan dengan jelas.",
      "Wizard pembuatan kelas dan daftar yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Tenant dapat memublikasikan kelas dan kelas tersebut muncul di /kelas",
      "Tenant dapat menarik publikasi dan kelas hilang dari /kelas",
      "Member tanpa class:update melihat pesan forbidden tanpa perubahan",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola Server Action dan query tenant yang ada; baca panduan Next.js 16 di node_modules sebelum coding sesuai AGENTS.md web. Jangan mengirim tenant ID dari browser sebagai sumber otorisasi.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts"
    ],
    "edgeCases": [
      "Kelas tanpa jadwal dipublikasikan (backend mungkin menolak; tampilkan pesan backend).",
      "Double click pada tombol publikasi.",
      "Sesi kedaluwarsa saat aksi dijalankan."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Edit kelas.",
      "Pengaturan enrollment_status manual.",
      "Preview kelas."
    ]
  }
}
```

---

### [FEATURE] Sediakan edit kelas di dashboard tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Form UI dengan validasi yang sudah ada untuk endpoint baru.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** `academic-class-update-endpoint`
- **draftKey:** `web-tenant-class-edit`

## Background / Problem

Daftar kelas tenant bersifat read-only selain pembuatan; tidak ada form edit karena endpoint update belum ada. Setelah endpoint update tersedia, tenant memerlukan UI untuk memperbaiki nama, deskripsi, harga, dan kategori.

## Goal

Tenant dapat memperbarui informasi jual kelas dari dashboard dengan validasi yang sama seperti pembuatan.

## Requirements

- Form edit memakai field dan validasi yang sama dengan wizard pembuatan untuk field yang dapat diubah.
- Aksi memanggil endpoint update melalui Server Action dan me-revalidate daftar.
- State loading, validasi, forbidden, not-found, dan error API ditampilkan.
- Pembuatan dan publikasi kelas yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Tenant dapat mengubah nama, deskripsi, harga, dan kategori kelas dan melihat hasilnya di daftar
- [ ] Input tidak valid ditolak dengan pesan per field
- [ ] Member tanpa permission melihat pesan forbidden
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola Server Action tenant yang ada. Kontrak field mengikuti endpoint update yang dibuat pada issue backend.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts`

## Edge Cases

- Kelas dihapus oleh member lain saat form terbuka.
- Kategori baru dibuat saat form terbuka.
- Harga dengan pemisah ribuan.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Edit jadwal.
- Hapus kelas dari UI.
- Upload gambar kelas.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-class-edit",
  "projectKey": "tenant-selling-operations",
  "title": "Sediakan edit kelas di dashboard tenant",
  "type": "Feature",
  "priority": "High",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "academic-class-update-endpoint"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Daftar kelas tenant bersifat read-only selain pembuatan; tidak ada form edit karena endpoint update belum ada. Setelah endpoint update tersedia, tenant memerlukan UI untuk memperbaiki nama, deskripsi, harga, dan kategori.",
    "goal": "Tenant dapat memperbarui informasi jual kelas dari dashboard dengan validasi yang sama seperti pembuatan.",
    "requirements": [
      "Form edit memakai field dan validasi yang sama dengan wizard pembuatan untuk field yang dapat diubah.",
      "Aksi memanggil endpoint update melalui Server Action dan me-revalidate daftar.",
      "State loading, validasi, forbidden, not-found, dan error API ditampilkan.",
      "Pembuatan dan publikasi kelas yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Tenant dapat mengubah nama, deskripsi, harga, dan kategori kelas dan melihat hasilnya di daftar",
      "Input tidak valid ditolak dengan pesan per field",
      "Member tanpa permission melihat pesan forbidden",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola Server Action tenant yang ada. Kontrak field mengikuti endpoint update yang dibuat pada issue backend.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts"
    ],
    "edgeCases": [
      "Kelas dihapus oleh member lain saat form terbuka.",
      "Kategori baru dibuat saat form terbuka.",
      "Harga dengan pemisah ribuan."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Edit jadwal.",
      "Hapus kelas dari UI.",
      "Upload gambar kelas."
    ]
  }
}
```

---

### [FEATURE] Tampilkan enrollment dan status pembayaran kepada tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `M`
- **Complexity:** `low`
- **Complexity rationale:** Menggabungkan dua endpoint yang sudah ada dengan pola halaman parent enrollments.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-tenant-enrollment-and-payment-overview`

## Background / Problem

Dashboard tenant tidak memiliki tampilan enrollment, pendaftar, atau pembayaran. Backend sudah menyediakan `GET /api/v1/enrollments` dan `GET /api/v1/enrollments/:id` tenant-scoped dengan filter status, serta `GET /api/v1/billing/transactions` tenant-scoped dengan filter status, student, enrollment, dan tanggal. Halaman parent `/dashboard/parent/enrollments` sudah menggabungkan kedua sumber dan dapat menjadi pola.

## Goal

Tenant dapat melihat siapa yang mendaftar ke kelasnya, jadwal yang dipilih, dan status pembayaran terkini tanpa akses API langsung.

## Requirements

- Halaman enrollment tenant menampilkan student, kelas, jadwal, status enrollment, dan status pembayaran termasuk state rekonsiliasi.
- Filter status dan pagination mengikuti query backend yang ada.
- State loading, empty, forbidden, dan error API ditampilkan.
- Data tenant lain tidak pernah ditampilkan; otorisasi tetap di backend.

## Acceptance Criteria

- [ ] Tenant melihat daftar enrollment kelasnya beserta status pembayaran yang sesuai dengan backend
- [ ] Filter status mengubah hasil sesuai backend
- [ ] Member tanpa akses melihat state forbidden tanpa error teknis
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Reuse presentasi status dari `lib/payment-status.ts`. Setelah permission enrollment:read diberlakukan di academic, halaman ini harus menampilkan state forbidden dengan benar. Tambahkan item navigasi pada sidebar dan mobile nav tenant.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_queries/queries.ts`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Enrollment tanpa transaksi karena invoice gagal dibuat.
- Transaksi paid dengan rekonsiliasi terminal_failed.
- Jumlah enrollment melebihi satu halaman.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Laporan penjualan agregat dan ekspor.
- Aksi tenant terhadap enrollment (aktivasi manual, pembatalan).
- Detail student di luar yang dikembalikan API enrollment.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-enrollment-and-payment-overview",
  "projectKey": "tenant-selling-operations",
  "title": "Tampilkan enrollment dan status pembayaran kepada tenant",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Dashboard tenant tidak memiliki tampilan enrollment, pendaftar, atau pembayaran. Backend sudah menyediakan `GET /api/v1/enrollments` dan `GET /api/v1/enrollments/:id` tenant-scoped dengan filter status, serta `GET /api/v1/billing/transactions` tenant-scoped dengan filter status, student, enrollment, dan tanggal. Halaman parent `/dashboard/parent/enrollments` sudah menggabungkan kedua sumber dan dapat menjadi pola.",
    "goal": "Tenant dapat melihat siapa yang mendaftar ke kelasnya, jadwal yang dipilih, dan status pembayaran terkini tanpa akses API langsung.",
    "requirements": [
      "Halaman enrollment tenant menampilkan student, kelas, jadwal, status enrollment, dan status pembayaran termasuk state rekonsiliasi.",
      "Filter status dan pagination mengikuti query backend yang ada.",
      "State loading, empty, forbidden, dan error API ditampilkan.",
      "Data tenant lain tidak pernah ditampilkan; otorisasi tetap di backend."
    ],
    "acceptanceCriteria": [
      "Tenant melihat daftar enrollment kelasnya beserta status pembayaran yang sesuai dengan backend",
      "Filter status mengubah hasil sesuai backend",
      "Member tanpa akses melihat state forbidden tanpa error teknis",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Reuse presentasi status dari `lib/payment-status.ts`. Setelah permission enrollment:read diberlakukan di academic, halaman ini harus menampilkan state forbidden dengan benar. Tambahkan item navigasi pada sidebar dan mobile nav tenant.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_queries/queries.ts",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Enrollment tanpa transaksi karena invoice gagal dibuat.",
      "Transaksi paid dengan rekonsiliasi terminal_failed.",
      "Jumlah enrollment melebihi satu halaman."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Laporan penjualan agregat dan ekspor.",
      "Aksi tenant terhadap enrollment (aktivasi manual, pembatalan).",
      "Detail student di luar yang dikembalikan API enrollment."
    ]
  }
}
```

---

### [FEATURE] Hadirkan halaman pengaturan profil dan lokasi tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Form terhadap DTO identity yang sudah ada; satu-satunya ketidakpastian adalah bentuk field about.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-tenant-settings-page`

## Background / Problem

`app/(dashboard)/dashboard/tenant/settings/page.tsx:23-30` hanya berisi teks placeholder. Identity sudah menyediakan `GET/PATCH /api/v1/tenant/settings` (name, phone, address, about) dan `GET/PUT /api/v1/tenant/settings/location` (address, latitude/longitude opsional, google_place_id) dengan permission `tenant:update`. Lokasi memengaruhi pencarian katalog berbasis radius.

## Goal

Tenant dapat melengkapi profil dan lokasi yang ditampilkan di katalog publik dari dashboard.

## Requirements

- Form profil memakai field DTO identity saat ini dengan validasi setara.
- Form lokasi mendukung alamat saja (geocode di backend) atau alamat dengan koordinat berpasangan.
- State loading, sukses, validasi, forbidden, dan error API ditampilkan.
- Navigasi dan halaman tenant lain tetap berfungsi.

## Acceptance Criteria

- [ ] Tenant dapat memperbarui nama, telepon, alamat, dan about dan melihat nilainya setelah reload
- [ ] Tenant dapat memperbarui lokasi dan hasil geocode atau koordinat tersimpan ditampilkan
- [ ] Member tanpa tenant:update melihat form read-only atau pesan forbidden
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Field `about` bertipe JSON di backend; batasi UI pada bentuk yang sudah ditulis oleh registrasi atau perlakukan sebagai teks terstruktur sederhana yang disepakati. Geocoding backend bersifat opsional dan dapat gagal; tampilkan pesan backend.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/settings`
- `kelolakelas-identity-service/internal/domain/tenant.go`

## Edge Cases

- Latitude diisi tanpa longitude.
- Geocoding dinonaktifkan di backend.
- Nama tenant bentrok dengan tenant lain.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Upload logo.
- Peta interaktif.
- Pengaturan pembayaran atau rekening.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-settings-page",
  "projectKey": "tenant-selling-operations",
  "title": "Hadirkan halaman pengaturan profil dan lokasi tenant",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`app/(dashboard)/dashboard/tenant/settings/page.tsx:23-30` hanya berisi teks placeholder. Identity sudah menyediakan `GET/PATCH /api/v1/tenant/settings` (name, phone, address, about) dan `GET/PUT /api/v1/tenant/settings/location` (address, latitude/longitude opsional, google_place_id) dengan permission `tenant:update`. Lokasi memengaruhi pencarian katalog berbasis radius.",
    "goal": "Tenant dapat melengkapi profil dan lokasi yang ditampilkan di katalog publik dari dashboard.",
    "requirements": [
      "Form profil memakai field DTO identity saat ini dengan validasi setara.",
      "Form lokasi mendukung alamat saja (geocode di backend) atau alamat dengan koordinat berpasangan.",
      "State loading, sukses, validasi, forbidden, dan error API ditampilkan.",
      "Navigasi dan halaman tenant lain tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Tenant dapat memperbarui nama, telepon, alamat, dan about dan melihat nilainya setelah reload",
      "Tenant dapat memperbarui lokasi dan hasil geocode atau koordinat tersimpan ditampilkan",
      "Member tanpa tenant:update melihat form read-only atau pesan forbidden",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Field `about` bertipe JSON di backend; batasi UI pada bentuk yang sudah ditulis oleh registrasi atau perlakukan sebagai teks terstruktur sederhana yang disepakati. Geocoding backend bersifat opsional dan dapat gagal; tampilkan pesan backend.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings",
      "kelolakelas-identity-service/internal/domain/tenant.go"
    ],
    "edgeCases": [
      "Latitude diisi tanpa longitude.",
      "Geocoding dinonaktifkan di backend.",
      "Nama tenant bentrok dengan tenant lain."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Upload logo.",
      "Peta interaktif.",
      "Pengaturan pembayaran atau rekening."
    ]
  }
}
```

---

### [FEATURE] Sediakan halaman penerimaan undangan anggota tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Halaman publik terhadap dua endpoint yang sudah ada; perlu memastikan matcher proxy.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-invitation-acceptance`

## Background / Problem

Email undangan identity menautkan ke `{APP_URL}/invitations/verify?token=...` (`kelolakelas-identity-service/pkg/email/resend.go:37-88`), tetapi web tidak memiliki route tersebut. Endpoint publik `GET /api/v1/invitations/verify` dan `POST /api/v1/invitations/register` sudah diproksikan gateway (`router.go:51-52`). Staf yang diundang dari halaman members tidak dapat menyelesaikan pendaftaran.

## Goal

Anggota yang diundang dapat membuka tautan email, melihat tenant dan role yang ditawarkan, dan menyelesaikan pendaftaran dari web.

## Requirements

- Route web memverifikasi token melalui gateway dan menampilkan nama tenant serta role.
- Form pendaftaran mengikuti payload invited-user identity dan setelah sukses mengarahkan ke login.
- Token tidak valid, kedaluwarsa, atau sudah dipakai ditampilkan sebagai state yang jelas.
- Alur undangan dari halaman members tetap berfungsi.

## Acceptance Criteria

- [ ] Pengguna dengan token valid dapat mendaftar dan kemudian login sebagai member tenant dengan role undangan
- [ ] Token kedaluwarsa atau sudah dipakai menampilkan pesan yang tepat tanpa form
- [ ] Halaman dapat diakses tanpa sesi dan tidak dialihkan oleh proxy
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Respons verify saat ini mengembalikan token dan role_id; jangan menampilkan token di UI. Pastikan matcher proxy tidak memperlakukan route ini sebagai protected.

Relevant areas:

- `kelolakelas-web/app/(auth)`
- `kelolakelas-web/proxy.ts`
- `kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go`

## Edge Cases

- Email undangan sudah terdaftar sebagai user.
- Pengguna sudah login sebagai akun lain saat membuka tautan.
- Token dipakai dua kali secara bersamaan.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Kirim ulang atau cabut undangan.
- Daftar undangan tertunda.
- Perubahan kontrak identity.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-invitation-acceptance",
  "projectKey": "tenant-selling-operations",
  "title": "Sediakan halaman penerimaan undangan anggota tenant",
  "type": "Feature",
  "priority": "High",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Email undangan identity menautkan ke `{APP_URL}/invitations/verify?token=...` (`kelolakelas-identity-service/pkg/email/resend.go:37-88`), tetapi web tidak memiliki route tersebut. Endpoint publik `GET /api/v1/invitations/verify` dan `POST /api/v1/invitations/register` sudah diproksikan gateway (`router.go:51-52`). Staf yang diundang dari halaman members tidak dapat menyelesaikan pendaftaran.",
    "goal": "Anggota yang diundang dapat membuka tautan email, melihat tenant dan role yang ditawarkan, dan menyelesaikan pendaftaran dari web.",
    "requirements": [
      "Route web memverifikasi token melalui gateway dan menampilkan nama tenant serta role.",
      "Form pendaftaran mengikuti payload invited-user identity dan setelah sukses mengarahkan ke login.",
      "Token tidak valid, kedaluwarsa, atau sudah dipakai ditampilkan sebagai state yang jelas.",
      "Alur undangan dari halaman members tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Pengguna dengan token valid dapat mendaftar dan kemudian login sebagai member tenant dengan role undangan",
      "Token kedaluwarsa atau sudah dipakai menampilkan pesan yang tepat tanpa form",
      "Halaman dapat diakses tanpa sesi dan tidak dialihkan oleh proxy",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Respons verify saat ini mengembalikan token dan role_id; jangan menampilkan token di UI. Pastikan matcher proxy tidak memperlakukan route ini sebagai protected.",
    "relevantAreas": [
      "kelolakelas-web/app/(auth)",
      "kelolakelas-web/proxy.ts",
      "kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go"
    ],
    "edgeCases": [
      "Email undangan sudah terdaftar sebagai user.",
      "Pengguna sudah login sebagai akun lain saat membuka tautan.",
      "Token dipakai dua kali secara bersamaan."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Kirim ulang atau cabut undangan.",
      "Daftar undangan tertunda.",
      "Perubahan kontrak identity."
    ]
  }
}
```

---

### [IMPROVEMENT] Laporkan kegagalan pengiriman email undangan

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operasional tenant untuk menjual kelas
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Perubahan respons dan logging pada satu use case; tidak ada perubahan skema.
- **Labels:** `identity`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `identity-invitation-delivery-status`

## Background / Problem

`CreateInvitation` membuang error pengiriman email (`internal/usecase/invitation_usecase.go:78`) sementara handler selalu menjawab bahwa email terkirim (`internal/delivery/http/handler/invitation_handler.go:113`). Klien Resend identity tidak memiliki timeout. Tenant tidak dapat mengetahui bahwa undangan tidak pernah sampai.

## Goal

Tenant mengetahui secara akurat apakah email undangan terkirim, dan kegagalan pengiriman terekam.

## Requirements

- Respons pembuatan undangan menyatakan status pengiriman email secara eksplisit; undangan tetap tersimpan meskipun pengiriman gagal.
- Kegagalan pengiriman dicatat dengan log terstruktur tanpa token.
- Klien Resend memiliki timeout.
- Web menampilkan pesan pengiriman sesuai respons tanpa perubahan kontrak lain.

## Acceptance Criteria

- [ ] Ketika Resend gagal, respons menyatakan undangan dibuat tetapi email tidak terkirim
- [ ] Ketika Resend berhasil, respons menyatakan email terkirim
- [ ] Log mencatat kegagalan pengiriman dengan ID undangan
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Pertahankan kode status 201 untuk undangan yang tersimpan; bedakan status pengiriman pada body. Web members page memakai respons ini; sesuaikan pesan bila field baru ditambahkan dan dokumentasikan di API identity.

Relevant areas:

- `kelolakelas-identity-service/internal/usecase/invitation_usecase.go`
- `kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go`
- `kelolakelas-identity-service/pkg/email/resend.go`

## Edge Cases

- RESEND_API_KEY kosong (pengiriman dilewati).
- Resend timeout setelah email terkirim.
- Alamat email tidak valid menurut Resend.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Endpoint kirim ulang undangan.
- Webhook status pengiriman Resend.
- Perubahan template email.

## AI Orchestrator Contract

```json
{
  "draftKey": "identity-invitation-delivery-status",
  "projectKey": "tenant-selling-operations",
  "title": "Laporkan kegagalan pengiriman email undangan",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "identity"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`CreateInvitation` membuang error pengiriman email (`internal/usecase/invitation_usecase.go:78`) sementara handler selalu menjawab bahwa email terkirim (`internal/delivery/http/handler/invitation_handler.go:113`). Klien Resend identity tidak memiliki timeout. Tenant tidak dapat mengetahui bahwa undangan tidak pernah sampai.",
    "goal": "Tenant mengetahui secara akurat apakah email undangan terkirim, dan kegagalan pengiriman terekam.",
    "requirements": [
      "Respons pembuatan undangan menyatakan status pengiriman email secara eksplisit; undangan tetap tersimpan meskipun pengiriman gagal.",
      "Kegagalan pengiriman dicatat dengan log terstruktur tanpa token.",
      "Klien Resend memiliki timeout.",
      "Web menampilkan pesan pengiriman sesuai respons tanpa perubahan kontrak lain."
    ],
    "acceptanceCriteria": [
      "Ketika Resend gagal, respons menyatakan undangan dibuat tetapi email tidak terkirim",
      "Ketika Resend berhasil, respons menyatakan email terkirim",
      "Log mencatat kegagalan pengiriman dengan ID undangan",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Pertahankan kode status 201 untuk undangan yang tersimpan; bedakan status pengiriman pada body. Web members page memakai respons ini; sesuaikan pesan bila field baru ditambahkan dan dokumentasikan di API identity.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/usecase/invitation_usecase.go",
      "kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go",
      "kelolakelas-identity-service/pkg/email/resend.go"
    ],
    "edgeCases": [
      "RESEND_API_KEY kosong (pengiriman dilewati).",
      "Resend timeout setelah email terkirim.",
      "Alamat email tidak valid menurut Resend."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Endpoint kirim ulang undangan.",
      "Webhook status pengiriman Resend.",
      "Perubahan template email."
    ]
  }
}
```

---

### [IMPROVEMENT] Terapkan timeout, batas body, dan error envelope pada proxy gateway

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Improvement`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `medium`
- **Complexity rationale:** Konfigurasi transport dan error handler reverse proxy stdlib; risiko memutus request sah yang lambat seperti geocoding.
- **Labels:** `api-gateway`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `gateway-proxy-resilience`

## Background / Problem

Reverse proxy dibuat tanpa transport kustom, tanpa timeout header/response, tanpa `ErrorHandler`, dan server dijalankan dengan `r.Run` tanpa read/write/idle timeout (`internal/delivery/http/handler/proxy_handler.go`, `cmd/server/main.go:50`). Tidak ada batas ukuran body. Downstream yang mati menghasilkan 502 teks polos dari stdlib yang tidak mengikuti envelope `{status,message,data}`.

## Goal

Gateway tetap responsif ketika downstream lambat atau mati, membatasi request berukuran tidak wajar, dan selalu menjawab dengan envelope JSON yang konsisten.

## Requirements

- Timeout upstream dan server dapat dikonfigurasi dengan default yang didokumentasikan.
- Batas ukuran body request yang dapat dikonfigurasi menghasilkan 413 dengan envelope JSON.
- Kegagalan atau timeout downstream menghasilkan 502 atau 504 dengan envelope JSON tanpa detail internal.
- Health, Swagger, webhook Duitku, dan seluruh route yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Downstream yang tidak merespons menghasilkan 504 JSON dalam batas waktu yang dikonfigurasi
- [ ] Downstream yang mati menghasilkan 502 JSON dengan envelope standar
- [ ] Body melebihi batas menghasilkan 413 JSON sebelum diteruskan
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Batas body harus lebih besar dari payload callback Duitku dan form registrasi. Timeout tidak boleh memutus request yang secara sah memerlukan waktu, misalnya geocoding lokasi tenant. Perbarui dokumentasi konfigurasi dan environment.

Relevant areas:

- `kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`
- `kelolakelas-api-gateway/cmd/server/main.go`
- `kelolakelas-api-gateway/internal/config/config.go`

## Edge Cases

- Downstream menutup koneksi setelah header terkirim.
- Request OPTIONS preflight.
- Upload multipart di masa depan (tidak ada saat ini).

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Retry atau circuit breaker.
- Kebijakan fail-closed rate limiter.
- Graceful shutdown service downstream.

## AI Orchestrator Contract

```json
{
  "draftKey": "gateway-proxy-resilience",
  "projectKey": "platform-operability",
  "title": "Terapkan timeout, batas body, dan error envelope pada proxy gateway",
  "type": "Improvement",
  "priority": "High",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Reverse proxy dibuat tanpa transport kustom, tanpa timeout header/response, tanpa `ErrorHandler`, dan server dijalankan dengan `r.Run` tanpa read/write/idle timeout (`internal/delivery/http/handler/proxy_handler.go`, `cmd/server/main.go:50`). Tidak ada batas ukuran body. Downstream yang mati menghasilkan 502 teks polos dari stdlib yang tidak mengikuti envelope `{status,message,data}`.",
    "goal": "Gateway tetap responsif ketika downstream lambat atau mati, membatasi request berukuran tidak wajar, dan selalu menjawab dengan envelope JSON yang konsisten.",
    "requirements": [
      "Timeout upstream dan server dapat dikonfigurasi dengan default yang didokumentasikan.",
      "Batas ukuran body request yang dapat dikonfigurasi menghasilkan 413 dengan envelope JSON.",
      "Kegagalan atau timeout downstream menghasilkan 502 atau 504 dengan envelope JSON tanpa detail internal.",
      "Health, Swagger, webhook Duitku, dan seluruh route yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Downstream yang tidak merespons menghasilkan 504 JSON dalam batas waktu yang dikonfigurasi",
      "Downstream yang mati menghasilkan 502 JSON dengan envelope standar",
      "Body melebihi batas menghasilkan 413 JSON sebelum diteruskan",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Batas body harus lebih besar dari payload callback Duitku dan form registrasi. Timeout tidak boleh memutus request yang secara sah memerlukan waktu, misalnya geocoding lokasi tenant. Perbarui dokumentasi konfigurasi dan environment.",
    "relevantAreas": [
      "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go",
      "kelolakelas-api-gateway/cmd/server/main.go",
      "kelolakelas-api-gateway/internal/config/config.go"
    ],
    "edgeCases": [
      "Downstream menutup koneksi setelah header terkirim.",
      "Request OPTIONS preflight.",
      "Upload multipart di masa depan (tidak ada saat ini)."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Retry atau circuit breaker.",
      "Kebijakan fail-closed rate limiter.",
      "Graceful shutdown service downstream."
    ]
  }
}
```

---

### [IMPROVEMENT] Tambahkan request ID dan access log terstruktur di gateway

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Middleware standar tanpa dependency baru.
- **Labels:** `api-gateway`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `gateway-request-id-and-access-log`

## Background / Problem

Gateway hanya mencatat satu `slog.Info` per request berisi method dan path (`proxy_handler.go:47,63,85,108`) tanpa status, latensi, atau ID korelasi; `gin.Logger()` tidak terdaftar dan tidak ada penanganan `X-Request-ID` di repo mana pun. Kegagalan lintas service tidak dapat ditelusuri.

## Goal

Setiap request yang melewati gateway memiliki request ID yang diteruskan ke downstream dan dikembalikan ke klien, serta satu baris access log terstruktur.

## Requirements

- Request ID diambil dari header masuk bila valid (panjang dan karakter dibatasi) atau dibuat baru, diteruskan ke downstream, dan dikembalikan pada respons.
- Access log JSON mencatat request ID, method, path, status, latensi, dan IP klien tanpa header Authorization atau body.
- Log proxy per service yang ada digantikan atau diperkaya, bukan digandakan.
- Perilaku routing, CORS, dan rate limiting tidak berubah.

## Acceptance Criteria

- [ ] Respons setiap request membawa header request ID
- [ ] Downstream menerima header request ID yang sama
- [ ] Setiap request menghasilkan tepat satu baris access log dengan field yang ditentukan
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

IP klien mengikuti `SetTrustedProxies(nil)` yang ada; jangan mengubah kebijakan trusted proxy di issue ini. Jangan mencatat query string yang dapat berisi token undangan tanpa redaksi.

Relevant areas:

- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-api-gateway/internal/delivery/http/middleware`
- `kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`

## Edge Cases

- Header request ID masuk berisi karakter tidak valid atau terlalu panjang.
- Request ditolak oleh CORS atau rate limiter sebelum proxy.
- Route Swagger dan health.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Logging di service downstream.
- Tracing terdistribusi dan metrics.
- Agregasi log.

## AI Orchestrator Contract

```json
{
  "draftKey": "gateway-request-id-and-access-log",
  "projectKey": "platform-operability",
  "title": "Tambahkan request ID dan access log terstruktur di gateway",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Gateway hanya mencatat satu `slog.Info` per request berisi method dan path (`proxy_handler.go:47,63,85,108`) tanpa status, latensi, atau ID korelasi; `gin.Logger()` tidak terdaftar dan tidak ada penanganan `X-Request-ID` di repo mana pun. Kegagalan lintas service tidak dapat ditelusuri.",
    "goal": "Setiap request yang melewati gateway memiliki request ID yang diteruskan ke downstream dan dikembalikan ke klien, serta satu baris access log terstruktur.",
    "requirements": [
      "Request ID diambil dari header masuk bila valid (panjang dan karakter dibatasi) atau dibuat baru, diteruskan ke downstream, dan dikembalikan pada respons.",
      "Access log JSON mencatat request ID, method, path, status, latensi, dan IP klien tanpa header Authorization atau body.",
      "Log proxy per service yang ada digantikan atau diperkaya, bukan digandakan.",
      "Perilaku routing, CORS, dan rate limiting tidak berubah."
    ],
    "acceptanceCriteria": [
      "Respons setiap request membawa header request ID",
      "Downstream menerima header request ID yang sama",
      "Setiap request menghasilkan tepat satu baris access log dengan field yang ditentukan",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "IP klien mengikuti `SetTrustedProxies(nil)` yang ada; jangan mengubah kebijakan trusted proxy di issue ini. Jangan mencatat query string yang dapat berisi token undangan tanpa redaksi.",
    "relevantAreas": [
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-api-gateway/internal/delivery/http/middleware",
      "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go"
    ],
    "edgeCases": [
      "Header request ID masuk berisi karakter tidak valid atau terlalu panjang.",
      "Request ditolak oleh CORS atau rate limiter sebelum proxy.",
      "Route Swagger dan health."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Logging di service downstream.",
      "Tracing terdistribusi dan metrics.",
      "Agregasi log."
    ]
  }
}
```

---

### [IMPROVEMENT] Catat request dan event domain dengan request ID di identity, academic, dan billing

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `low`
- **Complexity rationale:** Middleware serupa di tiga repo dengan slog yang sudah ada; risiko utama kebocoran data ke log.
- **Labels:** `identity`, `academic`, `billing`, `ai-ready`
- **Dependencies:** `gateway-request-id-and-access-log`
- **draftKey:** `services-request-logging-with-correlation`

## Background / Problem

Ketiga service memakai `slog` JSON hanya untuk event startup; tidak ada access log dan hampir tidak ada log di handler atau use case (billing hanya delapan baris log, semuanya di startup; academic tiga baris di repository student). Penolakan webhook, permission 503, dan kegagalan internal tidak meninggalkan jejak.

## Goal

Setiap request di ketiga service menghasilkan access log dengan request ID yang sama seperti gateway, dan event domain penting tercatat dengan konteks yang cukup untuk diagnosis.

## Requirements

- Middleware access log di setiap service mencatat request ID dari header (atau membuatnya), method, path, status, dan latensi.
- Event penting dicatat dengan request ID: penolakan signature webhook, kegagalan panggilan internal atau gRPC, permission denied 403/503, dan error 5xx.
- Log tidak memuat token, kredensial internal, password, atau PII di luar ID.
- Perilaku bisnis tidak berubah.

## Acceptance Criteria

- [ ] Request yang sama dapat ditelusuri dari log gateway ke log service melalui request ID
- [ ] Webhook dengan signature salah menghasilkan log peringatan dengan request ID
- [ ] Tidak ada nilai Authorization atau kredensial di log
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan `slog` yang sudah dipasang; hindari dependency baru. Endpoint internal juga harus mencatat request ID untuk korelasi billing-academic. Perbarui dokumentasi operasi.

Relevant areas:

- `kelolakelas-identity-service/cmd/server/main.go`
- `kelolakelas-academic-service/cmd/server/main.go`
- `kelolakelas-billing-service/cmd/server/main.go`
- `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go`

## Edge Cases

- Request tanpa header request ID (akses langsung tanpa gateway).
- Panggilan worker tanpa request HTTP.
- Log volume tinggi pada katalog publik.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Metrics dan tracing.
- Log rekonsiliasi rinci (issue billing terpisah).
- Perubahan level log runtime.

## AI Orchestrator Contract

```json
{
  "draftKey": "services-request-logging-with-correlation",
  "projectKey": "platform-operability",
  "title": "Catat request dan event domain dengan request ID di identity, academic, dan billing",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "low",
  "labels": [
    "identity",
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [
    "gateway-request-id-and-access-log"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Ketiga service memakai `slog` JSON hanya untuk event startup; tidak ada access log dan hampir tidak ada log di handler atau use case (billing hanya delapan baris log, semuanya di startup; academic tiga baris di repository student). Penolakan webhook, permission 503, dan kegagalan internal tidak meninggalkan jejak.",
    "goal": "Setiap request di ketiga service menghasilkan access log dengan request ID yang sama seperti gateway, dan event domain penting tercatat dengan konteks yang cukup untuk diagnosis.",
    "requirements": [
      "Middleware access log di setiap service mencatat request ID dari header (atau membuatnya), method, path, status, dan latensi.",
      "Event penting dicatat dengan request ID: penolakan signature webhook, kegagalan panggilan internal atau gRPC, permission denied 403/503, dan error 5xx.",
      "Log tidak memuat token, kredensial internal, password, atau PII di luar ID.",
      "Perilaku bisnis tidak berubah."
    ],
    "acceptanceCriteria": [
      "Request yang sama dapat ditelusuri dari log gateway ke log service melalui request ID",
      "Webhook dengan signature salah menghasilkan log peringatan dengan request ID",
      "Tidak ada nilai Authorization atau kredensial di log",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan `slog` yang sudah dipasang; hindari dependency baru. Endpoint internal juga harus mencatat request ID untuk korelasi billing-academic. Perbarui dokumentasi operasi.",
    "relevantAreas": [
      "kelolakelas-identity-service/cmd/server/main.go",
      "kelolakelas-academic-service/cmd/server/main.go",
      "kelolakelas-billing-service/cmd/server/main.go",
      "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go"
    ],
    "edgeCases": [
      "Request tanpa header request ID (akses langsung tanpa gateway).",
      "Panggilan worker tanpa request HTTP.",
      "Log volume tinggi pada katalog publik."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Metrics dan tracing.",
      "Log rekonsiliasi rinci (issue billing terpisah).",
      "Perubahan level log runtime."
    ]
  }
}
```

---

### [IMPROVEMENT] Sediakan readiness check dengan probe dependency di gateway dan ketiga service

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `M`
- **Complexity:** `low`
- **Complexity rationale:** Probe dependency sederhana di empat repo dengan pola health yang ada.
- **Labels:** `api-gateway`, `identity`, `academic`, `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `readiness-health-checks`

## Background / Problem

Semua `GET /health` mengembalikan JSON statis tanpa memeriksa apa pun (`cmd/server/health.go` di tiap service; gateway `router.go:29-34`). Service dapat dinyatakan sehat ketika database, Redis, identity gRPC, atau downstream tidak tersedia. Tidak ada pemisahan liveness dan readiness.

## Goal

Orkestrator atau operator dapat membedakan proses hidup dari service yang siap melayani, berdasarkan status dependency yang sebenarnya.

## Requirements

- Endpoint readiness memeriksa dependency wajib: database untuk identity, academic, billing; identity gRPC untuk academic; ketiga downstream untuk gateway.
- Dependency opsional (Redis identity, Redis gateway) dilaporkan sebagai degraded tanpa menggagalkan readiness.
- Endpoint liveness tetap murah dan tidak memanggil dependency.
- Probe memiliki timeout singkat dan tidak menulis data.

## Acceptance Criteria

- [ ] Readiness mengembalikan non-2xx dengan detail komponen ketika database tidak tersedia
- [ ] Readiness gateway mencerminkan status health downstream
- [ ] Liveness tetap 200 saat dependency mati
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Jangan mengekspos DSN atau detail koneksi pada respons. Endpoint readiness harus tetap di luar rate limiting dan JWT seperti health saat ini. Perbarui dokumentasi operasi dan ports.

Relevant areas:

- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-identity-service/cmd/server/health.go`
- `kelolakelas-academic-service/cmd/server/health.go`
- `kelolakelas-billing-service/cmd/server/health.go`

## Edge Cases

- Database lambat tetapi hidup.
- Redis dikonfigurasi tetapi tidak dapat dijangkau.
- Readiness dipanggil sangat sering.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Graceful shutdown identity/academic/gateway.
- gRPC health service.
- Alerting.

## AI Orchestrator Contract

```json
{
  "draftKey": "readiness-health-checks",
  "projectKey": "platform-operability",
  "title": "Sediakan readiness check dengan probe dependency di gateway dan ketiga service",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "low",
  "labels": [
    "api-gateway",
    "identity",
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "api-gateway",
    "identity",
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Semua `GET /health` mengembalikan JSON statis tanpa memeriksa apa pun (`cmd/server/health.go` di tiap service; gateway `router.go:29-34`). Service dapat dinyatakan sehat ketika database, Redis, identity gRPC, atau downstream tidak tersedia. Tidak ada pemisahan liveness dan readiness.",
    "goal": "Orkestrator atau operator dapat membedakan proses hidup dari service yang siap melayani, berdasarkan status dependency yang sebenarnya.",
    "requirements": [
      "Endpoint readiness memeriksa dependency wajib: database untuk identity, academic, billing; identity gRPC untuk academic; ketiga downstream untuk gateway.",
      "Dependency opsional (Redis identity, Redis gateway) dilaporkan sebagai degraded tanpa menggagalkan readiness.",
      "Endpoint liveness tetap murah dan tidak memanggil dependency.",
      "Probe memiliki timeout singkat dan tidak menulis data."
    ],
    "acceptanceCriteria": [
      "Readiness mengembalikan non-2xx dengan detail komponen ketika database tidak tersedia",
      "Readiness gateway mencerminkan status health downstream",
      "Liveness tetap 200 saat dependency mati",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Jangan mengekspos DSN atau detail koneksi pada respons. Endpoint readiness harus tetap di luar rate limiting dan JWT seperti health saat ini. Perbarui dokumentasi operasi dan ports.",
    "relevantAreas": [
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-identity-service/cmd/server/health.go",
      "kelolakelas-academic-service/cmd/server/health.go",
      "kelolakelas-billing-service/cmd/server/health.go"
    ],
    "edgeCases": [
      "Database lambat tetapi hidup.",
      "Redis dikonfigurasi tetapi tidak dapat dijangkau.",
      "Readiness dipanggil sangat sering."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Graceful shutdown identity/academic/gateway.",
      "gRPC health service.",
      "Alerting."
    ]
  }
}
```

---

### [REFACTOR] Bersihkan artefak build, dump data, dan contoh kredensial dari repository Go

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Refactor`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `very-low`
- **Complexity rationale:** Perubahan file tracking dan konfigurasi contoh tanpa logika.
- **Labels:** `api-gateway`, `identity`, `academic`, `billing`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `repository-hygiene-artifacts-and-env-examples`

## Background / Problem

`git ls-files` menunjukkan binary ter-commit: academic `main` dan `server`, identity `server`, gateway `server`, serta billing `dump.rdb`. Setiap `.gitignore` Go hanya berisi `.env`. `kelolakelas-billing-service/.env.example` memuat nilai `JWT_SECRET=<redacted>` dan `REDIS_PASSWORD=<redacted>` serta variabel Redis yang tidak dibaca config. Makefile academic dan billing memiliki target `seed` ke direktori `seeders/` yang tidak ada, dan migrasi academic `000001_student_notes_tenant_nullable` tidak memiliki file down.

## Goal

Repository hanya melacak sumber, konfigurasi contoh berisi placeholder, dan tooling Makefile serta migrasi konsisten.

## Requirements

- Hapus binary dan dump dari tracking dan tambahkan pola build output serta dump ke .gitignore di keempat repo.
- Ganti nilai kredensial di .env.example billing dengan placeholder dan hapus variabel yang tidak dibaca.
- Selaraskan target seed Makefile academic dan billing dengan keadaan repo dan tambahkan migrasi down yang hilang di academic.
- Build, test, dan CI tetap lulus.

## Acceptance Criteria

- [ ] git ls-files di keempat repo tidak memuat binary atau file .rdb
- [ ] .env.example billing tidak memuat nilai rahasia nyata dan hanya variabel yang dibaca config
- [ ] make migrate-down pada academic berjalan untuk setiap migrasi up yang ada
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Jangan menulis ulang git history; binary lama tetap ada di riwayat dan itu di luar scope. Dokumentasikan di kelolakelas-docs bahwa secret contoh harus placeholder.

Relevant areas:

- `kelolakelas-billing-service/.env.example`
- `kelolakelas-academic-service/Makefile`
- `kelolakelas-academic-service/migrations`
- `kelolakelas-api-gateway/.gitignore`

## Edge Cases

- Developer lokal memiliki binary yang sama di working tree.
- CI mengandalkan artefak yang ter-commit (tidak ditemukan bukti).
- Migrasi down untuk perubahan nullable memerlukan data yang valid.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Penulisan ulang history.
- Rotasi secret di environment nyata.
- Penambahan linter atau govulncheck ke CI.

## AI Orchestrator Contract

```json
{
  "draftKey": "repository-hygiene-artifacts-and-env-examples",
  "projectKey": "platform-operability",
  "title": "Bersihkan artefak build, dump data, dan contoh kredensial dari repository Go",
  "type": "Refactor",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "very-low",
  "labels": [
    "api-gateway",
    "identity",
    "academic",
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "api-gateway",
    "identity",
    "academic",
    "billing"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`git ls-files` menunjukkan binary ter-commit: academic `main` dan `server`, identity `server`, gateway `server`, serta billing `dump.rdb`. Setiap `.gitignore` Go hanya berisi `.env`. `kelolakelas-billing-service/.env.example` memuat nilai `JWT_SECRET=<redacted>` dan `REDIS_PASSWORD=<redacted>` serta variabel Redis yang tidak dibaca config. Makefile academic dan billing memiliki target `seed` ke direktori `seeders/` yang tidak ada, dan migrasi academic `000001_student_notes_tenant_nullable` tidak memiliki file down.",
    "goal": "Repository hanya melacak sumber, konfigurasi contoh berisi placeholder, dan tooling Makefile serta migrasi konsisten.",
    "requirements": [
      "Hapus binary dan dump dari tracking dan tambahkan pola build output serta dump ke .gitignore di keempat repo.",
      "Ganti nilai kredensial di .env.example billing dengan placeholder dan hapus variabel yang tidak dibaca.",
      "Selaraskan target seed Makefile academic dan billing dengan keadaan repo dan tambahkan migrasi down yang hilang di academic.",
      "Build, test, dan CI tetap lulus."
    ],
    "acceptanceCriteria": [
      "git ls-files di keempat repo tidak memuat binary atau file .rdb",
      ".env.example billing tidak memuat nilai rahasia nyata dan hanya variabel yang dibaca config",
      "make migrate-down pada academic berjalan untuk setiap migrasi up yang ada",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Jangan menulis ulang git history; binary lama tetap ada di riwayat dan itu di luar scope. Dokumentasikan di kelolakelas-docs bahwa secret contoh harus placeholder.",
    "relevantAreas": [
      "kelolakelas-billing-service/.env.example",
      "kelolakelas-academic-service/Makefile",
      "kelolakelas-academic-service/migrations",
      "kelolakelas-api-gateway/.gitignore"
    ],
    "edgeCases": [
      "Developer lokal memiliki binary yang sama di working tree.",
      "CI mengandalkan artefak yang ter-commit (tidak ditemukan bukti).",
      "Migrasi down untuk perubahan nullable memerlukan data yang valid."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Penulisan ulang history.",
      "Rotasi secret di environment nyata.",
      "Penambahan linter atau govulncheck ke CI."
    ]
  }
}
```

---

### [IMPROVEMENT] Batasi pemanggilan gRPC dan penulisan snapshot tenant pada setiap request katalog

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `medium`
- **Complexity rationale:** Perlu kebijakan TTL dan degradasi saat identity mati tanpa dependency baru, serta menyatukan aturan visibility list dan detail.
- **Labels:** `academic`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `academic-catalog-tenant-info-caching`

## Background / Problem

Setiap request list atau detail katalog memanggil `GetTenantPublicInfo` untuk semua tenant hasil dan menyimpan ulang `tenant_location_snapshots` (`internal/usecase/catalog_usecase.go:17-37,49-76`, `internal/repository/catalog_repository.go:21-28`) tanpa TTL atau timeout gRPC (`pkg/grpcclient/tenant_client.go:42,50`). Visibility tenant nonaktif juga tidak konsisten: list memakai LEFT JOIN, detail memakai INNER JOIN dengan `is_active = true` (`catalog_repository.go:31,88`). Katalog publik adalah jalur tanpa autentikasi dan tanpa rate limit per user.

## Goal

Katalog publik melayani request tanpa beban gRPC dan penulisan per request, tetap tersedia saat identity tidak dapat dijangkau, dan menampilkan aturan visibility tenant yang konsisten.

## Requirements

- Snapshot tenant disegarkan dengan TTL atau frekuensi terbatas, bukan pada setiap request.
- Panggilan gRPC katalog memiliki timeout per panggilan; kegagalan identity tidak menggagalkan respons katalog selama snapshot tersedia.
- Kelas milik tenant nonaktif disembunyikan secara konsisten pada list dan detail.
- Filter, sort, pagination, dan availability yang ada tetap sama.

## Acceptance Criteria

- [ ] Dua request katalog berurutan dalam TTL tidak memicu panggilan gRPC atau penulisan snapshot kedua
- [ ] Katalog tetap merespons dengan snapshot ketika identity gRPC mati
- [ ] Kelas tenant nonaktif tidak muncul di list maupun detail
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Hindari dependency cache baru; kolom `updated_at` snapshot yang ada dapat menjadi dasar TTL. `mustUUID` yang menelan tenant ID tidak valid menjadi nil harus ditangani agar tidak menulis snapshot dengan kunci nil. Perbarui dokumentasi komponen academic.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/catalog_usecase.go`
- `kelolakelas-academic-service/internal/repository/catalog_repository.go`
- `kelolakelas-academic-service/pkg/grpcclient/tenant_client.go`

## Edge Cases

- Tenant baru yang belum memiliki snapshot.
- Tenant mengubah lokasi dalam masa TTL.
- Identity mengembalikan tenant ID yang tidak valid.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Caching hasil permission gRPC.
- Full-text search atau ranking.
- Rate limiting katalog.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-catalog-tenant-info-caching",
  "projectKey": "platform-operability",
  "title": "Batasi pemanggilan gRPC dan penulisan snapshot tenant pada setiap request katalog",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Setiap request list atau detail katalog memanggil `GetTenantPublicInfo` untuk semua tenant hasil dan menyimpan ulang `tenant_location_snapshots` (`internal/usecase/catalog_usecase.go:17-37,49-76`, `internal/repository/catalog_repository.go:21-28`) tanpa TTL atau timeout gRPC (`pkg/grpcclient/tenant_client.go:42,50`). Visibility tenant nonaktif juga tidak konsisten: list memakai LEFT JOIN, detail memakai INNER JOIN dengan `is_active = true` (`catalog_repository.go:31,88`). Katalog publik adalah jalur tanpa autentikasi dan tanpa rate limit per user.",
    "goal": "Katalog publik melayani request tanpa beban gRPC dan penulisan per request, tetap tersedia saat identity tidak dapat dijangkau, dan menampilkan aturan visibility tenant yang konsisten.",
    "requirements": [
      "Snapshot tenant disegarkan dengan TTL atau frekuensi terbatas, bukan pada setiap request.",
      "Panggilan gRPC katalog memiliki timeout per panggilan; kegagalan identity tidak menggagalkan respons katalog selama snapshot tersedia.",
      "Kelas milik tenant nonaktif disembunyikan secara konsisten pada list dan detail.",
      "Filter, sort, pagination, dan availability yang ada tetap sama."
    ],
    "acceptanceCriteria": [
      "Dua request katalog berurutan dalam TTL tidak memicu panggilan gRPC atau penulisan snapshot kedua",
      "Katalog tetap merespons dengan snapshot ketika identity gRPC mati",
      "Kelas tenant nonaktif tidak muncul di list maupun detail",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Hindari dependency cache baru; kolom `updated_at` snapshot yang ada dapat menjadi dasar TTL. `mustUUID` yang menelan tenant ID tidak valid menjadi nil harus ditangani agar tidak menulis snapshot dengan kunci nil. Perbarui dokumentasi komponen academic.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/catalog_usecase.go",
      "kelolakelas-academic-service/internal/repository/catalog_repository.go",
      "kelolakelas-academic-service/pkg/grpcclient/tenant_client.go"
    ],
    "edgeCases": [
      "Tenant baru yang belum memiliki snapshot.",
      "Tenant mengubah lokasi dalam masa TTL.",
      "Identity mengembalikan tenant ID yang tidak valid."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Caching hasil permission gRPC.",
      "Full-text search atau ranking.",
      "Rate limiting katalog."
    ]
  }
}
```

---

### [REFACTOR] Perbaiki field last_name student dan segarkan kontrak Swagger academic

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Operabilitas, ketahanan, dan kebersihan repository
- **Type:** `Refactor`
- **Priority:** `Low`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Perubahan nama field dengan urutan rilis dua repo dan regenerasi Swagger.
- **Labels:** `academic`, `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `academic-api-contract-cleanup`

## Background / Problem

Struct `Student` menyerialisasi nama belakang dengan tag `lastå_name` (`internal/domain/student.go:24`) dan web menormalkannya (`kelolakelas-web/lib/students.ts:29-30`, `lib/payment-status.ts:5`). Swagger academic terakhir dibuat 6 September sebelum perubahan permission 15 September: route alias body-param tidak terdokumentasi, anotasi security salah untuk `POST /tenants/{tenant_id}/enrollments` dan endpoint internal, dan tidak ada permission yang didokumentasikan. Tidak ada langkah regenerasi Swagger di CI atau Makefile.

## Goal

Kontrak API academic yang dipublikasikan sesuai dengan kode, dan field nama belakang student memakai nama yang benar tanpa memutus web.

## Requirements

- Tag JSON menjadi last_name; web menerima kedua nama selama transisi lalu hanya last_name setelah academic dirilis.
- Swagger diregenerasi dari anotasi terkini dengan security dan catatan permission yang benar.
- Makefile academic memiliki target regenerasi Swagger.
- Response student lainnya dan validasi web tidak berubah.

## Acceptance Criteria

- [ ] Respons student memakai last_name dan halaman student parent menampilkannya dengan benar
- [ ] Swagger memuat seluruh route yang terdaftar di main.go dengan security yang benar
- [ ] Dokumentasi API academic tidak lagi mencantumkan caveat typo
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Urutan rilis: web toleran terhadap kedua field lebih dulu, lalu academic. Jangan menambahkan validasi drift Swagger ke CI di issue ini kecuali sederhana.

Relevant areas:

- `kelolakelas-academic-service/internal/domain/student.go`
- `kelolakelas-academic-service/docs`
- `kelolakelas-web/lib/students.ts`
- `kelolakelas-web/lib/payment-status.ts`

## Edge Cases

- Klien lain yang bergantung pada nama field lama (tidak ditemukan).
- Anotasi Swagger pada handler tanpa route.
- Web memakai cache respons lama.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Penghapusan Swagger stale di kelolakelas-web/_docs.
- Regenerasi Swagger identity dan billing.
- Perubahan kontrak lain.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-api-contract-cleanup",
  "projectKey": "platform-operability",
  "title": "Perbaiki field last_name student dan segarkan kontrak Swagger academic",
  "type": "Refactor",
  "priority": "Low",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "academic",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Struct `Student` menyerialisasi nama belakang dengan tag `lastå_name` (`internal/domain/student.go:24`) dan web menormalkannya (`kelolakelas-web/lib/students.ts:29-30`, `lib/payment-status.ts:5`). Swagger academic terakhir dibuat 6 September sebelum perubahan permission 15 September: route alias body-param tidak terdokumentasi, anotasi security salah untuk `POST /tenants/{tenant_id}/enrollments` dan endpoint internal, dan tidak ada permission yang didokumentasikan. Tidak ada langkah regenerasi Swagger di CI atau Makefile.",
    "goal": "Kontrak API academic yang dipublikasikan sesuai dengan kode, dan field nama belakang student memakai nama yang benar tanpa memutus web.",
    "requirements": [
      "Tag JSON menjadi last_name; web menerima kedua nama selama transisi lalu hanya last_name setelah academic dirilis.",
      "Swagger diregenerasi dari anotasi terkini dengan security dan catatan permission yang benar.",
      "Makefile academic memiliki target regenerasi Swagger.",
      "Response student lainnya dan validasi web tidak berubah."
    ],
    "acceptanceCriteria": [
      "Respons student memakai last_name dan halaman student parent menampilkannya dengan benar",
      "Swagger memuat seluruh route yang terdaftar di main.go dengan security yang benar",
      "Dokumentasi API academic tidak lagi mencantumkan caveat typo",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Urutan rilis: web toleran terhadap kedua field lebih dulu, lalu academic. Jangan menambahkan validasi drift Swagger ke CI di issue ini kecuali sederhana.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain/student.go",
      "kelolakelas-academic-service/docs",
      "kelolakelas-web/lib/students.ts",
      "kelolakelas-web/lib/payment-status.ts"
    ],
    "edgeCases": [
      "Klien lain yang bergantung pada nama field lama (tidak ditemukan).",
      "Anotasi Swagger pada handler tanpa route.",
      "Web memakai cache respons lama."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Penghapusan Swagger stale di kelolakelas-web/_docs.",
      "Regenerasi Swagger identity dan billing.",
      "Perubahan kontrak lain."
    ]
  }
}
```

---

### [FEATURE] Sediakan halaman kembali dari pembayaran dengan pembaruan status otomatis

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Pengalaman pembeli yang lengkap di web
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Halaman Next.js dengan refresh terbatas di atas query yang sudah ada; bergantung konfigurasi eksternal.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** `duitku-return-url-points-to-web` (eksternal)
- **draftKey:** `web-payment-return-and-status-refresh`

## Background / Problem

Halaman `/dashboard/parent/enrollments` meminta parent memuat ulang secara manual setelah kembali dari provider (`page.tsx:14`) dan tidak ada polling atau route pendaratan khusus. Billing memakai `DUITKU_RETURN_URL` yang bila kosong jatuh ke URL callback webhook (`config.go:127-128`), sehingga parent dapat mendarat pada endpoint webhook billing. Status backend adalah satu-satunya sumber kebenaran; redirect provider tidak boleh dianggap bukti pembayaran.

## Goal

Parent yang kembali dari Duitku mendarat pada halaman web yang menampilkan status enrollment dan pembayaran terkini tanpa reload manual.

## Requirements

- Route pendaratan parent-only menampilkan status enrollment terkait berdasarkan backend dan menyegarkan secara otomatis dalam batas waktu sampai status tidak lagi pending.
- Halaman tidak pernah menampilkan sukses berdasarkan parameter redirect.
- Sesi hilang saat kembali mengarahkan ke login dengan tujuan kembali yang sama.
- Halaman enrollments yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Setelah kembali dari checkout, halaman menampilkan pending lalu berubah menjadi paid/active tanpa reload manual setelah callback diproses
- [ ] State reconciling, failed, dan expired ditampilkan sesuai backend
- [ ] Membuka halaman tanpa sesi mengarahkan ke login dan kembali setelah login
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Batasi durasi dan frekuensi refresh agar tidak membebani gateway. Reuse `lib/payment-status.ts`. Dokumentasikan nilai DUITKU_RETURN_URL yang diharapkan di kelolakelas-docs.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments`
- `kelolakelas-web/lib/payment-status.ts`
- `kelolakelas-web/proxy.ts`

## Edge Cases

- Parent kembali sebelum callback diproses.
- Transaksi paid tetapi enrollment masih reconciling.
- Parameter query berisi ID transaksi milik parent lain.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Perubahan billing atau provider.
- Notifikasi push.
- Unduh invoice.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-payment-return-and-status-refresh",
  "projectKey": "buyer-web-experience",
  "title": "Sediakan halaman kembali dari pembayaran dengan pembaruan status otomatis",
  "type": "Feature",
  "priority": "High",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [
    {
      "key": "duitku-return-url-points-to-web",
      "description": "DUITKU_RETURN_URL pada environment billing yang dituju harus mengarah ke route web halaman kembali; saat ini default-nya jatuh ke DUITKU_CALLBACK_URL (kelolakelas-billing-service/internal/config/config.go:127-128).",
      "verification": "Baca nilai DUITKU_RETURN_URL pada konfigurasi environment billing target dan pastikan sama dengan URL route web yang dibuat; setelah checkout sandbox, browser mendarat pada route web tersebut."
    }
  ],
  "body": {
    "backgroundProblem": "Halaman `/dashboard/parent/enrollments` meminta parent memuat ulang secara manual setelah kembali dari provider (`page.tsx:14`) dan tidak ada polling atau route pendaratan khusus. Billing memakai `DUITKU_RETURN_URL` yang bila kosong jatuh ke URL callback webhook (`config.go:127-128`), sehingga parent dapat mendarat pada endpoint webhook billing. Status backend adalah satu-satunya sumber kebenaran; redirect provider tidak boleh dianggap bukti pembayaran.",
    "goal": "Parent yang kembali dari Duitku mendarat pada halaman web yang menampilkan status enrollment dan pembayaran terkini tanpa reload manual.",
    "requirements": [
      "Route pendaratan parent-only menampilkan status enrollment terkait berdasarkan backend dan menyegarkan secara otomatis dalam batas waktu sampai status tidak lagi pending.",
      "Halaman tidak pernah menampilkan sukses berdasarkan parameter redirect.",
      "Sesi hilang saat kembali mengarahkan ke login dengan tujuan kembali yang sama.",
      "Halaman enrollments yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Setelah kembali dari checkout, halaman menampilkan pending lalu berubah menjadi paid/active tanpa reload manual setelah callback diproses",
      "State reconciling, failed, dan expired ditampilkan sesuai backend",
      "Membuka halaman tanpa sesi mengarahkan ke login dan kembali setelah login",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Batasi durasi dan frekuensi refresh agar tidak membebani gateway. Reuse `lib/payment-status.ts`. Dokumentasikan nilai DUITKU_RETURN_URL yang diharapkan di kelolakelas-docs.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments",
      "kelolakelas-web/lib/payment-status.ts",
      "kelolakelas-web/proxy.ts"
    ],
    "edgeCases": [
      "Parent kembali sebelum callback diproses.",
      "Transaksi paid tetapi enrollment masih reconciling.",
      "Parameter query berisi ID transaksi milik parent lain."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Perubahan billing atau provider.",
      "Notifikasi push.",
      "Unduh invoice."
    ]
  }
}
```

---

### [FEATURE] Sediakan pembatalan enrollment pending dari halaman parent

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Pengalaman pembeli yang lengkap di web
- **Type:** `Feature`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Aksi UI terhadap endpoint baru mengikuti pola Server Action parent.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** `cancel-pending-enrollment-backend`
- **draftKey:** `web-parent-cancel-pending-enrollment`

## Background / Problem

Halaman enrollments parent hanya menampilkan status; tidak ada aksi untuk membatalkan enrollment pending yang belum dibayar. Setelah endpoint pembatalan backend tersedia, parent memerlukan UI untuk melepaskan pendaftaran yang tidak jadi dilanjutkan.

## Goal

Parent dapat membatalkan enrollment pending miliknya dari halaman enrollments dengan konfirmasi dan melihat status terbaru.

## Requirements

- Aksi batal hanya muncul untuk enrollment pending milik parent.
- Konfirmasi sebelum membatalkan; hasil sukses, 409, dan error API ditampilkan.
- Daftar di-revalidate setelah pembatalan.
- Tampilan status yang ada tetap sama.

## Acceptance Criteria

- [ ] Parent dapat membatalkan enrollment pending dan melihat status dropped atau cancelled sesuai backend
- [ ] Enrollment yang sudah dibayar tidak menampilkan aksi batal
- [ ] Pembatalan yang ditolak backend menampilkan pesan yang jelas
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola Server Action parent yang ada. Jangan memakai window.confirm; gunakan konfirmasi yang dapat diakses keyboard sesuai pola yang disepakati di web.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments`

## Edge Cases

- Callback paid diproses tepat sebelum pembatalan.
- Double submit.
- Sesi kedaluwarsa saat aksi dijalankan.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Pembatalan enrollment aktif.
- Refund.
- Pembatalan oleh tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-parent-cancel-pending-enrollment",
  "projectKey": "buyer-web-experience",
  "title": "Sediakan pembatalan enrollment pending dari halaman parent",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "cancel-pending-enrollment-backend"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Halaman enrollments parent hanya menampilkan status; tidak ada aksi untuk membatalkan enrollment pending yang belum dibayar. Setelah endpoint pembatalan backend tersedia, parent memerlukan UI untuk melepaskan pendaftaran yang tidak jadi dilanjutkan.",
    "goal": "Parent dapat membatalkan enrollment pending miliknya dari halaman enrollments dengan konfirmasi dan melihat status terbaru.",
    "requirements": [
      "Aksi batal hanya muncul untuk enrollment pending milik parent.",
      "Konfirmasi sebelum membatalkan; hasil sukses, 409, dan error API ditampilkan.",
      "Daftar di-revalidate setelah pembatalan.",
      "Tampilan status yang ada tetap sama."
    ],
    "acceptanceCriteria": [
      "Parent dapat membatalkan enrollment pending dan melihat status dropped atau cancelled sesuai backend",
      "Enrollment yang sudah dibayar tidak menampilkan aksi batal",
      "Pembatalan yang ditolak backend menampilkan pesan yang jelas",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola Server Action parent yang ada. Jangan memakai window.confirm; gunakan konfirmasi yang dapat diakses keyboard sesuai pola yang disepakati di web.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments"
    ],
    "edgeCases": [
      "Callback paid diproses tepat sebelum pembatalan.",
      "Double submit.",
      "Sesi kedaluwarsa saat aksi dijalankan."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Pembatalan enrollment aktif.",
      "Refund.",
      "Pembatalan oleh tenant."
    ]
  }
}
```

---

### [FEATURE] Sediakan logout untuk parent dan tenant

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Pengalaman pembeli yang lengkap di web
- **Type:** `Feature`
- **Priority:** `High`
- **Estimate:** `S`
- **Complexity:** `very-low`
- **Complexity rationale:** Menghapus cookie dan redirect dengan pola Server Action yang ada.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-logout`

## Background / Problem

Pencarian `logout`, `sign out`, dan `signout` di `app/` dan `lib/` tidak menemukan apa pun. Cookie sesi berumur tujuh hari (`app/(auth)/login/_actions/actions.ts:72-90`) dan tidak ada menu akun di sidebar tenant, mobile nav, maupun halaman parent, sehingga pengguna perangkat bersama tidak dapat mengakhiri sesi.

## Goal

Pengguna dapat mengakhiri sesi dari halaman terautentikasi mana pun dan kembali ke halaman publik.

## Requirements

- Aksi logout menghapus cookie auth dan tenant lalu mengarahkan ke halaman login atau beranda.
- Kontrol logout tersedia di navigasi tenant (sidebar dan mobile) dan di area parent.
- Setelah logout, route protected mengarahkan ke login.
- Login, registrasi, dan proxy yang ada tetap berfungsi.

## Acceptance Criteria

- [ ] Menekan logout menghapus sesi dan membuka /dashboard mengarahkan ke login
- [ ] Logout tersedia untuk parent dan tenant pada layout desktop dan mobile
- [ ] Logout saat cookie sudah tidak ada tidak menghasilkan error
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Tidak ada endpoint revocation di identity; token tetap valid sampai kedaluwarsa 24 jam dan keterbatasan ini didokumentasikan. Gunakan Server Action sesuai pola yang ada.

Relevant areas:

- `kelolakelas-web/app/(auth)`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx`

## Edge Cases

- Logout dari halaman publik saat sesi parent aktif.
- Beberapa tab terbuka.
- Nama cookie dikonfigurasi berbeda lewat env.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Token revocation backend.
- Halaman profil akun.
- Logout dari semua perangkat.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-logout",
  "projectKey": "buyer-web-experience",
  "title": "Sediakan logout untuk parent dan tenant",
  "type": "Feature",
  "priority": "High",
  "estimate": "S",
  "complexity": "very-low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Pencarian `logout`, `sign out`, dan `signout` di `app/` dan `lib/` tidak menemukan apa pun. Cookie sesi berumur tujuh hari (`app/(auth)/login/_actions/actions.ts:72-90`) dan tidak ada menu akun di sidebar tenant, mobile nav, maupun halaman parent, sehingga pengguna perangkat bersama tidak dapat mengakhiri sesi.",
    "goal": "Pengguna dapat mengakhiri sesi dari halaman terautentikasi mana pun dan kembali ke halaman publik.",
    "requirements": [
      "Aksi logout menghapus cookie auth dan tenant lalu mengarahkan ke halaman login atau beranda.",
      "Kontrol logout tersedia di navigasi tenant (sidebar dan mobile) dan di area parent.",
      "Setelah logout, route protected mengarahkan ke login.",
      "Login, registrasi, dan proxy yang ada tetap berfungsi."
    ],
    "acceptanceCriteria": [
      "Menekan logout menghapus sesi dan membuka /dashboard mengarahkan ke login",
      "Logout tersedia untuk parent dan tenant pada layout desktop dan mobile",
      "Logout saat cookie sudah tidak ada tidak menghasilkan error",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Tidak ada endpoint revocation di identity; token tetap valid sampai kedaluwarsa 24 jam dan keterbatasan ini didokumentasikan. Gunakan Server Action sesuai pola yang ada.",
    "relevantAreas": [
      "kelolakelas-web/app/(auth)",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx"
    ],
    "edgeCases": [
      "Logout dari halaman publik saat sesi parent aktif.",
      "Beberapa tab terbuka.",
      "Nama cookie dikonfigurasi berbeda lewat env."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Token revocation backend.",
      "Halaman profil akun.",
      "Logout dari semua perangkat."
    ]
  }
}
```

---

### [IMPROVEMENT] Rapikan metadata halaman publik, bahasa dokumen, dan branding web

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Pengalaman pembeli yang lengkap di web
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `low`
- **Complexity rationale:** Metadata dinamis Next.js 16 dan penggantian string; perlu sanitasi deskripsi.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-public-metadata-language-branding`

## Background / Problem

Root layout masih memakai metadata `Create Next App` dan `lang="en"` (`app/layout.tsx:15-18,27`) padahal UI parent berbahasa Indonesia. `/kelas` dan `/kelas/[id]` tidak mengekspor metadata atau canonical sehingga mewarisi judul placeholder. Nama `Tutorin` masih ada di `package.json:2`, halaman login/register, `LoginForm.tsx:61`, `TenantSidebar.tsx:88,93`, dan `MobileNav.tsx:69,73`; README masih template create-next-app; `.env.example` tidak mencantumkan `NEXT_PUBLIC_APP_URL`.

## Goal

Halaman katalog dapat ditemukan dan dibagikan dengan judul serta deskripsi yang benar, dokumen memakai bahasa yang tepat, dan seluruh branding konsisten KelolaKelas.

## Requirements

- Metadata default aplikasi dan metadata dinamis untuk /kelas dan /kelas/[id] dengan title, description, canonical, dan Open Graph.
- Atribut lang dokumen mencerminkan bahasa UI.
- Seluruh referensi Tutorin diganti dan README menjelaskan proyek serta variabel environment termasuk NEXT_PUBLIC_APP_URL.
- Landing page dan halaman lain yang sudah memiliki metadata tetap benar.

## Acceptance Criteria

- [ ] Judul tab dan canonical /kelas dan detail kelas sesuai kelas yang ditampilkan
- [ ] Tidak ada string Tutorin atau Create Next App di app, lib, package.json, dan README
- [ ] .env.example mencantumkan semua variabel yang dibaca aplikasi
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Baca panduan metadata Next.js 16 di node_modules sesuai AGENTS.md web. Deskripsi kelas berasal dari JSON yang dinormalisasi di `lib/catalog.ts`; sanitasi sebelum dipakai di metadata. Jangan menghapus Swagger stale di _docs pada issue ini.

Relevant areas:

- `kelolakelas-web/app/layout.tsx`
- `kelolakelas-web/app/(public)/kelas`
- `kelolakelas-web/package.json`
- `kelolakelas-web/README.md`

## Edge Cases

- Kelas tidak ditemukan saat generateMetadata.
- Deskripsi kelas kosong.
- NEXT_PUBLIC_APP_URL tidak diset.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- sitemap.ts dan robots.ts.
- Internationalization library.
- Redesign visual.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-public-metadata-language-branding",
  "projectKey": "buyer-web-experience",
  "title": "Rapikan metadata halaman publik, bahasa dokumen, dan branding web",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Root layout masih memakai metadata `Create Next App` dan `lang=\"en\"` (`app/layout.tsx:15-18,27`) padahal UI parent berbahasa Indonesia. `/kelas` dan `/kelas/[id]` tidak mengekspor metadata atau canonical sehingga mewarisi judul placeholder. Nama `Tutorin` masih ada di `package.json:2`, halaman login/register, `LoginForm.tsx:61`, `TenantSidebar.tsx:88,93`, dan `MobileNav.tsx:69,73`; README masih template create-next-app; `.env.example` tidak mencantumkan `NEXT_PUBLIC_APP_URL`.",
    "goal": "Halaman katalog dapat ditemukan dan dibagikan dengan judul serta deskripsi yang benar, dokumen memakai bahasa yang tepat, dan seluruh branding konsisten KelolaKelas.",
    "requirements": [
      "Metadata default aplikasi dan metadata dinamis untuk /kelas dan /kelas/[id] dengan title, description, canonical, dan Open Graph.",
      "Atribut lang dokumen mencerminkan bahasa UI.",
      "Seluruh referensi Tutorin diganti dan README menjelaskan proyek serta variabel environment termasuk NEXT_PUBLIC_APP_URL.",
      "Landing page dan halaman lain yang sudah memiliki metadata tetap benar."
    ],
    "acceptanceCriteria": [
      "Judul tab dan canonical /kelas dan detail kelas sesuai kelas yang ditampilkan",
      "Tidak ada string Tutorin atau Create Next App di app, lib, package.json, dan README",
      ".env.example mencantumkan semua variabel yang dibaca aplikasi",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Baca panduan metadata Next.js 16 di node_modules sesuai AGENTS.md web. Deskripsi kelas berasal dari JSON yang dinormalisasi di `lib/catalog.ts`; sanitasi sebelum dipakai di metadata. Jangan menghapus Swagger stale di _docs pada issue ini.",
    "relevantAreas": [
      "kelolakelas-web/app/layout.tsx",
      "kelolakelas-web/app/(public)/kelas",
      "kelolakelas-web/package.json",
      "kelolakelas-web/README.md"
    ],
    "edgeCases": [
      "Kelas tidak ditemukan saat generateMetadata.",
      "Deskripsi kelas kosong.",
      "NEXT_PUBLIC_APP_URL tidak diset."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "sitemap.ts dan robots.ts.",
      "Internationalization library.",
      "Redesign visual."
    ]
  }
}
```

---

### [IMPROVEMENT] Lengkapi error boundary dan halaman not-found pada route publik dan dashboard

**Linear metadata (diisi sebelum membuat issue):**

- **Project:** Pengalaman pembeli yang lengkap di web
- **Type:** `Improvement`
- **Priority:** `Medium`
- **Estimate:** `S`
- **Complexity:** `very-low`
- **Complexity rationale:** File konvensi App Router tanpa logika bisnis.
- **Labels:** `web`, `ai-ready`
- **Dependencies:** Tidak ada yang diketahui
- **draftKey:** `web-error-boundaries`

## Background / Problem

Satu-satunya `error.tsx` berada di `app/(dashboard)/dashboard/parent/students/error.tsx`; tidak ada `not-found.tsx` atau `global-error.tsx`. Kesalahan tak terduga pada `/kelas`, `/kelas/[id]`, `/dashboard/parent/enrollments`, dan seluruh route tenant menampilkan layar error bawaan Next.js tanpa aksi pemulihan, dan URL tidak dikenal tidak memiliki halaman 404 bermerek.

## Goal

Setiap segmen route memiliki halaman error yang dapat dipulihkan dan halaman not-found yang konsisten dengan UI.

## Requirements

- error.tsx untuk segmen publik katalog, parent enrollments, dan layout tenant dengan aksi coba lagi.
- not-found.tsx global dan penggunaan notFound() yang ada tetap konsisten.
- Salinan pesan berbahasa Indonesia mengikuti gaya halaman yang ada.
- State error yang sudah ditangani secara eksplisit di halaman tidak berubah.

## Acceptance Criteria

- [ ] Error render pada /kelas menampilkan halaman error dengan tombol coba lagi yang berfungsi
- [ ] URL tidak dikenal menampilkan halaman not-found bermerek
- [ ] Error pada route tenant tetap menampilkan navigasi layout
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti panduan error handling Next.js 16 di node_modules. Jangan mencatat detail error ke browser; logging server-side mengikuti pola console.error yang ada.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx`

## Edge Cases

- Error terjadi di layout root.
- Error saat sesi kedaluwarsa.
- not-found dipicu dari Server Action.

## Testing / Validation

- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Dialog aksesibel untuk modal.
- Pelaporan error ke layanan eksternal.
- Redesign visual.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-error-boundaries",
  "projectKey": "buyer-web-experience",
  "title": "Lengkapi error boundary dan halaman not-found pada route publik dan dashboard",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "very-low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Satu-satunya `error.tsx` berada di `app/(dashboard)/dashboard/parent/students/error.tsx`; tidak ada `not-found.tsx` atau `global-error.tsx`. Kesalahan tak terduga pada `/kelas`, `/kelas/[id]`, `/dashboard/parent/enrollments`, dan seluruh route tenant menampilkan layar error bawaan Next.js tanpa aksi pemulihan, dan URL tidak dikenal tidak memiliki halaman 404 bermerek.",
    "goal": "Setiap segmen route memiliki halaman error yang dapat dipulihkan dan halaman not-found yang konsisten dengan UI.",
    "requirements": [
      "error.tsx untuk segmen publik katalog, parent enrollments, dan layout tenant dengan aksi coba lagi.",
      "not-found.tsx global dan penggunaan notFound() yang ada tetap konsisten.",
      "Salinan pesan berbahasa Indonesia mengikuti gaya halaman yang ada.",
      "State error yang sudah ditangani secara eksplisit di halaman tidak berubah."
    ],
    "acceptanceCriteria": [
      "Error render pada /kelas menampilkan halaman error dengan tombol coba lagi yang berfungsi",
      "URL tidak dikenal menampilkan halaman not-found bermerek",
      "Error pada route tenant tetap menampilkan navigasi layout",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti panduan error handling Next.js 16 di node_modules. Jangan mencatat detail error ke browser; logging server-side mengikuti pola console.error yang ada.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx"
    ],
    "edgeCases": [
      "Error terjadi di layout root.",
      "Error saat sesi kedaluwarsa.",
      "not-found dipicu dari Server Action."
    ],
    "testingValidation": [
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Dialog aksesibel untuk modal.",
      "Pelaporan error ke layanan eksternal.",
      "Redesign visual."
    ]
  }
}
```

## 4. Urutan eksekusi

| Urutan | Issue | Alasan urutan | Dependency | Outcome setelah selesai |
| --- | --- | --- | --- | --- |
| 1 | Ambil konteks tenant identity hanya dari claim JWT | Akses lintas tenant terkonfirmasi, berdiri sendiri, effort S | — | Parent tidak dapat membaca/mengubah data tenant lain via identity |
| 2 | Scope mutasi sesi dan jadwal ke tenant pemilik | Mutasi lintas tenant terkonfirmasi, berdiri sendiri | — | Sesi/jadwal tenant lain tidak dapat disentuh |
| 3 | Netralkan header konteks tenant dan internal di gateway | Menutup jalur dari edge untuk semua downstream | — | Header buatan client tidak pernah mencapai service |
| 4 | Ambil konteks tenant academic hanya dari claim JWT | Menutup sisa fallback dan membuka permission domain | — | Katalog tenant tidak bocor; path tenant divalidasi |
| 5 | Sediakan kontrol publikasi kelas di dashboard tenant | Backend siap; tanpa ini tenant tidak bisa menjual dari web | — | Tenant memublikasikan kelas dari web |
| 6 | Evaluasi role dan permission hanya dalam tenant yang sama | Melengkapi isolasi setelah konteks tenant bersih | (1) | Permission dan role undangan terikat tenant |
| 7 | Pulihkan transaksi tertahan di status creating | Bug pembayaran yang mengunci checkout, effort S | — | Retry invoice selalu berhasil setelah kegagalan provider |
| 8 | Kedaluwarsakan transaksi tak dibayar dan tangani result code | Prasyarat pelepasan kuota | — | Transaksi mencapai status final expired |
| 9 | Lepaskan kuota enrollment saat pembayaran gagal/kedaluwarsa | Butuh status expired dari billing | (8) | Kuota mencerminkan pembayaran nyata |
| 10 | Halaman kembali dari pembayaran dengan status otomatis | Memutus pendaratan ke URL webhook | eksternal: DUITKU_RETURN_URL | Parent mendarat di web dengan status terkini |
| 11 | Sediakan logout untuk parent dan tenant | Effort sangat kecil, kebutuhan dasar | — | Sesi dapat diakhiri |
| 12 | Sediakan endpoint pembaruan kelas untuk tenant | Prasyarat edit kelas di web | — | API update kelas tersedia |
| 13 | Sediakan edit kelas di dashboard tenant | Bergantung endpoint update | (12) | Tenant memperbaiki informasi kelas dari web |
| 14 | Tampilkan enrollment dan status pembayaran kepada tenant | Backend siap; nilai tinggi bagi tenant | — | Tenant memantau pendaftar dan pembayaran |
| 15 | Halaman penerimaan undangan anggota tenant | Memperbaiki tautan email yang mati | — | Staf dapat bergabung dari email |
| 16 | Permission student dan enrollment sisi tenant | Setelah konteks tenant academic bersih | (4) | Domain student/enrollment terproteksi role |
| 17 | Timeout, batas body, error envelope proxy gateway | Ketahanan edge sebelum trafik bertambah | — | Gateway stabil saat downstream lambat |
| 18 | Pembatalan enrollment pending oleh parent (backend) | Bergantung mekanisme pelepasan kuota | (9) | Parent dapat membatalkan sebelum bayar |
| 19 | Pembatalan enrollment pending dari halaman parent | Bergantung endpoint backend | (18) | UI pembatalan tersedia |
| 20 | Email konfirmasi pembayaran berhasil dan gagal | Independen; melengkapi konfirmasi | — | Parent menerima tanda terima |
| 21 | Rekonsiliasi terminal_failed dapat ditemukan dan diulang | Independen; kebutuhan operasi | — | Operator dapat memulihkan aktivasi gagal |
| 22 | Permission attendance dan report | Setelah konteks tenant academic bersih | (4) | Domain attendance/report terproteksi role |
| 23 | Lindungi login dari brute force dan enumerasi | Independen, prioritas Medium | — | Akun tahan tebakan password |
| 24 | Laporkan kegagalan pengiriman email undangan | Independen, effort S | — | Tenant tahu status email undangan |
| 25 | Halaman pengaturan profil dan lokasi tenant | Independen, prioritas Medium | — | Tenant melengkapi profil dan lokasi |
| 26 | Request ID dan access log di gateway | Prasyarat korelasi service | — | Setiap request ber-ID dan tercatat |
| 27 | Request logging dengan request ID di tiga service | Bergantung format request ID gateway | (26) | Request dapat ditelusuri lintas service |
| 28 | Readiness check dengan probe dependency | Independen | — | Dependency mati terdeteksi |
| 29 | Bersihkan artefak build, dump, contoh kredensial | Independen, sangat mudah | — | Repo hanya melacak sumber |
| 30 | Batasi gRPC dan penulisan snapshot katalog | Independen, performa jalur publik | — | Katalog ringan dan tahan identity mati |
| 31 | Metadata halaman publik, bahasa, branding | Independen | — | Katalog dapat ditemukan mesin pencari |
| 32 | Error boundary dan not-found | Independen | — | Error dapat dipulihkan pengguna |
| 33 | Field last_name dan kontrak Swagger academic | Independen, prioritas Low | — | Kontrak API sesuai kode |

## 5. Kandidat yang tidak dibuat

- **KEL-5 s.d. KEL-15 (10 issue run sebelumnya):** selesai; diverifikasi pada kode (JWT secret wajib, invoice internal saja, rekonsiliasi durable, permission tenant admin dan katalog, katalog publik, student parent, checkout, status pembayaran). Tidak diusulkan ulang.
- **mTLS/autentikasi gRPC identity–academic:** known gap High, tetapi topologi jaringan/deployment `Unknown`; butuh keputusan infrastruktur, bukan issue kode saja.
- **Dockerfile/Compose/IaC/deployment pipeline:** `Not found` di enam repo; keputusan platform. Fondasi penjualan tidak terblokir olehnya.
- **Kebijakan fail-closed rate limiter dan trusted proxies:** butuh keputusan produk/operasi tentang degradasi saat Redis mati; dicatat di docs 08.
- **Refund, settlement, withdrawal, voucher:** model dan interface ada tanpa implementasi maupun route; menunggu keputusan model payout dan fee.
- **Materi pembelajaran, progres, review/rating, notifikasi in-app:** tidak ada model data; terlalu spekulatif pada current state.
- **Filter kategori/tenant di katalog web:** membutuhkan endpoint publik daftar kategori yang belum ada; ditunda sampai ada bukti kebutuhan.
- **Permission read identity (`member:read`, `tenant:read`):** risiko turun drastis setelah konteks tenant hanya dari claim; ditunda.
- **Pemilihan tenant saat login untuk user multi-membership:** tidak ada bukti kebutuhan.
- **Modul Go bersama untuk JWT/config/internal-auth yang duplikat di 4 repo:** refactor bernilai tetapi lintas 4 repo dan berisiko konflik dengan sweep keamanan; ditunda sampai Project isolasi selesai.
- **Dialog aksesibel (focus trap, role=dialog) untuk modal web:** nilai nyata tetapi prioritas Low; ditunda.
- **Component/E2E test web dan linter/govulncheck Go di CI:** keputusan tooling; ditunda.
- **Graceful shutdown identity/academic/gateway dan locking subscription worker:** worker subscription nonaktif secara default; ditunda sampai renewal menjadi jalur yang dijual.
- **Injeksi X-User-ID atau autentikasi terpusat di gateway:** keputusan arsitektur; saat ini setiap service memvalidasi JWT sendiri dan itu dipertahankan.

## 6. Payload AI Orchestrator

Tervalidasi: `npm --prefix kelolakelas-ai-orchestrator run intake:validate -- ../planning-backlog-2026-09-16.yaml` → `{"event":"planning_backlog_validated","schemaVersion":"kelolakelas.planning-backlog/v1","projects":5,"issues":33}`.

```yaml
schemaVersion: kelolakelas.planning-backlog/v1
projects:
  - key: tenant-isolation-and-authorization
    name: Isolasi tenant dan otorisasi menyeluruh
    outcome: "Setiap operasi tenant hanya berjalan dalam konteks tenant yang berasal dari membership terverifikasi, dan seluruh domain akademik sisi tenant memiliki permission enforcement yang konsisten."
    problem: "Identity dan academic masih menerima header X-Tenant-ID dari client ketika claim tenant kosong, gateway tidak menetralkan header tersebut, lima operasi sesi/jadwal academic tidak di-scope tenant, permission dievaluasi tanpa tenant, dan domain student/enrollment/attendance/report masih hanya memerlukan JWT."
    valueAndPriority: "Dampak sangat tinggi karena jalur akses lintas tenant terkonfirmasi di kode; urgensi Urgent; confidence tinggi; effort keseluruhan M."
    scope:
      - "Netralisasi header konteks di gateway dan penghapusan fallback header di identity dan academic."
      - "Tenant scoping pada mutasi sesi/jadwal academic."
      - "Evaluasi role/permission yang terikat tenant, termasuk kontrak gRPC CheckPermission."
      - "Permission enforcement domain student, enrollment, attendance, dan report sisi tenant."
      - "Perlindungan login dari brute force dan enumerasi akun."
    outOfScope:
      - "mTLS atau autentikasi transport gRPC."
      - "Refresh token, logout backend, MFA, dan password reset."
      - "Redesign model RBAC atau UI permission-aware."
    successMetrics:
      - "Token parent atau token tanpa membership tidak dapat membaca atau mengubah data tenant mana pun melalui header."
      - "Setiap operasi sesi/jadwal menolak ID milik tenant lain tanpa perubahan data."
      - "Operasi student, enrollment, attendance, dan report sisi tenant menghasilkan 403 tanpa permission yang tepat."
      - "Login gagal berulang pada satu akun dibatasi dan terobservasi."
    dependenciesAndRisks:
      - "Perubahan kontrak gRPC CheckPermission harus dikoordinasikan identity-academic dan memperbarui ADR 0002."
      - "Penghapusan fallback header dapat memutus client yang selama ini bergantung pada header; web mengirim X-Tenant-ID dari cookie tetapi login selalu memberi claim tenant untuk member."
  - key: enrollment-payment-lifecycle
    name: Siklus hidup enrollment dan pembayaran yang lengkap
    outcome: "Setiap enrollment berakhir pada status final yang benar (aktif, dibatalkan, atau kedaluwarsa), kuota selalu mencerminkan pembayaran nyata, dan parent menerima konfirmasi hasil pembayaran."
    problem: "Enrollment pending menahan kuota tanpa batas waktu, transaksi tidak pernah kedaluwarsa secara lokal, kegagalan pembuatan invoice meninggalkan transaksi tertahan di status creating, callback dengan result code tidak dikenal diabaikan diam-diam, tidak ada pembatalan, tidak ada email hasil pembayaran, dan rekonsiliasi terminal_failed tidak dapat ditemukan atau diulang."
    valueAndPriority: "Dampak tinggi pada kebenaran kuota dan kepercayaan pembeli; urgensi High; confidence tinggi; effort keseluruhan L."
    scope:
      - "Pemulihan status transaksi tertahan dan kedaluwarsa transaksi yang tidak dibayar."
      - "Pelepasan kuota enrollment saat pembayaran gagal, kedaluwarsa, atau dibatalkan."
      - "Pembatalan enrollment pending oleh parent (backend)."
      - "Email konfirmasi hasil pembayaran."
      - "Observability dan re-drive rekonsiliasi terminal."
    outOfScope:
      - "Refund, withdrawal, settlement, dan voucher."
      - "Pergantian payment gateway atau metode pembayaran selain yang ada."
      - "Reconciliation renewal subscription di luar enrollment awal."
    successMetrics:
      - "Tidak ada transaksi yang tetap berstatus creating setelah kegagalan provider."
      - "Enrollment yang tidak dibayar melepaskan kuota setelah invoice kedaluwarsa."
      - "Parent menerima email untuk pembayaran berhasil dan gagal tepat satu kali."
      - "Setiap rekonsiliasi terminal_failed dapat dilihat dan diulang tanpa callback provider."
    dependenciesAndRisks:
      - "Transisi status lintas billing-academic harus idempotent dan mengikuti pola durable pada ADR 0001."
      - "Callback paid yang datang setelah kedaluwarsa atau pembatalan lokal harus tetap tercatat dan terobservasi."
  - key: tenant-selling-operations
    name: Operasional tenant untuk menjual kelas
    outcome: "Owner dan staf tenant dapat memublikasikan, memperbarui, dan memantau penjualan kelas serta mengelola profil dan tim mereka dari web tanpa akses API langsung."
    problem: "Dashboard tenant web hanya dapat membuat kelas; tidak ada kontrol publikasi, tidak ada edit kelas (API pun belum ada), tidak ada tampilan enrollment/pembayaran, halaman pengaturan masih placeholder, dan tautan undangan email mengarah ke halaman web yang tidak ada."
    valueAndPriority: "Dampak tinggi karena tanpa publikasi dan edit dari web tenant tidak dapat menjual; urgensi High; confidence tinggi; effort keseluruhan L."
    scope:
      - "Publikasi dan edit kelas dari dashboard tenant, termasuk endpoint update kelas."
      - "Tampilan enrollment dan status pembayaran untuk tenant."
      - "Halaman pengaturan tenant dan lokasi."
      - "Penerimaan undangan anggota dari web dan status pengiriman email undangan."
    outOfScope:
      - "Laporan penjualan agregat, settlement, dan payout."
      - "Kalender jadwal, absensi, dan rapor di web."
      - "Redesign visual dashboard tenant."
    successMetrics:
      - "Tenant dapat memublikasikan kelas dan melihatnya di katalog publik tanpa API manual."
      - "Tenant dapat memperbaiki nama, deskripsi, harga, dan kategori kelas tanpa menghapusnya."
      - "Tenant dapat melihat siapa yang mendaftar dan status pembayarannya."
      - "Staf yang diundang dapat menyelesaikan pendaftaran dari tautan email."
    dependenciesAndRisks:
      - "Endpoint update kelas memerlukan keputusan tentang pengaruh perubahan harga terhadap enrollment yang sudah ada."
      - "Tampilan enrollment tenant bergantung pada permission enrollment:read setelah enforcement diterapkan."
  - key: platform-operability
    name: Operabilitas, ketahanan, dan kebersihan repository
    outcome: "Operator dapat mendiagnosis request lintas service, mendeteksi dependency yang tidak sehat, dan gateway tetap stabil saat downstream lambat; repository bebas artefak build dan kredensial contoh nyata."
    problem: "Tidak ada request ID, access log, readiness check, atau timeout proxy; binary build dan dump Redis ter-commit; contoh env billing berisi nilai kredensial nyata; katalog memanggil gRPC dan menulis snapshot untuk setiap request; kontrak API academic memiliki typo field dan Swagger yang usang."
    valueAndPriority: "Dampak sedang-tinggi pada kemampuan operasi dan performa katalog; urgensi Medium; confidence tinggi; effort keseluruhan M."
    scope:
      - "Timeout, batas body, dan error envelope pada proxy gateway."
      - "Request ID dan access log di gateway dan ketiga service."
      - "Readiness check dengan probe dependency."
      - "Pembersihan artefak repository dan contoh konfigurasi."
      - "Caching info tenant katalog dan perbaikan kontrak API academic."
    outOfScope:
      - "Containerization, IaC, deployment pipeline, metrics/tracing stack."
      - "Kebijakan fail-closed rate limiter."
      - "Penulisan ulang git history untuk menghapus binary lama."
    successMetrics:
      - "Setiap request memiliki request ID yang sama di log gateway dan service."
      - "Downstream yang mati menghasilkan JSON envelope 502/504 dalam batas waktu yang ditentukan."
      - "Readiness endpoint gagal ketika database atau dependency wajib tidak tersedia."
      - "Tidak ada binary atau dump data yang dilacak git."
    dependenciesAndRisks:
      - "Access log tidak boleh mencatat token, kredensial, atau PII."
      - "Perubahan visibility tenant nonaktif pada katalog memengaruhi hasil pencarian publik."
  - key: buyer-web-experience
    name: Pengalaman pembeli yang lengkap di web
    outcome: "Parent dapat menyelesaikan siklus akun dan pembelian di web tanpa jalan buntu: kembali dari pembayaran dengan status terkini, membatalkan enrollment pending, keluar dari sesi, dan menemukan halaman katalog melalui mesin pencari."
    problem: "Setelah membayar parent diarahkan ke URL callback billing, halaman status harus dimuat ulang manual, tidak ada logout, halaman katalog tidak memiliki metadata dan memakai lang en serta branding Tutorin, dan sebagian route tidak memiliki error boundary."
    valueAndPriority: "Dampak tinggi pada konversi dan kepercayaan; urgensi High untuk return page dan logout; confidence tinggi; effort keseluruhan M."
    scope:
      - "Halaman kembali dari pembayaran dan pembaruan status otomatis."
      - "Pembatalan enrollment pending dari web."
      - "Logout."
      - "Metadata publik, bahasa, dan branding."
      - "Error boundary dan not-found."
    outOfScope:
      - "Review/rating, promo, cart, dan rekomendasi."
      - "Materi pembelajaran, progres, dan notifikasi in-app."
      - "Redesign visual menyeluruh."
    successMetrics:
      - "Parent yang kembali dari Duitku melihat status backend terkini tanpa reload manual."
      - "Parent dapat logout dari setiap halaman terautentikasi."
      - "Halaman katalog memiliki title, description, dan canonical yang benar."
      - "Kesalahan pada route publik dan dashboard menampilkan halaman error yang dapat dipulihkan."
    dependenciesAndRisks:
      - "Return page memerlukan DUITKU_RETURN_URL billing mengarah ke web."
      - "Pembatalan dari web bergantung pada endpoint pembatalan backend."
issues:
  - draftKey: gateway-strip-untrusted-context-headers
    projectKey: tenant-isolation-and-authorization
    title: Netralkan header konteks tenant dan internal dari client di gateway
    type: Improvement
    priority: Urgent
    estimate: S
    complexity: high
    labels: [api-gateway, ai-ready]
    repositories: [api-gateway]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Proxy academic dan billing hanya menetapkan `X-Tenant-ID` ketika claim tenant JWT tidak kosong (`internal/delivery/http/handler/proxy_handler.go:66-74,88-95`), proxy identity tidak menyentuh header sama sekali (`:50-52`), dan tidak ada header client yang dihapus. Middleware JWT gateway tidak mewajibkan claim apa pun non-empty (`internal/delivery/http/middleware/auth_middleware.go:78-83`). Token parent membawa tenant kosong, sehingga header `X-Tenant-ID` dan `X-Internal-Service-Credential` buatan client diteruskan apa adanya ke downstream yang masih memakai header tersebut sebagai fallback (identity `role_handler.go:32-35`, academic `list_handler.go:28-34`)."
      goal: "Request yang melewati gateway tidak pernah membawa header konteks tenant atau kredensial internal buatan client; header tenant selalu merepresentasikan claim JWT yang tervalidasi."
      requirements:
        - "Hapus `X-Tenant-ID` dan `X-Internal-Service-Credential` dari setiap request masuk sebelum diproksikan, pada route publik maupun protected."
        - "Pada route protected, tetapkan `X-Tenant-ID` dari claim JWT untuk proxy identity, academic, dan billing; jangan menetapkan header ketika claim kosong."
        - "Middleware JWT gateway menolak token tanpa `user_id`, serta token non-parent tanpa `tenant_id`, konsisten dengan academic."
        - "Route publik, CORS, rate limiting, dan proxy Swagger tetap berfungsi seperti sekarang."
      acceptanceCriteria:
        - "Request protected dengan header X-Tenant-ID buatan client tiba di downstream dengan nilai dari claim, atau tanpa header ketika claim kosong"
        - "Request publik maupun protected dengan X-Internal-Service-Credential dari client tiba di downstream tanpa header tersebut"
        - "Token tanpa user_id atau token non-parent tanpa tenant_id ditolak 401 di gateway"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: gateway adalah boundary pertama terhadap akses lintas tenant; kesalahan strip/set dapat meneruskan tenant palsu atau memutus request parent yang sah dengan claim tenant kosong. Downstream tetap tidak boleh mempercayai header ini karena direct service exposure masih mungkin; penghapusan fallback di identity dan academic ditangani issue terpisah. Jangan mengubah path, body, atau header Authorization."
      relevantAreas:
        - "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go"
        - "kelolakelas-api-gateway/internal/delivery/http/middleware/auth_middleware.go"
        - "kelolakelas-api-gateway/internal/delivery/http/router_test.go"
      edgeCases:
        - "Token parent tanpa tenant_id disertai header X-Tenant-ID buatan client."
        - "Header dikirim dengan kapitalisasi berbeda atau duplikat."
        - "Route proxy Swagger dan webhook Duitku yang tidak melewati middleware JWT."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test regresi membuktikan header buatan client tidak pernah mencapai downstream pada route publik dan protected"
      outOfScope:
        - "Penghapusan fallback header di identity dan academic."
        - "Injeksi X-User-ID atau penggantian validasi JWT downstream."
        - "Refresh token dan revocation."
  - draftKey: identity-tenant-context-from-jwt-only
    projectKey: tenant-isolation-and-authorization
    title: Ambil konteks tenant identity hanya dari claim JWT
    type: Improvement
    priority: Urgent
    estimate: S
    complexity: critical
    labels: [identity, ai-ready]
    repositories: [identity]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`extractTenantID` (`internal/delivery/http/handler/role_handler.go:22-38`) memakai header `X-Tenant-ID` dari client ketika claim tenant bernilai nil. Login memberi `tenant_id` nil untuk user tanpa membership aktif, termasuk semua parent (`internal/usecase/auth_usecase.go:77-86`). Akibatnya parent terautentikasi dapat membaca `GET /members`, `GET /tutors`, `GET /roles`, `GET /tenant/settings`, dan `GET /tenant/settings/location` tenant mana pun, dan mencapai mutasi bila memiliki `role_id`. Pola ini dipakai member, role, dan tenant handler; hanya invitation handler yang mengambil tenant ketat dari JWT (`invitation_handler.go:55-73`)."
      goal: "Endpoint tenant identity hanya beroperasi pada tenant dari membership aktif caller; caller tanpa membership ditolak sebelum data apa pun dibaca."
      requirements:
        - "Hapus fallback header X-Tenant-ID pada seluruh handler member, role, dan tenant."
        - "Token dengan tenant_id kosong menerima 403 pada setiap endpoint tenant, tanpa query ke repository."
        - "Member dengan claim tenant valid tetap mendapatkan perilaku yang sama seperti sekarang."
        - "Perilaku invitation creation, login, dan registrasi tidak berubah."
      acceptanceCriteria:
        - "Token parent dengan header X-Tenant-ID milik tenant lain menerima 403 pada GET /members, GET /tutors, GET /roles, GET /tenant/settings, dan seluruh mutasinya tanpa data tenant tersebut terbaca atau berubah"
        - "Member dengan claim tenant valid tetap dapat memakai endpoint yang sama"
        - "Header X-Tenant-ID apa pun diabaikan sepenuhnya oleh identity"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: kebocoran PII daftar member dan mutasi role/member tenant lain, terkonfirmasi di kode. Perubahan harus berdiri sendiri tanpa bergantung pada gateway karena service dapat diakses langsung. Penolakan harus terjadi di handler sebelum use case atau repository dipanggil, dan dibedakan dari 401 (token tidak valid) serta 400 (input tidak valid)."
      relevantAreas:
        - "kelolakelas-identity-service/internal/delivery/http/handler/role_handler.go"
        - "kelolakelas-identity-service/internal/delivery/http/handler/member_handler.go"
        - "kelolakelas-identity-service/internal/delivery/http/handler/tenant_handler.go"
      edgeCases:
        - "Claim tenant_id berupa string kosong versus UUID nil."
        - "User dengan membership yang dinonaktifkan setelah token diterbitkan."
        - "Header berisi UUID tenant milik caller sendiri; tetap harus diabaikan dan claim yang dipakai."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test regresi lintas tenant membuktikan token parent plus header tenant lain menghasilkan 403 pada setiap route tenant tanpa perubahan data"
      outOfScope:
        - "Pemilihan tenant untuk user dengan lebih dari satu membership."
        - "Permission read (member:read, tenant:read) pada endpoint GET."
        - "Perubahan gateway."
  - draftKey: academic-tenant-context-from-jwt-only
    projectKey: tenant-isolation-and-authorization
    title: Ambil konteks tenant academic hanya dari claim JWT dan cocokkan tenant pada path
    type: Improvement
    priority: Urgent
    estimate: S
    complexity: high
    labels: [academic, ai-ready]
    repositories: [academic]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`tenantIDFromContext` (`internal/delivery/http/handler/category_handler.go:143-152`), `list_handler.go:28-34`, dan `class_handler.go:42-44,88-90` memakai header `X-Tenant-ID` ketika claim tenant kosong. Middleware auth mengizinkan tenant kosong untuk parent (`internal/delivery/http/middleware/auth_middleware.go:50`), sehingga parent dapat membaca `GET /categories`, `GET /classes`, dan `GET /schedules` tenant mana pun termasuk kelas yang belum dipublikasikan. `POST /tenants/:tenant_id/enrollments` mengambil tenant dari path tanpa dicocokkan dengan claim (`enrollment_handler.go:74`). Anotasi Swagger masih mendokumentasikan header ini sebagai wajib."
      goal: "Seluruh operasi tenant academic memakai tenant dari claim JWT; tenant pada path harus sama dengan claim, dan caller tanpa tenant ditolak pada route yang memerlukan tenant."
      requirements:
        - "Hapus fallback header X-Tenant-ID pada category, class, list, dan schedule handler."
        - "Caller non-parent dengan tenant pada path yang berbeda dari claim menerima 403 pada POST /tenants/:tenant_id/enrollments."
        - "Parent pada route yang memerlukan konteks tenant menerima 403, bukan 400 atau 500."
        - "Alur enrollment katalog parent, public catalog, dan permission middleware yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Token parent dengan header X-Tenant-ID menerima 403 pada GET /categories, GET /classes, dan GET /schedules tanpa data tenant terbaca"
        - "Member tenant A yang memanggil POST /tenants/{tenant B}/enrollments menerima 403 tanpa enrollment dibuat"
        - "Member dengan claim tenant valid tetap dapat menjalankan seluruh operasi katalog dan enrollment tenantnya"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: kebocoran data katalog yang belum dipublikasikan dan pembuatan enrollment atas nama tenant lain. Permission middleware sudah menolak parent tanpa role_id pada mutasi, tetapi route GET tidak dilindungi. Perbarui anotasi Swagger yang menyebut X-Tenant-ID sebagai parameter wajib dan dokumentasi API academic."
      relevantAreas:
        - "kelolakelas-academic-service/internal/delivery/http/handler/category_handler.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/list_handler.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go"
      edgeCases:
        - "Parent memanggil POST /tenants/:tenant_id/enrollments; alur EnrollPublic yang ada harus tetap dipakai."
        - "Path tenant bukan UUID valid."
        - "Claim tenant valid tetapi tenant nonaktif menurut identity."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test regresi lintas tenant untuk setiap handler yang sebelumnya memakai fallback header"
      outOfScope:
        - "Scoping mutasi sesi/jadwal yang tidak menerima tenant sama sekali."
        - "Permission untuk student, enrollment, attendance, dan report."
        - "Perubahan gateway."
  - draftKey: academic-scope-session-schedule-mutations
    projectKey: tenant-isolation-and-authorization
    title: Scope mutasi sesi dan jadwal ke tenant pemilik
    type: Improvement
    priority: Urgent
    estimate: M
    complexity: critical
    labels: [academic, ai-ready]
    repositories: [academic]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`RescheduleSession`, `ChangeSchedulePermanent`, `ChangeTutorTemporary`, `ChangeTutorPermanent`, dan `GetSessionAttendees` (`internal/usecase/schedule_usecase.go:275,326,395,416,476`) tidak menerima tenant ID, dan handler-nya (`internal/delivery/http/handler/schedule_handler.go:151-168,210-227,269-286,328-345,386-398`) tidak menyelesaikan tenant. Mereka memuat sesi/jadwal lewat `GetByID` yang tidak di-scope, padahal `GetByIDForTenant` sudah tersedia (`internal/repository/session_repository.go:44`). Member tenant A dengan `schedule:update` dapat mengubah sesi tenant B atau membaca daftar attendee (data student) tenant B."
      goal: "Setiap operasi sesi dan jadwal hanya dapat menyentuh data milik tenant caller; ID milik tenant lain diperlakukan seperti tidak ada."
      requirements:
        - "Kelima use case menerima tenant dari claim JWT dan seluruh pemuatan sesi/jadwal/kelas terkait di-scope tenant."
        - "ID sesi atau jadwal milik tenant lain menghasilkan 404 tanpa perubahan data."
        - "Route alias body-param dan path-param yang ada tetap didukung."
        - "Permission middleware schedule:update yang ada tetap berjalan sebelum handler."
      acceptanceCriteria:
        - "Member tenant A tidak dapat mereschedule, mengubah permanen, mengganti tutor, atau membaca attendee sesi tenant B"
        - "Member tenant yang berwenang tetap dapat menjalankan kelima operasi pada sesinya sendiri melalui route alias maupun path"
        - "Kelima operasi memiliki test lintas tenant yang membuktikan 404 dan tidak ada perubahan data"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: mutasi dan kebocoran data lintas tenant terkonfirmasi di kode, termasuk PII student pada attendee. Gunakan pola repository scoped yang sudah ada; jangan mengandalkan pemeriksaan di handler saja. Pemuatan jadwal/kelas turunan di dalam use case juga harus memastikan kepemilikan tenant yang sama."
      relevantAreas:
        - "kelolakelas-academic-service/internal/usecase/schedule_usecase.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/schedule_handler.go"
        - "kelolakelas-academic-service/internal/repository/session_repository.go"
        - "kelolakelas-academic-service/internal/repository/schedule_repository.go"
      edgeCases:
        - "Request memakai session_id di body sekaligus id di path yang berbeda."
        - "Tutor pengganti berasal dari tenant lain."
        - "Jadwal target perubahan permanen milik kelas tenant lain."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test lintas tenant untuk kelima operasi membuktikan tidak ada baris yang berubah pada tenant lain"
      outOfScope:
        - "Penghapusan route alias."
        - "Validasi tutor terhadap membership identity."
        - "Permission attendance dan report."
  - draftKey: identity-scope-role-checks-to-tenant
    projectKey: tenant-isolation-and-authorization
    title: Evaluasi role dan permission hanya dalam tenant yang sama
    type: Improvement
    priority: High
    estimate: M
    complexity: high
    labels: [identity, academic, ai-ready]
    repositories: [identity, academic]
    blockedByDraftKeys: [identity-tenant-context-from-jwt-only]
    externalDependencies: []
    body:
      backgroundProblem: "`HasPermission` (`kelolakelas-identity-service/internal/repository/member_repository.go:78-82`) dan gRPC `CheckPermission` (`internal/delivery/grpc/permission_service.go:63-88`) memeriksa `role_id` secara global tanpa tenant, sehingga role tenant A memenuhi permission saat beroperasi pada tenant B. `CreateInvitation` (`internal/usecase/invitation_usecase.go:38-75`) tidak memvalidasi bahwa `role_id` undangan milik tenant tersebut atau system role, sehingga undangan dapat memberikan role tenant lain. Academic mengirim hanya `role_id` dan `permission` (`kelolakelas-academic-service/pkg/grpcclient/permission_client.go:31-40`)."
      goal: "Keputusan permission selalu terikat pada tenant yang sedang dioperasikan, dan role yang diberikan lewat undangan atau perubahan role selalu milik tenant tersebut atau system role."
      requirements:
        - "Pemeriksaan permission menerima tenant dan hanya lolos bila role milik tenant tersebut atau system role."
        - "Kontrak gRPC CheckPermission menerima tenant_id; academic mengirim tenant dari claim; identity menolak request tanpa tenant setelah masa transisi yang disepakati di ADR 0002."
        - "Invitation menolak role_id yang bukan milik tenant atau bukan system role dengan error validasi."
        - "Perilaku member role update yang sudah memvalidasi role tenant tetap terjaga."
      acceptanceCriteria:
        - "Undangan dengan role_id milik tenant lain ditolak tanpa undangan dibuat"
        - "Permission dengan role milik tenant lain ditolak pada jalur HTTP identity maupun gRPC"
        - "Mutasi katalog academic oleh member berwenang tetap berhasil setelah academic mengirim tenant_id"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: perubahan kontrak gRPC internal lintas dua service; deploy identity yang menerima tenant_id opsional harus mendahului academic, lalu identity mewajibkannya. Perbarui ADR 0002 dan dokumentasi security. Permission client academic memakai structpb tanpa proto; jaga kompatibilitas payload."
      relevantAreas:
        - "kelolakelas-identity-service/internal/repository/member_repository.go"
        - "kelolakelas-identity-service/internal/delivery/grpc/permission_service.go"
        - "kelolakelas-identity-service/internal/usecase/invitation_usecase.go"
        - "kelolakelas-academic-service/pkg/grpcclient/permission_client.go"
        - "kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go"
      edgeCases:
        - "System role (tenant_id NULL) dipakai pada tenant mana pun."
        - "Role dihapus setelah token diterbitkan."
        - "Academic versi lama memanggil identity versi baru tanpa tenant_id."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test kompatibilitas kontrak gRPC membuktikan urutan deploy identity lalu academic tidak memutus mutasi katalog"
      outOfScope:
        - "Caching hasil permission."
        - "mTLS gRPC."
        - "Redesign RBAC."
  - draftKey: academic-permission-students-enrollments
    projectKey: tenant-isolation-and-authorization
    title: Terapkan permission pada operasi student dan enrollment sisi tenant
    type: Improvement
    priority: High
    estimate: M
    complexity: medium
    labels: [academic, ai-ready]
    repositories: [academic]
    blockedByDraftKeys: [academic-tenant-context-from-jwt-only]
    externalDependencies: []
    body:
      backgroundProblem: "Route student (`cmd/server/main.go:118-122`) dan enrollment (`:132-136`) hanya memerlukan JWT. Permission `student:create|read|update|delete` dan `enrollment:create|read|update|delete` sudah di-seed di identity dan role Teacher tidak memilikinya, tetapi setiap member tenant dengan token dapat membaca dan memutasi student maupun enrollment tenant. Jalur parent pada route yang sama memakai ownership dan tidak memiliki role_id, sehingga pola middleware route-level yang dipakai KEL-10 tidak dapat diterapkan mentah-mentah."
      goal: "Operasi student dan enrollment yang dijalankan atas nama tenant hanya dapat dilakukan oleh role dengan permission terkait, sementara jalur parent yang berbasis ownership tetap tidak berubah."
      requirements:
        - "Caller non-parent memerlukan student:read untuk list/get, student:create, student:update, dan student:delete untuk mutasi student."
        - "Caller non-parent memerlukan enrollment:read untuk list/get enrollment dan enrollment:create untuk POST /tenants/:tenant_id/enrollments."
        - "Caller parent tetap memakai aturan ownership yang ada tanpa pemeriksaan permission."
        - "Denial menghasilkan 403 tanpa perubahan data; kegagalan identity menghasilkan 503 seperti mutasi katalog."
      acceptanceCriteria:
        - "Member dengan role Teacher menerima 403 saat membaca atau mengubah student dan enrollment tenant"
        - "Member Creator tetap dapat menjalankan seluruh operasi student dan enrollment tenantnya"
        - "Parent tetap dapat mengelola student miliknya dan membuat enrollment katalog tanpa role_id"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Permission middleware yang ada bekerja per route; di sini keputusan bergantung pada claim is_parent, sehingga diperlukan varian yang hanya memeriksa permission untuk caller non-parent atau pemeriksaan di use case. Ikuti ADR 0002 dan perbarui tabel pemetaan permission di dokumentasi."
      relevantAreas:
        - "kelolakelas-academic-service/cmd/server/main.go"
        - "kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_query_handler.go"
      edgeCases:
        - "Token parent yang juga memiliki membership tenant."
        - "Member tanpa role_id pada route tenant."
        - "Identity gRPC tidak tersedia saat parent mengakses route yang tidak memerlukan permission."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Permission attendance dan report."
        - "PATCH /enrollments/:id/schedule oleh tenant (saat ini parent-only)."
        - "UI permission-aware di web."
  - draftKey: academic-permission-attendance-reports
    projectKey: tenant-isolation-and-authorization
    title: Terapkan permission pada attendance dan report
    type: Improvement
    priority: Medium
    estimate: M
    complexity: medium
    labels: [academic, ai-ready]
    repositories: [academic]
    blockedByDraftKeys: [academic-tenant-context-from-jwt-only]
    externalDependencies: []
    body:
      backgroundProblem: "Route attendance (`cmd/server/main.go:123-126`) dan report (`:127-131`) hanya memerlukan JWT. Otorisasi bergantung pada pemeriksaan ad-hoc tutor yang ditugaskan (`internal/usecase/attendance_usecase.go:54-60,85-90`, `report_usecase.go:49-55`). Permission `attendance:create|read|update` dan `report:create|read|update|delete` sudah di-seed dan dimiliki role Teacher, tetapi tidak pernah dievaluasi."
      goal: "Operasi attendance dan report hanya dapat dilakukan oleh role dengan permission terkait, dengan aturan tutor yang ditugaskan tetap menjadi lapisan kedua."
      requirements:
        - "Pemetaan permission per route mengikuti nama permission yang di-seed."
        - "Aturan tutor yang ditugaskan tetap diberlakukan setelah permission lolos."
        - "Denial menghasilkan 403 tanpa perubahan data."
        - "Perilaku akses untuk caller non-tenant yang ada saat ini tidak berubah tanpa keputusan terpisah."
      acceptanceCriteria:
        - "Member tanpa permission attendance atau report menerima 403 pada operasi terkait"
        - "Teacher yang ditugaskan tetap dapat mencatat attendance dan membuat report sesinya"
        - "Tabel pemetaan permission di dokumentasi mencantumkan route attendance dan report"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Gunakan permission middleware yang ada; attendance tidak memiliki permission delete yang di-seed dan tidak ada route delete, jadi tidak perlu menambah permission baru. Perbarui ADR 0002 dan dokumentasi API academic."
      relevantAreas:
        - "kelolakelas-academic-service/cmd/server/main.go"
        - "kelolakelas-academic-service/internal/usecase/attendance_usecase.go"
        - "kelolakelas-academic-service/internal/usecase/report_usecase.go"
      edgeCases:
        - "Tutor dengan permission tetapi bukan tutor sesi tersebut."
        - "Role custom dengan report:read tanpa report:create."
        - "Identity tidak tersedia."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Akses parent ke attendance dan report anaknya."
        - "Student note."
        - "UI attendance dan report."
  - draftKey: identity-login-abuse-protection
    projectKey: tenant-isolation-and-authorization
    title: Lindungi login dari brute force dan enumerasi akun
    type: Improvement
    priority: Medium
    estimate: M
    complexity: medium
    labels: [identity, ai-ready]
    repositories: [identity]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Identity tidak memiliki pelacakan percobaan gagal, lockout, atau throttling per akun (pencarian repo-wide tidak menemukan apa pun). Satu-satunya pembatas adalah rate limit gateway 5 request per menit per IP yang fail-open saat Redis bermasalah dan, dengan `SetTrustedProxies(nil)`, menggabungkan semua klien di belakang load balancer ke satu IP. `Login` mengembalikan lebih cepat untuk email yang tidak terdaftar karena bcrypt tidak dijalankan (`internal/usecase/auth_usecase.go:63-74`), sehingga keberadaan akun dapat ditebak dari waktu respons."
      goal: "Percobaan login gagal berulang pada satu akun dibatasi secara sementara dan terobservasi, dan respons login tidak membedakan akun yang ada dari yang tidak ada."
      requirements:
        - "Percobaan gagal dicatat per akun; setelah ambang yang dapat dikonfigurasi, login akun tersebut ditolak sementara dengan respons yang sama seperti kredensial salah."
        - "Login berhasil mengatur ulang hitungan; lockout kedaluwarsa otomatis."
        - "Jalur email tidak terdaftar dan password salah memiliki biaya komputasi dan respons yang setara."
        - "Login valid, klaim JWT, dan penyimpanan cache permission tidak berubah."
      acceptanceCriteria:
        - "Setelah N kegagalan berturut-turut, login akun tersebut ditolak selama periode lockout meskipun password benar"
        - "Setelah periode lockout berakhir atau login berhasil, akun dapat login kembali"
        - "Respons dan waktu untuk email tidak terdaftar setara dengan password salah"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Redis bersifat opsional di identity; mekanisme pelacakan tidak boleh membuat login gagal ketika Redis tidak tersedia. Ambang dan durasi harus dapat dikonfigurasi dengan default yang aman dan didokumentasikan. Jangan mengungkap status lockout secara berbeda dari kredensial salah."
      relevantAreas:
        - "kelolakelas-identity-service/internal/usecase/auth_usecase.go"
        - "kelolakelas-identity-service/internal/delivery/http/handler/auth_handler.go"
        - "kelolakelas-identity-service/internal/config/config.go"
      edgeCases:
        - "Percobaan paralel pada akun yang sama."
        - "Email dengan perbedaan kapitalisasi."
        - "Restart service di tengah periode lockout."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "CAPTCHA, MFA, dan password reset."
        - "Kebijakan fail-closed rate limiter gateway."
        - "Notifikasi email lockout."
  - draftKey: billing-recover-stuck-invoice-claim
    projectKey: enrollment-payment-lifecycle
    title: Pulihkan transaksi yang tertahan di status creating saat pembuatan invoice gagal
    type: Improvement
    priority: High
    estimate: S
    complexity: medium
    labels: [billing, ai-ready]
    repositories: [billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`GenerateSubscriptionPayment` mengklaim transaksi ke status `creating` melalui `ClaimInvoice` (`internal/repository/transaction_repository.go:111-116`) lalu memanggil Duitku; jika `CreateInvoice` gagal, fungsi mengembalikan error tanpa memulihkan status (`internal/usecase/transaction_usecase.go:176-207`). `ClaimInvoice` hanya mencocokkan `pending` atau `failed`, sehingga setiap retry dengan idempotency key yang sama mengembalikan `invoice creation is already in progress` selamanya; parent tidak pernah mendapat checkout URL sementara enrollment pending tetap menahan kuota. Status `creating` juga tidak ada dalam whitelist filter list transaksi (`internal/delivery/http/handler/transaction_handler.go:42`)."
      goal: "Kegagalan sementara provider tidak pernah meninggalkan transaksi dalam status yang tidak dapat diklaim ulang, dan retry berikutnya berhasil menghasilkan invoice."
      requirements:
        - "Ketika pembuatan invoice gagal, transaksi dikembalikan ke status yang dapat diklaim secara atomik dan alasan kegagalan tercatat."
        - "Klaim yang ditinggalkan karena proses mati dapat diklaim ulang setelah batas waktu yang ditentukan."
        - "Klaim tetap eksklusif: dua request paralel menghasilkan tepat satu invoice."
        - "Filter status list transaksi mengenali seluruh status yang benar-benar ditulis kode."
      acceptanceCriteria:
        - "Setelah kegagalan provider yang disimulasikan, request berikutnya dengan enrollment yang sama berhasil membuat invoice"
        - "Dua request paralel untuk enrollment yang sama menghasilkan tepat satu invoice Duitku"
        - "Transaksi berstatus creating yang lebih tua dari batas waktu dapat diklaim ulang"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Pemulihan harus terjadi pada jalur error yang sama dan tidak boleh menimpa transaksi yang sudah memiliki checkout URL. Batas waktu klaim harus dapat dikonfigurasi. Perbarui dokumentasi flow billing."
      relevantAreas:
        - "kelolakelas-billing-service/internal/usecase/transaction_usecase.go"
        - "kelolakelas-billing-service/internal/repository/transaction_repository.go"
        - "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go"
      edgeCases:
        - "Provider berhasil membuat invoice tetapi respons hilang; klaim berikutnya membuat invoice kedua dengan merchant order ID yang sama."
        - "Update status setelah kegagalan juga gagal."
        - "Transaksi renewal yang dibuat subscription worker."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Kedaluwarsa transaksi pending."
        - "Perubahan payment method atau provider."
        - "Notifikasi ke parent."
  - draftKey: billing-expire-unpaid-transactions
    projectKey: enrollment-payment-lifecycle
    title: Kedaluwarsakan transaksi yang tidak dibayar dan tangani result code callback secara eksplisit
    type: Feature
    priority: High
    estimate: M
    complexity: high
    labels: [billing, ai-ready]
    repositories: [billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Invoice Duitku dibuat dengan `ExpiryPeriod: 0` yang berarti 1440 menit (`pkg/duitku/client.go:61-63`), tetapi billing tidak menyimpan waktu kedaluwarsa dan tidak pernah menulis status `expired`; status itu hanya dibaca oleh subscription worker untuk renewal (`internal/usecase/subscription_worker.go:100-101`). Callback dengan result code selain `00`, `01`, `02` mengembalikan sukses tanpa perubahan atau log (`internal/usecase/transaction_usecase.go:474-486`). Akibatnya transaksi pending yang tidak dibayar hidup selamanya dan enrollment terkait menahan kuota."
      goal: "Setiap transaksi pending mencapai status final kedaluwarsa setelah invoice tidak lagi dapat dibayar, dan setiap callback yang tidak dikenali tercatat dan tidak diabaikan diam-diam."
      requirements:
        - "Transaksi menyimpan waktu kedaluwarsa invoice; job periodik menandai pending yang lewat waktu sebagai expired secara idempotent."
        - "Transaksi expired dapat dibuatkan invoice baru melalui alur idempotent yang ada ketika enrollment masih valid."
        - "Callback paid untuk transaksi yang sudah expired tetap diterima, ditandai paid, dan direkonsiliasi seperti biasa."
        - "Result code yang tidak dikenali dicatat dengan log terstruktur dan tidak mengubah status."
      acceptanceCriteria:
        - "Transaksi pending yang melewati waktu kedaluwarsa berubah menjadi expired dan terlihat pada list/detail transaksi parent"
        - "Callback paid setelah expired menghasilkan status paid dan rekonsiliasi aktivasi"
        - "Callback dengan result code tidak dikenal menghasilkan log dan tidak mengubah transaksi"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: kebenaran finansial; pembayaran sah yang callback-nya terlambat tidak boleh hilang karena kedaluwarsa lokal, dan renewal subscription worker sudah memakai status expired. Keputusan apakah callback tak dikenal menjawab sukses ke provider harus didokumentasikan berdasarkan `_docs/duitku/api.md`. Perbarui dokumentasi flow callback dan billing."
      relevantAreas:
        - "kelolakelas-billing-service/internal/usecase/transaction_usecase.go"
        - "kelolakelas-billing-service/internal/usecase/subscription_worker.go"
        - "kelolakelas-billing-service/migrations"
        - "kelolakelas-billing-service/internal/domain/transaction.go"
      edgeCases:
        - "Callback paid tiba beberapa detik setelah job menandai expired."
        - "Transaksi renewal dengan masa kedaluwarsa berbeda."
        - "Beberapa replika billing menjalankan job kedaluwarsa bersamaan."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test membuktikan callback paid setelah expired tetap menghasilkan paid dan rekonsiliasi tanpa transaksi ganda"
      outOfScope:
        - "Pelepasan kuota di academic."
        - "Email pemberitahuan kedaluwarsa."
        - "Pembatalan oleh parent."
  - draftKey: academic-release-seat-on-payment-failure
    projectKey: enrollment-payment-lifecycle
    title: Lepaskan kuota enrollment ketika pembayaran gagal atau kedaluwarsa
    type: Feature
    priority: High
    estimate: M
    complexity: high
    labels: [academic, billing, ai-ready]
    repositories: [academic, billing]
    blockedByDraftKeys: [billing-expire-unpaid-transactions]
    externalDependencies: []
    body:
      backgroundProblem: "Enrollment `pending` dihitung terhadap kapasitas jadwal (`internal/repository/enrollment_repository.go:54`, `catalog_repository.go:73`) tanpa batas waktu. Status `dropped` dan `completed` didefinisikan (`internal/domain/enrollment.go:27`) tetapi tidak ada kode yang menulisnya. Billing hanya memiliki jalur aktivasi (`pkg/academic/client.go:39-52`) dan tidak memberi tahu academic ketika transaksi gagal atau kedaluwarsa, sehingga kursi tetap terkunci untuk pembeli lain."
      goal: "Kuota jadwal selalu mencerminkan enrollment yang aktif atau masih dapat dibayar; enrollment yang pembayarannya gagal atau kedaluwarsa dilepaskan secara durable dan idempotent."
      requirements:
        - "Academic menyediakan endpoint internal untuk mentransisikan enrollment pending menjadi dropped secara idempotent."
        - "Billing memberi tahu academic saat transaksi menjadi failed atau expired melalui mekanisme durable dengan retry, mengikuti pola ADR 0001."
        - "Kapasitas yang dilepaskan langsung terlihat pada public catalog dan pemeriksaan kapasitas enrollment."
        - "Callback paid untuk enrollment yang sudah dropped menghasilkan kegagalan aktivasi yang terobservasi, bukan aktivasi diam-diam."
      acceptanceCriteria:
        - "Setelah transaksi expired atau failed, enrollment terkait menjadi dropped dan kursinya tersedia kembali di katalog"
        - "Retry pemberitahuan tidak menghasilkan transisi ganda atau error"
        - "Aktivasi enrollment yang sudah dropped menghasilkan 409 dan tercatat pada rekonsiliasi"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Risiko utama: konsistensi kuota dan finansial lintas dua database; pembayaran yang tiba setelah pelepasan kursi memerlukan tindak lanjut operator dan harus terlihat. Reuse `payment_reconciliations` dengan jenis pekerjaan tambahan atau tabel setara; keputusan dicatat sebagai pembaruan ADR 0001. Enrollment dropped tidak boleh memblokir enrollment baru untuk student dan kelas yang sama (indeks unik parsial hanya mencakup pending/active)."
      relevantAreas:
        - "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go"
        - "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go"
        - "kelolakelas-billing-service/internal/usecase/reconciliation_worker.go"
        - "kelolakelas-billing-service/pkg/academic/client.go"
      edgeCases:
        - "Parent membuat invoice baru untuk enrollment yang sama tepat sebelum pelepasan."
        - "Academic tidak tersedia lebih lama dari batas retry."
        - "Transaksi failed lalu paid pada callback berikutnya."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
        - "Test membuktikan kursi yang dilepaskan dapat dipakai enrollment baru dan callback paid setelah dropped tercatat sebagai kegagalan yang terlihat"
      outOfScope:
        - "Refund otomatis."
        - "Pembatalan oleh parent."
        - "Notifikasi email."
  - draftKey: cancel-pending-enrollment-backend
    projectKey: enrollment-payment-lifecycle
    title: Sediakan pembatalan enrollment pending oleh parent
    type: Feature
    priority: Medium
    estimate: M
    complexity: medium
    labels: [academic, billing, api-gateway, ai-ready]
    repositories: [academic, billing, api-gateway]
    blockedByDraftKeys: [academic-release-seat-on-payment-failure]
    externalDependencies: []
    body:
      backgroundProblem: "Tidak ada jalur pembatalan enrollment di academic maupun billing; `enrollmentRepo.Delete` tidak dipakai handler mana pun dan status `cancelled` hanya ada di whitelist filter billing tanpa pernah ditulis. Parent yang berubah pikiran sebelum membayar tetap menahan kursi sampai invoice kedaluwarsa."
      goal: "Parent dapat membatalkan enrollment miliknya yang masih pending sehingga kursi dilepaskan dan transaksi terkait ditandai dibatalkan."
      requirements:
        - "Endpoint academic parent-scoped membatalkan enrollment pending milik parent menjadi dropped; enrollment aktif atau milik parent lain ditolak."
        - "Billing menandai transaksi pending terkait sebagai cancelled melalui jalur internal yang idempotent."
        - "Gateway mendaftarkan route baru pada grup protected dengan test routing."
        - "Callback paid setelah pembatalan diperlakukan seperti pada pelepasan kursi: tercatat dan terlihat, tidak mengaktifkan enrollment."
      acceptanceCriteria:
        - "Parent dapat membatalkan enrollment pending miliknya dan kursinya kembali tersedia"
        - "Enrollment aktif, milik parent lain, atau sudah dropped menghasilkan 409 atau 404 sesuai kasus"
        - "Transaksi terkait berstatus cancelled pada list transaksi parent"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Tidak ditemukan bukti API Duitku untuk membatalkan invoice di `_docs/duitku`; invoice tetap dapat dibayar di sisi provider sampai kedaluwarsa, sehingga edge case bayar-setelah-batal wajib dicatat. Urutan penulisan academic lalu billing harus didefinisikan agar retry aman."
      relevantAreas:
        - "kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go"
        - "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go"
        - "kelolakelas-billing-service/internal/usecase/transaction_usecase.go"
        - "kelolakelas-api-gateway/internal/delivery/http/router.go"
      edgeCases:
        - "Pembatalan bersamaan dengan callback paid."
        - "Enrollment pending tanpa transaksi karena invoice gagal dibuat."
        - "Parent membatalkan lalu mendaftar ulang kelas dan jadwal yang sama."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Pembatalan enrollment aktif dan refund."
        - "UI web pembatalan."
        - "Pembatalan invoice di sisi provider."
  - draftKey: billing-payment-outcome-emails
    projectKey: enrollment-payment-lifecycle
    title: Kirim email konfirmasi pembayaran berhasil dan gagal kepada parent
    type: Feature
    priority: Medium
    estimate: M
    complexity: medium
    labels: [billing, ai-ready]
    repositories: [billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Billing hanya mengirim dua email dari subscription worker: tautan pembayaran dan pengingat (`internal/usecase/subscription_worker.go:238,254`). Tidak ada email saat pembayaran berhasil atau gagal, sehingga parent hanya tahu hasilnya dengan membuka halaman status. Klien Resend memakai `http.Client{}` tanpa timeout (`pkg/email/resend.go:97,109-119`). Alamat email berasal dari `sender_email` request internal yang tidak divalidasi dan disimpan pada subscription sebagai `billing_email` nullable."
      goal: "Parent menerima tepat satu email untuk setiap pembayaran yang berhasil dan setiap pembayaran yang gagal, tanpa memengaruhi keberhasilan pemrosesan callback."
      requirements:
        - "Setelah callback paid di-commit, kirim email tanda terima berisi kelas, nominal, dan ID transaksi; setelah failed, kirim pemberitahuan dengan cara melanjutkan pembayaran."
        - "Pengiriman idempotent terhadap replay callback dan retry worker."
        - "Kegagalan pengiriman dicatat dan tidak menggagalkan callback; email dilewati bila alamat tidak tersedia."
        - "Klien Resend memiliki timeout; email yang ada tetap terkirim seperti sekarang."
      acceptanceCriteria:
        - "Callback paid menghasilkan satu email tanda terima meskipun callback diulang"
        - "Callback failed menghasilkan satu email pemberitahuan"
        - "Kegagalan Resend tidak mengubah status transaksi atau respons callback"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Alamat email harus berasal dari data yang sudah disimpan billing; jangan memanggil identity. Penanda pengiriman perlu disimpan pada transaksi agar idempotent. Template mengikuti gaya HTML Bahasa Indonesia yang ada dengan escaping. Perbarui dokumentasi flow callback."
      relevantAreas:
        - "kelolakelas-billing-service/internal/usecase/transaction_usecase.go"
        - "kelolakelas-billing-service/pkg/email/resend.go"
        - "kelolakelas-billing-service/migrations"
      edgeCases:
        - "billing_email kosong pada subscription lama."
        - "Resend timeout setelah email sebenarnya terkirim."
        - "Transaksi sandbox."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Email kedaluwarsa dan pembatalan."
        - "Notifikasi ke tenant."
        - "Template i18n atau SMS."
  - draftKey: billing-reconciliation-observability-and-retry
    projectKey: enrollment-payment-lifecycle
    title: Jadikan rekonsiliasi terminal_failed dapat ditemukan dan diulang
    type: Improvement
    priority: Medium
    estimate: S
    complexity: medium
    labels: [billing, ai-ready]
    repositories: [billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Setelah `PAYMENT_RECONCILIATION_MAX_ATTEMPTS` tercapai, baris menjadi `terminal_failed` dan tidak ada kode yang membacanya kembali; `RunOnce` menelan seluruh error repository (`internal/usecase/reconciliation_worker.go:56-70`) dan tidak ada satu pun log di handler, use case, atau worker billing. Satu-satunya jalur pemulihan adalah replay callback dari provider, dan satu-satunya visibilitas adalah field rekonsiliasi pada respons transaksi parent."
      goal: "Operator dapat melihat rekonsiliasi yang gagal permanen dan mengulanginya tanpa bergantung pada provider, dan setiap transisi rekonsiliasi terekam di log."
      requirements:
        - "Setiap transisi rekonsiliasi dan error worker menghasilkan log terstruktur dengan ID transaksi dan enrollment, tanpa kredensial."
        - "Endpoint internal berkredensial mengembalikan daftar rekonsiliasi per status."
        - "Endpoint internal berkredensial mengantrekan ulang baris terminal_failed secara idempotent."
        - "Respons transaksi parent dan perilaku worker yang ada tetap sama."
      acceptanceCriteria:
        - "Baris terminal_failed dapat dilihat melalui endpoint internal dan diulang sampai aktif"
        - "Mengulang baris yang sudah aktif tidak mengubah apa pun"
        - "Log mencatat setiap transisi pending, processing, active, dan terminal_failed"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Gunakan middleware kredensial internal yang ada; tidak ada persona platform admin sehingga endpoint ini bukan untuk browser. Redaksi error tetap seperti sekarang. Perbarui dokumentasi operasi dan ADR 0001."
      relevantAreas:
        - "kelolakelas-billing-service/internal/usecase/reconciliation_worker.go"
        - "kelolakelas-billing-service/internal/repository/payment_reconciliation_repository.go"
        - "kelolakelas-billing-service/cmd/server/main.go"
      edgeCases:
        - "Re-queue saat worker sedang memegang lease baris tersebut."
        - "Enrollment sudah dihapus di academic."
        - "Kredensial internal salah."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "UI admin."
        - "Alerting."
        - "Rekonsiliasi renewal."
  - draftKey: academic-class-update-endpoint
    projectKey: tenant-selling-operations
    title: Sediakan endpoint pembaruan kelas untuk tenant
    type: Feature
    priority: High
    estimate: M
    complexity: medium
    labels: [academic, api-gateway, ai-ready]
    repositories: [academic, api-gateway]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Route kelas hanya mencakup list, create, create-with-category, delete, dan toggle publikasi (`kelolakelas-academic-service/cmd/server/main.go:112-116`; gateway `router.go:87-91`). Tidak ada cara memperbarui nama, deskripsi, harga, tipe, atau kategori; tenant harus menghapus dan membuat ulang kelas, yang memutus enrollment dan jadwal yang sudah ada. Permission `class:update` sudah di-seed dan dipakai untuk publikasi."
      goal: "Tenant dapat memperbaiki informasi jual kelas yang sudah ada tanpa memengaruhi enrollment dan jadwal yang berjalan."
      requirements:
        - "Endpoint update kelas tenant-scoped dengan permission class:update untuk nama, deskripsi, harga, dan kategori milik tenant yang sama."
        - "Enrollment yang sudah ada mempertahankan gross_amount yang tersimpan; harga baru hanya berlaku untuk enrollment berikutnya."
        - "Gateway mendaftarkan route pada grup protected dengan test routing; Swagger dan dokumentasi API diperbarui."
        - "Perilaku create, delete, publikasi, dan public catalog tetap sama."
      acceptanceCriteria:
        - "Member berwenang dapat mengubah nama, deskripsi, harga, dan kategori kelas dan perubahannya terlihat di catalog publik"
        - "Kelas atau kategori milik tenant lain menghasilkan 404 atau 422 tanpa perubahan"
        - "Enrollment yang ada tidak berubah nominalnya setelah harga diperbarui"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Perubahan tipe kelas (group/private) memengaruhi kewajiban jadwal dan kapasitas; putuskan apakah tipe dapat diubah ketika jadwal atau enrollment sudah ada dan dokumentasikan. Validasi mengikuti DTO create yang ada."
      relevantAreas:
        - "kelolakelas-academic-service/internal/delivery/http/handler/class_handler.go"
        - "kelolakelas-academic-service/internal/usecase"
        - "kelolakelas-academic-service/internal/repository/class_repository.go"
        - "kelolakelas-api-gateway/internal/delivery/http/router.go"
      edgeCases:
        - "Harga diubah menjadi 0 atau negatif."
        - "Kategori dihapus (soft delete) saat dipilih."
        - "Kelas sedang dipublikasikan dan memiliki enrollment pending."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "UI web edit kelas."
        - "Riwayat harga dan diskon."
        - "Pembaruan jadwal (sudah ada endpoint terpisah)."
  - draftKey: web-tenant-class-publication
    projectKey: tenant-selling-operations
    title: Sediakan kontrol publikasi kelas di dashboard tenant
    type: Feature
    priority: Urgent
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Halaman `app/(dashboard)/dashboard/tenant/classes` hanya menampilkan daftar kelas dan wizard pembuatan; pencarian kata `published` di direktori tersebut tidak menemukan kontrol apa pun. Endpoint `PATCH /api/v1/classes/:id/published` sudah tersedia di academic dan gateway dengan permission `class:update`. Tanpa kontrol ini tenant tidak dapat membuat kelasnya muncul di katalog publik dari web."
      goal: "Tenant dapat memublikasikan dan menarik publikasi kelas dari dashboard dan langsung melihat statusnya."
      requirements:
        - "Daftar kelas menampilkan status publikasi dan enrollment_status setiap kelas."
        - "Aksi publish/unpublish memanggil endpoint publikasi melalui Server Action dengan session cookie dan me-revalidate daftar."
        - "State loading, sukses, 403 tanpa permission, dan error API ditampilkan dengan jelas."
        - "Wizard pembuatan kelas dan daftar yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Tenant dapat memublikasikan kelas dan kelas tersebut muncul di /kelas"
        - "Tenant dapat menarik publikasi dan kelas hilang dari /kelas"
        - "Member tanpa class:update melihat pesan forbidden tanpa perubahan"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Ikuti pola Server Action dan query tenant yang ada; baca panduan Next.js 16 di node_modules sebelum coding sesuai AGENTS.md web. Jangan mengirim tenant ID dari browser sebagai sumber otorisasi."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes"
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts"
      edgeCases:
        - "Kelas tanpa jadwal dipublikasikan (backend mungkin menolak; tampilkan pesan backend)."
        - "Double click pada tombol publikasi."
        - "Sesi kedaluwarsa saat aksi dijalankan."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Edit kelas."
        - "Pengaturan enrollment_status manual."
        - "Preview kelas."
  - draftKey: web-tenant-class-edit
    projectKey: tenant-selling-operations
    title: Sediakan edit kelas di dashboard tenant
    type: Feature
    priority: High
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: [academic-class-update-endpoint]
    externalDependencies: []
    body:
      backgroundProblem: "Daftar kelas tenant bersifat read-only selain pembuatan; tidak ada form edit karena endpoint update belum ada. Setelah endpoint update tersedia, tenant memerlukan UI untuk memperbaiki nama, deskripsi, harga, dan kategori."
      goal: "Tenant dapat memperbarui informasi jual kelas dari dashboard dengan validasi yang sama seperti pembuatan."
      requirements:
        - "Form edit memakai field dan validasi yang sama dengan wizard pembuatan untuk field yang dapat diubah."
        - "Aksi memanggil endpoint update melalui Server Action dan me-revalidate daftar."
        - "State loading, validasi, forbidden, not-found, dan error API ditampilkan."
        - "Pembuatan dan publikasi kelas yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Tenant dapat mengubah nama, deskripsi, harga, dan kategori kelas dan melihat hasilnya di daftar"
        - "Input tidak valid ditolak dengan pesan per field"
        - "Member tanpa permission melihat pesan forbidden"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Ikuti pola Server Action tenant yang ada. Kontrak field mengikuti endpoint update yang dibuat pada issue backend."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes"
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts"
      edgeCases:
        - "Kelas dihapus oleh member lain saat form terbuka."
        - "Kategori baru dibuat saat form terbuka."
        - "Harga dengan pemisah ribuan."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Edit jadwal."
        - "Hapus kelas dari UI."
        - "Upload gambar kelas."
  - draftKey: web-tenant-enrollment-and-payment-overview
    projectKey: tenant-selling-operations
    title: Tampilkan enrollment dan status pembayaran kepada tenant
    type: Feature
    priority: High
    estimate: M
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Dashboard tenant tidak memiliki tampilan enrollment, pendaftar, atau pembayaran. Backend sudah menyediakan `GET /api/v1/enrollments` dan `GET /api/v1/enrollments/:id` tenant-scoped dengan filter status, serta `GET /api/v1/billing/transactions` tenant-scoped dengan filter status, student, enrollment, dan tanggal. Halaman parent `/dashboard/parent/enrollments` sudah menggabungkan kedua sumber dan dapat menjadi pola."
      goal: "Tenant dapat melihat siapa yang mendaftar ke kelasnya, jadwal yang dipilih, dan status pembayaran terkini tanpa akses API langsung."
      requirements:
        - "Halaman enrollment tenant menampilkan student, kelas, jadwal, status enrollment, dan status pembayaran termasuk state rekonsiliasi."
        - "Filter status dan pagination mengikuti query backend yang ada."
        - "State loading, empty, forbidden, dan error API ditampilkan."
        - "Data tenant lain tidak pernah ditampilkan; otorisasi tetap di backend."
      acceptanceCriteria:
        - "Tenant melihat daftar enrollment kelasnya beserta status pembayaran yang sesuai dengan backend"
        - "Filter status mengubah hasil sesuai backend"
        - "Member tanpa akses melihat state forbidden tanpa error teknis"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Reuse presentasi status dari `lib/payment-status.ts`. Setelah permission enrollment:read diberlakukan di academic, halaman ini harus menampilkan state forbidden dengan benar. Tambahkan item navigasi pada sidebar dan mobile nav tenant."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant"
        - "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_queries/queries.ts"
        - "kelolakelas-web/lib/payment-status.ts"
      edgeCases:
        - "Enrollment tanpa transaksi karena invoice gagal dibuat."
        - "Transaksi paid dengan rekonsiliasi terminal_failed."
        - "Jumlah enrollment melebihi satu halaman."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Laporan penjualan agregat dan ekspor."
        - "Aksi tenant terhadap enrollment (aktivasi manual, pembatalan)."
        - "Detail student di luar yang dikembalikan API enrollment."
  - draftKey: web-tenant-settings-page
    projectKey: tenant-selling-operations
    title: Hadirkan halaman pengaturan profil dan lokasi tenant
    type: Feature
    priority: Medium
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`app/(dashboard)/dashboard/tenant/settings/page.tsx:23-30` hanya berisi teks placeholder. Identity sudah menyediakan `GET/PATCH /api/v1/tenant/settings` (name, phone, address, about) dan `GET/PUT /api/v1/tenant/settings/location` (address, latitude/longitude opsional, google_place_id) dengan permission `tenant:update`. Lokasi memengaruhi pencarian katalog berbasis radius."
      goal: "Tenant dapat melengkapi profil dan lokasi yang ditampilkan di katalog publik dari dashboard."
      requirements:
        - "Form profil memakai field DTO identity saat ini dengan validasi setara."
        - "Form lokasi mendukung alamat saja (geocode di backend) atau alamat dengan koordinat berpasangan."
        - "State loading, sukses, validasi, forbidden, dan error API ditampilkan."
        - "Navigasi dan halaman tenant lain tetap berfungsi."
      acceptanceCriteria:
        - "Tenant dapat memperbarui nama, telepon, alamat, dan about dan melihat nilainya setelah reload"
        - "Tenant dapat memperbarui lokasi dan hasil geocode atau koordinat tersimpan ditampilkan"
        - "Member tanpa tenant:update melihat form read-only atau pesan forbidden"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Field `about` bertipe JSON di backend; batasi UI pada bentuk yang sudah ditulis oleh registrasi atau perlakukan sebagai teks terstruktur sederhana yang disepakati. Geocoding backend bersifat opsional dan dapat gagal; tampilkan pesan backend."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings"
        - "kelolakelas-identity-service/internal/domain/tenant.go"
      edgeCases:
        - "Latitude diisi tanpa longitude."
        - "Geocoding dinonaktifkan di backend."
        - "Nama tenant bentrok dengan tenant lain."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Upload logo."
        - "Peta interaktif."
        - "Pengaturan pembayaran atau rekening."
  - draftKey: web-invitation-acceptance
    projectKey: tenant-selling-operations
    title: Sediakan halaman penerimaan undangan anggota tenant
    type: Feature
    priority: High
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Email undangan identity menautkan ke `{APP_URL}/invitations/verify?token=...` (`kelolakelas-identity-service/pkg/email/resend.go:37-88`), tetapi web tidak memiliki route tersebut. Endpoint publik `GET /api/v1/invitations/verify` dan `POST /api/v1/invitations/register` sudah diproksikan gateway (`router.go:51-52`). Staf yang diundang dari halaman members tidak dapat menyelesaikan pendaftaran."
      goal: "Anggota yang diundang dapat membuka tautan email, melihat tenant dan role yang ditawarkan, dan menyelesaikan pendaftaran dari web."
      requirements:
        - "Route web memverifikasi token melalui gateway dan menampilkan nama tenant serta role."
        - "Form pendaftaran mengikuti payload invited-user identity dan setelah sukses mengarahkan ke login."
        - "Token tidak valid, kedaluwarsa, atau sudah dipakai ditampilkan sebagai state yang jelas."
        - "Alur undangan dari halaman members tetap berfungsi."
      acceptanceCriteria:
        - "Pengguna dengan token valid dapat mendaftar dan kemudian login sebagai member tenant dengan role undangan"
        - "Token kedaluwarsa atau sudah dipakai menampilkan pesan yang tepat tanpa form"
        - "Halaman dapat diakses tanpa sesi dan tidak dialihkan oleh proxy"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Respons verify saat ini mengembalikan token dan role_id; jangan menampilkan token di UI. Pastikan matcher proxy tidak memperlakukan route ini sebagai protected."
      relevantAreas:
        - "kelolakelas-web/app/(auth)"
        - "kelolakelas-web/proxy.ts"
        - "kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go"
      edgeCases:
        - "Email undangan sudah terdaftar sebagai user."
        - "Pengguna sudah login sebagai akun lain saat membuka tautan."
        - "Token dipakai dua kali secara bersamaan."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Kirim ulang atau cabut undangan."
        - "Daftar undangan tertunda."
        - "Perubahan kontrak identity."
  - draftKey: identity-invitation-delivery-status
    projectKey: tenant-selling-operations
    title: Laporkan kegagalan pengiriman email undangan
    type: Improvement
    priority: Medium
    estimate: S
    complexity: low
    labels: [identity, ai-ready]
    repositories: [identity]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`CreateInvitation` membuang error pengiriman email (`internal/usecase/invitation_usecase.go:78`) sementara handler selalu menjawab bahwa email terkirim (`internal/delivery/http/handler/invitation_handler.go:113`). Klien Resend identity tidak memiliki timeout. Tenant tidak dapat mengetahui bahwa undangan tidak pernah sampai."
      goal: "Tenant mengetahui secara akurat apakah email undangan terkirim, dan kegagalan pengiriman terekam."
      requirements:
        - "Respons pembuatan undangan menyatakan status pengiriman email secara eksplisit; undangan tetap tersimpan meskipun pengiriman gagal."
        - "Kegagalan pengiriman dicatat dengan log terstruktur tanpa token."
        - "Klien Resend memiliki timeout."
        - "Web menampilkan pesan pengiriman sesuai respons tanpa perubahan kontrak lain."
      acceptanceCriteria:
        - "Ketika Resend gagal, respons menyatakan undangan dibuat tetapi email tidak terkirim"
        - "Ketika Resend berhasil, respons menyatakan email terkirim"
        - "Log mencatat kegagalan pengiriman dengan ID undangan"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Pertahankan kode status 201 untuk undangan yang tersimpan; bedakan status pengiriman pada body. Web members page memakai respons ini; sesuaikan pesan bila field baru ditambahkan dan dokumentasikan di API identity."
      relevantAreas:
        - "kelolakelas-identity-service/internal/usecase/invitation_usecase.go"
        - "kelolakelas-identity-service/internal/delivery/http/handler/invitation_handler.go"
        - "kelolakelas-identity-service/pkg/email/resend.go"
      edgeCases:
        - "RESEND_API_KEY kosong (pengiriman dilewati)."
        - "Resend timeout setelah email terkirim."
        - "Alamat email tidak valid menurut Resend."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Endpoint kirim ulang undangan."
        - "Webhook status pengiriman Resend."
        - "Perubahan template email."
  - draftKey: gateway-proxy-resilience
    projectKey: platform-operability
    title: Terapkan timeout, batas body, dan error envelope pada proxy gateway
    type: Improvement
    priority: High
    estimate: S
    complexity: medium
    labels: [api-gateway, ai-ready]
    repositories: [api-gateway]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Reverse proxy dibuat tanpa transport kustom, tanpa timeout header/response, tanpa `ErrorHandler`, dan server dijalankan dengan `r.Run` tanpa read/write/idle timeout (`internal/delivery/http/handler/proxy_handler.go`, `cmd/server/main.go:50`). Tidak ada batas ukuran body. Downstream yang mati menghasilkan 502 teks polos dari stdlib yang tidak mengikuti envelope `{status,message,data}`."
      goal: "Gateway tetap responsif ketika downstream lambat atau mati, membatasi request berukuran tidak wajar, dan selalu menjawab dengan envelope JSON yang konsisten."
      requirements:
        - "Timeout upstream dan server dapat dikonfigurasi dengan default yang didokumentasikan."
        - "Batas ukuran body request yang dapat dikonfigurasi menghasilkan 413 dengan envelope JSON."
        - "Kegagalan atau timeout downstream menghasilkan 502 atau 504 dengan envelope JSON tanpa detail internal."
        - "Health, Swagger, webhook Duitku, dan seluruh route yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Downstream yang tidak merespons menghasilkan 504 JSON dalam batas waktu yang dikonfigurasi"
        - "Downstream yang mati menghasilkan 502 JSON dengan envelope standar"
        - "Body melebihi batas menghasilkan 413 JSON sebelum diteruskan"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Batas body harus lebih besar dari payload callback Duitku dan form registrasi. Timeout tidak boleh memutus request yang secara sah memerlukan waktu, misalnya geocoding lokasi tenant. Perbarui dokumentasi konfigurasi dan environment."
      relevantAreas:
        - "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go"
        - "kelolakelas-api-gateway/cmd/server/main.go"
        - "kelolakelas-api-gateway/internal/config/config.go"
      edgeCases:
        - "Downstream menutup koneksi setelah header terkirim."
        - "Request OPTIONS preflight."
        - "Upload multipart di masa depan (tidak ada saat ini)."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Retry atau circuit breaker."
        - "Kebijakan fail-closed rate limiter."
        - "Graceful shutdown service downstream."
  - draftKey: gateway-request-id-and-access-log
    projectKey: platform-operability
    title: Tambahkan request ID dan access log terstruktur di gateway
    type: Improvement
    priority: Medium
    estimate: S
    complexity: low
    labels: [api-gateway, ai-ready]
    repositories: [api-gateway]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Gateway hanya mencatat satu `slog.Info` per request berisi method dan path (`proxy_handler.go:47,63,85,108`) tanpa status, latensi, atau ID korelasi; `gin.Logger()` tidak terdaftar dan tidak ada penanganan `X-Request-ID` di repo mana pun. Kegagalan lintas service tidak dapat ditelusuri."
      goal: "Setiap request yang melewati gateway memiliki request ID yang diteruskan ke downstream dan dikembalikan ke klien, serta satu baris access log terstruktur."
      requirements:
        - "Request ID diambil dari header masuk bila valid (panjang dan karakter dibatasi) atau dibuat baru, diteruskan ke downstream, dan dikembalikan pada respons."
        - "Access log JSON mencatat request ID, method, path, status, latensi, dan IP klien tanpa header Authorization atau body."
        - "Log proxy per service yang ada digantikan atau diperkaya, bukan digandakan."
        - "Perilaku routing, CORS, dan rate limiting tidak berubah."
      acceptanceCriteria:
        - "Respons setiap request membawa header request ID"
        - "Downstream menerima header request ID yang sama"
        - "Setiap request menghasilkan tepat satu baris access log dengan field yang ditentukan"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "IP klien mengikuti `SetTrustedProxies(nil)` yang ada; jangan mengubah kebijakan trusted proxy di issue ini. Jangan mencatat query string yang dapat berisi token undangan tanpa redaksi."
      relevantAreas:
        - "kelolakelas-api-gateway/internal/delivery/http/router.go"
        - "kelolakelas-api-gateway/internal/delivery/http/middleware"
        - "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go"
      edgeCases:
        - "Header request ID masuk berisi karakter tidak valid atau terlalu panjang."
        - "Request ditolak oleh CORS atau rate limiter sebelum proxy."
        - "Route Swagger dan health."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Logging di service downstream."
        - "Tracing terdistribusi dan metrics."
        - "Agregasi log."
  - draftKey: services-request-logging-with-correlation
    projectKey: platform-operability
    title: Catat request dan event domain dengan request ID di identity, academic, dan billing
    type: Improvement
    priority: Medium
    estimate: M
    complexity: low
    labels: [identity, academic, billing, ai-ready]
    repositories: [identity, academic, billing]
    blockedByDraftKeys: [gateway-request-id-and-access-log]
    externalDependencies: []
    body:
      backgroundProblem: "Ketiga service memakai `slog` JSON hanya untuk event startup; tidak ada access log dan hampir tidak ada log di handler atau use case (billing hanya delapan baris log, semuanya di startup; academic tiga baris di repository student). Penolakan webhook, permission 503, dan kegagalan internal tidak meninggalkan jejak."
      goal: "Setiap request di ketiga service menghasilkan access log dengan request ID yang sama seperti gateway, dan event domain penting tercatat dengan konteks yang cukup untuk diagnosis."
      requirements:
        - "Middleware access log di setiap service mencatat request ID dari header (atau membuatnya), method, path, status, dan latensi."
        - "Event penting dicatat dengan request ID: penolakan signature webhook, kegagalan panggilan internal atau gRPC, permission denied 403/503, dan error 5xx."
        - "Log tidak memuat token, kredensial internal, password, atau PII di luar ID."
        - "Perilaku bisnis tidak berubah."
      acceptanceCriteria:
        - "Request yang sama dapat ditelusuri dari log gateway ke log service melalui request ID"
        - "Webhook dengan signature salah menghasilkan log peringatan dengan request ID"
        - "Tidak ada nilai Authorization atau kredensial di log"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Gunakan `slog` yang sudah dipasang; hindari dependency baru. Endpoint internal juga harus mencatat request ID untuk korelasi billing-academic. Perbarui dokumentasi operasi."
      relevantAreas:
        - "kelolakelas-identity-service/cmd/server/main.go"
        - "kelolakelas-academic-service/cmd/server/main.go"
        - "kelolakelas-billing-service/cmd/server/main.go"
        - "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go"
      edgeCases:
        - "Request tanpa header request ID (akses langsung tanpa gateway)."
        - "Panggilan worker tanpa request HTTP."
        - "Log volume tinggi pada katalog publik."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Metrics dan tracing."
        - "Log rekonsiliasi rinci (issue billing terpisah)."
        - "Perubahan level log runtime."
  - draftKey: readiness-health-checks
    projectKey: platform-operability
    title: Sediakan readiness check dengan probe dependency di gateway dan ketiga service
    type: Improvement
    priority: Medium
    estimate: M
    complexity: low
    labels: [api-gateway, identity, academic, billing, ai-ready]
    repositories: [api-gateway, identity, academic, billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Semua `GET /health` mengembalikan JSON statis tanpa memeriksa apa pun (`cmd/server/health.go` di tiap service; gateway `router.go:29-34`). Service dapat dinyatakan sehat ketika database, Redis, identity gRPC, atau downstream tidak tersedia. Tidak ada pemisahan liveness dan readiness."
      goal: "Orkestrator atau operator dapat membedakan proses hidup dari service yang siap melayani, berdasarkan status dependency yang sebenarnya."
      requirements:
        - "Endpoint readiness memeriksa dependency wajib: database untuk identity, academic, billing; identity gRPC untuk academic; ketiga downstream untuk gateway."
        - "Dependency opsional (Redis identity, Redis gateway) dilaporkan sebagai degraded tanpa menggagalkan readiness."
        - "Endpoint liveness tetap murah dan tidak memanggil dependency."
        - "Probe memiliki timeout singkat dan tidak menulis data."
      acceptanceCriteria:
        - "Readiness mengembalikan non-2xx dengan detail komponen ketika database tidak tersedia"
        - "Readiness gateway mencerminkan status health downstream"
        - "Liveness tetap 200 saat dependency mati"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Jangan mengekspos DSN atau detail koneksi pada respons. Endpoint readiness harus tetap di luar rate limiting dan JWT seperti health saat ini. Perbarui dokumentasi operasi dan ports."
      relevantAreas:
        - "kelolakelas-api-gateway/internal/delivery/http/router.go"
        - "kelolakelas-identity-service/cmd/server/health.go"
        - "kelolakelas-academic-service/cmd/server/health.go"
        - "kelolakelas-billing-service/cmd/server/health.go"
      edgeCases:
        - "Database lambat tetapi hidup."
        - "Redis dikonfigurasi tetapi tidak dapat dijangkau."
        - "Readiness dipanggil sangat sering."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Graceful shutdown identity/academic/gateway."
        - "gRPC health service."
        - "Alerting."
  - draftKey: repository-hygiene-artifacts-and-env-examples
    projectKey: platform-operability
    title: Bersihkan artefak build, dump data, dan contoh kredensial dari repository Go
    type: Refactor
    priority: Medium
    estimate: S
    complexity: very-low
    labels: [api-gateway, identity, academic, billing, ai-ready]
    repositories: [api-gateway, identity, academic, billing]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "`git ls-files` menunjukkan binary ter-commit: academic `main` dan `server`, identity `server`, gateway `server`, serta billing `dump.rdb`. Setiap `.gitignore` Go hanya berisi `.env`. `kelolakelas-billing-service/.env.example` memuat nilai `JWT_SECRET=<redacted>` dan `REDIS_PASSWORD=<redacted>` serta variabel Redis yang tidak dibaca config. Makefile academic dan billing memiliki target `seed` ke direktori `seeders/` yang tidak ada, dan migrasi academic `000001_student_notes_tenant_nullable` tidak memiliki file down."
      goal: "Repository hanya melacak sumber, konfigurasi contoh berisi placeholder, dan tooling Makefile serta migrasi konsisten."
      requirements:
        - "Hapus binary dan dump dari tracking dan tambahkan pola build output serta dump ke .gitignore di keempat repo."
        - "Ganti nilai kredensial di .env.example billing dengan placeholder dan hapus variabel yang tidak dibaca."
        - "Selaraskan target seed Makefile academic dan billing dengan keadaan repo dan tambahkan migrasi down yang hilang di academic."
        - "Build, test, dan CI tetap lulus."
      acceptanceCriteria:
        - "git ls-files di keempat repo tidak memuat binary atau file .rdb"
        - ".env.example billing tidak memuat nilai rahasia nyata dan hanya variabel yang dibaca config"
        - "make migrate-down pada academic berjalan untuk setiap migrasi up yang ada"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Jangan menulis ulang git history; binary lama tetap ada di riwayat dan itu di luar scope. Dokumentasikan di kelolakelas-docs bahwa secret contoh harus placeholder."
      relevantAreas:
        - "kelolakelas-billing-service/.env.example"
        - "kelolakelas-academic-service/Makefile"
        - "kelolakelas-academic-service/migrations"
        - "kelolakelas-api-gateway/.gitignore"
      edgeCases:
        - "Developer lokal memiliki binary yang sama di working tree."
        - "CI mengandalkan artefak yang ter-commit (tidak ditemukan bukti)."
        - "Migrasi down untuk perubahan nullable memerlukan data yang valid."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Penulisan ulang history."
        - "Rotasi secret di environment nyata."
        - "Penambahan linter atau govulncheck ke CI."
  - draftKey: academic-catalog-tenant-info-caching
    projectKey: platform-operability
    title: Batasi pemanggilan gRPC dan penulisan snapshot tenant pada setiap request katalog
    type: Improvement
    priority: Medium
    estimate: S
    complexity: medium
    labels: [academic, ai-ready]
    repositories: [academic]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Setiap request list atau detail katalog memanggil `GetTenantPublicInfo` untuk semua tenant hasil dan menyimpan ulang `tenant_location_snapshots` (`internal/usecase/catalog_usecase.go:17-37,49-76`, `internal/repository/catalog_repository.go:21-28`) tanpa TTL atau timeout gRPC (`pkg/grpcclient/tenant_client.go:42,50`). Visibility tenant nonaktif juga tidak konsisten: list memakai LEFT JOIN, detail memakai INNER JOIN dengan `is_active = true` (`catalog_repository.go:31,88`). Katalog publik adalah jalur tanpa autentikasi dan tanpa rate limit per user."
      goal: "Katalog publik melayani request tanpa beban gRPC dan penulisan per request, tetap tersedia saat identity tidak dapat dijangkau, dan menampilkan aturan visibility tenant yang konsisten."
      requirements:
        - "Snapshot tenant disegarkan dengan TTL atau frekuensi terbatas, bukan pada setiap request."
        - "Panggilan gRPC katalog memiliki timeout per panggilan; kegagalan identity tidak menggagalkan respons katalog selama snapshot tersedia."
        - "Kelas milik tenant nonaktif disembunyikan secara konsisten pada list dan detail."
        - "Filter, sort, pagination, dan availability yang ada tetap sama."
      acceptanceCriteria:
        - "Dua request katalog berurutan dalam TTL tidak memicu panggilan gRPC atau penulisan snapshot kedua"
        - "Katalog tetap merespons dengan snapshot ketika identity gRPC mati"
        - "Kelas tenant nonaktif tidak muncul di list maupun detail"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Hindari dependency cache baru; kolom `updated_at` snapshot yang ada dapat menjadi dasar TTL. `mustUUID` yang menelan tenant ID tidak valid menjadi nil harus ditangani agar tidak menulis snapshot dengan kunci nil. Perbarui dokumentasi komponen academic."
      relevantAreas:
        - "kelolakelas-academic-service/internal/usecase/catalog_usecase.go"
        - "kelolakelas-academic-service/internal/repository/catalog_repository.go"
        - "kelolakelas-academic-service/pkg/grpcclient/tenant_client.go"
      edgeCases:
        - "Tenant baru yang belum memiliki snapshot."
        - "Tenant mengubah lokasi dalam masa TTL."
        - "Identity mengembalikan tenant ID yang tidak valid."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Caching hasil permission gRPC."
        - "Full-text search atau ranking."
        - "Rate limiting katalog."
  - draftKey: academic-api-contract-cleanup
    projectKey: platform-operability
    title: Perbaiki field last_name student dan segarkan kontrak Swagger academic
    type: Refactor
    priority: Low
    estimate: S
    complexity: low
    labels: [academic, web, ai-ready]
    repositories: [academic, web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Struct `Student` menyerialisasi nama belakang dengan tag `lastå_name` (`internal/domain/student.go:24`) dan web menormalkannya (`kelolakelas-web/lib/students.ts:29-30`, `lib/payment-status.ts:5`). Swagger academic terakhir dibuat 6 September sebelum perubahan permission 15 September: route alias body-param tidak terdokumentasi, anotasi security salah untuk `POST /tenants/{tenant_id}/enrollments` dan endpoint internal, dan tidak ada permission yang didokumentasikan. Tidak ada langkah regenerasi Swagger di CI atau Makefile."
      goal: "Kontrak API academic yang dipublikasikan sesuai dengan kode, dan field nama belakang student memakai nama yang benar tanpa memutus web."
      requirements:
        - "Tag JSON menjadi last_name; web menerima kedua nama selama transisi lalu hanya last_name setelah academic dirilis."
        - "Swagger diregenerasi dari anotasi terkini dengan security dan catatan permission yang benar."
        - "Makefile academic memiliki target regenerasi Swagger."
        - "Response student lainnya dan validasi web tidak berubah."
      acceptanceCriteria:
        - "Respons student memakai last_name dan halaman student parent menampilkannya dengan benar"
        - "Swagger memuat seluruh route yang terdaftar di main.go dengan security yang benar"
        - "Dokumentasi API academic tidak lagi mencantumkan caveat typo"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Urutan rilis: web toleran terhadap kedua field lebih dulu, lalu academic. Jangan menambahkan validasi drift Swagger ke CI di issue ini kecuali sederhana."
      relevantAreas:
        - "kelolakelas-academic-service/internal/domain/student.go"
        - "kelolakelas-academic-service/docs"
        - "kelolakelas-web/lib/students.ts"
        - "kelolakelas-web/lib/payment-status.ts"
      edgeCases:
        - "Klien lain yang bergantung pada nama field lama (tidak ditemukan)."
        - "Anotasi Swagger pada handler tanpa route."
        - "Web memakai cache respons lama."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Penghapusan Swagger stale di kelolakelas-web/_docs."
        - "Regenerasi Swagger identity dan billing."
        - "Perubahan kontrak lain."
  - draftKey: web-payment-return-and-status-refresh
    projectKey: buyer-web-experience
    title: Sediakan halaman kembali dari pembayaran dengan pembaruan status otomatis
    type: Feature
    priority: High
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies:
      - key: duitku-return-url-points-to-web
        description: "DUITKU_RETURN_URL pada environment billing yang dituju harus mengarah ke route web halaman kembali; saat ini default-nya jatuh ke DUITKU_CALLBACK_URL (kelolakelas-billing-service/internal/config/config.go:127-128)."
        verification: "Baca nilai DUITKU_RETURN_URL pada konfigurasi environment billing target dan pastikan sama dengan URL route web yang dibuat; setelah checkout sandbox, browser mendarat pada route web tersebut."
    body:
      backgroundProblem: "Halaman `/dashboard/parent/enrollments` meminta parent memuat ulang secara manual setelah kembali dari provider (`page.tsx:14`) dan tidak ada polling atau route pendaratan khusus. Billing memakai `DUITKU_RETURN_URL` yang bila kosong jatuh ke URL callback webhook (`config.go:127-128`), sehingga parent dapat mendarat pada endpoint webhook billing. Status backend adalah satu-satunya sumber kebenaran; redirect provider tidak boleh dianggap bukti pembayaran."
      goal: "Parent yang kembali dari Duitku mendarat pada halaman web yang menampilkan status enrollment dan pembayaran terkini tanpa reload manual."
      requirements:
        - "Route pendaratan parent-only menampilkan status enrollment terkait berdasarkan backend dan menyegarkan secara otomatis dalam batas waktu sampai status tidak lagi pending."
        - "Halaman tidak pernah menampilkan sukses berdasarkan parameter redirect."
        - "Sesi hilang saat kembali mengarahkan ke login dengan tujuan kembali yang sama."
        - "Halaman enrollments yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Setelah kembali dari checkout, halaman menampilkan pending lalu berubah menjadi paid/active tanpa reload manual setelah callback diproses"
        - "State reconciling, failed, dan expired ditampilkan sesuai backend"
        - "Membuka halaman tanpa sesi mengarahkan ke login dan kembali setelah login"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Batasi durasi dan frekuensi refresh agar tidak membebani gateway. Reuse `lib/payment-status.ts`. Dokumentasikan nilai DUITKU_RETURN_URL yang diharapkan di kelolakelas-docs."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments"
        - "kelolakelas-web/lib/payment-status.ts"
        - "kelolakelas-web/proxy.ts"
      edgeCases:
        - "Parent kembali sebelum callback diproses."
        - "Transaksi paid tetapi enrollment masih reconciling."
        - "Parameter query berisi ID transaksi milik parent lain."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Perubahan billing atau provider."
        - "Notifikasi push."
        - "Unduh invoice."
  - draftKey: web-parent-cancel-pending-enrollment
    projectKey: buyer-web-experience
    title: Sediakan pembatalan enrollment pending dari halaman parent
    type: Feature
    priority: Medium
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: [cancel-pending-enrollment-backend]
    externalDependencies: []
    body:
      backgroundProblem: "Halaman enrollments parent hanya menampilkan status; tidak ada aksi untuk membatalkan enrollment pending yang belum dibayar. Setelah endpoint pembatalan backend tersedia, parent memerlukan UI untuk melepaskan pendaftaran yang tidak jadi dilanjutkan."
      goal: "Parent dapat membatalkan enrollment pending miliknya dari halaman enrollments dengan konfirmasi dan melihat status terbaru."
      requirements:
        - "Aksi batal hanya muncul untuk enrollment pending milik parent."
        - "Konfirmasi sebelum membatalkan; hasil sukses, 409, dan error API ditampilkan."
        - "Daftar di-revalidate setelah pembatalan."
        - "Tampilan status yang ada tetap sama."
      acceptanceCriteria:
        - "Parent dapat membatalkan enrollment pending dan melihat status dropped atau cancelled sesuai backend"
        - "Enrollment yang sudah dibayar tidak menampilkan aksi batal"
        - "Pembatalan yang ditolak backend menampilkan pesan yang jelas"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Ikuti pola Server Action parent yang ada. Jangan memakai window.confirm; gunakan konfirmasi yang dapat diakses keyboard sesuai pola yang disepakati di web."
      relevantAreas:
        - "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments"
      edgeCases:
        - "Callback paid diproses tepat sebelum pembatalan."
        - "Double submit."
        - "Sesi kedaluwarsa saat aksi dijalankan."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Pembatalan enrollment aktif."
        - "Refund."
        - "Pembatalan oleh tenant."
  - draftKey: web-logout
    projectKey: buyer-web-experience
    title: Sediakan logout untuk parent dan tenant
    type: Feature
    priority: High
    estimate: S
    complexity: very-low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Pencarian `logout`, `sign out`, dan `signout` di `app/` dan `lib/` tidak menemukan apa pun. Cookie sesi berumur tujuh hari (`app/(auth)/login/_actions/actions.ts:72-90`) dan tidak ada menu akun di sidebar tenant, mobile nav, maupun halaman parent, sehingga pengguna perangkat bersama tidak dapat mengakhiri sesi."
      goal: "Pengguna dapat mengakhiri sesi dari halaman terautentikasi mana pun dan kembali ke halaman publik."
      requirements:
        - "Aksi logout menghapus cookie auth dan tenant lalu mengarahkan ke halaman login atau beranda."
        - "Kontrol logout tersedia di navigasi tenant (sidebar dan mobile) dan di area parent."
        - "Setelah logout, route protected mengarahkan ke login."
        - "Login, registrasi, dan proxy yang ada tetap berfungsi."
      acceptanceCriteria:
        - "Menekan logout menghapus sesi dan membuka /dashboard mengarahkan ke login"
        - "Logout tersedia untuk parent dan tenant pada layout desktop dan mobile"
        - "Logout saat cookie sudah tidak ada tidak menghasilkan error"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Tidak ada endpoint revocation di identity; token tetap valid sampai kedaluwarsa 24 jam dan keterbatasan ini didokumentasikan. Gunakan Server Action sesuai pola yang ada."
      relevantAreas:
        - "kelolakelas-web/app/(auth)"
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx"
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx"
      edgeCases:
        - "Logout dari halaman publik saat sesi parent aktif."
        - "Beberapa tab terbuka."
        - "Nama cookie dikonfigurasi berbeda lewat env."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Token revocation backend."
        - "Halaman profil akun."
        - "Logout dari semua perangkat."
  - draftKey: web-public-metadata-language-branding
    projectKey: buyer-web-experience
    title: Rapikan metadata halaman publik, bahasa dokumen, dan branding web
    type: Improvement
    priority: Medium
    estimate: S
    complexity: low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Root layout masih memakai metadata `Create Next App` dan `lang=\"en\"` (`app/layout.tsx:15-18,27`) padahal UI parent berbahasa Indonesia. `/kelas` dan `/kelas/[id]` tidak mengekspor metadata atau canonical sehingga mewarisi judul placeholder. Nama `Tutorin` masih ada di `package.json:2`, halaman login/register, `LoginForm.tsx:61`, `TenantSidebar.tsx:88,93`, dan `MobileNav.tsx:69,73`; README masih template create-next-app; `.env.example` tidak mencantumkan `NEXT_PUBLIC_APP_URL`."
      goal: "Halaman katalog dapat ditemukan dan dibagikan dengan judul serta deskripsi yang benar, dokumen memakai bahasa yang tepat, dan seluruh branding konsisten KelolaKelas."
      requirements:
        - "Metadata default aplikasi dan metadata dinamis untuk /kelas dan /kelas/[id] dengan title, description, canonical, dan Open Graph."
        - "Atribut lang dokumen mencerminkan bahasa UI."
        - "Seluruh referensi Tutorin diganti dan README menjelaskan proyek serta variabel environment termasuk NEXT_PUBLIC_APP_URL."
        - "Landing page dan halaman lain yang sudah memiliki metadata tetap benar."
      acceptanceCriteria:
        - "Judul tab dan canonical /kelas dan detail kelas sesuai kelas yang ditampilkan"
        - "Tidak ada string Tutorin atau Create Next App di app, lib, package.json, dan README"
        - ".env.example mencantumkan semua variabel yang dibaca aplikasi"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Baca panduan metadata Next.js 16 di node_modules sesuai AGENTS.md web. Deskripsi kelas berasal dari JSON yang dinormalisasi di `lib/catalog.ts`; sanitasi sebelum dipakai di metadata. Jangan menghapus Swagger stale di _docs pada issue ini."
      relevantAreas:
        - "kelolakelas-web/app/layout.tsx"
        - "kelolakelas-web/app/(public)/kelas"
        - "kelolakelas-web/package.json"
        - "kelolakelas-web/README.md"
      edgeCases:
        - "Kelas tidak ditemukan saat generateMetadata."
        - "Deskripsi kelas kosong."
        - "NEXT_PUBLIC_APP_URL tidak diset."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "sitemap.ts dan robots.ts."
        - "Internationalization library."
        - "Redesign visual."
  - draftKey: web-error-boundaries
    projectKey: buyer-web-experience
    title: Lengkapi error boundary dan halaman not-found pada route publik dan dashboard
    type: Improvement
    priority: Medium
    estimate: S
    complexity: very-low
    labels: [web, ai-ready]
    repositories: [web]
    blockedByDraftKeys: []
    externalDependencies: []
    body:
      backgroundProblem: "Satu-satunya `error.tsx` berada di `app/(dashboard)/dashboard/parent/students/error.tsx`; tidak ada `not-found.tsx` atau `global-error.tsx`. Kesalahan tak terduga pada `/kelas`, `/kelas/[id]`, `/dashboard/parent/enrollments`, dan seluruh route tenant menampilkan layar error bawaan Next.js tanpa aksi pemulihan, dan URL tidak dikenal tidak memiliki halaman 404 bermerek."
      goal: "Setiap segmen route memiliki halaman error yang dapat dipulihkan dan halaman not-found yang konsisten dengan UI."
      requirements:
        - "error.tsx untuk segmen publik katalog, parent enrollments, dan layout tenant dengan aksi coba lagi."
        - "not-found.tsx global dan penggunaan notFound() yang ada tetap konsisten."
        - "Salinan pesan berbahasa Indonesia mengikuti gaya halaman yang ada."
        - "State error yang sudah ditangani secara eksplisit di halaman tidak berubah."
      acceptanceCriteria:
        - "Error render pada /kelas menampilkan halaman error dengan tombol coba lagi yang berfungsi"
        - "URL tidak dikenal menampilkan halaman not-found bermerek"
        - "Error pada route tenant tetap menampilkan navigasi layout"
        - "Existing functionality remains unaffected"
        - "Error and validation scenarios are handled correctly"
      technicalNotes: "Ikuti panduan error handling Next.js 16 di node_modules. Jangan mencatat detail error ke browser; logging server-side mengikuti pola console.error yang ada."
      relevantAreas:
        - "kelolakelas-web/app/(public)/kelas"
        - "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments"
        - "kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx"
      edgeCases:
        - "Error terjadi di layout root."
        - "Error saat sesi kedaluwarsa."
        - "not-found dipicu dari Server Action."
      testingValidation:
        - "Relevant unit tests are added or updated"
        - "Relevant integration tests are added or updated"
        - "Existing tests pass"
        - "Lint passes"
        - "Type checking passes"
        - "Acceptance criteria are manually or automatically verified"
      outOfScope:
        - "Dialog aksesibel untuk modal."
        - "Pelaporan error ke layanan eksternal."
        - "Redesign visual."
```

---

Apakah Anda menyetujui pembuatan Project dan Issue di Linear, dan Project/Issue mana saja yang ingin dibuat (semua 5 Project + 33 Issue, atau subset tertentu)?
