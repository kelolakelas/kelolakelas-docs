## Background / Problem

Callback sukses mengkreditkan `NetAmount` ke `AvailableBalance` wallet tenant dan menulis ledger `payment_received` (`internal/usecase/transaction_usecase.go:976-1021`), tetapi tidak ada route untuk membaca saldo atau ledger. Tabel `bank_accounts` ada (`migrations/00000000000000_init_schema.up.sql`), tetapi repository dan usecase penarikan hanya berupa interface (`internal/repository/interfaces.go:34,40`, `internal/usecase/interfaces.go:12,32`). Identity juga memiliki tabel keuangan yang tidak dipakai (`kelolakelas-identity-service/migrations/00000000000000_init_schema.up.sql:51-91`).

## Goal

Tenant dapat melihat saldo tersedia dan mutasinya, serta mendaftarkan dan mengelola rekening bank utama untuk pencairan.

## Requirements

- Endpoint baca saldo wallet dan daftar mutasi ledger berhalaman untuk anggota dengan `billing:read`; parent ditolak.
- Endpoint buat, ubah, hapus (soft delete), dan tetapkan rekening utama dengan `billing:withdraw`; tepat satu rekening utama per tenant.
- Nomor rekening ditampilkan tersamar pada respons baca tenant.
- Gateway meneruskan route baru di grup protected.
- Tenant tanpa wallet mendapat saldo nol, bukan error.

## Acceptance Criteria

- [ ] Saldo sama dengan jumlah mutasi ledger untuk tenant dengan transaksi paid.
- [ ] Anggota tanpa `billing:read` atau `billing:withdraw` ditolak 403 sesuai endpoint, dan tenant lain tidak dapat membaca data ini.
- [ ] Rekening utama dapat diganti tanpa menghapus riwayat.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: kebocoran data rekening dan saldo lintas tenant. Scope tenant diambil dari claim terverifikasi dan diterapkan di SQL. Billing dipilih sebagai pemilik data keuangan karena wallet, ledger, dan withdrawal sudah di billing; tabel identity tidak dipakai dan dicatat di ADR. Ledger tidak dikreditkan untuk transaksi sandbox, jadi dokumentasikan perilaku ini. Validasi format rekening mengikuti bank_code yang disimpan; verifikasi kepemilikan rekening dilakukan manual oleh platform admin saat pemrosesan. Perbarui `kelolakelas-docs` (api/billing.md, data/billing-schema.md, api/gateway.md) dan tulis ADR kepemilikan data keuangan tenant.

Relevant areas:

- `kelolakelas-billing-service/internal/domain/wallet.go`
- `kelolakelas-billing-service/internal/domain/ledger_entry.go`
- `kelolakelas-billing-service/internal/domain/bank_account.go`
- `kelolakelas-billing-service/internal/repository`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Tenant belum pernah menerima pembayaran.
- Menghapus rekening utama yang sedang dipakai penarikan berjalan.
- Dua request menetapkan rekening utama bersamaan.

## Testing / Validation

- [ ] Postgres integration test untuk scope tenant dan keunikan rekening utama saat serentak, sebagai mitigasi risiko kebocoran.
- [ ] Unit test handler untuk permission dan penyamaran nomor rekening.
- [ ] Router test gateway, go vet, go test -race, dan build lulus di kedua repo.
- [ ] Verifikasi saldo terhadap jumlah ledger pada data lokal.

## Out of Scope

- Pengajuan dan pemrosesan penarikan.
- Verifikasi rekening otomatis via API bank.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-tenant-balance-bank-account",
  "projectKey": "tenant-finance-payout",
  "title": "Tenant dapat melihat saldo dan mutasi ledger serta mengelola rekening pencairan",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "high",
  "labels": [
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "repositories": [
    "billing",
    "api-gateway"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Callback sukses mengkreditkan `NetAmount` ke `AvailableBalance` wallet tenant dan menulis ledger `payment_received` (`internal/usecase/transaction_usecase.go:976-1021`), tetapi tidak ada route untuk membaca saldo atau ledger. Tabel `bank_accounts` ada (`migrations/00000000000000_init_schema.up.sql`), tetapi repository dan usecase penarikan hanya berupa interface (`internal/repository/interfaces.go:34,40`, `internal/usecase/interfaces.go:12,32`). Identity juga memiliki tabel keuangan yang tidak dipakai (`kelolakelas-identity-service/migrations/00000000000000_init_schema.up.sql:51-91`).",
    "goal": "Tenant dapat melihat saldo tersedia dan mutasinya, serta mendaftarkan dan mengelola rekening bank utama untuk pencairan.",
    "requirements": [
      "Endpoint baca saldo wallet dan daftar mutasi ledger berhalaman untuk anggota dengan `billing:read`; parent ditolak.",
      "Endpoint buat, ubah, hapus (soft delete), dan tetapkan rekening utama dengan `billing:withdraw`; tepat satu rekening utama per tenant.",
      "Nomor rekening ditampilkan tersamar pada respons baca tenant.",
      "Gateway meneruskan route baru di grup protected.",
      "Tenant tanpa wallet mendapat saldo nol, bukan error."
    ],
    "acceptanceCriteria": [
      "Saldo sama dengan jumlah mutasi ledger untuk tenant dengan transaksi paid.",
      "Anggota tanpa `billing:read` atau `billing:withdraw` ditolak 403 sesuai endpoint, dan tenant lain tidak dapat membaca data ini.",
      "Rekening utama dapat diganti tanpa menghapus riwayat.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: kebocoran data rekening dan saldo lintas tenant. Scope tenant diambil dari claim terverifikasi dan diterapkan di SQL. Billing dipilih sebagai pemilik data keuangan karena wallet, ledger, dan withdrawal sudah di billing; tabel identity tidak dipakai dan dicatat di ADR. Ledger tidak dikreditkan untuk transaksi sandbox, jadi dokumentasikan perilaku ini. Validasi format rekening mengikuti bank_code yang disimpan; verifikasi kepemilikan rekening dilakukan manual oleh platform admin saat pemrosesan. Perbarui `kelolakelas-docs` (api/billing.md, data/billing-schema.md, api/gateway.md) dan tulis ADR kepemilikan data keuangan tenant.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/domain/wallet.go",
      "kelolakelas-billing-service/internal/domain/ledger_entry.go",
      "kelolakelas-billing-service/internal/domain/bank_account.go",
      "kelolakelas-billing-service/internal/repository",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Tenant belum pernah menerima pembayaran.",
      "Menghapus rekening utama yang sedang dipakai penarikan berjalan.",
      "Dua request menetapkan rekening utama bersamaan."
    ],
    "testingValidation": [
      "Postgres integration test untuk scope tenant dan keunikan rekening utama saat serentak, sebagai mitigasi risiko kebocoran.",
      "Unit test handler untuk permission dan penyamaran nomor rekening.",
      "Router test gateway, go vet, go test -race, dan build lulus di kedua repo.",
      "Verifikasi saldo terhadap jumlah ledger pada data lokal."
    ],
    "outOfScope": [
      "Pengajuan dan pemrosesan penarikan.",
      "Verifikasi rekening otomatis via API bank."
    ]
  }
}
```
