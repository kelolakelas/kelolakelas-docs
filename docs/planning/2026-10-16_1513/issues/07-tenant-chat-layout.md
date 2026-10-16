## Background / Problem

Testing 16 Oktober 2026: Styling tenant chat perlu dirapikan. Tenant memakai shared parent ChatInbox dengan dua kolom, panel dasar dan overflow/composer sederhana; belum ada screenshot.

## Goal

Percakapan tenant rapi, responsive dan nyaman dibaca.

## Requirements

- Selaraskan conversation list/header/messages/composer/ReportChatStarter dengan komponen dashboard existing.
- Rapikan tinggi, scroll containment, spacing dan responsive stacking tanpa horizontal overflow.
- Tangani visual loading/empty/error/reconnect dan keyboard/focus/kontras.
- Pertahankan send/retry, unread, load older, deep links, realtime/fallback dan notification-only; periksa parent karena shared component.

## Acceptance Criteria

- [ ] Mobile/desktop rapi dan pesan panjang tidak membuat composer tak terjangkau.
- [ ] List/messages/composer tidak overflow horizontal; state kosong/error usable.
- [ ] Flow tenant-parent existing tetap berjalan dan keyboard/focus/kontras memadai.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Bukti tenant/chat/page.tsx:6/:34 dan parent/chat/_components/ChatInbox.tsx:192-203. Ikuti desain dashboard existing; laporan pengguna adalah bukti kebutuhan, bukan temuan visual yang sudah direproduksi. Scope web-only.

Relevant areas:

- `kelolakelas-web/app/(dashboard)/dashboard/tenant/chat/page.tsx`
- `kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx`

## Edge Cases

- Pesan panjang, banyak conversation, layar kecil dan keyboard mobile.
- Realtime putus saat send, retry, notification-only.

## Testing / Validation

- [ ] Visual mobile/desktop, long messages, empty/error/reconnect serta keyboard navigation.
- [ ] Regresi ChatInbox dan manual tenant-parent send/receive/retry/deep-link/unread/load older.
- [ ] Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.
- [ ] Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan.

## Out of Scope

- Attachments, perubahan transport/API dan redesign dashboard.

## AI Orchestrator Contract

```json
{
  "draftKey": "tenant-chat-layout",
  "projectKey": null,
  "title": "Rapikan layout dan styling halaman chat tenant",
  "type": "Improvement",
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
  "blockedByDraftKeys": [],
  "externalDependencies": [],
  "body": {
    "backgroundProblem": "Testing 16 Oktober 2026: Styling tenant chat perlu dirapikan. Tenant memakai shared parent ChatInbox dengan dua kolom, panel dasar dan overflow/composer sederhana; belum ada screenshot.",
    "goal": "Percakapan tenant rapi, responsive dan nyaman dibaca.",
    "requirements": [
      "Selaraskan conversation list/header/messages/composer/ReportChatStarter dengan komponen dashboard existing.",
      "Rapikan tinggi, scroll containment, spacing dan responsive stacking tanpa horizontal overflow.",
      "Tangani visual loading/empty/error/reconnect dan keyboard/focus/kontras.",
      "Pertahankan send/retry, unread, load older, deep links, realtime/fallback dan notification-only; periksa parent karena shared component."
    ],
    "acceptanceCriteria": [
      "Mobile/desktop rapi dan pesan panjang tidak membuat composer tak terjangkau.",
      "List/messages/composer tidak overflow horizontal; state kosong/error usable.",
      "Flow tenant-parent existing tetap berjalan dan keyboard/focus/kontras memadai.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Bukti tenant/chat/page.tsx:6/:34 dan parent/chat/_components/ChatInbox.tsx:192-203. Ikuti desain dashboard existing; laporan pengguna adalah bukti kebutuhan, bukan temuan visual yang sudah direproduksi. Scope web-only.",
    "relevantAreas": [
      "kelolakelas-web/app/(dashboard)/dashboard/tenant/chat/page.tsx",
      "kelolakelas-web/app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx"
    ],
    "edgeCases": [
      "Pesan panjang, banyak conversation, layar kecil dan keyboard mobile.",
      "Realtime putus saat send, retry, notification-only."
    ],
    "testingValidation": [
      "Visual mobile/desktop, long messages, empty/error/reconnect serta keyboard navigation.",
      "Regresi ChatInbox dan manual tenant-parent send/receive/retry/deep-link/unread/load older.",
      "Jalankan formatter, lint, type check dan test relevan; GitHub CI PR wajib lulus sebelum merge.",
      "Verifikasi acceptance criteria serta perbarui docs current-state dan evidence index sesuai perubahan."
    ],
    "outOfScope": [
      "Attachments, perubahan transport/API dan redesign dashboard."
    ]
  }
}
```
