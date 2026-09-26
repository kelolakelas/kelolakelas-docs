# ADR 0035: Member role change allows Teacher moves, forbids self changes, keeps the Creator guards

Status: Implemented (KEL-79)

## Context

`PUT /api/v1/members/:id/role` refused to change any member whose current role was a
system role (`roles.tenant_id IS NULL`), answering 403 "System role cannot be changed".
The seeded system roles are `Creator` and `Teacher`, so a tenant could never move a
Teacher to one of its own roles. The route also did not check who the target was, so a
caller holding `member:update` could re-role their own membership, for example to escape
a role an administrator assigned.

KEL-94 already forbids granting the system Creator role through this route (only the
platform-approved Creator request flow grants it, ADR 0028/0029), and KEL-76 grants
`member:update` only through an active membership that still carries the token's role
(ADR 0034). The policy for demoting or removing a Creator has not been decided.

## Decision

`memberRepository.UpdateRole` receives the verified caller (`domain.Caller`) from the use
case, which still runs the `member:update` check first. All remaining guards run inside
the single update transaction, before the write, in this order:

1. the member must belong to the token's tenant → 404 `ErrMemberNotFound`;
2. the target is not the caller's own membership → 409 `ErrMemberSelfRoleChange`
   ("You cannot change your own member role"). The member row matches the token's
   `member_id` claim, or its `user_id` for tokens issued without that claim (a user has
   at most one membership per tenant);
3. the target role belongs to the tenant or is a system role → otherwise 409
   `ErrMemberRoleConflict`;
4. the target role is not the system Creator → otherwise 403 `ErrCreatorGrantForbidden`
   (KEL-94);
5. the member's current role is not the system Creator → otherwise 403
   `ErrMemberRoleForbidden`, message now "Creator role cannot be changed".

The current-role guard is narrowed from "any system role" to "the system Creator role"
(`tenant_id IS NULL AND name = 'Creator'`). A tenant custom role that happens to be named
`Creator` is not the system Creator.

The self check is placed in the repository transaction, not the use case, so it is
atomic with the update and needs no extra read.

## Consequences

- Any caller with `member:update` in the tenant can move a system Teacher to a tenant
  custom role, and back.
- No caller can change their own role through this route, including a Creator.
- Creator demotion stays blocked. This ADR does not make the Creator a permanent owner:
  when a demotion policy is decided, step 5 is the one place to change.
- The HTTP status codes for existing outcomes are unchanged. Only the 403 message text
  for a current Creator changed; no web or gateway code matches on it.
- Self-delete and the web member-removal UI stay with KEL-81. Academic and billing token
  revocation stays with KEL-80.

## Evidence

Identity PR [#22](https://github.com/kelolakelas/kelolakelas-identity-service/pull/22),
squash `cf5d4f6a49c90abc5c215768e07f3489bb33ecd3`: `internal/repository/member_repository.go`
(`UpdateRole`, `isOwnMembership`, `isSystemCreatorRole`), `internal/domain/member.go`
(`ErrMemberSelfRoleChange`), `internal/usecase/member_usecase.go`,
`internal/delivery/http/handler/member_handler.go`. Tests:
`internal/repository/{member_role_update,creator_role_guard}_test.go`,
`internal/usecase/member_usecase_test.go`,
`internal/delivery/http/handler/member_role_update_test.go`, and the PostgreSQL caller ×
target matrix `internal/delivery/http/middleware/kel79_member_role_integration_test.go`
(guarded by `KEL79_TEST_DATABASE_URL`, run locally against PostgreSQL 16: 17 leaf
subtests passed). PR and post-merge `gate` checks passed.
