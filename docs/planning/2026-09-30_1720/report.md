# Laporan perencanaan 2026-09-30_1720

## Ringkasan eksekutif

Run ini men-draft tujuh fitur yang diminta owner di chat. Hasilnya 6 Project dan 29 Issue. Batas kuota dinaikkan atas persetujuan owner: estimasi awal ±24, bertambah karena fondasi backend yang ditemukan saat discovery. Seluruh payload lulus `intake:validate` dan sudah dirender.

Bukti utama:

- Backend sesi, absensi, dan laporan sudah ada tanpa satu pun layar web.
- Absensi gagal untuk sesi reschedule: `academic schedule_usecase.go:338-348` membuat sesi baru dengan `ScheduleID=nil`.
- Guard pengajar tidak konsisten, dan token parent yang membawa tenant_id berpotensi membaca seluruh data absensi atau laporan tenant (`permission_middleware.go:51-66`, `attendance_usecase.go:32-44`).
- Ledger tenant sudah dikreditkan saat callback sukses (`billing transaction_usecase.go:976-1021`), tetapi tidak ada API saldo atau penarikan.
- Worker renewal berhenti tanpa konsekuensi setelah period+7 hari (`subscription_worker.go:90`).
- Web parent memilih transaksi tertua per enrollment (`parent/enrollments/page.tsx:21`).
- Academic dan chat belum memiliki jalur notifikasi.
- Profil publik, ulasan, penukaran voucher, dan ekspor CSV berstatus Not found.

Batasan discovery:

- Review ini statis. Aplikasi, Duitku, dan Resend tidak dijalankan.
- Repo docs lokal kotor dan tertinggal 25 commit, jadi tidak di-pull; docs dibaca dari `origin/main`.
- Keputusan owner diperoleh dari chat pada 2026-09-30.

## Alasan prioritas dan urutan

Urutan eksekusi ada di `backlog.md`. Prinsipnya adalah fondasi dahulu, lalu UI, dengan kebenaran finansial diperlakukan secara berlapis:

1. **Operasional pengajar dan portal parent (High).** Backend-nya hampir siap, dan dua bug atau risiko akses harus ditutup dahulu:
   - `attendance-by-session` dan `tutor-session-scope-guards`;
   - `parent-learning-read-api`, yang dikerjakan setelah guard sesi karena menyentuh kode otorisasi yang sama.

   `role-aware-tenant-nav` independen dan menjadi prasyarat layar pengajar supaya tutor tidak melihat menu admin.
2. **Keuangan tenant (High).** Urutannya saldo dan rekening → pengajuan penarikan (hold atomik) → pemrosesan platform admin (butuh gRPC cek platform admin dari identity) → UI. Laporan dan ekspor transaksi independen dan bisa berjalan paralel.
3. **Tunggakan dan refund.** Suspend academic dahulu, lalu masa tenggang billing. Perbaikan pemilihan transaksi terbaru di web parent tidak punya blocker, jadi bisa dikerjakan segera. Refund bergantung pada endpoint end di academic, dan UI refund bergantung pada halaman transaksi.
4. **Notifikasi (Medium).** Jalur pesan sistem chat → outbox academic (juga bergantung pada absensi per sesi) → pengingat H-1. Render web hanya bergantung pada chat.
5. **Pertumbuhan (Medium/Low).** Profil publik dan manajemen voucher independen. Penukaran voucher dikerjakan setelah manajemen voucher. Ulasan berprioritas Low.

Issue ber-complexity critical adalah `parent-learning-read-api`, `billing-tenant-withdrawal-request`, `platform-withdrawal-processing`, `billing-renewal-grace-suspend`, `billing-manual-refund`, dan `voucher-checkout-redemption`. Semuanya menyentuh data anak lintas parent atau kebenaran finansial, dan masing-masing mencantumkan mitigasi di Technical Notes dan Testing.

## Status setiap permintaan

| Request | Status | draftKey |
| --- | --- | --- |
| R1 Operasional sesi, absensi, dan laporan pengajar | didraft | `attendance-by-session`, `tutor-session-scope-guards`, `role-aware-tenant-nav`, `web-tutor-sessions-attendance`, `web-session-reschedule-substitute`, `web-tutor-student-reports` |
| R2 Portal parent | didraft | `parent-learning-read-api`, `web-parent-learning-portal` |
| R3 Payout tenant | didraft (manual oleh platform admin) | `billing-tenant-balance-bank-account`, `billing-tenant-withdrawal-request`, `platform-withdrawal-processing`, `web-tenant-finance`, `web-platform-withdrawal-queue` |
| R4 Notifikasi parent | didraft (email + chat); WhatsApp ditunda | `chat-system-notification-channel`, `academic-parent-notification-outbox`, `academic-session-reminder`, `web-system-notification-render` |
| R5 Tunggakan dan refund | didraft (tenggang → suspend; refund manual) | `academic-enrollment-suspension`, `billing-renewal-grace-suspend`, `web-parent-latest-payment-status`, `billing-manual-refund`, `web-tenant-manual-refund` |
| R6 Profil, ulasan, voucher | didraft | `tenant-public-profile-page`, `class-reviews-api`, `web-class-reviews`, `tenant-voucher-management`, `voucher-checkout-redemption` |
| R7 Laporan transaksi dan ekspor | didraft | `billing-transaction-report-export`, `web-tenant-transactions-page` |

## Kandidat yang tidak dibuat

- **Notifikasi WhatsApp:** ditunda sesuai keputusan owner. Membutuhkan vendor, template yang disetujui Meta, dan normalisasi nomor HP (`users.phone` belum diverifikasi).
- **Disbursement otomatis dan refund otomatis via API provider:** ditolak karena bertentangan dengan keputusan owner. Klien Duitku juga tidak memiliki API disbursement.
- **Moderasi ulasan oleh platform, voucher private/renewal, dan refund parsial:** ditunda karena berada di luar MVP.
- **Menyelaraskan tabel keuangan yang tidak dipakai di identity:** ditunda. ADR pada `billing-tenant-balance-bank-account` menetapkan billing sebagai pemilik data keuangan; pembersihannya refactor terpisah.
- **Pembaruan docs yang usang** (`08-known-gaps-and-risks.md` tentang attendance/report, README tentang routing chat, catatan "no UI" pada KEL-108/115/ADR 0046): tidak dibuat sebagai issue. Pembaruan dibebankan pada issue yang menyentuh area terkait. Selain itu repo docs lokal perlu disinkronkan owner.

## Pertanyaan terbuka

1. **Refund dan wallet:** apakah refund manual mendebit saldo wallet tenant (refund dibayar dari dana yang ditahan platform), atau tenant membayar parent dari kas sendiri tanpa mutasi ledger? Draft memakai opsi kedua (tanpa mutasi) dan melarang implementasi debit sebelum ada keputusan.
2. **Minimum penarikan:** nilai default minimum penarikan dan kemungkinan biaya admin (draft: biaya nol, minimum dapat dikonfigurasi).
3. **Subset `about` tenant yang boleh dipublikasikan:** kolom ini jsonb bebas. Draft hanya mengekspos subset yang terdokumentasi.
4. **Sinkronisasi repo docs:** working tree lokal perlu dibersihkan dan di-pull supaya run berikutnya dapat membaca docs terbaru secara langsung.
5. **KEL-129 dan KEL-133** masih Backlog tanpa `ai-ready` dari run sebelumnya dan tidak disentuh run ini.

## Status pengiriman ke Linear

Owner menyetujui seluruh 6 Project dan 29 Issue pada 2026-09-30.

- **Project:** P-KEL-26 s.d. P-KEL-31. Description berisi isi `projects/<key>.md` apa adanya.
- **Issue:** KEL-134 s.d. KEL-162.
  - Nomornya berurutan sesuai urutan eksekusi di `backlog.md`, status Backlog.
  - Description berisi isi `issues/NN-<draftKey>.md`.
  - Metadata diambil dari `backlog.yaml` (priority; estimate S=1, M=2, L=3; label repository).
- **Relasi `blockedBy`:** dipasang saat pembuatan. Setiap blocker selalu dibuat lebih dulu karena urutan payload sudah topologis.
- **Verifikasi baca ulang:** lulus untuk 29 Issue dan 6 Project.
  - Project, priority, dan estimate cocok.
  - Label repository persis sama dengan kontrak, dan belum ada `ai-ready` saat verifikasi.
  - Relasi `blockedBy` persis sama dengan pemetaan `blockedByDraftKeys`.
  - Heading `## AI Orchestrator Contract` dan `AI Orchestrator Project Contract` ada, dan `draftKey` serta `key` di JSON cocok.
- **Label `ai-ready`:** ditambahkan pada ke-29 Issue sebagai langkah terakhir, lalu diverifikasi. Tidak ada label repository yang hilang.
- **Mapping:** ada di `linear-sync.json`.

Catatan:

- Linear menormalkan bullet `-` menjadi `*` di bagian manusia, dan mengubah teks "KEL-22" pada Technical Notes KEL-140 menjadi mention. Mention itu membuat relasi "related" KEL-140 → KEL-22. Blok kontrak JSON tidak berubah.
- Issue baru tidak diberi label tipe (Feature/Improvement), mengikuti aturan prompt bahwa label hanya label repository ditambah `ai-ready`.
- Tidak ada implementasi, CI, atau merge yang diklaim dalam run ini.
- KEL-152 (refund manual) menunggu jawaban pertanyaan terbuka nomor 1 sebelum debit wallet dipertimbangkan. Draft saat ini melarang debit.
