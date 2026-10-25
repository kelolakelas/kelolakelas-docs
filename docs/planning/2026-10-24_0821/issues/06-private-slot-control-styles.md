## Background / Problem

Testing lokal 24 Oktober 2026 pada [http://localhost:3000/kelas/33053545-1f89-4d63-9e73-92cadae32b8e](http://localhost:3000/kelas/33053545-1f89-4d63-9e73-92cadae32b8e): input hari di bagian Slot jadwal yang diajukan berbeda style dari input lain. Form public memakai inline select styling terpisah, sedangkan tenant schedule forms telah memiliki standard shared control styles.

## Goal

Input hari dan kontrol slot yang diajukan mengikuti standar komponen bersama sehingga dimensi, tipografi, affordance dan state tampil konsisten.

## Requirements

- Terapkan primitive/token style reusable pada weekday select dan kontrol slot terkait, mengacu standar tenant schedule existing tanpa memaksakan palet dashboard ke halaman publik.
- Samakan tinggi, radius, border, typography, padding, alignment dan indikator dropdown; konsisten untuk focus/error/disabled serta konteks dark mode yang didukung.
- Pertahankan semantic select, label aksesibel, keyboard interaction, pilihan hari dan payload/jam existing. Standar disimpan sebagai komponen/token bersama agar tidak menyalin class berbeda-beda.
- Scope migrasi: form request private public dan kontrol jadwal terkait yang memakai standar tersebut; catat usage agar form baru dapat mengikuti pola yang sama.

## Acceptance Criteria

- [ ] Pada URL laporan atau fixture private ekuivalen, weekday select tampak sejajar/konsisten dengan kontrol slot lain pada desktop dan mobile.
- [ ] Style reusable dipakai oleh weekday/control yang dicakup; state normal/focus/error/disabled terdokumentasi dan terverifikasi.
- [ ] Label dan error terasosiasi dengan kontrol, select tetap keyboard-operable dan indikator dropdown terlihat jelas.
- [ ] Tambah/hapus slot, pemilihan hari/jam dan submit request menghasilkan payload yang sama seperti sebelum perubahan; validasi existing tetap berlaku.
- [ ] Ada screenshot sebelum/sesudah atau evidence visual ekuivalen; tidak ada overflow pada viewport sempit atau regresi tenant schedule forms yang berbagi style.

## Technical Notes

Evidence: ScheduleRequestForm memakai select/time inline classes, sedangkan schedule-field-styles.ts memiliki standard height/focus/error/disabled/chevron. Native appearance sebagai penyebab visual masih inferensi sampai inspeksi browser. KEL-200/KEL-210 hanya tenant create/edit schedule; issue ini memperluas penerapan ke public proposed slots. Hindari refactor design system besar atau mengubah semantik hari/jam.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/ScheduleRequestForm.tsx:195`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/schedule-field-styles.ts:5`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`

Perbarui docs/components/web.md untuk scope kontrol bersama dan evidence visual. Update ADR hanya bila keputusan reuse benar-benar mengubah arsitektur jangka panjang.

Related work (Done; bukan blocker): KEL-109, KEL-200, KEL-210.

## Edge Cases

- Nama hari panjang, 320–375px viewport, beberapa slot dan error per baris.
- Keyboard focus, native select open, disabled/submitting dan className override.
- Palet public berbeda dari tenant; perubahan token shared memengaruhi form tenant lain.

## Testing / Validation

- [ ] Verifikasi visual desktop/mobile untuk normal/focus/error/disabled; inspeksi aksesibilitas keyboard dan label.
- [ ] Jalankan regression form request dan shared schedule controls; periksa payload submit dan tambah/hapus slot. Tidak perlu snapshot test yang sekadar menyalin class CSS.
- [ ] Formatter, lint, type checking dan test relevan seluruh repository yang berubah lulus; dokumentasi diperbarui sesuai evidence.
- [ ] PR tertaut issue menjalankan GitHub Actions pada main; required CI dan approval yang diwajibkan lulus sebelum merge. Issue selesai hanya setelah merge dan acceptance criteria terpenuhi.

## Out of Scope

- Redesign semua halaman/form web, perubahan workflow request atau format jadwal.
- Date UX ditangani issue tersendiri; tidak ada dependency implementasi yang terbukti.
