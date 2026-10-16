## Background / Problem

QA menemukan dua masalah pada form auth. (1) Registrasi organisasi (`/register` → Register Organization) dengan password terlalu pendek menampilkan pesan validasi, tetapi semua field (nama organisasi, telepon, alamat, nama, email) ikut kosong sehingga pengguna harus mengetik ulang semuanya. (2) Login dengan password salah mengosongkan field email, dan banner hijau "Account created successfully. Sign in to continue." (dari `?registered=1`) tetap tampil bersama pesan error merah. Form memakai `useActionState` dengan `<form action>`; React me-reset form uncontrolled setelah action selesai, dan tidak ada input yang memakai `defaultValue` dari state (`TenantRegisterForm.tsx`, `ParentRegisterForm.tsx`, dan `LoginForm.tsx` memiliki 0 `defaultValue`). Action state juga tidak mengembalikan nilai input.

## Goal

Pengguna tidak kehilangan isian non-rahasia ketika registrasi atau login gagal, dan halaman login tidak menampilkan pesan sukses dan gagal secara bersamaan.

## Requirements

- Setelah registrasi organisasi, registrasi parent, atau login gagal (validasi maupun penolakan backend), field non-rahasia (email, nama, nama organisasi, telepon, alamat) tetap berisi nilai yang dikirim.
- Field password dikosongkan setelah kegagalan dan tidak pernah dikembalikan dari server.
- Banner "Account created successfully" tidak tampil lagi setelah ada percobaan login yang menghasilkan pesan error.
- Validasi, pesan error per field, dan redirect sukses yang ada tidak berubah.

## Acceptance Criteria

- [ ] Mengirim registrasi organisasi dengan password terlalu pendek menampilkan error dan semua field non-password tetap terisi.
- [ ] Mengirim registrasi parent dengan input tidak valid mempertahankan field non-password.
- [ ] Login dengan password salah mempertahankan email dan hanya menampilkan pesan error.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Mekanisme (mengembalikan nilai non-rahasia dari action, controlled input, atau validasi klien) diserahkan ke implementasi dengan mengikuti pola form lain di repo. Nilai password tidak boleh masuk ke action state, log, atau markup. Perbarui kelolakelas-docs `docs/components/web.md` bila bagian auth menjelaskan perilaku form.

Relevant areas:

- `kelolakelas-web/app/(auth)/register/_components/TenantRegisterForm.tsx`
- `kelolakelas-web/app/(auth)/register/_components/ParentRegisterForm.tsx`
- `kelolakelas-web/app/(auth)/register/_actions/actions.ts`
- `kelolakelas-web/app/(auth)/login/_components/LoginForm.tsx`
- `kelolakelas-web/app/(auth)/login/_actions/actions.ts`

## Edge Cases

- Email yang sudah terdaftar (409) saat registrasi.
- Gateway tidak dapat dihubungi saat login.
- Login dari `/login?registered=1&redirectTo=...`.

## Testing / Validation

- [ ] Vitest untuk ketiga form: nilai non-password tetap ada setelah state error dan password kosong.
- [ ] Vitest bahwa banner registered tidak tampil bersama pesan error login.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan aturan validasi password atau API identity.
- Form auth lain (forgot/reset password, registrasi undangan).

## AI Orchestrator Contract

```json
{
  "draftKey": "auth-forms-preserve-input",
  "projectKey": null,
  "title": "Form registrasi dan login mengosongkan semua isian saat validasi atau login gagal",
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
    "backgroundProblem": "QA menemukan dua masalah pada form auth. (1) Registrasi organisasi (`/register` → Register Organization) dengan password terlalu pendek menampilkan pesan validasi, tetapi semua field (nama organisasi, telepon, alamat, nama, email) ikut kosong sehingga pengguna harus mengetik ulang semuanya. (2) Login dengan password salah mengosongkan field email, dan banner hijau \"Account created successfully. Sign in to continue.\" (dari `?registered=1`) tetap tampil bersama pesan error merah. Form memakai `useActionState` dengan `<form action>`; React me-reset form uncontrolled setelah action selesai, dan tidak ada input yang memakai `defaultValue` dari state (`TenantRegisterForm.tsx`, `ParentRegisterForm.tsx`, dan `LoginForm.tsx` memiliki 0 `defaultValue`). Action state juga tidak mengembalikan nilai input.",
    "goal": "Pengguna tidak kehilangan isian non-rahasia ketika registrasi atau login gagal, dan halaman login tidak menampilkan pesan sukses dan gagal secara bersamaan.",
    "requirements": [
      "Setelah registrasi organisasi, registrasi parent, atau login gagal (validasi maupun penolakan backend), field non-rahasia (email, nama, nama organisasi, telepon, alamat) tetap berisi nilai yang dikirim.",
      "Field password dikosongkan setelah kegagalan dan tidak pernah dikembalikan dari server.",
      "Banner \"Account created successfully\" tidak tampil lagi setelah ada percobaan login yang menghasilkan pesan error.",
      "Validasi, pesan error per field, dan redirect sukses yang ada tidak berubah."
    ],
    "acceptanceCriteria": [
      "Mengirim registrasi organisasi dengan password terlalu pendek menampilkan error dan semua field non-password tetap terisi.",
      "Mengirim registrasi parent dengan input tidak valid mempertahankan field non-password.",
      "Login dengan password salah mempertahankan email dan hanya menampilkan pesan error.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Mekanisme (mengembalikan nilai non-rahasia dari action, controlled input, atau validasi klien) diserahkan ke implementasi dengan mengikuti pola form lain di repo. Nilai password tidak boleh masuk ke action state, log, atau markup. Perbarui kelolakelas-docs `docs/components/web.md` bila bagian auth menjelaskan perilaku form.",
    "relevantAreas": [
      "kelolakelas-web/app/(auth)/register/_components/TenantRegisterForm.tsx",
      "kelolakelas-web/app/(auth)/register/_components/ParentRegisterForm.tsx",
      "kelolakelas-web/app/(auth)/register/_actions/actions.ts",
      "kelolakelas-web/app/(auth)/login/_components/LoginForm.tsx",
      "kelolakelas-web/app/(auth)/login/_actions/actions.ts"
    ],
    "edgeCases": [
      "Email yang sudah terdaftar (409) saat registrasi.",
      "Gateway tidak dapat dihubungi saat login.",
      "Login dari `/login?registered=1&redirectTo=...`."
    ],
    "testingValidation": [
      "Vitest untuk ketiga form: nilai non-password tetap ada setelah state error dan password kosong.",
      "Vitest bahwa banner registered tidak tampil bersama pesan error login.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan aturan validasi password atau API identity.",
      "Form auth lain (forgot/reset password, registrasi undangan)."
    ]
  }
}
```
