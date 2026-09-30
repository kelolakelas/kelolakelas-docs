## Background / Problem

Domain `Withdrawal` (amount, admin_fee, net_amount, status, provider_payout_id, requested_at, processed_at) dan tabel `withdrawals` sudah ada, tetapi `WithdrawalUsecase.RequestWithdrawal` hanya interface (`internal/usecase/interfaces.go:32`). `PendingBalance` wallet tidak pernah dipakai.

## Goal

Tenant dapat mengajukan penarikan ke rekening utama tanpa kemungkinan saldo dipakai dua kali, dan dapat membatalkannya selama belum diproses.

## Requirements

- Pengajuan dengan `billing:withdraw` memindahkan jumlah dari saldo tersedia ke saldo tertahan dalam satu transaksi database dengan lock wallet dan entri ledger yang dapat ditelusuri.
- Tolak jumlah di bawah minimum yang dapat dikonfigurasi, melebihi saldo tersedia, atau bila tenant belum punya rekening utama; hanya satu pengajuan terbuka per tenant.
- Pengajuan menyimpan snapshot rekening tujuan.
- Pembatalan oleh tenant hanya pada status requested dan mengembalikan saldo dengan entri ledger pembalik.
- Pengajuan idempoten terhadap retry klien, dan daftar riwayat penarikan tersedia bagi tenant.

## Acceptance Criteria

- [ ] Dua pengajuan serentak yang total melebihi saldo hanya satu yang berhasil.
- [ ] Setelah pengajuan dan pembatalan, saldo tersedia kembali ke nilai awal dan ledger mencatat kedua mutasi.
- [ ] Perubahan rekening utama setelah pengajuan tidak mengubah rekening tujuan pengajuan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebenaran finansial (double spend dan saldo negatif). Gunakan pola lock wallet yang sudah dipakai pada callback pembayaran dan unique index ledger `(reference_id, reference_type, entry_type)` untuk idempotensi. Biaya admin penarikan bernilai nol sampai ada kebijakan. Minimum penarikan diatur lewat konfigurasi service yang terdokumentasi. Perbarui `kelolakelas-docs` (api/billing.md, flows/billing-and-subscriptions.md, data/billing-schema.md) dan ADR alur penarikan manual.

Relevant areas:

- `kelolakelas-billing-service/internal/domain/withdrawal.go`
- `kelolakelas-billing-service/internal/domain/wallet.go`
- `kelolakelas-billing-service/internal/usecase/interfaces.go`
- `kelolakelas-billing-service/internal/usecase/transaction_usecase.go`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Pembayaran baru dikreditkan saat pengajuan sedang dibuat.
- Retry klien setelah timeout gateway.
- Pembatalan bersamaan dengan pemrosesan oleh platform admin.

## Testing / Validation

- [ ] Postgres integration test untuk pengajuan serentak, retry idempoten, dan pembatalan serentak dengan pemrosesan, sebagai mitigasi risiko double spend.
- [ ] Unit test invariant saldo tersedia + tertahan terhadap jumlah ledger.
- [ ] Router test gateway, go vet, go test -race, dan build lulus.
- [ ] Acceptance criteria diverifikasi lewat API lokal.

## Out of Scope

- Pemrosesan oleh platform admin.
- Disbursement otomatis.
- Biaya admin penarikan.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-tenant-withdrawal-request",
  "projectKey": "tenant-finance-payout",
  "title": "Tenant dapat mengajukan dan membatalkan penarikan dengan saldo yang ditahan secara atomik",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "billing",
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "billing-tenant-balance-bank-account"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Domain `Withdrawal` (amount, admin_fee, net_amount, status, provider_payout_id, requested_at, processed_at) dan tabel `withdrawals` sudah ada, tetapi `WithdrawalUsecase.RequestWithdrawal` hanya interface (`internal/usecase/interfaces.go:32`). `PendingBalance` wallet tidak pernah dipakai.",
    "goal": "Tenant dapat mengajukan penarikan ke rekening utama tanpa kemungkinan saldo dipakai dua kali, dan dapat membatalkannya selama belum diproses.",
    "requirements": [
      "Pengajuan dengan `billing:withdraw` memindahkan jumlah dari saldo tersedia ke saldo tertahan dalam satu transaksi database dengan lock wallet dan entri ledger yang dapat ditelusuri.",
      "Tolak jumlah di bawah minimum yang dapat dikonfigurasi, melebihi saldo tersedia, atau bila tenant belum punya rekening utama; hanya satu pengajuan terbuka per tenant.",
      "Pengajuan menyimpan snapshot rekening tujuan.",
      "Pembatalan oleh tenant hanya pada status requested dan mengembalikan saldo dengan entri ledger pembalik.",
      "Pengajuan idempoten terhadap retry klien, dan daftar riwayat penarikan tersedia bagi tenant."
    ],
    "acceptanceCriteria": [
      "Dua pengajuan serentak yang total melebihi saldo hanya satu yang berhasil.",
      "Setelah pengajuan dan pembatalan, saldo tersedia kembali ke nilai awal dan ledger mencatat kedua mutasi.",
      "Perubahan rekening utama setelah pengajuan tidak mengubah rekening tujuan pengajuan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebenaran finansial (double spend dan saldo negatif). Gunakan pola lock wallet yang sudah dipakai pada callback pembayaran dan unique index ledger `(reference_id, reference_type, entry_type)` untuk idempotensi. Biaya admin penarikan bernilai nol sampai ada kebijakan. Minimum penarikan diatur lewat konfigurasi service yang terdokumentasi. Perbarui `kelolakelas-docs` (api/billing.md, flows/billing-and-subscriptions.md, data/billing-schema.md) dan ADR alur penarikan manual.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/domain/withdrawal.go",
      "kelolakelas-billing-service/internal/domain/wallet.go",
      "kelolakelas-billing-service/internal/usecase/interfaces.go",
      "kelolakelas-billing-service/internal/usecase/transaction_usecase.go",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Pembayaran baru dikreditkan saat pengajuan sedang dibuat.",
      "Retry klien setelah timeout gateway.",
      "Pembatalan bersamaan dengan pemrosesan oleh platform admin."
    ],
    "testingValidation": [
      "Postgres integration test untuk pengajuan serentak, retry idempoten, dan pembatalan serentak dengan pemrosesan, sebagai mitigasi risiko double spend.",
      "Unit test invariant saldo tersedia + tertahan terhadap jumlah ledger.",
      "Router test gateway, go vet, go test -race, dan build lulus.",
      "Acceptance criteria diverifikasi lewat API lokal."
    ],
    "outOfScope": [
      "Pemrosesan oleh platform admin.",
      "Disbursement otomatis.",
      "Biaya admin penarikan."
    ]
  }
}
```
