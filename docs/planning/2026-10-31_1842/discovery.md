# Discovery - Testing 31 Oktober 2026

## Baseline dan batasan

- MODE incremental; FOKUS enam temuan testing user: publication wording, navigasi login/register, CTA Akses awal, posisi seluruh modal, input jam private, konfigurasi batas slot dan pemilihan approval. MAKS_ISSUE=8. Blok request contoh di prompt tidak dijalankan ulang sebagai permintaan baru.
- Baseline dihasilkan helper tanpa edit manual: [baseline.json](baseline.json), previousRun `2026-10-27_0522`; cutoff Linear `2026-10-26T22:22:14.843Z`.
- Seluruh tujuh repository aplikasi/docs berhasil fetch dan pull --ff-only pada main bersih sebelum baseline; tidak ada perubahan tracked awal. Tidak ada perubahan kode aplikasi, commit, PR atau write Linear.
- Range: web `53fafa7342e2..8c42521b6a0b`; gateway `622e61d835e8..d70421e3ba3c`; academic `5570b7bff297..2cd7b60ca644`; docs `30f19fe462db..d8a15901202e`. Subagent read-only terpisah memeriksa masing-masing dan Linear secara paralel.
- Identity `48b082f62d8c..7808fe515e51`, billing `7fd099d44f62..03fb0815e7bb`, chat `4a3f9d6b6bdf..2de8ce6e20f7`: judul history diperiksa untuk batas scope; tidak didalami sebagai target perubahan karena kebutuhan berada pada web dan academic, dengan regression forwarding gateway. Billing harga dan chat delivery dipertahankan; semantic chat capture berada di academic. Orchestrator dilewati sepenuhnya.
- Lampiran dibaca sebagai URL dan dicoba via HTTP HEAD di sandbox maupun di luar sandbox: `http://localhost:3000/dashboard/tenant/classes` dan `http://localhost:3000/kelas/a2055414-5076-4c48-9d76-3d9e02c55cf3`. Keduanya connection refused; tidak ada browser geometry/keyboard/payment reproduction atau klaim data kelas ID tersebut.
- Riset web publik primer login/signup GitHub dan login Canva dibaca; rekomendasi dan keterbatasan situs lain pada [auth-ux-references.md](auth-ux-references.md). Tidak ada benchmark kuantitatif conversion atau klaim bahwa seluruh website memakai pola sama.
- Linear: seluruh 33 project termasuk archived; pagination active/backlog dituntaskan memakai filter status; 4 Backlog, tidak ada Todo/In Progress/In Review, tidak ada status bernama Blocked atau hasil filter Blocked. Done 26, Canceled/Duplicate 0 sejak cutoff. Empat Backlog KEL-100/101/102/104 berada pada platform control dan tidak overlap. Completed lebih lama dari cutoff tidak diinventaris ulang menyeluruh; overlap historis spesifik diperiksa melalui get_issue.

## Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Feedback publish | Implemented literal dan rendering message | web `app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts:530`; `_components/ClassPublicationControl.tsx:129` | Hilangkan pesan sukses spesifik, bukan error/status | KEL-198 Done menyangkut edit/save, bukan penghapusan copy |
| Reciprocal auth links | Inferred gap dari form source | web `app/(auth)/login/_components/LoginForm.tsx:141`; `app/(auth)/register/_components/RegisterFormSwitch.tsx:54` | Link Masuk/Daftar sekunder untuk kedua persona | Bukan tiga fix yang diselesaikan KEL-228 |
| CTA Akses awal | Implemented sebagai modal trigger | web `app/(public)/_components/EarlyAccessModal.tsx:25` | Ganti tujuan CTA berlabel itu menjadi login; pertahankan hero/register CTA lain | Tidak ada owner aktif ditemukan |
| Centered modals | Implemented body portal; Inferred inkonsistensi alignment; Unknown visual | web `components/ModalDialog.tsx:31`, `:39`; `ClassEditModal.tsx:100`; `EnrollmentPanel.tsx:162`; approval dialog `:159` | Default centering dan audit caller independen, termasuk tambah anak | KEL-228 Done memperbaiki mobile drawer, editor visibility dan report chat, bukan seluruh centering |
| Input jam | Implemented autoadvance tenant; Inferred belum diterapkan parent | web `ScheduleTimeInput.tsx:23`, `:56`, test `:49`; `app/(public)/kelas/[id]/_components/ScheduleRequestForm.tsx:221` | Reuse perilaku ke public private request; browser check wajib | KEL-210 Done untuk editor tenant; KEL-220 styling private bukan autoadvance |
| Batas slot kelas | Not found dalam class model/DTO dan schema yang diperiksa | academic `internal/domain/class.go:29`, `:48`, `:72`; init migration `:9`; web class schema `:127` | Setting maksimum slot approved per enrollment, bukan seat capacity | KEL-215 capacity private=1 bukan N jadwal |
| Approval subset | Implemented approve-all; Not found selection payload/persistence | academic handler `private_schedule_request_handler.go:190`; usecase `:89`, `:163`, `:180`; domain request `:42`; web approval action `:103` | Pilihan eksplisit 1..N, validasi server, simpan original vs approved | KEL-222 Done hanya projection; KEL-215 Done retry, bukan partial approval |
| Downstream jadwal/harga/chat | Implemented coupling | academic usecase `:187`, `:205`, `:225`; `internal/repository/private_chat_capture.go:80` | Hanya pilihan yang menghasilkan jadwal/session/chat; harga existing tetap | KEL-221/226 Done harus diregresi, bukan dikerjakan ulang |
| Gateway | Implemented reverse proxy raw body | gateway `internal/delivery/http/handler/proxy_handler.go:186`; router `:189`, `:242`; router test `:91`, `:133` | Tambah exact payload regression; tidak perlu endpoint/DTO baru | Tidak perlu feature gateway terpisah |

Path singkat pada tabel mengikuti direktori repository/komponen yang disebut; path detail ada di Technical Notes setiap draft. Tidak ada carry-over yang dianggap terverifikasi tanpa pemeriksaan baru. Docs `docs/components/web.md:345`, `:363` dan `docs/api/academic.md:95` sejalan dengan perbedaan time input dan bodyless approve. Executive summary memiliki klaim baseline lama; tidak dipakai untuk mengarang gap CI/auth baru.

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| auth-entry-navigation | request login/register + CTA | Improvement | Akses akun jelas | Medium | S | low | High source + benchmark terbatas | - | draft |
| publication-success-copy | request | Improvement (bugfix) | Hilangkan copy tidak diinginkan | Low | S | low | Medium source + laporan user | - | draft |
| centered-modal-layout | request | Improvement (bugfix) | Modal dapat dipakai di seluruh viewport | High | M | medium | Medium; belum visual reproduction | - | draft |
| private-time-input-autoadvance | request | Improvement | Input jadwal parent lebih cepat | Medium | M | medium | High gap source; runtime Unknown | - | draft |
| private-approved-slot-limit | request | Feature | Tenant mengendalikan komitmen jadwal | High | M | high | High gap; default/legacy proposal eksplisit | - | draft |
| private-approved-slot-selection | request | Feature | Hanya jadwal yang dipilih diselenggarakan | High | L | high | High approve-all source | private-approved-slot-limit | draft |
| Audit UX seluruh page ulang | discovery | Improvement | Tidak spesifik | Low | L | medium | High duplicate | KEL-228 Done | tolak |
| Buat ulang autoadvance tenant | discovery | Improvement | Sudah ada | Low | S | low | High duplicate | KEL-210 Done | tolak |
| Harga per slot/engine alternatif overlap | discovery | Feature | Belum diminta | Low | L | high | Low kebutuhan | Keputusan produk terpisah | tunda |

## Status permintaan feature

| Request | Status | Bukti | draftKey |
| --- | --- | --- | --- |
| Hapus wording publish | didraft | Literal source dan rendering teridentifikasi sesuai laporan user | publication-success-copy |
| Link login/register, analisis pola situs lain | didraft | Gap form + riset primer terdokumentasi | auth-entry-navigation |
| Akses awal ke login | didraft, digabung outcome auth | Modal trigger existing | auth-entry-navigation |
| Semua modal tengah, contoh tambah anak | didraft | Alignment belum konsisten, visual belum terverifikasi | centered-modal-layout |
| Jam langsung pindah menit | didraft sebagai perluasan parent, bukan duplikasi tenant | Native time parent vs shared time tenant | private-time-input-autoadvance |
| Batas slot dan pilih subset approval | didraft dua slice berdependency | Class N absent + approve-all | private-approved-slot-limit; private-approved-slot-selection |

## Semantik yang memerlukan persetujuan draft

Usulan N=maximum per request/enrollment, pilihan 1..N, default private baru 1, legacy nullable mempertahankan existing, latest N untuk keputusan pending belum termaterialisasi, keputusan termaterialisasi immutable saat invoice retry. Contoh user N=1 dipenuhi. Nilai default/legacy/konversi tipe bukan fakta existing atau keputusan final; minta persetujuan bersama draft dan tulis ADR sebelum coding. Tidak memperluas scope ke overlap alternatif, pricing, global capacity atau mengubah jumlah usulan menjadi N.
