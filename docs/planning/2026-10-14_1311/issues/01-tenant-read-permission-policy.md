## Background / Problem

L1-01: Teacher tanpa member:read/role:read/tenant:read membaca members/roles/settings via URL dan API; writes sudah 403. Bukan lintas tenant.

## Goal

Tetapkan dan selaraskan permission baca administrasi tenant

## Requirements

- Wajibkan member:read untuk daftar/detail anggota tenant, role:read untuk daftar role tenant, dan tenant:read untuk pengaturan tenant, pada API dan halaman/direct URL.
- Selaraskan navigasi dan error forbidden dengan permission terkini Creator, Teacher, dan custom role.
- Pertahankan bootstrap GET /members/me/membership untuk anggota aktif, tenant isolation dan seluruh gate mutasi existing; jangan memperluas gate ke public tenant profile atau tutor teaching lookup tanpa kebutuhan scope.

## Acceptance Criteria

- [ ] Teacher tanpa permission terkait mendapat forbidden pada API dan direct URL administrasi.
- [ ] Creator dengan permission lengkap tetap dapat membaca members/roles/settings.
- [ ] Custom role hanya dapat membaca area sesuai permission; GetMember juga memerlukan member:read.
- [ ] Own membership bootstrap tetap bekerja dan nav sesuai permission terkini.
- [ ] Tenant asing, parent, sesi revoked, atau membership tidak aktif tidak memperoleh data protected.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. identity member_handler.go:82-136 dan role_handler.go:122-144 hanya tenant context; web members queries hanya membatasi invitation. Gateway members/roles/tenant routes transparent, tidak berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Policy yang dipilih: matching read permissions. Scope mencakup ListMembers/GetMember, GetRoles dan GetSettings; gunakan permission check scoped/live yang ada. Jangan gate bootstrap own membership atau merusak teaching lookup /tutors. Risiko high: pembatasan akses data protected dan perubahan kompatibilitas custom role; uji fail-closed serta Creator/Teacher/custom role sebelum delivery.

Relevant areas:

- `kelolakelas-identity-service/internal`
- `kelolakelas-web/app`

## Edge Cases

- Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.
- Data lama, foreign tenant/parent, input malformed dan request ulang.

## Testing / Validation

- [ ] API authorization matrix dan bootstrap own membership regression.
- [ ] verifikasi manual terhadap stack lokal (web → gateway → identity)
- [ ] Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.
- [ ] Relevant unit tests are added or updated
- [ ] Relevant integration tests are added or updated
- [ ] Existing tests pass
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Acceptance criteria are manually or automatically verified
- [ ] Regression test happy path, validasi/error, dan authorization sesuai scope
- [ ] Formatter, lint, type check, unit/integration test dan build repository terkait lulus
- [ ] Required GitHub CI setiap PR ke main sukses sebelum merge
- [ ] Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan

## Out of Scope

- Perubahan kebijakan pembayaran/refund dan desain ulang sistem.
- Perubahan repository yang tidak tercantum dalam kontrak.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-read-permission-policy",
  "projectKey": null,
  "title": "Tetapkan dan selaraskan permission baca administrasi tenant",
  "type": "Improvement",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "identity",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "L1-01: Teacher tanpa member:read/role:read/tenant:read membaca members/roles/settings via URL dan API; writes sudah 403. Bukan lintas tenant.",
    "goal": "Tetapkan dan selaraskan permission baca administrasi tenant",
    "requirements": [
      "Wajibkan member:read untuk daftar/detail anggota tenant, role:read untuk daftar role tenant, dan tenant:read untuk pengaturan tenant, pada API dan halaman/direct URL.",
      "Selaraskan navigasi dan error forbidden dengan permission terkini Creator, Teacher, dan custom role.",
      "Pertahankan bootstrap GET /members/me/membership untuk anggota aktif, tenant isolation dan seluruh gate mutasi existing; jangan memperluas gate ke public tenant profile atau tutor teaching lookup tanpa kebutuhan scope."
    ],
    "acceptanceCriteria": [
      "Teacher tanpa permission terkait mendapat forbidden pada API dan direct URL administrasi.",
      "Creator dengan permission lengkap tetap dapat membaca members/roles/settings.",
      "Custom role hanya dapat membaca area sesuai permission; GetMember juga memerlukan member:read.",
      "Own membership bootstrap tetap bekerja dan nav sesuai permission terkini.",
      "Tenant asing, parent, sesi revoked, atau membership tidak aktif tidak memperoleh data protected. ",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Verifikasi ulang origin/main dilakukan melalui pembacaan kode; runtime QA berasal dari lane, bukan replay baru oleh consolidator. identity member_handler.go:82-136 dan role_handler.go:122-144 hanya tenant context; web members queries hanya membatasi invitation. Gateway members/roles/tenant routes transparent, tidak berubah. Gateway hanya read-only reference kecuali tercantum di repositories. Perbarui kelolakelas-docs setelah implementasi. Risiko: perubahan boundary authorization/data terproteksi; jangan memperluas akses atau menghapus predicate scope. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Policy yang dipilih: matching read permissions. Scope mencakup ListMembers/GetMember, GetRoles dan GetSettings; gunakan permission check scoped/live yang ada. Jangan gate bootstrap own membership atau merusak teaching lookup /tutors. Risiko high: pembatasan akses data protected dan perubahan kompatibilitas custom role; uji fail-closed serta Creator/Teacher/custom role sebelum delivery.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal",
      "kelolakelas-web/app"
    ],
    "edgeCases": [
      "Sesi kedaluwarsa atau assignment dicabut saat operasi berlangsung.",
      "Data lama, foreign tenant/parent, input malformed dan request ulang."
    ],
    "testingValidation": [
      "API authorization matrix dan bootstrap own membership regression.",
      "verifikasi manual terhadap stack lokal (web → gateway → identity)",
      "Mitigasi risiko: uji scope tenant/parent dan permission tetap fail-closed.",
      "Relevant unit tests are added or updated",
      "Relevant integration tests are added or updated",
      "Existing tests pass",
      "Lint passes",
      "Type checking passes",
      "Acceptance criteria are manually or automatically verified",
      "Regression test happy path, validasi/error, dan authorization sesuai scope",
      "Formatter, lint, type check, unit/integration test dan build repository terkait lulus",
      "Required GitHub CI setiap PR ke main sukses sebelum merge",
      "Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan"
    ],
    "outOfScope": [
      "Perubahan kebijakan pembayaran/refund dan desain ulang sistem.",
      "Perubahan repository yang tidak tercantum dalam kontrak."
    ]
  }
}
```
