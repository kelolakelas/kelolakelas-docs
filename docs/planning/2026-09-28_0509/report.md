# Report — run 2026-09-28_0509

## Ringkasan eksekutif

- **Bukti utama.**
  - Kelas private kini dibeli langsung tanpa jadwal (academic `internal/usecase/enrollment_usecase.go:168,217`).
  - Jadwal private hanya dapat dibuat setelah enrollment ada dan tidak punya UI tenant (`schedule_usecase.go:221-239`, web `ClassCreationWizard.tsx:26-52`).
  - Checkout selalu memakai hosted Duitku dengan metode `VC` (billing `transaction_usecase.go:290`).
  - Tidak ada kode chat di repo mana pun.
- **Current state yang paling penting.** Fondasi untuk alur private sudah ada dan dapat dipakai ulang, sehingga alur request, review, bayar, dan aktif dapat dibangun tanpa perubahan billing:
  - enrollment `pending` beserta invoice (`EnrollStudent`/`EnrollPublic`);
  - aktivasi dan pelepasan internal (`cmd/server/routes.go:94-95`);
  - generator sesi untuk jadwal private (`docs/flows/academic.md:38`);
  - tautan "Lanjutkan pembayaran" untuk parent (KEL-53).
- **Batasan discovery.**
  - Mode `full` otomatis karena belum ada `baseline.json` sebelumnya, tetapi scope dibatasi pada area permintaan.
  - URL lampiran localhost tidak dapat diakses (dev server mati), sehingga dianalisis dari source.
  - Discovery memakai probe read-only terstruktur, bukan subagent paralel.
  - Repo docs dalam kondisi dirty (artefak planning untracked), sehingga tidak di-pull, walaupun sudah sama dengan `origin/main`.
- **Asumsi yang dipakai (belum dikonfirmasi owner; pertanyaan klarifikasi timeout tanpa jawaban):**
  1. Permintaan jadwal menggantikan checkout langsung untuk kelas private.
  2. Penolakan hanya membawa alasan; parent mengajukan permintaan baru.
  3. Selama chat dan email belum tersedia, tenant membagikan payment link secara manual dan parent melihatnya di halaman status enrollment.

## Prioritas dan urutan eksekusi

Urutan ada di `backlog.md`.

- **Project `private-class-scheduled-purchase`.** Keempat issue di project ini berurutan secara dependency:
  1. API request/tolak;
  2. persetujuan (enrollment, jadwal, dan invoice);
  3. UI parent (paralel dengan persetujuan setelah API selesai);
  4. UI tenant.
- **Alasan prioritas.** Alur private adalah permintaan owner yang paling bernilai bisnis sekaligus yang memiliki risiko finansial dan isolasi tenant, sehingga complexity `high` pada dua issue API.
- **Quick win tanpa dependency.** Empat issue web berikut dapat berjalan paralel sejak awal:
  - modal student (High, langsung menaikkan konversi enrollment);
  - generator jadwal;
  - capacity private;
  - cursor pointer.

## Status permintaan feature

| Request | Status | draftKey / alasan |
| --- | --- | --- |
| Payment page tanpa redirect | butuh keputusan | `VC` (kartu kredit) wajib redirect 3DS. Halaman sendiri hanya realistis untuk VA/QRIS (`vaNumber`/`qrString`), sehingga perlu keputusan channel dan aktivasi channel merchant Duitku. |
| Chat service tenant–parent | butuh keputusan | Tidak ada fondasi. Perlu dipilih antara modul di academic dan repo/service baru (repo baru di luar kontrak `repositories` v1). |
| Cursor pointer | didraft | `pointer-cursor-clickable-elements` |
| Private menonaktifkan capacity | didraft | `disable-capacity-private-class-form` |
| Generator jadwal | didraft | `weekly-schedule-slot-generator` |
| Modal student di detail kelas | didraft | `create-student-modal-class-detail` |
| Alur private class | didraft sebagian | `private-schedule-request-api`, `approve-private-schedule-request`, `parent-private-schedule-request-web`, `tenant-private-schedule-review-web`. Pengiriman payment link lewat email ditunda karena kuota. Pengiriman lewat chat dan usulan jadwal alternatif terstruktur butuh keputusan. |

## Kandidat yang tidak dibuat

- **Kirim payment link via email oleh tenant:** melebihi MAKS_ISSUE. Kandidat utama run berikutnya: billing sudah punya pola email payment link (`subscription_worker.go:209-233`, `ClaimPaymentLinkEmail`).
- **Chat dan pengiriman via chat:** menunggu keputusan arsitektur.
- **Usulan jadwal alternatif terstruktur:** menunggu keputusan siapa yang mengusulkan.
- **Payment page VA/QRIS:** menunggu keputusan channel.
- **Field capacity kelas group yang tidak disimpan backend:** menunggu keputusan (hapus dari form atau pertahankan).
- **Validasi overlap jadwal di academic:** melebihi MAKS_ISSUE, dengan dampak rendah–sedang.

## Hasil penulisan Linear

Owner menyetujui semua draft pada 2026-09-28. Read-back setiap item dicocokkan dengan payload (`verify-readback.py`: contract, judul, label repo+type, project, relasi `blockedBy`), hasilnya PASS. Label `ai-ready` ditambahkan setelah verifikasi.

| draftKey | Linear | Blocked by |
| --- | --- | --- |
| project `private-class-scheduled-purchase` | P-KEL-22 | — |
| `private-schedule-request-api` | KEL-107 | — |
| `approve-private-schedule-request` | KEL-108 | KEL-107 |
| `parent-private-schedule-request-web` | KEL-109 | KEL-107 |
| `tenant-private-schedule-review-web` | KEL-110 | KEL-108 |
| `create-student-modal-class-detail` | KEL-111 | — |
| `weekly-schedule-slot-generator` | KEL-112 | — |
| `disable-capacity-private-class-form` (revisi 2026-09-28: hapus field kapasitas semua tipe) | KEL-113 | — |
| `pointer-cursor-clickable-elements` | KEL-114 | — |
| `private-schedule-recommendation-api` (revisi 2026-09-28) | KEL-115 | KEL-108 |
| `private-schedule-recommendation-web` (revisi 2026-09-28) | KEL-116 | KEL-115, KEL-109, KEL-110 |

Revisi 2026-09-28 mengikuti keputusan owner soal penolakan jadwal. Deskripsi P-KEL-22, KEL-107, KEL-109, dan KEL-110 diperbarui, KEL-115 dan KEL-116 dibuat. Read-back 11 item dicek ulang dengan `verify-readback.py` dan hasilnya PASS. Setelah itu KEL-115 dan KEL-116 diberi label `ai-ready`.

Pertanyaan terbuka 3 dan 4 sudah dijawab owner (lihat di bawah). Jawaban 4 sesuai draft. Jawaban 3 menuntut revisi KEL-107, KEL-109, KEL-110, dan Project P-KEL-22, serta dua issue baru.

## Pertanyaan terbuka

1. **Payment page:** TERJAWAB 2026-09-28. VA dan QRIS ditampilkan di halaman KelolaKelas sendiri, dan kartu kredit tetap tersedia sebagai opsi redirect ke `paymentUrl`. Kandidat run berikutnya. Syaratnya, channel VA/QRIS harus aktif di akun merchant Duitku.
2. **Chat:** TERJAWAB 2026-09-28. Chat dibangun sebagai service dan repo baru `kelolakelas-chat-service`. Kandidat run berikutnya. Sebelum issue dapat berlabel `ai-ready`, dua prasyarat harus dipenuhi: (a) repo dibuat dan kontrak `repositories` di `kelolakelas-ai-orchestrator/src/intake/planning-contract.ts` diperluas; (b) topologi deployment dan routing gateway ditentukan.
3. **Penolakan jadwal:** TERJAWAB 2026-09-28. Tenant dapat menolak begitu saja atau menolak dengan rekomendasi jadwal lain. Revisi lokal: alasan penolakan menjadi opsional di KEL-107/KEL-109/KEL-110, ditambah dua draft baru `private-schedule-recommendation-api` dan `private-schedule-recommendation-web` (melebihi MAKS_ISSUE 8 karena keputusan owner). Sudah diterapkan ke Linear (KEL-115, KEL-116).
4. **Checkout langsung kelas private:** TERJAWAB 2026-09-28. Owner mengonfirmasi bahwa kelas private hanya dapat dibeli lewat pengajuan jadwal yang disetujui tenant, dan checkout langsung dihapus. KEL-107 dan KEL-109 sudah sesuai, tidak perlu revisi.
5. **Field capacity kelas group:** TERJAWAB 2026-09-28. Field kapasitas dihapus dari form kelas, dan kapasitas hanya diisi per jadwal. Keputusan ini mengubah scope KEL-113 dari "nonaktif untuk private" menjadi "hapus field untuk semua tipe". KEL-113 sudah direvisi di Linear (judul + deskripsi); read-back `verify-readback.py` PASS, label `ai-ready` tetap.
