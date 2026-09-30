# Discovery 2026-09-28_0940 — chat service

Mode: incremental (previousRun `2026-09-28_0509`). Fokus: permintaan owner "chat tenant–parent". Owner memutuskan chat menjadi service dan repo baru `kelolakelas-chat-service` (clarify 2026-09-28). Discovery bersifat read-only terhadap semua repo dan Linear.

## Keputusan owner (clarify, verbatim diringkas)
1. Kontrak repo: pengecualian **diizinkan**. `chat` ditambahkan ke `repositoryNames` di `kelolakelas-ai-orchestrator/src/intake/planning-contract.ts` lewat PR sendiri, lalu tooling planning dan autopilot disinkronkan. Pekerjaan ini dilakukan operator.
2. Peserta chat:
   - parent ↔ admin tenant, saat mengajukan jadwal private;
   - pengajar ↔ admin tenant;
   - pengajar ↔ parent, terkait report student.
3. Realtime: WebSocket sejak awal.
4. Repo `kelolakelas-chat-service` public dan dibuat operator sebelum issue diberi `ai-ready`.

## Current state (origin/main per 2026-09-28 04:01Z)

| Area | Fakta | Bukti |
| --- | --- | --- |
| Chat | Tidak ada kode chat, WebSocket, SSE, atau notifikasi di repo mana pun. Linear tim KelolaKelas (termasuk arsip) tidak berisi issue/project chat, websocket, atau percakapan. | grep 6 repo; `list_issues`/`list_projects` query chat/pesan/websocket/percakapan |
| Kontrak | `repositoryNames` = web, api-gateway, academic, identity, billing. `chat` ditolak validator (6 error `received: 'chat'` pada draft ini). | `planning-contract.ts:4-15`; `npm run intake:validate` |
| Auth | JWT HS256 dengan `JWT_SECRET` bersama; klaim `user_id`, `tenant_id`, `role_id`, `member_id`, `is_parent`, `email`. | identity `pkg/jwt/jwt.go:17-29` |
| Web | Semua panggilan backend lewat server ke `GATEWAY_API_URL`. JWT disimpan di cookie `httpOnly`. Tidak ada library WebSocket. | web `lib/gateway.ts:148-176`, `app/(auth)/login/_actions/actions.ts:73-74`, docs `components/web.md:60-64` |
| Gateway | Tiga upstream; proxy dibatasi `PROXY_UPSTREAM_TIMEOUT_SECONDS` (default 30 detik) untuk seluruh pertukaran. Hijack menghapus deadline server (Go 1.26.5 `net/http/server.go:325`). CORS menegakkan Origin, dan access log tidak mencatat query. | `proxy_handler.go:47-138`, `router.go:73-76`, `access_log_middleware.go:35-40` |
| Role | Role sistem `Creator` mendapat semua permission hanya saat seed. `Teacher` hanya memiliki schedule, attendance, student_note, dan report. Tidak ada permission chat. | identity `seeders/000001_default_permissions_and_roles.sql:53-80` |
| Relasi parent | `Student.ParentID`, `Enrollment.StudentID`/`TenantID`. Permintaan jadwal private (KEL-107, sudah merge) menyimpan `tenant_id`, `parent_id`, `class_id`, `student_id`, dan `status`. | academic `domain/student.go:22`, `domain/private_schedule_request.go`, `routes.go:72-77` |
| Report | Hanya dapat dibaca anggota tenant (`report:read`); parent tidak punya akses. | academic `attendance_report_routes.go:17-21`, `report_usecase.go:62` |
| Internal API | Academic memiliki grup `/internal` dengan `InternalServiceAuth` (`X-Internal-Service-Credential`). | academic `routes.go:99-102`, `middleware/auth_middleware.go:13` |
| Deploy | Tidak ada manifest deploy untuk service mana pun, hanya Dockerfile per repo. | ls repo |

## Kandidat

| Kandidat | Keputusan | Alasan |
| --- | --- | --- |
| Permission `chat:manage` (identity) | draft | Tidak ada cara lain untuk menandai "admin tenant". Creator tidak otomatis mendapat permission baru. |
| Endpoint konteks internal academic | draft | Hak akses parent dan report hanya dapat dibuktikan dari academic. |
| Chat-service inti: REST dan kind `staff` | draft | Pondasi service baru. |
| Kind `schedule_request` dan `report` | draft | Dua alur yang diminta owner. |
| WebSocket dan tiket | draft | Keputusan owner. Browser tidak dapat mengirim JWT. |
| Route gateway REST dan WebSocket | draft | Timeout proxy memutus WebSocket. |
| Web inbox dan realtime | draft | |
| Titik masuk chat dari permintaan jadwal dan report | draft | Bergantung pada KEL-109 dan KEL-110. |
| Fan-out multi-instance, notifikasi, lampiran | ditunda | Di luar MVP; dicatat sebagai out of scope. |
| Manifest deploy chat | ditunda | Belum ada pola deploy di repo mana pun. |
