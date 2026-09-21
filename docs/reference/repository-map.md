# Repository map

| Repository | Important layout | Entry points / generated artifacts |
|---|---|---|
| `kelolakelas-web` | `app/` pages, actions, schemas, components; `proxy.ts` | Next app, server actions; `_docs/api` is copied/stale Swagger material |
| `kelolakelas-api-gateway` | `cmd/server`, `internal/config`, HTTP handler/middleware | `cmd/server/main.go` |
| `kelolakelas-identity-service` | domain/repository/usecase/delivery, `migrations`, `seeders`, `pkg` | HTTP + gRPC `cmd/server/main.go`; generated `docs`, protobuf Go |
| `kelolakelas-academic-service` | same Go layering, migrations, `pkg/grpcclient`, `pkg/billing` | `cmd/server/main.go`; generated `docs`, protobuf Go |
| `kelolakelas-billing-service` | same Go layering, migrations, `pkg/duitku`, `pkg/email`, `pkg/academic` | `cmd/server/main.go`; generated Swagger |

Excluded from detailed analysis: `.git`, generated dependency/build directories if present, generated Swagger/protobuf code except as contract corroboration. Checked-in compiled binaries and `dump.rdb` were removed from the repositories and are ignored via `.gitignore` (KEL-41). No applicable source `AGENTS.md` beyond `kelolakelas-web/AGENTS.md` and its `CLAUDE.md` pointer was found.
