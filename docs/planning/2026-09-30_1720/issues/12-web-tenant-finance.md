## Background / Problem

Settings tenant hanya mencakup profil dan lokasi (`app/(dashboard)/dashboard/tenant/settings/_queries/queries.ts:117,152`); tidak ada UI saldo, rekening, atau penarikan.

## Goal

Tenant memiliki satu halaman keuangan untuk memantau saldo dan mengajukan pencairan ke rekeningnya.

## Requirements

- Kartu saldo tersedia dan tertahan, serta daftar mutasi berhalaman.
- Form kelola rekening bank utama dengan nomor tersamar.
- Form pengajuan penarikan dengan validasi jumlah dan konfirmasi, riwayat penarikan beserta statusnya, dan aksi batalkan untuk status requested.
- Menu keuangan mengikuti permission `billing:read` dan `billing:withdraw`.

## Acceptance Criteria

- [ ] Tenant dapat menambah rekening, mengajukan penarikan, dan melihat saldo tertahan bertambah.
- [ ] Pembatalan mengembalikan saldo tersedia di tampilan setelah refresh.
- [ ] Error backend (saldo kurang, tanpa rekening, pengajuan terbuka) ditampilkan dengan pesan yang jelas.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Format nominal mengikuti formatter rupiah yang dipakai `SalesSummaryCard`. Pengajuan memakai idempotency key per submit untuk mencegah submit ganda. Bila menu sadar-permission sudah ada, daftarkan item dengan permission yang sesuai. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant`
- `kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/SalesSummaryCard.tsx`

## Edge Cases

- Tenant tanpa transaksi.
- Klik ganda pada tombol ajukan.
- Anggota hanya dengan `billing:read`.

## Testing / Validation

- [ ] Vitest untuk form, validasi, dan state forbidden atau error.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual alur rekening → ajukan → batalkan.

## Out of Scope

- Antrean platform admin.
- Ekspor mutasi.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-tenant-finance",
  "projectKey": "tenant-finance-payout",
  "title": "Tenant melihat saldo, mutasi, rekening, dan mengajukan penarikan dari halaman keuangan",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "medium",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "billing-tenant-balance-bank-account",
    "billing-tenant-withdrawal-request"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Settings tenant hanya mencakup profil dan lokasi (`app/(dashboard)/dashboard/tenant/settings/_queries/queries.ts:117,152`); tidak ada UI saldo, rekening, atau penarikan.",
    "goal": "Tenant memiliki satu halaman keuangan untuk memantau saldo dan mengajukan pencairan ke rekeningnya.",
    "requirements": [
      "Kartu saldo tersedia dan tertahan, serta daftar mutasi berhalaman.",
      "Form kelola rekening bank utama dengan nomor tersamar.",
      "Form pengajuan penarikan dengan validasi jumlah dan konfirmasi, riwayat penarikan beserta statusnya, dan aksi batalkan untuk status requested.",
      "Menu keuangan mengikuti permission `billing:read` dan `billing:withdraw`."
    ],
    "acceptanceCriteria": [
      "Tenant dapat menambah rekening, mengajukan penarikan, dan melihat saldo tertahan bertambah.",
      "Pembatalan mengembalikan saldo tersedia di tampilan setelah refresh.",
      "Error backend (saldo kurang, tanpa rekening, pengajuan terbuka) ditampilkan dengan pesan yang jelas.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Format nominal mengikuti formatter rupiah yang dipakai `SalesSummaryCard`. Pengajuan memakai idempotency key per submit untuk mencegah submit ganda. Bila menu sadar-permission sudah ada, daftarkan item dengan permission yang sesuai. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant",
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/_components/SalesSummaryCard.tsx"
    ],
    "edgeCases": [
      "Tenant tanpa transaksi.",
      "Klik ganda pada tombol ajukan.",
      "Anggota hanya dengan `billing:read`."
    ],
    "testingValidation": [
      "Vitest untuk form, validasi, dan state forbidden atau error.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual alur rekening → ajukan → batalkan."
    ],
    "outOfScope": [
      "Antrean platform admin.",
      "Ekspor mutasi."
    ]
  }
}
```
