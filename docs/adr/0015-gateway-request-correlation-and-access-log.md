# ADR 0015: Gateway request correlation and a single structured access log

## Status

Accepted and implemented in KEL-38.

## Context

The gateway was the only Go edge component whose log output was not usable for
diagnosis. Three problems compounded:

1. **No correlation identifier.** Nothing tied a client's failing response to the
   log line that described it, and nothing tied a gateway log line to the
   downstream service that handled the request. Each Go service logged
   independently with no shared key, so reconstructing one user's journey meant
   matching on timestamp and path.
2. **Logging was per-service and unstructured.** `ProxyToIdentityService`,
   `ProxyToAcademicService`, `ProxyToBillingService`, and `ProxyWithPrefixStrip`
   each emitted their own `slog.Info("Proxying request to …")` line from inside the
   reverse-proxy `Director`. A line was emitted only if the request reached the
   `Director` at all, so requests rejected by CORS or by the rate limiter were
   completely invisible. Response status and latency were never recorded, which
   meant the gateway could not answer "what did we return and how slow was it".
3. **The default handler was text.** `main.go` used `slog.Default()`, so gateway
   output was unstructured text while identity, academic, and billing already
   installed `slog.NewJSONHandler`. Any log pipeline would have had to parse two
   formats.

The access log also has to be safe by construction. Request paths in this system
carry `?invitation_token=…` on the public invitation verification route, and every
authenticated request carries `Authorization: Bearer …`. A naive access log that
records `RequestURI` or dumps headers would write live credentials to disk, where
they outlive their usefulness and bypass the JWT expiry that protects them
everywhere else.

## Decision

The gateway accepts, forwards, returns, and logs a single request correlation
identifier, and it emits exactly one structured access log line per request from a
single middleware.

**Identifier.** `X-Request-ID` is the header. An inbound value is reused only when
it is at most 64 characters and contains only `a-z`, `A-Z`, `0-9`, `-`, `_`, and
`.`. Anything else — including a value containing a newline, which would forge
additional log records — is discarded and replaced with a freshly generated
identifier: 16 bytes from `crypto/rand`, hex encoded. The identifier is set on the
forwarded request, returned as a response header, and stored in the gin context
under `request_id`.

**Ordering.** `RequestIDMiddleware` is registered before `Recovery`, CORS, and the
rate limiter, and `AccessLogMiddleware` immediately after it. This is what makes
rejected requests observable: a request refused by CORS (403) or by the rate limiter
(429) still carries an identifier and still produces one access log line.

**One line per request.** `AccessLogMiddleware` builds the record after the handler
chain returns, so it sees the final status and the total handler latency. The four
per-service `slog.Info` calls were deleted rather than kept alongside it. Each proxy
handler now records which service it targets in the `proxy_target` context key, and
the access log reads that value into its `target` field. The result is one line
carrying: `request_id`, `method`, `path`, `status`, `latency_ms`, `client_ip`, and
`target` when the request was proxied.

**Redaction.** The middleware logs `c.Request.URL.Path`, never `RequestURI` or
`Request.URL.String()`, so the query string — and therefore
`?invitation_token=…` — can never appear. The `Authorization` header and the
request body are not logged at all.

**Encoding.** `main.go` installs `slog.NewJSONHandler(os.Stdout, nil)` as the
default handler, matching the other three services.

Deliberately unchanged: routing, the `SetTrustedProxies(nil)` policy, CORS
behaviour, rate-limit behaviour and fail-open semantics, and `X-Tenant-ID`
propagation.

## Alternatives considered

- **Accept any inbound `X-Request-ID` verbatim.** Simplest, and it lets a caller
  correlate its own retries for free. Rejected: the value is attacker-controlled and
  is written into logs. A value containing a newline or a JSON fragment forges or
  corrupts records, and an unbounded value lets a caller grow every log line. The
  bounded-charset check keeps the useful part — client-supplied correlation — while
  removing the injection and unbounded-growth surfaces.
- **Use a vendor or W3C header such as `traceparent`.** Rejected for this change:
  distributed tracing is explicitly out of scope for KEL-38, and adopting
  `traceparent` implies a propagation and sampling model that no service implements
  yet. A plain `X-Request-ID` is the smallest thing that satisfies correlation
  without pretending to be a trace context.
- **Keep per-service proxy logs and add the access log.** Rejected: duplicate lines
  per request, and the per-service lines still miss rejected requests. Replacing them
  is strictly more information from fewer lines.
- **Log `RequestURI` and redact sensitive parameters by name.** Rejected: a deny-list
  of parameter names must be maintained forever and silently fails when a new
  sensitive parameter is added. Dropping the query string entirely cannot fail open.
- **Emit a separate log line for rejections.** Rejected: it makes "how many requests
  did we reject" unanswerable by counting, and gives rejection paths a different
  record shape. A rejection is a normal request with a 4xx status.
- **Make an invalid inbound identifier a 400.** Rejected: a malformed correlation
  header is not a malformed request, and failing the call would let a caller with a
  stale header break its own request. Replacing the value preserves both the call and
  traceability.

## Consequences

- Every gateway response, including 403 CORS rejections, 429 rate-limit responses,
  and 404s for unrouted paths, carries `X-Request-ID`. A client can quote it in a bug
  report and an operator can find the exact request.
- Gateway logs are JSON, one line per request, with status and latency. Counting by
  `status`, or averaging `latency_ms`, works directly on the stream.
- The `target` field attributes each request to a downstream service without a
  second log line, so per-service request volume is derivable at the gateway.
- Rejected requests are now visible in the log, which is a behaviour change in
  observability only: the CORS and rate-limit decisions themselves are unchanged.
- Correlation currently stops at the gateway. A downstream service receives
  `X-Request-ID` but does not yet put it in its own log records, so joining gateway
  and service logs still needs the timestamp and path.
- The identifier is a correlation value, not a security boundary. It is not
  authenticated, and a caller that supplies one is trusted to mean it; nothing
  authorizes on it.
- Log volume increases because every request now writes one line, including health
  checks and Swagger asset requests, and because rejected requests that previously
  wrote nothing now write a line. Without aggregation or retention policy this grows
  on disk.

Known gaps this decision leaves open: downstream services do not emit the
`X-Request-ID` they receive, so a request cannot yet be followed across the gateway
boundary in logs; no metrics or tracing endpoint consumes the access log; there is no
log aggregation, rotation, or retention configuration in any repository; and the
identifier is not propagated to the web application, which generates its own request
flow without one.
