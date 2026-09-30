# Laporan perencanaan 2026-09-29_0032

## Ringkasan eksekutif

Dua Project dan delapan Issue (batas owner) telah didraft, tervalidasi, dibuat di Linear setelah persetujuan owner, dan dibaca ulang terhadap payload. Bukti utama: billing memaksa `PaymentMethod: "VC"` dan adapter tidak menyimpan VA/QR (`internal/usecase/transaction_usecase.go:290`, `pkg/duitku/client.go:42-47`), sementara chat backend/gateway sudah merge namun KEL-123/124 UI masih Backlog. KEL-112/113/114 sudah mencakup tiga permintaan UI, dan KEL-111 sudah menyelesaikan modal untuk zero-state; hanya perlu follow-up untuk student existing.

## Alasan prioritas dan urutan

Lihat `backlog.md`. Pemilihan channel, instruksi transaksi, lalu halaman web adalah rantai finansial: server menerima pilihan dahulu, baru menyajikan instruksi yang terotorisasi, baru web membacanya. Email link private dapat dibangun independen dengan retry aman; chat-link menyusul, dan penerimaan UI-nya juga membutuhkan KEL-123/124 yang sudah ada. Perbaikan riwayat enrollment dan perluasan modal student tidak bergantung pada rantai itu. Guard kapasitas private mengikuti audit data historis dan semua pembuat jadwal, bukan sekadar menyembunyikan input UI.

## Status setiap permintaan

1. Payment page: didraft `billing-payment-channel-selection`, `billing-payment-instructions`, `web-payment-page`; kartu tetap redirect provider sesuai keputusan owner terdahulu.
2. Chat tenant–parent: backend selesai (KEL-119..122), UI sudah didraft dalam KEL-123/124; hanya distribusi link via chat didraft sebagai `private-payment-link-chat`.
3. Tab Parent/Organization sudah ada; pointer adalah KEL-114 Backlog, tidak diduplikasi.
4. Kapasitas form kelas adalah KEL-113 Backlog (owner sebelumnya memutuskan hapus input dari kedua tipe), tidak diduplikasi.
5. Generator hari/jam/durasi/jeda adalah KEL-112 Backlog, tidak diduplikasi.
6. Modal student zero-state sudah KEL-111 Done; follow-up `student-modal-existing-list` untuk parent yang sudah punya student.
7. Alur private request/approve/rekomendasi, invoice, dan aktivasi sudah KEL-107..110/115/116 Done. Untuk melengkapinya, didraft `private-payment-link-email` dan `private-payment-link-chat`.

## Tidak dibuat / run berikutnya

Voucher/kupon (schema ada, handler belum ada), withdrawal/payout (butuh kebijakan settlement dan provider), refund (butuh kebijakan finansial), cart, rating/review, wishlist, media kelas, dan storefront tenant melebihi kuota serta bukan fokus 8 request. Ditunda tanpa klaim sebagai fitur yang siap dieksekusi. Payout/refund harus memperoleh keputusan finance sebelum draft implementasi. Validasi overlap backend jadwal group juga kandidat lanjutan, bukan issue di run ini.

## Keputusan dan batasan material

- Owner menyatakan semua channel merchant Duitku aktif, tetapi tidak ada transaksi sandbox dijalankan di run ini. Kode channel/format VA/QR harus diverifikasi terhadap respons Duitku sebenarnya sebelum desain final.
- Pemilihan channel private sesudah approval membutuhkan kesepakatan kontrak: saat ini approval langsung menciptakan invoice `VC`. Draft memakai default menolak penggantian invoice aktif dan meminta implementer menentukan flow parent sebelum menerbitkan invoice baru, bukan merewrite transaksi aktif. Ini keputusan produk/arsitektur yang wajib dikonfirmasi sebelum coding jika pemilihan channel private dianggap acceptance wajib.
- `private-payment-link-chat` bergantung pada KEL-123/124 (existing Linear) selain issue lokal `private-payment-link-email`. Kontrak `blockedByDraftKeys` hanya boleh merujuk payload ini, jadi relasi ke KEL-123/124 belum terekam di kontrak. Jangan buat/label issue itu `ai-ready` sampai dependensi lintas-run direkonsiliasi menurut prosedur adopsi kontrak atau KEL-123/124 selesai. Tidak boleh menambahkan relasi native yang berbeda dari kontrak.
- Docs `main` kotor dan 11 commit tertinggal dari `origin/main`; tidak dipull untuk melindungi perubahan lokal. Discovery memakai docs lokal sebagai petunjuk, tetapi code `main` dan Linear dibaca langsung. URL localhost pada permintaan tidak diuji; ini review statis, bukan QA runtime.
- `private-schedule-capacity-guard` adalah kandidat berconfidence sedang; implementer harus mengaudit pembuat jadwal private dan data historis sebelum menegakkan invariant. Jika aturan produk private multi-student berbeda, hentikan issue dan minta keputusan owner.
- Pembayaran link otomatis via email/chat membutuhkan definisi apakah pengiriman langsung saat approval atau pilihan tenant mengirim kemudian. Draft mengusulkan email otomatis setelah invoice sukses dan chat on-demand oleh tenant; konfirmasi sebelum implementasi jika berbeda.

## Status pengiriman ke Linear

Owner menyetujui kedua Project dan delapan Issue. Dibuat P-KEL-24 dan P-KEL-25, serta KEL-125 sampai KEL-132. `linear-sync.json` memuat ID/URL live; readback `verify-readback.py` lulus untuk 2 Project dan 8 Issue, termasuk kontrak, label, dan relasi native antar-issue lokal. Label `ai-ready` telah ditambahkan pada KEL-125/126/127/128/130/131/132; KEL-129 sengaja belum dilabeli karena dependensi lintas-run KEL-123/124 belum direpresentasikan dalam kontrak atau selesai. Tidak ada implementasi/CI/merge yang diklaim. Jangan jalankan `linear-write.py aiready` secara massal pada run ini karena ia juga akan melabeli KEL-129 tanpa guard lintas-run.
