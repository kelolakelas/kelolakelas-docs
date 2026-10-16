## Background / Problem

Di form Invite Member (`/dashboard/tenant/members`), seluruh checkbox "Assigned Permissions" (49 permission) sudah tercentang sebelum role dipilih, karena `activePermissions` jatuh ke semua permission tenant saat role kosong dan checkbox memakai `defaultChecked`. Server action membaca `permissionIds` tetapi hanya mengirim `{ email, role_id }` ke `POST /api/v1/invitations`, dan payload identity (`CreateInvitationPayload`) memang hanya menerima `role_id` dan `email`. Admin dapat mengira undangan memberi semua akses atau bahwa mencentang/menghapus centang berpengaruh, padahal undangan selalu memakai permission role terpilih.

## Goal

Form undang anggota menampilkan permission secara jujur: hanya permission milik role terpilih, sebagai informasi read-only, tanpa kesan bahwa permission per undangan dapat diatur.

## Requirements

- Sebelum role dipilih, form tidak menampilkan daftar semua permission sebagai terpilih.
- Setelah role dipilih, form menampilkan permission role tersebut sebagai informasi read-only (bukan checkbox yang dapat diubah).
- Server action dan schema tidak lagi menerima atau memvalidasi `permissionIds` yang diabaikan.
- Payload ke `POST /api/v1/invitations` tetap `{ email, role_id }`, dan validasi email/role serta pesan error yang ada tidak berubah.

## Acceptance Criteria

- [ ] Membuka form Invite Member tanpa memilih role tidak menampilkan permission yang tercentang.
- [ ] Memilih role "Teacher" menampilkan permission role Teacher sebagai daftar read-only.
- [ ] Mengirim undangan tetap berhasil dan undangan memakai role terpilih.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Permission per undangan tidak didukung identity (`internal/delivery/http/handler/invitation_handler.go` `CreateInvitationPayload`); menambah fitur itu adalah keputusan produk terpisah. Role yang permission-nya kosong perlu ditangani tanpa jatuh ke daftar semua permission. Perbarui kelolakelas-docs `docs/components/web.md` bila form undangan dijelaskan.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_components/InviteMemberForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_actions/actions.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_schemas/schema.ts`

## Edge Cases

- Role tanpa permission.
- Daftar role atau permission gagal dimuat.
- Role diganti setelah dipilih.

## Testing / Validation

- [ ] Vitest untuk form: tidak ada permission tercentang sebelum role dipilih, dan permission role tampil read-only setelah dipilih.
- [ ] Test action bahwa payload hanya berisi email dan role.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Permission khusus per undangan atau per anggota.
- Perubahan API identity.

## AI Orchestrator Contract

```json
{
  "draftKey": "invite-member-permission-display",
  "projectKey": null,
  "title": "Form undang anggota menampilkan checkbox permission yang semuanya tercentang tetapi diabaikan",
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
    "backgroundProblem": "Di form Invite Member (`/dashboard/tenant/members`), seluruh checkbox \"Assigned Permissions\" (49 permission) sudah tercentang sebelum role dipilih, karena `activePermissions` jatuh ke semua permission tenant saat role kosong dan checkbox memakai `defaultChecked`. Server action membaca `permissionIds` tetapi hanya mengirim `{ email, role_id }` ke `POST /api/v1/invitations`, dan payload identity (`CreateInvitationPayload`) memang hanya menerima `role_id` dan `email`. Admin dapat mengira undangan memberi semua akses atau bahwa mencentang/menghapus centang berpengaruh, padahal undangan selalu memakai permission role terpilih.",
    "goal": "Form undang anggota menampilkan permission secara jujur: hanya permission milik role terpilih, sebagai informasi read-only, tanpa kesan bahwa permission per undangan dapat diatur.",
    "requirements": [
      "Sebelum role dipilih, form tidak menampilkan daftar semua permission sebagai terpilih.",
      "Setelah role dipilih, form menampilkan permission role tersebut sebagai informasi read-only (bukan checkbox yang dapat diubah).",
      "Server action dan schema tidak lagi menerima atau memvalidasi `permissionIds` yang diabaikan.",
      "Payload ke `POST /api/v1/invitations` tetap `{ email, role_id }`, dan validasi email/role serta pesan error yang ada tidak berubah."
    ],
    "acceptanceCriteria": [
      "Membuka form Invite Member tanpa memilih role tidak menampilkan permission yang tercentang.",
      "Memilih role \"Teacher\" menampilkan permission role Teacher sebagai daftar read-only.",
      "Mengirim undangan tetap berhasil dan undangan memakai role terpilih.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Permission per undangan tidak didukung identity (`internal/delivery/http/handler/invitation_handler.go` `CreateInvitationPayload`); menambah fitur itu adalah keputusan produk terpisah. Role yang permission-nya kosong perlu ditangani tanpa jatuh ke daftar semua permission. Perbarui kelolakelas-docs `docs/components/web.md` bila form undangan dijelaskan.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_components/InviteMemberForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_actions/actions.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/members/_schemas/schema.ts"
    ],
    "edgeCases": [
      "Role tanpa permission.",
      "Daftar role atau permission gagal dimuat.",
      "Role diganti setelah dipilih."
    ],
    "testingValidation": [
      "Vitest untuk form: tidak ada permission tercentang sebelum role dipilih, dan permission role tampil read-only setelah dipilih.",
      "Test action bahwa payload hanya berisi email dan role.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Permission khusus per undangan atau per anggota.",
      "Perubahan API identity."
    ]
  }
}
```
