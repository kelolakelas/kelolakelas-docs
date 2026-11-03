# Referensi UX autentikasi - 31 Oktober 2026

Riset terbatas pada konten halaman publik yang dapat dibaca, bukan benchmark usability atau pengukuran konversi.

| Sumber primer | Observasi | Implikasi planning |
| --- | --- | --- |
| https://github.com/login | Di bawah form terdapat ajakan untuk pengguna baru membuat akun. | Sediakan jalan keluar eksplisit dari login ke register sebagai aksi sekunder. |
| https://github.com/signup | Bagian awal halaman menyediakan tautan masuk bagi pengguna yang sudah memiliki akun. | Register tetap mempunyai aksi utama pendaftaran dan tautan sekunder ke login. |
| https://www.canva.com/login/ | Satu entry point berjudul login atau sign up, dengan pilihan melanjutkan memakai email atau provider. | Ini pola alternatif, bukan alasan menyatukan flow KelolaKelas yang sudah terpisah. |

Rekomendasi untuk KelolaKelas: pertahankan halaman login/register dan tab persona existing; tampilkan `Sudah punya akun? Masuk` di register dan `Belum punya akun? Daftar` di login, dekat form dengan hierarki sekunder, anchor yang bisa digunakan keyboard, focus terlihat, dan target internal yang aman. Ini rekomendasi desain dari observasi, bukan klaim bahwa satu pola selalu meningkatkan conversion.

CTA `Akses awal` menuju login merupakan kebutuhan eksplisit pengguna, bukan kesimpulan benchmark. Jangan mengganti CTA lain atau mengubah alur verifikasi, sesi, redirect, undangan, maupun pendaftaran tenant tanpa kebutuhan yang terbukti.

Batasan: Dropbox login/register tidak memberikan konten terbaca; Notion memerlukan JavaScript; Figma gagal diakses. Tidak ada klaim visual atau perilaku flow dari situs tersebut. Halaman GitHub login juga menampilkan pesan load error; observasi hanya pada tautan navigasi yang tetap terbaca.
