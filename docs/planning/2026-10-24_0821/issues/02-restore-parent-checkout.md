## Background / Problem

Testing lokal 24 Oktober 2026: parent selalu gagal saat klik Lanjut ke pembayaran di [http://localhost:3000/kelas/cd6c5a6f-c4af-449e-adb1-d6f6675a34ac](http://localhost:3000/kelas/cd6c5a6f-c4af-449e-adb1-d6f6675a34ac). Checkout sudah tersedia, tetapi respons error dan tahap gagalnya belum disertakan. Tipe dan eligibility kelas pada runtime belum diverifikasi.

## Goal

Parent dapat melanjutkan pembelian yang valid dari detail kelas ke invoice/payment sesuai channel pilihannya, serta memahami dan memulihkan error yang sah.

## Requirements

- Reproduksi URL yang dilaporkan dengan parent, student miliknya dan pilihan jadwal/channel yang valid. Konfirmasi tipe kelas terlebih dahulu; private tetap mengikuti request-first dan tidak dilewatkan melalui group checkout.
- Telusuri browser → server action → gateway → academic → billing/provider, termasuk payload, status, respons dan persistence secara tersanitasi; buktikan penyebab sebelum memperbaiki.
- Pertahankan idempotency key, validasi ownership/publikasi/kapasitas, pilihan billing cycle/channel/voucher dan input retention KEL-194.
- Invoice VA/QRIS tetap ditampilkan di halaman KelolaKelas bila didukung; kartu tetap mengikuti URL payment terverifikasi sesuai perilaku existing. Jangan melaporkan sukses bila respons pembayaran tidak lengkap.

## Acceptance Criteria

- [ ] Dengan kondisi pembelian valid, tombol pada URL laporan mencapai pembayaran yang sesuai dan enrollment terhubung ke invoice yang benar.
- [ ] Bukti reproduksi, akar masalah, perubahan minimum dan hasil ulang dicatat; provider sandbox 404 historis KEL-194 tidak dianggap penyebab Oct24 tanpa verifikasi baru.
- [ ] Gagal validasi, unavailable billing/provider, fee/voucher rejection dan respons tidak lengkap memberi pesan actionable serta mempertahankan pilihan parent.
- [ ] Retry, double click, timeout dan reload tidak menghasilkan enrollment/invoice atau reservasi kursi ganda; state yang sudah tersimpan dapat dipulihkan.
- [ ] Parent lain tidak dapat memakai student/enrollment tersebut; private request-first, sold-out, unpublished dan duplicate enrollment tetap ditangani sesuai kontrak.

## Technical Notes

Current implementation: catalog enrollment memerlukan parent session dan Idempotency-Key, membuat pending enrollment lalu meminta invoice. Source dapat mengembalikan generic invoice error setelah enrollment tersimpan. Risiko utama financial correctness, kursi tertahan, dan duplicate invoice; mitigasi lewat real persistence/replay/error-path validation. Akar masalah runtime Unknown. Label web/academic/billing menunjukkan area investigasi, bukan mandat untuk mengubah ketiganya. Fixture-ids.json lokal diperiksa hanya untuk dua UUID laporan; tidak ditemukan kecocokan, sehingga tidak ada klaim tipe atau kondisi fixture.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts:52`
- `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go:176`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go:173`
- `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go:381`
- `kelolakelas-billing-service/pkg/duitku/client.go:85`
- `kelolakelas-api-gateway/internal/delivery/http/router.go:232`

Perbarui docs/components/web.md dan kontrak/flow akademik-billing bila hasil investigasi mengubah behavior atau pemulihan. Dokumen checkout lama tentang redirect harus dibaca bersama behavior channel terbaru, bukan mengembalikan seluruh channel ke redirect.

Related work (Done; bukan blocker): KEL-14, KEL-194, KEL-106.

## Edge Cases

- Kelas private atau tidak eligible; student bukan milik parent; kapasitas habis saat submit.
- Response invoice hilang setelah sukses; claim invoice masih aktif; expired invoice atau duplicate enrollment.
- Fee policy/voucher rejection; email/channel tidak valid; provider timeout atau non-2xx.

## Testing / Validation

- [ ] Tambahkan regresi untuk akar masalah; jalankan checkout idempotency, fee/voucher release dan payment-channel tests yang relevan.
- [ ] Verifikasi browser real local stack sampai invoice/payment, termasuk state database dan retry setelah kegagalan; jangan memakai action double saja sebagai bukti flow selesai.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Redesign pembayaran, provider baru, perubahan pricing/fee/voucher policy atau bypass validasi.
- Approval private ditangani issue terpisah; tidak ada migrasi/reset data atau asumsi perbaikan konfigurasi provider sebelum evidence.
