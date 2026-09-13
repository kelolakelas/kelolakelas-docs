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

No `.env.example`, Compose file, or setup automation was found. Database requirements are inferred from `internal/config/config.go` and `pkg/database/db.go` in each service.
