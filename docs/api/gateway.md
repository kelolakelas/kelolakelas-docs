# Gateway surface

**Implemented gateway-owned endpoints:** `GET /health`, `GET /swagger`, `GET /swagger/*any`, and prefixed service Swagger UIs. Every `/api/v1` business route is proxied; no response envelope is added. Route registration is the authority: `kelolakelas-api-gateway/internal/delivery/http/router.go:33-142`.

The gateway’s public request paths and downstream paths are identical. It groups identity registration/invitations and academic catalog as public, and billing callback as public. All other listed paths receive gateway JWT validation before forwarding. This does not remove the downstream service’s own validation requirement.

For a complete route-by-route list, including handler (`ProxyTo…Service`), downstream target, authentication, and code evidence, see the [endpoint matrix](endpoint-matrix.md).

## Request correlation header

**Implemented:** every gateway response carries `X-Request-ID`, on all routes including `/health`, the Swagger shell, proxied calls, 404s, CORS rejections, and rate-limit rejections. A caller that supplies an inbound `X-Request-ID` keeps it when it is at most 64 characters and uses only `a-z`, `A-Z`, `0-9`, `-`, `_`, `.`; every other value is replaced with a generated identifier. The same value is sent to the downstream service, so a response header and a downstream log can be tied to one request. The header is a correlation value, not an authenticated identity, and nothing authorizes on it. Evidence: `internal/delivery/http/middleware/request_id_middleware.go`; see [ADR 0015](../adr/0015-gateway-request-correlation-and-access-log.md).
