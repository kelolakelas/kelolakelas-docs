# ADR 0021: Bounded proxy and one error envelope at the gateway

## Status

Accepted and implemented in KEL-37.

## Context

The gateway proxied every request through `httputil.NewSingleHostReverseProxy`
with an unconfigured `http.Transport` — which means no per-request deadline —
and started through gin's `r.Run` helper, which constructs an `http.Server` with
every timeout field left at zero. Nothing was bounded:

1. **A downstream that accepted a request and never answered held the client,
   a gateway goroutine, and a connection open indefinitely.** No gateway-level
   deadline existed, and no downstream service sets a bounded per-request
   server timeout either, so the request could outlive any client patience.
2. **A request body was streamed to the downstream without a size limit.** A
   caller could push an arbitrarily large body through the gateway into a
   service, consuming memory and bandwidth at the target.
3. **Every proxy failure reached the client as the standard library's own
   text.** With no `ErrorHandler`, a refused connection produced
   `502 Bad Gateway` with the plain-text `Bad Gateway` body. That is a
   different shape from the `{"status":…,"message":…,"data":…}` envelope every
   service returns, so a client could not handle a gateway failure the way it
   handles any other error, and the response leaked nothing but also said
   nothing.

The issue required documented, configurable bounds and a consistent envelope;
it named three out-of-scope items (retry/circuit breaker, fail-closed rate
limiting, downstream graceful shutdown) and three edge cases to handle
(downstream closing after headers are sent, `OPTIONS` preflight, and future
multipart uploads).

## Decision

Bound every proxied exchange in time and body size, and route every proxy
failure through one JSON envelope.

### The upstream deadline is per request, not a transport timeout

`proxyRoute` derives `context.WithTimeout` from the request context when
`ProxyOptions.UpstreamTimeout` is positive, and forwards
`c.Request.WithContext(ctx)`. A deadline on the request context covers name
resolution, connection establishment, request write, response header, and body
read, and it propagates to the downstream through the `context.Context` the
reverse proxy already honours.

The alternative — setting `ResponseHeaderTimeout` on the shared
`http.Transport` — was rejected because the transport is shared by every route.
A single global response-header deadline would cut legitimately slow responses,
notably the enrollment endpoint's tailored response, and raising it to a safe
value for that endpoint would defeat the bound on the others. The request
context is the only place the deadline can be scoped to one exchange.

The default is 30 seconds, which clears the slowest legitimate downstream call
found in the services: identity tenant location geocoding, which is capped at
5 seconds per attempt with two attempts in `pkg/maps/client.go` and
`GOOGLE_MAPS_TIMEOUT_SECONDS`.

### Body limits are enforced before forwarding

`BodyLimitMiddleware(maxBytes)` is applied ahead of the proxy. A declared
`Content-Length` over the limit is answered `413` and the request never reaches
a downstream. A body with no declared length — chunked transfer encoding —
cannot be rejected before dispatch, because its size is unknown; the body is
wrapped in `http.MaxBytesReader`, which stops the read at the limit, and the
resulting error is classified into the same `413` envelope.

The alternative — a server-level `MaxBytesReader` or a reverse-proxy
`ModifyResponse` — was rejected because neither can produce the JSON envelope:
the standard library's own limit reports `http: request body too large` as
plain text, which is the shape this ADR removes.

The default is 1 MiB, chosen to clear the largest current payloads (the Duitku
callback's ten short string fields and the registration forms) by a wide
margin.

### One envelope, and no internal detail in it

`middleware.WriteErrorEnvelope` and `AbortWithErrorEnvelope` write
`{"status":"error","message":…,"data":null}`. `classifyProxyError` maps a
transport failure to the envelope:

| Condition | Status | Message |
|---|---|---|
| `*http.MaxBytesError` from a body read | `413` | `Request body exceeds the configured limit` |
| `context.DeadlineExceeded` or any `net.Error` with `Timeout()` | `504` | `Upstream service timed out` |
| anything else | `502` | `Upstream service is unavailable` |

The envelope deliberately does not include the downstream host, path, or
transport error text, so the gateway's failure surface discloses no internal
topology. The transport error goes to the access logger with the request
identifier, so an operator can still correlate a client-visible `502`/`504`
with its cause.

The `504` classification is ordered after the `413` check, because a body read
that exceeds the limit can surface as a `*url.Error` wrapping
`*http.MaxBytesError` while the request context is still live.

`ErrorHandler` writes the envelope directly rather than panicking with
`http.ErrAbortHandler`. Gin's `Recovery` treats `ErrAbortHandler` as a broken
pipe and calls `handle` for anything else, so a panic would be converted into
the middleware's own 500 — the wrong status and the wrong shape.

### A downstream that closes mid-response is not given a second response

`ReverseProxy` can only abort an exchange when the response header has already
been sent and the body copy then fails. Appending an envelope at that point
would corrupt a stream the client has already begun to receive, so the gateway
aborts and the partial response stands. This is the documented edge case, and
`TestDownstreamClosingConnectionAfterHeadersDoesNotAppendAnEnvelope` asserts
that no second response is appended.

### The server timeouts are explicit and cross-validated

`newHTTPServer` sets `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, and
`IdleTimeout` from configuration instead of inheriting gin's zeros.
`SERVER_WRITE_TIMEOUT_SECONDS` must exceed `PROXY_UPSTREAM_TIMEOUT_SECONDS`,
because otherwise the server would cut a response the proxy is still waiting
for. That mismatch fails configuration loading with an explanatory error rather
than clamping, so an operator who sets a contradictory pair sees it at startup.

## Alternatives considered

**A transport-level `ResponseHeaderTimeout` or `http.Client.Timeout`.** Both
were rejected: the transport is shared across routes, so a global bound cannot
distinguish a legitimately slow response from a hung one, and `http.Client`
timeouts do not apply to a reverse proxy's own round trip.

**Panicking with `http.ErrAbortHandler` from `ErrorHandler`.** Rejected: gin's
`Recovery` would convert it into a 500 response, which is both the wrong status
and the wrong body shape.

**Clamping a contradictory write/upstream timeout pair silently.** Rejected: a
silent clamp hides an operator error. Failing closed at load time surfaces it.

**A server-level body limit instead of middleware.** Rejected: it cannot
produce a JSON envelope.

**Returning the transport error text in the envelope message.** Rejected: it
would disclose the downstream host and topology to any caller who can trigger a
failure.

## Consequences

- A hung downstream now costs at most `PROXY_UPSTREAM_TIMEOUT_SECONDS` of a
  connection instead of an unbounded one, and a stalled client costs at most
  the read-header bound.
- A failure response from the gateway is indistinguishable in shape from a
  failure response from any service, so a client can handle all of them the
  same way.
- An oversized body is rejected at the edge, so a service never spends memory
  on a payload the gateway would have refused.
- A downstream operation that legitimately takes longer than 30 seconds would
  be cut at the gateway. The measured worst case is well below the default and
  the value is configurable, so this is an operational tuning matter rather
  than a code change.
- The 1 MiB limit would reject a future large upload. No multipart upload route
  exists today; a future one would need either a higher limit or a per-route
  override.
- A chunked body that exceeds the limit still reaches the handler, because its
  size cannot be known in advance. The handler observes a read error rather
  than a clean request, and the response is the same `413`.
- Retry, circuit breaking, fail-closed rate limiting, and downstream graceful
  shutdown remain unimplemented, as the issue specified.
