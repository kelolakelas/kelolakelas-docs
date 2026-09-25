# ADR 0028: Tenant Creator requests without direct grants

## Context

Tenant invitations and member-role updates could target the system Creator role without platform review. KEL-94 requires an active tenant Creator to request an additional Creator while leaving approval and the actual role grant for a separate platform-admin workflow. Tokens may outlive membership changes, and previously issued invitations may remain redeemable.

## Decision

Identity provides `POST` and `GET /api/v1/creator-requests` for the tenant in the verified JWT, with authorization against an active, live Creator membership in that tenant. Creation stores target email/user, reason and `pending` status, without changing tenant membership. A partial unique index on `(tenant_id, target_email)` prevents duplicate pending requests; existing active Creator targets are rejected. Invitation creation and transactional legacy invitation redemption reject the system Creator role, as does member role update within its transaction; initial tenant registration remains the path for the first Creator. Gateway only forwards the new tenant-scoped routes; identity owns the live authorization decision.

## Consequences

Apply identity migration `000004_creator_requests` before serving the routes. Concurrent duplicate inserts resolve through the unique constraint and return 409; invalid targets return 400 and unauthorized principals 403. Revoking an applicant's Creator membership removes their ability to create or list requests even with an unexpired JWT. Approval, rejection, actual grants, demotion and revocation are not implemented by KEL-94. The pending table contains no automatic transition or privilege assignment.

## Evidence

Identity PR [#11](https://github.com/kelolakelas/kelolakelas-identity-service/pull/11), merge `91c3cf10ad920078d5847c81f6c55a1db9f74556`: `internal/repository/creator_request_repository.go`, `internal/usecase/creator_request_usecase.go`, `internal/delivery/http/handler/creator_request_handler.go`, `internal/repository/{member,user}_repository.go`, `internal/usecase/invitation_usecase.go`, `migrations/000004_creator_requests.up.sql`, and matching tests. Gateway PR [#13](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/13), merge `f81fe8e0ef1c7c5d23bc07bf0f0f157a24f18189`: `internal/delivery/http/router.go` and route tests. Both PR and post-merge `gate` checks passed; a live PostgreSQL integration test was not run.
