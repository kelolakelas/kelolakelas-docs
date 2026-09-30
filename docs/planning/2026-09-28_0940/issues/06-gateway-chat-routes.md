## Background / Problem

Gateway saat ini hanya mengenal tiga upstream (`internal/config/config.go:58-60`, `internal/delivery/http/handler/proxy_handler.go:47-83`). Setiap proxy dibatasi `context.WithTimeout` selama `PROXY_UPSTREAM_TIMEOUT_SECONDS` (default 30 detik) untuk seluruh pertukaran (`proxy_handler.go:115-138`). `httputil.ReverseProxy` meneruskan upgrade WebSocket dan menutup koneksi backend ketika context request selesai, sehingga route WebSocket yang melewati `proxyRoute` akan terputus setelah 30 detik. Sebaliknya, hijack koneksi menghapus deadline server (Go `net/http/server.go:325`), jadi `SERVER_WRITE_TIMEOUT_SECONDS` tidak memutus koneksi yang sudah di-upgrade. Kesimpulan ini Inferred dari source stdlib dan harus dibuktikan lewat test.

## Goal

Web dapat memanggil REST chat lewat gateway dengan autentikasi dan session check yang sama seperti route lain, serta membuka WebSocket chat yang bertahan melewati batas timeout proxy.

## Requirements

- Env baru `CHAT_SERVICE_URL` bersifat opsional. Bila kosong, semua route chat menjawab 503 dengan envelope gateway dan readiness tidak memeriksa chat. Bila diisi, readiness (`internal/delivery/http/readiness.go`) ikut memeriksa chat-service.
- Route REST chat (`/api/v1/chat/conversations`, `/api/v1/chat/conversations/:id`, `/:id/messages`, `/:id/read`, dan `POST /api/v1/chat/ws-tickets`) didaftarkan di grup protected dengan `AuthMiddlewareWithSessionCheck`. Route ini dapat diakses parent maupun anggota tenant dan memakai `proxyRoute` biasa.
- `GET /api/v1/chat/ws` didaftarkan tanpa `Authorization`, karena chat-service yang memvalidasi tiket. Route ini memakai reverse proxy terpisah tanpa deadline upstream, tetapi tetap melewati `CORSMiddleware` dan rate limit global.
- Header konteks yang tidak tepercaya tetap dihapus (`StripUntrustedContextHeaders`) pada route chat.
- Signature `NewProxyHandler` yang dipakai test lama tetap dapat dikompilasi; upstream chat ditambahkan lewat opsi atau field baru.

## Acceptance Criteria

- [ ] REST chat tanpa token ditolak 401 oleh gateway, sedangkan dengan token valid diteruskan ke chat-service.
- [ ] Dalam test dengan timeout diperkecil, upgrade WebSocket dengan Origin sama dengan `APP_URL` berhasil dan tetap terhubung lebih lama dari `PROXY_UPSTREAM_TIMEOUT_SECONDS`.
- [ ] Upgrade dengan Origin lain ditolak 403 sebelum mencapai chat-service.
- [ ] Tanpa `CHAT_SERVICE_URL`, route chat menjawab 503 dan route lain tidak berubah.
- [ ] Existing functionality remains unaffected
- [ ] Error and validation scenarios are handled correctly

## Technical Notes

Risiko utama: route WebSocket ini tidak diautentikasi gateway dan tidak punya batas waktu. Mitigasinya:
- autentikasi tiket di chat-service;
- Origin ditegakkan `CORSMiddleware` (`internal/delivery/http/router.go:76`);
- rate limit global;
- batas umur koneksi di chat-service;
- access log yang tidak mencatat query.

`http.Server.Shutdown` tidak menutup koneksi yang sudah di-hijack, jadi pastikan shutdown gateway tidak tertahan oleh koneksi WebSocket. Path mengikuti kontrak issue `chat-service-core-api` dan `chat-service-websocket-realtime`.

Perbarui kelolakelas-docs: `docs/api/gateway.md`, `docs/api/endpoint-matrix.md`, `docs/components/api-gateway.md`, dan `docs/reference/environment-variables.md`, serta tambahkan ADR yang mencatat pengecualian WebSocket terhadap ADR 0021 (bounded proxy).

Relevant areas:

- `kelolakelas-api-gateway/internal/config/config.go`
- `kelolakelas-api-gateway/internal/delivery/http/router.go`
- `kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go`
- `kelolakelas-api-gateway/internal/delivery/http/readiness.go`
- `kelolakelas-api-gateway/cmd/server/main.go`
- `kelolakelas-api-gateway/.env.example`

## Edge Cases

- Chat-service tidak tersedia saat upgrade; dijawab 502 dengan envelope gateway.
- Gateway shutdown saat koneksi WebSocket masih terbuka.
- Body REST chat melebihi `PROXY_MAX_BODY_BYTES` dijawab 413.

## Testing / Validation

- [ ] Router test bahwa setiap route chat diteruskan ke upstream chat dan route REST terlindungi.
- [ ] Test WebSocket end-to-end dengan upstream echo `httptest` yang membuktikan koneksi bertahan melewati timeout upstream yang diperkecil, sebagai mitigasi risiko timeout.
- [ ] Test bahwa Origin asing ditolak dan `CHAT_SERVICE_URL` kosong menghasilkan 503.
- [ ] Existing tests pass, `gofmt`/`go vet`/`go test -race` pass, dan acceptance criteria diverifikasi.

## Out of Scope

- Autentikasi tiket (di chat-service).
- Rate limit khusus chat.
- Load balancing multi-instance.

## AI Orchestrator Contract

```json
{
  "projectKey": "tenant-parent-teacher-chat",
  "type": "Feature",
  "priority": "High",
  "externalDependencies": [],
  "draftKey": "gateway-chat-routes",
  "title": "Gateway meneruskan REST chat dan koneksi WebSocket chat ke chat-service",
  "estimate": "M",
  "complexity": "high",
  "repositories": [
    "api-gateway"
  ],
  "blockedByDraftKeys": [
    "chat-service-core-api",
    "chat-service-websocket-realtime"
  ],
  "body": {
    "backgroundProblem": "Gateway saat ini hanya mengenal tiga upstream (`internal/config/config.go:58-60`, `internal/delivery/http/handler/proxy_handler.go:47-83`). Setiap proxy dibatasi `context.WithTimeout` selama `PROXY_UPSTREAM_TIMEOUT_SECONDS` (default 30 detik) untuk seluruh pertukaran (`proxy_handler.go:115-138`). `httputil.ReverseProxy` meneruskan upgrade WebSocket dan menutup koneksi backend ketika context request selesai, sehingga route WebSocket yang melewati `proxyRoute` akan terputus setelah 30 detik. Sebaliknya, hijack koneksi menghapus deadline server (Go `net/http/server.go:325`), jadi `SERVER_WRITE_TIMEOUT_SECONDS` tidak memutus koneksi yang sudah di-upgrade. Kesimpulan ini Inferred dari source stdlib dan harus dibuktikan lewat test.",
    "goal": "Web dapat memanggil REST chat lewat gateway dengan autentikasi dan session check yang sama seperti route lain, serta membuka WebSocket chat yang bertahan melewati batas timeout proxy.",
    "requirements": [
      "Env baru `CHAT_SERVICE_URL` bersifat opsional. Bila kosong, semua route chat menjawab 503 dengan envelope gateway dan readiness tidak memeriksa chat. Bila diisi, readiness (`internal/delivery/http/readiness.go`) ikut memeriksa chat-service.",
      "Route REST chat (`/api/v1/chat/conversations`, `/api/v1/chat/conversations/:id`, `/:id/messages`, `/:id/read`, dan `POST /api/v1/chat/ws-tickets`) didaftarkan di grup protected dengan `AuthMiddlewareWithSessionCheck`. Route ini dapat diakses parent maupun anggota tenant dan memakai `proxyRoute` biasa.",
      "`GET /api/v1/chat/ws` didaftarkan tanpa `Authorization`, karena chat-service yang memvalidasi tiket. Route ini memakai reverse proxy terpisah tanpa deadline upstream, tetapi tetap melewati `CORSMiddleware` dan rate limit global.",
      "Header konteks yang tidak tepercaya tetap dihapus (`StripUntrustedContextHeaders`) pada route chat.",
      "Signature `NewProxyHandler` yang dipakai test lama tetap dapat dikompilasi; upstream chat ditambahkan lewat opsi atau field baru."
    ],
    "acceptanceCriteria": [
      "REST chat tanpa token ditolak 401 oleh gateway, sedangkan dengan token valid diteruskan ke chat-service.",
      "Dalam test dengan timeout diperkecil, upgrade WebSocket dengan Origin sama dengan `APP_URL` berhasil dan tetap terhubung lebih lama dari `PROXY_UPSTREAM_TIMEOUT_SECONDS`.",
      "Upgrade dengan Origin lain ditolak 403 sebelum mencapai chat-service.",
      "Tanpa `CHAT_SERVICE_URL`, route chat menjawab 503 dan route lain tidak berubah.",
      "Existing functionality remains unaffected",
      "Error and validation scenarios are handled correctly"
    ],
    "technicalNotes": "Risiko utama: route WebSocket ini tidak diautentikasi gateway dan tidak punya batas waktu. Mitigasinya:\n- autentikasi tiket di chat-service;\n- Origin ditegakkan `CORSMiddleware` (`internal/delivery/http/router.go:76`);\n- rate limit global;\n- batas umur koneksi di chat-service;\n- access log yang tidak mencatat query.\n\n`http.Server.Shutdown` tidak menutup koneksi yang sudah di-hijack, jadi pastikan shutdown gateway tidak tertahan oleh koneksi WebSocket. Path mengikuti kontrak issue `chat-service-core-api` dan `chat-service-websocket-realtime`.\n\nPerbarui kelolakelas-docs: `docs/api/gateway.md`, `docs/api/endpoint-matrix.md`, `docs/components/api-gateway.md`, dan `docs/reference/environment-variables.md`, serta tambahkan ADR yang mencatat pengecualian WebSocket terhadap ADR 0021 (bounded proxy).",
    "relevantAreas": [
      "kelolakelas-api-gateway/internal/config/config.go",
      "kelolakelas-api-gateway/internal/delivery/http/router.go",
      "kelolakelas-api-gateway/internal/delivery/http/handler/proxy_handler.go",
      "kelolakelas-api-gateway/internal/delivery/http/readiness.go",
      "kelolakelas-api-gateway/cmd/server/main.go",
      "kelolakelas-api-gateway/.env.example"
    ],
    "edgeCases": [
      "Chat-service tidak tersedia saat upgrade; dijawab 502 dengan envelope gateway.",
      "Gateway shutdown saat koneksi WebSocket masih terbuka.",
      "Body REST chat melebihi `PROXY_MAX_BODY_BYTES` dijawab 413."
    ],
    "testingValidation": [
      "Router test bahwa setiap route chat diteruskan ke upstream chat dan route REST terlindungi.",
      "Test WebSocket end-to-end dengan upstream echo `httptest` yang membuktikan koneksi bertahan melewati timeout upstream yang diperkecil, sebagai mitigasi risiko timeout.",
      "Test bahwa Origin asing ditolak dan `CHAT_SERVICE_URL` kosong menghasilkan 503.",
      "Existing tests pass, `gofmt`/`go vet`/`go test -race` pass, dan acceptance criteria diverifikasi."
    ],
    "outOfScope": [
      "Autentikasi tiket (di chat-service).",
      "Rate limit khusus chat.",
      "Load balancing multi-instance."
    ]
  },
  "labels": [
    "api-gateway",
    "ai-ready"
  ]
}
```
