# Discovery — run 2026-09-28_0509

## 1. Baseline dan batasan

- **Mode:** `full` (otomatis, karena `baseline.json` menulis `previousRun: null`; run sebelumnya `2026-09-16_1824` dan `2026-09-24_2041` tidak memiliki `baseline.json`). Scope tetap dibatasi pada area permintaan feature dan dependency-nya, sesuai aturan blok permintaan.
- **FOKUS (diturunkan dari permintaan):** (1) pembelian kelas private melalui persetujuan jadwal oleh tenant; (2) pembayaran dan komunikasi tenant–parent; (3) UX setup kelas tenant (capacity dan generator jadwal); (4) UX enrollment parent (buat student tanpa meninggalkan detail kelas, cursor pointer).
- **MAKS_ISSUE:** 8 (default).
- **SHA (semua `main`, `behind=0`, `ahead=0` setelah `git fetch`):**

| Repo | SHA | Kondisi |
| --- | --- | --- |
| web | `f98f22c` | bersih |
| api-gateway | `df5f0db` | bersih |
| identity | `16406df` | bersih |
| academic | `23fc8dc` | bersih |
| billing | `95cce66` | bersih |
| docs | `13ebda9` | dirty (planning/scripts untracked, `README.md` modified); tidak di-pull, tetapi sudah sama dengan `origin/main` |

- **Cutoff Linear:** tim `KelolaKelas`, semua 106 issue termasuk archived, diambil dengan `list_issues` (`includeArchived: true`). Hasilnya 97 completed, 4 backlog (KEL-100..KEL-104, konfigurasi platform), 4 unstarted onboarding Linear (KEL-1..KEL-4), dan 1 duplicate. Terdapat 16 Project dengan status Backlog.
- **Lampiran:**
  - URL `http://localhost:54611/kelas/cf9bd332-…` tidak dapat diakses (curl `000`, dev server tidak berjalan), sehingga dianalisis dari source route `app/(public)/kelas/[id]`.
  - Tidak ada lampiran lain.
- **Repo dilewati:**
  - `identity`: tidak ada perubahan yang dibutuhkan. Permission yang ada dipakai ulang; seed `seeders/000001_default_permissions_and_roles.sql` sudah dicek.
  - `kelolakelas-ai-orchestrator`: di luar scope; kontrak intake hanya dibaca.
- **Metode:** discovery dijalankan dengan probe read-only terstruktur (script di scratch sesi), bukan subagent paralel, karena scope dibatasi pada permintaan. Artefak discovery run sebelumnya (scratch `kel-plan-2`) dipakai sebagai titik awal dan diverifikasi ulang terhadap kode saat ini.

## 2. Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Checkout pembayaran | Implemented (hosted redirect) | billing `internal/usecase/transaction_usecase.go:290` selalu `PaymentMethod: "VC"`; `internal/domain/payment_gateway.go:18-21` hanya menyimpan `Reference` dan `PaymentURL`; web `lib/payment-status.ts:90` `resumePayment` membuka `checkout_session_url` | Halaman bayar sendiri butuh `getpaymentmethod` (`_docs/duitku/api.md:28,145`) serta `vaNumber`/`qrString` dari inquiry (`api.md:293-295`); keduanya belum dipakai. Kartu kredit (`VC`) tetap butuh redirect 3DS | Tidak ada issue Linear. KEL-44/KEL-53 selesai (return page, resume link) |
| Chat tenant–parent | Not found | grep `chat\|conversation\|websocket` di web, gateway, identity, academic, billing: 0 hasil | Butuh keputusan arsitektur (service baru vs modul). Kontrak `repositories` hanya mengenal 5 repo | Tidak ada issue |
| Email transaksional | Implemented (terbatas) | billing `subscription_worker.go:209-233` mengirim email payment link hanya untuk tagihan subscription; `transaction_usecase.go:704` mengirim email outcome paid/failed; academic tidak punya email sender (Resend hanya di identity/billing config) | Belum ada pengiriman payment link atas permintaan tenant | KEL-28/KEL-75 selesai (outcome, billing email) |
| Enrollment kelas private | Implemented (checkout langsung tanpa jadwal) | academic `enrollment_usecase.go:168` `EnrollPublic`, `:217` hanya group yang wajib `schedule_id`; web `EnrollmentPanel.tsx:23` menerima `classType` | Tidak ada request/persetujuan jadwal. Jadwal private hanya bisa dibuat lewat `POST /schedules` dengan `enrollment_id` (`schedule_usecase.go:221-239`) dan tidak ada UI tenant untuk itu (`ClassCreationWizard.tsx:26-52` hanya memberi notice) | KEL-50 menyelesaikan wizard private tanpa error, bukan alur request |
| Aktivasi enrollment setelah bayar | Implemented | academic `cmd/server/routes.go:94-95` `/internal/enrollments/:id/activate` dan `release`; `enrollment_usecase.go:387` `ActivateEnrollment`; sesi private dihasilkan untuk enrollment `pending`/`active` (`docs/flows/academic.md:38`) | Dapat dipakai ulang untuk langkah 3–4 alur private | KEL-26, KEL-90 selesai |
| Routing gateway academic | Implemented (daftar eksplisit) | gateway `internal/delivery/http/router.go:166-214` | Endpoint academic baru wajib didaftarkan di gateway | — |
| Permission tenant | Implemented | identity seed: `enrollment:create/read/update`, `schedule:create`; academic `routes.go:65-70` | Tidak ada permission khusus request jadwal; dapat memakai ulang `enrollment:*` | KEL-21 selesai |
| Form create class: capacity | Implemented, tetapi field diabaikan backend | web `ClassForm.tsx:183-199` input capacity (default 1 untuk private), `classActions.ts:128` mengirim `capacity`; academic `domain/class.go:37` `Capacity` deprecated `json:"-"`, `class.go:47` `CreateClassRequest` tanpa `capacity` | Private harus menonaktifkan capacity. Untuk group, field juga tidak disimpan (kapasitas nyata ada per jadwal, KEL-50) | Tidak ada issue aktif |
| Input jadwal | Implemented (slot manual) | web `ScheduleForm.tsx` (320 baris): slot manual `addScheduleSlot`, `DAYS_OF_WEEK`; payload `schedules[]` ke `POST /schedules`; academic `domain/schedule_dto.go:10-20` `ScheduleItemRequest` (capacity ≥1, day 1–7, start/end) | Tidak ada generator hari + jam mulai/selesai + lama sesi + jeda. Backend tidak mengecek overlap (grep `overlap`: 0) | Tidak ada issue; KEL-50 menambah capacity per slot |
| Buat student dari detail kelas | Partial | web `EnrollmentPanel.tsx:38` saat student kosong hanya memberi link ke `/dashboard/parent/students?returnTo=…`; `returnTo` tidak dibaca di mana pun (grep: hanya baris ini); `StudentForm.tsx:33` reusable (`onCancel`); `students/_actions/actions.ts:10,54` hanya `revalidatePath('/dashboard/parent/students')` | Parent harus kembali mencari kelas | KEL-73 (dialog hapus student) selesai, scope berbeda |
| Cursor elemen klik | Not found (global) | Tailwind v4 (`package.json`), preflight `node_modules/tailwindcss/preflight.css:377-381` tanpa `cursor: pointer`; `app/globals.css` tanpa base rule; `cursor-pointer` hanya di 2 file dari 99 `<button>`; `RegisterFormSwitch.tsx:27-52` tab tanpa cursor | Perbaikan global base style | KEL-92 (a11y register) selesai, scope berbeda |
| Isolasi tenant / RBAC | carry-over `kel-plan-2`, belum diverifikasi ulang di luar area FOKUS | — | — | Project P-KEL-5 |

## 3. Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API request jadwal private (buat, list, tolak) | request 7 | Feature | Tinggi: kelas private dapat dijual sesuai jadwal yang disepakati | Tinggi | L | high: resource baru ber-scope tenant, authz parent/tenant | Tinggi | — | draft `private-schedule-request-api` |
| Form request jadwal dan status request parent | request 7, 6 | Feature | Tinggi | Tinggi | M | medium | Tinggi | API request | draft `parent-private-schedule-request-web` |
| Persetujuan tenant membuat enrollment, jadwal private, dan invoice | request 7 | Feature | Tinggi: langkah 2–4 alur | Tinggi | M | high: finansial, idempotensi, transaksi | Tinggi | API request, form parent | draft `approve-private-schedule-request` |
| Halaman tenant untuk review request | request 7 | Feature | Tinggi | Tinggi | M | medium | Tinggi | approve | draft `tenant-private-schedule-review-web` |
| Kirim payment link via email oleh tenant | request 7 | Feature | Sedang: parent sudah melihat tautan in-app lewat KEL-53 | Sedang | M | medium | Sedang | approve | tunda (melebihi MAKS_ISSUE) |
| Kirim payment link atau rekomendasi via chat | request 2, 7 | Feature | Tinggi | Sedang | L | very-high | Rendah | keputusan arsitektur chat | tunda (butuh keputusan) |
| Usulan jadwal alternatif terstruktur (counter-proposal) | request 7 | Feature | Sedang | Sedang | M | medium | Rendah | keputusan siapa yang mengusulkan | tunda (butuh keputusan); sementara tenant menulis alasan dan parent mengajukan request baru |
| Payment page sendiri (VA/QRIS) | request 1 | Feature | Tinggi | Sedang | L | very-high: financial correctness, channel eksternal | Sedang | keputusan channel; aktivasi channel merchant Duitku | tunda (butuh keputusan) |
| Buat student lewat modal di detail kelas | request 6 | Improvement | Tinggi: konversi enrollment | Tinggi | S | low | Tinggi | — | draft `create-student-modal-class-detail` |
| Generator jadwal mingguan | request 5 | Feature | Sedang–tinggi untuk tenant | Sedang | M | medium | Tinggi | — | draft `weekly-schedule-slot-generator` |
| Capacity nonaktif untuk kelas private | request 4 | Improvement | Sedang | Sedang | S | low | Tinggi | — | draft `disable-capacity-private-class-form` |
| Cursor pointer global | request 3 | Improvement | Rendah–sedang | Rendah | S | very-low | Tinggi | — | draft `pointer-cursor-clickable-elements` |
| Field capacity kelas group tidak disimpan backend | discovery | Improvement | Sedang (UI menyesatkan) | Rendah | S | low | Tinggi | keputusan produk | tunda (pertanyaan terbuka) |
| Validasi overlap jadwal dalam satu kelas | discovery | Improvement | Sedang | Rendah | M | medium | Sedang | — | tunda (melebihi MAKS_ISSUE) |

## 4. Status permintaan feature

| Request | Status | Bukti | draftKey / identifier |
| --- | --- | --- | --- |
| 1. Payment page tanpa redirect `paymentUrl` | butuh keputusan | billing `transaction_usecase.go:290` (`VC`), `payment_gateway.go:18-21`; `VC` butuh 3DS redirect | — |
| 2. Chat service tenant–parent | butuh keputusan | Not found di semua repo; kontrak hanya 5 repo | — |
| 3. Cursor pointer tab register dan elemen klik | didraft | preflight Tailwind v4, `RegisterFormSwitch.tsx:27-52` | `pointer-cursor-clickable-elements` |
| 4. Private menonaktifkan capacity | didraft | `ClassForm.tsx:183-199`, `class.go:37,47` | `disable-capacity-private-class-form` |
| 5. Generator jadwal hari + jam + lama sesi + jeda | didraft | `ScheduleForm.tsx`, `schedule_dto.go:10-20` | `weekly-schedule-slot-generator` |
| 6. Modal buat student di detail kelas | didraft | `EnrollmentPanel.tsx:38`, `StudentForm.tsx:33` | `create-student-modal-class-detail` |
| 7. Alur private class (request → review → payment link → bayar → aktif) | didraft sebagian | lihat §2 | `private-schedule-request-api`, `parent-private-schedule-request-web`, `approve-private-schedule-request`, `tenant-private-schedule-review-web`. Bagian email ditunda (kuota); chat dan counter-proposal terstruktur butuh keputusan |
