## Background / Problem

Testing 31 Oktober 2026 meminta tautan login pada register, register pada login, serta tombol `Akses awal` di landing menuju login. LoginForm belum menyediakan link register; wrapper register belum menyediakan link login bersama; CTA akses awal masih membuka modal. Pengguna yang salah memilih halaman tidak memiliki navigasi alternatif yang jelas dekat form.

## Goal

Pengunjung dapat berpindah login/register dengan mudah dan masuk melalui CTA akses awal tanpa perubahan mekanisme autentikasi.

## Requirements

- Tampilkan `Sudah punya akun? Masuk` pada register parent dan organisasi, menuju `/login`.
- Tampilkan `Belum punya akun? Daftar` pada login pengguna umum, menuju `/register`.
- Ubah tombol berlabel `Akses awal` pada landing, termasuk varian responsifnya, menjadi navigasi langsung ke `/login`, bukan pembuka modal.
- Tempatkan tautan lintas form sebagai aksi sekunder yang mudah ditemukan, dengan focus terlihat dan semantik link. Pertahankan CTA utama dan tab persona.
- Pertahankan login platform admin, lupa password, redirect aman existing, undangan, serta flow hasil registrasi parent/organisasi.

## Acceptance Criteria

- [ ] Register parent dan organisasi sama-sama menyediakan link Masuk yang bekerja.
- [ ] Login umum menyediakan link Daftar yang bekerja tanpa submit form atau validasi field.
- [ ] `Akses awal` di desktop/mobile menuju login dan tidak membuka modal lama.
- [ ] Tautan dapat dijangkau dengan Tab dan diaktifkan dengan Enter; terlihat pada layar sempit tanpa menutupi form.
- [ ] Tidak ada perubahan pada tujuan CTA register lain yang tidak berlabel Akses awal, hasil registrasi, atau aturan redirect/session existing.
- [ ] Parameter navigasi existing yang dipertahankan tetap memakai validasi target internal; jangan menambahkan open redirect atau memindahkan password melalui URL.

## Technical Notes

- Bukti: `kelolakelas-web/app/(auth)/login/_components/LoginForm.tsx:141`, `app/(auth)/register/_components/RegisterFormSwitch.tsx:54`, `app/(public)/_components/EarlyAccessModal.tsx:25`.
- Trigger `Akses awal` berada pada header homepage (`app/(public)/page.tsx:63`); label tepat di `EarlyAccessModal.tsx:29`. Pertahankan hero `Daftar untuk akses awal` dan notice `Gabung pengguna awal` menuju register, karena request menunjuk tombol `Akses awal`.
- Action register parent dan organisasi mempunyai hasil berbeda; pertahankan `app/(auth)/register/_actions/actions.ts:89` dan `:188`.
- Observasi publik GitHub menggunakan tautan create account di login dan sign in di signup; Canva memakai satu entry point login/signup. Rekomendasi: gunakan pola reciprocal link tanpa menyatukan flow existing. Sumber dan batasan: `../auth-ux-references.md`.
- Dokumentasikan navigasi baru pada `kelolakelas-docs/docs/components/web.md` dan flow autentikasi bila deskripsinya berubah. Tidak memerlukan backend atau provider autentikasi baru.

## Edge Cases

- Form kosong atau berisi error tetap mengizinkan navigasi alternatif; data sensitif tidak dipindahkan ke halaman tujuan.
- Pengunjung membuka register lewat tab organisasi atau link undangan; flow undangan existing tidak ditimpa.
- Header mobile dan desktop tidak memiliki tujuan berbeda.

## Testing / Validation

- [ ] Tambahkan/update test link login/register pada kedua persona dan CTA akses awal.
- [ ] Uji keyboard, layout mobile, lupa password dan login platform admin.
- [ ] Jalankan test terkait, formatter/lint/typecheck repository dan regresi redirect aman existing.
- [ ] Pastikan PR menjalankan seluruh required GitHub CI checks dan review sebelum merge; hasil lokal bukan pengganti CI.

## Out of Scope

- Redesign auth, penyatuan login/register, social login, perubahan hasil registrasi, atau mengganti semua CTA landing menjadi login.
- Perubahan backend identity dan migrasi akun.
