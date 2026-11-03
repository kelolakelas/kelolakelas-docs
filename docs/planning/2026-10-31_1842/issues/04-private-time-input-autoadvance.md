## Background / Problem

Testing 31 Oktober 2026 meminta cursor langsung pindah ke menit setelah jam selesai diisi pada jam mulai/selesai pengajuan jadwal private di detail kelas. KEL-210 sudah menyelesaikan perilaku ini untuk editor jadwal kelas tenant, tetapi ScheduleRequestForm masih memakai input time native tanpa komponen tersebut.

Lampiran: `http://localhost:3000/kelas/a2055414-5076-4c48-9d76-3d9e02c55cf3`. Runtime lokal tidak tersedia saat discovery.

## Goal

Parent dapat mengisi jam mulai/selesai pengajuan private secara cepat dan konsisten dengan editor jadwal tenant.

## Requirements

- Terapkan perilaku hour-to-minute yang sudah ada pada input waktu pengajuan private; hindari implementasi paralel yang berbeda semantik.
- Setelah dua digit jam valid selesai dimasukkan, aktifkan/select segmen menit pada field yang sama, bukan otomatis memindahkan focus ke field selesai/submit.
- Pertahankan Tab/Shift+Tab, koreksi jam, backspace/delete, paste, validasi range dan urutan mulai/selesai existing.
- Jangan mengubah format payload, timezone, durasi atau kebijakan slot.
- Periksa field reschedule native sebagai permukaan terkait; perluas reuse di sana hanya untuk perilaku input yang sama, tanpa mengubah alur reschedule.

## Acceptance Criteria

- [ ] Ketik jam valid dua digit pada jam mulai dan selesai di detail kelas: input berikutnya mengisi menit.
- [ ] Jam belum lengkap/invalid tidak memicu perpindahan salah; error tidak hilang atau menjadi jadwal valid diam-diam.
- [ ] Pengguna tetap dapat kembali mengedit jam, paste waktu penuh dan menggunakan keyboard tanpa focus trap.
- [ ] Nilai yang disubmit dan validasi rentang tetap sesuai kontrak existing; reset/error form mempertahankan perilaku sebelumnya.
- [ ] Input pada desktop/mobile target diuji; browser yang tidak mendukung API seleksi tetap memiliki fallback yang bisa digunakan tanpa exception.
- [ ] Editor tenant yang telah diperbaiki KEL-210 tidak mengalami regresi.

## Technical Notes

- Reuse existing: `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleTimeInput.tsx:23`, `:56`, beserta `ScheduleTimeInput.test.tsx:49`.
- Gap: `app/(public)/kelas/[id]/_components/ScheduleRequestForm.tsx:221`; permukaan terkait `app/(dashboard)/dashboard/tenant/sessions/_components/RescheduleDialog.tsx:163`.
- KEL-210 Done bukan blocker; ini perluasan ke permukaan yang belum memakai behavior tersebut, bukan membuat ulang fitur tenant. KEL-220 styling proposal private tidak menetapkan autoadvance.
- Dokumentasikan lokasi/pola penggunaan input waktu bersama pada docs web/quality bila berubah.

## Edge Cases

- Jam 00/23, menit 00/59, jam 24, nilai kosong, paste dan backspace pada batas segmen.
- Browser/mobile keyboard berbeda; value terkontrol berubah sesudah validation response.
- Waktu selesai sebelum/sama mulai tetap ditolak sesuai validasi existing.

## Testing / Validation

- [ ] Tambahkan/update test jam valid/invalid, incomplete, paste, delete dan Tab/Shift+Tab pada form parent.
- [ ] Jalankan regresi ScheduleTimeInput existing dan test payload ScheduleRequestForm.
- [ ] Lakukan browser check desktop/mobile; jangan menganggap jsdom membuktikan native time-segment selection.
- [ ] Jalankan formatter/lint/typecheck/test terkait dan required GitHub CI checks sebelum merge.

## Out of Scope

- Date picker baru, timezone conversion baru, aturan availability atau backend jadwal.
