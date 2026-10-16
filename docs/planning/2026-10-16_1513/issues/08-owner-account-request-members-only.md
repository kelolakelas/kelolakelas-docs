## Background / Problem

Testing 16 Oktober 2026: Creator requests tampil melalui tenant layout di seluruh halaman; user meminta Owner Account Request hanya di Members.

## Goal

Entry dan flow request akun owner sisi tenant hanya tersedia di Members.

## Requirements

- Ganti visible copy Creator Request/Creator requests ke Owner Account Request pada entry, heading, form/status dan pesan terkait.
- Pindahkan entry serta form/status tenant ke Members, hapus dari layout global dan pertahankan guard existing.
- Arahkan URL tenant creator-requests lama ke konteks Members agar bukan halaman tenant terpisah.
- Pertahankan submit/status serta platform review terproteksi; jangan rename API/role Creator atau mengubah ownership policy.

## Acceptance Criteria

- [ ] Hanya Members menampilkan entry/form/status tenant, untuk pengguna berhak.
- [ ] Halaman tenant lain tidak menampilkan entry lama maupun pengganti.
- [ ] URL lama menuju Members; submit/status dan platform review tetap berfungsi dengan wording konsisten.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti tenant/layout.tsx:15/:36, tenant/creator-requests/page.tsx:9, tenant/members/page.tsx:70, lib/creator-requests.ts:63, platform/creator-requests/page.tsx:13. Asumsi hanya Members berlaku sisi tenant; platform reviewer tetap butuh flow review. P-KEL-17 deferred ownership policy bukan blocker copy/placement ini. Tidak perlu identity API change.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/members/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/creator-requests`
- `kelolakelas-web/lib/creator-requests.ts`
- `kelolakelas-web/app/platform/creator-requests/page.tsx`
- `kelolakelas-web/app/platform/page.tsx`

## Edge Cases

- User tanpa izin request/read members; bookmark/direct URL.
- Request pending/approved/rejected.

## Testing / Validation

- [ ] Test visibility Members vs Classes/Chat/halaman lain dan URL lama.
- [ ] Uji submit/status, platform review, guards dan sisa wording user-facing lama.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Ownership transfer policy, internal role names dan identity schema.

## AI Orchestrator Contract

```json
{
  "draftKey": "owner-account-request-members-only",
  "projectKey": null,
  "title": "Ubah Creator Request menjadi Owner Account Request dan pindahkan ke Members",
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
    "backgroundProblem": "Testing 16 Oktober 2026: Creator requests tampil melalui tenant layout di seluruh halaman; user meminta Owner Account Request hanya di Members.",
    "goal": "Entry dan flow request akun owner sisi tenant hanya tersedia di Members.",
    "requirements": [
      "Ganti visible copy Creator Request/Creator requests ke Owner Account Request pada entry, heading, form/status dan pesan terkait.",
      "Pindahkan entry serta form/status tenant ke Members, hapus dari layout global dan pertahankan guard existing.",
      "Arahkan URL tenant creator-requests lama ke konteks Members agar bukan halaman tenant terpisah.",
      "Pertahankan submit/status serta platform review terproteksi; jangan rename API/role Creator atau mengubah ownership policy."
    ],
    "acceptanceCriteria": [
      "Hanya Members menampilkan entry/form/status tenant, untuk pengguna berhak.",
      "Halaman tenant lain tidak menampilkan entry lama maupun pengganti.",
      "URL lama menuju Members; submit/status dan platform review tetap berfungsi dengan wording konsisten.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti tenant/layout.tsx:15/:36, tenant/creator-requests/page.tsx:9, tenant/members/page.tsx:70, lib/creator-requests.ts:63, platform/creator-requests/page.tsx:13. Asumsi hanya Members berlaku sisi tenant; platform reviewer tetap butuh flow review. P-KEL-17 deferred ownership policy bukan blocker copy/placement ini. Tidak perlu identity API change.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/layout.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/members/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/creator-requests",
      "kelolakelas-web/lib/creator-requests.ts",
      "kelolakelas-web/app/platform/creator-requests/page.tsx",
      "kelolakelas-web/app/platform/page.tsx"
    ],
    "edgeCases": [
      "User tanpa izin request/read members; bookmark/direct URL.",
      "Request pending/approved/rejected."
    ],
    "testingValidation": [
      "Test visibility Members vs Classes/Chat/halaman lain dan URL lama.",
      "Uji submit/status, platform review, guards dan sisa wording user-facing lama.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Ownership transfer policy, internal role names dan identity schema."
    ]
  }
}
```
