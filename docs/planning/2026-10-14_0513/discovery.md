# QA agent-browser — 14 Oktober 2026

Stack awal tidak running. Enam komponen dimulai via scripts/run-local.sh; gateway ready healthy untuk semua downstream dan Redis. Tidak menjalankan migrasi/seeding. Akun tenant dan parent dibuat API, teacher dibuat invitation/register API; token hanya undangan QA sendiri dibaca sebagai fixture inbox (email_sent=false).

Semua HEAD sama dengan origin/main setelah fetch; perubahan lokal AGENTS.md web dan docs dipertahankan. Scope read-only code, tidak implementasi bug.

| Area | Hasil | Bukti | Tindak lanjut |
|---|---|---|---|
| Tenant category/class/group schedule/publish | Berhasil; sesi tanpa tutor | UI dan GET schedules/sessions | Draft tutor assignment grup |
| Tenant schedule cards | Nama kelas hilang; kartu identik | schedules.png; API nested class.name | Draft class identity |
| Teacher login, nav, sessions | Berhasil setelah assignment fixture memakai member_id | UI Sesi Saya | Overview admin actions duplikat KEL-192 |
| Teacher report | Form kosong dengan submit disabled bila belum ada siswa diajar | Browser dialog | Tidak diklaim berhasil membuat report |
| Parent student | Create berhasil | UI card dan GET students | Tanggal diisi via DOM karena CLI fill date tidak mengisi input |
| Parent checkout | Error sandbox 404; field reset pada 5xx/409 | checkout-reset.png dan log billing | Draft preserve input |
| Parent chat | Empty inbox render benar | UI inbox | Tidak mengirim pesan: belum ada context report/request |
| Parent route isolation | Belum diuji penuh pada run ini | — | Tidak mengklaim security audit lengkap |

KEL-190 dan KEL-192 direproduksi ulang; tidak membuat duplikat. KEL-186 private-only, KEL-172 auth-only. Tidak mengubah status issue existing. Pembayaran sukses, absensi siswa aktif dan report siswa aktif belum diuji karena provider checkout gagal.
