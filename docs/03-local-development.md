# Local development

This is a code-derived local-start guide, not a verified end-to-end procedure. Do not run migration/seed commands against an unknown database.

1. Provide isolated PostgreSQL databases for identity, academic, and billing; optionally Redis for gateway rate limiting/identity cache.
2. Configure the shared `JWT_SECRET` consistently and set `INTERNAL_SERVICE_CREDENTIAL` consistently between academic and billing. See [environment variables](reference/environment-variables.md).
3. Start identity before academic (academic needs identity gRPC), billing before academic enrollment payment flows, then gateway and web.

| Repository | Safe local command | Notes |
|---|---|---|
| web | `npm run dev` | dependencies are already present only if local install exists; web default API URL is not the gateway port |
| gateway | `make run` | defaults to `:8000` |
| identity | `make run` | HTTP `:8080`, gRPC fixed `:50051` |
| academic | `make run` | defaults `:8081`; requires internal credential |
| billing | `make run` | defaults `:8082`; requires JWT/internal credentials |

`make test` maps to `go test ./...` in each Go repository. Migration helpers (`migrate-up`, `migrate-down`, `seed`) execute database mutations and are intentionally not validation steps. Evidence: each Go `Makefile`; web `package.json`.

Each repository ships a `.env.example` with placeholder-only values; copy it to `.env` and fill real credentials locally. No Compose file or setup automation exists. Database requirements are inferred from `internal/config/config.go` and `pkg/database/db.go` in each service.

## Workspace-local setup (2026-10-14)

**Configured:** the workspace helper `scripts/run-local.sh <component>` exports
service `.env` files before running `make run` or `npm run dev`; Next.js reads
`.env.local`. Exporting is necessary for chat (`cmd/server/main.go`, `loadConfig`)
and orchestrator (`src/index.ts`, `main`), which read process environment directly.
The workspace `LOCAL_DEVELOPMENT.md` lists commands and ports.

**Observed:** all five Go server binaries and the orchestrator TypeScript build
compiled locally. PostgreSQL TCP at `103.120.173.68:35432` and Redis TCP at
`103.120.173.68:36379` were reachable. Redis PING without credentials returned
`NOAUTH Authentication required`. Database authentication, migrations, and full
application integration remain **Unknown** until development credentials are
provided. Local billing worker flags are disabled to avoid background processing
while validating startup. No migrations or seeders were executed.

**Observed (follow-up 2026-10-14):** PostgreSQL authentication succeeded with
`DB_SSLMODE=require`; unencrypted connections were rejected by the server HBA.
Redis authentication succeeded. Billing `/health` and `/ready`, chat `/health`,
and web `/login` returned 200. Academic liveness returned 200 but readiness
returned 503 without identity gRPC. Gateway readiness confirmed healthy Redis,
billing and chat, but returned 503 without identity and academic. Identity startup
requires `PLATFORM_FACTOR_KEY` (identity `cmd/server/main.go`, factor key validation).
A read-only aggregate confirmed existing encrypted TOTP factors, so the original
key is required; full integration is still **Unknown**. Orchestrator runtime also
requires its database URL and Linear API key. No migrations or seeders were run.
All test servers were stopped.

**Observed (final local verification 2026-10-14):** the existing factor key was
supplied through the local identity environment. Identity, academic and billing
`/health` and `/ready`, chat `/health`, and gateway `/health` and `/ready` returned
200. Gateway readiness reported every configured downstream and Redis healthy.
Gateway `/api/v1/catalog/classes` returned 200 with 11 items; web `/login` and
`/kelas` returned 200; unauthenticated gateway chat returned 401. Local gRPC targets
were set to `127.0.0.1:50051` and verified after restart, following initial transient
localhost connection timeouts. These observations supersede the earlier blocked
startup results above. AI orchestrator was excluded at the user's request.
No migrations or seeders were run. Every test server was stopped and all application
and gRPC ports were checked for absence of listeners. Authenticated login/TOTP,
payment and email flows remain **Unknown** from this smoke test.
