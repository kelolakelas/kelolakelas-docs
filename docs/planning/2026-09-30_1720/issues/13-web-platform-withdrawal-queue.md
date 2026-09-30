## Background / Problem

Dashboard platform memiliki halaman creator requests (`app/platform/creator-requests/page.tsx`) tetapi tidak ada halaman penarikan.

## Goal

Platform admin dapat melihat antrean penarikan dan mencatat hasil transfer manual atau penolakan.

## Requirements

- Halaman antrean penarikan dengan tenant, jumlah, rekening tujuan lengkap, dan waktu pengajuan.
- Aksi tandai dibayar dengan input referensi transfer dan aksi tolak dengan alasan, masing-masing dengan konfirmasi.
- Riwayat keputusan terbaru.

## Acceptance Criteria

- [ ] Admin mencatat pembayaran dan item keluar dari antrean.
- [ ] Penolakan tanpa alasan dicegah di form.
- [ ] Keputusan yang sudah diproses admin lain menampilkan pesan konflik yang jelas.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Ikuti pola halaman platform creator requests, termasuk alur challenge TOTP yang ada. Nomor rekening lengkap hanya ditampilkan di halaman ini. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/platform`
- `kelolakelas-web/app/platform/creator-requests`

## Edge Cases

- Antrean kosong.
- Sesi platform kedaluwarsa saat memproses.

## Testing / Validation

- [ ] Vitest untuk form keputusan dan state konflik.
- [ ] Test, lint, type check, dan production build lulus.
- [ ] Verifikasi manual sebagai platform admin.

## Out of Scope

- Ekspor laporan penarikan.
- Disbursement otomatis.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-platform-withdrawal-queue",
  "projectKey": "tenant-finance-payout",
  "title": "Platform admin memproses antrean penarikan tenant dari dashboard platform",
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
    "platform-withdrawal-processing"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Dashboard platform memiliki halaman creator requests (`app/platform/creator-requests/page.tsx`) tetapi tidak ada halaman penarikan.",
    "goal": "Platform admin dapat melihat antrean penarikan dan mencatat hasil transfer manual atau penolakan.",
    "requirements": [
      "Halaman antrean penarikan dengan tenant, jumlah, rekening tujuan lengkap, dan waktu pengajuan.",
      "Aksi tandai dibayar dengan input referensi transfer dan aksi tolak dengan alasan, masing-masing dengan konfirmasi.",
      "Riwayat keputusan terbaru."
    ],
    "acceptanceCriteria": [
      "Admin mencatat pembayaran dan item keluar dari antrean.",
      "Penolakan tanpa alasan dicegah di form.",
      "Keputusan yang sudah diproses admin lain menampilkan pesan konflik yang jelas.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Ikuti pola halaman platform creator requests, termasuk alur challenge TOTP yang ada. Nomor rekening lengkap hanya ditampilkan di halaman ini. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/platform",
      "kelolakelas-web/app/platform/creator-requests"
    ],
    "edgeCases": [
      "Antrean kosong.",
      "Sesi platform kedaluwarsa saat memproses."
    ],
    "testingValidation": [
      "Vitest untuk form keputusan dan state konflik.",
      "Test, lint, type check, dan production build lulus.",
      "Verifikasi manual sebagai platform admin."
    ],
    "outOfScope": [
      "Ekspor laporan penarikan.",
      "Disbursement otomatis."
    ]
  }
}
```
