# Report — QA end-to-end 2026-10-09

## Ringkasan eksekutif

- QA end-to-end dengan agent-browser pada stack lokal menemukan 9 bug baru; semuanya dikonversi menjadi kontrak `kelolakelas.planning-backlog/v1` (0 project, 9 issue) dan lulus `planning.mjs render`.
- Bug paling penting: pembatalan enrollment pending selalu dijawab 409 meski berhasil (bertentangan dengan ADR 0016), dan tenggat invoice/undangan bergeser sebesar offset zona proses karena timestamp lokal disimpan di kolom tanpa zona.
- Satu temuan (format jam permintaan jadwal private) adalah duplikat KEL-166; gap permission baca Teacher adalah deferral ADR 0010.
- Batasan: callback Duitku, payout, platform admin, review, refund, reschedule, dan email tidak diuji; zona waktu proses di deployment belum diverifikasi.

## Prioritas dan urutan

Lihat `backlog.md`. Tidak ada dependency antar issue, sehingga semua dapat dikerjakan paralel. KEL-168 dan KEL-169 berprioritas High karena memengaruhi alur pembayaran parent. Sisanya Medium/Low karena berupa masalah UX atau validasi tanpa kehilangan data.

## Kandidat yang tidak dibuat

- Format jam `HH:MM` vs `HH:MM:SS` pada permintaan jadwal private: duplikat KEL-166.
- Teacher dapat membaca members/roles/settings dan melihat tombol aksi yang ditolak backend: deferral terdokumentasi (ADR 0010).
- Urutan jadwal tidak terurut di katalog/detail, judul tab halaman vouchers, `aria-invalid` pada field voucher: kosmetik minor, ditunda.
- Validasi overlap jadwal di academic: menunggu keputusan produk (lihat pertanyaan terbuka).

## Pertanyaan terbuka

1. Apakah jadwal grup yang tumpang tindih pada hari yang sama boleh disimpan (mis. ruang/tutor berbeda)? KEL-176 hanya menambah peringatan non-blokir.
2. Zona waktu proses billing/identity di deployment: bila bukan UTC, data lama mungkin perlu backfill (di luar scope KEL-169).

## Status pengiriman ke Linear

Sembilan issue yang sudah ada diperbarui di tempat (tidak ada issue baru): description diganti isi `issues/NN-<draftKey>.md` apa adanya, dan title, label repository + `Improvement`, priority, serta estimate diambil dari `backlog.yaml`. Label `Bug` diganti `Improvement` karena schema hanya menerima `Feature`/`Improvement`/`Refactor`. KEL-176 diubah scope-nya menjadi peringatan overlap non-blokir, karena slot manual + generator adalah perilaku yang disengaja (KEL-112). Read-back (`verify-readback.py`) lulus 9/9 (kontrak, title, label, project, relasi), lalu `ai-ready` ditambahkan sebagai langkah terakhir dan read-back ulang tetap PASS. Mapping ada di `linear-sync.json`.

| draftKey | Linear |
| --- | --- |
| cancel-pending-enrollment-409 | KEL-168 |
| utc-timestamps-billing-identity | KEL-169 |
| parent-session-tenant-dashboard-guard | KEL-170 |
| tenant-overview-real-data | KEL-171 |
| auth-forms-preserve-input | KEL-172 |
| invite-member-permission-display | KEL-173 |
| tenant-location-success-message | KEL-174 |
| student-dob-not-future | KEL-175 |
| schedule-overlap-warning | KEL-176 |
