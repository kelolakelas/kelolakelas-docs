# Gateway surface

**Implemented gateway-owned endpoints:** `GET /health`, `GET /swagger`, `GET /swagger/*any`, and prefixed service Swagger UIs. Every `/api/v1` business route is proxied; no response envelope is added. Route registration is the authority: `kelolakelas-api-gateway/internal/delivery/http/router.go:29-138`.

The gateway’s public request paths and downstream paths are identical. It groups identity registration/invitations and academic catalog as public, and billing callback as public. All other listed paths receive gateway JWT validation before forwarding. This does not remove the downstream service’s own validation requirement.

For a complete route-by-route list, including handler (`ProxyTo…Service`), downstream target, authentication, and code evidence, see the [endpoint matrix](endpoint-matrix.md).
