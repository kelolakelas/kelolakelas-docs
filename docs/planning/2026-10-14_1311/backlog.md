# Backlog draft 2026-10-14_1311

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `qa-teaching-recovery` | QA: sesi dan identitas laporan pengajaran | 2 | [projects/qa-teaching-recovery.md](projects/qa-teaching-recovery.md) |
| `payment-experience-owned-page` | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | 2 | [projects/payment-experience-owned-page.md](projects/payment-experience-owned-page.md) |
| `tutor-session-operations` | Operasional sesi, absensi, dan laporan oleh pengajar | 4 | [projects/tutor-session-operations.md](projects/tutor-session-operations.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Tetapkan dan selaraskan permission baca administrasi tenant](issues/01-tenant-read-permission-policy.md) | Tidak ada | Improvement | High | M | high | `identity`, `web`, `ai-ready` | - | - |
| 2 | [Tetapkan baseline security headers dan ownership app versus edge](issues/02-web-security-header-policy.md) | Tidak ada | Improvement | Low | M | high | `web`, `ai-ready` | - | - |
| 3 | [Respons report menyertakan identitas student dan class untuk daftar](issues/03-report-list-enrollment-identities.md) | QA: sesi dan identitas laporan pengajaran | Improvement | Medium | M | high | `academic`, `ai-ready` | - | - |
| 4 | [Tenant dapat menugaskan teacher pada jadwal private hasil approval](issues/04-private-teacher-assignment-policy.md) | QA: sesi dan identitas laporan pengajaran | Feature | Medium | M | high | `web`, `academic`, `ai-ready` | `report-list-enrollment-identities` | - |
| 5 | [Billing menerima pilihan channel VA/QRIS atau kartu untuk invoice baru](issues/05-billing-payment-channel-selection.md) | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | Feature | High | M | critical | `academic`, `billing`, `ai-ready` | - | - |
| 6 | [Parent memilih channel pembayaran untuk pembelian kelas private](issues/06-private-request-payment-channel.md) | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | Improvement | Medium | L | critical | `web`, `academic`, `ai-ready` | `billing-payment-channel-selection` | - |
| 7 | [Pengajar melihat sesinya sendiri dan akses sesi, tutor pengganti, serta laporan dijaga konsisten](issues/07-tutor-session-scope-guards.md) | Operasional sesi, absensi, dan laporan oleh pengajar | Improvement | High | M | high | `academic`, `identity`, `ai-ready` | - | - |
| 8 | [Menu dashboard tenant hanya menampilkan area yang diizinkan permission anggota](issues/08-role-aware-tenant-nav.md) | Operasional sesi, absensi, dan laporan oleh pengajar | Feature | High | M | medium | `identity`, `api-gateway`, `web`, `ai-ready` | - | - |
| 9 | [Pengajar menulis dan mengelola laporan evaluasi siswa dari dashboard](issues/09-web-tutor-student-reports.md) | Operasional sesi, absensi, dan laporan oleh pengajar | Feature | Medium | M | medium | `web`, `ai-ready` | `tutor-session-scope-guards`, `role-aware-tenant-nav` | - |
| 10 | [Pilihan siswa di form laporan tidak terpotong pada 1000 sesi/enrollment](issues/10-report-student-search-picker.md) | Operasional sesi, absensi, dan laporan oleh pengajar | Improvement | Low | M | medium | `web`, `ai-ready` | `web-tutor-student-reports` | - |
