## Background / Problem

Endpoint `POST /sessions/:id/reschedule` dan `PATCH /sessions/:id/substitute-tutor` sudah dirouting (gateway `router.go:205-212`) dengan permission `schedule:update`, tetapi tidak ada UI yang memanggilnya.

## Goal

Anggota dengan `schedule:update` dapat memindahkan satu sesi atau mengganti pengajarnya dari detail sesi.

## Requirements

- Aksi reschedule pada detail sesi dengan input tanggal dan jam baru serta konfirmasi.
- Aksi tutor pengganti yang memilih dari daftar pengajar tenant (`GET /api/v1/tutors`).
- Aksi disembunyikan bagi anggota tanpa `schedule:update`, dan penolakan backend tetap ditampilkan dengan jelas.
- Setelah berhasil, daftar sesi dan detail diperbarui.

## Acceptance Criteria

- [ ] Sesi yang di-reschedule tampil di tanggal baru dan absensinya dapat dicatat.
- [ ] Tutor pengganti tampil pada sesi dan sesi muncul di daftar milik tutor pengganti.
- [ ] Error validasi backend (misalnya tutor tidak valid) ditampilkan tanpa kehilangan input.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Mutasi melalui server action; body mutasi saat ini membutuhkan id di body (catatan path-alias di `08-known-gaps-and-risks.md`), jadi pastikan payload sesuai kontrak backend. Konfirmasi memakai dialog in-page yang dapat diakses keyboard seperti pembatalan enrollment parent. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Reschedule ke waktu yang sudah lewat.
- Tidak ada pengajar lain di tenant.
- Sesi sudah dibatalkan oleh anggota lain.

## Testing / Validation

- [ ] Vitest untuk action dan komponen dialog termasuk error validasi.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual reschedule dan tutor pengganti terhadap backend lokal.

## Out of Scope

- Perubahan jadwal permanen (sudah ada endpoint terpisah).
- Notifikasi ke parent.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-session-reschedule-substitute",
  "projectKey": "tutor-session-operations",
  "title": "Tenant dapat me-reschedule sesi dan menugaskan tutor pengganti dari detail sesi",
  "type": "Feature",
  "priority": "Medium",
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
    "web-tutor-sessions-attendance"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Endpoint `POST /sessions/:id/reschedule` dan `PATCH /sessions/:id/substitute-tutor` sudah dirouting (gateway `router.go:205-212`) dengan permission `schedule:update`, tetapi tidak ada UI yang memanggilnya.",
    "goal": "Anggota dengan `schedule:update` dapat memindahkan satu sesi atau mengganti pengajarnya dari detail sesi.",
    "requirements": [
      "Aksi reschedule pada detail sesi dengan input tanggal dan jam baru serta konfirmasi.",
      "Aksi tutor pengganti yang memilih dari daftar pengajar tenant (`GET /api/v1/tutors`).",
      "Aksi disembunyikan bagi anggota tanpa `schedule:update`, dan penolakan backend tetap ditampilkan dengan jelas.",
      "Setelah berhasil, daftar sesi dan detail diperbarui."
    ],
    "acceptanceCriteria": [
      "Sesi yang di-reschedule tampil di tanggal baru dan absensinya dapat dicatat.",
      "Tutor pengganti tampil pada sesi dan sesi muncul di daftar milik tutor pengganti.",
      "Error validasi backend (misalnya tutor tidak valid) ditampilkan tanpa kehilangan input.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Mutasi melalui server action; body mutasi saat ini membutuhkan id di body (catatan path-alias di `08-known-gaps-and-risks.md`), jadi pastikan payload sesuai kontrak backend. Konfirmasi memakai dialog in-page yang dapat diakses keyboard seperti pembatalan enrollment parent. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Reschedule ke waktu yang sudah lewat.",
      "Tidak ada pengajar lain di tenant.",
      "Sesi sudah dibatalkan oleh anggota lain."
    ],
    "testingValidation": [
      "Vitest untuk action dan komponen dialog termasuk error validasi.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual reschedule dan tutor pengganti terhadap backend lokal."
    ],
    "outOfScope": [
      "Perubahan jadwal permanen (sudah ada endpoint terpisah).",
      "Notifikasi ke parent."
    ]
  }
}
```
