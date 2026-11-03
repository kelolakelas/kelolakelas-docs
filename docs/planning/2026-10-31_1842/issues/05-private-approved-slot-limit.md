## Background / Problem

Tenant belum dapat menetapkan berapa slot jadwal private yang diperbolehkan untuk satu enrollment. Class capacity/private capacity=1 adalah jumlah peserta, bukan jumlah slot. Testing 31 Oktober 2026 meminta setting saat membuat kelas: jika batas 1, beberapa usulan parent tidak boleh semuanya menjadi jadwal belajar.

## Goal

Tenant dapat mengatur batas maksimum slot jadwal yang disetujui per request/enrollment private, dan backend menegakkannya tanpa merusak jadwal atau pembayaran existing.

## Requirements

- Tambahkan setting private pada create/edit class, termasuk jalur composite create, penyimpanan dan read model yang dipakai form/detail/review.
- Semantik draft untuk disetujui: N adalah maksimum slot jadwal mingguan distinct untuk satu approval/enrollment, bukan kapasitas murid, jumlah sesi hasil generate, jumlah usulan parent atau kuota global semua enrollment.
- Kelas private baru wajib memiliki integer positif; default form yang diusulkan 1, tetap dapat diubah tenant. Jangan menciptakan batas numerik maksimum baru tanpa alasan kontrak/data.
- Kelas legacy boleh tidak memiliki setting dan mempertahankan perilaku lama sampai tenant menetapkannya; jangan backfill seluruh kelas menjadi 1 diam-diam.
- Tegakkan batas di server pada approval dan penerimaan rekomendasi, di bawah transaction/lock yang sesuai; jangan hanya membatasi checkbox frontend.
- Untuk kelas yang sudah memiliki batas, keputusan mengambil 1..N slot. Parent tetap boleh mengusulkan beberapa slot menurut validasi existing. Jika bodyless approval existing hendak mengambil lebih dari N, tolak jelas tanpa side effect, bukan truncate atau meloloskan seluruhnya.
- Batas terbaru berlaku pada keputusan pending yang belum dimaterialisasi; perubahan batas tidak menghapus/mengubah enrollment, sessions, invoice atau pilihan yang telah dimaterialisasi untuk retry.
- Group class dan makna capacity existing tetap tidak berubah. Penanganan field private ketika ganti tipe kelas harus eksplisit dan diuji.

## Acceptance Criteria

- [ ] Create private N=1 dan N>1 melalui form/API tersimpan dan terbaca lagi, termasuk composite create dan edit.
- [ ] Nilai 0, negatif, pecahan atau format invalid ditolak tanpa perubahan parsial; omission legacy kompatibel sesuai kebijakan terdokumentasi.
- [ ] Approval/penerimaan rekomendasi yang melebihi batas ditolak atomik tanpa enrollment/schedule/session/invoice/chat approval baru.
- [ ] Jumlah slot tidak dihitung dari jumlah sesi bulanan atau schedule history hasil reschedule.
- [ ] Parent dapat tetap mengirim beberapa usulan; UI tidak mengklaim semua otomatis disetujui.
- [ ] Kelas legacy/group dan retry approval yang sudah menghasilkan purchase artifacts tidak diubah oleh migrasi atau edit limit.
- [ ] Read/write lintas tenant, termasuk stale form setelah limit diubah, tidak dapat melewati otorisasi/validasi server.

## Technical Notes

- Tidak ada field N saat ini: `kelolakelas-academic-service/internal/domain/class.go:29`, `:48`, `:72`; `migrations/00000000000000_init_schema.up.sql:9`.
- Class form schema: `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_lib/schema.ts:127`.
- Approval seluruh slot dan session materialization: `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go:163`, `:191`, `:205`; recommendation path `:361`; tenant row lock `internal/repository/private_schedule_request_repository.go:95`.
- Gateway meneruskan raw body pada endpoint existing (`kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go:186`); tidak perlu endpoint atau typed DTO gateway baru. Tambahkan regression forwarding test jika kontrak field diperkenalkan.
- Risiko high: default/backfill mengubah komitmen belajar, race limit/approval, serta materialization sebelum invoice. Mitigasi: compatible nullable legacy, validation server atomik, immutable purchase artifacts saat retry, concurrency/invoice-failure tests. Detail alternatif dan keputusan final perlu ADR ringan sebelum coding.
- Update docs API/data class, flow private, web dan evidence index/snapshot sesuai perubahan executable. Setting ini fondasi issue `private-approved-slot-selection`; tanpa issue tersebut, parent dengan terlalu banyak usulan belum memiliki UI pemilihan subset.

## Edge Cases

- Tenant mengurangi N setelah request dibuat tetapi sebelum approval; UI refresh/error harus jujur.
- Limit diubah setelah approval tersimpan tetapi invoice gagal; retry tidak membuat jadwal baru atau menerapkan limit baru secara retroaktif.
- Rekomendasi lebih dari N harus ditolak sebelum menghasilkan keputusan yang tidak dapat diterima parent; tidak memangkas rekomendasi diam-diam.
- Kelas legacy dengan banyak slot berjalan atau group beralih menjadi private.

## Testing / Validation

- [ ] Unit/integration create/update/read, composite create, nilai invalid dan private/group compatibility.
- [ ] Migration forward/backward sesuai tooling repo, legacy nullable, serta data jadwal/invoice existing tidak diubah.
- [ ] Test concurrency approval vs update limit, limit pending, replay sesudah invoice timeout dan recommendation parity.
- [ ] Test isolasi tenant dan exact JSON forwarding gateway; jangan menduplikasi business validation di gateway.
- [ ] Jalankan formatter/lint/typecheck/test terkait, uji form end-to-end dan required GitHub CI checks/review sebelum merge.

## Out of Scope

- Pemilihan subset UI/API (issue berikutnya), pembatasan jumlah usulan menjadi N, kuota global kelas, harga per slot, perubahan billing atau perhitungan sesi bulanan.
- Mengubah validasi overlap usulan menjadi alternatif yang boleh saling overlap; perlu keputusan produk terpisah bila dibutuhkan.
