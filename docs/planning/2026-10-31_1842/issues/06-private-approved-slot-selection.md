## Background / Problem

Approval private sekarang tidak memiliki body seleksi dan mengambil seluruh proposed slots. Form admin hanya mengirim request ID. Pengguna menginginkan tenant memilih slot mana yang disetujui, sesuai batas kelas; hanya slot terpilih menjadi tempat/waktu kelas diselenggarakan.

## Goal

Tenant menyetujui subset valid dari usulan parent dan hanya subset tersebut yang menjadi jadwal enrollment, sessions serta informasi keputusan kepada parent.

## Requirements

- Bergantung pada `private-approved-slot-limit` yang sudah merged ke main; jangan implementasi melawan branch dependency tanpa stacked PR yang disetujui.
- Tampilkan seluruh usulan beserta tanggal/hari/jam relevan dan batas N pada dialog review; sediakan pilihan eksplisit dan ringkasan sebelum approve.
- Untuk N=1 hanya satu slot bisa dipilih/disetujui; untuk N>1 pilih 1..N. Jangan otomatis menyetujui semua atau memilih slot pertama tanpa keputusan admin.
- Perluas kontrak approval existing untuk mereferensikan subset usulan secara unambiguous. Karena slot belum mempunyai identity persisted, tentukan referensi stabil atau validasi snapshot/index dengan perlindungan stale request; jangan menerima jadwal arbitrer di luar request.
- Validasi membership, duplikasi, kosong, count, tenant authorization dan timetable existing di server. Pertahankan usulan asli terpisah dari pilihan keputusan agar audit/review/replay tidak ambigu.
- Simpan pilihan dan materialisasi jadwal atomik. Jadwal tidak terpilih tidak menjadi schedule/session/enrollment aktif; jangan memperlakukannya sebagai request terpisah yang masih menunggu.
- Downstream enrollment/dashboard/chat approval/payment summary harus menggunakan jadwal yang benar-benar dipilih, bukan seluruh usulan. Pertahankan harga kelas existing; tidak prorata/multiply berdasarkan slot.
- Approval yang diulang memakai pilihan tersimpan; pilihan berbeda pada retry yang sudah dimaterialisasi ditolak jelas tanpa side effect. Timeout invoice tetap dapat direcover tanpa menggandakan purchase artifacts.
- Dokumentasikan kompatibilitas bodyless client: legacy tanpa limit mempertahankan existing; kelas berbatas tidak boleh melewati N. Update web dan API secara berurutan agar client lama mendapatkan error yang jelas saat seleksi wajib.
- Penerimaan rekomendasi mengikuti cap dan selected timetable yang telah disepakati pada issue fondasi; tidak menambah tenant recommendation/parent consent flow baru.

## Acceptance Criteria

- [ ] Kelas N=1, parent mengusulkan tiga slot, tenant memilih slot kedua: tepat satu schedule beserta sessions-nya dibuat, hanya waktu slot kedua ditampilkan/diumumkan.
- [ ] Kelas N=2, parent mengusulkan tiga slot: tenant dapat memilih dua, tidak dapat menyetujui kosong atau tiga melalui UI maupun API langsung.
- [ ] ID/referensi bukan milik usulan, duplikasi, stale payload, tenant asing atau status non-pending ditolak tanpa materialization baru.
- [ ] Usulan awal tetap dapat dibedakan dari subset approved pada read model; enrollment, ringkasan pembayaran dan event chat tidak menampilkan slot yang dibuang sebagai approved.
- [ ] Submit ganda/concurrent menghasilkan satu keputusan, satu enrollment dan subset schedule yang sama; replay berbeda ditolak dan replay sama dapat recover invoice failure.
- [ ] Nilai invoice/harga dan callback aktivasi existing tetap benar; group checkout dan recommendation flow tidak mengalami regresi.
- [ ] Error/loading/cancel dialog tidak menghapus usulan atau mengklaim approval sukses sebelum hasil server.

## Technical Notes

- Handler tidak bind approval body: `kelolakelas-academic-service/internal/delivery/http/handler/private_schedule_request_handler.go:190`; usecase signature `internal/usecase/private_schedule_request_usecase.go:89`.
- Original slots JSON tanpa selected identity: `internal/domain/private_schedule_request.go:42`; `migrations/00001790600000_private_schedule_requests.up.sql:1`.
- All-slots materialization `internal/usecase/private_schedule_request_usecase.go:163`, `:180`; price snapshot `:187`, invoice `:225`. Lock scoped tenant: `internal/repository/private_schedule_request_repository.go:95`.
- Chat capture memakai seluruh proposal/recommendation: `internal/repository/private_chat_capture.go:80`. Perbaikan semantic event berada di academic; tidak ada bukti perubahan chat-service diperlukan.
- UI/action: `kelolakelas-web/app/(dashboard)/dashboard/tenant/schedule-requests/_components/ApproveScheduleRequestDialog.tsx:196`, `_actions/actions.ts:103`.
- Gateway raw-body forwarding existing; perlu test payload, bukan endpoint baru (`kelolakelas-api-gateway/internal/delivery/http/router_test.go:91`, `:133`).
- Risiko high: partial approval dapat mendesinkronkan schedules, invoice retry dan chat. Mitigasi: immutable selection, transaction/concurrency checks, selected-only projection tests, serta fault injection invoice. Tuliskan ADR kontrak/persistence dan rollout kompatibel sebelum coding.
- Related Done: KEL-215 approval/retry, KEL-222 schedule projection, KEL-221 paid activation, KEL-226 lifecycle chat. Bukan blocker native karena sudah Done dan bukan duplikat karena tidak menyediakan cap/subset.
- Update docs API academic, schema request, private flow, projection/chat semantics, web, ADR dan evidence snapshot/index. Jangan mengarang nama field/endpoint baru sebelum desain kontrak disepakati.

## Edge Cases

- Pilihan berubah saat approval pertama sukses di DB tetapi invoice timeout: jangan mengubah purchase intent tersimpan.
- Limit kelas berubah antara dialog dibuka dan submit; server menolak dan UI memberi informasi terbaru.
- Proposal memiliki waktu berurutan/berulang, snapshot lama atau lebih dari N; jangan mengandalkan display label sebagai identity.
- Session generation/retry berjalan saat keputusan diproses; tidak ada sessions dari slot tidak terpilih atau schedule history yang dihitung ulang sebagai pilihan baru.

## Testing / Validation

- [ ] Update `internal/usecase/private_schedule_approval_test.go:113` yang saat ini mengharapkan dua proposal menjadi dua schedule; tetap test legacy all-slots secara eksplisit.
- [ ] Tambahkan subset valid/invalid, empty/duplicate/>N/foreign reference, selected-only chat/projection dan harga tetap.
- [ ] Jalankan PostgreSQL concurrency tests (`internal/usecase/private_schedule_approval_postgres_test.go:19`, memerlukan `KEL108_TEST_DSN`) dengan kasus pilihan sama/berbeda serta invoice retry.
- [ ] Regresi recommendation (`private_schedule_recommendation_test.go:13`), paid activation/callback dan session generation.
- [ ] Test UI checkbox/radio, counter/error/loading, keyboard dan payload; uji E2E parent submit -> tenant select -> approved schedule -> pembayaran/aktivasi sesuai flow existing.
- [ ] Jalankan formatter/lint/typecheck/test repos terkait dan pastikan required GitHub CI checks/review seluruh PR sukses sebelum merge dan closure Linear.

## Out of Scope

- Harga per slot, refund otomatis, tutor availability engine, jadwal arbitrer di luar usulan, perubahan payment provider, kapasitas murid, atau menyetujui tanpa parent consent pada flow rekomendasi.
