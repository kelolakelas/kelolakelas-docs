## Background / Problem

Testing 16 Oktober 2026: Tombol hapus belum tersedia pada daftar kelas; DELETE backend sudah memiliki class:delete, soft delete dan 409 untuk enrollment aktif.

## Goal

Tenant berizin dapat menghapus kelas melalui daftar dengan konfirmasi.

## Requirements

- Tambahkan aksi desktop/mobile sesuai izin existing dan dialog konfirmasi beridentitas kelas.
- Cancel tanpa DELETE; submit mencegah klik ganda, refresh hanya setelah sukses.
- Tangani 403/404/409 dan network failure; pakai aturan soft delete existing.

## Acceptance Criteria

- [ ] Aksi terlihat untuk pengguna berizin, keyboard accessible, cancel tidak mengubah data.
- [ ] Confirm kelas yang memenuhi aturan menghapusnya dari daftar.
- [ ] Enrollment aktif ditolak dengan pesan jelas dan kelas tetap ada; server tetap authority izin.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti ClassListTable.tsx:249/:326; academic class_usecase.go:69 dan handler/class_handler.go:158. Backend/gateway existing cukup, scope web-only. Update docs aksi kelas.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`

## Edge Cases

- Record terhapus atau enrollment aktif dibuat setelah dialog dibuka.
- Klik ganda, network failure.

## Testing / Validation

- [ ] Test confirm/cancel, permission visibility, refresh dan mapping 403/404/409.
- [ ] Manual keyboard/mobile dan backend active-enrollment refusal.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Hard delete, bulk delete, perubahan kebijakan backend.

## AI Orchestrator Contract

```json
{
  "draftKey": "delete-class-action",
  "projectKey": "tenant-selling-operations",
  "title": "Tambahkan hapus kelas dengan konfirmasi dan penanganan konflik",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "medium",
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
    "backgroundProblem": "Testing 16 Oktober 2026: Tombol hapus belum tersedia pada daftar kelas; DELETE backend sudah memiliki class:delete, soft delete dan 409 untuk enrollment aktif.",
    "goal": "Tenant berizin dapat menghapus kelas melalui daftar dengan konfirmasi.",
    "requirements": [
      "Tambahkan aksi desktop/mobile sesuai izin existing dan dialog konfirmasi beridentitas kelas.",
      "Cancel tanpa DELETE; submit mencegah klik ganda, refresh hanya setelah sukses.",
      "Tangani 403/404/409 dan network failure; pakai aturan soft delete existing."
    ],
    "acceptanceCriteria": [
      "Aksi terlihat untuk pengguna berizin, keyboard accessible, cancel tidak mengubah data.",
      "Confirm kelas yang memenuhi aturan menghapusnya dari daftar.",
      "Enrollment aktif ditolak dengan pesan jelas dan kelas tetap ada; server tetap authority izin.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti ClassListTable.tsx:249/:326; academic class_usecase.go:69 dan handler/class_handler.go:158. Backend/gateway existing cukup, scope web-only. Update docs aksi kelas.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_components/ClassListTable.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts"
    ],
    "edgeCases": [
      "Record terhapus atau enrollment aktif dibuat setelah dialog dibuka.",
      "Klik ganda, network failure."
    ],
    "testingValidation": [
      "Test confirm/cancel, permission visibility, refresh dan mapping 403/404/409.",
      "Manual keyboard/mobile dan backend active-enrollment refusal.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Hard delete, bulk delete, perubahan kebijakan backend."
    ]
  }
}
```
