## Background / Problem

Worker renewal memproses subscription dengan `next_billing_date <= now+7d` (`internal/usecase/subscription_worker.go:73`) dan berhenti tanpa aksi setelah period+7 hari (`:90`); subscription tetap `active` dan hanya status pending serta active yang dipakai (`internal/domain/subscription.go:23`). Invoice renewal yang expired memicu job `release` (`internal/repository/transaction_repository.go:255-282`) yang tidak berdampak pada enrollment aktif.

## Goal

Periode renewal yang tidak dibayar hingga akhir masa tenggang menangguhkan subscription dan enrollment, dan pembayaran terlambat yang sah memulihkannya.

## Requirements

- Masa tenggang dapat dikonfigurasi (default 7 hari, sama dengan jendela penagihan saat ini).
- Setelah masa tenggang tanpa transaksi paid untuk periode itu, subscription menjadi tangguh dan billing memanggil suspend academic melalui job rekonsiliasi durable yang idempoten.
- Worker berhenti menerbitkan invoice dan pengingat untuk subscription tangguh.
- Pembayaran terlambat yang terkonfirmasi untuk periode tersebut mengaktifkan kembali subscription dan memanggil resume; bila resume konflik karena kursi penuh, catat status yang dapat diamati.
- Dokumentasikan interaksi job release untuk invoice renewal yang expired.

## Acceptance Criteria

- [ ] Subscription tanpa pembayaran melewati masa tenggang menjadi tangguh tepat satu kali dan enrollment-nya tangguh.
- [ ] Pembayaran terlambat memulihkan subscription dan enrollment; bila kursi penuh, status konflik tercatat dan dapat dilihat operator.
- [ ] Menjalankan worker berulang tidak menggandakan panggilan atau pengingat.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko critical: pembayaran yang diterima tetapi akses tetap tangguh, atau akses berlanjut tanpa bayar. Gunakan pola rekonsiliasi durable (ADR 0001) dan konfirmasi status Duitku sebelum settlement (ADR 0033). Pembayaran terlambat mengikuti ADR 0009. Worker berjalan in-process tanpa leader election (known gap), jadi transisi harus aman terhadap eksekusi ganda. Perbarui `kelolakelas-docs` (flows/billing-and-subscriptions.md, 04-configuration.md, reference/environment-variables.md) dan ADR dunning.

Relevant areas:

- `kelolakelas-billing-service/internal/usecase/subscription_worker.go`
- `kelolakelas-billing-service/internal/domain/subscription.go`
- `kelolakelas-billing-service/internal/repository/subscription_repository.go`
- `kelolakelas-billing-service/internal/repository/transaction_repository.go`
- `kelolakelas-billing-service/pkg/academic/client.go`

## Edge Cases

- Callback paid tiba tepat saat worker menangguhkan.
- Academic tidak tersedia saat suspend.
- Subscription lama tanpa billing email.

## Testing / Validation

- [ ] Postgres integration test race pembayaran terlambat vs suspend dan eksekusi worker ganda sebagai mitigasi risiko finansial.
- [ ] Unit test dengan clock palsu untuk batas masa tenggang.
- [ ] go vet, go test -race, dan build lulus.
- [ ] Verifikasi manual alur tidak bayar → tangguh → bayar terlambat → aktif dengan database lokal.

## Out of Scope

- Denda keterlambatan.
- Notifikasi khusus tangguh ke parent selain pengingat yang ada.

## AI Orchestrator Contract

```json
{
  "draftKey": "billing-renewal-grace-suspend",
  "projectKey": "renewal-dunning-refund",
  "title": "Renewal yang tidak dibayar setelah masa tenggang menangguhkan enrollment dan pulih saat dibayar",
  "type": "Feature",
  "priority": "High",
  "estimate": "M",
  "complexity": "critical",
  "labels": [
    "billing",
    "ai-ready"
  ],
  "repositories": [
    "billing"
  ],
  "blockedByDraftKeys": [
    "academic-enrollment-suspension"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Worker renewal memproses subscription dengan `next_billing_date <= now+7d` (`internal/usecase/subscription_worker.go:73`) dan berhenti tanpa aksi setelah period+7 hari (`:90`); subscription tetap `active` dan hanya status pending serta active yang dipakai (`internal/domain/subscription.go:23`). Invoice renewal yang expired memicu job `release` (`internal/repository/transaction_repository.go:255-282`) yang tidak berdampak pada enrollment aktif.",
    "goal": "Periode renewal yang tidak dibayar hingga akhir masa tenggang menangguhkan subscription dan enrollment, dan pembayaran terlambat yang sah memulihkannya.",
    "requirements": [
      "Masa tenggang dapat dikonfigurasi (default 7 hari, sama dengan jendela penagihan saat ini).",
      "Setelah masa tenggang tanpa transaksi paid untuk periode itu, subscription menjadi tangguh dan billing memanggil suspend academic melalui job rekonsiliasi durable yang idempoten.",
      "Worker berhenti menerbitkan invoice dan pengingat untuk subscription tangguh.",
      "Pembayaran terlambat yang terkonfirmasi untuk periode tersebut mengaktifkan kembali subscription dan memanggil resume; bila resume konflik karena kursi penuh, catat status yang dapat diamati.",
      "Dokumentasikan interaksi job release untuk invoice renewal yang expired."
    ],
    "acceptanceCriteria": [
      "Subscription tanpa pembayaran melewati masa tenggang menjadi tangguh tepat satu kali dan enrollment-nya tangguh.",
      "Pembayaran terlambat memulihkan subscription dan enrollment; bila kursi penuh, status konflik tercatat dan dapat dilihat operator.",
      "Menjalankan worker berulang tidak menggandakan panggilan atau pengingat.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko critical: pembayaran yang diterima tetapi akses tetap tangguh, atau akses berlanjut tanpa bayar. Gunakan pola rekonsiliasi durable (ADR 0001) dan konfirmasi status Duitku sebelum settlement (ADR 0033). Pembayaran terlambat mengikuti ADR 0009. Worker berjalan in-process tanpa leader election (known gap), jadi transisi harus aman terhadap eksekusi ganda. Perbarui `kelolakelas-docs` (flows/billing-and-subscriptions.md, 04-configuration.md, reference/environment-variables.md) dan ADR dunning.",
    "relevantAreas": [
      "kelolakelas-billing-service/internal/usecase/subscription_worker.go",
      "kelolakelas-billing-service/internal/domain/subscription.go",
      "kelolakelas-billing-service/internal/repository/subscription_repository.go",
      "kelolakelas-billing-service/internal/repository/transaction_repository.go",
      "kelolakelas-billing-service/pkg/academic/client.go"
    ],
    "edgeCases": [
      "Callback paid tiba tepat saat worker menangguhkan.",
      "Academic tidak tersedia saat suspend.",
      "Subscription lama tanpa billing email."
    ],
    "testingValidation": [
      "Postgres integration test race pembayaran terlambat vs suspend dan eksekusi worker ganda sebagai mitigasi risiko finansial.",
      "Unit test dengan clock palsu untuk batas masa tenggang.",
      "go vet, go test -race, dan build lulus.",
      "Verifikasi manual alur tidak bayar → tangguh → bayar terlambat → aktif dengan database lokal."
    ],
    "outOfScope": [
      "Denda keterlambatan.",
      "Notifikasi khusus tangguh ke parent selain pengingat yang ada."
    ]
  }
}
```
