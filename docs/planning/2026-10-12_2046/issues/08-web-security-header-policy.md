## Background / Problem

L5-04: localhost 200/404 tidak memiliki CSP/frame/nosniff/referrer headers; belum ada exploit dan production edge unknown.

## Goal

Tetapkan baseline security headers dan ownership app versus edge

## Requirements

- Putuskan app atau edge ownership dan kompatibilitas frame/CSP sebelum implementasi.
- Dokumentasikan boundary dev/production; jangan mengklaim HSTS localhost sebagai production evidence.

## Acceptance Criteria

- [ ] Header responses real 200/404 sesuai baseline owner.
- [ ] Next hydration, devtools dan provider payment flow tetap berfungsi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. next.config.ts:3-5 config kosong. Direct web HTTP response, tidak melewati gateway; hanya web jika opsi app dipilih. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) App nosniff + Referrer-Policy + frame-denial, CSP inventory/report-only kemudian (rekomendasi), 2) edge-owned policy dengan bukti deployment observable. CSP enforcement/HSTS bukan asumsi default. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.

Relevant areas:

- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] HTTP response tests dan browser hydration/payment compatibility.
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
  "draftKey": "web-security-header-policy",
  "projectKey": null,
  "title": "Tetapkan baseline security headers dan ownership app versus edge",
  "type": "Improvement",
  "priority": "Low",
  "estimate": "M",
  "complexity": "high",
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
    "backgroundProblem": "L5-04: localhost 200/404 tidak memiliki CSP/frame/nosniff/referrer headers; belum ada exploit dan production edge unknown.",
    "goal": "Tetapkan baseline security headers dan ownership app versus edge",
    "requirements": [
      "Putuskan app atau edge ownership dan kompatibilitas frame/CSP sebelum implementasi.",
      "Dokumentasikan boundary dev/production; jangan mengklaim HSTS localhost sebagai production evidence."
    ],
    "acceptanceCriteria": [
      "Header responses real 200/404 sesuai baseline owner.",
      "Next hydration, devtools dan provider payment flow tetap berfungsi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. next.config.ts:3-5 config kosong. Direct web HTTP response, tidak melewati gateway; hanya web jika opsi app dipilih. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) App nosniff + Referrer-Policy + frame-denial, CSP inventory/report-only kemudian (rekomendasi), 2) edge-owned policy dengan bukti deployment observable. CSP enforcement/HSTS bukan asumsi default. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.",
    "relevantAreas": [
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "HTTP response tests dan browser hydration/payment compatibility.",
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
