# Report 2026-09-28_0940 — chat service

## Ringkasan eksekutif
- Chat belum ada sama sekali, baik di kode maupun di Linear (lihat `discovery.md`). Project baru `tenant-parent-teacher-chat` (P-KEL-23) dibuat dengan 8 issue (KEL-117..124), sesuai MAKS_ISSUE 8.
- Draft awalnya dirender dengan validator bayangan, karena `chat` belum ada di `repositoryNames`. Setelah PR kontrak (kelolakelas-ai-orchestrator #9) merge, render diulang dengan `planning.mjs` dan validator asli: lulus, 2 project / 12 issue, dan file hasil render identik dengan render bayangan.
- `backlog.yaml` juga memuat P-KEL-22 beserta KEL-107..110 **tanpa perubahan**, hanya supaya `blockedByDraftKeys` issue 12 ke KEL-109/KEL-110 dapat divalidasi. Keempatnya sudah ada di Linear dan **tidak dibuat ulang maupun diubah**. Deskripsi project hasil render di sini hanya memuat 4 issue, jadi jangan dipakai untuk menimpa P-KEL-22.
- Risiko utama:
  - kebocoran lintas tenant/parent di service baru, dengan mitigasi satu fungsi visibilitas dan test isolasi;
  - autentikasi WebSocket, diatasi dengan tiket sekali pakai karena JWT tersimpan di cookie `httpOnly`;
  - timeout proxy gateway yang memutus WebSocket, diatasi dengan route khusus.

## Urutan eksekusi
Lihat `backlog.md`.
1. KEL-117 `chat-manage-permission` dan KEL-118 `academic-chat-context-internal-api` dapat berjalan paralel sejak awal.
2. KEL-119 `chat-service-core-api`.
3. KEL-120 `chat-service-conversation-contexts`.
4. KEL-121 `chat-service-websocket-realtime`.
5. KEL-122 `gateway-chat-routes`.
6. KEL-123 `web-chat-inbox-realtime`.
7. KEL-124 `web-chat-entry-points`, yang juga menunggu KEL-109 dan KEL-110.

## Prasyarat operator (status 2026-09-28)

| # | Prasyarat | Status | Bukti |
| --- | --- | --- | --- |
| 1 | Repo `kelolakelas/kelolakelas-chat-service` | Selesai | Repo public, commit awal `ad1142b`: kerangka Go dengan `GET /health`, graceful shutdown, test, `.env.example`, dan Makefile. CI `gate` sama persis dengan academic, run pertama `success`. Branch protection sama dengan academic: `gate` wajib dan strict, admins enforced, 0 approval, tanpa force push/delete. Repo sudah di-clone ke workspace. |
| 2 | `chat` di kontrak orchestrator | Selesai | kelolakelas-ai-orchestrator PR #9, satu baris, squash `559162f`, `gate` pass. |
| 3 | Sinkronisasi tooling | Sebagian | Sudah: `kel_discover.py` (`REPO_DIRS`), `audit-dossier.ts`, `SKILL.md`, `references/{autopilot-loop,backlog-planning}.md` (disalin ke 3 profile, `diff -rq` bersih), `LINEAR_PLANNING_PROMPT.md:94,143`, `LINEAR_EXECUTION_PROMPT.md:23`, dan `kelolakelas-docs/scripts/planning.mjs` (lokal; folder `scripts/` belum pernah di-commit ke repo docs). **Belum:** root `AGENTS.md` (Repository map), karena edit file instruksi agent memerlukan persetujuan owner di Hermes UI. |
| 4 | Label Linear `chat` | Selesai | Label tim KelolaKelas `f503b78e-091e-439f-a016-134a2f467d87`. |

Kerangka repo sengaja belum memuat `cmd/migrate`, Dockerfile, database, dan JWT; semuanya dibangun KEL-119. Dockerfile belum ada di repo service mana pun.

## Status permintaan

| Request | Status | Bukti | Linear |
| --- | --- | --- | --- |
| Chat tenant–parent (+ pengajar) | dibuat di Linear | `discovery.md` | P-KEL-23, KEL-117..124 |
| Payment page VA/QRIS | ditunda ke run berikutnya | keputusan owner run 0509 | - |

## Kandidat yang tidak dibuat
- Fan-out multi-instance, notifikasi di luar halaman chat, dan lampiran: di luar MVP.
- Manifest deploy chat-service: belum ada pola deploy untuk service mana pun.

## Pertanyaan terbuka
Asumsi berikut sudah tertulis di Technical Notes masing-masing issue. Bila owner menjawab berbeda, issue terkait direvisi sebelum autopilot mengerjakannya.
1. Admin tenant adalah pemegang permission baru `chat:manage` (Creator otomatis; role lain lewat editor role). Terkait KEL-117 dan KEL-119.
2. Pengajar adalah anggota tenant aktif mana pun. Sisi tenant pada chat report adalah semua pemegang `report:read`. Terkait KEL-119 dan KEL-120.
3. Chat permintaan jadwal dibuka dari permintaan yang sudah terkirim, pada status apa pun. Terkait KEL-120 dan KEL-124.
4. Nama tampilan pengirim di luar scope MVP; label peran dipakai sebagai gantinya. Terkait KEL-119 dan KEL-123.

## Status pengiriman ke Linear
Owner menyetujui semua item pada 2026-09-28.

- Project **P-KEL-23** "Chat realtime antara tenant, pengajar, dan parent" dibuat dengan description berupa `projects/tenant-parent-teacher-chat.md` apa adanya. Status Backlog, priority High.
- Issue **KEL-117..124** dibuat dengan description berupa `issues/NN-<draftKey>.md` apa adanya. Setiap issue berlabel repo + `Feature`, priority High, dan estimate S=1/M=2/L=3. Relasi native `blockedBy`:
  - KEL-119 ← KEL-117
  - KEL-120 ← KEL-119, KEL-118
  - KEL-121 ← KEL-119, KEL-120
  - KEL-122 ← KEL-119, KEL-121
  - KEL-123 ← KEL-122
  - KEL-124 ← KEL-123, KEL-109, KEL-110
- Read-back (`get_project` / `get_issue includeRelations`) untuk 2 project dan 12 issue diverifikasi dengan `verify-readback.py`: **PASS**. Yang dibandingkan adalah kontrak JSON, judul, label, project, dan relasi.
- Label `ai-ready` ditambahkan ke KEL-117..124 setelah PASS, sebagai langkah terakhir.
- Dry-run `kel_discover.py` setelah penulisan: kontrak valid 106 (sebelumnya 98, bertambah 8), dan tidak ada error kontrak atau repo. KEL-117..124 hanya dikecualikan sementara karena `diubah < 15 menit lalu`. Setelah itu KEL-117 dan KEL-118 eligible, sedangkan yang lain menunggu blocker.
- Mapping lengkap ada di `linear-sync.json`.
