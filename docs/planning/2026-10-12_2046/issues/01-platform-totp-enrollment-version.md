## Background / Problem

L5-01: kode TOTP benar mengonsumsi challenge dan menyimpan factor 2 tetapi mengembalikan 401; login baru berhasil. Regresi KEL-105.

## Goal

Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan

## Requirements

- Gunakan satu next factor version yang sama untuk update store dan nilai return.
- Pertahankan konsumsi atomik challenge, batas percobaan, revokasi dan larangan password-only.

## Acceptance Criteria

- [ ] Enrollment pertama menghasilkan verified token dan dapat membuka /platform.
- [ ] Replay challenge ditolak; persisted version sama dengan version token.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/platform_factor.go:175-178 meng-update Model(&a) lalu menghitung a.FactorVersion+1 lagi; GORM memutasi model. Hop web platform/login/actions.ts → gateway router.go:106 → identity platform_handler.go → store. Hanya identity berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-identity-service/internal`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] PostgreSQL integration menggunakan migrasi nyata: first enroll, login berikutnya, replay, revoked assignment.
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
  "draftKey": "platform-totp-enrollment-version",
  "projectKey": "qa-platform-recovery",
  "title": "Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan",
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
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L5-01: kode TOTP benar mengonsumsi challenge dan menyimpan factor 2 tetapi mengembalikan 401; login baru berhasil. Regresi KEL-105.",
    "goal": "Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan",
    "requirements": [
      "Gunakan satu next factor version yang sama untuk update store dan nilai return.",
      "Pertahankan konsumsi atomik challenge, batas percobaan, revokasi dan larangan password-only."
    ],
    "acceptanceCriteria": [
      "Enrollment pertama menghasilkan verified token dan dapat membuka /platform.",
      "Replay challenge ditolak; persisted version sama dengan version token.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. internal/repository/platform_factor.go:175-178 meng-update Model(&a) lalu menghitung a.FactorVersion+1 lagi; GORM memutasi model. Hop web platform/login/actions.ts → gateway router.go:106 → identity platform_handler.go → store. Hanya identity berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-identity-service/internal"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "PostgreSQL integration menggunakan migrasi nyata: first enroll, login berikutnya, replay, revoked assignment.",
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
