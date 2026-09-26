# ADR 0029: Platform-admin Creator decisions with once-only grants

## Context

KEL-94 left Creator requests pending forever: a tenant Creator could request an additional Creator, but no principal could decide the request or grant the role. KEL-95 adds the platform-admin decision step. The risks are cross-tenant escalation, approval replay by concurrent admins, and a role granted to an email that changed owner between submission and decision.

## Decision

Active platform admins decide pending Creator requests through `POST /api/v1/platform/creator-requests/{id}/approve` and `POST /api/v1/platform/creator-requests/{id}/reject`, mounted behind the gateway `RequirePlatform()` claim check and re-verified against a live `platform_admin_assignments` row locked `FOR SHARE` inside the decision transaction, so a revoked admin is refused even with an unexpired JWT.

The entire decision — admin check, request lock (`FOR UPDATE`), target re-resolution, grant, request update, and audit insert — runs in one identity transaction. Approving a registered target grants the system Creator role exactly once: an existing active membership is upgraded, and the replay of any decided request returns 409 because status is re-checked under the lock. `creator_request_audit` stores one row per request (UNIQUE `request_id`) with actor, decision, and rejection reason. Rejecting stores the trimmed reason (required, max 2000 characters) and never touches membership or invitations.

The target email is re-resolved under the lock at decision time. A request whose email now belongs to a different or missing user, a parent target, a suspended or deleted tenant, or an inactive/deleted membership is stale and produces no grant (409). Approving an unregistered email creates an email-bound `tenant_invitations` row linked by `creator_requests.invitation_id` (UNIQUE) and keeps `target_user_id` NULL; `RegisterInvitedUserTx` locks the invitation `FOR UPDATE` and allows Creator redemption only when exactly one approved request matches invitation, tenant, and email with no target user. Legacy and administrator-created Creator invitations without such a request remain 403. Invitation email delivery is best-effort: failure is logged and never fails the decision (same pattern as KEL-36).

## Consequences

Apply identity migration `000005_creator_decisions` before serving the routes; it is idempotent and mirrored by a down migration. Approval of an existing non-Creator member upgrades that membership in place (one membership per user per tenant). An approved-unaccepted request grants nothing until the invitee registers through the bound invitation; there is no resend mechanism yet. Creator revocation remains unimplemented (KEL-95 out of scope).

> **Superseded in part by [ADR 0037](0037-creator-request-browser-queue.md):** KEL-103 adds the browser approval UI and a protected pending cross-tenant read queue; the KEL-95 decision transaction remains unchanged.

## Evidence

Identity PR [#12](https://github.com/kelolakelas/kelolakelas-identity-service/pull/12), merge `b54610ff348996ea38d5f2bd82ac8d3da9bed71a`: `internal/repository/creator_decision_repository.go`, `internal/usecase/creator_decision_usecase.go`, `internal/delivery/http/handler/creator_decision_handler.go`, `internal/repository/user_repository.go`, `migrations/000005_creator_decisions.{up,down}.sql`, and matching tests. Gateway PR [#14](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/14), merge `832cbd6acc629f5470452edd91e6dddf60eeec45`: `internal/delivery/http/router.go` and `creator_decision_route_test.go`. Both PR and post-merge `gate` checks passed; a live PostgreSQL integration test was not run.
