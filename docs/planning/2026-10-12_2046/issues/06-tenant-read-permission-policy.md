## Background / Problem

L1-01: Teacher tanpa member:read/role:read/tenant:read membaca members/roles/settings via URL dan API; writes sudah 403. Bukan lintas tenant.

## Goal

Tetapkan dan selaraskan permission baca administrasi tenant

## Requirements

- Setelah keputusan owner, selaraskan API enforcement dan halaman/nav sesuai policy terpilih.
- Pertahankan own membership bootstrap untuk navigation; jangan gate members/me/membership sehingga semua role kehilangan context.

## Acceptance Criteria

- [ ] Matrix Teacher/Creator/custom role sesuai keputusan pada API dan direct URL.
- [ ] Writes dan tenant isolation tidak berubah.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. identity member_handler.go:82-136 dan role_handler.go:122-144 hanya tenant context; web members queries hanya membatasi invitation. Gateway members/roles/tenant routes transparent, tidak berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) Require matching read permissions (rekomendasi; seeded permissions dan nav sudah mendukung), 2) reads terbuka untuk active member dengan nav konsisten. Pilih policy dan scope tenant settings/GetMember sebelum implementasi. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.

Relevant areas:

- `kelolakelas-identity-service/internal`
- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] API authorization matrix dan bootstrap own membership regression.
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
  "draftKey": "tenant-read-permission-policy",
  "projectKey": null,
  "title": "Tetapkan dan selaraskan permission baca administrasi tenant",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L1-01: Teacher tanpa member:read/role:read/tenant:read membaca members/roles/settings via URL dan API; writes sudah 403. Bukan lintas tenant.",
    "goal": "Tetapkan dan selaraskan permission baca administrasi tenant",
    "requirements": [
      "Setelah keputusan owner, selaraskan API enforcement dan halaman/nav sesuai policy terpilih.",
      "Pertahankan own membership bootstrap untuk navigation; jangan gate members/me/membership sehingga semua role kehilangan context."
    ],
    "acceptanceCriteria": [
      "Matrix Teacher/Creator/custom role sesuai keputusan pada API dan direct URL.",
      "Writes dan tenant isolation tidak berubah.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. identity member_handler.go:82-136 dan role_handler.go:122-144 hanya tenant context; web members queries hanya membatasi invitation. Gateway members/roles/tenant routes transparent, tidak berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. KEPUTUSAN OWNER BELUM DIAMBIL: 1) Require matching read permissions (rekomendasi; seeded permissions dan nav sudah mendukung), 2) reads terbuka untuk active member dengan nav konsisten. Pilih policy dan scope tenant settings/GetMember sebelum implementasi. Jangan implementasikan atau tambahkan ai-ready sebelum keputusan dicatat dan kontrak direvisi.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal",
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "API authorization matrix dan bootstrap own membership regression.",
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
