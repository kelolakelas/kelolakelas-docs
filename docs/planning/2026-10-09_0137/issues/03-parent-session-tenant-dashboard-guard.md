## Background / Problem

QA menemukan bahwa parent yang login dapat membuka seluruh halaman `/dashboard/tenant/*` (mis. `/dashboard/tenant/members` menampilkan "Tenant Member Management" dan tombol Invite Member). `proxy.ts` hanya memiliki guard `isParentRoute && !is_parent` yang menjauhkan sesi tenant dari `/dashboard/parent/*`, tetapi tidak ada guard sebaliknya. Backend tetap menolak operasi sehingga tidak ada kebocoran data, tetapi parent melihat UI admin tenant yang kosong atau penuh error izin. `lib/auth-routing.ts` sudah menganggap `/dashboard/tenant` hanya untuk sesi non-parent yang punya tenant context saat memilih redirect setelah login.

## Goal

Sesi yang tidak memiliki konteks tenant, termasuk semua sesi parent, tidak dapat membuka halaman di bawah `/dashboard/tenant` dan diarahkan ke entry point yang sesuai.

## Requirements

- Sesi parent (`is_parent: true`) yang membuka `/dashboard/tenant` atau turunannya di-redirect ke `PARENT_DESTINATION` (`/kelas`).
- Sesi terautentikasi non-parent tanpa tenant context yang valid (`hasTenantContext` false) di-redirect ke `UNKNOWN_DESTINATION` (`/`).
- Sesi tenant dengan tenant context tetap dapat membuka `/dashboard/tenant/*` seperti sebelumnya.
- Perilaku yang ada untuk sesi tanpa login, cookie kedaluwarsa, `/dashboard/parent/*`, `/invitations/verify`, dan `/platform/*` tidak berubah.

## Acceptance Criteria

- [ ] Parent yang membuka `/dashboard/tenant/members` berakhir di `/kelas`.
- [ ] Owner tenant tetap dapat membuka `/dashboard/tenant` dan `/dashboard/tenant/members`.
- [ ] Pengunjung tanpa sesi yang membuka `/dashboard/tenant` tetap diarahkan ke `/login?redirectTo=...`.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Guard di `proxy.ts` bersifat optimistik dan tidak memverifikasi tanda tangan JWT; backend tetap otoritas keamanan (kelolakelas-docs `docs/components/web.md`). Pakai ulang `PARENT_DESTINATION`, `UNKNOWN_DESTINATION`, dan `hasTenantContext` dari `lib/auth-routing.ts`. Perbarui kelolakelas-docs `docs/components/web.md` pada paragraf `proxy.ts`.

Relevant areas:

- `kelolakelas-web/proxy.ts`
- `kelolakelas-web/proxy.test.ts`
- `kelolakelas-web/lib/auth-routing.ts`

## Edge Cases

- Token dengan `tenant_id` nil UUID (`00000000-0000-0000-0000-000000000000`).
- Parent membuka `/dashboard/tenant` dengan query string.
- Token platform admin tanpa tenant context.

## Testing / Validation

- [ ] Test `proxy.test.ts` untuk parent → `/kelas`, sesi tanpa tenant context → `/`, dan sesi tenant tetap dilayani.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan otorisasi backend.
- Guard berbasis permission per halaman tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "parent-session-tenant-dashboard-guard",
  "projectKey": null,
  "title": "Sesi parent dapat membuka halaman dashboard tenant karena proxy tidak mengarahkan balik",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
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
    "backgroundProblem": "QA menemukan bahwa parent yang login dapat membuka seluruh halaman `/dashboard/tenant/*` (mis. `/dashboard/tenant/members` menampilkan \"Tenant Member Management\" dan tombol Invite Member). `proxy.ts` hanya memiliki guard `isParentRoute && !is_parent` yang menjauhkan sesi tenant dari `/dashboard/parent/*`, tetapi tidak ada guard sebaliknya. Backend tetap menolak operasi sehingga tidak ada kebocoran data, tetapi parent melihat UI admin tenant yang kosong atau penuh error izin. `lib/auth-routing.ts` sudah menganggap `/dashboard/tenant` hanya untuk sesi non-parent yang punya tenant context saat memilih redirect setelah login.",
    "goal": "Sesi yang tidak memiliki konteks tenant, termasuk semua sesi parent, tidak dapat membuka halaman di bawah `/dashboard/tenant` dan diarahkan ke entry point yang sesuai.",
    "requirements": [
      "Sesi parent (`is_parent: true`) yang membuka `/dashboard/tenant` atau turunannya di-redirect ke `PARENT_DESTINATION` (`/kelas`).",
      "Sesi terautentikasi non-parent tanpa tenant context yang valid (`hasTenantContext` false) di-redirect ke `UNKNOWN_DESTINATION` (`/`).",
      "Sesi tenant dengan tenant context tetap dapat membuka `/dashboard/tenant/*` seperti sebelumnya.",
      "Perilaku yang ada untuk sesi tanpa login, cookie kedaluwarsa, `/dashboard/parent/*`, `/invitations/verify`, dan `/platform/*` tidak berubah."
    ],
    "acceptanceCriteria": [
      "Parent yang membuka `/dashboard/tenant/members` berakhir di `/kelas`.",
      "Owner tenant tetap dapat membuka `/dashboard/tenant` dan `/dashboard/tenant/members`.",
      "Pengunjung tanpa sesi yang membuka `/dashboard/tenant` tetap diarahkan ke `/login?redirectTo=...`.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Guard di `proxy.ts` bersifat optimistik dan tidak memverifikasi tanda tangan JWT; backend tetap otoritas keamanan (kelolakelas-docs `docs/components/web.md`). Pakai ulang `PARENT_DESTINATION`, `UNKNOWN_DESTINATION`, dan `hasTenantContext` dari `lib/auth-routing.ts`. Perbarui kelolakelas-docs `docs/components/web.md` pada paragraf `proxy.ts`.",
    "relevantAreas": [
      "kelolakelas-web/proxy.ts",
      "kelolakelas-web/proxy.test.ts",
      "kelolakelas-web/lib/auth-routing.ts"
    ],
    "edgeCases": [
      "Token dengan `tenant_id` nil UUID (`00000000-0000-0000-0000-000000000000`).",
      "Parent membuka `/dashboard/tenant` dengan query string.",
      "Token platform admin tanpa tenant context."
    ],
    "testingValidation": [
      "Test `proxy.test.ts` untuk parent → `/kelas`, sesi tanpa tenant context → `/`, dan sesi tenant tetap dilayani.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan otorisasi backend.",
      "Guard berbasis permission per halaman tenant."
    ]
  }
}
```
