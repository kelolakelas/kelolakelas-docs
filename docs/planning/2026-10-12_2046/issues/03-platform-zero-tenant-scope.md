## Background / Problem

L5-02: antrean Creator, withdrawal dan history menolak token yang API terima 200. Regresi KEL-103/KEL-146/KEL-164.

## Goal

Guard web menerima tenant zero UUID pada verified platform session

## Requirements

- Kenali tenantless shape sah dari identity: missing atau zero UUID; tetap tolak tenant nonzero dan parent.
- Terapkan helper shared pada read dan mutation paths; backend tetap otoritas signature/live factor.

## Acceptance Criteria

- [ ] Verified platform token aktual dapat membaca kedua queue/history.
- [ ] Server actions memakai scope yang sama; tenant/parent dan factor invalid ditolak.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. lib/creator-requests.ts:19 !caller.tenant_id menolak UUID zero; lib/platform-withdrawals.ts memakai helper sama. Identity pkg/jwt/jwt.go:20,87-93 uuid.UUID zero serializes nonempty. Hop web → gateway router.go:143-150 → identity/billing. Gateway/services read-only. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] Vitest fixtures bentuk claim identity asli termasuk zero/nonzero/missing/malformed, read dan mutations.
- [ ] verifikasi manual terhadap stack lokal (web → gateway → identity) dan withdrawal billing
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
  "draftKey": "platform-zero-tenant-scope",
  "projectKey": "qa-platform-recovery",
  "title": "Guard web menerima tenant zero UUID pada verified platform session",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "creator-decision-assignment-column"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L5-02: antrean Creator, withdrawal dan history menolak token yang API terima 200. Regresi KEL-103/KEL-146/KEL-164.",
    "goal": "Guard web menerima tenant zero UUID pada verified platform session",
    "requirements": [
      "Kenali tenantless shape sah dari identity: missing atau zero UUID; tetap tolak tenant nonzero dan parent.",
      "Terapkan helper shared pada read dan mutation paths; backend tetap otoritas signature/live factor."
    ],
    "acceptanceCriteria": [
      "Verified platform token aktual dapat membaca kedua queue/history.",
      "Server actions memakai scope yang sama; tenant/parent dan factor invalid ditolak.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. lib/creator-requests.ts:19 !caller.tenant_id menolak UUID zero; lib/platform-withdrawals.ts memakai helper sama. Identity pkg/jwt/jwt.go:20,87-93 uuid.UUID zero serializes nonempty. Hop web → gateway router.go:143-150 → identity/billing. Gateway/services read-only. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "Vitest fixtures bentuk claim identity asli termasuk zero/nonzero/missing/malformed, read dan mutations.",
      "verifikasi manual terhadap stack lokal (web → gateway → identity) dan withdrawal billing",
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
