## Background / Problem

L2-02: category hanya create/list/delete; nama salah tidak dapat diedit. origin/main categoryUsecase tidak memiliki UpdateCategory.

## Goal

Tenant dapat memperbarui nama dan deskripsi kategori melalui API scoped

## Requirements

- Tambahkan category:update permission dengan grant Creator migration sesuai pola permission existing.
- PATCH /api/v1/categories/:id accepts optional name/description; absent unchanged, blank name invalid, tenant dari JWT.
- Gateway protected PATCH proxy, Swagger dan tests.

## Acceptance Criteria

- [ ] Member berwenang dapat rename kategori tenant sendiri; kelas tetap menunjuk ID sama.
- [ ] Foreign tenant/not authorized/malformed input ditolak tanpa perubahan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic internal/usecase/category_usecase.go:20-24 dan cmd/server/routes.go:49-51 hanya create/list/delete; gateway router.go categories belum PATCH; identity category:update tidak ditemukan. Hop web future PATCH → gateway baru → academic baru → identity CheckPermission existing. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope.

Relevant areas:

- `kelolakelas-identity-service/internal`
- `kelolakelas-academic-service/internal`
- `kelolakelas-api-gateway/internal`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] Route/permission migration dan PostgreSQL scoped update tests.
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
  "draftKey": "category-update-api",
  "projectKey": "qa-category-maintenance",
  "title": "Tenant dapat memperbarui nama dan deskripsi kategori melalui API scoped",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L2-02: category hanya create/list/delete; nama salah tidak dapat diedit. origin/main categoryUsecase tidak memiliki UpdateCategory.",
    "goal": "Tenant dapat memperbarui nama dan deskripsi kategori melalui API scoped",
    "requirements": [
      "Tambahkan category:update permission dengan grant Creator migration sesuai pola permission existing.",
      "PATCH /api/v1/categories/:id accepts optional name/description; absent unchanged, blank name invalid, tenant dari JWT.",
      "Gateway protected PATCH proxy, Swagger dan tests."
    ],
    "acceptanceCriteria": [
      "Member berwenang dapat rename kategori tenant sendiri; kelas tetap menunjuk ID sama.",
      "Foreign tenant/not authorized/malformed input ditolak tanpa perubahan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. academic internal/usecase/category_usecase.go:20-24 dan cmd/server/routes.go:49-51 hanya create/list/delete; gateway router.go categories belum PATCH; identity category:update tidak ditemukan. Hop web future PATCH → gateway baru → academic baru → identity CheckPermission existing. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. ",
    "relevantAreas": [
      "kelolakelas-identity-service/internal",
      "kelolakelas-academic-service/internal",
      "kelolakelas-api-gateway/internal"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "Route/permission migration dan PostgreSQL scoped update tests.",
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
