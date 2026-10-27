## Background / Problem

Manual testing 25 Oktober 2026: jadwal private yang disetujui admin tidak terlihat pada /dashboard/tenant/enrollments. Kode membuat private enrollment tanpa ScheduleID, lalu menghubungkan setiap schedule lewat EnrollmentID. Enrollment response dan join web hanya memahami schedule tunggal lewat ScheduleID; lookup web juga terbatas halaman pertama100. Ini gap proyeksi, bukan bukti jadwal gagal disimpan.

## Goal

Admin membaca seluruh jadwal private yang disepakati langsung dari Enrollment & Pembayaran dengan data authoritative dan kontrak grup tetap kompatibel.

## Requirements

- Sajikan seluruh schedule milik enrollment private melalui representasi additive yang disepakati; pertahankan field/semantik singular schedule_id dan schedule untuk grup.
- Gunakan scoped reads yang terikat tenant/enrollment; hindari client-side scan seluruh jadwal tenant, first-page truncation, dan N+1.
- Tabel desktop serta kartu mobile menampilkan hari, jam mulai–selesai dan periode efektif yang tersedia; teacher/location hanya jika sudah ada dan diizinkan.
- Bedakan tidak ada jadwal dari gagal membaca; jangan menghapus jadwal dari tampilan karena pembayaran masih pending activation.
- Dokumentasikan kontrak, aturan current/history/deletion sesuai lifecycle existing, consumer web, dan acceptance evidence.

## Acceptance Criteria

- [ ] Enrollment private dengan schedule_id=null menampilkan semua slot approved yang terkait EnrollmentID, termasuk lebih dari satu hari/jam.
- [ ] Slot tetap terlihat setelah pembayaran dan reload, dengan urutan stabil dan tanpa duplikasi versi; current/history mengikuti aturan yang didokumentasikan dan diuji.
- [ ] Jadwal enrollment lain atau tenant lain tidak bocor pada list/detail maupun UI.
- [ ] Data di luar halaman100 tetap muncul melalui scoped projection; jumlah query tidak bertambah satu per row enrollment.
- [ ] Group schedule_id/schedule dan konsumen existing tetap kompatibel, termasuk parent read bila contract mapper dipakai bersama.
- [ ] Empty/loading/error states dapat dibedakan dan layout mobile/desktop terbaca.

## Technical Notes

Evidence:
- kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go:187–205 — ownership private via EnrollmentID.
- kelolakelas-academic-service/internal/repository/enrollment_repository.go:215–232; internal/usecase/enrollment_usecase.go:738–758 — singular preload/mapper.
- kelolakelas-academic-service/internal/repository/enrollment_schedule_summary_test.go:98 — test lama sengaja tanpa schedule private.
- kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments/_queries/queries.ts:170–205; _lib/schema.ts:268,411; _components/EnrollmentTable.tsx:190,268.
- kelolakelas-docs/docs/components/web.md:252 — KEL-70 group-only.

KEL-70 dan KEL-33 Done adalah predecessor, bukan blocker. Jangan memasukkan salah satu private slot secara arbitrer ke ScheduleID: beberapa slot merupakan domain yang sah. Existing gateway enrollment proxy cukup untuk additive response; perubahan gateway tidak diwajibkan. Detail bentuk collection diputuskan setelah meninjau konsumen, kemudian dokumentasikan API/schema/web.

## Edge Cases

- Beberapa slot, perubahan versi/effective date, future schedules, soft-deleted class/schedule dan histori enrollment.
- Approved tetapi belum dibayar, paid tetapi reconciling, genuine no schedule.
- Tenant tanpa izin enrollment:read; parent mencoba membaca student lain.
- List besar dan jadwal bukan pada first page.

## Testing / Validation

- [ ] Repository/mapper regression untuk plural private slots, ownership scope dan query count/batch behavior.
- [ ] Contract compatibility test singular grup, serta private list/detail dari gateway.
- [ ] Web query/table test beberapa slot, data>100, unavailable vs empty, dan group fallback.
- [ ] Manual real-flow approve private→lihat tabel→bayar→reload pada desktop/mobile.
- [ ] Formatter, Go tests/race checks, web tests/lint/typecheck/build dan required GitHub PR CI sesuai perubahan.
- [ ] Update API/data/web docs dan evidence sebelum menyatakan selesai.

## Out of Scope

- Perbaikan aktivasi pembayaran (issue01), perubahan jadwal atau session-generation logic.
- Perubahan shape singular yang breaking atau menampilkan data tenant lain.
- Redesign kalender/tabel di luar kebutuhan slot private.
