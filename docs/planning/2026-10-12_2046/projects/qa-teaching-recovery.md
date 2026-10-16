## Tujuan/outcome

QA: sesi dan identitas laporan pengajaran

## Masalah yang diselesaikan

Temuan QA stack nyata menunjukkan flow belum dapat dipakai secara konsisten.

## Nilai dan prioritas

Prioritas berdasarkan impact QA, confidence kode origin/main; tidak mengklaim bukti produksi.

## Scope

- Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher
- Respons report menyertakan identitas student dan class untuk daftar
- Tenant dapat menugaskan teacher pada jadwal private hasil approval

## Di luar scope

- Redesign domain, pembayaran dan perubahan policy tanpa keputusan owner.

## Success metrics

- Acceptance criteria tiap issue terverifikasi pada stack nyata.

## Dependencies/risiko

- Issue berkeputusan owner tetap tanpa ai-ready.

## Issue yang diusulkan

1. Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher (`session-calendar-timestamp-label`)
2. Respons report menyertakan identitas student dan class untuk daftar (`report-list-enrollment-identities`)
3. Tenant dapat menugaskan teacher pada jadwal private hasil approval (`private-teacher-assignment-policy`)

## AI Orchestrator Project Contract

```json
{
  "key": "qa-teaching-recovery",
  "name": "QA: sesi dan identitas laporan pengajaran",
  "outcome": "QA: sesi dan identitas laporan pengajaran",
  "problem": "Temuan QA stack nyata menunjukkan flow belum dapat dipakai secara konsisten.",
  "valueAndPriority": "Prioritas berdasarkan impact QA, confidence kode origin/main; tidak mengklaim bukti produksi.",
  "scope": [
    "Tanggal sesi dari timestamp API tampil di kartu dan dialog teacher",
    "Respons report menyertakan identitas student dan class untuk daftar",
    "Tenant dapat menugaskan teacher pada jadwal private hasil approval"
  ],
  "outOfScope": [
    "Redesign domain, pembayaran dan perubahan policy tanpa keputusan owner."
  ],
  "successMetrics": [
    "Acceptance criteria tiap issue terverifikasi pada stack nyata."
  ],
  "dependenciesAndRisks": [
    "Issue berkeputusan owner tetap tanpa ai-ready."
  ]
}
```
