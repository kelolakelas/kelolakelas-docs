# ADR 0030: Password reset and gateway session revocation

## Status

Accepted and implemented in KEL-66: identity PR #13 (`e5d5e2ba411c0b78b7e145aaaf9db3b838991dc8`) and gateway PR #15 (`9d259ec3aa1b0d877bc9216150a4f1a72841ecb7`). This supersedes ADR 0022's blanket assertion that the gateway cannot revoke a JWT, but not its web-only logout policy.

## Context and decision

Identity previously issued 24-hour stateless HS256 JWTs without a server-side session boundary. Recovery requires a one-time emailed credential and immediate invalidation of that user's earlier gateway sessions without affecting other users. Identity now generates 32 cryptographically random bytes, emails the hex token using `APP_URL`, and stores only a SHA-256 token digest, expiry, and optional used time in PostgreSQL. `PASSWORD_RESET_TTL_MINUTES` defaults to 60 and invalid values fail configuration loading. Issuance locks the user and replaces prior token rows. Confirmation locks the user and token, checks expiry/consumption, updates the password hash and `users.session_valid_after`, marks the token used, and removes other outstanding tokens within one transaction. Request responses for known and unknown addresses and mail errors are identical; delivery failures are logged without token or email.

JWT `iat` uses seconds. The first admissible issue time is the next whole second following reset; subsequent rapid resets advance the boundary strictly beyond the previous one, so an intervening login is revoked too. Post-reset login issues a token with `iat` at or after the boundary and `exp` relative to that issue time. The current parser allows a future `iat`; changing its policy requires coordinated review. Gateway validates the signature locally and sends the original signed bearer token to identity's internal `GET /api/v1/internal/session/check` for each protected request. Identity verifies the JWT and reads the user's boundary. It returns 204 for an active session, 401 for a revoked/unknown one, and 503 if storage is unavailable. Gateway maps an identity call failure to 503, never fail-open. The internal path is not registered at the gateway public proxy.

## Operational consequences and limits

Apply identity migration `000006_password_reset` and deploy identity before gateway. Every protected gateway call now incurs an identity/PostgreSQL read and depends on their availability; a three-second session-check HTTP timeout bounds that call. Existing JWT claim shapes, downstream role checks and web cookie logout are unchanged. Direct academic/billing JWT validation bypasses this boundary, so their direct service addresses must remain private; deployment topology was not proven by repository inspection. The reset email points to `/reset-password`, but the web page is a separate KEL-67 delivery. No generic logout revocation, refresh, MFA, or direct downstream enforcement is added.

A local gateway denylist/cache was not selected because replica divergence and outage could silently allow revoked tokens. Per-user durable identity state costs a read per request but preserves immediate gateway revocation. Rollback of gateway restores stateless acceptance, which is security-relevant; do not treat it as a transparent rollback.
