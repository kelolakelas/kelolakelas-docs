## Background / Problem

L4-F01/L2-05 dikonsolidasi: private approval membuat schedule/session tanpa tutor sehingga teacher mine=true kosong; supported substitute API membuka workflow. Group picker L2 adalah deferral KEL-50, bukan bug.

## Goal

Tenant dapat menugaskan teacher pada jadwal private hasil approval

## Requirements

- Teacher boleh belum ditugaskan saat approval; approval tetap membuat enrollment/jadwal dan invoice dengan alur existing.
- Sediakan assignment teacher aktif oleh tenant setelah approval dari dashboard private request/jadwal yang relevan; tampilkan status Belum ditugaskan secara jelas.
- Gunakan tenant_member ID dan validasi membership aktif tenant melalui mekanisme existing, tanpa memilih teacher otomatis.
- Penugasan memperbarui jadwal dan sesi relevan secara konsisten tanpa menghasilkan invoice/enrollment/jadwal duplikat; pertahankan semantik effective-date endpoint existing.

## Acceptance Criteria

- [ ] Approval private tanpa teacher tetap berhasil menurut kontrak existing dan menampilkan Belum ditugaskan.
- [ ] Tenant dapat memilih teacher aktif setelah approval; sesi terkait tampil pada mine=true teacher yang ditugaskan.
- [ ] Teacher asing/nonaktif ditolak sebelum mutasi; kegagalan verifikasi membership fail-closed.
- [ ] Assignment tidak mengubah invoice, harga, atau status pembayaran dan tidak membuat enrollment/schedule duplikat.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic private_schedule_request_usecase.go:178 ClassSchedule tanpa TutorID; web approval UI tanpa picker. Hop approve URL → gateway router.go:236 → academic; GET /tutors sudah proxied :162 ke identity (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Teacher opsional saat approval dan dapat ditugaskan setelahnya; status unassigned wajib eksplisit. Tidak menunda pembayaran atau menambah mandatory teacher pada approval. Gunakan endpoint assignment/schedule/tutor yang telah diproxy jika cocok, sehingga gateway tetap read-only. Validasi membership aktif pada jalur assignment yang dipakai; pertahankan transaksi dan effective-date schedule change existing. Risiko high: session/schedule consistency dan authorization. Dependency native KEL-184 dipertahankan; status Done bukan bukti merge untuk eksekusi.

Relevant areas:

- `kelolakelas-web/app`
- `kelolakelas-academic-service/internal`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] Transaction/failure tests dan membership fail-closed validation.
- [ ] verifikasi manual terhadap stack lokal (web → gateway → academic)
- [ ] Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Regresi approval tanpa tutor, assignment setelah approval, dan invoice retry tidak membuat resource ganda
- [ ] Regression teacher mine=true sebelum/sesudah assignment dan inactive/foreign membership rejection
- [ ] Regression test happy path, validasi/error, dan authorization sesuai scope
- [ ] Formatter, lint, type check, unit/integration test dan build repository terkait lulus
- [ ] Required GitHub CI setiap PR ke main sukses sebelum merge
- [ ] Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan

## Out of Scope

- Perubahan kebijakan pembayaran/refund dan desain ulang sistem.
- Perubahan repository yang tidak tercantum dalam kontrak.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-teacher-assignment-policy",
  "projectKey": "qa-teaching-recovery",
  "title": "Tenant dapat menugaskan teacher pada jadwal private hasil approval",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "web",
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "web",
    "academic"
  ],
  "blockedByDraftKeys": [
    "report-list-enrollment-identities"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L4-F01/L2-05 dikonsolidasi: private approval membuat schedule/session tanpa tutor sehingga teacher mine=true kosong; supported substitute API membuka workflow. Group picker L2 adalah deferral KEL-50, bukan bug.",
    "goal": "Tenant dapat menugaskan teacher pada jadwal private hasil approval",
    "requirements": [
      "Teacher boleh belum ditugaskan saat approval; approval tetap membuat enrollment/jadwal dan invoice dengan alur existing.",
      "Sediakan assignment teacher aktif oleh tenant setelah approval dari dashboard private request/jadwal yang relevan; tampilkan status Belum ditugaskan secara jelas.",
      "Gunakan tenant_member ID dan validasi membership aktif tenant melalui mekanisme existing, tanpa memilih teacher otomatis.",
      "Penugasan memperbarui jadwal dan sesi relevan secara konsisten tanpa menghasilkan invoice/enrollment/jadwal duplikat; pertahankan semantik effective-date endpoint existing."
    ],
    "acceptanceCriteria": [
      "Approval private tanpa teacher tetap berhasil menurut kontrak existing dan menampilkan Belum ditugaskan.",
      "Tenant dapat memilih teacher aktif setelah approval; sesi terkait tampil pada mine=true teacher yang ditugaskan.",
      "Teacher asing/nonaktif ditolak sebelum mutasi; kegagalan verifikasi membership fail-closed.",
      "Assignment tidak mengubah invoice, harga, atau status pembayaran dan tidak membuat enrollment/schedule duplikat.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic private_schedule_request_usecase.go:178 ClassSchedule tanpa TutorID; web approval UI tanpa picker. Hop approve URL → gateway router.go:236 → academic; GET /tutors sudah proxied :162 ke identity (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Teacher opsional saat approval dan dapat ditugaskan setelahnya; status unassigned wajib eksplisit. Tidak menunda pembayaran atau menambah mandatory teacher pada approval. Gunakan endpoint assignment/schedule/tutor yang telah diproxy jika cocok, sehingga gateway tetap read-only. Validasi membership aktif pada jalur assignment yang dipakai; pertahankan transaksi dan effective-date schedule change existing. Risiko high: session/schedule consistency dan authorization. Dependency native KEL-184 dipertahankan; status Done bukan bukti merge untuk eksekusi.",
    "relevantAreas": [
      "kelolakelas-web/app",
      "kelolakelas-academic-service/internal"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "Transaction/failure tests dan membership fail-closed validation.",
      "verifikasi manual terhadap stack lokal (web → gateway → academic)",
      "Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Regresi approval tanpa tutor, assignment setelah approval, dan invoice retry tidak membuat resource ganda",
      "Regression teacher mine=true sebelum/sesudah assignment dan inactive/foreign membership rejection",
      "Regression test happy path, validasi/error, dan authorization sesuai scope",
      "Formatter, lint, type check, unit/integration test dan build repository terkait lulus",
      "Required GitHub CI setiap PR ke main sukses sebelum merge",
      "Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan"
    ],
    "outOfScope": [
      "Perubahan kebijakan pembayaran/refund dan desain ulang sistem.",
      "Perubahan repository yang tidak tercantum dalam kontrak."
    ]
  }
}
```
