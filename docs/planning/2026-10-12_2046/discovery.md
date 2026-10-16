# Discovery QA 2026-10-12

Mode full untuk permintaan temuan L1–L5; MAKS_ISSUE diangkat. Baseline dari planning init tidak diedit. Root gateway/identity/academic/billing/chat/docs fetch + ff-only pull; web fetch saja karena AGENTS.md pre-existing modified. Docs pre-existing untracked planning folder tidak disentuh. Semua HEAD sama dengan origin/main; evidence-*.txt dibaca dari git show origin/main. Tidak ada replay authenticated oleh consolidator; runtime lane adalah self-report yang diperiksa terhadap root cause kode. Tidak membaca accounts atau secrets.

Inventory awal: 179 issue total, 157 ai-ready, 6 backlog ai-ready, 0 eligible. linear-issues.json berasal dari satu list_issues includeArchived 250. inventory/ menyimpan dossier dan get_issue lengkap untuk non-ai-ready dan setiap matching hit yang dipakai (termasuk Done). Tidak ada issue open yang menutup temuan didraft. KEL-167 hanya >1000 enrollment chooser, bukan report identity. KEL-155 notifications terpisah.

| Area/request | Current state | Evidence | Keputusan |
|---|---|---|---|
| L1-01 tenant reads | Implemented: tenant context only, writes guard | identity member_handler.go:82-136, role_handler.go:122-144 | tenant-read-permission-policy; High intra-tenant disclosure, owner decision |
| L2-01 empty wizard submit | Required native fields + state.errors/message render sudah ada | CategoryForm.tsx:99,112-136; wizard memakai ClassForm | Unconfirmed; snapshot tidak merekam native browser validation; root cause lane bertentangan kode |
| L2-03 overlap persistence | Advisory intentionally nonblocking | get_issue KEL-176 Goal/Requirements/Technical Notes; ScheduleForm.tsx:250,615 | documented deferral; tidak dibuat |
| L2-06 negative fixed voucher | Native min=0, controlled input, errorFor(discount_value) dan banner ada | VoucherForm.tsx:46-74,77,83-94,141-155; schema fixed_amount >0 | Unconfirmed; lane tidak ada gateway POST dan root cause missing error branch salah; native validation bukan API swallow |
| L2-07 expired voucher | Reactivation expired explicitly allowed, redemption checks window | billing domain/voucher.go:93-96,114-116; KEL-161 edge case | documented intentional state; tidak mengubah money/date policy tanpa keputusan |
| L2-02 category edit/delete | Not found update API/UI; DELETE existing scoped | category_usecase.go:20-24,52-72; cmd/server/routes.go:49-51; gateway category routes | category-update-api → category-maintenance-ui |
| L2-04 close/delete/archive class | Not found UI; UpdateClassRequest tidak enrollment_status | domain/class.go:71-77; KEL-31/32 Out of Scope | documented deferral, tidak dibuat sesuai card rules |
| L2-05 group tutor picker | Not found; excluded KEL-50 | ScheduleForm; KEL-50 Out of Scope | documented deferral; private gap merged into L4-F01 |
| L3 commerce | Exercised lanes pass, callbacks not claimed | findings/L3.md; KEL-178/KEL-179 | tidak ada baru |
| L4-01 session date | Implemented consumer only date-only | sessions/_lib/schema.ts:809-814 vs academic time.Time | session-calendar-timestamp-label |
| L4-02 report identity | Implemented report preload Enrollment only | report_repository.go:26,33,76, web reports schema:423-454 | report-list-enrollment-identities |
| L4-F01 private tutor | Not found TutorID on approved schedule | private_schedule_request_usecase.go:178; gateway approve proxy existing | private-teacher-assignment-policy, owner decision |
| L5-01 first TOTP | Inferred cause confirms runtime failure: model mutates before return version+1 | platform_factor.go:175-178; lane GORM DryRun | platform-totp-enrollment-version |
| L5-02 platform scope | Implemented !tenant_id contradicts legitimate zero UUID claim | lib/creator-requests.ts:19; jwt.go:20,87-93 | platform-zero-tenant-scope |
| L5-03 Creator decision | Implemented SELECT nonexistent id | creator_decision_repository.go:32; migration 000002 user_id PK | creator-decision-assignment-column |
| L5-04 headers | Not found app headers, production edge Unknown | next.config.ts:3-5; localhost lane responses | web-security-header-policy, owner decision |

Repo-set tracing: setiap issue mencantumkan hop web → gateway router.go → handler/store. Hops transparent/read-only tidak menjadi repo label. Category PATCH baru memerlukan academic + gateway dan permission migration identity; UI terpisah bergantung backend. TOTP/Creator SQL hanya identity. Platform guard/session format hanya web. Report identity hanya academic. Private assignment web+academic memakai GET /tutors dan gRPC membership existing (identity read-only). Read policy identity+web, gateway transparent. Headers hanya direct web.

Prioritas mengikuti README QA: disclosure L1 High; functional flow failures Medium; headers Low tanpa exploit. Complexity auth/data protected ≥high; session formatting medium. Platform issues chained to menghindari flow collision; category backend sebelum UI; private assignment setelah report repository work dalam domain teaching. Tidak ada implementation/code/PR/commit dan autopilot tidak diubah.
