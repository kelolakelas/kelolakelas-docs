# Gateway surface

**Implemented gateway-owned endpoints:** `GET /health`, `GET /swagger`, `GET /swagger/*any`, and prefixed service Swagger UIs. Every `/api/v1` business route is proxied; no response envelope is added. Route registration is the authority: `kelolakelas-api-gateway/internal/delivery/http/router.go:38-147`.

The gateway’s public request paths and downstream paths are identical. It groups identity registration/invitations and academic catalog as public, and billing callback as public. All other listed paths receive gateway JWT validation before forwarding. This does not remove the downstream service’s own validation requirement.

For a complete route-by-route list, including handler (`ProxyTo…Service`), downstream target, authentication, and code evidence, see the [endpoint matrix](endpoint-matrix.md).

## Context headers

**Implemented:** the gateway owns two context headers and accepts neither from a client. `X-Tenant-ID` and `X-Internal-Service-Credential` are deleted from every inbound request before any route or middleware runs, on public and protected routes alike. On protected routes the gateway then publishes `X-Tenant-ID` from the verified JWT `tenant_id` claim, and only when that claim names a tenant; a tenantless token leaves the header absent. A protected request carrying a token with no `user_id`, or a non-parent token without a usable tenant claim, is refused with 401 `Unauthorized: Invalid token`. Evidence: `internal/delivery/http/middleware/context_header_middleware.go`, `internal/delivery/http/middleware/auth_middleware.go`; see [ADR 0017](../adr/0017-gateway-context-header-trust-boundary.md).

## Request correlation header

**Implemented:** every gateway response carries `X-Request-ID`, on all routes including `/health`, the Swagger shell, proxied calls, 404s, CORS rejections, and rate-limit rejections. A caller that supplies an inbound `X-Request-ID` keeps it when it is at most 64 characters and uses only `a-z`, `A-Z`, `0-9`, `-`, `_`, `.`; every other value is replaced with a generated identifier. The same value is sent to the downstream service, so a response header and a downstream log can be tied to one request. The header is a correlation value, not an authenticated identity, and nothing authorizes on it. Evidence: `internal/delivery/http/middleware/request_id_middleware.go`; see [ADR 0015](../adr/0015-gateway-request-correlation-and-access-log.md).
