## Background / Problem

Testing lokal 24 Oktober 2026: tenant admin melaporkan setiap percobaan menyetujui request di [http://localhost:3000/dashboard/tenant/schedule-requests](http://localhost:3000/dashboard/tenant/schedule-requests) gagal. Approval sudah terimplementasi; ini investigasi regresi, bukan pembuatan flow baru. Status HTTP, request ID, dan akar masalah belum diketahui.

## Goal

Tenant berizin dapat menyetujui request private yang valid dan parent memperoleh enrollment serta invoice yang dapat dibayar, dengan retry aman.

## Requirements

- Reproduksi menggunakan pending request milik tenant aktif; catat tahap gagal dan korelasi respons/log browser → server action → gateway → academic → billing tanpa secret atau data pribadi.
- Buktikan akar masalah dan perbaiki pada komponen pemiliknya; periksa validitas request/kelas, permission, channel tersimpan, email token, kontrak invoice, dan konfigurasi/provider hanya bila evidence mengarah ke sana.
- Pertahankan isolasi tenant, enrollment:update, validasi slot, kapasitas private 1, payment method tersimpan, dan identitas retry existing.
- Bedakan approval tersimpan tetapi invoice belum tersedia dari sukses lengkap. Error harus dapat ditindaklanjuti dan retry tidak menggandakan enrollment, jadwal, sesi, atau invoice.

## Acceptance Criteria

- [ ] Pending request valid dapat disetujui melalui halaman yang dilaporkan; state UI dan backend konsisten, invoice/payment tersedia dan dapat dibuka oleh parent yang berhak.
- [ ] Akar masalah tercatat dengan bukti tersanitasi sebelum/sesudah; tidak menyatakan provider atau konfigurasi sebagai penyebab tanpa trace.
- [ ] Klik berulang, retry setelah timeout/response hilang, dan reload memakai identitas pembelian yang sama tanpa duplikasi.
- [ ] Request tenant lain atau admin tanpa izin ditolak tanpa mutasi; request tidak valid dan penolakan bisnis tetap mendapat pesan yang sesuai.
- [ ] Transient billing failure menampilkan status pemulihan yang jujur dan dapat dilanjutkan sesuai kontrak existing; tidak ada sukses palsu atau kebutuhan reset data manual.

## Technical Notes

Fakta source: approval mengunci request tenant, menyimpan enrollment/jadwal/sesi dan status approved sebelum billing I/O; kegagalan invoice tidak selalu berarti approval belum tersimpan. Stable retry key private-request:<id>. Risiko utama financial correctness dan partial failure; validasi persistence + invoice/replay, bukan hanya toast. Kedua failure pada run ini mungkin berbagi billing, tetapi belum terbukti dan tidak menjadi blocker satu sama lain. Label repository menandai area investigasi; perubahan dibatasi pada penyebab yang terbukti, tidak diwajibkan mengubah semua repository.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests/_actions/actions.ts:90`
- `kelolakelas-academic-service/internal/delivery/http/handler/private_schedule_request_handler.go:177`
- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go:97`
- `kelolakelas-academic-service/pkg/billing/client.go:102`
- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go:245`
- `kelolakelas-api-gateway/internal/delivery/http/router.go:237`

Perbarui docs/components/web.md, docs/api/academic.md dan flow terkait bila behavior/recovery berubah; catat konfigurasi hanya nama variabel dan cara verifikasinya. Ikuti docs/CONTRIBUTING.md.

Related work (Done; bukan blocker): KEL-108, KEL-110, KEL-133.

## Edge Cases

- Approval bersamaan; request sudah approved/rejected/cancelled; slot tidak valid atau bertabrakan.
- Timeout setelah commit atau setelah provider menerima invoice; channel kosong historis; fee policy menolak.
- Billing/email/provider tidak tersedia; kiriman email gagal tidak boleh disamakan dengan invoice gagal.

## Testing / Validation

- [ ] Regresi otomatis pada penyebab terkonfirmasi; jalankan coverage approval/replay/fee rejection serta concurrency PostgreSQL yang relevan.
- [ ] Verifikasi real local stack browser → gateway → academic → billing → persistence → parent payment dengan fixture sintetis; sertakan error path dan safe retry.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Redesign flow private, invoice regeneration policy baru, channel switching invoice aktif, atau pengiriman chat/email baru.
- Perbaikan checkout lain yang tidak terbukti terkait; reset/backfill data atau perubahan kredensial tanpa scope tersendiri.
