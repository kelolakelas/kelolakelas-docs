## Background / Problem

`TENANT_NAV_ITEMS` statis (`kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts:7-48`) dirender penuh di `TenantSidebar.tsx:197` dan `MobileNav.tsx:378`, dengan footer tetap "Tenant Admin / Organization Owner" (`TenantSidebar.tsx:228-231`). JWT tidak membawa daftar permission (`kelolakelas-identity-service/pkg/jwt/jwt.go:17-29`) dan `GET /permissions` mengembalikan katalog, bukan permission pemanggil (`role_handler.go:45-61`).

## Goal

Anggota tenant, termasuk pengajar, hanya melihat menu yang dapat dipakainya, beserta nama role yang benar.

## Requirements

- Identity menyediakan endpoint baca untuk anggota tenant yang mengembalikan nama role dan permission dari keanggotaan aktif pemanggil.
- Gateway meneruskan endpoint tersebut di grup protected dengan tenant claim.
- Web memfilter item sidebar dan mobile nav berdasarkan permission, dan menampilkan nama role di footer.
- Backend tetap menjadi penegak akses; penyaringan menu hanya untuk kegunaan.

## Acceptance Criteria

- [ ] Anggota role Teacher tidak melihat menu anggota, role, dan settings bila tidak memiliki permission-nya.
- [ ] Creator melihat semua menu seperti sebelumnya.
- [ ] Bila endpoint permission gagal, web menampilkan menu minimum yang aman dan pesan error, bukan seluruh menu admin.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Permission sudah di-cache di Redis oleh identity; gunakan sumber yang sama dengan CheckPermission agar hasil konsisten (keanggotaan aktif, ADR 0034). Token parent dan platform admin tidak dilayani endpoint ini. Pemetaan menu ke permission ditulis di satu tempat dan dipakai oleh sidebar maupun mobile nav, yang saat ini menduplikasi ikon. Ikuti pola `_queries` dan result type `{data, error}` di web serta docs Next.js lokal (`AGENTS.md`). Perbarui `kelolakelas-docs` (api/identity.md, api/gateway.md, components/web.md).

Relevant areas:

- `kelolakelas-identity-service/internal/delivery/http/handler/role_handler.go`
- `kelolakelas-identity-service/cmd/server/main.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx`

## Edge Cases

- Role kustom tanpa permission apa pun.
- Permission berubah saat sesi berjalan (cache).
- Keanggotaan dinonaktifkan setelah login.

## Testing / Validation

- [ ] Unit test handler identity untuk Creator, Teacher, role kustom, dan keanggotaan nonaktif.
- [ ] Router test gateway untuk route baru.
- [ ] Vitest untuk pemfilteran menu dan fallback error; test, lint, type check, dan build web lulus.
- [ ] Verifikasi manual login sebagai Creator dan Teacher.

## Out of Scope

- Menambahkan menu sesi, laporan, atau keuangan (issue masing-masing).
- Navigasi parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "role-aware-tenant-nav",
  "projectKey": "tutor-session-operations",
  "title": "Menu dashboard tenant hanya menampilkan area yang diizinkan permission anggota",
  "type": "Feature",
  "priority": "High",
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
    "backgroundProblem": "`TENANT_NAV_ITEMS` statis (`kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts:7-48`) dirender penuh di `TenantSidebar.tsx:197` dan `MobileNav.tsx:378`, dengan footer tetap \"Tenant Admin / Organization Owner\" (`TenantSidebar.tsx:228-231`). JWT tidak membawa daftar permission (`kelolakelas-identity-service/pkg/jwt/jwt.go:17-29`) dan `GET /permissions` mengembalikan katalog, bukan permission pemanggil (`role_handler.go:45-61`).",
    "goal": "Anggota tenant, termasuk pengajar, hanya melihat menu yang dapat dipakainya, beserta nama role yang benar.",
    "requirements": [
      "Identity menyediakan endpoint baca untuk anggota tenant yang mengembalikan nama role dan permission dari keanggotaan aktif pemanggil.",
      "Gateway meneruskan endpoint tersebut di grup protected dengan tenant claim.",
      "Web memfilter item sidebar dan mobile nav berdasarkan permission, dan menampilkan nama role di footer.",
      "Backend tetap menjadi penegak akses; penyaringan menu hanya untuk kegunaan."
    ],
    "acceptanceCriteria": [
      "Anggota role Teacher tidak melihat menu anggota, role, dan settings bila tidak memiliki permission-nya.",
      "Creator melihat semua menu seperti sebelumnya.",
      "Bila endpoint permission gagal, web menampilkan menu minimum yang aman dan pesan error, bukan seluruh menu admin.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Permission sudah di-cache di Redis oleh identity; gunakan sumber yang sama dengan CheckPermission agar hasil konsisten (keanggotaan aktif, ADR 0034). Token parent dan platform admin tidak dilayani endpoint ini. Pemetaan menu ke permission ditulis di satu tempat dan dipakai oleh sidebar maupun mobile nav, yang saat ini menduplikasi ikon. Ikuti pola `_queries` dan result type `{data, error}` di web serta docs Next.js lokal (`AGENTS.md`). Perbarui `kelolakelas-docs` (api/identity.md, api/gateway.md, components/web.md).",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/delivery/http/handler/role_handler.go",
      "kelolakelas-identity-service/cmd/server/main.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_constants/constants.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx"
    ],
    "edgeCases": [
      "Role kustom tanpa permission apa pun.",
      "Permission berubah saat sesi berjalan (cache).",
      "Keanggotaan dinonaktifkan setelah login."
    ],
    "testingValidation": [
      "Unit test handler identity untuk Creator, Teacher, role kustom, dan keanggotaan nonaktif.",
      "Router test gateway untuk route baru.",
      "Vitest untuk pemfilteran menu dan fallback error; test, lint, type check, dan build web lulus.",
      "Verifikasi manual login sebagai Creator dan Teacher."
    ],
    "outOfScope": [
      "Menambahkan menu sesi, laporan, atau keuangan (issue masing-masing).",
      "Navigasi parent."
    ]
  }
}
```
