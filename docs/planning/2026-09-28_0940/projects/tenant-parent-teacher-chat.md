## Tujuan/outcome

Parent dapat berdiskusi dengan admin tenant tentang permintaan jadwal private, pengajar dapat berdiskusi dengan admin tenant, dan pengajar dapat berdiskusi dengan parent tentang report student. Pesan baru muncul realtime melalui WebSocket.

## Masalah yang diselesaikan

Belum ada kanal komunikasi di dalam KelolaKelas: tidak ada kode chat, WebSocket, atau notifikasi di repo mana pun. Web tidak memiliki library WebSocket/SSE, dan gateway memutus setiap proxy setelah `PROXY_UPSTREAM_TIMEOUT_SECONDS` (default 30 detik, api-gateway `internal/delivery/http/handler/proxy_handler.go:115-138`). Alur permintaan jadwal private bergantung pada komunikasi di luar aplikasi, dan report student hanya dapat dibaca anggota tenant (academic `cmd/server/attendance_report_routes.go:17-21`).

## Nilai dan prioritas

High. Permintaan owner yang melengkapi alur jadwal private dan komunikasi report. Confidence sedang karena ini service baru tanpa preseden realtime di codebase. Effort total besar (3 issue L, 4 issue M, 1 issue S).

## Scope

- Repo dan service baru `kelolakelas-chat-service` (Go, PostgreSQL sendiri) untuk percakapan dan pesan.
- Permission tenant baru `chat:manage` di identity untuk admin tenant yang menangani chat.
- Endpoint internal academic yang menyediakan konteks permintaan jadwal private dan report untuk pemeriksaan hak akses chat-service.
- Tiga jenis percakapan: parent–admin tenant per permintaan jadwal private, pengajar–admin tenant, dan pengajar–parent per report student.
- Pengiriman pesan lewat REST dan penerimaan realtime lewat WebSocket dengan tiket sekali pakai.
- Route REST dan WebSocket chat di api-gateway.
- Halaman chat parent dan tenant di web beserta titik masuk dari permintaan jadwal dan report.

## Di luar scope

- Lampiran file atau gambar, edit dan hapus pesan, reaksi, indikator mengetik, dan status online.
- Notifikasi email, push, atau badge di luar halaman chat.
- Fan-out lintas beberapa instance chat-service; tahap ini satu instance.
- Chat antar-parent, atau chat parent langsung ke pengajar di luar konteks report.
- Moderasi, pemblokiran pengguna, serta retensi dan penghapusan otomatis pesan.
- Manifest deployment, yang belum ada untuk service mana pun.

## Success metrics

- Parent pemilik permintaan jadwal private dan admin tenant dapat bertukar pesan di percakapan permintaan itu, dan pesan muncul di sisi lain tanpa reload.
- Pengajar dapat memulai percakapan dengan admin tenant, dan dapat memulai percakapan dengan parent dari sebuah report.
- Tidak ada percakapan atau pesan yang dapat dibaca lintas tenant, lintas parent, atau oleh anggota tanpa permission, dibuktikan test isolasi di chat-service dan gateway.
- Koneksi WebSocket lewat gateway bertahan melewati `PROXY_UPSTREAM_TIMEOUT_SECONDS`.

## Dependencies/risiko

- Prasyarat operator sebelum issue mana pun diberi `ai-ready`: repo `kelolakelas/kelolakelas-chat-service` (public, kerangka Go, CI `gate`, branch protection sama dengan repo lain), `chat` ditambahkan ke `repositoryNames` kontrak orchestrator, tooling planning/autopilot disinkronkan, dan label Linear `chat` dibuat.
- Risiko utama: kebocoran pesan lintas tenant atau lintas parent di service baru. Mitigasinya satu fungsi visibilitas yang dipakai REST dan fan-out WebSocket, ditambah test isolasi.
- Risiko autentikasi WebSocket: browser tidak dapat mengirim JWT karena cookie `httpOnly` dan semua request web berjalan dari server ke `GATEWAY_API_URL`. Karena itu dipakai tiket sekali pakai berumur pendek.
- Titik masuk chat dari halaman permintaan jadwal bergantung pada KEL-109 dan KEL-110.

## Issue yang diusulkan

1. Identity menyediakan permission tenant `chat:manage` untuk admin yang menangani chat (`chat-manage-permission`)
2. Academic menyediakan konteks permintaan jadwal private dan report untuk chat-service melalui endpoint internal (`academic-chat-context-internal-api`)
3. Chat-service menyimpan percakapan pengajar–admin tenant dan pesannya melalui REST API (`chat-service-core-api`)
4. Chat-service mendukung percakapan parent–admin tenant per permintaan jadwal private dan pengajar–parent per report (`chat-service-conversation-contexts`)
5. Chat-service mengirim pesan baru secara realtime lewat WebSocket dengan tiket sekali pakai (`chat-service-websocket-realtime`)
6. Gateway meneruskan REST chat dan koneksi WebSocket chat ke chat-service (`gateway-chat-routes`)
7. Parent dan anggota tenant membaca dan membalas chat di web dengan pesan baru muncul realtime (`web-chat-inbox-realtime`)
8. Parent, admin tenant, dan pengajar dapat memulai chat dari permintaan jadwal private dan dari report student (`web-chat-entry-points`)

## AI Orchestrator Project Contract

```json
{
  "key": "tenant-parent-teacher-chat",
  "name": "Chat realtime antara tenant, pengajar, dan parent",
  "outcome": "Parent dapat berdiskusi dengan admin tenant tentang permintaan jadwal private, pengajar dapat berdiskusi dengan admin tenant, dan pengajar dapat berdiskusi dengan parent tentang report student. Pesan baru muncul realtime melalui WebSocket.",
  "problem": "Belum ada kanal komunikasi di dalam KelolaKelas: tidak ada kode chat, WebSocket, atau notifikasi di repo mana pun. Web tidak memiliki library WebSocket/SSE, dan gateway memutus setiap proxy setelah `PROXY_UPSTREAM_TIMEOUT_SECONDS` (default 30 detik, api-gateway `internal/delivery/http/handler/proxy_handler.go:115-138`). Alur permintaan jadwal private bergantung pada komunikasi di luar aplikasi, dan report student hanya dapat dibaca anggota tenant (academic `cmd/server/attendance_report_routes.go:17-21`).",
  "valueAndPriority": "High. Permintaan owner yang melengkapi alur jadwal private dan komunikasi report. Confidence sedang karena ini service baru tanpa preseden realtime di codebase. Effort total besar (3 issue L, 4 issue M, 1 issue S).",
  "scope": [
    "Repo dan service baru `kelolakelas-chat-service` (Go, PostgreSQL sendiri) untuk percakapan dan pesan.",
    "Permission tenant baru `chat:manage` di identity untuk admin tenant yang menangani chat.",
    "Endpoint internal academic yang menyediakan konteks permintaan jadwal private dan report untuk pemeriksaan hak akses chat-service.",
    "Tiga jenis percakapan: parent–admin tenant per permintaan jadwal private, pengajar–admin tenant, dan pengajar–parent per report student.",
    "Pengiriman pesan lewat REST dan penerimaan realtime lewat WebSocket dengan tiket sekali pakai.",
    "Route REST dan WebSocket chat di api-gateway.",
    "Halaman chat parent dan tenant di web beserta titik masuk dari permintaan jadwal dan report."
  ],
  "outOfScope": [
    "Lampiran file atau gambar, edit dan hapus pesan, reaksi, indikator mengetik, dan status online.",
    "Notifikasi email, push, atau badge di luar halaman chat.",
    "Fan-out lintas beberapa instance chat-service; tahap ini satu instance.",
    "Chat antar-parent, atau chat parent langsung ke pengajar di luar konteks report.",
    "Moderasi, pemblokiran pengguna, serta retensi dan penghapusan otomatis pesan.",
    "Manifest deployment, yang belum ada untuk service mana pun."
  ],
  "successMetrics": [
    "Parent pemilik permintaan jadwal private dan admin tenant dapat bertukar pesan di percakapan permintaan itu, dan pesan muncul di sisi lain tanpa reload.",
    "Pengajar dapat memulai percakapan dengan admin tenant, dan dapat memulai percakapan dengan parent dari sebuah report.",
    "Tidak ada percakapan atau pesan yang dapat dibaca lintas tenant, lintas parent, atau oleh anggota tanpa permission, dibuktikan test isolasi di chat-service dan gateway.",
    "Koneksi WebSocket lewat gateway bertahan melewati `PROXY_UPSTREAM_TIMEOUT_SECONDS`."
  ],
  "dependenciesAndRisks": [
    "Prasyarat operator sebelum issue mana pun diberi `ai-ready`: repo `kelolakelas/kelolakelas-chat-service` (public, kerangka Go, CI `gate`, branch protection sama dengan repo lain), `chat` ditambahkan ke `repositoryNames` kontrak orchestrator, tooling planning/autopilot disinkronkan, dan label Linear `chat` dibuat.",
    "Risiko utama: kebocoran pesan lintas tenant atau lintas parent di service baru. Mitigasinya satu fungsi visibilitas yang dipakai REST dan fan-out WebSocket, ditambah test isolasi.",
    "Risiko autentikasi WebSocket: browser tidak dapat mengirim JWT karena cookie `httpOnly` dan semua request web berjalan dari server ke `GATEWAY_API_URL`. Karena itu dipakai tiket sekali pakai berumur pendek.",
    "Titik masuk chat dari halaman permintaan jadwal bergantung pada KEL-109 dan KEL-110."
  ]
}
```
