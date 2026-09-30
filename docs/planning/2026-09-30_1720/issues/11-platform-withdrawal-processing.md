## Background / Problem

Gateway `RequirePlatform` hanya memeriksa claim JWT; identity memeriksa ulang assignment platform admin secara live untuk route-nya sendiri (ADR 0026), tetapi gRPC identity hanya menyediakan ValidateTenantStatus, GetTenantPublicInfo, CheckPermission, CatalogPolicy, dan FeePolicy (`kelolakelas-identity-service/cmd/server/main.go:230-233`). Billing tidak dapat memverifikasi platform admin dan tidak memiliki alur pemrosesan penarikan.

## Goal

Platform admin yang aktif dapat melihat antrean penarikan, menandai penarikan sebagai dibayar dengan referensi transfer, atau menolaknya dengan alasan, dan saldo tenant diperbarui dengan benar.

## Requirements

- Identity menyediakan pemeriksaan assignment platform admin aktif lewat gRPC internal yang dipakai billing secara fail-closed.
- Billing menyediakan endpoint platform untuk antrean penarikan (terlama dahulu) beserta detail rekening lengkap, tandai dibayar (wajib referensi transfer), dan tolak (wajib alasan).
- Dibayar mengurangi saldo tertahan dengan entri ledger; ditolak mengembalikan saldo ke tersedia dengan entri pembalik; keduanya atomik dan hanya dari status requested.
- Setiap keputusan menyimpan pelaku, waktu, dan referensi atau alasan.
- Gateway meneruskan route di bawah `/api/v1/platform/...` dengan `RequirePlatform`.

## Acceptance Criteria

- [ ] Platform admin aktif dapat menandai dibayar dan menolak; admin yang assignment-nya dicabut ditolak meski token masih berlaku.
- [ ] Keputusan ganda atau serentak pada penarikan yang sama hanya satu yang berhasil.
- [ ] Saldo tersedia + tertahan tenant tetap sama dengan jumlah ledger setelah setiap keputusan.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebenaran finansial dan eskalasi hak akses lintas tenant. Tambahkan kontrak gRPC baru mengikuti pola CatalogPolicy/FeePolicy di identity dan client billing di `pkg/identity`; dokumentasikan konfigurasi alamat gRPC. Status penarikan dibatasi requested → paid|rejected|cancelled. Tidak ada pemanggilan API disbursement. Perbarui `kelolakelas-docs` (api/billing.md, api/identity.md, 05-security.md) dan ADR pemrosesan manual.

Relevant areas:

- `kelolakelas-identity-service/internal/delivery/grpc`
- `kelolakelas-identity-service/cmd/server/main.go`
- `kelolakelas-billing-service/pkg/identity`
- `kelolakelas-billing-service/internal/usecase`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Tenant membatalkan saat admin sedang memproses.
- Identity gRPC tidak tersedia.
- Referensi transfer duplikat untuk dua penarikan.

## Testing / Validation

- [ ] Postgres integration test keputusan serentak dan invariant ledger sebagai mitigasi risiko finansial.
- [ ] Unit test gRPC identity dan jalur fail-closed billing untuk admin aktif, dicabut, dan bukan admin.
- [ ] Router test gateway, go vet, go test -race, dan build lulus di ketiga repo.
- [ ] Verifikasi manual alur ajukan → bayar dan ajukan → tolak.

## Out of Scope

- Layar web antrean platform.
- Disbursement otomatis dan notifikasi email penarikan.

## AI Orchestrator Contract

```json
{
  "draftKey": "platform-withdrawal-processing",
  "projectKey": "tenant-finance-payout",
  "title": "Platform admin memproses penarikan tenant secara manual dengan jejak audit",
  "type": "Feature",
  "priority": "High",
  "estimate": "L",
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
    "billing-tenant-withdrawal-request"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Gateway `RequirePlatform` hanya memeriksa claim JWT; identity memeriksa ulang assignment platform admin secara live untuk route-nya sendiri (ADR 0026), tetapi gRPC identity hanya menyediakan ValidateTenantStatus, GetTenantPublicInfo, CheckPermission, CatalogPolicy, dan FeePolicy (`kelolakelas-identity-service/cmd/server/main.go:230-233`). Billing tidak dapat memverifikasi platform admin dan tidak memiliki alur pemrosesan penarikan.",
    "goal": "Platform admin yang aktif dapat melihat antrean penarikan, menandai penarikan sebagai dibayar dengan referensi transfer, atau menolaknya dengan alasan, dan saldo tenant diperbarui dengan benar.",
    "requirements": [
      "Identity menyediakan pemeriksaan assignment platform admin aktif lewat gRPC internal yang dipakai billing secara fail-closed.",
      "Billing menyediakan endpoint platform untuk antrean penarikan (terlama dahulu) beserta detail rekening lengkap, tandai dibayar (wajib referensi transfer), dan tolak (wajib alasan).",
      "Dibayar mengurangi saldo tertahan dengan entri ledger; ditolak mengembalikan saldo ke tersedia dengan entri pembalik; keduanya atomik dan hanya dari status requested.",
      "Setiap keputusan menyimpan pelaku, waktu, dan referensi atau alasan.",
      "Gateway meneruskan route di bawah `/api/v1/platform/...` dengan `RequirePlatform`."
    ],
    "acceptanceCriteria": [
      "Platform admin aktif dapat menandai dibayar dan menolak; admin yang assignment-nya dicabut ditolak meski token masih berlaku.",
      "Keputusan ganda atau serentak pada penarikan yang sama hanya satu yang berhasil.",
      "Saldo tersedia + tertahan tenant tetap sama dengan jumlah ledger setelah setiap keputusan.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebenaran finansial dan eskalasi hak akses lintas tenant. Tambahkan kontrak gRPC baru mengikuti pola CatalogPolicy/FeePolicy di identity dan client billing di `pkg/identity`; dokumentasikan konfigurasi alamat gRPC. Status penarikan dibatasi requested → paid|rejected|cancelled. Tidak ada pemanggilan API disbursement. Perbarui `kelolakelas-docs` (api/billing.md, api/identity.md, 05-security.md) dan ADR pemrosesan manual.",
    "relevantAreas": [
      "kelolakelas-identity-service/internal/delivery/grpc",
      "kelolakelas-identity-service/cmd/server/main.go",
      "kelolakelas-billing-service/pkg/identity",
      "kelolakelas-billing-service/internal/usecase",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Tenant membatalkan saat admin sedang memproses.",
      "Identity gRPC tidak tersedia.",
      "Referensi transfer duplikat untuk dua penarikan."
    ],
    "testingValidation": [
      "Postgres integration test keputusan serentak dan invariant ledger sebagai mitigasi risiko finansial.",
      "Unit test gRPC identity dan jalur fail-closed billing untuk admin aktif, dicabut, dan bukan admin.",
      "Router test gateway, go vet, go test -race, dan build lulus di ketiga repo.",
      "Verifikasi manual alur ajukan → bayar dan ajukan → tolak."
    ],
    "outOfScope": [
      "Layar web antrean platform.",
      "Disbursement otomatis dan notifikasi email penarikan."
    ]
  }
}
```
