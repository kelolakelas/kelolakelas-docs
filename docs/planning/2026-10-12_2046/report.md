# QA consolidation — 2026-10-12

## Ringkasan eksekutif

Owner-approved Phase C selesai: 3 Project, 10 issue Backlog dibuat. 7 issue ai-ready; 3 membutuhkan keputusan owner, tanpa ai-ready. Tidak ada source code, PR, commit, process kill atau perubahan autopilot. Runtime berasal dari lane QA; consolidator membaca root cause origin/main, bukan mengulang semua UI. Detail coverage/evidence ada discovery.md dan evidence-*.txt; sumber lane .kel-qa/run-20261012/findings/L1.md … L5.md.

## 1. Coverage

| Domain | Hasil |
|---|---|
| Auth/members/roles | 1 policy gap, decision required; writes tetap 403 |
| Catalog/schedule/vouchers | kategori feature baru; 2 unconfirmed; overlap/expired voucher intentional |
| Parent commerce | tidak ada bug baru; invoice sandbox bukan paid callback |
| Teaching/chat | tanggal sesi dan report identity bugs; private teacher assignment decision |
| Platform/security | 3 regression bugs, baseline headers decision |

## 2. Projects

P-KEL-32: QA: pemulihan alur platform admin (KEL-180–182).
P-KEL-33: QA: sesi dan identitas laporan pengajaran (KEL-183–184,186).
P-KEL-34: QA: pemeliharaan kategori tenant (KEL-188–189).
KEL-185 dan KEL-187 standalone sesuai policy boundaries. Deskripsi lengkap: projects/*.md.

## 3. Status pengiriman

| draftKey | Linear | Priority | ai-ready |
|---|---|---|---|
| platform-totp-enrollment-version | KEL-180 | Medium | yes |
| creator-decision-assignment-column | KEL-181 | Medium | yes |
| platform-zero-tenant-scope | KEL-182 | Medium | yes |
| session-calendar-timestamp-label | KEL-183 | Medium | yes |
| report-list-enrollment-identities | KEL-184 | Medium | yes |
| tenant-read-permission-policy | KEL-185 | High | no |
| private-teacher-assignment-policy | KEL-186 | Medium | no |
| web-security-header-policy | KEL-187 | Low | no |
| category-update-api | KEL-188 | Medium | yes |
| category-maintenance-ui | KEL-189 | Medium | yes |

6 Bug labels checked on KEL-180–185; KEL-187 Improvement; KEL-186/188/189 Feature. Contract types tetap Improvement/Feature. All get_issue descriptions reviewed, no dotted identifier HTTP autolink found. byte-equivalent contract readback sebelum label Bug: verify-readback.py RESULT PASS (10 issues, 3 Projects). Rerun original sesudah Bug menghasilkan FAIL (6) karena verifier hanya menerima repo+type; scratch qa-postverify.py menambahkan ekspektasi tepat Bug untuk enam issue, semua pemeriksaan contract/title/project/blockers tetap sama: RESULT PASS. Tidak mengubah skill verifier. git diff --check sukses. Native blockers sesuai payload. linear-sync.json memuat URL dan labels hasil provider readback.

## 4. Urutan eksekusi

KEL-180 → KEL-181 → KEL-182; KEL-183 dan KEL-184 independent; KEL-188 → KEL-189. KEL-186 menunggu KEL-184 serta owner. KEL-185/187 menunggu owner. Autopilot discovery tetap memilih satu per satu berdasarkan ranking live, bukan urutan statis laporan.

Post-write discovery: ai_ready 157 →164, contracts_valid 156 →163 (+7); new seven excluded hanya `diubah < 15 menit lalu`. Kontrak lainnya memiliki invalid lama yang tidak berubah; tidak mengklaim 164 valid. Winner saat ini None karena foreign-write cooldown; child A akan menunggu 15 menit kemudian discovery ulang. Initial relative disc-after path gagal ENOENT dari audit cwd; rerun absolute path sukses. Pemeriksaan concurrent writer sempat berhenti; full get_issue diff membuktikan hanya relatedTo backlink ke issue yang baru dibuat sendiri (misalnya KEL-105 → KEL-180), bukan foreign policy/state change. Guard hanya menerima exact self-backlink, semua perubahan lain tetap fail-closed.

## 5. Temuan tidak dikirim

Duplicates open: tidak ada temuan terkonfirmasi yang ditutup issue open. KEL-167 scope >1000 enrollment picker tidak mencakup report-list identities. Private teacher gaps L2 dan L4 dikonsolidasi menjadi satu KEL-186.

Unconfirmed (2): L2-01 empty required wizard submit dan L2-06 negative fixed voucher. Source memiliki required/min native constraints, errorFor dan banner render; tidak ada POST bukan bukti API swallowed. Perlu DOM validity/validationMessage probe sebelum filing.

Documented intentional/deferrals: L2-03 overlap advisory memang nonblocking (KEL-176); L2-07 past voucher boleh dibuat/reactivated tetapi tidak redeem (KEL-161); L2-04 close/archive/delete class excluded KEL-31/32; group tutor picker excluded KEL-50. Tidak dibuat ulang sebagai bug.

Not covered: reset-password happy path/reuse/expiry (no inbox access), invitation revoke/existing-account acceptance, removed-member token akibat harness misclick, full anonymous route sweep, real provider payment completion/callback/paid activation/cancel refusal/funded withdrawal, voucher delete with usage>0, comprehensive chat ordering/unread, populated finance/withdrawal cross-tenant detail, platform funded withdrawal decisions, full production security headers/edge topology, per-user/IP rate-limit independence. Tidak memalsukan payment, balance, activation, atau production evidence. Stack dan data QA lane dibiarkan sebagaimana handoff sumber.

## Keputusan owner

1. KEL-185 read permission: (1) require matching read permission, own membership bootstrap tetap terbuka — rekomendasi; (2) semua active member boleh baca dengan nav konsisten. Owner memilih sebelum implementasi; perlu tetapkan scope tenant settings/GetMember.
2. KEL-186 teacher assignment: (1) optional teacher saat approval + tenant assignment kemudian — rekomendasi kompatibilitas; (2) wajib teacher sebelum approval/payment. Group picker tetap deferral terpisah.
3. KEL-187 headers: (1) app nosniff/Referrer-Policy/frame-denial + CSP inventory/report-only dahulu — rekomendasi; (2) edge-owned policy dengan observable deployment evidence. CSP enforce/HSTS belum diputuskan.

## 6. Payload

Satu sumber payload: backlog.yaml (kelolakelas.planning-backlog/v1), validator asli sukses 3 Projects/10 issues. Rendered descriptions dan contracts: backlog.md, issues/*.md, projects/*.md. Label ai-ready dalam contract menunjukkan rencana setelah keputusan; actual Linear KEL-185/186/187 tidak ai-ready dan Technical Notes melarang eksekusi sebelum revisi keputusan/contract. No extra approval round: owner request di task adalah explicit Phase C approval.
