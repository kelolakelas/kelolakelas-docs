# Backlog draft 2026-10-12_2046

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `qa-platform-recovery` | QA: pemulihan alur platform admin | 3 | [projects/qa-platform-recovery.md](projects/qa-platform-recovery.md) |
| `qa-teaching-recovery` | QA: sesi dan identitas laporan pengajaran | 3 | [projects/qa-teaching-recovery.md](projects/qa-teaching-recovery.md) |
| `qa-category-maintenance` | QA: pemeliharaan kategori tenant | 2 | [projects/qa-category-maintenance.md](projects/qa-category-maintenance.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan](issues/01-platform-totp-enrollment-version.md) | QA: pemulihan alur platform admin | Improvement | Medium | M | high | `identity`, `ai-ready` | - | - |
| 2 | [Approve dan reject Creator memakai primary key assignment yang benar](issues/02-creator-decision-assignment-column.md) | QA: pemulihan alur platform admin | Improvement | Medium | M | high | `identity`, `ai-ready` | `platform-totp-enrollment-version` | - |
| 3 | [Guard web menerima tenant zero UUID pada verified platform session](issues/03-platform-zero-tenant-scope.md) | QA: pemulihan alur platform admin | Improvement | Medium | M | high | `web`, `ai-ready` | `creator-decision-assignment-column` | - |
| 4 | [Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher](issues/04-session-calendar-timestamp-label.md) | QA: sesi dan identitas laporan pengajaran | Improvement | Medium | S | medium | `web`, `ai-ready` | - | - |
| 5 | [Respons report menyertakan identitas student dan class untuk daftar](issues/05-report-list-enrollment-identities.md) | QA: sesi dan identitas laporan pengajaran | Improvement | Medium | M | high | `academic`, `ai-ready` | - | - |
| 6 | [Tetapkan dan selaraskan permission baca administrasi tenant](issues/06-tenant-read-permission-policy.md) | Tidak ada | Improvement | High | M | high | `identity`, `web`, `ai-ready` | - | - |
| 7 | [Tenant dapat menugaskan teacher pada jadwal private hasil approval](issues/07-private-teacher-assignment-policy.md) | QA: sesi dan identitas laporan pengajaran | Feature | Medium | M | high | `web`, `academic`, `ai-ready` | `report-list-enrollment-identities` | - |
| 8 | [Tetapkan baseline security headers dan ownership app versus edge](issues/08-web-security-header-policy.md) | Tidak ada | Improvement | Low | M | high | `web`, `ai-ready` | - | - |
| 9 | [Tenant dapat memperbarui nama dan deskripsi kategori melalui API scoped](issues/09-category-update-api.md) | QA: pemeliharaan kategori tenant | Feature | Medium | M | high | `identity`, `academic`, `api-gateway`, `ai-ready` | - | - |
| 10 | [Tenant dapat mengedit dan menghapus kategori dari dashboard](issues/10-category-maintenance-ui.md) | QA: pemeliharaan kategori tenant | Feature | Medium | M | high | `web`, `ai-ready` | `category-update-api` | - |
