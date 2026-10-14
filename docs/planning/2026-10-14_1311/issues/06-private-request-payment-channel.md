## Background / Problem

KEL-125 menyediakan channel opsional pada invoice billing, tetapi CreatePrivateScheduleRequest belum menyimpan pilihan parent dan private purchase belum meneruskan PaymentMethod. Approval/AcceptRecommendation langsung membuat invoice default VC. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Parent memilih metode ketika mengajukan jadwal private; pilihan disimpan dan dipakai saat approval atau penerimaan rekomendasi.

## Goal

Parent memilih VA/QRIS/kartu saat mengajukan jadwal private, dan approval tetap langsung menghasilkan satu invoice menggunakan pilihan tersebut.

## Requirements

- Tambahkan pilihan payment_method pada form request private, DTO dan persistence academic, memakai allowlist/normalisasi channel existing.
- Request/row lama tanpa pilihan tetap default VC untuk kompatibilitas; migration additive dengan backfill/default yang sesuai.
- Approve dan AcceptRecommendation meneruskan pilihan tersimpan ke billing.InvoiceRequest.PaymentMethod.
- Metode request tidak berubah diam-diam karena rekomendasi jadwal; replay/retry memakai pilihan yang sama dan invoice aktif tidak diganti.
- Pertahankan alur approval langsung membuat enrollment, jadwal, payment link dan email invoice existing; jangan menambah langkah checkout setelah approval.

## Acceptance Criteria

- [ ] Parent dapat memilih VA/QRIS/kartu saat membuat private schedule request dan melihat pilihan tersimpan.
- [ ] Approval tenant dan penerimaan rekomendasi menghasilkan tepat satu invoice dengan metode yang dipilih.
- [ ] Request/row lama tetap berjalan sebagai VC; migrasi kompatibel deployment.
- [ ] Channel tidak dikenal ditolak sebelum write/provider request.
- [ ] Concurrent approval/retry tidak menghasilkan invoice/enrollment/schedule ganda atau mengganti invoice aktif.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Opsi C dipilih. Scope perubahan web + academic; billing existing sudah menerima PaymentMethod (VC VA BC SP NQ) dan academic pkg/billing client sudah meneruskannya. Billing/gateway adalah referensi read-only, bukan repo implementasi. Field aktual bernama payment_method; pakai helper channel existing supaya UI label VA/QRIS tidak disamakan dengan kode provider bebas. Risiko critical: metode berubah saat retry, invoice/resource ganda, fee snapshot atau status paid tidak konsisten. Pertahankan request-row lock, invoice idempotency key, existing claims dan fee policy. Dependency KEL-125 tetap native dan contract. Snapshot sandbox QA 14 Oktober inquiry 404 membatasi verifikasi provider live; regression/integration deterministic wajib dan jangan mengklaim pembayaran live teruji. Perbarui docs API academic, billing flow dan migration/deployment notes.

Relevant areas:

- `kelolakelas-web/app/(public)/kelas/[id]/_components/ScheduleRequestForm.tsx`
- `kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`
- `kelolakelas-web/lib/schedule-request.ts`
- `kelolakelas-academic-service/internal/domain/private_schedule_request.go`
- `kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go`
- `kelolakelas-academic-service/internal/repository/private_schedule_request_repository.go`
- `kelolakelas-academic-service/migrations`
- `kelolakelas-academic-service/pkg/billing/client.go`

## Edge Cases

- Request lama tanpa field, null/default migration dan klien versi lama.
- Rekomendasi jadwal diterima setelah gagal provider.
- Concurrent approval/accept/retry dan replay dengan metode berbeda.
- Channel allowlisted tetapi provider menolak/tidak tersedia.
- Foreign tenant/parent dan invalid student.

## Testing / Validation

- [ ] Integration dan race test approve/accept recommendation memakai setiap channel serta invoice idempotency; pastikan satu enrollment dan satu invoice.
- [ ] Test kompatibilitas request/row lama default VC dan migrasi additive.
- [ ] Test channel invalid, provider timeout/5xx, price/fee rejection dan authorization fail-closed.
- [ ] Browser form selection → academic persistence → approval → billing payload/instructions dengan provider deterministic; verifikasi sandbox ketika tersedia, tanpa membagikan secret.
- [ ] Regression test happy path, validasi/error, dan authorization sesuai scope
- [ ] Formatter, lint, type check, unit/integration test dan build repository terkait lulus
- [ ] Required GitHub CI setiap PR ke main sukses sebelum merge
- [ ] Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan

## Out of Scope

- Ganti channel invoice aktif.
- Menunda invoice sampai checkout sesudah approval.
- Menyimpan data kartu/CVV.
- Perubahan implementasi billing, gateway atau kebijakan harga/fee.

## AI Orchestrator Contract

```json
{
  "draftKey": "private-request-payment-channel",
  "projectKey": "payment-experience-owned-page",
  "title": "Parent memilih channel pembayaran untuk pembelian kelas private",
  "type": "Improvement",
  "priority": "Medium",
  "estimate": "L",
  "complexity": "critical",
  "labels": [
    "web",
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "web",
    "academic"
  ],
  "blockedByDraftKeys": [
    "billing-payment-channel-selection"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "KEL-125 menyediakan channel opsional pada invoice billing, tetapi CreatePrivateScheduleRequest belum menyimpan pilihan parent dan private purchase belum meneruskan PaymentMethod. Approval/AcceptRecommendation langsung membuat invoice default VC. Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Parent memilih metode ketika mengajukan jadwal private; pilihan disimpan dan dipakai saat approval atau penerimaan rekomendasi.",
    "goal": "Parent memilih VA/QRIS/kartu saat mengajukan jadwal private, dan approval tetap langsung menghasilkan satu invoice menggunakan pilihan tersebut.",
    "requirements": [
      "Tambahkan pilihan payment_method pada form request private, DTO dan persistence academic, memakai allowlist/normalisasi channel existing.",
      "Request/row lama tanpa pilihan tetap default VC untuk kompatibilitas; migration additive dengan backfill/default yang sesuai.",
      "Approve dan AcceptRecommendation meneruskan pilihan tersimpan ke billing.InvoiceRequest.PaymentMethod.",
      "Metode request tidak berubah diam-diam karena rekomendasi jadwal; replay/retry memakai pilihan yang sama dan invoice aktif tidak diganti.",
      "Pertahankan alur approval langsung membuat enrollment, jadwal, payment link dan email invoice existing; jangan menambah langkah checkout setelah approval."
    ],
    "acceptanceCriteria": [
      "Parent dapat memilih VA/QRIS/kartu saat membuat private schedule request dan melihat pilihan tersimpan.",
      "Approval tenant dan penerimaan rekomendasi menghasilkan tepat satu invoice dengan metode yang dipilih.",
      "Request/row lama tetap berjalan sebagai VC; migrasi kompatibel deployment.",
      "Channel tidak dikenal ditolak sebelum write/provider request.",
      "Concurrent approval/retry tidak menghasilkan invoice/enrollment/schedule ganda atau mengganti invoice aktif.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Keputusan owner disetujui pada 14 Oktober 2026 WIB melalui jawaban “setuju semua rekomendasi”. Opsi C dipilih. Scope perubahan web + academic; billing existing sudah menerima PaymentMethod (VC VA BC SP NQ) dan academic pkg/billing client sudah meneruskannya. Billing/gateway adalah referensi read-only, bukan repo implementasi. Field aktual bernama payment_method; pakai helper channel existing supaya UI label VA/QRIS tidak disamakan dengan kode provider bebas. Risiko critical: metode berubah saat retry, invoice/resource ganda, fee snapshot atau status paid tidak konsisten. Pertahankan request-row lock, invoice idempotency key, existing claims dan fee policy. Dependency KEL-125 tetap native dan contract. Snapshot sandbox QA 14 Oktober inquiry 404 membatasi verifikasi provider live; regression/integration deterministic wajib dan jangan mengklaim pembayaran live teruji. Perbarui docs API academic, billing flow dan migration/deployment notes.",
    "relevantAreas": [
      "kelolakelas-web/app/(public)/kelas/[id]/_components/ScheduleRequestForm.tsx",
      "kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts",
      "kelolakelas-web/lib/schedule-request.ts",
      "kelolakelas-academic-service/internal/domain/private_schedule_request.go",
      "kelolakelas-academic-service/internal/usecase/private_schedule_request_usecase.go",
      "kelolakelas-academic-service/internal/repository/private_schedule_request_repository.go",
      "kelolakelas-academic-service/migrations",
      "kelolakelas-academic-service/pkg/billing/client.go"
    ],
    "edgeCases": [
      "Request lama tanpa field, null/default migration dan klien versi lama.",
      "Rekomendasi jadwal diterima setelah gagal provider.",
      "Concurrent approval/accept/retry dan replay dengan metode berbeda.",
      "Channel allowlisted tetapi provider menolak/tidak tersedia.",
      "Foreign tenant/parent dan invalid student."
    ],
    "testingValidation": [
      "Integration dan race test approve/accept recommendation memakai setiap channel serta invoice idempotency; pastikan satu enrollment dan satu invoice.",
      "Test kompatibilitas request/row lama default VC dan migrasi additive.",
      "Test channel invalid, provider timeout/5xx, price/fee rejection dan authorization fail-closed.",
      "Browser form selection → academic persistence → approval → billing payload/instructions dengan provider deterministic; verifikasi sandbox ketika tersedia, tanpa membagikan secret.",
      "Regression test happy path, validasi/error, dan authorization sesuai scope",
      "Formatter, lint, type check, unit/integration test dan build repository terkait lulus",
      "Required GitHub CI setiap PR ke main sukses sebelum merge",
      "Perbarui kelolakelas-docs tentang perubahan behavior/contract; catat keputusan arsitektural pada ADR bila relevan"
    ],
    "outOfScope": [
      "Ganti channel invoice aktif.",
      "Menunda invoice sampai checkout sesudah approval.",
      "Menyimpan data kartu/CVV.",
      "Perubahan implementasi billing, gateway atau kebijakan harga/fee."
    ]
  }
}
```
