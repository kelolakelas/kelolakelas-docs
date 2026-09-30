## Background / Problem

Nama tenant di katalog hanya menautkan filter `/kelas?tenant_id=` (`kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx:10`). Identity hanya mengekspos `GetTenantPublicInfo` lewat gRPC (`internal/delivery/grpc/tenant_handler.go:59-85`); tidak ada endpoint HTTP publik tenant. Field tenant: name, phone, address, address_formatted, lat/lng, about (jsonb bebas), dan status (`internal/domain/tenant.go:19-35`).

## Goal

Pengunjung dapat melihat halaman profil tenant aktif dengan informasi publik dan kelas yang dipublikasikan.

## Requirements

- Endpoint publik identity untuk profil tenant aktif yang hanya mengembalikan field publik yang disepakati (nama, alamat terformat, koordinat, dan subset `about` yang terdokumentasi).
- Tenant nonaktif atau tidak ada mengembalikan 404; kebijakan katalog publik yang diterapkan (ADR 0036) dihormati.
- Gateway meneruskan route publik.
- Halaman web profil tenant menampilkan info dan daftar kelas dari katalog dengan filter tenant; tautan dari kartu katalog dan detail kelas diarahkan ke profil.

## Acceptance Criteria

- [ ] Profil tenant aktif tampil dengan kelas yang dipublikasikan.
- [ ] Nomor telepon, status internal, dan field non-publik tidak ada di respons.
- [ ] Tenant nonaktif menghasilkan halaman tidak ditemukan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Field `about` berbentuk jsonb bebas; tentukan subset publik yang eksplisit, dan bila bentuknya tidak dapat dipastikan, jangan ekspos. Terapkan rate limit gateway yang ada. Pertimbangkan metadata SEO dasar. Perbarui `kelolakelas-docs` (api/identity.md, api/gateway.md, components/web.md).

Relevant areas:

- `kelolakelas-identity-service/internal/domain/tenant.go`
- `kelolakelas-identity-service/cmd/server/main.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx`
- `kelolakelas-web/app/(public)/kelas/[id]/page.tsx`

## Edge Cases

- Tenant tanpa kelas terpublikasi.
- Tenant tanpa lokasi.
- UUID tidak valid.

## Testing / Validation

- [ ] Unit test handler identity untuk field publik saja dan tenant nonaktif.
- [ ] Router test gateway; go vet, go test -race, dan build lulus.
- [ ] Vitest halaman profil; test, lint, type check, dan build web lulus.

## Out of Scope

- Upload logo dan galeri.
- Slug URL kustom.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-public-profile-page",
  "projectKey": "tenant-storefront-growth",
  "title": "Calon parent dapat membuka profil publik tenant beserta kelas yang dipublikasikan",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "identity",
    "api-gateway",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "api-gateway",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Nama tenant di katalog hanya menautkan filter `/kelas?tenant_id=` (`kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx:10`). Identity hanya mengekspos `GetTenantPublicInfo` lewat gRPC (`internal/delivery/grpc/tenant_handler.go:59-85`); tidak ada endpoint HTTP publik tenant. Field tenant: name, phone, address, address_formatted, lat/lng, about (jsonb bebas), dan status (`internal/domain/tenant.go:19-35`).",
    "goal": "Pengunjung dapat melihat halaman profil tenant aktif dengan informasi publik dan kelas yang dipublikasikan.",
    "requirements": [
      "Endpoint publik identity untuk profil tenant aktif yang hanya mengembalikan field publik yang disepakati (nama, alamat terformat, koordinat, dan subset `about` yang terdokumentasi).",
      "Tenant nonaktif atau tidak ada mengembalikan 404; kebijakan katalog publik yang diterapkan (ADR 0036) dihormati.",
      "Gateway meneruskan route publik.",
      "Halaman web profil tenant menampilkan info dan daftar kelas dari katalog dengan filter tenant; tautan dari kartu katalog dan detail kelas diarahkan ke profil."
    ],
    "acceptanceCriteria": [
      "Profil tenant aktif tampil dengan kelas yang dipublikasikan.",
      "Nomor telepon, status internal, dan field non-publik tidak ada di respons.",
      "Tenant nonaktif menghasilkan halaman tidak ditemukan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Field `about` berbentuk jsonb bebas; tentukan subset publik yang eksplisit, dan bila bentuknya tidak dapat dipastikan, jangan ekspos. Terapkan rate limit gateway yang ada. Pertimbangkan metadata SEO dasar. Perbarui `kelolakelas-docs` (api/identity.md, api/gateway.md, components/web.md).",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/domain/tenant.go",
      "kelolakelas-identity-service/cmd/server/main.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx",
      "kelolakelas-web/app/(public)/kelas/[id]/page.tsx"
    ],
    "edgeCases": [
      "Tenant tanpa kelas terpublikasi.",
      "Tenant tanpa lokasi.",
      "UUID tidak valid."
    ],
    "testingValidation": [
      "Unit test handler identity untuk field publik saja dan tenant nonaktif.",
      "Router test gateway; go vet, go test -race, dan build lulus.",
      "Vitest halaman profil; test, lint, type check, dan build web lulus."
    ],
    "outOfScope": [
      "Upload logo dan galeri.",
      "Slug URL kustom."
    ]
  }
}
```
