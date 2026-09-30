## Background / Problem

Tabel `vouchers` (code unik per tenant, discount_type/value, max_discount_amount, min_transaction_amount, max_uses/current_uses, valid_from/until, is_active) ada di billing (`migrations/00000000000000_init_schema.up.sql:3-13`) dan permission `voucher:*` sudah di-seed di identity, tetapi `VoucherRepository` hanya interface (`internal/repository/interfaces.go:40`) dan tidak ada route maupun UI.

## Goal

Tenant dapat mengelola voucher miliknya dari dashboard.

## Requirements

- Endpoint CRUD voucher dengan permission `voucher:create|read|update|delete`, di-scope tenant.
- Validasi: kode unik case-insensitive per tenant, nilai persen 1-100 atau nominal positif, rentang tanggal valid, dan max_uses minimal current_uses.
- Voucher yang pernah dipakai hanya dapat dinonaktifkan, bukan dihapus.
- Gateway meneruskan route, dan web menyediakan halaman daftar serta form voucher.

## Acceptance Criteria

- [ ] Tenant membuat voucher dan melihatnya di daftar dengan jumlah pemakaian.
- [ ] Kode duplikat dan nilai tidak valid ditolak dengan pesan jelas.
- [ ] Tenant lain tidak dapat membaca atau mengubah voucher ini.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Permission dicek lewat identity `CheckPermission` seperti `billing:read`. Belum ada efek pada harga checkout. Perbarui `kelolakelas-docs` (api/billing.md, api/gateway.md, components/web.md).

Relevant areas:

- `kelolakelas-billing-service/internal/domain/voucher.go`
- `kelolakelas-billing-service/internal/repository/interfaces.go`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant`

## Edge Cases

- Voucher kedaluwarsa diaktifkan kembali.
- Kode dengan huruf besar dan kecil berbeda.

## Testing / Validation

- [ ] Unit test validasi dan scope tenant.
- [ ] Router test gateway; go vet, go test -race, dan build billing lulus.
- [ ] Vitest form voucher; test, lint, type check, dan build web lulus.

## Out of Scope

- Penukaran voucher di checkout.
- Voucher lintas tenant atau dari platform.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-voucher-management",
  "projectKey": "tenant-storefront-growth",
  "title": "Tenant dapat membuat, mengubah, dan menonaktifkan voucher",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "billing",
    "api-gateway",
    "web",
    "ai-ready"
  ],
  "repositories": [
    "billing",
    "api-gateway",
    "web"
  ],
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tabel `vouchers` (code unik per tenant, discount_type/value, max_discount_amount, min_transaction_amount, max_uses/current_uses, valid_from/until, is_active) ada di billing (`migrations/00000000000000_init_schema.up.sql:3-13`) dan permission `voucher:*` sudah di-seed di identity, tetapi `VoucherRepository` hanya interface (`internal/repository/interfaces.go:40`) dan tidak ada route maupun UI.",
    "goal": "Tenant dapat mengelola voucher miliknya dari dashboard.",
    "requirements": [
      "Endpoint CRUD voucher dengan permission `voucher:create|read|update|delete`, di-scope tenant.",
      "Validasi: kode unik case-insensitive per tenant, nilai persen 1-100 atau nominal positif, rentang tanggal valid, dan max_uses minimal current_uses.",
      "Voucher yang pernah dipakai hanya dapat dinonaktifkan, bukan dihapus.",
      "Gateway meneruskan route, dan web menyediakan halaman daftar serta form voucher."
    ],
    "acceptanceCriteria": [
      "Tenant membuat voucher dan melihatnya di daftar dengan jumlah pemakaian.",
      "Kode duplikat dan nilai tidak valid ditolak dengan pesan jelas.",
      "Tenant lain tidak dapat membaca atau mengubah voucher ini.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Permission dicek lewat identity `CheckPermission` seperti `billing:read`. Belum ada efek pada harga checkout. Perbarui `kelolakelas-docs` (api/billing.md, api/gateway.md, components/web.md).",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/domain/voucher.go",
      "kelolakelas-billing-service/internal/repository/interfaces.go",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant"
    ],
    "edgeCases": [
      "Voucher kedaluwarsa diaktifkan kembali.",
      "Kode dengan huruf besar dan kecil berbeda."
    ],
    "testingValidation": [
      "Unit test validasi dan scope tenant.",
      "Router test gateway; go vet, go test -race, dan build billing lulus.",
      "Vitest form voucher; test, lint, type check, dan build web lulus."
    ],
    "outOfScope": [
      "Penukaran voucher di checkout.",
      "Voucher lintas tenant atau dari platform."
    ]
  }
}
```
