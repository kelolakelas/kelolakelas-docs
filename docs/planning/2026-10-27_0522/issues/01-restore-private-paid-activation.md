## Background / Problem

Manual testing 25 Oktober 2026: setelah request jadwal private disetujui dan parent membayar lewat link admin, Enrollment & Pembayaran menampilkan enrollment “Menunggu aktivasi” dan pembayaran “Pembayaran diterima”. Pembayaran seharusnya menghasilkan akses belajar sesuai lifecycle yang berlaku. Penyebab runtime belum direproduksi; jangan menyimpulkan aktivasi belum diimplementasikan.

## Goal

Pulihkan alur pembayaran private terkonfirmasi hingga enrollment aktif, dengan diagnosis berbukti dan pemulihan aman jika aktivasi tertunda.

## Requirements

- Reproduksi satu alur request→approval→invoice→pembayaran→aktivasi dan korelasikan request, enrollment, transaction, reconciliation job serta request ID; gunakan fixture/sandbox tanpa data sensitif.
- Bedakan enrollment benar-benar pending di academic dari tampilan web stale. Tentukan penyebab sebelum memperbaiki owner code/configuration yang relevan.
- Gunakan durable reconciliation, retry, observability dan re-drive existing. Paid hanya berdasarkan konfirmasi provider sah; UI tidak boleh memalsukan enrollment aktif berdasarkan status paid.
- Perbaikan mempertahankan idempotency invoice, enrollment, wallet/ledger, kapasitas dan session; tampilkan status proses/gagal beserta langkah pemulihan yang sesuai kewenangan.
- Update dokumentasi callback/operasi/web dan bukti penerimaan sesuai perubahan aktual.

## Acceptance Criteria

- [ ] Alur private baru dengan pembayaran sah mencapai persisted enrollment active dan tampil aktif pada parent serta tenant setelah refresh normal; seluruh jadwal yang disepakati tetap tersimpan.
- [ ] Laporan diagnosis mencakup sebelum/sesudah pada setiap hop dan menjelaskan apakah akar masalah berada pada callback, linkage, worker, internal activation atau pembacaan UI.
- [ ] Gangguan academic sementara tidak menghilangkan owed activation; setelah layanan pulih, retry menyelesaikan aktivasi sesuai konfigurasi worker yang diuji.
- [ ] Terminal failure dapat didiagnosis dan dipulihkan lewat re-drive existing tanpa invoice/pembayaran baru; tidak ada blanket update status/data.
- [ ] Replay/concurrent callback dan replay activation tidak menggandakan efek pembayaran, enrollment atau session.
- [ ] Status pending/reconciling/failed tetap akurat; pembayaran belum terkonfirmasi, ownership salah dan terminal enrollment tidak diaktifkan secara paksa.

## Technical Notes

Complexity high: financial correctness dan transisi lintas service; mitigasi dengan korelasi state, replay/outage acceptance dan owner fix minimal. KEL-8 dan KEL-29 sudah Done untuk fondasi durable activation/re-drive; KEL-215 Done membahas approval/invoice, bukan kasus pascapembayaran ini.

Relevant areas:
- kelolakelas-billing-service/internal/usecase/transaction_usecase.go:854,908,970 — durable job dan inline dispatch setelah commit.
- kelolakelas-billing-service/internal/usecase/reconciliation_worker.go:156; internal/usecase/reconciliation_admin_usecase.go:56 — retry dan requeue.
- kelolakelas-billing-service/pkg/academic/client.go:40 — internal activation ber-credential dan timeout.
- kelolakelas-academic-service/internal/usecase/enrollment_usecase.go:457 — locked idempotent activation.
- kelolakelas-web/lib/payment-status.ts:119; app/(dashboard)/dashboard/tenant/enrollments/_lib/schema.ts:63 — label existing.
- kelolakelas-docs/docs/flows/payment-callback.md:114; docs/08-known-gaps-and-risks.md:27.

Tidak membaca konfigurasi secret ke artefak. Verifikasi worker enabled, service reachability/credential melalui hasil health/request yang disanitasi. Kebutuhan environment bukan dependency issue fiktif. Bila data historis rusak ditemukan, dokumentasikan diagnosis dan rencana perbaikan terpisah sebelum operasi data konsekuensial. Masalah proyeksi jadwal di issue02 independen; jangan menutupi failure activation dengan perubahan label.

## Edge Cases

- Callback datang setelah invoice expired atau release sedang berjalan; enrollment dropped/ended tetap mengikuti kontrak existing.
- Job sudah active tetapi response academic hilang, worker restart, terminal_failed, atau browser belum refresh.
- Invoice renewal dibanding initial private; tenant/student/enrollment mismatch.
- Provider status pending/failed atau verification unavailable.

## Testing / Validation

- [ ] Regression test pada akar masalah dan kontrak lintas service yang terdampak.
- [ ] Integration test pembayaran sah, paid replay/concurrent, worker restart/outage/requeue, dan terminal enrollment refusal.
- [ ] Real-flow sandbox acceptance parent request→admin approve→bayar→persisted active→UI parent/tenant dengan correlation IDs disanitasi.
- [ ] Group enrollment, renewal dan refund existing tetap lulus checks relevan.
- [ ] Go tests/race checks, formatter/lint dan web tests/lint/typecheck/build sesuai repository yang berubah.
- [ ] Required GitHub PR CI sukses dan required review terpenuhi sebelum merge; dokumentasi/bukti penerimaan diperbarui.

## Out of Scope

- Implementasi ulang payment provider, rekonsiliasi baru atau auto refund.
- Mengubah arti paid/active, memaksa status melalui UI, atau koreksi massal data historis.
- Proyeksi jadwal private pada tabel (issue02).
