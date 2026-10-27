# Discovery — Testing 25 Oktober 2026

## Baseline dan batasan

MODE incremental; FOKUS enam catatan manual testing pengguna pada 25 Oktober 2026, menggantikan contoh requests lama di LINEAR_PLANNING_PROMPT.md. MAKS_ISSUE 8. Run dibuat melalui planning.mjs init; baseline.json tidak diedit. Previous run 2026-10-24_0821, cutoff Linear 2026-10-24T01:21:51.531Z. Discovery/backlog sebelumnya dibaca sebagai konteks, lalu overlap diverifikasi kembali.

Fetch awal gagal DNS dalam sandbox; retry dengan akses network berhasil untuk ketujuh repository. Semua repository bersih pada main di-pull --ff-only dan sudah up to date. Web tidak di-pull karena perubahan lokal AGENTS.md; setelah fetch, main...origin/main = 0/0 sehingga kode sama dengan remote. Perubahan lokal dipertahankan. Tidak mengubah branch/source, membaca .env, menyalin kredensial, menjalankan test, atau melakukan mutasi Linear.

| Repository | Range sejak previous baseline | Inspeksi |
| --- | --- | --- |
| web | 0b9a020d5a3c..53fafa7342e2 | perubahan dan jalur relevan |
| api-gateway | 622e61d835e8..622e61d835e8 | range kosong; kontrak invitation/session/editor/chat relevan |
| identity | 48b082f62d8c..48b082f62d8c | range kosong; invitation/membership/auth relevan |
| academic | 4269a57d2116..5570b7bff297 | timeout billing berubah; lifecycle dan proyeksi enrollment relevan |
| billing | 7fd099d44f62..7fd099d44f62 | range kosong; callback/reconciliation/expiry relevan |
| chat | 4a3f9d6b6bdf..4a3f9d6b6bdf | range kosong; visibility/pagination/internal writers relevan |
| docs | abed15afd0d6..30f19fe462db | README, executive summary, risks dan dokumen terkait |

Discovery paralel oleh delapan subagent, satu per tujuh repository dan satu Linear, dalam batch sesuai batas tiga worker bersamaan. Tidak mengaudit repository retired orchestrator. Lampiran catatan manual testing dibaca seluruhnya. URL localhost:3000/dashboard/tenant/enrollments dipetakan ke source; browser/runtime/database/provider tidak diakses. Penyebab runtime aktivasi dan disappearance serta besaran latensi tetap Unknown. Audit UI/UX visual seluruh halaman belum dilakukan: itu outcome issue, bukan klaim hasil discovery statis.

## Coverage dan temuan

Path pendek berikut relatif terhadap repository yang disebut. Referensi lengkap ada pada draft issue.

| Area | Status current state | Bukti | Gap/peluang | Catatan duplikasi |
| --- | --- | --- | --- | --- |
| Membership multi-tenant | Implemented schema; Not found selection | identity migrations/00000000000000_init_schema.up.sql:33; internal/usecase/auth_usecase.go:164; internal/repository/user_repository.go:209 | Membership unik tenant/user; login memilih First tanpa pilihan tenant. Perlu sesi aktif berdasarkan membership milik user, termasuk UX dan cache reset | KEL-35 Done hanya registrasi baru; tidak ada issue aktif |
| Undangan existing Teacher | Implemented restriction | identity internal/usecase/invitation_usecase.go:54; internal/repository/user_repository.go:267; internal/usecase/invitation_lifecycle_test.go:120 | Create dan acceptance sama-sama menolak email existing; perlu authenticated acceptance tanpa akun/password/wallet baru | KEL-35/82/84 Done tidak mencakup acceptance existing |
| Editor kelas | Implemented exhaustive reads; bottleneck Inferred | web app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts:729; _components/ClassConfigurationEditor.tsx:93,478; api-gateway internal/delivery/http/router.go:183,206 | Semua halaman kelas/jadwal/kategori diambil lalu difilter; repeated teacher lookup. Tidak ada protected class-detail GET di gateway. Ukur dan optimalkan selected-class reads tanpa kehilangan freshness/permission | KEL-198/211 Done bukan optimisasi performa |
| Chat admin | Implemented persistence/paging/visibility; runtime Unknown | chat internal/postgres/store.go:36,54; internal/chat/chat.go:96,230; web app/(dashboard)/dashboard/parent/chat/_components/ChatInbox.tsx:175 | Poll mengganti first100; error permission dapat menjadi list200 kosong. Investigasi list/direct GET/persisted rows dan upstream failure; jangan mempertahankan room yang izinnya dicabut | KEL-123/202/217 Done; badge paginated tidak memperbaiki inbox |
| Paid private activation | Implemented durable activation; runtime Unknown | billing internal/usecase/transaction_usecase.go:854,908,970; internal/usecase/reconciliation_worker.go:156; academic internal/usecase/enrollment_usecase.go:457 | Trace affected request→invoice→verified callback→job→academic→UI. Recovery existing, bukan membuat rekonsiliasi baru | KEL-8/29/215 Done; regresi hasil pembayaran berbeda dari approval |
| Jadwal private pada enrollment | Implemented ownership link; projection gap Inferred kuat | academic internal/usecase/private_schedule_request_usecase.go:187; internal/repository/enrollment_repository.go:215; internal/usecase/enrollment_usecase.go:738; web enrollments/_queries/queries.ts:170; _lib/schema.ts:268,411 | Private memakai schedule.EnrollmentID, bukan enrollment.ScheduleID; response singular dan join web first100 menghilangkan semua slot private. Perlu additive collection dan UI | KEL-70 Done sengaja group-only; KEL-33 layar existing |
| Lifecycle chat otomatis | Not found; manual system link Implemented | academic internal/usecase/private_schedule_request_usecase.go:31,333,361; internal/usecase/private_payment_link.go:30; chat internal/chat/payment_link.go:70 | Request/approval/rejection belum otomatis chat; link manual system tidak menampilkan deadline. Perlu durable event dengan sender parent/admin terverifikasi, link/expiry authoritative dan retry | KEL-124/129 manual, KEL-128 email; bukan duplikat |
| UI/UX semua page | Implemented 34 routes; visual quality Unknown | rg --files web/app -g page.tsx; tenant/creator-requests/page.tsx:4 redirect | 33 surfaces + 1 redirect: public4/auth5/parent6/tenant14/platform5 termasuk redirect. Audit persona/state/viewport, fix temuan web terbatas, catat follow-up besar | Jangan ulang KEL-202/210/219/220 Done |

Dokumentasi terkait: docs/flows/authentication.md:83 menegaskan belum ada tenant selection; docs/components/web.md:136 mendokumentasikan exhaustive editor dan :252 batas group-only KEL-70; ADR0076 mempertahankan first-page inbox; ADR0063 membatasi manual system link; docs/flows/payment-callback.md:114 mendokumentasikan retry/re-drive; ADR0072 preseden outbox sesi, bukan lifecycle request. Prose lama executive summary dan chat component bukan bukti capability hilang: kode authoritative. Pembaruan current-state docs menjadi bagian issue saat implementasinya terverifikasi.

## Linear dan duplikasi

Team KEL / KelolaKelas. Seluruh 33 project terambil, hasNextPage=false. Issue aktif seluruh state: Backlog4 (KEL-100/101/102/104, konfigurasi platform), unstarted0, started0, triage0; completed sejak cutoff19, canceled0. Semua pagination selesai. Focused list_issues query dan get_issue dengan relations untuk KEL-35/198/211/123/124/129/8/29/70/33 mengonfirmasi overlap Done; tambahan KEL-82/84/128/202/215–220 diverifikasi dari listing terfokus. Tidak ada duplikat aktif atau blocker existing relevan. get_agent_context gagal tool-not-found, tetapi listing/search/detail Linear tersedia. Tidak ada klaim baru tentang CI/merge/runtime dari status Done.

Reuse P-KEL-17/7/23/22, tanpa project baru atau perubahan project existing. Audit lintas persona standalone agar tidak memperluas scope project khusus parent/admin. Historical Done dapat dihubungkan native relatedTo setelah persetujuan; satu dependency baru adalah tenant-membership-selection → existing-teacher-invitations.

## Kandidat

| Kandidat | Asal | Type | Dampak | Urgensi | Effort | Complexity / alasan | Confidence | Dependency | Keputusan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| restore-private-paid-activation | request4 | Improvement (bugfix) | Pembayaran menjadi akses belajar | High | M | high: settlement/retry/activation lintas service | laporan tinggi; root cause Unknown | — | draft |
| private-enrollment-schedule-summary | request4 | Improvement | Jadwal disepakati terbaca admin | High | M | medium: kompatibilitas proyeksi plural dan ownership | tinggi statis | — | draft |
| restore-admin-chat-conversations | request3 | Improvement (bugfix) | Admin tidak kehilangan komunikasi | High | M | medium: paging, permission outage, request races | laporan tinggi; root cause Unknown | — | draft |
| tenant-membership-selection | request1 foundation | Feature | Teacher benar-benar dapat bekerja lintas tenant | High | L | high: claims, live membership, sesi/cache/WS | tinggi statis | — | draft |
| existing-teacher-invitations | request1 | Feature | Undang Teacher existing tanpa akun duplikat | High | M | high: authenticated acceptance dan race account/membership | tinggi statis | tenant-membership-selection | draft |
| automatic-private-request-chat | request5 | Feature | Request/keputusan sampai ke kedua pihak | High | L | high: durable delivery, actor attribution, invoice expiry | tinggi statis | — | draft |
| class-editor-load-performance | request2 | Improvement | Edit/reload lebih cepat dan praktis | Medium | M | medium: scoped reads dan fresh snapshot lintas lapisan | tinggi fan-out; timing Unknown | — | draft |
| cross-role-ux-audit | request6 | Improvement | UX semua persona dievaluasi dan temuan prioritas diperbaiki | Medium | L | medium: cakupan page/state/viewport luas, perubahan terbatas | coverage tinggi; defect visual Unknown | — | draft |

## Status permintaan feature

| Request | Status | Bukti / batasan | draftKey |
| --- | --- | --- | --- |
| Invite existing Teacher tenant lain | didraft | schema mendukung; create/accept dan selection belum mendukung | tenant-membership-selection, existing-teacher-invitations |
| Edit class/reload lambat | didraft | exhaustive reads dan repeated teacher lookup; perlu benchmark | class-editor-load-performance |
| Chat room hilang sisi admin | didraft | dua kandidat diagnosis, belum reproduksi | restore-admin-chat-conversations |
| Pembayaran private diterima tetapi belum aktif; jadwal tidak tampil | didraft | aktivasi existing perlu trace; proyeksi jadwal gap konkret | restore-private-paid-activation, private-enrollment-schedule-summary |
| Chat otomatis request/approve/reject dengan link dan deadline | didraft | hanya manual system link existing | automatic-private-request-chat |
| Pelajari UI/UX semua page dan improve | didraft | audit 33 surfaces + redirect; perbaikan web berdasarkan bukti | cross-role-ux-audit |

Tidak ada request ditolak atau ditunda. Split chat request/decision dipertimbangkan tetapi digabung sebagai satu lifecycle slice agar foundation multi-tenant tetap masuk batas8; pecah implementasi dalam commit/PR koheren tanpa menggandakan fondasi event. Kandidat audit lanjutan/redesign/data repair/provider baru ditunda sampai ada bukti; jangan menambah issue spekulatif atau migrasi data otomatis.
