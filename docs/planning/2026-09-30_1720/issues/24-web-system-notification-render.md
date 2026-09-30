## Background / Problem

`ChatInbox.tsx` hanya mengenal pesan parent dan member; tidak ada tampilan pesan sistem.

## Goal

Parent dapat membedakan percakapan notifikasi dari tenant dan membaca pesannya tanpa kolom balasan.

## Requirements

- Percakapan notifikasi diberi label tenant dan ikon yang berbeda serta muncul di inbox dengan unread count.
- Pesan sistem dirender dengan gaya berbeda dan tanpa input balasan.
- Jenis percakapan atau sender yang tidak dikenal tidak membuat inbox error.

## Acceptance Criteria

- [ ] Parent melihat pesan notifikasi realtime dan unread count berkurang setelah dibaca.
- [ ] Tidak ada kolom balasan pada percakapan notifikasi.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Perbarui tipe di `lib/chat.ts` mengikuti kontrak chat baru. Perbarui `kelolakelas-docs/docs/components/web.md`.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx`
- `kelolakelas-web/lib/chat.ts`

## Edge Cases

- Parent dengan notifikasi dari beberapa tenant.
- Pesan sistem panjang.

## Testing / Validation

- [ ] Vitest untuk render pesan sistem dan jenis tak dikenal.
- [ ] Test, lint, type check, dan production build lulus.

## Out of Scope

- Pusat notifikasi terpisah dari chat.
- Push notification browser.

## AI Orchestrator Contract

```json
{
  "draftKey": "web-system-notification-render",
  "projectKey": "parent-schedule-notifications",
  "title": "Inbox parent menampilkan percakapan notifikasi sistem dengan jelas",
  "type": "Feature",
  "priority": "Medium",
  "estimate": "S",
  "complexity": "low",
  "labels": [
    "web",
    "ai-ready"
  ],
  "repositories": [
    "web"
  ],
  "blockedByDraftKeys": [
    "chat-system-notification-channel"
  ],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "`ChatInbox.tsx` hanya mengenal pesan parent dan member; tidak ada tampilan pesan sistem.",
    "goal": "Parent dapat membedakan percakapan notifikasi dari tenant dan membaca pesannya tanpa kolom balasan.",
    "requirements": [
      "Percakapan notifikasi diberi label tenant dan ikon yang berbeda serta muncul di inbox dengan unread count.",
      "Pesan sistem dirender dengan gaya berbeda dan tanpa input balasan.",
      "Jenis percakapan atau sender yang tidak dikenal tidak membuat inbox error."
    ],
    "acceptanceCriteria": [
      "Parent melihat pesan notifikasi realtime dan unread count berkurang setelah dibaca.",
      "Tidak ada kolom balasan pada percakapan notifikasi.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Perbarui tipe di `lib/chat.ts` mengikuti kontrak chat baru. Perbarui `kelolakelas-docs/docs/components/web.md`.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx",
      "kelolakelas-web/lib/chat.ts"
    ],
    "edgeCases": [
      "Parent dengan notifikasi dari beberapa tenant.",
      "Pesan sistem panjang."
    ],
    "testingValidation": [
      "Vitest untuk render pesan sistem dan jenis tak dikenal.",
      "Test, lint, type check, dan production build lulus."
    ],
    "outOfScope": [
      "Pusat notifikasi terpisah dari chat.",
      "Push notification browser."
    ]
  }
}
```
