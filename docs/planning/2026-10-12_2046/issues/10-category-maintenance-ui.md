## Background / Problem

L2-02: Categories tab text-only; category delete endpoint ada tetapi tidak dipanggil UI.

## Goal

Tenant dapat mengedit dan menghapus kategori dari dashboard

## Requirements

- Sediakan edit name/description dan delete dengan konfirmasi in-page serta loading/error.
- Gunakan PATCH baru dan DELETE existing; tampilkan category-in-use refusal existing, jangan menambah kebijakan count sendiri.
- Sembunyikan actions sesuai permissions tetapi backend tetap authorization.

## Acceptance Criteria

- [ ] Rename tersimpan/reload dan wizard menggunakan nama baru.
- [ ] Delete unused berhasil; referenced category rejection tampil tanpa hilang input.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. web classes page categories tab read-only; backend category_usecase.go:52-72 menolak CountActiveClasses>0; gateway categories DELETE existing. Hop Server Action → PATCH/DELETE categories → gateway → academic; hanya web sesudah server issue. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] Vitest actions/UI validation dan real scoped delete refusal.
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
  "draftKey": "category-maintenance-ui",
  "projectKey": "qa-category-maintenance",
  "title": "Tenant dapat mengedit dan menghapus kategori dari dashboard",
  "type": "Feature",
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
    "category-update-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L2-02: Categories tab text-only; category delete endpoint ada tetapi tidak dipanggil UI.",
    "goal": "Tenant dapat mengedit dan menghapus kategori dari dashboard",
    "requirements": [
      "Sediakan edit name/description dan delete dengan konfirmasi in-page serta loading/error.",
      "Gunakan PATCH baru dan DELETE existing; tampilkan category-in-use refusal existing, jangan menambah kebijakan count sendiri.",
      "Sembunyikan actions sesuai permissions tetapi backend tetap authorization."
    ],
    "acceptanceCriteria": [
      "Rename tersimpan/reload dan wizard menggunakan nama baru.",
      "Delete unused berhasil; referenced category rejection tampil tanpa hilang input.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. web classes page categories tab read-only; backend category_usecase.go:52-72 menolak CountActiveClasses>0; gateway categories DELETE existing. Hop Server Action → PATCH/DELETE categories → gateway → academic; hanya web sesudah server issue. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "Vitest actions/UI validation dan real scoped delete refusal.",
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
