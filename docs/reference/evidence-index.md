# Evidence index

Source paths are repository-relative to `/home/faridzam/workspace/kelolakelas`. Line numbers refer to the analyzed snapshot and are provided where stable.

| Claim area | Primary evidence |
|---|---|
| Revisions/state | `git -C kelolakelas-{web,api-gateway,identity-service,academic-service,billing-service} branch --show-current`, `rev-parse HEAD`, `status --short` recorded in root README |
| Web routes/server actions/cookies/auth routing | `kelolakelas-web/app/**/page.tsx`, `app/(auth)/*/_actions/actions.ts`, `app/(public)/kelas/[id]/_actions/actions.ts`, `app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`, `app/(dashboard)/dashboard/parent/students/**`, `app/(dashboard)/dashboard/parent/enrollments/**`, `lib/auth-routing.ts`, `lib/auth-session.ts`, `lib/catalog.ts`, `lib/enrollment.ts`, `lib/payment-status.ts`, `proxy.ts`, `proxy.test.ts` |
| Gateway public/protected routes | `kelolakelas-api-gateway/internal/delivery/http/router.go:29-142` |
| Gateway proxy, CORS/rate limiting | `internal/delivery/http/handler/proxy_handler.go:39-86`; `middleware/cors_middleware.go`; `middleware/rate_limit_middleware.go:15-121` |
| JWT and identity startup | `kelolakelas-identity-service/pkg/jwt/jwt.go:17-75`; `cmd/server/main.go:33-158` |
| Identity HTTP behavior/RBAC/invites | `internal/delivery/http/handler/*.go`; `internal/usecase/{auth,tenant,invitation,member,role}_usecase.go` |
| Identity gRPC | `internal/delivery/grpc/tenant_handler.go`; `pkg/proto/tenant/tenant_grpc.pb.go` |
| Academic HTTP/contracts | `kelolakelas-academic-service/cmd/server/main.go:92-154`; `internal/delivery/http/handler/*.go`; `internal/domain/*.go`; student ownership/delete guard in `student_handler.go` and `student_usecase.go` |
| Academic catalog authorization | `kelolakelas-academic-service/internal/delivery/http/middleware/permission_middleware.go`; `pkg/grpcclient/permission_client.go`; route mapping in `cmd/server/main.go`; identity `internal/delivery/grpc/permission_service.go` |
| Enrollment and inter-service billing | `academic/internal/usecase/enrollment_usecase.go`; `academic/pkg/billing/client.go`; `billing/internal/usecase/transaction_usecase.go`; `billing/pkg/academic/client.go` |
| Billing/Duitku/worker | `billing/internal/delivery/http/handler/transaction_handler.go`; `pkg/duitku/client.go`; `internal/usecase/subscription_worker.go` |
| Durable payment reconciliation | `billing/internal/domain/payment_reconciliation.go`; `internal/repository/payment_reconciliation_repository.go`; `internal/usecase/reconciliation_worker.go`; `migrations/20260915000000_payment_reconciliations.up.sql`; ADR [0001](../adr/0001-durable-payment-reconciliation.md) |
| Email/maps/Redis | identity `pkg/email/resend.go`, `pkg/maps/client.go`, `pkg/database/redis.go`; billing `pkg/email/resend.go` |
| Schema | each service `migrations/*.up.sql`, summarized under `docs/data/` |
| Config/defaults and JWT secret validation | each service `internal/config/config.go` and `internal/config/config_test.go`; web `process.env` uses identified in component docs |
| Tests/build tooling | each Go `Makefile`, `*_test.go`, web `package.json` |

Generated service Swagger (`docs/swagger.json`) was consulted as contract corroboration. It is not sole evidence because route registration/handlers are executable current-state authority. Generated Go protobuf files corroborate the gRPC service methods; no `.proto` source was found.
