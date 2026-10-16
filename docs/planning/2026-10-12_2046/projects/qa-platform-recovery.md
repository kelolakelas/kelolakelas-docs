## Tujuan/outcome

QA: pemulihan alur platform admin

## Masalah yang diselesaikan

Temuan QA stack nyata menunjukkan flow belum dapat dipakai secara konsisten.

## Nilai dan prioritas

Prioritas berdasarkan impact QA, confidence kode origin/main; tidak mengklaim bukti produksi.

## Scope

- Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan
- Approve dan reject Creator memakai primary key assignment yang benar
- Guard web menerima tenant zero UUID pada verified platform session

## Di luar scope

- Redesign domain, pembayaran dan perubahan policy tanpa keputusan owner.

## Success metrics

- Acceptance criteria tiap issue terverifikasi pada stack nyata.

## Dependencies/risiko

- Issue berkeputusan owner tetap tanpa ai-ready.

## Issue yang diusulkan

1. Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan (`platform-totp-enrollment-version`)
2. Approve dan reject Creator memakai primary key assignment yang benar (`creator-decision-assignment-column`)
3. Guard web menerima tenant zero UUID pada verified platform session (`platform-zero-tenant-scope`)

## AI Orchestrator Project Contract

```json
{
  "key": "qa-platform-recovery",
  "name": "QA: pemulihan alur platform admin",
  "outcome": "QA: pemulihan alur platform admin",
  "problem": "Temuan QA stack nyata menunjukkan flow belum dapat dipakai secara konsisten.",
  "valueAndPriority": "Prioritas berdasarkan impact QA, confidence kode origin/main; tidak mengklaim bukti produksi.",
  "scope": [
    "Enrollment TOTP pertama menerbitkan sesi dengan factor version yang tersimpan",
    "Approve dan reject Creator memakai primary key assignment yang benar",
    "Guard web menerima tenant zero UUID pada verified platform session"
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
