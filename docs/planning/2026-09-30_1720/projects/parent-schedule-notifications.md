## Tujuan/outcome

Parent diberi tahu lewat email dan pesan chat saat sesi anaknya di-reschedule, tutornya diganti, anaknya tercatat tidak hadir, dan sehari sebelum sesi.

## Masalah yang diselesaikan

Reschedule, tutor pengganti, dan absensi tidak menghasilkan komunikasi apa pun; academic tidak memiliki email atau outbox, dan chat tidak dapat menerima pesan dari sistem.

## Nilai dan prioritas

Medium: mengurangi sesi terlewat dan beban komunikasi manual tenant; memanfaatkan email Resend dan chat yang sudah ada tanpa vendor baru.

## Scope

- Pesan sistem di chat melalui endpoint internal dan percakapan notifikasi per parent per tenant.
- Outbox notifikasi academic untuk reschedule, tutor pengganti, dan absen, dengan pengiriman email dan chat.
- Pengingat sesi H-1.
- Tampilan pesan sistem di inbox web.

## Di luar scope

- WhatsApp, SMS, dan push notification (kandidat berikutnya).
- Preferensi notifikasi per parent.
- Broadcast dan marketing.

## Success metrics

- Setiap perubahan sesi yang memengaruhi enrollment aktif menghasilkan tepat satu notifikasi per parent per channel.
- Kegagalan email atau chat dapat diamati dan di-retry tanpa membatalkan perubahan jadwal.

## Dependencies/risiko

- Keputusan owner: channel email dan chat; WhatsApp ditunda.
- Academic belum menyimpan email parent pada enrollment; enrollment lama hanya menerima chat.
- Pengiriman ke provider eksternal bersifat at-least-once; butuh idempotency key.

## Issue yang diusulkan

1. Chat service menerima pesan notifikasi sistem dari service internal (`chat-system-notification-channel`)
2. Parent diberi tahu lewat email dan chat saat sesi di-reschedule, tutor diganti, atau anak tidak hadir (`academic-parent-notification-outbox`)
3. Parent menerima pengingat sehari sebelum sesi anaknya (`academic-session-reminder`)
4. Inbox parent menampilkan percakapan notifikasi sistem dengan jelas (`web-system-notification-render`)

## AI Orchestrator Project Contract

```json
{
  "key": "parent-schedule-notifications",
  "name": "Notifikasi perubahan jadwal dan kehadiran ke parent",
  "outcome": "Parent diberi tahu lewat email dan pesan chat saat sesi anaknya di-reschedule, tutornya diganti, anaknya tercatat tidak hadir, dan sehari sebelum sesi.",
  "problem": "Reschedule, tutor pengganti, dan absensi tidak menghasilkan komunikasi apa pun; academic tidak memiliki email atau outbox, dan chat tidak dapat menerima pesan dari sistem.",
  "valueAndPriority": "Medium: mengurangi sesi terlewat dan beban komunikasi manual tenant; memanfaatkan email Resend dan chat yang sudah ada tanpa vendor baru.",
  "scope": [
    "Pesan sistem di chat melalui endpoint internal dan percakapan notifikasi per parent per tenant.",
    "Outbox notifikasi academic untuk reschedule, tutor pengganti, dan absen, dengan pengiriman email dan chat.",
    "Pengingat sesi H-1.",
    "Tampilan pesan sistem di inbox web."
  ],
  "outOfScope": [
    "WhatsApp, SMS, dan push notification (kandidat berikutnya).",
    "Preferensi notifikasi per parent.",
    "Broadcast dan marketing."
  ],
  "successMetrics": [
    "Setiap perubahan sesi yang memengaruhi enrollment aktif menghasilkan tepat satu notifikasi per parent per channel.",
    "Kegagalan email atau chat dapat diamati dan di-retry tanpa membatalkan perubahan jadwal."
  ],
  "dependenciesAndRisks": [
    "Keputusan owner: channel email dan chat; WhatsApp ditunda.",
    "Academic belum menyimpan email parent pada enrollment; enrollment lama hanya menerima chat.",
    "Pengiriman ke provider eksternal bersifat at-least-once; butuh idempotency key."
  ]
}
```
