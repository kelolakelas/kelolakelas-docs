## Background / Problem

L5-04: localhost 200/404 tidak memiliki CSP/frame/nosniff/referrer headers; belum ada exploit dan production edge unknown.

## Goal

Tetapkan baseline security headers dan ownership app versus edge

## Requirements

- Kelola baseline security headers pada aplikasi web agar behavior lokal dan deployment konsisten.
- Terapkan X-Content-Type-Options: nosniff, Referrer-Policy yang membatasi kebocoran referrer lintas origin, dan penolakan embedding frame.
- Mulai CSP dengan inventarisasi sumber dan mode report-only yang kompatibel; jangan enforce CSP sebelum bukti kompatibilitas tersedia.
- Dokumentasikan ownership app/edge, boundary dev/production, serta cara memeriksa header pada response normal/error; hindari policy ganda yang konflik.

## Acceptance Criteria

- [ ] Respons nyata 200 dan 404 aplikasi memiliki baseline nosniff/referrer/frame-denial.
- [ ] Ownership app dicatat dan dapat diuji tanpa bergantung pada konfigurasi edge.
- [ ] CSP awal report-only: inventaris sumber Next.js/payment disertakan dan tidak memblokir fitur.
- [ ] Hydration, devtools, assets dan hosted payment redirect tetap berfungsi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. next.config.ts:3-5 config kosong. Direct web HTTP response, tidak melewati gateway; hanya web jika opsi app dipilih. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Ownership berada pada aplikasi. Baseline nosniff + Referrer-Policy + frame-denial; CSP dimulai inventory/report-only. Referrer-Policy strict-origin-when-cross-origin dan frame-denial X-Frame-Options DENY mengikuti baseline umum, perlu dicek kompatibilitas response aktual. CSP enforcement, HSTS production dan perubahan edge bukan asumsi/default scope issue. Risiko high: headers/CSP dapat merusak hydration atau provider flow; lakukan browser compatibility test dan pastikan tidak ada duplicate/conflicting header.

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
- [ ] Inventaris sumber/script/frame/network yang dipakai web dan provider; uji CSP report-only tanpa memblokir hydration/checkout
- [ ] Regression test happy path, validasi/error, dan authorization sesuai scope
- [ ] Formatter, lint, type check, unit/integration test dan build repository terkait lulus
- [ ] Required GitHub CI setiap PR ke main sukses sebelum merge
- [ ] Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan

## Out of Scope

- Perubahan kebijakan pembayaran/refund dan desain ulang sistem.
- Perubahan repository yang tidak tercantum dalam kontrak.
- CSP enforcement dan HSTS production
- Provisioning/configuration edge atau layanan pelaporan CSP eksternal

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
      "Kelola baseline security headers pada aplikasi web agar behavior lokal dan deployment konsisten.",
      "Terapkan X-Content-Type-Options: nosniff, Referrer-Policy yang membatasi kebocoran referrer lintas origin, dan penolakan embedding frame.",
      "Mulai CSP dengan inventarisasi sumber dan mode report-only yang kompatibel; jangan enforce CSP sebelum bukti kompatibilitas tersedia.",
      "Dokumentasikan ownership app/edge, boundary dev/production, serta cara memeriksa header pada response normal/error; hindari policy ganda yang konflik."
    ],
    "acceptanceCriteria": [
      "Respons nyata 200 dan 404 aplikasi memiliki baseline nosniff/referrer/frame-denial.",
      "Ownership app dicatat dan dapat diuji tanpa bergantung pada konfigurasi edge.",
      "CSP awal report-only: inventaris sumber Next.js/payment disertakan dan tidak memblokir fitur.",
      "Hydration, devtools, assets dan hosted payment redirect tetap berfungsi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. next.config.ts:3-5 config kosong. Direct web HTTP response, tidak melewati gateway; hanya web jika opsi app dipilih. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Ownership berada pada aplikasi. Baseline nosniff + Referrer-Policy + frame-denial; CSP dimulai inventory/report-only. Referrer-Policy strict-origin-when-cross-origin dan frame-denial X-Frame-Options DENY mengikuti baseline umum, perlu dicek kompatibilitas response aktual. CSP enforcement, HSTS production dan perubahan edge bukan asumsi/default scope issue. Risiko high: headers/CSP dapat merusak hydration atau provider flow; lakukan browser compatibility test dan pastikan tidak ada duplicate/conflicting header.",
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
      "Acceptance criteria are manually or automatically verified",
      "Inventaris sumber/script/frame/network yang dipakai web dan provider; uji CSP report-only tanpa memblokir hydration/checkout",
      "Regression test happy path, validasi/error, dan authorization sesuai scope",
      "Formatter, lint, type check, unit/integration test dan build repository terkait lulus",
      "Required GitHub CI setiap PR ke main sukses sebelum merge",
      "Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan"
    ],
    "outOfScope": [
      "Perubahan kebijakan pembayaran/refund dan desain ulang sistem.",
      "Perubahan repository yang tidak tercantum dalam kontrak.",
      "CSP enforcement dan HSTS production",
      "Provisioning/configuration edge atau layanan pelaporan CSP eksternal"
    ]
  }
}
```
