# Laporan QA KelolaKelas — 14 Oktober 2026 WIB

KelolaKelas awalnya tidak berjalan. Enam komponen dimulai dengan scripts/run-local.sh; web tersedia di http://localhost:3000. Readiness akhir gateway HTTP 200, identity/academic/billing/chat/Redis healthy. Stack tetap berjalan untuk inspeksi pengguna. Semua repository aplikasi dan docs sama dengan origin/main setelah fetch; tidak menimpa perubahan lokal atau mengubah source aplikasi.

## Simulasi

- Tenant: registrasi API, login browser, kategori, kelas grup, jadwal, publikasi, tab Schedules, dan pemeriksaan sesi API.
- Teacher: registrasi undangan API, login browser, navigasi role, empty sessions/reports; setelah assignment fixture memakai member_id, sesi tampil. Reschedule lewat UI berhasil: status sukses terlihat; API menunjukkan sesi asal 14 Oktober rescheduled dan replacement 15 Oktober scheduled.
- Parent: registrasi API, login browser, membuat student melalui UI (API read mengonfirmasi), katalog/detail kelas, pilihan checkout VA dan QRIS serta error/retry, inbox chat kosong.
- Akun/data QA dibuat di database development; tidak ada migrasi, seeding, pembayaran nyata, atau penghapusan data existing. Undangan teacher email_sent=false; token undangan QA sendiri dibaca sebagai fixture inbox, kemudian seluruh registrasi/mutasi tetap lewat API resmi. Kredensial tidak disalin ke artefak planning/Linear.
- Browser agent-browser CLI tidak mengisi date input dengan fill; input tanggal kemudian diisi lewat DOM browser. Ini keterbatasan tooling dan tidak dibuatkan bug produk.

## Status pengiriman ke Linear

| Issue | Temuan | Priority | Estimate | Complexity |
|---|---|---|---|---|
| [KEL-193](https://linear.app/farid-zamani/issue/KEL-193/wizard-jadwal-kelas-grup-menghasilkan-sesi-tanpa-pengajar-dan-tidak) | Wizard jadwal grup tidak menyediakan assignment teacher; sesi tutor UUID nol | High | 2 | medium |
| [KEL-194](https://linear.app/farid-zamani/issue/KEL-194/checkout-parent-menghapus-pilihan-student-jadwal-periode-dan-metode) | Input checkout hilang setelah error | Medium | 2 | medium |
| [KEL-195](https://linear.app/farid-zamani/issue/KEL-195/tab-schedules-tenant-tidak-menampilkan-nama-kelas-sehingga-jadwal) | Kartu Schedules tanpa nama kelas | Medium | 1 | low |

Tiga contract kelolakelas.planning-backlog/v1 lolos validator/render (0 project, 3 issue). Metadata, JSON contract, label repository, Backlog, dan native blockedBy kosong diverifikasi melalui fetch provider. ai-ready ditambahkan setelah pemeriksaan tersebut; fetch akhir mengonfirmasi label ai-ready/web. Screenshot diunggah ke KEL-194 dan KEL-195. Tidak ada blocker baru; perbaikan input checkout dapat diuji dengan error terkontrol tanpa sandbox sehat.

Prioritas KEL-193 lebih tinggi karena jalur operasional sesi teacher kehilangan penugasan sejak setup. KEL-194 merusak recovery checkout, sedangkan KEL-195 membuat jadwal kelas berbeda tidak dapat dibedakan. KEL-190 (kolom kategori) dan KEL-192 (overview teacher mempromosikan administrasi) direproduksi ulang dan tidak diduplikasi. KEL-186 private-only dan KEL-172 auth-only berbeda scope dari issue baru.

## Batasan

Sandbox Duitku inquiry menjawab 404; billing pembuatan transaksi menjawab 500. Pembayaran sukses dan aktivasi enrollment tidak terverifikasi. Karena itu absensi siswa aktif, pembuatan laporan untuk siswa aktif, progress parent berisi data, dan pengiriman chat kontekstual belum diuji sampai selesai. Tidak mengklaim seluruh fitur atau seluruh security flow lulus. Error 404 provider dicatat sebagai batasan konfigurasi/integrasi, bukan diasumsikan bug source tanpa bukti lebih lanjut.

Bukti lokal: baseline.json, discovery.md, backlog.yaml, backlog.md, issues/*.md, linear-sync.json, checkout-reset.png, schedules.png. Artefak QA tidak di-commit atau dibuatkan PR; source aplikasi tidak berubah.
