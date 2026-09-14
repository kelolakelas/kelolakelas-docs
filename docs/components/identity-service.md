# Identity service (`kelolakelas-identity-service`)

**Implemented:** Gin HTTP server default `:8080`, gRPC tenant service fixed at `:50051`, PostgreSQL via GORM, optional Redis, Resend invitation delivery, and optional Google Maps geocoding. Startup wiring is in `cmd/server/main.go:33-158`.

Data owned by its migrations includes users, tenants, tenant members, roles, permissions, role permissions and invitations. The HTTP API handles registration/login, tenant registration/settings/location, invitations, member operations and roles. Handler/ use-case/ repository separation is present under `internal/delivery`, `internal/usecase`, and `internal/repository`.

JWT issuance uses HS256 and has a 24-hour validity. Login selects a tenant/member context according to `AuthUsecase.Login`; Redis permission caching is populated during tenant registration and login when Redis is available. Tenant-administration mutations query persisted role permissions rather than relying on that cache (`internal/usecase/permission.go`, `internal/repository/member_repository.go:78-81`). No refresh-token route, logout route, or session-revocation check was found (`pkg/jwt/jwt.go`, `internal/usecase/auth_usecase.go`).

The gRPC service implements `ValidateTenantStatus` and `GetTenantPublicInfo`; the latter is used by the public academic catalog client. gRPC server/client transport security and authentication are not configured in the inspected code.
