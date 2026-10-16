## Background / Problem

Testing 16 Oktober 2026: Kategori dan kelas tersimpan sebelum wizard selesai. POST /classes/with-category hanya menerima category_id existing, class, teacher_ids; jadwal/sesi memakai transaksi terpisah.

## Goal

Satu final submit membuat konfigurasi kelas lengkap secara atomik.

## Requirements

- Perluas endpoint composite existing secara kompatibel untuk kategori baru atau existing, kelas, pengajar dan initial group schedules.
- Validasi payload, izin setiap sub-operasi, tenant ownership, tutor membership aktif dan aturan jadwal sebelum commit.
- Commit kategori baru, kelas, relasi pengajar, jadwal dan sesi yang dihasilkan flow existing dalam satu transaksi; rollback semua hasil baru jika ada kegagalan.
- Kategori existing tidak dibuat ulang atau dimutasi; private class tetap tanpa jadwal sampai enrollment.
- Tangani double submit/retry dengan mekanisme teruji dan terdokumentasi agar tidak membuat data ganda.

## Acceptance Criteria

- [ ] Final submit group membuat tepat satu kategori baru, kelas serta semua jadwal terkait; kategori existing dipakai tanpa duplikasi.
- [ ] Failure pada kategori/class/assignment/schedule/session membatalkan seluruh record baru.
- [ ] Invalid payload, missing permission dan referensi lintas tenant ditolak tanpa partial writes.
- [ ] Private final submit menyimpan kategori/kelas tanpa jadwal yang membutuhkan enrollment.
- [ ] Request lama tetap kompatibel; retry/concurrent submit mengikuti mekanisme duplicate prevention yang terdokumentasi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti internal/domain/class.go:79, usecase/class_creation_usecase.go:53, schedule_usecase.go:237/:277. Risiko high: komposisi transaksi dapat melewati izin sub-operasi atau menyisakan record/sesi parsial. Failure-injection DB dan tenant/permission tests wajib. Jangan menumpuk usecase yang membuka commit sendiri. Gateway sudah meneruskan body route existing; tidak perlu label gateway. Detail payload dan retry ditetapkan saat implementasi, dengan kompatibilitas teruji. Update API/flow academic; ADR jika aggregate boundary berubah.

Relevant areas:

- `kelolakelas-academic-service/internal/domain/class.go`
- `kelolakelas-academic-service/internal/usecase/class_creation_usecase.go`
- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/repository`

## Edge Cases

- Kategori/tutor berubah sebelum commit; banyak generated slots; invalid schedule.
- Respons commit hilang lalu final request diulang.

## Testing / Validation

- [ ] Integration test DB failure injection pada setiap tahap: buktikan nol record baru setelah rollback.
- [ ] Uji kategori existing/baru, private/group, permission denied, foreign tenant, request lama serta concurrent retry.
- [ ] Uji payload melalui route gateway existing.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Checkout/enrollment/payment dan perubahan private scheduling policy.
- Cleanup otomatis data parsial lama.

## AI Orchestrator Contract

```json
{
  "draftKey": "atomic-class-creation-api",
  "projectKey": "tenant-selling-operations",
  "title": "Simpan kategori, kelas, pengajar, dan jadwal dalam satu transaksi final",
  "type": "Improvement",
  "priority": "High",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Testing 16 Oktober 2026: Kategori dan kelas tersimpan sebelum wizard selesai. POST /classes/with-category hanya menerima category_id existing, class, teacher_ids; jadwal/sesi memakai transaksi terpisah.",
    "goal": "Satu final submit membuat konfigurasi kelas lengkap secara atomik.",
    "requirements": [
      "Perluas endpoint composite existing secara kompatibel untuk kategori baru atau existing, kelas, pengajar dan initial group schedules.",
      "Validasi payload, izin setiap sub-operasi, tenant ownership, tutor membership aktif dan aturan jadwal sebelum commit.",
      "Commit kategori baru, kelas, relasi pengajar, jadwal dan sesi yang dihasilkan flow existing dalam satu transaksi; rollback semua hasil baru jika ada kegagalan.",
      "Kategori existing tidak dibuat ulang atau dimutasi; private class tetap tanpa jadwal sampai enrollment.",
      "Tangani double submit/retry dengan mekanisme teruji dan terdokumentasi agar tidak membuat data ganda."
    ],
    "acceptanceCriteria": [
      "Final submit group membuat tepat satu kategori baru, kelas serta semua jadwal terkait; kategori existing dipakai tanpa duplikasi.",
      "Failure pada kategori/class/assignment/schedule/session membatalkan seluruh record baru.",
      "Invalid payload, missing permission dan referensi lintas tenant ditolak tanpa partial writes.",
      "Private final submit menyimpan kategori/kelas tanpa jadwal yang membutuhkan enrollment.",
      "Request lama tetap kompatibel; retry/concurrent submit mengikuti mekanisme duplicate prevention yang terdokumentasi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti internal/domain/class.go:79, usecase/class_creation_usecase.go:53, schedule_usecase.go:237/:277. Risiko high: komposisi transaksi dapat melewati izin sub-operasi atau menyisakan record/sesi parsial. Failure-injection DB dan tenant/permission tests wajib. Jangan menumpuk usecase yang membuka commit sendiri. Gateway sudah meneruskan body route existing; tidak perlu label gateway. Detail payload dan retry ditetapkan saat implementasi, dengan kompatibilitas teruji. Update API/flow academic; ADR jika aggregate boundary berubah.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain/class.go",
      "kelolakelas-academic-service/internal/usecase/class_creation_usecase.go",
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/repository"
    ],
    "edgeCases": [
      "Kategori/tutor berubah sebelum commit; banyak generated slots; invalid schedule.",
      "Respons commit hilang lalu final request diulang."
    ],
    "testingValidation": [
      "Integration test DB failure injection pada setiap tahap: buktikan nol record baru setelah rollback.",
      "Uji kategori existing/baru, private/group, permission denied, foreign tenant, request lama serta concurrent retry.",
      "Uji payload melalui route gateway existing.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Checkout/enrollment/payment dan perubahan private scheduling policy.",
      "Cleanup otomatis data parsial lama."
    ]
  }
}
```
