## Background / Problem

KEL-139 memakai MAX_AUX_PAGES=10 untuk enrollment/session picker (maksimum 1000 record), sehingga student pada halaman berikutnya tidak tersedia. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Pilih pencarian server: Creator mencari siswa/kelas; Teacher mencari/memilih kelas lalu siswa yang diajar melalui sessions?mine=true dan attendees existing.

## Goal

Form laporan menyediakan pemilih siswa berbasis pencarian dan pagination eksplisit tanpa memuat seluruh riwayat atau memotong diam-diam pada 1000 record.

## Requirements

- Creator/custom role dengan enrollment:read menggunakan enrollment search server atas nama siswa/kelas dan hasil paginated.
- Teacher tanpa enrollment:read memakai alur dua langkah: cari/pilih kelas yang diajar, lalu pilih siswa dari sesi mine=true dan attendees scoped.
- Hasil dibaca bertahap saat pencarian/pagination, tanpa prefetch seluruh riwayat setiap buka form; deduplikasi siswa/enrollment yang muncul di beberapa sesi.
- Jangan berhenti diam-diam pada MAX_AUX_PAGES=10; lanjutkan pagination matching-data sesuai batas API, tampilkan batas/error eksplisit bila batas API absolut tercapai.
- Pertahankan permission, scope tenant, guard tutor dan validasi report enrollment existing; hasil stale tidak boleh mengganti pilihan baru.

## Acceptance Criteria

- [ ] Creator dapat menemukan enrollment sah lewat pencarian nama siswa/kelas di luar 1000 record awal.
- [ ] Teacher dapat mencari/memilih kelas dan menemukan siswa sah dari halaman sesi/attendees di luar 1000 record awal.
- [ ] Form tidak mengunduh seluruh riwayat saat pertama dibuka; hasil pagination bisa dilanjutkan secara eksplisit.
- [ ] Empty/loading/error serta batas API ditampilkan jelas; tidak ada truncation diam-diam.
- [ ] Teacher tetap tanpa enrollment:read dan hanya melihat siswa yang diajar; custom role menggunakan jalur sesuai permission.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Opsi pencarian server dipilih. Backend existing enrollment search mencocokkan siswa/kelas, sessions search mencocokkan kelas saja. Jangan menjanjikan pencarian nama siswa global untuk Teacher atau menambah permission/enpoint baru. Implementasi web memakai existing scoped endpoints dengan pagination; API MaxPage=1000 dan MaxPageSize=100 tetap dihormati dan batas absolut ditampilkan bila tercapai. Risiko medium: fan-out attendees, latency dan stale-result mixing; batasi konkurensi/request pada halaman aktif dan cegah response lama menimpa query baru. Dependency KEL-139 tetap native/contract; klaim lama belum-merge pada issue diganti dengan status delivery yang harus diperiksa ulang sebelum implementasi. Perbarui docs report chooser.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_queries/queries.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_components`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_actions`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_lib/schema.ts`

## Edge Cases

- Siswa hanya ada pada sesi halaman 11+ dan siswa yang muncul di banyak sesi.
- Nama kelas serupa, hasil search kosong, custom role tanpa permission query terkait.
- Query diganti saat response lama belum selesai atau anggota dicabut.
- Enrolment dropped/student tidak lagi diajar; API pagination malformed/max-page.

## Testing / Validation

- [ ] Fixture lebih dari 1000 session/enrollment, temukan siswa pada halaman berikutnya lewat search/pagination.
- [ ] Test Teacher dua langkah kelas → siswa tanpa enrollment:read dan dengan sesi/attendees scoped.
- [ ] Test stale results, request volume per halaman, dedup, API partial failure/batas paging.
- [ ] Browser Creator/Teacher/custom role membuat laporan dari pilihan sah serta invalid enrollment ditolak.
- [ ] Regression test happy path, validasi/error, dan authorization sesuai scope
- [ ] Formatter, lint, type check, unit/integration test dan build repository terkait lulus
- [ ] Required GitHub CI setiap PR ke main sukses sebelum merge
- [ ] Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan

## Out of Scope

- Perubahan backend atau permission Teacher.
- Global student-name search API baru untuk Teacher.
- Akses parent ke laporan dan ekspor PDF.

## AI Orchestrator Contract

```json
{
  "draftKey": "report-student-search-picker",
  "projectKey": "tutor-session-operations",
  "title": "Pilihan siswa di form laporan tidak terpotong pada 1000 sesi/enrollment",
  "type": "Improvement",
  "priority": "Low",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "web-tutor-student-reports"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "KEL-139 memakai MAX_AUX_PAGES=10 untuk enrollment/session picker (maksimum 1000 record), sehingga student pada halaman berikutnya tidak tersedia. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Pilih pencarian server: Creator mencari siswa/kelas; Teacher mencari/memilih kelas lalu siswa yang diajar melalui sessions?mine=true dan attendees existing.",
    "goal": "Form laporan menyediakan pemilih siswa berbasis pencarian dan pagination eksplisit tanpa memuat seluruh riwayat atau memotong diam-diam pada 1000 record.",
    "requirements": [
      "Creator/custom role dengan enrollment:read menggunakan enrollment search server atas nama siswa/kelas dan hasil paginated.",
      "Teacher tanpa enrollment:read memakai alur dua langkah: cari/pilih kelas yang diajar, lalu pilih siswa dari sesi mine=true dan attendees scoped.",
      "Hasil dibaca bertahap saat pencarian/pagination, tanpa prefetch seluruh riwayat setiap buka form; deduplikasi siswa/enrollment yang muncul di beberapa sesi.",
      "Jangan berhenti diam-diam pada MAX_AUX_PAGES=10; lanjutkan pagination matching-data sesuai batas API, tampilkan batas/error eksplisit bila batas API absolut tercapai.",
      "Pertahankan permission, scope tenant, guard tutor dan validasi report enrollment existing; hasil stale tidak boleh mengganti pilihan baru."
    ],
    "acceptanceCriteria": [
      "Creator dapat menemukan enrollment sah lewat pencarian nama siswa/kelas di luar 1000 record awal.",
      "Teacher dapat mencari/memilih kelas dan menemukan siswa sah dari halaman sesi/attendees di luar 1000 record awal.",
      "Form tidak mengunduh seluruh riwayat saat pertama dibuka; hasil pagination bisa dilanjutkan secara eksplisit.",
      "Empty/loading/error serta batas API ditampilkan jelas; tidak ada truncation diam-diam.",
      "Teacher tetap tanpa enrollment:read dan hanya melihat siswa yang diajar; custom role menggunakan jalur sesuai permission.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Opsi pencarian server dipilih. Backend existing enrollment search mencocokkan siswa/kelas, sessions search mencocokkan kelas saja. Jangan menjanjikan pencarian nama siswa global untuk Teacher atau menambah permission/enpoint baru. Implementasi web memakai existing scoped endpoints dengan pagination; API MaxPage=1000 dan MaxPageSize=100 tetap dihormati dan batas absolut ditampilkan bila tercapai. Risiko medium: fan-out attendees, latency dan stale-result mixing; batasi konkurensi/request pada halaman aktif dan cegah response lama menimpa query baru. Dependency KEL-139 tetap native/contract; klaim lama belum-merge pada issue diganti dengan status delivery yang harus diperiksa ulang sebelum implementasi. Perbarui docs report chooser.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_queries/queries.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_components",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_actions",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/reports/_lib/schema.ts"
    ],
    "edgeCases": [
      "Siswa hanya ada pada sesi halaman 11+ dan siswa yang muncul di banyak sesi.",
      "Nama kelas serupa, hasil search kosong, custom role tanpa permission query terkait.",
      "Query diganti saat response lama belum selesai atau anggota dicabut.",
      "Enrolment dropped/student tidak lagi diajar; API pagination malformed/max-page."
    ],
    "testingValidation": [
      "Fixture lebih dari 1000 session/enrollment, temukan siswa pada halaman berikutnya lewat search/pagination.",
      "Test Teacher dua langkah kelas → siswa tanpa enrollment:read dan dengan sesi/attendees scoped.",
      "Test stale results, request volume per halaman, dedup, API partial failure/batas paging.",
      "Browser Creator/Teacher/custom role membuat laporan dari pilihan sah serta invalid enrollment ditolak.",
      "Regression test happy path, validasi/error, dan authorization sesuai scope",
      "Formatter, lint, type check, unit/integration test dan build repository terkait lulus",
      "Required GitHub CI setiap PR ke main sukses sebelum merge",
      "Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan"
    ],
    "outOfScope": [
      "Perubahan backend atau permission Teacher.",
      "Global student-name search API baru untuk Teacher.",
      "Akses parent ke laporan dan ekspor PDF."
    ]
  }
}
```
