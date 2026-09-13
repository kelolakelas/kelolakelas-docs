# API overview

The canonical public API entry point is the gateway’s `/api/v1` group. Gateway paths intentionally match downstream paths. Three service Swagger documents exist at each service’s `/swagger/*any` and the gateway exposes their UIs under `/identity/swagger/*any`, `/academic/swagger/*any`, and `/billing/swagger/*any`.

Responses in handlers commonly use `{ "status", "message", "data" }`; do not assume exact body detail when a handler returns a generic `gin.H` rather than a named DTO. Request/response schema names in the matrix are code/Swagger-oriented references, not an assertion that all generated docs are current.

See [endpoint matrix](endpoint-matrix.md), then service detail pages: [gateway](gateway.md), [identity](identity.md), [academic](academic.md), [billing](billing.md). [Authentication](authentication.md) documents the common Bearer token and internal credential boundary.
