## Background / Problem

`GET /api/v1/billing/transactions` memfilter tanggal berdasarkan `created_at`, bukan `paid_at` (`internal/delivery/http/handler/transaction_handler.go:44-80`, `internal/repository/transaction_repository.go:89-103`), sementara summary memakai `paid_at` (ADR 0039). Tidak ada ekspor.

## Goal

Tenant dapat mengambil daftar transaksi yang cocok dengan ringkasan penjualan dan mengekspornya sebagai CSV untuk pembukuan.

## Requirements

- Tambahkan pilihan basis tanggal `paid_at` pada daftar transaksi tanpa mengubah default lama.
- Endpoint ekspor CSV dengan filter yang sama, `billing:read`, parent ditolak, dan rentang maksimal 366 hari.
- Kolom CSV mencakup order id, tanggal buat dan bayar, status, student atau enrollment id, subtotal, diskon, gross, platform fee, gateway fee, dan net.
- Nilai sel dinetralkan terhadap CSV/formula injection.
- Gateway meneruskan route ekspor.

## Acceptance Criteria

- [ ] Total net CSV untuk transaksi paid pada rentang yang sama cocok dengan summary.
- [ ] Rentang lebih dari 366 hari dan tanggal tidak valid ditolak 400.
- [ ] Nilai yang diawali `=`, `+`, `-`, atau `@` tidak dieksekusi sebagai formula di spreadsheet.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Hari mengikuti UTC seperti summary (ADR 0039, batas WIB pukul 07:00); dokumentasikan hal ini di respons dan docs. Streaming atau batasi ukuran agar tidak memuat seluruh data ke memori; summary tidak punya index khusus sehingga periksa rencana query. Perbarui `kelolakelas-docs` (api/billing.md, api/gateway.md).

Relevant areas:

- `kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Rentang tanpa transaksi (CSV hanya header).
- Transaksi dengan beberapa mata uang.
- Transaksi paid terlambat setelah expired lokal.

## Testing / Validation

- [ ] Unit test pembentukan CSV termasuk escaping dan injection.
- [ ] Integration test kecocokan total dengan summary.
- [ ] Router test gateway, go vet, go test -race, dan build lulus.

## Out of Scope

- Ekspor Excel atau PDF.
- Laporan terjadwal via email.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-transaction-report-export",
  "projectKey": "tenant-finance-payout",
  "title": "Tenant dapat memfilter transaksi berdasarkan tanggal bayar dan mengekspornya ke CSV",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
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
    "backgroundProblem": "`GET /api/v1/billing/transactions` memfilter tanggal berdasarkan `created_at`, bukan `paid_at` (`internal/delivery/http/handler/transaction_handler.go:44-80`, `internal/repository/transaction_repository.go:89-103`), sementara summary memakai `paid_at` (ADR 0039). Tidak ada ekspor.",
    "goal": "Tenant dapat mengambil daftar transaksi yang cocok dengan ringkasan penjualan dan mengekspornya sebagai CSV untuk pembukuan.",
    "requirements": [
      "Tambahkan pilihan basis tanggal `paid_at` pada daftar transaksi tanpa mengubah default lama.",
      "Endpoint ekspor CSV dengan filter yang sama, `billing:read`, parent ditolak, dan rentang maksimal 366 hari.",
      "Kolom CSV mencakup order id, tanggal buat dan bayar, status, student atau enrollment id, subtotal, diskon, gross, platform fee, gateway fee, dan net.",
      "Nilai sel dinetralkan terhadap CSV/formula injection.",
      "Gateway meneruskan route ekspor."
    ],
    "acceptanceCriteria": [
      "Total net CSV untuk transaksi paid pada rentang yang sama cocok dengan summary.",
      "Rentang lebih dari 366 hari dan tanggal tidak valid ditolak 400.",
      "Nilai yang diawali `=`, `+`, `-`, atau `@` tidak dieksekusi sebagai formula di spreadsheet.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Hari mengikuti UTC seperti summary (ADR 0039, batas WIB pukul 07:00); dokumentasikan hal ini di respons dan docs. Streaming atau batasi ukuran agar tidak memuat seluruh data ke memori; summary tidak punya index khusus sehingga periksa rencana query. Perbarui `kelolakelas-docs` (api/billing.md, api/gateway.md).",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/delivery/http/handler/transaction_handler.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Rentang tanpa transaksi (CSV hanya header).",
      "Transaksi dengan beberapa mata uang.",
      "Transaksi paid terlambat setelah expired lokal."
    ],
    "testingValidation": [
      "Unit test pembentukan CSV termasuk escaping dan injection.",
      "Integration test kecocokan total dengan summary.",
      "Router test gateway, go vet, go test -race, dan build lulus."
    ],
    "outOfScope": [
      "Ekspor Excel atau PDF.",
      "Laporan terjadwal via email."
    ]
  }
}
```
