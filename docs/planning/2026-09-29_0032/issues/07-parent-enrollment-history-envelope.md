## Background / Problem

Pembacaan statis `parent/enrollments/_queries/queries.ts:11-22` menunjukkan `getEnrollmentHistory` membaca `data.items`, sedangkan dua service mengembalikan `{status,data:{items,pagination}}`; fungsi return landing di file yang sama `:61-74` sudah memakai `normalizeListEnvelope`.

## Goal

Parent melihat enrollment dan transaksi nyata di riwayat, bukan empty state palsu.

## Requirements

- Normalisasi envelope pada kedua list dengan helper yang sudah digunakan return landing.
- Pertahankan status 401/403/error dan jangan ubah API/gateway.
- Empty state hanya muncul bila kedua list yang valid memang kosong.

## Acceptance Criteria

- [ ] Respons `{status:'success',data:{items:[...]}}` menampilkan enrollment/transaksi.
- [ ] Malformed/failed response tidak dianggap daftar kosong yang valid.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Gunakan helper `lib/list-envelope.ts`, cek kontrak handler academic/billing di main saat implementasi. Catat bahwa temuan ini statis, bukan hasil browser terhadap backend nyata. Perbarui docs known gaps bila diperbaiki.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_queries/queries.ts`
- `kelolakelas-web/lib/list-envelope.ts`

## Edge Cases

- Satu list kosong dan satu terisi.
- Respons tidak valid atau akses ditolak.

## Testing / Validation

- [ ] Vitest kedua envelope nyata dari academic/billing dan error/malformed payload.
- [ ] Jalankan test, lint, type check dan build; verifikasi tampilan dengan fixture non-kosong.

## Out of Scope

- Perubahan schema API dan laporan sales tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "parent-enrollment-history-envelope",
  "projectKey": null,
  "title": "Riwayat enrollment parent membaca envelope daftar API dengan benar",
  "type": "Improvement",
  "priority": "High",
  "estimate": "S",
  "complexity": "low",
  "repositories": [
    "web"
  ],
  "labels": [
    "web",
    "ai-ready"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Pembacaan statis `parent/enrollments/_queries/queries.ts:11-22` menunjukkan `getEnrollmentHistory` membaca `data.items`, sedangkan dua service mengembalikan `{status,data:{items,pagination}}`; fungsi return landing di file yang sama `:61-74` sudah memakai `normalizeListEnvelope`.",
    "goal": "Parent melihat enrollment dan transaksi nyata di riwayat, bukan empty state palsu.",
    "requirements": [
      "Normalisasi envelope pada kedua list dengan helper yang sudah digunakan return landing.",
      "Pertahankan status 401/403/error dan jangan ubah API/gateway.",
      "Empty state hanya muncul bila kedua list yang valid memang kosong."
    ],
    "acceptanceCriteria": [
      "Respons `{status:'success',data:{items:[...]}}` menampilkan enrollment/transaksi.",
      "Malformed/failed response tidak dianggap daftar kosong yang valid.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Gunakan helper `lib/list-envelope.ts`, cek kontrak handler academic/billing di main saat implementasi. Catat bahwa temuan ini statis, bukan hasil browser terhadap backend nyata. Perbarui docs known gaps bila diperbaiki.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/_queries/queries.ts",
      "kelolakelas-web/lib/list-envelope.ts"
    ],
    "edgeCases": [
      "Satu list kosong dan satu terisi.",
      "Respons tidak valid atau akses ditolak."
    ],
    "testingValidation": [
      "Vitest kedua envelope nyata dari academic/billing dan error/malformed payload.",
      "Jalankan test, lint, type check dan build; verifikasi tampilan dengan fixture non-kosong."
    ],
    "outOfScope": [
      "Perubahan schema API dan laporan sales tenant."
    ]
  }
}
```
