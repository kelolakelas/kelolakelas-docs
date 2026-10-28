## Background / Problem

Manual testing 25 Oktober 2026: data lama saat Edit Class dan reload terasa lambat. readClassConfiguration menghabiskan seluruh halaman kelas, jadwal dan kategori tenant lalu memilih satu kelas. Beberapa form/editor schedule juga memanggil teacher lookup sendiri. Fan-out terbukti dari source, tetapi kontribusi tiap lapisan dan besar latensi belum diukur.

## Goal

Editor satu kelas membuka dan me-reload saved configuration lebih cepat dengan data lengkap, fresh, dan terotorisasi.

## Requirements

- Ukur baseline open/reload/save-followed-by-reload: request waterfall/count/bytes, server-action latency, downstream/SQL bila relevan, serta p50/p95 pada fixture dan kondisi yang dicatat.
- Optimalkan pembacaan terotorisasi untuk kelas terpilih beserta seluruh jadwal relevan; kurangi pembacaan kelas/jadwal tenant lain dan teacher lookup redundan.
- Gunakan kontrak existing bila cukup; bila diperlukan scoped authenticated read tambahan, dokumentasikan minimal compatible contract di academic/gateway. Jangan gunakan public catalog detail sebagai pengganti protected editor data.
- Pertahankan kelengkapan kategori/teacher choices, active-membership permission, draft preservation, explicit retry, schedule version/effective date, dan freshness setelah save.
- Loading/error/reload state jelas; failure tidak disamarkan sebagai saved snapshot kosong atau sukses.
- Update docs tentang jalur read baru dan bukti benchmark; jangan memilih cache/index/infrastructure sebelum profiling membuktikan kebutuhan.

## Acceptance Criteria

- [ ] Tersedia baseline dan hasil setelah perubahan pada fixture/kondisi/repetisi sama untuk open, explicit reload dan save-refresh; p50/p95 serta request counts menunjukkan perbaikan yang dapat diulang.
- [ ] Membuka satu kelas tidak lagi memindai semua halaman kelas/jadwal tenant yang tidak terkait; pembacaan jadwal kelas target tetap lengkap lintas halaman.
- [ ] Lookup teacher yang identik dibagi/dideduplikasi dalam satu editor snapshot tanpa menghilangkan lookup pagination/permission atau stale membership safety.
- [ ] Kategori dan teacher di halaman berikutnya tetap dapat dipilih; kelas unpublished tetap dapat diedit oleh anggota berwenang.
- [ ] Setelah save/class/schedule changes, editor membaca state authoritative terbaru; failed read mempertahankan draft dan memblokir mutasi yang membutuhkan snapshot valid.
- [ ] Unauthorized/cross-tenant/not-found reads, retry cepat, close/unmount dan response tidak berurutan tetap aman.
- [ ] Tidak ada penurunan correctness class creation/edit dan tidak ada cache data lintas tenant.

## Technical Notes

Relevant areas:
- kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts:14–42,729–781.
- kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassEditModal.tsx:47–56.
- kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassConfigurationEditor.tsx:93,478–533; ClassEditForm.tsx:95; ScheduleForm.tsx:122; useScheduleTeachers.ts:12.
- kelolakelas-academic-service/internal/repository/class_repository.go:18–31; internal/repository/schedule_repository.go:18–33.
- kelolakelas-api-gateway/internal/delivery/http/router.go:183,206 — collection reads existing, protected class-detail GET belum tersedia.
- kelolakelas-docs/docs/components/web.md:136,341 — KEL-198/211 behavior yang harus dipertahankan.

KEL-198 Done menyelesaikan editor lengkap; KEL-211 Done retry/draft. Issue ini spesifik latency/data fan-out, bukan redesign atau reimplementasi editor. Repository labels mencakup web dan kemungkinan narrow read contract academic/gateway; persempit perubahan setelah baseline. Jangan menetapkan angka SLO absolut tanpa kondisi pengukuran: laporkan delta dan batas lingkungan secara eksplisit. Jika kontrak read baru merupakan keputusan long-lived, catat ADR ringan dan tenant authorization evidence.

## Edge Cases

- Tenant memiliki >100 kelas/jadwal/anggota/kategori; kelas target di halaman akhir.
- Kelas tanpa jadwal, banyak versi jadwal, teacher inactive, category tidak tersedia.
- Permission dependency lambat/gagal, save sukses tetapi reload gagal.
- Switch tenant/close modal selama request dan edit belum disimpan.

## Testing / Validation

- [ ] Regression tests bounded/scoped read counts, completeness >100, dedup dan fresh-after-save.
- [ ] Backend ownership/permission/contract tests jika read API berubah; public payload tidak dijadikan sumber private.
- [ ] Browser benchmark sebelum/sesudah di fixture kecil/besar dengan versi/environment tercatat.
- [ ] Manual edit/reload/save, retry failure, category/teacher di later pages dan mobile usability.
- [ ] Existing KEL-198/211 relevant tests, formatter, Go checks bila berubah, web tests/lint/typecheck/build dan required GitHub PR CI.
- [ ] Dokumentasi flow/read contract dan hasil pengukuran disimpan tanpa production data.

## Out of Scope

- Redesain editor, mengganti framework/state library atau menambah cache/infrastruktur secara spekulatif.
- Optimisasi seluruh halaman atau menghapus validasi/permission untuk mengejar latency.
- Mengurangi hasil ke first page atau menampilkan saved data lama sebagai data terbaru.
