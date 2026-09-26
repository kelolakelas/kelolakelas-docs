# Dependency matrix

| Caller | Callee | Protocol / auth | Purpose | Status/evidence |
|---|---|---|---|---|
| Web | gateway | HTTP JSON, Bearer supplied by server actions | login, registration, tenant dashboard operations | Implemented: web `_actions`/`_queries` |
| Web | Gateway | HTTP JSON server actions, pending JWT in Bearer during `/platform/auth/challenge`+`/verify`; verified JWT in Bearer on `/platform/me` | platform admin second-factor login flow (KEL-105): pending token can only start challenges, session cookie written only after verify 200 | Implemented (KEL-105): web `app/platform/login/actions.ts`, `app/platform/{page,challenge/page}.tsx` |
| Gateway | identity/academic/billing | HTTP reverse proxy, service receives Bearer | public/protected API routing | Implemented: gateway router/proxy handler |
| Gateway | Identity | Internal HTTP GET `/api/v1/internal/session/check`, caller's signed JWT in Bearer header; not publicly proxied | check per-user reset boundary before every protected gateway route; identity/DB failure returns 503 | Implemented (KEL-66): gateway `handler/proxy_handler.go` `CheckSession`, `middleware/auth_middleware.go`; identity `handler/session_handler.go` |
| Academic | Identity | gRPC `:50051`, no app auth/TLS found | tenant status, public tenant info | Implemented: `pkg/grpcclient/tenant_client.go` |
| Academic | Identity | gRPC `:50051`, `tenant.CatalogPolicyService/GetPublicCatalogPolicy` over `structpb.Struct`, no app auth/TLS found | effective applied public catalog visibility for list and detail; unavailable/invalid read hides classes | Implemented (KEL-98): academic `pkg/grpcclient/catalog_policy_client.go`, identity `internal/delivery/grpc/catalog_policy_service.go`; plaintext/auth hardening remains outstanding |
| Academic | Identity | gRPC `:50051`, `tenant.PermissionService/CheckPermission` carrying `role_id`, `permission`, `tenant_id`, and `member_id` (KEL-80) | current persisted role permission before catalog, student, and enrollment operations, evaluated inside the operating tenant | Implemented: `pkg/grpcclient/permission_client.go`; identity `internal/delivery/grpc/permission_service.go`; plaintext/auth hardening remains outstanding |
| Billing | Identity | gRPC `:50051`, `tenant.PermissionService/CheckPermission` carrying `role_id`, `permission`, `tenant_id`, and `member_id` (KEL-80) | `billing:read` before tenant transaction list/detail (KEL-57); parents, webhook, and internal routes do not call it | Implemented: `pkg/identity/permission_client.go`; plaintext/auth hardening remains outstanding |
| Academic | Billing | HTTP internal bearer | payment invoice creation for enrollment | Implemented: `pkg/billing/client.go` |
| Billing | Academic | HTTP internal bearer | activate paid enrollment | Implemented: `pkg/academic/client.go` |
| Identity | Redis | Redis TCP/TLS optional | cache role permission arrays | Implemented: `pkg/database/redis.go` |
| Gateway | Redis | Redis TCP/TLS optional | rate limit counters | Implemented: gateway main/middleware |
| Identity | Resend | HTTPS SDK | invitation email | Implemented: `pkg/email/resend.go` |
| Billing | Resend | HTTPS REST | payment reminder email | Implemented: `pkg/email/resend.go` |
| Billing | Duitku | HTTPS REST/HMAC | invoice and callback | Implemented: `pkg/duitku/client.go` |
| Identity | Google Maps | HTTPS REST | optional geocode/reverse geocode | Implemented when enabled/key present: `pkg/maps/client.go` |
