## Background / Problem

`pkg/duitku/client.go:42-47` hanya membaca reference dan paymentUrl; respons provider tentang VA/QR tidak sampai ke transaction. Endpoint transaksi `cmd/server/routes.go:36-38` hanya menyajikan metadata lama.

## Goal

Parent dapat membaca instruksi pembayaran miliknya sendiri beserta status dan expiry melalui API yang sudah terlindungi.

## Requirements

- Baca dan simpan instruksi provider yang diverifikasi untuk invoice VA/QRIS dengan migration kompatibel terhadap baris lama; jangan invent nama field dari contoh saja.
- Sajikan instruksi, channel, checkout fallback, status dan expiry kepada pemilik parent yang terotentikasi; tenant tidak boleh mengakses data instruksi parent lain melalui ID transaksi.
- Pertahankan respons transaksi lama atau tambahkan endpoint baru melalui gateway tanpa mengubah semantik GET lama; instruksi lama yang tak tersedia harus menampilkan fallback yang jelas.
- Saat invoice reissued, instruksi lama tidak boleh ditampilkan sebagai instruksi aktif.

## Acceptance Criteria

- [ ] Transaksi VA/QR yang sah mengembalikan instruksi sesuai respons provider, status dan expiry.
- [ ] Parent lain dan tenant lain tidak dapat membaca instruksi tersebut; data rahasia provider tidak pernah muncul.
- [ ] Invoice yang expired, gagal, atau diganti tidak menampilkan detail pembayaran lama seolah masih dapat dipakai.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: kebocoran instruksi lintas parent/tenant dan pembayaran ke VA/QR kadaluarsa. Validasi ownership di billing handler/usecase, bukan UI/gateway saja. Tinjau migration `transactions`, transaction list/query parent, dan reset kolom saat reinvoice. Pertahankan `checkout_session_url` untuk fallback klien lama. Dokumentasikan contract API/gateway dan data migration.

Relevant areas:

- `kelolakelas-billing-service/pkg/duitku/client.go`
- `kelolakelas-billing-service/internal/domain/payment_gateway.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/cmd/server/routes.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`

## Edge Cases

- Provider hanya mengirim paymentUrl tanpa VA/QR.
- Callback paid datang setelah invoice lokal expired.
- Baris lama tidak memiliki instruksi baru; transaksi di-reinvoice.

## Testing / Validation

- [ ] Uji sandbox bentuk respons provider, parsing, persistence dan redaksi log; uji migration up/down pada data lama.
- [ ] Uji parent yang benar, parent lain, tenant lain, sesi kedaluwarsa dan transaksi tidak ditemukan.
- [ ] Uji reinvoice/late callback mencegah instruksi stale; jalankan go test -race, go vet dan build di kedua repo.

## Out of Scope

- Menampilkan halaman pembayaran web.
- Mengubah status settlement tanpa callback/konfirmasi provider.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-payment-instructions",
  "projectKey": "payment-experience-owned-page",
  "title": "Billing menyimpan dan menyajikan instruksi pembayaran VA/QR untuk transaksi milik parent",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "repositories": [
    "billing",
    "api-gateway"
  ],
  "labels": [
    "billing",
    "api-gateway",
    "ai-ready"
  ],
  "blockedByDraftKeys": [
    "billing-payment-channel-selection"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`pkg/duitku/client.go:42-47` hanya membaca reference dan paymentUrl; respons provider tentang VA/QR tidak sampai ke transaction. Endpoint transaksi `cmd/server/routes.go:36-38` hanya menyajikan metadata lama.",
    "goal": "Parent dapat membaca instruksi pembayaran miliknya sendiri beserta status dan expiry melalui API yang sudah terlindungi.",
    "requirements": [
      "Baca dan simpan instruksi provider yang diverifikasi untuk invoice VA/QRIS dengan migration kompatibel terhadap baris lama; jangan invent nama field dari contoh saja.",
      "Sajikan instruksi, channel, checkout fallback, status dan expiry kepada pemilik parent yang terotentikasi; tenant tidak boleh mengakses data instruksi parent lain melalui ID transaksi.",
      "Pertahankan respons transaksi lama atau tambahkan endpoint baru melalui gateway tanpa mengubah semantik GET lama; instruksi lama yang tak tersedia harus menampilkan fallback yang jelas.",
      "Saat invoice reissued, instruksi lama tidak boleh ditampilkan sebagai instruksi aktif."
    ],
    "acceptanceCriteria": [
      "Transaksi VA/QR yang sah mengembalikan instruksi sesuai respons provider, status dan expiry.",
      "Parent lain dan tenant lain tidak dapat membaca instruksi tersebut; data rahasia provider tidak pernah muncul.",
      "Invoice yang expired, gagal, atau diganti tidak menampilkan detail pembayaran lama seolah masih dapat dipakai.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: kebocoran instruksi lintas parent/tenant dan pembayaran ke VA/QR kadaluarsa. Validasi ownership di billing handler/usecase, bukan UI/gateway saja. Tinjau migration `transactions`, transaction list/query parent, dan reset kolom saat reinvoice. Pertahankan `checkout_session_url` untuk fallback klien lama. Dokumentasikan contract API/gateway dan data migration.",
    "relevantAreas": [
      "kelolakelas-billing-service/pkg/duitku/client.go",
      "kelolakelas-billing-service/internal/domain/payment_gateway.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/cmd/server/routes.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go"
    ],
    "edgeCases": [
      "Provider hanya mengirim paymentUrl tanpa VA/QR.",
      "Callback paid datang setelah invoice lokal expired.",
      "Baris lama tidak memiliki instruksi baru; transaksi di-reinvoice."
    ],
    "testingValidation": [
      "Uji sandbox bentuk respons provider, parsing, persistence dan redaksi log; uji migration up/down pada data lama.",
      "Uji parent yang benar, parent lain, tenant lain, sesi kedaluwarsa dan transaksi tidak ditemukan.",
      "Uji reinvoice/late callback mencegah instruksi stale; jalankan go test -race, go vet dan build di kedua repo."
    ],
    "outOfScope": [
      "Menampilkan halaman pembayaran web.",
      "Mengubah status settlement tanpa callback/konfirmasi provider."
    ]
  }
}
```
