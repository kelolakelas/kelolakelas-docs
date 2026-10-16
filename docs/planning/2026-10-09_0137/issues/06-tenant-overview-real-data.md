## Background / Problem

Overview tenant (`/dashboard/tenant`) menampilkan teks statis yang tidak berasal dari data: sapaan "Welcome back, Tenant Admin" untuk semua pengguna (`tenant/page.tsx`), subjudul sidebar "Tenant Member" yang statis (`TenantSidebar.tsx`), kartu "System Status" yang selalu "Operational / Identity & Academic Services online" tanpa health check (`OverviewMetrics.tsx`), panel "Platform Architecture" berisi copy internal developer ("Next.js PPR Engine"), dan tautan settings berlabel "Organization details & API keys" padahal tidak ada fitur API key. Owner "Rina Owner" dan Teacher "Tono Guru" melihat sapaan yang sama. Status "Operational" palsu dapat menyesatkan saat layanan benar-benar bermasalah.

## Goal

Overview tenant hanya menampilkan informasi yang benar untuk pengguna yang login, tanpa status atau copy internal yang tidak berdasar.

## Requirements

- Sapaan overview tidak lagi menyebut role tetap "Tenant Admin"; gunakan data yang sudah tersedia untuk sesi (mis. nama role dari membership `GET /api/v1/members/me/membership`) atau sapaan netral.
- Subjudul statis "Tenant Member" di footer sidebar dihapus atau diganti data nyata.
- Kartu "System Status" statis dihapus dari overview.
- Panel "Platform Architecture" dihapus dari UI tenant.
- Label tautan settings tidak menyebut "API keys".
- Kartu metrik lain (members, roles, invitations, sales summary) tidak berubah.

## Acceptance Criteria

- [ ] Owner dan Teacher tidak lagi melihat "Welcome back, Tenant Admin".
- [ ] Overview tidak menampilkan "System Status", "Operational", "Platform Architecture", atau "API keys".
- [ ] Sidebar tidak menampilkan subjudul statis "Tenant Member".
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Nama pengguna tidak tersedia di JWT maupun respons membership (`MyMembershipResponse` hanya berisi member_id, role_id, role_name, permissions), sehingga menampilkan nama orang tidak termasuk issue ini. Saat membership gagal dimuat, `roleName` bernilai null dan UI harus tetap wajar. Perbarui kelolakelas-docs `docs/components/web.md` bila overview dijelaskan.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/OverviewMetrics.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_queries/membership.ts`

## Edge Cases

- Membership gagal dimuat (`roleName` null).
- Role custom dengan nama panjang.
- Mode gelap.

## Testing / Validation

- [ ] Vitest/render test overview dan sidebar untuk sapaan, ketiadaan kartu status dan panel arsitektur, dan fallback saat role null.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Menampilkan nama orang (membutuhkan perubahan identity).
- Status kesehatan layanan nyata di dashboard.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-overview-real-data",
  "projectKey": null,
  "title": "Overview tenant menampilkan nama dan status sistem hardcoded, bukan data pengguna atau layanan nyata",
  "type": "Improvement",
  "priority": "Low",
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
    "backgroundProblem": "Overview tenant (`/dashboard/tenant`) menampilkan teks statis yang tidak berasal dari data: sapaan \"Welcome back, Tenant Admin\" untuk semua pengguna (`tenant/page.tsx`), subjudul sidebar \"Tenant Member\" yang statis (`TenantSidebar.tsx`), kartu \"System Status\" yang selalu \"Operational / Identity & Academic Services online\" tanpa health check (`OverviewMetrics.tsx`), panel \"Platform Architecture\" berisi copy internal developer (\"Next.js PPR Engine\"), dan tautan settings berlabel \"Organization details & API keys\" padahal tidak ada fitur API key. Owner \"Rina Owner\" dan Teacher \"Tono Guru\" melihat sapaan yang sama. Status \"Operational\" palsu dapat menyesatkan saat layanan benar-benar bermasalah.",
    "goal": "Overview tenant hanya menampilkan informasi yang benar untuk pengguna yang login, tanpa status atau copy internal yang tidak berdasar.",
    "requirements": [
      "Sapaan overview tidak lagi menyebut role tetap \"Tenant Admin\"; gunakan data yang sudah tersedia untuk sesi (mis. nama role dari membership `GET /api/v1/members/me/membership`) atau sapaan netral.",
      "Subjudul statis \"Tenant Member\" di footer sidebar dihapus atau diganti data nyata.",
      "Kartu \"System Status\" statis dihapus dari overview.",
      "Panel \"Platform Architecture\" dihapus dari UI tenant.",
      "Label tautan settings tidak menyebut \"API keys\".",
      "Kartu metrik lain (members, roles, invitations, sales summary) tidak berubah."
    ],
    "acceptanceCriteria": [
      "Owner dan Teacher tidak lagi melihat \"Welcome back, Tenant Admin\".",
      "Overview tidak menampilkan \"System Status\", \"Operational\", \"Platform Architecture\", atau \"API keys\".",
      "Sidebar tidak menampilkan subjudul statis \"Tenant Member\".",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Nama pengguna tidak tersedia di JWT maupun respons membership (`MyMembershipResponse` hanya berisi member_id, role_id, role_name, permissions), sehingga menampilkan nama orang tidak termasuk issue ini. Saat membership gagal dimuat, `roleName` bernilai null dan UI harus tetap wajar. Perbarui kelolakelas-docs `docs/components/web.md` bila overview dijelaskan.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/OverviewMetrics.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/TenantSidebar.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_queries/membership.ts"
    ],
    "edgeCases": [
      "Membership gagal dimuat (`roleName` null).",
      "Role custom dengan nama panjang.",
      "Mode gelap."
    ],
    "testingValidation": [
      "Vitest/render test overview dan sidebar untuk sapaan, ketiadaan kartu status dan panel arsitektur, dan fallback saat role null.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Menampilkan nama orang (membutuhkan perubahan identity).",
      "Status kesehatan layanan nyata di dashboard."
    ]
  }
}
```
