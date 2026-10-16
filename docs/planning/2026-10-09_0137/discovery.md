# Discovery — QA end-to-end 2026-10-09

## 1. Baseline dan batasan

- Mode: `incremental`, FOKUS: bug hasil QA end-to-end agent-browser atas permintaan owner ("do testing using agent-browser for all flow and features … create linear issue if any bug found"). Tidak ada lampiran.
- Range commit: lihat `baseline.json` (web `7cee871..63023ff`, academic `1a90621..e499bc5`, billing `750d5fa..a87e334`, identity `b05a137..f98790f`, gateway `51a8a23..4b718d2`, chat `0fd73a2..db71369`, docs `13ebda9..03b9ca0`). Cutoff Linear `2026-09-30T10:20:26Z`.
- Stack lokal: identity :8080, academic :8081, billing :8082, chat :8083, gateway :8000, web :3000 terhadap PostgreSQL host; proses berjalan dengan zona host `Asia/Jakarta`. Database chat dibuat lokal dan flag migrasi dirty dibersihkan untuk menjalankan stack; tidak ada perubahan kode.
- Batasan: area yang tidak diuji meliputi pembayaran Duitku sungguhan (callback), payout/withdrawal, platform admin, review, refund, reschedule/substitute, dan pengiriman email. Absensi dan laporan hanya dibuka, tidak dioperasikan dengan sesi nyata.
- Sembilan issue Linear (KEL-168–KEL-176) sudah dibuat sebelum run ini tanpa kontrak. Run ini mengubahnya menjadi kontrak `kelolakelas.planning-backlog/v1` dan memperbarui issue yang sama (tanpa membuat duplikat).

## 2. Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Registrasi tenant/parent, login | Implemented | agent-browser; `app/(auth)/**` | Input hilang saat gagal; banner sukses + error bersamaan | Baru |
| Guard route dashboard | Implemented (satu arah) | `proxy.ts`, screenshot parent di `/dashboard/tenant/members` | Parent dapat membuka `/dashboard/tenant/*` | Baru |
| Overview tenant | Implemented | `tenant/page.tsx`, `OverviewMetrics.tsx`, `TenantSidebar.tsx` | Sapaan/status/panel hardcoded | Baru |
| Wizard kelas dan jadwal | Implemented | wizard menghasilkan 5 slot, Senin 08:00–09:30 bentrok 09:00–10:30 | Tidak ada peringatan overlap | Slot manual + generator disengaja (KEL-112 test); overlap academic out of scope KEL-112 |
| Katalog, detail kelas, checkout VA, voucher | Implemented | agent-browser, API | Tenggat invoice +7 jam | Baru |
| Student parent | Implemented | tanggal lahir 2030-01-15 diterima | Tidak ada validasi tanggal masa depan | Baru |
| Pembatalan enrollment pending | Implemented (bug) | probe API 409 + status `dropped`; `enrollment_usecase.go` | 409 di jalur sukses; error tidak tampil di UI | Bertentangan dengan tabel ADR 0016 |
| Undangan anggota | Implemented | form 49 checkbox tercentang; action hanya kirim email+role | Checkbox menyesatkan; "Valid until" +7 jam | Baru |
| Settings tenant | Implemented | PUT lokasi 200, pesan sukses tidak muncul | `key` remount | Baru |
| Permintaan jadwal private | Implemented (bug) | replay HH:MM → 422, HH:MM:SS → 201 | — | Duplikat KEL-166 |
| Chat tenant–parent | Implemented | pesan realtime dua arah | — | — |
| Permission baca Teacher | Configured (deferral) | 200 tanpa member:read | — | Deferral terdokumentasi ADR 0010 |

## 3. Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cancel-pending-enrollment-409 (KEL-168) | QA | Improvement | Tinggi: parent mengira gagal | Tinggi | S | medium | Tinggi (repro + kode) | — | draft |
| utc-timestamps-billing-identity (KEL-169) | QA | Improvement | Tinggi bila zona proses ≠ UTC | Tinggi | M | high | Tinggi lokal; deployment TZ belum diverifikasi | — | draft |
| parent-session-tenant-dashboard-guard (KEL-170) | QA | Improvement | Sedang | Sedang | S | low | Tinggi | — | draft |
| auth-forms-preserve-input (KEL-172) | QA | Improvement | Sedang | Sedang | S | low | Tinggi | — | draft |
| invite-member-permission-display (KEL-173) | QA | Improvement | Sedang | Sedang | S | low | Tinggi | — | draft |
| tenant-overview-real-data (KEL-171) | QA | Improvement | Rendah | Rendah | S | low | Tinggi | — | draft |
| tenant-location-success-message (KEL-174) | QA | Improvement | Rendah | Rendah | S | very-low | Tinggi | — | draft |
| student-dob-not-future (KEL-175) | QA | Improvement | Rendah | Rendah | S | low | Tinggi | — | draft |
| schedule-overlap-warning (KEL-176) | QA | Improvement | Rendah | Rendah | S | low | Tinggi | — | draft (peringatan non-blokir; aturan overlap = keputusan produk) |
| Format jam permintaan jadwal private | QA | — | — | — | — | — | — | — | tolak: duplikat KEL-166 |
| Permission baca Teacher | QA | — | — | — | — | — | — | — | tolak: deferral ADR 0010 |
| Tombol aksi anggota tampil untuk Teacher | QA | — | — | — | — | — | — | — | tolak: konsisten dengan deferral ADR 0010 |
| Urutan jadwal di katalog/detail, judul tab vouchers, `aria-invalid` voucher | QA | — | — | — | — | — | — | — | tunda: kosmetik minor |

## 4. Status permintaan feature

| Request | Status | Bukti | draftKey atau identifier Linear |
| --- | --- | --- | --- |
| QA end-to-end dan buat issue untuk bug | didraft | tabel di atas | KEL-168–KEL-176; KEL-166 duplikat |
