## Background / Problem

Owner memutuskan (2026-09-28) bahwa tenant dapat menolak permintaan jadwal private begitu saja atau menolak dengan rekomendasi jadwal lain. Penolakan biasa dan persetujuan disediakan oleh issue API permintaan jadwal dan issue persetujuan. Belum ada cara bagi tenant menyertakan slot alternatif, maupun bagi parent menerima rekomendasi tersebut sehingga pembelian dapat dilanjutkan tanpa mengajukan ulang dari awal.

## Goal

Tenant dapat menolak permintaan `pending` sambil merekomendasikan slot jadwal lain. Parent dapat menerima rekomendasi, sehingga enrollment, jadwal, dan payment link dibuat dengan slot rekomendasi. Parent juga dapat menolak rekomendasi.

## Requirements

- Anggota tenant dengan `enrollment:update` dapat menolak permintaan `pending` dengan satu atau lebih slot rekomendasi (`day_of_week` ISO 1–7, `start_time`, `end_time`) dan alasan opsional. Validasi slot sama dengan slot permintaan.
- Permintaan yang ditolak dengan rekomendasi menyimpan slot rekomendasi, dan parent dapat melihatnya pada detail dan daftar permintaan miliknya.
- Parent pemilik permintaan dapat menerima rekomendasi selama permintaan belum kedaluwarsa atau dibatalkan. Penerimaan membuat enrollment `pending`, jadwal private sesuai slot rekomendasi dengan kapasitas 1, dan invoice melalui operasi persetujuan yang sama (idempotency, transaksi, dan jalur `invoiceFailure` yang sama), lalu mengembalikan `checkout_session_url`.
- Parent dapat menolak rekomendasi. Setelah itu rekomendasi tidak dapat diterima lagi, dan parent tetap dapat mengajukan permintaan baru.
- Penerimaan rekomendasi yang berulang atau paralel tidak membuat enrollment, jadwal, atau invoice ganda.
- Penolakan tanpa rekomendasi tetap berperilaku seperti sebelumnya.
- Route baru didaftarkan di gateway `internal/delivery/http/router.go`.

## Acceptance Criteria

- [ ] Tenant menolak dengan rekomendasi, lalu parent melihat status ditolak beserta slot rekomendasi dan alasan bila ada.
- [ ] Parent menerima rekomendasi dan menerima `checkout_session_url`; setelah pembayaran terkonfirmasi, enrollment `active` dengan jadwal sesuai slot rekomendasi.
- [ ] Parent menolak rekomendasi, lalu penerimaan setelahnya ditolak 409.
- [ ] Parent lain, tenant lain, atau permintaan tanpa rekomendasi tidak dapat menerima rekomendasi (404/403/409 yang sesuai).
- [ ] Penerimaan kedua atau paralel tidak membuat data ganda.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: financial correctness dan isolasi. Penerimaan rekomendasi adalah jalur pembelian kedua, jadi pakai ulang operasi persetujuan dari issue persetujuan, bukan menulis ulang logika enrollment dan invoice. Aktor penerimaan adalah parent, sehingga kepemilikan permintaan harus diverifikasi seperti akses parent pada permintaan. Status dan penyimpanan rekomendasi mengikuti skema permintaan yang dibuat issue API permintaan jadwal; jangan mengarang nama tabel sebelum skema itu ada. Negosiasi bolak-balik (parent mengusulkan balik atas rekomendasi) di luar scope; parent mengajukan permintaan baru. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/api/gateway.md`, `docs/data/academic-schema.md`, dan `docs/flows/academic.md`.

Relevant areas:

- `kelolakelas-academic-service/internal/domain`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/repository`
- `kelolakelas-academic-service/internal/delivery/http/handler`
- `kelolakelas-academic-service/cmd/server/routes.go`
- `kelolakelas-academic-service/migrations`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Kelas ditutup atau di-unpublish setelah rekomendasi dikirim.
- Student sudah memiliki enrollment aktif di kelas yang sama saat rekomendasi diterima.
- Billing menolak invoice saat rekomendasi diterima (KEL-106).
- Parent menerima dan menolak rekomendasi bersamaan (race).

## Testing / Validation

- [ ] Unit test usecase untuk tolak dengan rekomendasi, terima, tolak rekomendasi, dan replay idempoten.
- [ ] Integration test PostgreSQL untuk penerimaan paralel dan isolasi tenant/parent (mitigasi risiko finansial dan lintas tenant).
- [ ] Handler test untuk permission tenant dan kepemilikan parent.
- [ ] Gateway route test.
- [ ] Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi.

## Out of Scope

- UI web tenant dan parent.
- Notifikasi email atau chat atas rekomendasi.
- Parent mengusulkan balik jadwal atas rekomendasi (negosiasi bolak-balik).

## AI Orchestrator Contract

```json
{
  "draftKey": "private-schedule-recommendation-api",
  "projectKey": "private-class-scheduled-purchase",
  "title": "Tenant dapat menolak permintaan jadwal private dengan rekomendasi jadwal lain dan parent dapat menerimanya melalui API",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "academic",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "academic",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "approve-private-schedule-request"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Owner memutuskan (2026-09-28) bahwa tenant dapat menolak permintaan jadwal private begitu saja atau menolak dengan rekomendasi jadwal lain. Penolakan biasa dan persetujuan disediakan oleh issue API permintaan jadwal dan issue persetujuan. Belum ada cara bagi tenant menyertakan slot alternatif, maupun bagi parent menerima rekomendasi tersebut sehingga pembelian dapat dilanjutkan tanpa mengajukan ulang dari awal.",
    "goal": "Tenant dapat menolak permintaan `pending` sambil merekomendasikan slot jadwal lain. Parent dapat menerima rekomendasi, sehingga enrollment, jadwal, dan payment link dibuat dengan slot rekomendasi. Parent juga dapat menolak rekomendasi.",
    "requirements": [
      "Anggota tenant dengan `enrollment:update` dapat menolak permintaan `pending` dengan satu atau lebih slot rekomendasi (`day_of_week` ISO 1–7, `start_time`, `end_time`) dan alasan opsional. Validasi slot sama dengan slot permintaan.",
      "Permintaan yang ditolak dengan rekomendasi menyimpan slot rekomendasi, dan parent dapat melihatnya pada detail dan daftar permintaan miliknya.",
      "Parent pemilik permintaan dapat menerima rekomendasi selama permintaan belum kedaluwarsa atau dibatalkan. Penerimaan membuat enrollment `pending`, jadwal private sesuai slot rekomendasi dengan kapasitas 1, dan invoice melalui operasi persetujuan yang sama (idempotency, transaksi, dan jalur `invoiceFailure` yang sama), lalu mengembalikan `checkout_session_url`.",
      "Parent dapat menolak rekomendasi. Setelah itu rekomendasi tidak dapat diterima lagi, dan parent tetap dapat mengajukan permintaan baru.",
      "Penerimaan rekomendasi yang berulang atau paralel tidak membuat enrollment, jadwal, atau invoice ganda.",
      "Penolakan tanpa rekomendasi tetap berperilaku seperti sebelumnya.",
      "Route baru didaftarkan di gateway `internal/delivery/http/router.go`."
    ],
    "acceptanceCriteria": [
      "Tenant menolak dengan rekomendasi, lalu parent melihat status ditolak beserta slot rekomendasi dan alasan bila ada.",
      "Parent menerima rekomendasi dan menerima `checkout_session_url`; setelah pembayaran terkonfirmasi, enrollment `active` dengan jadwal sesuai slot rekomendasi.",
      "Parent menolak rekomendasi, lalu penerimaan setelahnya ditolak 409.",
      "Parent lain, tenant lain, atau permintaan tanpa rekomendasi tidak dapat menerima rekomendasi (404/403/409 yang sesuai).",
      "Penerimaan kedua atau paralel tidak membuat data ganda.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: financial correctness dan isolasi. Penerimaan rekomendasi adalah jalur pembelian kedua, jadi pakai ulang operasi persetujuan dari issue persetujuan, bukan menulis ulang logika enrollment dan invoice. Aktor penerimaan adalah parent, sehingga kepemilikan permintaan harus diverifikasi seperti akses parent pada permintaan. Status dan penyimpanan rekomendasi mengikuti skema permintaan yang dibuat issue API permintaan jadwal; jangan mengarang nama tabel sebelum skema itu ada. Negosiasi bolak-balik (parent mengusulkan balik atas rekomendasi) di luar scope; parent mengajukan permintaan baru. Perbarui kelolakelas-docs: `docs/api/academic.md`, `docs/api/gateway.md`, `docs/data/academic-schema.md`, dan `docs/flows/academic.md`.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/domain",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/repository",
      "kelolakelas-academic-service/internal/delivery/http/handler",
      "kelolakelas-academic-service/cmd/server/routes.go",
      "kelolakelas-academic-service/migrations",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Kelas ditutup atau di-unpublish setelah rekomendasi dikirim.",
      "Student sudah memiliki enrollment aktif di kelas yang sama saat rekomendasi diterima.",
      "Billing menolak invoice saat rekomendasi diterima (KEL-106).",
      "Parent menerima dan menolak rekomendasi bersamaan (race)."
    ],
    "testingValidation": [
      "Unit test usecase untuk tolak dengan rekomendasi, terima, tolak rekomendasi, dan replay idempoten.",
      "Integration test PostgreSQL untuk penerimaan paralel dan isolasi tenant/parent (mitigasi risiko finansial dan lintas tenant).",
      "Handler test untuk permission tenant dan kepemilikan parent.",
      "Gateway route test.",
      "Existing tests pass, `go vet`/lint pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "UI web tenant dan parent.",
      "Notifikasi email atau chat atas rekomendasi.",
      "Parent mengusulkan balik jadwal atas rekomendasi (negosiasi bolak-balik)."
    ]
  }
}
```
