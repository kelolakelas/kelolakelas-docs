## Background / Problem

Testing lokal 24 Oktober 2026 meminta semua field tanggal lebih mudah digunakan: setelah tanggal selesai diketik fokus pindah ke bulan, lalu tahun tanpa Tab; datepicker menyediakan pilihan tahun langsung. Source memakai input date native di beberapa form sehingga perilaku bergantung browser dan belum ada standar bersama.

## Goal

Seluruh field tanggal dalam web memakai pengalaman input yang konsisten, mudah diketik, dapat memilih tahun langsung, dan mempertahankan validasi serta nilai tanggal existing.

## Requirements

- Inventarisasi semua field tanggal/date-time aktif dan migrasikan ke komponen/pola bersama. Baseline: DOB student, report filter, transaction filter, reschedule session, assign teacher, class editor effective date dan voucher date boundaries; periksa field dinamis juga.
- Input berurutan hari → bulan → tahun berpindah otomatis setelah segmen lengkap dan valid, tanpa Tab. Pengguna tetap dapat mengoreksi segmen sebelumnya dan bernavigasi keyboard secara wajar.
- Calendar menyediakan pemilihan tahun langsung dan pemilihan bulan, tanpa navigasi next/previous month berulang untuk tahun jauh.
- Pertahankan required/optional, min/max, validasi kalender dan format payload API. Pertahankan DOB max-today serta voucher defaults/local-time/seconds/fraction roundtrip KEL-201.
- Standar mencakup label, error, focus, disabled, aksesibilitas keyboard/screen-reader, desktop/mobile dan dark mode sesuai konteks. Hindari dependency baru kecuali dinilai perlu.

## Acceptance Criteria

- [ ] Semua field pada inventaris, termasuk create/edit/modal/filter dan field date-time yang ditemukan, memakai standar yang sama; bukti migrasi dicatat per lokasi.
- [ ] Mengetik hari lengkap memindah ke bulan, lalu bulan lengkap ke tahun, tanpa Tab; koreksi, backspace, paste tanggal, clear dan pengisian parsial tidak merusak nilai atau menjebak fokus.
- [ ] Tahun jauh dapat dipilih langsung dari datepicker; keyboard dapat membuka, memilih dan menutup picker dengan fokus kembali secara jelas.
- [ ] Invalid date, 29 Februari non-kabisat, min/max dan rentang terbalik ditolak dengan pesan tepat; tanggal optional kosong tetap kosong.
- [ ] Roundtrip create/edit tidak menggeser hari/timezone atau mengubah detik/fraction voucher; DOB di masa depan tetap ditolak.
- [ ] Verifikasi browser desktop yang didukung dan mobile viewport; perilaku browser yang belum diuji dicatat, tidak diklaim universal.

## Technical Notes

Native input date belum menjamin UX yang diminta lintas browser. Pilih implementasi shared setelah menilai keyboard, locale dan aksesibilitas, tanpa memaksakan library tertentu. Asumsi ringan: urutan tampilan hari/bulan/tahun untuk UX Indonesia; representasi API tetap existing. Estimate L karena cakupan beberapa form; complexity medium karena risiko focus, validasi dan serialization, bukan redesign backend. KEL-210 adalah jam→menit, bukan tanggal→bulan→tahun.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_components/StudentForm.tsx:94`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_components/ReportFilterBar.tsx:113`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/transactions/_components/TransactionFilterBar.tsx:120`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/sessions/_components/RescheduleDialog.tsx:143`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/AssignTeacherForm.tsx:39`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassConfigurationEditor.tsx:386`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/vouchers/_components/VoucherDateTimeField.tsx:62`

Perbarui docs/components/web.md dengan shared date UX, inventaris migrasi, batas browser yang diverifikasi dan evidence acceptance; jangan mengganti aturan date/time API tanpa perubahan kontrak yang terpisah.

Related work (Done; bukan blocker): KEL-175, KEL-201, KEL-210.

## Edge Cases

- Tanggal satu digit/leading zero; akhir bulan; leap year; tahun jauh; tanggal parsial/invalid yang diedit ulang.
- Paste format didukung, backspace antar segmen, optional empty, autofocus modal dan picker Escape.
- WIB/UTC browser, DST timezone lain, nilai voucher dengan detik/fraction, batas DOB hari ini.

## Testing / Validation

- [ ] Uji kalender/serialization dan browser interaction auto-advance, editing, paste, clear, direct year selection, focus/keyboard serta min/max.
- [ ] Verifikasi setiap form migrasi pada desktop/mobile, UTC dan Asia/Jakarta untuk jalur sensitif timezone; jalankan regression DOB/voucher/filter terkait.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Perubahan timezone/domain date policy backend, aturan DOB, voucher eligibility atau redesign seluruh form.
- Mengubah input jam yang sudah distandarkan KEL-210 atau memaksakan library datepicker tertentu.
