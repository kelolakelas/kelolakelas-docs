# ADR 0037: Creator request browser queue with caller-bound authorization

## Context

KEL-94 introduced tenant Creator requests and KEL-95 introduced platform decisions, but neither supplied a platform-wide read queue or a browser workflow. A tenant-scoped list cannot be repurposed for platform administrators without crossing the tenant authorization boundary. The existing decision transaction already rechecks active platform assignment and ensures once-only grants.

## Decision

Add `GET /api/v1/platform/creator-requests` to identity's authenticated `platform` group, behind `RequireActivePlatform`, and proxy it through gateway `RequirePlatform()`. Its SQL selects only pending requests across tenants, joined to tenant name, in ascending creation time and id order. Its response is a bare `data` array inside the existing success envelope, without pagination or optional status filter. Fields are limited to request id, tenant id/name, requester user id, target email/user id, reason, status/timestamps and decision fields. It contains no token, hash, or unrelated member record. Repository failure is a generic 500; inactive assignments are denied on every request.

Web introduces a tenant request/status route and a distinct platform queue/decision route. Server components fetch uncached with the current caller's session; actions forward the same session token, never a service credential or a tenant token to platform routes. Scope checks and hidden controls in web are UX only. Identity remains authoritative for live Creator membership and platform assignment, including a revoked admin who submits from an old page. Existing tenant list and approve/reject contracts stay unchanged. Form labels, keyboard-native submission, confirmation and error/conflict states are handled at the browser layer.

## Consequences and evidence

The pending-only, oldest-first and unpaginated queue is the smallest reversible read contract; large queues may need bounded pagination later. No configuration editor, Creator revocation or tenant impersonation is added. Existing ADR 0029's statement that an approval UI is unimplemented is superseded by this ADR; its transaction/security design remains valid. Evidence: identity [PR #24](https://github.com/kelolakelas/kelolakelas-identity-service/pull/24) (`fd033ccac7649e34f3b0bce85eadd4321dce95f5`), gateway [PR #21](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/21) (`7659e14a50083be8ddeee72ffaa7caa3f373800e`), web [PR #33](https://github.com/kelolakelas/kelolakelas-web/pull/33) (`123e2c76d8796ca4f0381a4835171d62612e251b`). Go race/vet/build, PostgreSQL repository integration, web 401 tests/typecheck/lint/build and PR gates passed; live browser E2E was not run.
