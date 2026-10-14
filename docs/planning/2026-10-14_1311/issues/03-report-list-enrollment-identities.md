## Background / Problem

L4-02: report normal tampil Siswa · Kelas walau enrollment picker mengenal nama. Tidak sama dengan KEL-167 yang membatasi pilihan >1000.

## Goal

Respons report menyertakan identitas student dan class untuk daftar

## Requirements

- Lengkapi report list/detail tenant dan parent dengan relasi nama enrollment yang diperlukan consumer, tanpa membuka protected data tambahan.
- Pertahankan tenant ownership, parent ownership dan tutor predicates; jangan gunakan unscoped lookup.

## Acceptance Criteria

- [ ] Report daftar dapat membedakan student/class sebenarnya pada payload nyata.
- [ ] Foreign tenant/parent tetap 404 atau scoped empty dan tidak ada data lain bocor.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/report_repository.go:26,33,76 hanya Preload Enrollment; web reports/_lib/schema.ts:423-454 mencari enrollment.student/class. Hop GET /reports → gateway router.go:197-201 → academic report repository; web/gateway read-only. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-academic-service/internal`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] PostgreSQL tests scoped list/detail dan minimal fields yang diizinkan.
- [ ] verifikasi manual terhadap stack lokal (web → gateway → academic)
- [ ] Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified

## Out of Scope

- Perubahan kebijakan pembayaran/refund dan desain ulang sistem.
- Perubahan repository yang tidak tercantum dalam kontrak.

## AI Orchestrator Contract

```json
{
  "draftKey": "report-list-enrollment-identities",
  "projectKey": "qa-teaching-recovery",
  "title": "Respons report menyertakan identitas student dan class untuk daftar",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L4-02: report normal tampil Siswa · Kelas walau enrollment picker mengenal nama. Tidak sama dengan KEL-167 yang membatasi pilihan >1000.",
    "goal": "Respons report menyertakan identitas student dan class untuk daftar",
    "requirements": [
      "Lengkapi report list/detail tenant dan parent dengan relasi nama enrollment yang diperlukan consumer, tanpa membuka protected data tambahan.",
      "Pertahankan tenant ownership, parent ownership dan tutor predicates; jangan gunakan unscoped lookup."
    ],
    "acceptanceCriteria": [
      "Report daftar dapat membedakan student/class sebenarnya pada payload nyata.",
      "Foreign tenant/parent tetap 404 atau scoped empty dan tidak ada data lain bocor.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/report_repository.go:26,33,76 hanya Preload Enrollment; web reports/_lib/schema.ts:423-454 mencari enrollment.student/class. Hop GET /reports → gateway router.go:197-201 → academic report repository; web/gateway read-only. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-academic-service/internal"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "PostgreSQL tests scoped list/detail dan minimal fields yang diizinkan.",
      "verifikasi manual terhadap stack lokal (web → gateway → academic)",
      "Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Perubahan kebijakan pembayaran/refund dan desain ulang sistem.",
      "Perubahan repository yang tidak tercantum dalam kontrak."
    ]
  }
}
```
