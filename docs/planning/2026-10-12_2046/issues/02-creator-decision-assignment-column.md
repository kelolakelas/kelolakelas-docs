## Background / Problem

L5-03: kedua keputusan menghasilkan 500 SQLSTATE 42703; request tetap pending. Regresi KEL-95.

## Goal

Approve dan reject Creator memakai primary key assignment yang benar

## Requirements

- Select/lock user_id pada platform_admin_assignments, bukan kolom id yang tidak ada.
- Pertahankan transaksi, live admin lock, stale target checks dan audit.

## Acceptance Criteria

- [ ] Approve target valid berhasil satu kali dan reject menyimpan alasan.
- [ ] Target stale/revoked admin/replay menghasilkan domain 4xx tanpa role tambahan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/creator_decision_repository.go:32 SELECT id; migrations/000002_platform_admin.up.sql user_id PK. Hop DecisionForm/action → gateway router.go:144-145 → identity creator_decision_handler.go. Hanya identity berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-identity-service/internal`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] PostgreSQL tests dengan migrasi sebenarnya untuk approve, reject, race/replay dan revoked admin.
- [ ] verifikasi manual terhadap stack lokal (web → gateway → identity)
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
  "draftKey": "creator-decision-assignment-column",
  "projectKey": "qa-platform-recovery",
  "title": "Approve dan reject Creator memakai primary key assignment yang benar",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "ai-ready"
  ],
  "repositories": [
    "identity"
  ],
  "blockedByDraftKeys": [
    "platform-totp-enrollment-version"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L5-03: kedua keputusan menghasilkan 500 SQLSTATE 42703; request tetap pending. Regresi KEL-95.",
    "goal": "Approve dan reject Creator memakai primary key assignment yang benar",
    "requirements": [
      "Select/lock user_id pada platform_admin_assignments, bukan kolom id yang tidak ada.",
      "Pertahankan transaksi, live admin lock, stale target checks dan audit."
    ],
    "acceptanceCriteria": [
      "Approve target valid berhasil satu kali dan reject menyimpan alasan.",
      "Target stale/revoked admin/replay menghasilkan domain 4xx tanpa role tambahan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/creator_decision_repository.go:32 SELECT id; migrations/000002_platform_admin.up.sql user_id PK. Hop DecisionForm/action → gateway router.go:144-145 → identity creator_decision_handler.go. Hanya identity berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-identity-service/internal"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "PostgreSQL tests dengan migrasi sebenarnya untuk approve, reject, race/replay dan revoked admin.",
      "verifikasi manual terhadap stack lokal (web → gateway → identity)",
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
