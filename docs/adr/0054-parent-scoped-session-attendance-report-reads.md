# ADR 0054: Parent-scoped session, attendance, and report reads

## Status

Accepted. Implemented in KEL-140: academic PR [#44](https://github.com/kelolakelas/kelolakelas-academic-service/pull/44) (`f7b0e0249af2a1c5a0a0103c0fa625ec224eac62`).

## Context

Before KEL-140 a parent token could not read its own child's sessions, attendance,
or reports through academic: the handlers required a tenant claim, so a parent
without one received 401, while a parent token carrying a `tenant_id` followed the
member handler path and could read the whole tenant's data. [ADR 0002](0002-academic-permission-enforcement.md)
recorded this explicitly: parent access to a child's attendance or reports was
undefined ("this change does not define parent access"). Enrollment and student
reads already had a parent-ownership pattern (`parent_id` from the verified
`user_id` claim); sessions, attendance, and reports had none. The gateway needs
no change: its `RequireTenant` already lets parent tokens without a tenant
through.

## Decision

- **Parent read scope.** Parent callers (`is_parent` claim) are resolved to the
  `parent_id` from the verified `user_id` claim, following the existing
  `studentScope` pattern. The tenant claim is ignored even when present, so a
  parent reads across every tenant where its children are enrolled in one call.
- **Ownership predicate in SQL.** Every parent read method constrains rows with
  `JOIN students ... s.parent_id = ?`: `SessionRepository.ListSessionsForParent` /
  `GetSessionForParent`, `AttendanceRepository.ListForParent` / `GetForParent`,
  `ReportRepository.ListForParent` / `GetForParent`, and
  `EnrollmentRepository.GetActiveByScheduleIDForParent`. Sessions served to a
  parent come only from schedules with an active enrollment of that parent's
  child; `GetSessionAttendeesForParent` resolves the reschedule-origin chain
  through the same predicate, so a group session never exposes other parents'
  children. Use-case wrappers (`ListForParent` / `GetForParent` /
  `GetBySessionForParent`, `ListSessionsForParent` / `GetSessionForParent` /
  `GetSessionAttendeesForParent`) map not-owned rows to the existing not-found
  error (404), never 403, so ids do not leak.
- **Parent writes denied.** Parent tokens are refused on every attendance/report
  mutation with 403 and no identity call (`RequirePermissionForTenantResourceDenyParent`;
  `RequirePermission` denies parents on the routes it guards). The existing 401
  for an invalid tenant claim is preserved.
- **Member paths unchanged.** Tenant-member reads and writes keep the exact
  previous path, including the KEL-22 permission table, the KEL-135
  `schedule:read` guard on session reads, and the assigned-tutor checks.
- **Contract.** Swagger `@x-permission parent_tokens` notes say `denied` on the
  seven attendance/report mutations and `skipped` on the parent read routes;
  `cmd/server/swagger_contract_test.go` asserts the notes match the middleware.

## Alternatives considered

- **Scope parent reads by the tenant claim.** Rejected: a parent with children
  in two tenants would need two calls and two tokens, and the claim would again
  be a tenant selector on a token that legitimately carries any (or no) tenant.
- **Enforce ownership in the handler instead of SQL.** Rejected: a list-then-filter
  shape loads rows the caller may not see and reintroduces the leak class under
  pagination; the predicate in the query keeps unowned rows out of every page.
- **Answer not-owned reads with 403.** Rejected: it confirms the row exists to a
  caller who must not know; 404 keeps foreign ids indistinguishable from missing
  ones, matching the existing tenant-scoped convention ([ADR 0019](0019-tenant-scoped-session-and-schedule-mutations.md)).

## Consequences

- The KEL-22 statements that a parent token without a valid tenant gets 401 and
  that no parent access to child attendance/reports exists are superseded for
  these routes (noted in place in [ADR 0002](0002-academic-permission-enforcement.md)
  and [Academic API](../api/academic.md#attendance-and-report-permissions-kel-22)).
- No migration was needed: `students.parent_id` already exists. No new
  service-to-service call, so the security boundary diagram and the
  dependency matrix are unchanged, and no new environment variable was added.
- Web parent screens and student notes for parents remain out of scope.
- Incidental fix shipped in the same PR: the tenant report `List` count query
  now sets its table (`Model(&domain.Report{})`); the predicate is unchanged.
  It was exposed by the new AC4 regression test on a real database.

## Evidence

Academic `internal/repository/{attendance,report,session,enrollment}_repository.go`
(parent methods), `internal/usecase/{attendance,report,schedule}_usecase.go`
(parent wrappers), `internal/delivery/http/handler/{attendance,report,session,schedule}_handler.go`
(parent branch), `internal/delivery/http/middleware/permission_middleware.go`
(`RequirePermissionForTenantResourceDenyParent`, parent deny in
`RequirePermission`), `cmd/server/attendance_report_routes.go`, regenerated
Swagger; tests `internal/repository/parent_scope_postgres_test.go`
(`KEL140_TEST_DSN`: owner across 2 tenants, other parent, foreign filters,
member, other tenant), handler/route tests
(`TestAttendanceReportRoutesParentReadsIgnoreTenantClaim`,
`TestSessionAttendeesParentReadIgnoresTenantClaim`,
`TestAttendanceReportRoutesParentMutationsAreForbidden`,
`TestAttendanceReportRoutesPermissionMatrix`), `cmd/server/swagger_contract_test.go`;
academic PR [#44](https://github.com/kelolakelas/kelolakelas-academic-service/pull/44),
squash `f7b0e0249af2a1c5a0a0103c0fa625ec224eac62`.
Contract: [API](../api/academic.md#parent-scoped-session-attendance-and-report-reads-kel-140).
