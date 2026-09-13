# Dependency matrix

| Caller | Callee | Protocol / auth | Purpose | Status/evidence |
|---|---|---|---|---|
| Web | gateway | HTTP JSON, Bearer supplied by server actions | login, registration, tenant dashboard operations | Implemented: web `_actions`/`_queries` |
| Gateway | identity/academic/billing | HTTP reverse proxy, service receives Bearer | public/protected API routing | Implemented: gateway router/proxy handler |
| Academic | Identity | gRPC `:50051`, no app auth/TLS found | tenant status, public tenant info | Implemented: `pkg/grpcclient/tenant_client.go` |
| Academic | Billing | HTTP internal bearer | payment invoice creation for enrollment | Implemented: `pkg/billing/client.go` |
| Billing | Academic | HTTP internal bearer | activate paid enrollment | Implemented: `pkg/academic/client.go` |
| Identity | Redis | Redis TCP/TLS optional | cache role permission arrays | Implemented: `pkg/database/redis.go` |
| Gateway | Redis | Redis TCP/TLS optional | rate limit counters | Implemented: gateway main/middleware |
| Identity | Resend | HTTPS SDK | invitation email | Implemented: `pkg/email/resend.go` |
| Billing | Resend | HTTPS REST | payment reminder email | Implemented: `pkg/email/resend.go` |
| Billing | Duitku | HTTPS REST/HMAC | invoice and callback | Implemented: `pkg/duitku/client.go` |
| Identity | Google Maps | HTTPS REST | optional geocode/reverse geocode | Implemented when enabled/key present: `pkg/maps/client.go` |
