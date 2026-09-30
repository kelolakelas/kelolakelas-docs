## Background / Problem

Status transaksi `refunded` hanya konstanta dan tidak pernah ditulis (`internal/domain/transaction.go:32-39`); pembatalan setelah paid ditolak 409 (`internal/delivery/http/handler/transaction_handler.go:232`). Tidak ada permission refund (seeder identity hanya `billing:read` dan `billing:withdraw`).

## Goal

Tenant dapat mencatat bahwa transaksi paid telah di-refund secara manual, dengan enrollment terkait diakhiri dan jejak audit yang lengkap.

## Requirements

- Identity menambahkan permission `billing:refund` melalui migration dan memberikannya ke role Creator mengikuti pola permission chat.
- Billing menyediakan endpoint pencatatan refund penuh untuk transaksi paid milik tenant, dengan alasan dan referensi transfer wajib, yang mengubah status menjadi refunded dan menyimpan pelaku serta waktu.
- Billing mengakhiri enrollment terkait melalui endpoint end academic dan menghentikan subscription terkait melalui job durable yang idempoten.
- Pencatatan ini tidak mengubah ledger wallet (default draft sampai owner memutuskan lain).
- Gateway meneruskan route baru.

## Acceptance Criteria

- [ ] Refund transaksi paid mengubah status menjadi refunded, mengakhiri enrollment, dan menghentikan penagihan berikutnya.
- [ ] Refund pada transaksi selain paid, milik tenant lain, atau tanpa `billing:refund` ditolak.
- [ ] Request ganda tidak membuat dua catatan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebenaran status finansial dan akhir enrollment yang tidak sinkron. Summary penjualan menghitung paid saja sehingga transaksi yang di-refund keluar dari total historis; dokumentasikan. Pertanyaan terbuka owner: apakah refund manual juga mendebit wallet tenant. Jangan implementasikan debit sebelum diputuskan. Perbarui `kelolakelas-docs` (api/billing.md, api/identity.md, flows/billing-and-subscriptions.md) dan ADR refund manual.

Relevant areas:

- `kelolakelas-identity-service/migrations`
- `kelolakelas-identity-service/seeders/000001_default_permissions_and_roles.sql`
- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go`
- `kelolakelas-billing-service/pkg/academic/client.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Refund transaksi renewal saat enrollment tangguh.
- Academic tidak tersedia saat mengakhiri enrollment.
- Transaksi sandbox.

## Testing / Validation

- [ ] Postgres integration test idempotensi dan scope tenant sebagai mitigasi risiko finansial.
- [ ] Test migration identity up/down dan pemberian permission ke Creator.
- [ ] Router test gateway, go vet, go test -race, dan build lulus di ketiga repo.
- [ ] Verifikasi manual alur refund dengan database lokal.

## Out of Scope

- Refund parsial.
- Refund otomatis via API provider.
- Debit wallet tenant.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-manual-refund",
  "projectKey": "renewal-dunning-refund",
  "title": "Tenant dapat mencatat refund manual untuk transaksi paid dan mengakhiri enrollment terkait",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "identity",
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "identity",
    "billing",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "academic-enrollment-suspension"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Status transaksi `refunded` hanya konstanta dan tidak pernah ditulis (`internal/domain/transaction.go:32-39`); pembatalan setelah paid ditolak 409 (`internal/delivery/http/handler/transaction_handler.go:232`). Tidak ada permission refund (seeder identity hanya `billing:read` dan `billing:withdraw`).",
    "goal": "Tenant dapat mencatat bahwa transaksi paid telah di-refund secara manual, dengan enrollment terkait diakhiri dan jejak audit yang lengkap.",
    "requirements": [
      "Identity menambahkan permission `billing:refund` melalui migration dan memberikannya ke role Creator mengikuti pola permission chat.",
      "Billing menyediakan endpoint pencatatan refund penuh untuk transaksi paid milik tenant, dengan alasan dan referensi transfer wajib, yang mengubah status menjadi refunded dan menyimpan pelaku serta waktu.",
      "Billing mengakhiri enrollment terkait melalui endpoint end academic dan menghentikan subscription terkait melalui job durable yang idempoten.",
      "Pencatatan ini tidak mengubah ledger wallet (default draft sampai owner memutuskan lain).",
      "Gateway meneruskan route baru."
    ],
    "acceptanceCriteria": [
      "Refund transaksi paid mengubah status menjadi refunded, mengakhiri enrollment, dan menghentikan penagihan berikutnya.",
      "Refund pada transaksi selain paid, milik tenant lain, atau tanpa `billing:refund` ditolak.",
      "Request ganda tidak membuat dua catatan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebenaran status finansial dan akhir enrollment yang tidak sinkron. Summary penjualan menghitung paid saja sehingga transaksi yang di-refund keluar dari total historis; dokumentasikan. Pertanyaan terbuka owner: apakah refund manual juga mendebit wallet tenant. Jangan implementasikan debit sebelum diputuskan. Perbarui `kelolakelas-docs` (api/billing.md, api/identity.md, flows/billing-and-subscriptions.md) dan ADR refund manual.",
    "relevantAreas": [
      "kelolakelas-identity-service/migrations",
      "kelolakelas-identity-service/seeders/000001_default_permissions_and_roles.sql",
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go",
      "kelolakelas-billing-service/pkg/academic/client.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Refund transaksi renewal saat enrollment tangguh.",
      "Academic tidak tersedia saat mengakhiri enrollment.",
      "Transaksi sandbox."
    ],
    "testingValidation": [
      "Postgres integration test idempotensi dan scope tenant sebagai mitigasi risiko finansial.",
      "Test migration identity up/down dan pemberian permission ke Creator.",
      "Router test gateway, go vet, go test -race, dan build lulus di ketiga repo.",
      "Verifikasi manual alur refund dengan database lokal."
    ],
    "outOfScope": [
      "Refund parsial.",
      "Refund otomatis via API provider.",
      "Debit wallet tenant."
    ]
  }
}
```
