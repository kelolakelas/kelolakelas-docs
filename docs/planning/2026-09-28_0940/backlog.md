# Backlog draft 2026-09-28_0940

> Dirender otomatis dari `backlog.yaml` oleh `kelolakelas-docs/scripts/planning.mjs render`. Jangan edit file ini, `issues/`, atau `projects/` secara manual; ubah `backlog.yaml` lalu render ulang. Isi `issues/*.md` dan `projects/*.md` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
| `tenant-parent-teacher-chat` | Chat realtime antara tenant, pengajar, dan parent | 8 | [projects/tenant-parent-teacher-chat.md](projects/tenant-parent-teacher-chat.md) |
| `private-class-scheduled-purchase` | Pembelian kelas private dengan jadwal yang disepakati | 4 | [projects/private-class-scheduled-purchase.md](projects/private-class-scheduled-purchase.md) |

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [Identity menyediakan permission tenant `chat:manage` untuk admin yang menangani chat](issues/01-chat-manage-permission.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | S | medium | `identity`, `ai-ready` | - | - |
| 2 | [Academic menyediakan konteks permintaan jadwal private dan report untuk chat-service melalui endpoint internal](issues/02-academic-chat-context-internal-api.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | M | high | `academic`, `ai-ready` | - | - |
| 3 | [Chat-service menyimpan percakapan pengajar–admin tenant dan pesannya melalui REST API](issues/03-chat-service-core-api.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | L | high | `chat`, `ai-ready` | `chat-manage-permission` | - |
| 4 | [Chat-service mendukung percakapan parent–admin tenant per permintaan jadwal private dan pengajar–parent per report](issues/04-chat-service-conversation-contexts.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | M | high | `chat`, `ai-ready` | `chat-service-core-api`, `academic-chat-context-internal-api` | - |
| 5 | [Chat-service mengirim pesan baru secara realtime lewat WebSocket dengan tiket sekali pakai](issues/05-chat-service-websocket-realtime.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | L | high | `chat`, `ai-ready` | `chat-service-core-api`, `chat-service-conversation-contexts` | - |
| 6 | [Gateway meneruskan REST chat dan koneksi WebSocket chat ke chat-service](issues/06-gateway-chat-routes.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | M | high | `api-gateway`, `ai-ready` | `chat-service-core-api`, `chat-service-websocket-realtime` | - |
| 7 | [Parent dan anggota tenant membaca dan membalas chat di web dengan pesan baru muncul realtime](issues/07-web-chat-inbox-realtime.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | L | medium | `web`, `ai-ready` | `gateway-chat-routes` | - |
| 8 | [Parent dapat mengajukan jadwal kelas private dan tenant dapat meninjau atau menolaknya melalui API](issues/08-private-schedule-request-api.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | L | high | `academic`, `api-gateway`, `ai-ready` | - | - |
| 9 | [Persetujuan tenant atas permintaan jadwal private membuat enrollment, jadwal, dan payment link](issues/09-approve-private-schedule-request.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | high | `academic`, `api-gateway`, `ai-ready` | `private-schedule-request-api` | - |
| 10 | [Parent mengajukan jadwal kelas private dari detail kelas dan memantau status permintaannya](issues/10-parent-private-schedule-request-web.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | medium | `web`, `ai-ready` | `private-schedule-request-api` | - |
| 11 | [Tenant meninjau, menyetujui, atau menolak permintaan jadwal private dari dashboard](issues/11-tenant-private-schedule-review-web.md) | Pembelian kelas private dengan jadwal yang disepakati | Feature | High | M | medium | `web`, `ai-ready` | `approve-private-schedule-request` | - |
| 12 | [Parent, admin tenant, dan pengajar dapat memulai chat dari permintaan jadwal private dan dari report student](issues/12-web-chat-entry-points.md) | Chat realtime antara tenant, pengajar, dan parent | Feature | High | M | medium | `web`, `ai-ready` | `web-chat-inbox-realtime`, `parent-private-schedule-request-web`, `tenant-private-schedule-review-web` | - |
