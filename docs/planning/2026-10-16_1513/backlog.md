# Backlog draft 2026-10-16_1513

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `tenant-selling-operations` | Operasional tenant untuk menjual kelas | 5 | [projects/tenant-selling-operations.md](projects/tenant-selling-operations.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Simpan kategori, kelas, pengajar, dan jadwal dalam satu transaksi final](issues/01-atomic-class-creation-api.md) | Operasional tenant untuk menjual kelas | Improvement | High | L | high | `academic`, `ai-ready` | - | - |
| 2 | [Jadikan wizard kelas draft lokal sampai final submit berhasil](issues/02-deferred-class-creation-wizard.md) | Operasional tenant untuk menjual kelas | Improvement | High | M | medium | `web`, `ai-ready` | `atomic-class-creation-api` | - |
| 3 | [Lengkapi edit kelas dengan kategori dan jadwal, lalu hapus Add Schedule terpisah](issues/03-complete-class-editor.md) | Operasional tenant untuk menjual kelas | Improvement | High | L | high | `web`, `academic`, `ai-ready` | `deferred-class-creation-wizard` | - |
| 4 | [Tambahkan hapus kelas dengan konfirmasi dan penanganan konflik](issues/04-delete-class-action.md) | Operasional tenant untuk menjual kelas | Improvement | Medium | S | medium | `web`, `ai-ready` | - | - |
| 5 | [Rapikan day of week, start time, dan end time pada form jadwal](issues/05-schedule-form-layout.md) | Operasional tenant untuk menjual kelas | Improvement | Medium | S | low | `web`, `ai-ready` | `complete-class-editor` | - |
| 6 | [Default waktu voucher dari 00:00:00 sampai 23:59:59](issues/06-voucher-day-boundary-defaults.md) | Tidak ada | Improvement | Medium | S | medium | `web`, `ai-ready` | - | - |
| 7 | [Rapikan layout dan styling halaman chat tenant](issues/07-tenant-chat-layout.md) | Tidak ada | Improvement | Medium | M | low | `web`, `ai-ready` | - | - |
| 8 | [Ubah Creator Request menjadi Owner Account Request dan pindahkan ke Members](issues/08-owner-account-request-members-only.md) | Tidak ada | Improvement | Medium | S | low | `web`, `ai-ready` | - | - |
