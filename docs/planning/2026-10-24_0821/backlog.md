# Backlog — Testing 24 Oktober 2026

Enam issue baru; reuse empat project existing tanpa mengubah description project. Tidak ada project baru. MODE incremental, MAKS_ISSUE 8. Semua issue independen; urutan berikut adalah prioritas eksekusi, bukan dependency teknis.

## Project existing

- `P-KEL-22` — Pembelian kelas private dengan jadwal yang disepakati
- `P-KEL-23` — Chat realtime antara tenant, pengajar, dan parent
- `P-KEL-24` — Pembayaran kelas dengan pilihan channel dan halaman KelolaKelas
- `P-KEL-9` — Pengalaman pembeli yang lengkap di web

## Issue dan metadata

| # | draftKey / Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | Related (Done) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `restore-private-approval` — [Investigasi dan pulihkan approval schedule request yang selalu gagal](issues/01-restore-private-approval.md) | P-KEL-22 | Improvement (bugfix) | High | M | high | `Bug`, `web`, `academic`, `billing` | — | KEL-108, KEL-110, KEL-133 |
| 2 | `restore-parent-checkout` — [Investigasi dan pulihkan Lanjut ke pembayaran pada detail kelas parent](issues/02-restore-parent-checkout.md) | P-KEL-24 | Improvement (bugfix) | High | M | high | `Bug`, `web`, `academic`, `billing` | — | KEL-14, KEL-194, KEL-106 |
| 3 | `chat-unread-navigation-badge` — [Tampilkan badge jumlah pesan belum dibaca pada tombol Chat](issues/03-chat-unread-navigation-badge.md) | P-KEL-23 | Improvement | Medium | M | medium | `Improvement`, `web` | — | KEL-123, KEL-202 |
| 4 | `pending-schedule-request-navigation-badge` — [Tampilkan badge request pending pada navigasi Schedule Requests admin](issues/04-pending-schedule-request-navigation-badge.md) | P-KEL-22 | Improvement | Medium | M | medium | `Improvement`, `web` | — | KEL-110 |
| 5 | `shared-date-input-ux` — [Standarkan semua field tanggal dengan auto-advance dan pilihan tahun langsung](issues/05-shared-date-input-ux.md) | P-KEL-9 | Improvement | Medium | L | medium | `Improvement`, `web` | — | KEL-175, KEL-201, KEL-210 |
| 6 | `private-slot-control-styles` — [Standarkan style input hari dan kontrol slot jadwal yang diajukan](issues/06-private-slot-control-styles.md) | P-KEL-22 | Improvement | Medium | S | low | `Improvement`, `web` | — | KEL-109, KEL-200, KEL-210 |

Estimate Linear S=1, M=2, L=3. Type bugfix diklasifikasikan Improvement sesuai taxonomy prompt dan memakai label Bug di Linear. Label web/academic/billing untuk dua failure menunjuk area investigasi; owner fix ditentukan oleh bukti. Badge memakai kontrak existing; tidak mewajibkan perubahan academic/chat/API gateway. Semua description berasal langsung dari issues/*.md, tanpa kontrak orchestrator/ai-ready. Relasi historis berupa relatedTo, bukan blockedBy baru.

## Pengiriman Linear terverifikasi

- `restore-private-approval` → [KEL-215](https://linear.app/farid-zamani/issue/KEL-215/investigasi-dan-pulihkan-approval-schedule-request-yang-selalu-gagal) — Backlog; tanpa blocker baru.
- `restore-parent-checkout` → [KEL-216](https://linear.app/farid-zamani/issue/KEL-216/investigasi-dan-pulihkan-lanjut-ke-pembayaran-pada-detail-kelas-parent) — Backlog; tanpa blocker baru.
- `chat-unread-navigation-badge` → [KEL-217](https://linear.app/farid-zamani/issue/KEL-217/tampilkan-badge-jumlah-pesan-belum-dibaca-pada-tombol-chat) — Backlog; tanpa blocker baru.
- `pending-schedule-request-navigation-badge` → [KEL-218](https://linear.app/farid-zamani/issue/KEL-218/tampilkan-badge-request-pending-pada-navigasi-schedule-requests-admin) — Backlog; tanpa blocker baru.
- `shared-date-input-ux` → [KEL-219](https://linear.app/farid-zamani/issue/KEL-219/standarkan-semua-field-tanggal-dengan-auto-advance-dan-pilihan-tahun) — Backlog; tanpa blocker baru.
- `private-slot-control-styles` → [KEL-220](https://linear.app/farid-zamani/issue/KEL-220/standarkan-style-input-hari-dan-kontrol-slot-jadwal-yang-diajukan) — Backlog; tanpa blocker baru.

Description dan seluruh metadata/relasi telah di-fetch ulang; mapping ada pada [linear-sync.json](linear-sync.json).
