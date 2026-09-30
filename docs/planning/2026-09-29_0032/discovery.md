# Discovery — 2026-09-29_0032

Mode incremental; fokus utama: delapan butir `requests` pada `LINEAR_PLANNING_PROMPT.md`, ditambah dua kandidat discovery yang disetujui owner. `baseline.json` tidak diubah. Previous run `2026-09-28_0940`; cutoff Linear `2026-09-28T02:40:57.584Z`. Range commit: web `f98f22c..05562bf`, gateway `df5f0db..51a8a23`, identity `16406df..b05a137`, academic `23fc8dc..82169ba`, billing kosong, chat unknown, docs kosong. Docs lokal di `main` kotor dan 11 commit tertinggal dari `origin/main`: tidak dipull; discovery docs lokal ditandai usang. Repo kode sudah disinkronkan `--ff-only`; orchestrator hanya kontrak/example validator read-only. Lampiran URL localhost kelas/detail tidak diuji karena aplikasi tidak dijalankan. Temuan berikut dari pembacaan statis kode dan Linear, bukan uji transaksi Duitku.

Keputusan owner: merchant Duitku sudah mengaktifkan semua channel (pernyataan owner, belum diuji sandbox); VA/QRIS dibayar di halaman KelolaKelas dan kartu kredit tetap redirect (keputusan run sebelumnya). Lengkapi pengiriman link via email/chat. Owner menyetujui batas delapan issue. Aktivasi merchant wajib dicek ulang dengan respons sandbox sebelum implementasi mengandalkan channel spesifik.

## Coverage

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Payment checkout | Implemented (hosted redirect); Not found (own payment page) | web `app/(public)/kelas/[id]/_actions/actions.ts:86-92,265-272`; billing `internal/usecase/transaction_usecase.go:290`; `pkg/duitku/client.go:42-47` | `VC` hardcode, VA/QR respons tidak disimpan/ditampilkan; provider channel dibutuhkan | KEL-44 return page dan KEL-53 resume tidak membangun payment page |
| Chat API dan realtime | Implemented backend; Not found web UI | gateway `internal/delivery/http/router.go:242-248`; chat `cmd/server/main.go:102-111`; chat `internal/delivery/http/ws.go:50-112` | UI dan entry point belum ada | KEL-123 dan KEL-124 Backlog; jangan draft ulang inbox/entry point |
| Link private via email/chat | Not found | academic `internal/usecase/private_schedule_request_usecase.go:209`; billing `internal/usecase/subscription_worker.go:210-234`; chat `internal/delivery/http/handler.go:236-278` | on-demand delivery dengan guard/idempotency, link tercatat ke target yang benar | KEL-108 membuat invoice; KEL-123/124 tidak mencakup pengiriman khusus link |
| Register tab/cursor | Implemented tabs; Not found cursor global | web `app/(auth)/register/_components/RegisterFormSwitch.tsx:27-51`; `app/globals.css:1-26` | affordance | KEL-114 Backlog, tercakup penuh |
| Kapasitas form kelas | Not found penghilangan field; Configured kelas capacity deprecated | web `ClassForm.tsx:183-199`; academic `internal/domain/class.go:35-38,47-54` | input kelas dikirim tapi tidak digunakan | KEL-113 Backlog, direvisi owner untuk hapus di kedua tipe; bukan issue baru |
| Kapasitas jadwal private | Inferred risiko | academic `internal/usecase/schedule_usecase.go:218-231`; `internal/domain/schedule_dto.go:13` | schedule private menerima capacity >1 walau satu enrollment; verifikasi model schedule sebelum enforcement | kandidat follow-up terpisah dari KEL-113; scope dan rollout perlu cek histori |
| Generator slot mingguan | Not found | web `ScheduleForm.tsx:212-248`; academic `internal/domain/schedule_dto.go:10-24` | checkbox hari, lama sesi, jeda | KEL-112 Backlog lengkap |
| Modal student detail kelas | Implemented empty state only | web `EnrollmentPanel.tsx:52-74,81-82` | parent yang sudah punya student tak bisa tambah dari detail | KEL-111 Done hanya mensyaratkan kondisi tanpa student; follow-up sempit |
| Private request/rekomendasi | Implemented | academic `cmd/server/routes.go:73-80`; `private_schedule_request_usecase.go:87-166`; web `ScheduleRequestList.tsx` | komunikasi link via email/chat | KEL-107..110/115/116 Done; KEL-123/124 Backlog |
| Parent enrollment history | Inferred bug (berdasarkan kontrak statis) | web `parent/enrollments/_queries/queries.ts:11-22` vs `:61-74`; docs `docs/08-known-gaps-and-risks.md:31` | response `{status,data:{items}}` dibaca sebagai top-level `items`, empty state palsu | tak ada issue aktif overlap pada inventaris Linear |
| Voucher, payout, refund, review, wishlist, cart, storefront | Configured sebagian tabel; Not found end-to-end | billing `cmd/server/routes.go:32-47`, `internal/domain/{voucher,withdrawal}.go`; academic `domain/class.go:29-45` | kandidat run berikutnya; payout/refund perlu keputusan finansial | tidak dipaksakan ke fokus user/kuota |

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pilihan channel + instruksi VA/QR checkout billing | request | Feature | tinggi | High | L | critical: uang/idempotensi | tinggi | uji sandbox Duitku | draft, dipisah 2 issue |
| Halaman pembayaran web dan redirect kartu | request | Feature | tinggi | High | M | high: pembayaran | tinggi | billing contract | draft |
| Kirim payment link private via email | request | Feature | tinggi | High | M | high: duplikasi/email salah alamat | tinggi | approval KEL-108 Done | draft |
| Bagikan payment link di chat private | request | Feature | tinggi | High | M | high: kebocoran lintas tenant/parent | sedang | KEL-123/124 (Backlog) | draft bersyarat; tidak beri ai-ready sampai relasi native terpasang |
| Tambah student ketika daftar sudah berisi | request follow-up | Improvement | sedang | Medium | S | low | tinggi | KEL-111 Done | draft |
| Betulkan envelope history enrollment | discovery | Improvement | tinggi | High | S | low | tinggi | tidak ada | draft |
| Guard kapasitas private di schedule backend | discovery | Improvement | sedang | Medium | M | high: kompatibilitas/data | sedang | audit data lama | draft |
| Cursor pointer | request | Improvement | sedang | Low | S | very-low | tinggi | KEL-114 Backlog | tolak duplikat |
| Hapus capacity kelas | request | Improvement | sedang | Medium | S | low | tinggi | KEL-113 Backlog | tolak duplikat |
| Generator jadwal | request | Feature | sedang | Medium | M | medium | tinggi | KEL-112 Backlog | tolak duplikat |
| Modal student zero-state | request | Improvement | sedang | High | S | low | tinggi | KEL-111 Done | sudah ada; follow-up di atas |
| Request/approve/rekomendasi private | request | Feature | tinggi | High | L | high | tinggi | KEL-107..110,115/116 Done | sudah ada; kanal delivery yang didraft |
| Chat inbox/entry point | request | Feature | tinggi | High | L | medium | tinggi | KEL-123/124 Backlog | duplikat; tidak didraft |

## Status permintaan feature

| Request | Status | Bukti | draftKey atau Linear |
| --- | --- | --- | --- |
| Payment page sendiri tanpa redirect | didraft dengan pengecualian kartu kredit redirect | billing `transaction_usecase.go:290`; keputusan owner VA/QRIS | `billing-payment-channel-instructions`, `web-payment-page` |
| Chat tenant–parent | duplikat backend dan UI aktif; didraft hanya link di chat | KEL-119..124 | `private-payment-link-chat`; KEL-123/124 |
| Register tab/cursor | duplikat | `RegisterFormSwitch.tsx:27-51` | KEL-114 |
| Private disable capacity | duplikat, keputusan owner berubah ke hapus kapasitas kelas semua tipe | `ClassForm.tsx:183-199` | KEL-113 |
| Checkbox hari/jam/durasi/jeda | duplikat | `ScheduleForm.tsx:212-248` | KEL-112 |
| Student modal di detail kelas | sudah ada untuk zero-state; didraft perluasan | `EnrollmentPanel.tsx:52-74,81-82` | KEL-111; `student-modal-existing-list` |
| Private: request/review/rekomendasi | sudah ada | academic `routes.go:73-80` | KEL-107..110,115/116 |
| Private: payment link via email/chat, bayar, aktivasi | didraft hanya delivery; pembayaran dan aktivasi sudah ada | academic `private_schedule_request_usecase.go:209`; billing `subscription_worker.go:210-234` | `private-payment-link-email`, `private-payment-link-chat`; KEL-108 |

Catatan: kemampuan eksternal VA/QRIS hanya pernyataan owner. Struktur issue dan status Linear dapat berubah sebelum fase tulis; re-check saat approval.
