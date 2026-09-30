# Discovery — 2026-09-30_1720

## Baseline dan batasan

- **Mode:** incremental dari `2026-09-29_0032`; cutoff Linear `2026-09-28T17:32:32.426Z`.
- **FOKUS:** tujuh permintaan owner di chat (bukan blok `requests` di prompt, yang berisi permintaan run lama dan sudah selesai):
  1. R1: operasional sesi, absensi, dan laporan oleh pengajar;
  2. R2: portal belajar parent (jadwal, kehadiran, rapor anak);
  3. R3: pencairan dana tenant;
  4. R4: notifikasi ke parent;
  5. R5: tunggakan perpanjangan dan refund;
  6. R6: profil tenant publik, ulasan, dan voucher;
  7. R7: laporan transaksi tenant dan ekspor.
- **MAKS_ISSUE:** dinaikkan owner menjadi "draft semua" (±24 disepakati; hasil akhir 29, lihat `report.md`).
- **Keputusan owner (chat, 2026-09-30):**
  - payout diproses **manual oleh platform admin** tanpa API disbursement;
  - renewal tak dibayar diberi **masa tenggang lalu suspend** dengan kursi dilepas, dan refund dicatat **manual oleh tenant** tanpa API refund provider;
  - notifikasi dikirim lewat **email + pesan chat**, sementara WhatsApp menjadi kandidat berikutnya.
- **Range commit:**
  - web `05562bf..7cee871`: KEL-112/113/114/123/124/127/130/131;
  - academic `82169ba..1a90621`: KEL-125/128/132;
  - billing `95cce66..750d5fa`: KEL-125/126/128;
  - gateway, identity, dan chat: kosong.
- **Repo kode:** semua di `main` bersih dan sudah `pull --ff-only`.
- **Batasan:**
  - Repo docs lokal di `main` kotor (folder planning untracked dan `README.md` termodifikasi) serta tertinggal 25 commit dari `origin/main`, sehingga tidak di-pull. Docs dibaca dari `origin/main` via `git show`.
  - Review ini statis. Aplikasi, Duitku, dan Resend tidak dijalankan.
  - Repository `kelolakelas-ai-orchestrator` hanya dipakai untuk kontrak dan validator.

## Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| API sesi/absensi/laporan | Implemented (backend) | academic `cmd/server/routes.go:93-100`, `cmd/server/attendance_report_routes.go:13-21`; gateway `router.go:183-212` | UI tidak ada | KEL-22/51/90/17 Done, semuanya mengecualikan UI |
| Absensi sesi yang di-reschedule | Inferred bug | academic `schedule_usecase.go:338-348` (sesi baru `ScheduleID=nil`), `session_repository.go:59-65` (absensi dicari lewat schedule_id+date), `schedule_usecase.go:620-623` | absensi dan attendees gagal untuk sesi reschedule; tidak ada absensi massal per sesi | tidak ada issue |
| Guard sesi/laporan | Inferred risiko | `routes.go:93,94,100` (GET session tanpa permission); `report_usecase.go:65-85` (update/delete tanpa cek pengajar, berbeda dengan create di `enrollment_repository.go:227-231`); `schedule_usecase.go:473-506` (tutor pengganti tidak divalidasi) | "sesi saya" tidak diturunkan dari JWT (`session_handler.go:37`) | tidak ada issue |
| Menu tenant sadar-permission | Not found | web `tenant/_constants/constants.ts:7-48`, `TenantSidebar.tsx:197,228-231`, `MobileNav.tsx:378`; identity tanpa `/me` permission (`role_handler.go:45-61`); JWT tanpa daftar permission (`pkg/jwt/jwt.go:17-29`) | tutor (role Teacher, seeder `000001_default_permissions_and_roles.sql:76-81`) melihat semua menu admin | tidak ada issue |
| Akses parent ke sesi/absensi/laporan | Not found; Inferred risiko | handler memerlukan tenant claim (`attendance_handler.go:75-78`); `permission_middleware.go:51-66` melewati parent; list hanya difilter tenant (`attendance_usecase.go:32-44`, `report_usecase.go:31-43`) | parent tidak bisa melihat progres anak; token parent yang membawa tenant_id berpotensi membaca semua data tenant | KEL-22/90 mengecualikan akses parent; KEL-70 hanya ringkasan jadwal |
| Portal web parent | Implemented sebagian | web `parent/enrollments/page.tsx`, `parent/students`, `parent/chat`; tidak ada layout/nav parent | jadwal sesi, riwayat kehadiran, dan rapor belum ada | — |
| Pilihan transaksi parent | Inferred bug | web `parent/enrollments/page.tsx:21` (Map, baris terakhir menang, padahal billing mengurutkan `created_at DESC`) | status renewal menampilkan transaksi tertua | KEL-131 Done hanya memperbaiki envelope |
| Wallet/ledger tenant | Implemented (kredit); Not found (baca/penarikan) | billing `transaction_usecase.go:976-1021` (kredit `NetAmount` ke `AvailableBalance` + ledger `payment_received`); `init_schema.up.sql:14,19,57,64`; `repository/interfaces.go:34,40`; `usecase/interfaces.go:12,32` | API saldo/ledger, rekening, penarikan, dan proses admin belum ada; `PendingBalance` tidak dipakai | KEL-58 mengecualikan payout |
| Tabel keuangan di identity | Configured, tidak dipakai | identity `init_schema.up.sql:51-91`, `domain/financial.go:33,93` | tumpang tindih dengan tabel billing | dicatat; billing dipilih sebagai pemilik |
| Cek platform admin lintas service | Not found (gRPC) | identity `cmd/server/main.go:230-233` (Tenant, Permission, CatalogPolicy, FeePolicy); gateway `RequirePlatform` hanya memeriksa claim | billing butuh cek live assignment untuk memproses penarikan | ADR 0026 |
| Tunggakan renewal | Not found | billing `subscription_worker.go:73,90` (setelah period+7 hari worker berhenti; subscription tetap `active`); academic status hanya pending/active/completed/dropped (`enrollment.go:58`); release tidak mencabut active (`enrollment_usecase.go:472-512`) | tidak ada konsekuensi atas tunggakan | KEL-25/26/55 Done tanpa suspend |
| Refund | Not found | status `refunded` tidak pernah ditulis (`domain/transaction.go:32-39`); cancel setelah bayar 409 (`transaction_handler.go:232`) | pencatatan refund manual belum ada | ditunda di run 0032 karena menunggu keputusan finance; sekarang sudah diputuskan |
| Notifikasi | Implemented (email billing saja) | billing `EmailClient` (`domain/payment_gateway.go:52-59`); academic tanpa email/outbox; chat tanpa sender sistem atau endpoint internal (`migrations/000001_chat.up.sql`, `cmd/server/main.go:104-111`) | reschedule, tutor pengganti, dan absen tidak memberi tahu parent | ditunda di run 0940 |
| Email parent di academic | Not found (enrollment) | `enrollment.go:95` (`SenderEmail` tidak disimpan); private request menyimpan `ParentEmail` (`private_schedule_request.go:47`) | notifikasi email membutuhkan alamat tersimpan | — |
| Profil tenant publik | Not found | identity hanya gRPC `GetTenantPublicInfo` (`tenant_handler.go:59-85`); web `CatalogCard.tsx:10` hanya memfilter katalog | halaman profil publik belum ada | KEL-34 (settings), KEL-86 (kelas lain tenant) |
| Ulasan/rating | Not found | tidak ada tabel atau route | — | — |
| Voucher | Configured (tabel), Not found (usecase) | billing `init_schema.up.sql:3-13`; `transaction_usecase.go:155` hanya meneruskan diskon; permission `voucher:*` sudah di-seed | CRUD dan penukaran belum ada | ditunda di run 0032 |
| Laporan transaksi tenant | Implemented sebagian | billing `transaction_handler.go:44-80` (filter tanggal memakai `created_at`), summary `:127-153`; web `SalesSummaryCard.tsx`, `tenant/enrollments` (N+1 call billing) | halaman daftar transaksi dan ekspor CSV belum ada | KEL-58/33 mengecualikan ekspor |
| Docs usang | Implemented (drift) | `origin/main` `08-known-gaps-and-risks.md` (attendance/report dianggap tanpa permission), `README.md` (chat belum dirouting), `components/web.md` | perlu diperbarui oleh issue yang menyentuh area terkait | — |

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Absensi per sesi termasuk sesi reschedule, absensi massal | R1 | Improvement | tinggi | High | M | high | tinggi | — | draft `attendance-by-session` |
| Guard sesi/laporan untuk pengajar dan "sesi saya" | R1 | Improvement | tinggi | High | M | high | tinggi | — | draft `tutor-session-scope-guards` |
| Endpoint permission saya + menu sadar-permission | R1 | Feature | tinggi | High | M | medium | tinggi | — | draft `role-aware-tenant-nav` |
| UI sesi dan absensi pengajar | R1 | Feature | tinggi | High | M | medium | tinggi | 3 issue di atas | draft |
| UI reschedule dan tutor pengganti | R1 | Feature | sedang | Medium | M | medium | tinggi | UI sesi | draft |
| UI laporan evaluasi siswa | R1 | Feature | tinggi | Medium | M | medium | tinggi | guard, nav | draft |
| API baca parent untuk sesi, absensi, dan laporan milik anak | R2 | Feature | tinggi | High | M | critical | tinggi | — | draft |
| Portal web parent | R2 | Feature | tinggi | High | L | medium | tinggi | API parent | draft |
| Saldo, ledger, dan rekening tenant | R3 | Feature | tinggi | High | M | high | tinggi | — | draft |
| Pengajuan penarikan oleh tenant | R3 | Feature | tinggi | High | M | critical | tinggi | saldo | draft |
| Proses penarikan manual oleh platform admin | R3 | Feature | tinggi | High | L | critical | sedang | pengajuan | draft |
| UI keuangan tenant dan antrean platform | R3 | Feature | tinggi | High | M+M | medium | tinggi | backend | draft (2 issue) |
| Laporan transaksi + ekspor CSV | R7 | Feature | sedang | Medium | M+M | medium/low | tinggi | — | draft (2 issue) |
| Suspend/resume enrollment di academic | R5 | Feature | tinggi | High | M | high | tinggi | — | draft |
| Masa tenggang renewal → suspend | R5 | Feature | tinggi | High | M | critical | sedang | suspend academic | draft |
| Status transaksi terbaru dan renewal di web parent | R5 | Improvement | tinggi | High | S | low | tinggi | — | draft |
| Pencatatan refund manual | R5 | Feature | sedang | Medium | L | critical | sedang | suspend academic | draft |
| UI refund tenant | R5 | Feature | sedang | Medium | S | medium | tinggi | refund, halaman transaksi | draft |
| Channel notifikasi sistem di chat | R4 | Feature | sedang | Medium | M | high | tinggi | — | draft |
| Outbox notifikasi academic (reschedule/pengganti/absen) | R4 | Feature | sedang | Medium | L | high | sedang | chat, absensi per sesi | draft |
| Pengingat sesi H-1 | R4 | Feature | sedang | Medium | S | medium | sedang | outbox | draft |
| Render notifikasi sistem di web | R4 | Feature | sedang | Medium | S | low | tinggi | chat | draft |
| Profil tenant publik | R6 | Feature | sedang | Medium | M | medium | tinggi | — | draft |
| API dan UI ulasan kelas | R6 | Feature | sedang | Low | M+M | high/medium | sedang | — | draft (2 issue) |
| Manajemen voucher tenant | R6 | Feature | sedang | Medium | M | medium | tinggi | — | draft |
| Penukaran voucher di checkout | R6 | Feature | sedang | Medium | L | critical | sedang | manajemen voucher | draft |
| Notifikasi WhatsApp | R4 | Feature | sedang | Low | L | high | rendah | vendor | tunda (keputusan owner) |
| Refund otomatis via API provider / disbursement otomatis | R3/R5 | Feature | — | — | L | critical | rendah | kontrak provider | tolak (bertentangan dengan keputusan owner) |
| Moderasi ulasan oleh platform | R6 | Feature | rendah | Low | M | medium | rendah | ulasan | tunda |
| Menyelaraskan tabel keuangan identity vs billing | discovery | Refactor | rendah | Low | S | low | sedang | payout | tunda |

## Status permintaan feature

| Request | Status | Bukti | draftKey atau Linear |
| --- | --- | --- | --- |
| R1 Operasional sesi/absensi/laporan pengajar | didraft | backend ada, UI tidak ada; ditemukan bug reschedule dan guard | `attendance-by-session`, `tutor-session-scope-guards`, `role-aware-tenant-nav`, `web-tutor-sessions-attendance`, `web-session-reschedule-substitute`, `web-tutor-student-reports` |
| R2 Portal parent | didraft | akses parent ke sesi/absensi/laporan Not found | `parent-learning-read-api`, `web-parent-learning-portal` |
| R3 Payout tenant | didraft (manual) | kredit ledger ada; baca dan penarikan belum ada | `billing-tenant-balance-bank-account`, `billing-tenant-withdrawal-request`, `platform-withdrawal-processing`, `web-tenant-finance`, `web-platform-withdrawal-queue` |
| R4 Notifikasi parent | didraft (email + chat); WhatsApp ditunda | tidak ada notifikasi di academic/chat | `chat-system-notification-channel`, `academic-parent-notification-outbox`, `academic-session-reminder`, `web-system-notification-render` |
| R5 Tunggakan dan refund | didraft | tidak ada suspend atau refund | `academic-enrollment-suspension`, `billing-renewal-grace-suspend`, `web-parent-latest-payment-status`, `billing-manual-refund`, `web-tenant-manual-refund` |
| R6 Profil, ulasan, voucher | didraft | profil publik, ulasan, dan penukaran voucher Not found | `tenant-public-profile-page`, `class-reviews-api`, `web-class-reviews`, `tenant-voucher-management`, `voucher-checkout-redemption` |
| R7 Laporan transaksi dan ekspor | didraft | ekspor Not found | `billing-transaction-report-export`, `web-tenant-transactions-page` |
