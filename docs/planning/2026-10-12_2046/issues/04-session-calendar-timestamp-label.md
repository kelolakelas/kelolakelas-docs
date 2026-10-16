## Background / Problem

L4-01: sesi berisi 2026-10-12T00:00:00Z ditampilkan — pada card/attendance/reschedule. Regresi layar KEL-137/KEL-138.

## Goal

Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher

## Requirements

- Normalisasikan kontrak session_date timestamp midnight aktual sebagai calendar date tanpa shift hari.
- Tetap mendukung date-only dan fallback invalid/missing; gunakan boundary bersama semua pemanggil.

## Acceptance Criteria

- [ ] Card dan dialog menampilkan 12/13 Oktober untuk fixture API aktual.
- [ ] Invalid/missing tetap fallback, bukan tanggal palsu.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. sessions/_lib/schema.ts:809-814 hanya DATE_PATTERN; SessionCard.tsx:125,136 memberikan raw value. Hop _queries GET /sessions → gateway router.go → academic time.Time JSON (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi.

Relevant areas:

- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] Unit fixtures real timestamp/date-only/invalid termasuk zona waktu.
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
  "draftKey": "session-calendar-timestamp-label",
  "projectKey": "qa-teaching-recovery",
  "title": "Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L4-01: sesi berisi 2026-10-12T00:00:00Z ditampilkan — pada card/attendance/reschedule. Regresi layar KEL-137/KEL-138.",
    "goal": "Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher",
    "requirements": [
      "Normalisasikan kontrak session_date timestamp midnight aktual sebagai calendar date tanpa shift hari.",
      "Tetap mendukung date-only dan fallback invalid/missing; gunakan boundary bersama semua pemanggil."
    ],
    "acceptanceCriteria": [
      "Card dan dialog menampilkan 12/13 Oktober untuk fixture API aktual.",
      "Invalid/missing tetap fallback, bukan tanggal palsu.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. sessions/_lib/schema.ts:809-814 hanya DATE_PATTERN; SessionCard.tsx:125,136 memberikan raw value. Hop _queries GET /sessions → gateway router.go → academic time.Time JSON (read-only). Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. ",
    "relevantAreas": [
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "Unit fixtures real timestamp/date-only/invalid termasuk zona waktu.",
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
