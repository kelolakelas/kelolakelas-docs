## Background / Problem

Academic tidak memiliki email client, outbox, maupun event (`internal/usecase` tanpa notifikasi); reschedule dan tutor pengganti (`internal/usecase/schedule_usecase.go:338-348,473-506`) serta absensi tidak memberi tahu siapa pun. Email parent dari JWT diteruskan ke billing saat checkout tetapi tidak disimpan di enrollment (`internal/domain/enrollment.go:95`).

## Goal

Setiap reschedule, tutor pengganti, dan absensi alfa yang memengaruhi enrollment aktif menghasilkan notifikasi email dan chat yang andal ke parent terkait.

## Requirements

- Simpan email parent terverifikasi pada enrollment baru dari JWT saat checkout; enrollment lama tanpa email hanya menerima chat.
- Tulis event notifikasi ke outbox dalam transaksi database yang sama dengan perubahan sesi atau absensi.
- Worker mengirim outbox ke endpoint internal chat dan email Resend dengan retry, backoff, dan idempotency key per event, parent, dan channel.
- Isi pesan memuat nama kelas, nama depan siswa, waktu lama dan baru (Asia/Jakarta), tanpa data sensitif lain.
- Kegagalan pengiriman tidak membatalkan perubahan jadwal dan tercatat untuk diamati.

## Acceptance Criteria

- [ ] Reschedule sesi group mengirim satu notifikasi per parent terdampak per channel.
- [ ] Absensi alfa mengirim notifikasi ke parent siswa tersebut saja.
- [ ] Restart worker di tengah pengiriman tidak menggandakan pesan chat dan memakai idempotency key yang sama untuk email.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko high: salah kirim ke parent lain dan pesan ganda setelah crash. Pengiriman ke provider bersifat at-least-once. Worker in-process tanpa leader election, jadi klaim baris outbox dengan `FOR UPDATE SKIP LOCKED` seperti session generation worker. Konfigurasi baru (Resend, URL chat, kredensial internal) wajib didokumentasikan tanpa nilai rahasia. Perbarui `kelolakelas-docs` (components/academic-service.md, 04-configuration.md, reference/environment-variables.md, data/academic-schema.md) dan ADR outbox notifikasi.

Relevant areas:

- `kelolakelas-academic-service/internal/usecase/schedule_usecase.go`
- `kelolakelas-academic-service/internal/usecase/attendance_usecase.go`
- `kelolakelas-academic-service/internal/usecase/enrollment_usecase.go`
- `kelolakelas-academic-service/internal/usecase/session_generation_worker.go`
- `kelolakelas-academic-service/cmd/server/main.go`
- `kelolakelas-academic-service/migrations`

## Edge Cases

- Parent memiliki dua anak di sesi yang sama.
- Absensi diubah dari alfa ke hadir setelah notifikasi dikirim.
- Chat service tidak tersedia dalam waktu lama.

## Testing / Validation

- [ ] Postgres integration test penulisan outbox atomik dan klaim worker ganda sebagai mitigasi risiko pesan ganda.
- [ ] Unit test pemilihan penerima untuk sesi group dan private sebagai mitigasi risiko salah kirim.
- [ ] Test dengan fake chat dan fake email untuk retry dan idempotensi.
- [ ] go vet, go test -race, dan build lulus.

## Out of Scope

- Pengingat sesi H-1.
- WhatsApp dan preferensi notifikasi.

## AI Orchestrator Contract

```json
{
  "draftKey": "academic-parent-notification-outbox",
  "projectKey": "parent-schedule-notifications",
  "title": "Parent diberi tahu lewat email dan chat saat sesi di-reschedule, tutor diganti, atau anak tidak hadir",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "L",
  "complexity": "high",
  "labels": [
    "academic",
    "ai-ready"
  ],
  "repositories": [
    "academic"
  ],
  "blockedByDraftKeys": [
    "chat-system-notification-channel",
    "attendance-by-session"
  ],
  "externalDependencies": [
    {
      "key": "resend-sender-domain",
      "description": "Academic membutuhkan API key dan sender domain Resend yang terverifikasi untuk mengirim email.",
      "verification": "Email uji dari academic ke alamat sandbox terkirim dengan status delivered di dashboard Resend."
    }
  ],
  "body": {
    "backgroundProblem": "Academic tidak memiliki email client, outbox, maupun event (`internal/usecase` tanpa notifikasi); reschedule dan tutor pengganti (`internal/usecase/schedule_usecase.go:338-348,473-506`) serta absensi tidak memberi tahu siapa pun. Email parent dari JWT diteruskan ke billing saat checkout tetapi tidak disimpan di enrollment (`internal/domain/enrollment.go:95`).",
    "goal": "Setiap reschedule, tutor pengganti, dan absensi alfa yang memengaruhi enrollment aktif menghasilkan notifikasi email dan chat yang andal ke parent terkait.",
    "requirements": [
      "Simpan email parent terverifikasi pada enrollment baru dari JWT saat checkout; enrollment lama tanpa email hanya menerima chat.",
      "Tulis event notifikasi ke outbox dalam transaksi database yang sama dengan perubahan sesi atau absensi.",
      "Worker mengirim outbox ke endpoint internal chat dan email Resend dengan retry, backoff, dan idempotency key per event, parent, dan channel.",
      "Isi pesan memuat nama kelas, nama depan siswa, waktu lama dan baru (Asia/Jakarta), tanpa data sensitif lain.",
      "Kegagalan pengiriman tidak membatalkan perubahan jadwal dan tercatat untuk diamati."
    ],
    "acceptanceCriteria": [
      "Reschedule sesi group mengirim satu notifikasi per parent terdampak per channel.",
      "Absensi alfa mengirim notifikasi ke parent siswa tersebut saja.",
      "Restart worker di tengah pengiriman tidak menggandakan pesan chat dan memakai idempotency key yang sama untuk email.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko high: salah kirim ke parent lain dan pesan ganda setelah crash. Pengiriman ke provider bersifat at-least-once. Worker in-process tanpa leader election, jadi klaim baris outbox dengan `FOR UPDATE SKIP LOCKED` seperti session generation worker. Konfigurasi baru (Resend, URL chat, kredensial internal) wajib didokumentasikan tanpa nilai rahasia. Perbarui `kelolakelas-docs` (components/academic-service.md, 04-configuration.md, reference/environment-variables.md, data/academic-schema.md) dan ADR outbox notifikasi.",
    "relevantAreas": [
      "kelolakelas-academic-service/internal/usecase/schedule_usecase.go",
      "kelolakelas-academic-service/internal/usecase/attendance_usecase.go",
      "kelolakelas-academic-service/internal/usecase/enrollment_usecase.go",
      "kelolakelas-academic-service/internal/usecase/session_generation_worker.go",
      "kelolakelas-academic-service/cmd/server/main.go",
      "kelolakelas-academic-service/migrations"
    ],
    "edgeCases": [
      "Parent memiliki dua anak di sesi yang sama.",
      "Absensi diubah dari alfa ke hadir setelah notifikasi dikirim.",
      "Chat service tidak tersedia dalam waktu lama."
    ],
    "testingValidation": [
      "Postgres integration test penulisan outbox atomik dan klaim worker ganda sebagai mitigasi risiko pesan ganda.",
      "Unit test pemilihan penerima untuk sesi group dan private sebagai mitigasi risiko salah kirim.",
      "Test dengan fake chat dan fake email untuk retry dan idempotensi.",
      "go vet, go test -race, dan build lulus."
    ],
    "outOfScope": [
      "Pengingat sesi H-1.",
      "WhatsApp dan preferensi notifikasi."
    ]
  }
}
```
