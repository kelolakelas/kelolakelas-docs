## Tujuan/outcome

Parent menerima payment link dari keputusan jadwal private melalui email dan percakapan private yang tepat, tanpa duplikasi berbahaya.

## Masalah yang diselesaikan

Persetujuan membuat invoice dan link, tetapi tidak mengirimkannya sebagai pesan email/chat yang dapat ditemukan parent.

## Nilai dan prioritas

High: menutup jeda antara persetujuan tenant dan pembayaran parent, tanpa membuat ulang checkout.

## Scope

- Kirim link ke email parent tersimpan setelah invoice tersedia.
- Kirim link melalui percakapan schedule_request yang terlindungi tenant/parent.

## Di luar scope

- Membangun ulang inbox/entry point yang sudah ada di KEL-123/124.
- Broadcast massal, email marketing, dan negosiasi jadwal baru.

## Success metrics

- Satu keputusan yang berhasil dapat menghasilkan komunikasi email/chat ke parent yang benar, dengan penanganan retry terukur.
- Tidak ada link atau pesan lintas tenant/parent.

## Dependencies/risiko

- Chat backend KEL-119..122 sudah merge; web inbox KEL-123 dan entry points KEL-124 masih Backlog dan diperlukan untuk acceptance UI penuh.
- Kegagalan provider email/chat tidak boleh merusak keputusan enrollment atau mengirim link tenant lain.

## Issue yang diusulkan

1. Parent menerima email payment link setelah jadwal private disetujui (`private-payment-link-email`)
2. Payment link private dapat dikirim lewat percakapan request yang tepat (`private-payment-link-chat`)

## AI Orchestrator Project Contract

```json
{
  "key": "private-payment-link-delivery",
  "name": "Distribusi aman payment link kelas private",
  "outcome": "Parent menerima payment link dari keputusan jadwal private melalui email dan percakapan private yang tepat, tanpa duplikasi berbahaya.",
  "problem": "Persetujuan membuat invoice dan link, tetapi tidak mengirimkannya sebagai pesan email/chat yang dapat ditemukan parent.",
  "valueAndPriority": "High: menutup jeda antara persetujuan tenant dan pembayaran parent, tanpa membuat ulang checkout.",
  "scope": [
    "Kirim link ke email parent tersimpan setelah invoice tersedia.",
    "Kirim link melalui percakapan schedule_request yang terlindungi tenant/parent."
  ],
  "outOfScope": [
    "Membangun ulang inbox/entry point yang sudah ada di KEL-123/124.",
    "Broadcast massal, email marketing, dan negosiasi jadwal baru."
  ],
  "successMetrics": [
    "Satu keputusan yang berhasil dapat menghasilkan komunikasi email/chat ke parent yang benar, dengan penanganan retry terukur.",
    "Tidak ada link atau pesan lintas tenant/parent."
  ],
  "dependenciesAndRisks": [
    "Chat backend KEL-119..122 sudah merge; web inbox KEL-123 dan entry points KEL-124 masih Backlog dan diperlukan untuk acceptance UI penuh.",
    "Kegagalan provider email/chat tidak boleh merusak keputusan enrollment atau mengirim link tenant lain."
  ]
}
```
