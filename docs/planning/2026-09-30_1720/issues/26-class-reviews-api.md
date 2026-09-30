## Background / Problem

Tidak ada tabel, route, atau data ulasan di academic maupun gateway; katalog publik (`cmd/server/routes.go:43-44`) tidak memuat rating.

## Goal

Parent dengan enrollment aktif atau selesai dapat memberi satu ulasan per enrollment, dan pengunjung dapat melihat rata-rata rating dan ulasan kelas.

## Requirements

- Parent membuat atau mengubah ulasannya sendiri (rating 1-5 dan komentar opsional dengan batas panjang) untuk enrollment miliknya berstatus active atau completed.
- Endpoint publik daftar ulasan kelas berhalaman, serta rata-rata dan jumlah rating pada detail katalog.
- Ulasan publik tidak menampilkan nama siswa, email, atau identitas lengkap parent.
- Gateway meneruskan route baru.

## Acceptance Criteria

- [ ] Parent tanpa enrollment yang memenuhi syarat ditolak.
- [ ] Satu enrollment hanya menghasilkan satu ulasan, dan edit menggantikan isinya.
- [ ] Rata-rata di detail katalog sesuai dengan ulasan yang tersimpan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: penyalahgunaan (ulasan palsu atau ganda) dan kebocoran identitas. Kepemilikan dicek dengan pola `parent_id` enrollment. Komentar disimpan sebagai teks polos dan di-escape saat render. Tenant tidak dapat menghapus ulasan; moderasi platform ditunda. Perbarui `kelolakelas-docs` (api/academic.md, data/academic-schema.md, api/gateway.md).

Relevant areas:

- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-academic-service/internal/domain/catalog.go`
- `kelolakelas-academic-service/internal/repository/enrollment_repository.go`
- `kelolakelas-academic-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Enrollment di-drop setelah ulasan dibuat.
- Kelas tanpa ulasan.
- Dua request create serentak untuk enrollment sama.

## Testing / Validation

- [ ] Postgres integration test keunikan serentak dan kepemilikan sebagai mitigasi penyalahgunaan.
- [ ] Unit test bahwa respons publik tidak memuat data pribadi.
- [ ] Router test gateway, go vet, go test -race, dan build lulus.

## Out of Scope

- Moderasi dan balasan tenant.
- Layar web ulasan.

## AI Orchestrator Contract

```json
{
  "draftKey": "class-reviews-api",
  "projectKey": "tenant-storefront-growth",
  "title": "Parent yang pernah terdaftar dapat memberi rating dan ulasan kelas",
  "type": "Feature",
  "priority": "Low",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tidak ada tabel, route, atau data ulasan di academic maupun gateway; katalog publik (`cmd/server/routes.go:43-44`) tidak memuat rating.",
    "goal": "Parent dengan enrollment aktif atau selesai dapat memberi satu ulasan per enrollment, dan pengunjung dapat melihat rata-rata rating dan ulasan kelas.",
    "requirements": [
      "Parent membuat atau mengubah ulasannya sendiri (rating 1-5 dan komentar opsional dengan batas panjang) untuk enrollment miliknya berstatus active atau completed.",
      "Endpoint publik daftar ulasan kelas berhalaman, serta rata-rata dan jumlah rating pada detail katalog.",
      "Ulasan publik tidak menampilkan nama siswa, email, atau identitas lengkap parent.",
      "Gateway meneruskan route baru."
    ],
    "acceptanceCriteria": [
      "Parent tanpa enrollment yang memenuhi syarat ditolak.",
      "Satu enrollment hanya menghasilkan satu ulasan, dan edit menggantikan isinya.",
      "Rata-rata di detail katalog sesuai dengan ulasan yang tersimpan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: penyalahgunaan (ulasan palsu atau ganda) dan kebocoran identitas. Kepemilikan dicek dengan pola `parent_id` enrollment. Komentar disimpan sebagai teks polos dan di-escape saat render. Tenant tidak dapat menghapus ulasan; moderasi platform ditunda. Perbarui `kelolakelas-docs` (api/academic.md, data/academic-schema.md, api/gateway.md).",
    "relevantAreas": [
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-academic-service/internal/domain/catalog.go",
      "kelolakelas-academic-service/internal/repository/enrollment_repository.go",
      "kelolakelas-academic-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Enrollment di-drop setelah ulasan dibuat.",
      "Kelas tanpa ulasan.",
      "Dua request create serentak untuk enrollment sama."
    ],
    "testingValidation": [
      "Postgres integration test keunikan serentak dan kepemilikan sebagai mitigasi penyalahgunaan.",
      "Unit test bahwa respons publik tidak memuat data pribadi.",
      "Router test gateway, go vet, go test -race, dan build lulus."
    ],
    "outOfScope": [
      "Moderasi dan balasan tenant.",
      "Layar web ulasan."
    ]
  }
}
```
