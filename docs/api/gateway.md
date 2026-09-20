# Gateway surface

**Implemented gateway-owned endpoints:** `GET /health`, `GET /swagger`, `GET /swagger/*any`, and prefixed service Swagger UIs. Every `/api/v1` business route is proxied; no successful response envelope is added. Route registration is the authority: `kelolakelas-api-gateway/internal/delivery/http/router.go:38-147`.

The gateway’s public request paths and downstream paths are identical. It groups identity registration/invitations and academic catalog as public, and billing callback as public. All other listed paths receive gateway JWT validation before forwarding. This does not remove the downstream service’s own validation requirement.

For a complete route-by-route list, including handler (`ProxyTo…Service`), downstream target, authentication, and code evidence, see the [endpoint matrix](endpoint-matrix.md).

## Gateway-generated error envelope

**Implemented:** the gateway adds no envelope to a successful proxied response, but it owns the response when a request never reaches a healthy downstream or when a body exceeds the configured limit. Those cases answer with the same envelope every other service uses:

```json
{ "status": "error", "message": "…", "data": null }
```

| Condition | Status | `message` |
|---|---|---|
| Downstream does not answer within `PROXY_UPSTREAM_TIMEOUT_SECONDS` | `504` | `Upstream service timed out` |
| Downstream cannot be reached (refused, DNS failure, reset before the response header) | `502` | `Upstream service is unavailable` |
| Request body exceeds `PROXY_MAX_BODY_BYTES` | `413` | `Request body exceeds the configured limit` |

The `413` is produced before the request is forwarded when the client declares a `Content-Length` over the limit. A chunked body declares no length, so it can only be stopped while it is read; the read error is classified into the same envelope and still returns `413`. A `413`, `502`, or `504` response body never contains the downstream host, path, or transport error text, so the gateway's failure surface does not disclose internal topology. Evidence: `internal/delivery/http/handler/proxy_handler.go`, `internal/delivery/http/middleware/error_response.go`, `internal/delivery/http/middleware/body_limit_middleware.go`.

## Context headers

**Implemented:** the gateway owns two context headers and accepts neither from a client. `X-Tenant-ID` and `X-Internal-Service-Credential` are deleted from every inbound request before any route or middleware runs, on public and protected routes alike. On protected routes the gateway then publishes `X-Tenant-ID` from the verified JWT `tenant_id` claim, and only when that claim names a tenant; a tenantless token leaves the header absent. A protected request carrying a token with no `user_id`, or a non-parent token without a usable tenant claim, is refused with 401 `Unauthorized: Invalid token`. Evidence: `internal/delivery/http/middleware/context_header_middleware.go`, `internal/delivery/http/middleware/auth_middleware.go`; see [ADR 0017](../adr/0017-gateway-context-header-trust-boundary.md).

## Request correlation header

**Implemented:** every gateway response carries `X-Request-ID`, on all routes including `/health`, the Swagger shell, proxied calls, 404s, CORS rejections, and rate-limit rejections. A caller that supplies an inbound `X-Request-ID` keeps it when it is at most 64 characters and uses only `a-z`, `A-Z`, `0-9`, `-`, `_`, `.`; every other value is replaced with a generated identifier. The same value is sent to the downstream service, so a response header and a downstream log can be tied to one request. The header is a correlation value, not an authenticated identity, and nothing authorizes on it. Evidence: `internal/delivery/http/middleware/request_id_middleware.go`; see [ADR 0015](../adr/0015-gateway-request-correlation-and-access-log.md).
