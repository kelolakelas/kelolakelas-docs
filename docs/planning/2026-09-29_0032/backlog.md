# Backlog draft 2026-09-29_0032

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `payment-experience-owned-page` | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | 3 | [projects/payment-experience-owned-page.md](projects/payment-experience-owned-page.md) |
| `private-payment-link-delivery` | Distribusi aman payment link kelas private | 2 | [projects/private-payment-link-delivery.md](projects/private-payment-link-delivery.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Billing menerima pilihan channel VA/QRIS atau kartu untuk invoice baru](issues/01-billing-payment-channel-selection.md) | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | Feature | High | M | critical | `academic`, `billing`, `ai-ready` | - | - |
| 2 | [Billing menyimpan dan menyajikan instruksi pembayaran VA/QR untuk transaksi milik parent](issues/02-billing-payment-instructions.md) | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | Feature | High | M | critical | `billing`, `api-gateway`, `ai-ready` | `billing-payment-channel-selection` | - |
| 3 | [Parent membayar VA/QRIS dari halaman KelolaKelas dan kartu melalui redirect Duitku](issues/03-web-payment-page.md) | Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas | Feature | High | M | high | `web`, `ai-ready` | `billing-payment-instructions` | - |
| 4 | [Parent menerima email payment link setelah jadwal private disetujui](issues/04-private-payment-link-email.md) | Distribusi aman payment link kelas private | Feature | High | M | high | `academic`, `billing`, `ai-ready` | - | - |
| 5 | [Payment link private dapat dikirim lewat percakapan request yang tepat](issues/05-private-payment-link-chat.md) | Distribusi aman payment link kelas private | Feature | High | M | high | `academic`, `chat`, `web`, `ai-ready` | `private-payment-link-email` | - |
| 6 | [Parent yang sudah memiliki student dapat menambah student lain dari detail kelas](issues/06-student-modal-existing-list.md) | Tidak ada | Improvement | Medium | S | low | `web`, `ai-ready` | - | - |
| 7 | [Riwayat enrollment parent membaca envelope daftar API dengan benar](issues/07-parent-enrollment-history-envelope.md) | Tidak ada | Improvement | High | S | low | `web`, `ai-ready` | - | - |
| 8 | [Academic menolak kapasitas jadwal private yang tidak sesuai satu student](issues/08-private-schedule-capacity-guard.md) | Tidak ada | Improvement | Medium | M | high | `academic`, `ai-ready` | - | - |
