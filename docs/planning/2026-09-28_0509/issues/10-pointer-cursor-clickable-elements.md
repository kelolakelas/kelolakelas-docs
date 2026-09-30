## Background / Problem

Web memakai Tailwind CSS v4. Preflight v4 tidak lagi memberi `cursor: pointer` pada `button` (`node_modules/tailwindcss/preflight.css`), dan `app/globals.css` tidak menambahkan base rule. Hanya 2 file yang memakai `cursor-pointer`, padahal ada sekitar 99 elemen `<button>`. Akibatnya tab Parent/Organization di `app/(auth)/register/_components/RegisterFormSwitch.tsx` dan tombol lain terlihat tidak dapat diklik.

## Goal

Semua elemen interaktif yang aktif menampilkan cursor pointer, dan elemen nonaktif tidak menampilkannya.

## Requirements

- Base style global memberi `cursor: pointer` pada button, elemen `role="button"`/`role="tab"`, `summary`, `select`, label yang terhubung ke checkbox/radio, serta input checkbox, radio, submit, button, dan reset yang tidak disabled.
- Elemen disabled menampilkan `cursor: not-allowed` tanpa mengubah perilaku `disabled:cursor-not-allowed` yang sudah ada.
- Tab registrasi Parent/Organization menampilkan cursor pointer.
- Tidak ada perubahan tampilan lain.

## Acceptance Criteria

- [ ] Hover pada tab registrasi, tombol form, tombol dialog, dan checkbox izin role menampilkan pointer.
- [ ] Tombol disabled menampilkan not-allowed.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Perubahan cukup satu base layer di `app/globals.css` sesuai konvensi Tailwind v4 (`@layer base`), tanpa menambah `cursor-pointer` per komponen. Utility per komponen yang sudah ada tetap berlaku. Perbarui kelolakelas-docs `docs/components/web.md` bila konvensi styling didokumentasikan.

Relevant areas:

- `kelolakelas-web/app/globals.css`
- `kelolakelas-web/app/(auth)/register/_components/RegisterFormSwitch.tsx`

## Edge Cases

- Elemen dengan `aria-disabled="true"` tetapi tidak `disabled`.
- Link yang dirender sebagai `<a>` tetap memakai pointer bawaan browser.

## Testing / Validation

- [ ] Verifikasi manual di halaman register, katalog dan detail kelas, dashboard tenant, dan dashboard parent.
- [ ] Existing tests pass, `npm run lint` pass, `next build` pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Redesign visual komponen.
- Perubahan komponen per halaman.

## AI Orchestrator Contract

```json
{
  "draftKey": "pointer-cursor-clickable-elements",
  "projectKey": null,
  "title": "Elemen yang dapat diklik di web menampilkan cursor pointer",
  "type": "Improvement",
  "priority": "Low",
  "estimate": "S",
  "complexity": "very-low",
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
    "backgroundProblem": "Web memakai Tailwind CSS v4. Preflight v4 tidak lagi memberi `cursor: pointer` pada `button` (`node_modules/tailwindcss/preflight.css`), dan `app/globals.css` tidak menambahkan base rule. Hanya 2 file yang memakai `cursor-pointer`, padahal ada sekitar 99 elemen `<button>`. Akibatnya tab Parent/Organization di `app/(auth)/register/_components/RegisterFormSwitch.tsx` dan tombol lain terlihat tidak dapat diklik.",
    "goal": "Semua elemen interaktif yang aktif menampilkan cursor pointer, dan elemen nonaktif tidak menampilkannya.",
    "requirements": [
      "Base style global memberi `cursor: pointer` pada button, elemen `role=\"button\"`/`role=\"tab\"`, `summary`, `select`, label yang terhubung ke checkbox/radio, serta input checkbox, radio, submit, button, dan reset yang tidak disabled.",
      "Elemen disabled menampilkan `cursor: not-allowed` tanpa mengubah perilaku `disabled:cursor-not-allowed` yang sudah ada.",
      "Tab registrasi Parent/Organization menampilkan cursor pointer.",
      "Tidak ada perubahan tampilan lain."
    ],
    "acceptanceCriteria": [
      "Hover pada tab registrasi, tombol form, tombol dialog, dan checkbox izin role menampilkan pointer.",
      "Tombol disabled menampilkan not-allowed.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Perubahan cukup satu base layer di `app/globals.css` sesuai konvensi Tailwind v4 (`@layer base`), tanpa menambah `cursor-pointer` per komponen. Utility per komponen yang sudah ada tetap berlaku. Perbarui kelolakelas-docs `docs/components/web.md` bila konvensi styling didokumentasikan.",
    "relevantAreas": [
      "kelolakelas-web/app/globals.css",
      "kelolakelas-web/app/(auth)/register/_components/RegisterFormSwitch.tsx"
    ],
    "edgeCases": [
      "Elemen dengan `aria-disabled=\"true\"` tetapi tidak `disabled`.",
      "Link yang dirender sebagai `<a>` tetap memakai pointer bawaan browser."
    ],
    "testingValidation": [
      "Verifikasi manual di halaman register, katalog dan detail kelas, dashboard tenant, dan dashboard parent.",
      "Existing tests pass, `npm run lint` pass, `next build` pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Redesign visual komponen.",
      "Perubahan komponen per halaman."
    ]
  }
}
```
