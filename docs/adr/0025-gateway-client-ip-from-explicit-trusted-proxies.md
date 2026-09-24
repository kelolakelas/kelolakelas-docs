# ADR 0025: Gateway client IP comes from an explicit trusted-proxy list

## Status

Accepted and implemented in KEL-62.

## Context

The gateway keys its Redis rate limiter on
`rate_limit:<ClientIP>:<method>:<path>:<window>` and writes the same `ClientIP`
to the access log as `client_ip`. Until KEL-62 the router called
`SetTrustedProxies(nil)`, so `ClientIP` was always the socket address of the
peer.

That is safe but wrong behind a proxy. Web login and registration run as Next.js
Server Actions that call the gateway from the web server, so every web user can
end up sharing one bucket per path. The login quota is 5 requests per 60 seconds
by default. How much this matters depends on the deployment topology, which the
repositories do not describe (Inferred).

Trusting a forwarded header is the obvious fix, and the obvious fix is dangerous.
If the gateway believes `X-Forwarded-For` from any peer, an attacker can rotate a
forged value on every request and never reach the login limit.

## Decision

The client IP is read from a forwarded header only for peers the operator lists
explicitly. Nothing is trusted by default.

- Two variables, `TRUSTED_PROXY_CIDRS` (comma-separated IPs or CIDR ranges) and
  `TRUSTED_CLIENT_IP_HEADER` (one header name). With both empty, behaviour is
  exactly the previous behaviour: `SetTrustedProxies(nil)`, no forwarded header,
  `ClientIP` is the socket address.
- The rules are validated at startup, and a violation stops the gateway with a
  message that names the variable and the value (`internal/config/config.go`,
  `parseClientIPTrust`). Rejected:
  - an entry that is not an IP or CIDR, or a zoned address;
  - a zero-length prefix (`0.0.0.0/0`, `::/0`), which would trust every peer;
  - an invalid header name;
  - only one of the two variables set.
  The process now exits 1 on any configuration error.
- The policy is applied once, to gin's `ClientIP`, in
  `internal/delivery/http/router.go` (`ClientIPTrust`, `applyClientIPTrust`). The
  rate limiter and the access log both keep calling `ClientIP`, so they always
  agree on the client.
- A peer inside the trusted ranges may name the client in the configured header.
  gin reads that header right to left and skips addresses that are themselves
  trusted proxies. The first untrusted address wins, so a forged entry at the
  far left of a real chain is ignored. An empty header, a value that is not an
  IP, or a zoned IPv6 value falls back to the socket address.
- Only the configured header is read. `TrustedPlatform` is always cleared, so
  platform headers such as `CF-Connecting-IP` are never trusted implicitly.

## Alternatives considered

- **Trust `X-Forwarded-For` everywhere.** Rejected: it lets any caller escape the
  login limit, which is the exact risk the limit exists for.
- **A custom client-IP middleware.** Rejected: gin already implements trusted
  proxies and right-to-left header parsing. A second parser would be one more
  thing to get wrong, and it could drift from the `ClientIP` that other code reads.
- **Allow `0.0.0.0/0` with a warning.** Rejected: it is never a correct
  production setting and is indistinguishable from the attack above.

## Consequences

- The feature is off until an operator enables it. The proxy ranges for the web
  server's egress and any edge proxy are not known from the repositories. Until
  they are set, web users still share one bucket (see
  [known gaps](../08-known-gaps-and-risks.md)).
- Enabling trust alone does not separate web users. The Next.js Server Actions
  call the gateway without forwarding the user's IP, so the web server would have
  to add the configured header first. That is a separate issue.
- Every listed proxy can choose the client IP. Only list proxies that overwrite or
  append to the configured header.
- Tests: `internal/delivery/http/client_ip_trust_test.go` drives the real router,
  rate limiter, and access log (separate quotas per forwarded client, spoofing
  resistance with and without trust, the default key, header edge cases);
  `internal/config/config_test.go` covers parsing and every rejection.

Supersedes the "`SetTrustedProxies(nil)` policy unchanged" note in
[ADR 0015](0015-gateway-request-correlation-and-access-log.md), which remains the
default.
