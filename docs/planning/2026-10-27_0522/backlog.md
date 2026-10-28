# Backlog — Testing 25 Oktober 2026

Delapan draft issue; tidak ada project baru. MODE incremental, MAKS_ISSUE8. Semua description sumber kebenaran ada pada issues/*.md. Status: seluruh delapan issue telah dibuat di Linear setelah pengguna menyetujui semuanya melalui pesan “setujui”; description, metadata dan relasi sudah di-fetch ulang serta diverifikasi.

## Project existing yang dipakai

| Key | Project | Digunakan oleh |
| --- | --- | --- |
| P-KEL-22 | Pembelian kelas private dengan jadwal yang disepakati | 01,02,06 |
| P-KEL-23 | Chat realtime antara tenant, pengajar, dan parent | 03 |
| P-KEL-17 | Administrasi anggota tenant yang andal dan aman | 04,05 |
| P-KEL-7 | Operasional tenant untuk menjual kelas | 07 |

Project diverifikasi tersedia dan tidak Canceled. Reuse tanpa overwrite description; tidak perlu projects/*.md baru. Audit08 standalone karena scope seluruh persona.

## Issue dan metadata / urutan eksekusi

| # | draftKey / Judul | Project | Type | Priority | Estimate | Complexity | Repository labels | Blocked by | Related existing (Done) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | restore-private-paid-activation — [Investigasi dan pulihkan aktivasi enrollment private setelah pembayaran diterima](issues/01-restore-private-paid-activation.md) | P-KEL-22 | Improvement | High | M | high | web, academic, billing | — | KEL-8, KEL-29, KEL-215 |
| 2 | private-enrollment-schedule-summary — [Tampilkan seluruh jadwal private yang disetujui pada Enrollment & Pembayaran](issues/02-private-enrollment-schedule-summary.md) | P-KEL-22 | Improvement | High | M | medium | academic, web | — | KEL-70, KEL-33 |
| 3 | restore-admin-chat-conversations — [Investigasi dan pulihkan chat room yang menghilang dari inbox admin](issues/03-restore-admin-chat-conversations.md) | P-KEL-23 | Improvement | High | M | medium | chat, web | — | KEL-123, KEL-202, KEL-217 |
| 4 | tenant-membership-selection — [Teacher memilih dan berpindah tenant aktif dari membership miliknya](issues/04-tenant-membership-selection.md) | P-KEL-17 | Feature | High | L | high | identity, api-gateway, web | — | — |
| 5 | existing-teacher-invitations — [Izinkan akun Teacher yang sudah terdaftar menerima undangan tenant lain](issues/05-existing-teacher-invitations.md) | P-KEL-17 | Feature | High | M | high | identity, api-gateway, web | tenant-membership-selection | KEL-35 |
| 6 | automatic-private-request-chat — [Kirim chat otomatis parent dan admin untuk lifecycle request jadwal private](issues/06-automatic-private-request-chat.md) | P-KEL-22 | Feature | High | L | high | academic, chat | — | KEL-124, KEL-129 |
| 7 | class-editor-load-performance — [Ukur dan optimalkan load serta reload editor kelas](issues/07-class-editor-load-performance.md) | P-KEL-7 | Improvement | Medium | M | medium | web, academic, api-gateway | — | KEL-198, KEL-211 |
| 8 | cross-role-ux-audit — [Audit UI/UX seluruh halaman dan perbaiki temuan web prioritas](issues/08-cross-role-ux-audit.md) | — | Improvement | Medium | L | medium | web | — | KEL-202, KEL-210, KEL-219, KEL-220 |

Estimate Linear S=1, M=2, L=3. Type dan complexity dicatat sebagai metadata planning, bukan kontrak executor. Gunakan label Feature/Improvement; bugfix memakai Bug. Tidak menambahkan ai-ready. Repository labels menunjukkan area perubahan/investigasi berbasis bukti; persempit owner fix setelah diagnosis. Untuk07, targeted authenticated reads belum tersedia pada gateway, sehingga academic/api-gateway termasuk area yang mungkin perlu perubahan kompatibel; jangan menggunakan public catalog sebagai pengganti otorisasi editor.

## Dependency dan pengiriman

Satu relasi native blockedBy yang direncanakan:05 diblokir04. Keduanya tidak bergantung pada branch issue Done. Issue lain independen; urutan mencerminkan prioritas dan kemudahan menilai outcome. Masalah chat03 dan lifecycle06 berkaitan tetapi bukan blocker teknis otomatis. Aktivasi01 dan tampilan jadwal02 diverifikasi terpisah, lalu diuji bersama.

Pengguna menyetujui seluruh delapan issue. Pengiriman selesai pada team KEL dengan status Backlog, priority High=2/Medium=3, estimate M=2/L=3 dan label sesuai indeks. Satu native dependency: KEL-225 blockedBy KEL-224. Seluruh body, project, metadata, labels dan relasi telah di-fetch ulang. Linear menormalkan Markdown dan mengubah referensi issue menjadi mention; isi description setara dengan draft sumber. Mapping aktual ada pada [linear-sync.json](linear-sync.json).

## Issue Linear terverifikasi

- restore-private-paid-activation → [KEL-221](https://linear.app/farid-zamani/issue/KEL-221/investigasi-dan-pulihkan-aktivasi-enrollment-private-setelah) — Backlog; tanpa blocker baru.
- private-enrollment-schedule-summary → [KEL-222](https://linear.app/farid-zamani/issue/KEL-222/tampilkan-seluruh-jadwal-private-yang-disetujui-pada-enrollment-and) — Backlog; tanpa blocker baru.
- restore-admin-chat-conversations → [KEL-223](https://linear.app/farid-zamani/issue/KEL-223/investigasi-dan-pulihkan-chat-room-yang-menghilang-dari-inbox-admin) — Backlog; tanpa blocker baru.
- tenant-membership-selection → [KEL-224](https://linear.app/farid-zamani/issue/KEL-224/teacher-memilih-dan-berpindah-tenant-aktif-dari-membership-miliknya) — Backlog; tanpa blocker baru.
- existing-teacher-invitations → [KEL-225](https://linear.app/farid-zamani/issue/KEL-225/izinkan-akun-teacher-yang-sudah-terdaftar-menerima-undangan-tenant) — Backlog; blocked by KEL-224.
- automatic-private-request-chat → [KEL-226](https://linear.app/farid-zamani/issue/KEL-226/kirim-chat-otomatis-parent-dan-admin-untuk-lifecycle-request-jadwal) — Backlog; tanpa blocker baru.
- class-editor-load-performance → [KEL-227](https://linear.app/farid-zamani/issue/KEL-227/ukur-dan-optimalkan-load-serta-reload-editor-kelas) — Backlog; tanpa blocker baru.
- cross-role-ux-audit → [KEL-228](https://linear.app/farid-zamani/issue/KEL-228/audit-uiux-seluruh-halaman-dan-perbaiki-temuan-web-prioritas) — Backlog; tanpa blocker baru.

Tidak ada project baru, perubahan description project, assignment/delegation, commit atau PR. KEL-226 mendapat tambahan native relatedTo KEL-128 secara otomatis dari mention pada description; seluruh relatedTo yang diminta tetap ada.
