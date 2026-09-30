## Background / Problem

Status enrollment hanya pending, active, completed, dan dropped (`internal/domain/enrollment.go:58`). Endpoint internal hanya activate dan release; release tidak pernah mencabut enrollment aktif (`internal/usecase/enrollment_usecase.go:472-512`). Tidak ada cara bagi billing untuk menangguhkan akses atau mengakhiri enrollment aktif.

## Goal

Billing dapat menangguhkan enrollment aktif dengan melepas kursinya, memulihkannya bila kursi tersedia, dan mengakhirinya, dan status ini terlihat di web.

## Requirements

- Tambahkan status tangguh beserta transisi active → suspended (lepas kursi), suspended → active (klaim ulang kursi bila tersedia, jika tidak konflik), dan active|suspended → dropped (akhiri).
- Endpoint internal suspend, resume, dan end dengan kredensial internal yang idempoten.
- Enrollment tangguh tidak muncul sebagai attendee sesi mendatang dan tidak dapat diabsen; riwayat tetap ada.
- Web parent dan tenant menampilkan label status tangguh, dan filter status tenant menyertakannya.
- Tidak ada perubahan perilaku untuk pembatalan pending oleh parent.

## Acceptance Criteria

- [ ] Suspend mengurangi jumlah kursi terpakai dan resume mengembalikannya; resume pada kelas penuh mengembalikan konflik dan status tetap tangguh.
- [ ] Memanggil endpoint yang sama dua kali tidak mengubah hasil.
- [ ] Parent dan tenant melihat label "Ditangguhkan" pada enrollment terkait.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: hitungan kursi yang salah dapat membuat overbooking atau kursi hilang. Ikuti pola lock dan hitungan kursi pada activate, release, dan concurrent enrollment tests. Migration kompatibel bila status dibatasi CHECK. Keputusan owner: suspend melepas kursi. Perbarui `kelolakelas-docs` (api/academic.md, flows/academic.md, data/academic-schema.md, components/web.md) dan ADR siklus hidup enrollment.

Relevant areas:

- `kelolakelas-academic-service/internal/domain/enrollment.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments/_lib/schema.ts`

## Edge Cases

- Resume setelah kelas dipenuhi enrollment lain.
- Suspend dan end datang bersamaan.
- Enrollment private dengan jadwal kapasitas satu.

## Testing / Validation

- [ ] Postgres integration test transisi serentak dan hitungan kursi sebagai mitigasi overbooking.
- [ ] Unit test setiap transisi dan idempotensi.
- [ ] go vet, go test -race, build academic; test, lint, type check, dan build web lulus.
- [ ] Verifikasi manual label status di web.

## Out of Scope

- Aturan kapan billing memanggil suspend (issue masa tenggang).
- Refund.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-enrollment-suspension",
  "projectKey": "renewal-dunning-refund",
  "title": "Enrollment dapat ditangguhkan, dipulihkan, dan diakhiri melalui endpoint internal",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Status enrollment hanya pending, active, completed, dan dropped (`internal/domain/enrollment.go:58`). Endpoint internal hanya activate dan release; release tidak pernah mencabut enrollment aktif (`internal/usecase/enrollment_usecase.go:472-512`). Tidak ada cara bagi billing untuk menangguhkan akses atau mengakhiri enrollment aktif.",
    "goal": "Billing dapat menangguhkan enrollment aktif dengan melepas kursinya, memulihkannya bila kursi tersedia, dan mengakhirinya, dan status ini terlihat di web.",
    "requirements": [
      "Tambahkan status tangguh beserta transisi active → suspended (lepas kursi), suspended → active (klaim ulang kursi bila tersedia, jika tidak konflik), dan active|suspended → dropped (akhiri).",
      "Endpoint internal suspend, resume, dan end dengan kredensial internal yang idempoten.",
      "Enrollment tangguh tidak muncul sebagai attendee sesi mendatang dan tidak dapat diabsen; riwayat tetap ada.",
      "Web parent dan tenant menampilkan label status tangguh, dan filter status tenant menyertakannya.",
      "Tidak ada perubahan perilaku untuk pembatalan pending oleh parent."
    ],
    "acceptanceCriteria": [
      "Suspend mengurangi jumlah kursi terpakai dan resume mengembalikannya; resume pada kelas penuh mengembalikan konflik dan status tetap tangguh.",
      "Memanggil endpoint yang sama dua kali tidak mengubah hasil.",
      "Parent dan tenant melihat label \"Ditangguhkan\" pada enrollment terkait.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: hitungan kursi yang salah dapat membuat overbooking atau kursi hilang. Ikuti pola lock dan hitungan kursi pada activate, release, dan concurrent enrollment tests. Migration kompatibel bila status dibatasi CHECK. Keputusan owner: suspend melepas kursi. Perbarui `kelolakelas-docs` (api/academic.md, flows/academic.md, data/academic-schema.md, components/web.md) dan ADR siklus hidup enrollment.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain/enrollment.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/enrollments/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/enrollments/_lib/schema.ts"
    ],
    "edgeCases": [
      "Resume setelah kelas dipenuhi enrollment lain.",
      "Suspend dan end datang bersamaan.",
      "Enrollment private dengan jadwal kapasitas satu."
    ],
    "testingValidation": [
      "Postgres integration test transisi serentak dan hitungan kursi sebagai mitigasi overbooking.",
      "Unit test setiap transisi dan idempotensi.",
      "go vet, go test -race, build academic; test, lint, type check, dan build web lulus.",
      "Verifikasi manual label status di web."
    ],
    "outOfScope": [
      "Aturan kapan billing memanggil suspend (issue masa tenggang).",
      "Refund."
    ]
  }
}
```
