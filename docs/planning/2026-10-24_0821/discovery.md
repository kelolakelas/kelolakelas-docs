# Discovery — Testing 24 Oktober 2026

## Baseline dan batasan

MODE incremental; FOKUS enam temuan testing pengguna terbaru, menggantikan requests historis/contoh di prompt. MAKS_ISSUE 8; enam kandidat diterima. Repositori main awal bersih. Fetch awal gagal DNS di sandbox; retry network escalation berhasil, git fetch origin lalu git pull --ff-only pada tujuh repository semuanya Already up to date. Tidak ada perubahan branch/source. Baseline dibuat dengan planning.mjs init dan tidak diedit. Previous run 2026-10-16_1513; cutoff Linear 2026-10-16T08:13:01.889Z.

| Repository | Range | Status |
| --- | --- | --- |
| kelolakelas-web | `2c4bfe214bba..0b9a020d5a3c` | main, clean |
| kelolakelas-api-gateway | `622e61d835e8..622e61d835e8` | main, clean |
| kelolakelas-identity-service | `b03a6140eb03..48b082f62d8c` | main, clean |
| kelolakelas-academic-service | `c1ea23e81e54..4269a57d2116` | main, clean |
| kelolakelas-billing-service | `2b2344c7d7a7..7fd099d44f62` | main, clean |
| kelolakelas-chat-service | `4a3f9d6b6bdf..4a3f9d6b6bdf` | main, clean |
| kelolakelas-docs | `844f34b16dfa..abed15afd0d6` | main, clean |

Previous discovery/backlog dibaca sebagai konteks historis; schema/contracts/ai-ready lama tidak diikuti dan tidak dimigrasikan. Orchestrator tidak diaudit/dibaca/dijalankan. Identity range berubah tetapi dilewati dari source discovery: tidak ada bukti kebutuhan perubahan identity untuk enam temuan, permission existing cukup dicatat. Discovery paralel oleh subagent web, academic, billing, chat, gateway, docs dan Linear, dibatasi area relevan.

Lampiran: catatan testing lengkap dan dua URL kelas/URL schedule-requests dibaca dari pesan; localhost URL dipetakan ke source, tidak direproduksi browser. Fixture lokal .local/db-reset-20261024-073936/fixture-ids.json diperiksa hanya untuk dua UUID laporan tanpa menyalin data; tidak ada kecocokan. Karena itu tipe/eligibility kelas runtime dan akar dua kegagalan Unknown. Tidak membaca .env atau kredensial. Tidak menjalankan test/runtime acceptance pada run planning ini.

## Coverage dan temuan

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Chat navigation | Implemented unread inbox; Not found global badge | web ParentNav.tsx:33, TenantSidebar.tsx:155, lib/chat-actions.ts:33; chat internal/postgres/store.go:66 | Agregasi unread messages lintas halaman, outside-inbox refresh dan read/reconnect reconciliation | KEL-123/202 Done, notifikasi di luar halaman chat belum dicakup |
| Private approval | Implemented; runtime root cause Unknown | academic internal/usecase/private_schedule_request_usecase.go:97/:205/:225; web schedule-requests/_actions/actions.ts:90 | Reproduksi, minimal owner fix, safe retry dan bukti payment/persistence | KEL-108/110/133 Done, regresi baru |
| Parent checkout | Implemented; runtime root cause/class type Unknown | web public kelas _actions/actions.ts:52; academic internal/usecase/enrollment_usecase.go:173; billing pkg/duitku/client.go:85 | Diagnosis full flow; retain choices, ownership, invoice idempotency | KEL-194 Done hanya input retention; provider404 historis bukan evidence Oct24 |
| Date fields | Implemented native date; Not found shared requested UX | StudentForm.tsx:94; ReportFilterBar.tsx:113; TransactionFilterBar.tsx:120; RescheduleDialog.tsx:143; ClassConfigurationEditor.tsx:386; AssignTeacherForm.tsx:39; VoucherDateTimeField.tsx:62 | Shared day→month→year dan direct year picker; migrasi inventory | KEL-175/201 Done constraints dipertahankan; KEL-210 hanya jam |
| Public private weekday | Implemented separate inline controls; visual cause Inferred | public ScheduleRequestForm.tsx:195; tenant schedule-field-styles.ts:5 | Reuse form-control styling, visual/accessibility acceptance | KEL-200/210 Done hanya tenant schedules |
| Pending admin nav | Implemented permission-gated entry/list; Not found badge | tenant constants.ts:22, sidebar:155; academic private_schedule_request_repository.go:164 | Filter pending current tenant; list cap100 cukup untuk display99+ | KEL-110 Done tanpa badge |
| Gateway | Implemented existing proxies | internal/delivery/http/router.go:232/:235/:237/:287 | Diagnostic hop, tidak mewajibkan API baru | Range kosong; kontrak existing cukup |
| Docs | Implemented context; beberapa prose adjacent stale | docs/api/academic.md:81/:91; api/chat.md:16; components/web.md:199/:321/:337; ADR0046/0065/0071 | Update docs sesuai owner fix dan UX yang dibuktikan | Resend pending prose lama bukan blocker badge; redirect lama dibatasi channel terbaru |

Path web pada tabel disingkat untuk keterbacaan; path lengkap tercantum di issues/*.md. Source code authoritative dibanding prose docs historis. Tidak menyimpulkan penyebab bug dari konfigurasi yang belum diverifikasi.

## Linear dan duplikasi

Semua 33 project terambil (hasNextPage=false). Seluruh status aktif: Backlog4 (KEL-100/101/102/104 konfigurasi platform), Todo0, In Progress0, In Review0. Done sejak cutoff26; Canceled/Duplicate0; seluruh pagination selesai. Keyword overlap ditelusuri dan get_issue hanya untuk issue terkait. Semua overlap relevan Done; tidak ada duplikat aktif atau blocker terbuka. Shared field notes unavailable: get_agent_context gagal internal lalu retry tool-not-found; source/docs/Linear listing tetap tersedia. Reuse P-KEL-22/23/24/9, tanpa project baru/overwrite. Native relatedTo dipakai untuk historical work, tanpa blockedBy spekulatif.

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity / alasan | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| restore-private-approval | request2 | Improvement (bugfix) | Pulihkan penjualan private | High | M | high: commit-before-billing dan financial replay | High laporan; root cause Unknown | — | draft |
| restore-parent-checkout | request3 | Improvement (bugfix) | Pulihkan pembayaran parent | High | M | high: invoice/seat/idempotency | High laporan; root cause Unknown | — | draft |
| chat-unread-navigation-badge | request1 | Improvement | Pesan tidak terlewat | Medium | M | medium: pagination dan realtime/read races | High static gap | — | draft |
| pending-schedule-request-navigation-badge | request6 | Improvement | Antrean admin terlihat | Medium | M | medium: permission/cache/refresh | High static gap | — | draft |
| shared-date-input-ux | request4 | Improvement | Semua form lebih mudah diisi | Medium | L | medium: focus/browser/serialization; effort independen | High native input gap; runtime browser Unknown | — | draft |
| private-slot-control-styles | request5 | Improvement | Konsistensi kontrol jadwal | Medium | S | low: reusable styles dan visual regression | High separate markup; visual cause Inferred | — | draft |

## Status permintaan

| Request | Status | Bukti | draftKey |
| --- | --- | --- | --- |
| Chat badge1–99/99+ | didraft | nav tanpa badge, unread API tersedia | chat-unread-navigation-badge |
| Approval schedule request selalu gagal | didraft | existing approval flow + laporan pengguna | restore-private-approval |
| Lanjut ke pembayaran gagal | didraft | existing checkout + URL laporan | restore-parent-checkout |
| Semua tanggal auto-advance dan year picker | didraft | native date inventory | shared-date-input-ux |
| Style hari slot yang diajukan | didraft | public form berbeda dari shared tenant styles | private-slot-control-styles |
| Badge pending Schedule Requests admin | didraft | permission-gated nav tanpa count | pending-schedule-request-navigation-badge |

Tidak ada kandidat ditunda atau request dilewati. Redesign payment/chat, global design-system rewrite, provider baru, data reset dan perubahan identity ditolak sebagai perluasan tanpa evidence. Tidak mengubah current-state docs untuk perilaku yang belum diimplementasikan.
