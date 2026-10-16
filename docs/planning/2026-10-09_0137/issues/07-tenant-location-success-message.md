## Background / Problem

Di `/dashboard/tenant/settings`, menekan "Simpan lokasi" berhasil (`PUT /api/v1/tenant/settings/location` → 200, data tampil setelah reload), tetapi pesan "Lokasi tenant berhasil disimpan." tidak pernah tampil. Server action memanggil `revalidatePath` lalu mengembalikan status sukses, sementara `settings/page.tsx` memberi `TenantLocationForm` `key` yang memuat `location?.location_updated_at`. Setelah revalidate, nilai itu berubah, form di-remount, dan state `useActionState` berisi pesan sukses hilang.

## Goal

Setelah lokasi tenant berhasil disimpan, pengguna melihat konfirmasi sukses dan form menampilkan nilai tersimpan terbaru.

## Requirements

- Pesan "Lokasi tenant berhasil disimpan." tampil (role=status) setelah simpan lokasi berhasil.
- Form menampilkan koordinat tersimpan terbaru setelah simpan.
- Pesan error validasi dan error API yang ada tetap tampil seperti sebelumnya.
- Form profil tenant di halaman yang sama tidak berubah.

## Acceptance Criteria

- [ ] Menyimpan latitude/longitude yang valid menampilkan pesan sukses tanpa reload.
- [ ] Reload setelah simpan menampilkan nilai yang sama.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Pertahankan kemampuan form menerima nilai baru dari server tanpa menghapus state action. Perbarui kelolakelas-docs `docs/components/web.md` bila perilaku settings dijelaskan.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_components/TenantLocationForm.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_actions/settingsActions.ts`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_components/forms.test.tsx`

## Edge Cases

- Simpan lokasi pertama kali (sebelumnya belum ada lokasi).
- Simpan dua kali berturut-turut.
- Pengguna read-only yang tidak boleh menyimpan.

## Testing / Validation

- [ ] Vitest bahwa pesan sukses tampil setelah action sukses dan tetap ada ketika data lokasi berubah.
- [ ] Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual.

## Out of Scope

- Perubahan API lokasi tenant.
- Pemilihan lokasi lewat peta.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-location-success-message",
  "projectKey": null,
  "title": "Pesan sukses \"Lokasi tenant berhasil disimpan\" tidak pernah tampil setelah simpan lokasi",
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
    "backgroundProblem": "Di `/dashboard/tenant/settings`, menekan \"Simpan lokasi\" berhasil (`PUT /api/v1/tenant/settings/location` → 200, data tampil setelah reload), tetapi pesan \"Lokasi tenant berhasil disimpan.\" tidak pernah tampil. Server action memanggil `revalidatePath` lalu mengembalikan status sukses, sementara `settings/page.tsx` memberi `TenantLocationForm` `key` yang memuat `location?.location_updated_at`. Setelah revalidate, nilai itu berubah, form di-remount, dan state `useActionState` berisi pesan sukses hilang.",
    "goal": "Setelah lokasi tenant berhasil disimpan, pengguna melihat konfirmasi sukses dan form menampilkan nilai tersimpan terbaru.",
    "requirements": [
      "Pesan \"Lokasi tenant berhasil disimpan.\" tampil (role=status) setelah simpan lokasi berhasil.",
      "Form menampilkan koordinat tersimpan terbaru setelah simpan.",
      "Pesan error validasi dan error API yang ada tetap tampil seperti sebelumnya.",
      "Form profil tenant di halaman yang sama tidak berubah."
    ],
    "acceptanceCriteria": [
      "Menyimpan latitude/longitude yang valid menampilkan pesan sukses tanpa reload.",
      "Reload setelah simpan menampilkan nilai yang sama.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Pertahankan kemampuan form menerima nilai baru dari server tanpa menghapus state action. Perbarui kelolakelas-docs `docs/components/web.md` bila perilaku settings dijelaskan.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_components/TenantLocationForm.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_actions/settingsActions.ts",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/settings/_components/forms.test.tsx"
    ],
    "edgeCases": [
      "Simpan lokasi pertama kali (sebelumnya belum ada lokasi).",
      "Simpan dua kali berturut-turut.",
      "Pengguna read-only yang tidak boleh menyimpan."
    ],
    "testingValidation": [
      "Vitest bahwa pesan sukses tampil setelah action sukses dan tetap ada ketika data lokasi berubah.",
      "Existing tests pass, `npm run lint` pass, type check/`next build` pass, dan acceptance criteria diverifikasi manual."
    ],
    "outOfScope": [
      "Perubahan API lokasi tenant.",
      "Pemilihan lokasi lewat peta."
    ]
  }
}
```
