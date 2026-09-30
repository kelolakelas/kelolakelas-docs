# Backlog draft 2026-09-28_0509

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `private-class-scheduled-purchase` | Pembelian kelas private dengan jadwal yang disepakati | 6 | [projects/private-class-scheduled-purchase.md](projects/private-class-scheduled-purchase.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Parent dapat mengajukan jadwal kelas private dan tenant dapat meninjau atau menolaknya melalui API](issues/01-private-schedule-request-api.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | L | high | `academic`, `api-gateway`, `ai-ready` | - | - |
| 2 | [Persetujuan tenant atas permintaan jadwal private membuat enrollment, jadwal, dan payment link](issues/02-approve-private-schedule-request.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | high | `academic`, `api-gateway`, `ai-ready` | `private-schedule-request-api` | - |
| 3 | [Parent mengajukan jadwal kelas private dari detail kelas dan memantau status permintaannya](issues/03-parent-private-schedule-request-web.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | medium | `web`, `ai-ready` | `private-schedule-request-api` | - |
| 4 | [Tenant meninjau, menyetujui, atau menolak permintaan jadwal private dari dashboard](issues/04-tenant-private-schedule-review-web.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | medium | `web`, `ai-ready` | `approve-private-schedule-request` | - |
| 5 | [Tenant dapat menolak permintaan jadwal private dengan rekomendasi jadwal lain dan parent dapat menerimanya melalui API](issues/05-private-schedule-recommendation-api.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | high | `academic`, `api-gateway`, `ai-ready` | `approve-private-schedule-request` | - |
| 6 | [Tenant mengirim rekomendasi jadwal saat menolak dan parent dapat menerima atau menolaknya di web](issues/06-private-schedule-recommendation-web.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | medium | `web`, `ai-ready` | `private-schedule-recommendation-api`, `parent-private-schedule-request-web`, `tenant-private-schedule-review-web` | - |
| 7 | [Parent dapat menambah student lewat modal di detail kelas lalu langsung melanjutkan enrollment](issues/07-create-student-modal-class-detail.md) | Tidak ada | Improvement | High | S | low | `web`, `ai-ready` | - | - |
| 8 | [Tenant dapat menghasilkan slot jadwal mingguan dari pilihan hari, jam, lama sesi, dan jeda](issues/08-weekly-schedule-slot-generator.md) | Tidak ada | Feature | Medium | M | medium | `web`, `ai-ready` | - | - |
| 9 | [Form buat kelas tidak lagi menampilkan field kapasitas karena kapasitas diatur per jadwal](issues/09-disable-capacity-private-class-form.md) | Tidak ada | Improvement | Medium | S | low | `web`, `ai-ready` | - | - |
| 10 | [Elemen yang dapat diklik di web menampilkan cursor pointer](issues/10-pointer-cursor-clickable-elements.md) | Tidak ada | Improvement | Low | S | very-low | `web`, `ai-ready` | - | - |
