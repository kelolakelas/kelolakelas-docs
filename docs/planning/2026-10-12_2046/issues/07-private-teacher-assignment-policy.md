## Background / Problem

L4-F01/L2-05 dikonsolidasi: private approval membuat schedule/session tanpa tutor sehingga teacher mine=true kosong; supported substitute API membuka workflow. Group picker L2 adalah deferral KEL-50, bukan bug.

## Goal

Tenant dapat menugaskan teacher pada jadwal private hasil approval

## Requirements

- Tetapkan apakah tutor wajib pada approval sebelum invoice atau boleh unassigned dengan management assignment kemudian.
- Sesudah keputusan, sediakan assignment eksplisit dari active member tenant memakai pemeriksaan membership yang ada; jangan pilih otomatis.

## Acceptance Criteria

- [ ] Teacher terpilih melihat sesi approved dan dapat menjalankan teaching workflow.
- [ ] Foreign/inactive teacher ditolak; payment/enrollment/schedule tidak partially corrupt.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic private_schedule_request_usecase.go:178 ClassSchedule tanpa TutorID; web approval UI tanpa picker. Hop approve URL → gateway router.go:236 → academic; GET /tutors sudah proxied :162 ke identity (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) Optional teacher saat approval + tenant assignment sesudahnya (rekomendasi kompatibilitas: approval/payment lama tetap), 2) wajib teacher sebelum approval/payment. Owner memilih timing/mandatory policy; group tutor picker tetap deferral terpisah. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.

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
      "Tetapkan apakah tutor wajib pada approval sebelum invoice atau boleh unassigned dengan management assignment kemudian.",
      "Sesudah keputusan, sediakan assignment eksplisit dari active member tenant memakai pemeriksaan membership yang ada; jangan pilih otomatis."
    ],
    "acceptanceCriteria": [
      "Teacher terpilih melihat sesi approved dan dapat menjalankan teaching workflow.",
      "Foreign/inactive teacher ditolak; payment/enrollment/schedule tidak partially corrupt.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic private_schedule_request_usecase.go:178 ClassSchedule tanpa TutorID; web approval UI tanpa picker. Hop approve URL → gateway router.go:236 → academic; GET /tutors sudah proxied :162 ke identity (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) Optional teacher saat approval + tenant assignment sesudahnya (rekomendasi kompatibilitas: approval/payment lama tetap), 2) wajib teacher sebelum approval/payment. Owner memilih timing/mandatory policy; group tutor picker tetap deferral terpisah. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.",
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
      "Acceptance criteria are manually or automatically verified"
    ],
    "outOfScope": [
      "Perubahan kebijakan pembayaran/refund dan desain ulang sistem.",
      "Perubahan repository yang tidak tercantum dalam kontrak."
    ]
  }
}
```
