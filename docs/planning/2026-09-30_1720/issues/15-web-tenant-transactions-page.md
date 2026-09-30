## Background / Problem

Tenant hanya punya kartu ringkasan (`SalesSummaryCard.tsx`) dan halaman enrollment dengan status bayar; tidak ada daftar transaksi lengkap atau unduhan.

## Goal

Tenant dapat menelusuri transaksi dan mengunduh CSV untuk rentang yang dipilih.

## Requirements

- Halaman transaksi dengan filter status, rentang tanggal (basis tanggal bayar), dan pencarian order id, serta pagination.
- Kolom gross, fee, net, status, dan tanggal bayar.
- Tombol unduh CSV untuk filter aktif.
- Menu transaksi mengikuti permission `billing:read`.

## Acceptance Criteria

- [ ] Tenant memfilter transaksi paid bulan lalu dan mengunduh CSV yang sama isinya.
- [ ] Anggota tanpa `billing:read` melihat panel forbidden.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Unduhan diproksikan lewat route atau server action web agar token tidak terekspos ke klien. Gunakan formatter rupiah yang ada. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_queries/sales-summary.ts`

## Edge Cases

- Rentang tanpa transaksi.
- Rentang melebihi batas backend.

## Testing / Validation

- [ ] Vitest untuk filter, pagination, dan error.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual unduhan CSV.

## Out of Scope

- Grafik historis.
- Refund (issue terpisah).

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-transactions-page",
  "projectKey": "tenant-finance-payout",
  "title": "Tenant melihat daftar transaksi dengan filter dan mengunduh CSV",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "M",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "billing-transaction-report-export"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Tenant hanya punya kartu ringkasan (`SalesSummaryCard.tsx`) dan halaman enrollment dengan status bayar; tidak ada daftar transaksi lengkap atau unduhan.",
    "goal": "Tenant dapat menelusuri transaksi dan mengunduh CSV untuk rentang yang dipilih.",
    "requirements": [
      "Halaman transaksi dengan filter status, rentang tanggal (basis tanggal bayar), dan pencarian order id, serta pagination.",
      "Kolom gross, fee, net, status, dan tanggal bayar.",
      "Tombol unduh CSV untuk filter aktif.",
      "Menu transaksi mengikuti permission `billing:read`."
    ],
    "acceptanceCriteria": [
      "Tenant memfilter transaksi paid bulan lalu dan mengunduh CSV yang sama isinya.",
      "Anggota tanpa `billing:read` melihat panel forbidden.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Unduhan diproksikan lewat route atau server action web agar token tidak terekspos ke klien. Gunakan formatter rupiah yang ada. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_queries/sales-summary.ts"
    ],
    "edgeCases": [
      "Rentang tanpa transaksi.",
      "Rentang melebihi batas backend."
    ],
    "testingValidation": [
      "Vitest untuk filter, pagination, dan error.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual unduhan CSV."
    ],
    "outOfScope": [
      "Grafik historis.",
      "Refund (issue terpisah)."
    ]
  }
}
```
