# ADR 0081: authenticated existing Teacher invitation acceptance

Status: Accepted for KEL-225; 27 October 2026 (Asia/Jakarta).

## Context

An invitation formerly registered only a new account and rejected every existing email. KEL-224 already supports own active membership selection. Linking an existing account by possession of the invitation URL alone would not establish control of that account. Existing `is_used` also represents revoke/resend, so it cannot identify a successful acceptance replay.

## Decision

**Implemented:** existing-account invitations are limited to users with a live active system Teacher membership and the system Teacher target role. Existing custom-role/persona conversion and platform-approved Creator linking are separate workflows. New-account invitations retain their existing role validation and Creator approval rules.

`POST /api/v1/invitations/accept` requires a signed ordinary non-parent/non-platform session. Identity checks its expiry and the locked user's password-reset boundary, then compares the canonical stored user email with the invitation email. This authenticates control of the existing account; no new generic email-verification or OTP system is introduced. The browser cannot supply the user, tenant, role or member to grant.

The transaction takes the target tenant lock before the invitation lock, matching resend's tenant→invitation order. A user UPDATE lock serializes different invitations for one user. Live source Teacher membership/tenant/role and target role are held under SHARE locks. Inactive/deleted target collisions fail explicitly. An already active target membership is acknowledged without changing its role. Otherwise a single membership is inserted, protected by the existing tenant/user unique constraint.

Migration `000017` adds nullable `tenant_invitations.accepted_member_id` referencing the resulting membership. Membership creation and invitation consumption/marker commit together. A successful replay returns the same active membership, including after invitation expiry; a revoked/replaced/registration-used token without that marker fails. Replay cannot restore an inactive/deleted membership or bypass live account/Teacher/tenant checks. No account, password, wallet or old membership changes occur.

Verification adds authoritative `tenant_name`, `role_name`, and `existing_account` display facts. The web offers registration or authenticated acceptance accordingly. Login returns only to the exact local invitation path. Account change clears both session cookies and the client route cache; successful accept invalidates the dashboard layout and asks the user to choose the tenant through KEL-224. Acceptance itself never switches cookies or issues a new session.

## Alternatives and consequences

Reusing public registration would either create a second identity or trust the link for account ownership. Inferring success from `is_used` plus any matching membership would also treat revoked tokens as accepted. The nullable marker avoids those ambiguities with an additive migration. General existing-role invitations would expand privilege policy beyond this issue and are not implemented.

Deploy migration→identity→gateway→web. Roll back consumers before identity; keep the nullable column and replay markers while accepted invitations exist. Down migration removes only the marker column, so used tokens then fail closed instead of being treated as fresh. No production data repair is needed. Existing invitation delivery outcome and approved Creator registration remain unchanged.

## Evidence

Identity `internal/repository/existing_invitation.go`, `internal/usecase/existing_invitation.go`, `internal/delivery/http/handler/existing_invitation{,_integration_test}.go`; gateway `router.go` and `tenant_session_route_test.go`; web invitation actions/page/form and `lib/auth-routing.ts`. [Acceptance evidence](../evidence/kel225-existing-teacher-invitations.md).
