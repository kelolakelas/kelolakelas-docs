# Environment-variable inventory

Safe examples deliberately contain placeholders only — this includes every repository `.env.example`: credential values there must stay recognizable placeholders (for example `JWT_SECRET=change-me-...`), never real or realistic secrets. “Required” means the loader refuses startup. Evidence throughout is the named service `internal/config/config.go`; web evidence is the listed app files.

| Variable | Consumer | Required / default | Purpose / safe example | Sensitive | Evidence |
|---|---|---|---|---|---|
| `GATEWAY_API_URL` | web | **required; rejects blank, non-HTTP(S), or path-bearing values** | server-side gateway origin, `https://api.example.test` | no | `kelolakelas-web/.env.example`, `lib/gateway.ts`; web auth/dashboard actions and queries |
| `NEXT_PUBLIC_APP_URL` | web | optional; `http://localhost:3000` (also used when the value is blank, not a URL, or not HTTP(S) in `lib/site-metadata.ts`) | public origin for canonical and Open Graph URLs and root `metadataBase`, `https://app.example.test` | no | `kelolakelas-web/.env.example`, `lib/site-metadata.ts` (`getAppUrl`), `app/layout.tsx`, `/kelas` pages, login/register/invitation pages |
| `AUTH_COOKIE_NAME` | web | optional; `auth_token` | browser JWT cookie key | no | `proxy.ts`, web actions |
| `TENANT_ID_COOKIE_NAME` | web | optional; `tenant_id` | optional tenant header cookie key | no | tenant action/query files |
| `NODE_ENV` | web | runtime default | enables secure cookie only when `production` | no | web auth actions |
| `PORT` | gateway/identity/academic/billing | optional; 8000/8080/8081/8082 | HTTP listener, `8080` | no | each config |
| `JWT_SECRET` | gateway/identity/academic/billing | **required; rejects blank/whitespace** | shared HS256 signing/validation key; configure the same `<strong-random-secret>` at every JWT boundary | yes | each config; identity `pkg/jwt/jwt.go` |
| `APP_URL` | gateway/identity | gateway optional; identity defaults localhost:3000 | CORS origin/invitation app base, `https://app.example.test` | no | gateway/identity config |
| `IDENTITY_SERVICE_URL` | gateway | optional; localhost:8080 | proxy target, `http://identity:8080` | no | gateway config |
| `ACADEMIC_SERVICE_URL` | gateway/billing | optional; localhost:8081 | proxy/internal academic target, `http://academic:8081` | no | gateway/billing config |
| `BILLING_SERVICE_URL` | gateway/academic | optional; localhost:8082 | proxy/internal billing target, `http://billing:8082` | no | gateway/academic config |
| `IDENTITY_GRPC_HOST` | academic | optional; localhost:50051 | identity gRPC target, `identity:50051` | no | academic config |
| `INTERNAL_SERVICE_CREDENTIAL` | academic/billing | **required** | service-to-service Bearer value, `<random-service-secret>` | yes | academic/billing config |
| `DATABASE_URL` | identity/academic/billing | optional | PostgreSQL URL fills unset DB fields, `postgresql://user:<redacted>@db:5432/name?sslmode=require` | yes | each stateful config |
| `DB_HOST` / `DB_PORT` | identity/academic/billing | optional; localhost/5432 | PostgreSQL network target | no | each stateful config |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | identity/academic/billing | optional local fallbacks | PostgreSQL credentials/database | password yes | each stateful config |
| `DB_SSLMODE` | identity/academic/billing | optional; `disable` | PostgreSQL SSL mode, `require` | no | each stateful config |
| `DB_CHANNEL_BINDING` | identity/academic/billing | optional; `disable` | PostgreSQL binding: disable/prefer/require | no | each stateful config |
| `REDIS_HOST` / `REDIS_PORT` | gateway/identity | optional; localhost/6379 | Redis target | no | gateway/identity config |
| `REDIS_USERNAME` | gateway/identity | optional; `default` | Redis username | no | gateway/identity config |
| `REDIS_PASSWORD` | gateway/identity | optional; empty | Redis password, `<redacted>` | yes | gateway/identity config |
| `REDIS_TLS` / `REDIS_DB` | gateway/identity | optional; false/0 | TLS flag and non-negative DB, `true`, `0` | no | gateway/identity config |
| `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW_SECONDS` | gateway | optional; 60/60 | general fallback requests/window | no | gateway config |
| `RATE_LIMIT_PUBLIC_REQUESTS` / `RATE_LIMIT_PROTECTED_REQUESTS` | gateway | optional; 60/120 | public/protected caps | no | gateway config/middleware |
| `RATE_LIMIT_LOGIN_REQUESTS` / `RATE_LIMIT_REGISTER_REQUESTS` | gateway | optional; 5/10 | sensitive endpoint caps | no | gateway config/middleware |
| `RATE_LIMIT_WEBHOOK_REQUESTS` / `RATE_LIMIT_WEBHOOK_WINDOW_SECONDS` | gateway | optional; 120/general window | callback cap/window | no | gateway config/middleware |
| `PROXY_UPSTREAM_TIMEOUT_SECONDS` | gateway | optional; 30 | per-request deadline for one proxied call; expiry answers `504` `Upstream service timed out` | no | gateway config, `internal/delivery/http/handler/proxy_handler.go` |
| `PROXY_MAX_BODY_BYTES` | gateway | optional; 1048576 (1 MiB) | request body cap enforced before forwarding; a larger body answers `413` `Request body exceeds the configured limit`. Must exceed the largest legitimate payload (the Duitku callback and the registration forms) | no | gateway config, `internal/delivery/http/middleware/body_limit_middleware.go` |
| `SERVER_READ_HEADER_TIMEOUT_SECONDS` | gateway | optional; 5 | `http.Server.ReadHeaderTimeout`; bounds a client that opens a connection and stalls before sending headers | no | gateway config, `cmd/server/main.go` (`newHTTPServer`) |
| `SERVER_READ_TIMEOUT_SECONDS` | gateway | optional; 30 | `http.Server.ReadTimeout`; bounds reading the whole request | no | gateway config, `cmd/server/main.go` (`newHTTPServer`) |
| `SERVER_WRITE_TIMEOUT_SECONDS` | gateway | optional; 60 | `http.Server.WriteTimeout`; **must be greater than `PROXY_UPSTREAM_TIMEOUT_SECONDS`** or loading fails with an explanatory error rather than clamping | no | gateway config, `cmd/server/main.go` (`newHTTPServer`) |
| `SERVER_IDLE_TIMEOUT_SECONDS` | gateway | optional; 120 | `http.Server.IdleTimeout` for kept-alive connections | no | gateway config, `cmd/server/main.go` (`newHTTPServer`) |
| `RESEND_API_KEY` | identity/billing | optional at loader; needed to deliver email | Resend credential, `<redacted>` | yes | identity/billing config/email packages |
| `RESEND_FROM_EMAIL` | identity/billing | optional at loader | sender, `noreply@example.test` | no | identity/billing config/email packages |
| `GOOGLE_MAPS_API_KEY` | identity | optional | Maps API key, `<redacted>` | yes | identity config/maps client |
| `GOOGLE_MAPS_GEOCODING_ENABLED` / `GOOGLE_MAPS_TIMEOUT_SECONDS` | identity | optional; false/5 | opt-in geocode and HTTP timeout | no | identity config/maps client |
| `PERMISSION_REQUIRE_TENANT_ID` | identity | optional; false | makes `tenant_id` mandatory on the internal `CheckPermission` request. Deploy identity with the default `false` first, then academic, then set `true` and restart so the tenant-scoped decision is guaranteed for every caller (see [ADR 0002](../adr/0002-academic-permission-enforcement.md)) | no | identity config, `internal/delivery/grpc/permission_service.go`, `cmd/server/main.go` |
| `DUITKU_API_BASE_URL` | billing | optional; sandbox base | Duitku base, `https://sandbox.duitku.com/...` | no | billing config |
| `DUITKU_API_KEY` / `DUITKU_MERCHANT_CODE` | billing | optional loader; needed to create invoice | provider credentials, `<redacted>` | yes | billing config/duitku client |
| `DUITKU_CALLBACK_URL` / `DUITKU_RETURN_URL` | billing | optional; callback defaults local service path, return defaults callback | provider callback/return, `https://api.example.test/api/v1/billing/webhooks/duitku` | no | billing config |
| `SUBSCRIPTION_WORKER_ENABLED` | billing | optional; false | starts worker when true | no | billing config/main |
| `SUBSCRIPTION_WORKER_INTERVAL_MINUTES` | billing | optional; 1440 | worker polling interval | no | billing config |
| `SUBSCRIPTION_PAYMENT_REMINDER_INTERVAL_DAYS` | billing | optional; 3 | reminder cadence | no | billing config |
| `SUBSCRIPTION_PAYMENT_EXPIRY_PERIOD_DAYS` | billing | optional; 14 | invoice validity in days; drives both the Duitku `expiryPeriod` and the stored `transactions.invoice_expires_at` | no | billing config, `internal/usecase/transaction_usecase.go`, `internal/usecase/subscription_worker.go` |
| `TRANSACTION_EXPIRY_WORKER_ENABLED` | billing | optional; true | starts the local worker that marks overdue unpaid transactions `expired` | no | billing config/main |
| `TRANSACTION_EXPIRY_WORKER_INTERVAL_MINUTES` | billing | optional; 5 | expiry worker poll interval | no | billing config |
| `TRANSACTION_CLAIM_TIMEOUT_MINUTES` | billing | optional; 10 | how long an unowned invoice claim may stay unowned before another request may take it over | no | billing config, `internal/domain/transaction.go` |
| `PAYMENT_RECONCILIATION_WORKER_ENABLED` | billing | optional; true | enables durable paid-enrollment activation retries | no | billing config |
| `PAYMENT_RECONCILIATION_WORKER_INTERVAL_MINUTES` | billing | optional; 1 | reconciliation worker poll interval | no | billing config |
| `PAYMENT_RECONCILIATION_MAX_ATTEMPTS` | billing | optional; 10 | attempts before terminal reconciliation failure | no | billing config |
| `CATALOG_TENANT_INFO_TTL_MINUTES` | academic | optional; 5 | how long a catalog tenant snapshot may age before identity is asked again; a request inside the TTL performs neither a gRPC call nor a snapshot write | no | academic config, `internal/usecase/catalog_usecase.go` |
| `CATALOG_TENANT_INFO_TIMEOUT_MS` | academic | optional; 2000 | per-call bound applied to identity gRPC requests issued by the catalog | no | academic config, `pkg/grpcclient/tenant_client.go` |

Do not place a JWT secret in committed environment files. Generate and distribute it through the deployment secret manager; every JWT boundary must receive the identical nonblank value.
