## Background / Problem

Detail kelas publik (`app/(public)/kelas/[id]/page.tsx`) dan kartu katalog tidak menampilkan rating atau ulasan.

## Goal

Pengunjung melihat rating dan ulasan pada detail kelas, dan parent yang memenuhi syarat dapat menulis ulasan dari enrollment-nya.

## Requirements

- Ringkasan rating dan daftar ulasan berhalaman di detail kelas; rata-rata di kartu katalog bila tersedia.
- Form ulasan (rating yang dapat diakses keyboard dan komentar) dari halaman enrollment parent untuk enrollment yang memenuhi syarat.
- State kosong saat belum ada ulasan.

## Acceptance Criteria

- [ ] Parent mengirim ulasan dan ulasan tampil di detail kelas.
- [ ] Kontrol rating dapat dioperasikan keyboard dan terbaca screen reader.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Komentar dirender sebagai teks, bukan HTML. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/page.tsx`
- `kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx`

## Edge Cases

- Parent mengubah ulasan yang sudah ada.
- Komentar sangat panjang.

## Testing / Validation

- [ ] Vitest untuk form rating dan render ulasan.
- [ ] Test, lint, type check, dan production build lulus.

## Out of Scope

- Pelaporan ulasan tidak pantas.
- Balasan tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-class-reviews",
  "projectKey": "tenant-storefront-growth",
  "title": "Detail kelas menampilkan rating dan ulasan, dan parent dapat menulis ulasan",
  "type": "Feature",
  "priority": "Low",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "class-reviews-api"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Detail kelas publik (`app/(public)/kelas/[id]/page.tsx`) dan kartu katalog tidak menampilkan rating atau ulasan.",
    "goal": "Pengunjung melihat rating dan ulasan pada detail kelas, dan parent yang memenuhi syarat dapat menulis ulasan dari enrollment-nya.",
    "requirements": [
      "Ringkasan rating dan daftar ulasan berhalaman di detail kelas; rata-rata di kartu katalog bila tersedia.",
      "Form ulasan (rating yang dapat diakses keyboard dan komentar) dari halaman enrollment parent untuk enrollment yang memenuhi syarat.",
      "State kosong saat belum ada ulasan."
    ],
    "acceptanceCriteria": [
      "Parent mengirim ulasan dan ulasan tampil di detail kelas.",
      "Kontrol rating dapat dioperasikan keyboard dan terbaca screen reader.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Komentar dirender sebagai teks, bukan HTML. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/page.tsx",
      "kelolakelas-web/app/(public)/kelas/_components/CatalogCard.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx"
    ],
    "edgeCases": [
      "Parent mengubah ulasan yang sudah ada.",
      "Komentar sangat panjang."
    ],
    "testingValidation": [
      "Vitest untuk form rating dan render ulasan.",
      "Test, lint, type check, dan production build lulus."
    ],
    "outOfScope": [
      "Pelaporan ulasan tidak pantas.",
      "Balasan tenant."
    ]
  }
}
```
