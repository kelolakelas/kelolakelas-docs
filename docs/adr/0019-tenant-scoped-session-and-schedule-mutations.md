# ADR 0019: Tenant-scoped session and schedule mutations

## Status

Accepted and implemented in KEL-17.

## Context

Academic exposed five operations that act on an existing session or schedule:

| Operation | Routes |
|---|---|
| Reschedule a session | `POST /api/v1/sessions/reschedule`, `POST /api/v1/sessions/:id/reschedule` |
| Change a schedule permanently | `PUT /api/v1/schedules/permanent`, `PUT /api/v1/schedules/:id/permanent` |
| Substitute a tutor temporarily | `PATCH /api/v1/sessions/substitute-tutor`, `PATCH /api/v1/sessions/:id/substitute-tutor` |
| Change a tutor permanently | `PATCH /api/v1/schedules/tutor-permanent`, `PATCH /api/v1/schedules/:id/tutor-permanent`, and the `PUT` equivalents |
| Read session attendees | `GET /api/v1/sessions/:id/attendees` |

Every one of them resolved its target through an unscoped repository read:
`SessionRepository.GetByID` and `ClassScheduleRepository.GetByID` filter on the
primary key and the soft-delete column only. The handler resolved the caller's
tenant and the permission middleware checked `schedule:update`, but neither value
reached the query that loaded the row. The tenant was therefore irrelevant to what
the operation acted on: an authenticated member of any tenant who supplied another
tenant's session or schedule id could reschedule it, move it permanently, reassign
its tutor, or read its attendee list. Because the id is the only input required,
the ids in question are guessable-by-disclosure rather than secret.

`GetSessionAttendees` made the exposure concrete. It returned enrollments, and
enrollments carry student references, so a cross-tenant read disclosed student
records rather than scheduling metadata.

This was the same class of defect already fixed twice in this codebase, for class
update ([ADR 0013](0013-tenant-scoped-class-update.md)) and for the gateway's
context header ([ADR 0017](0017-gateway-context-header-trust-boundary.md)), and it
followed the rule established by [ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md):
tenant identity is derived only from the verified JWT claim and never from caller
input.

Two structural details made this more than a one-line change:

- **Three of the writes are bulk statements.** `CancelFutureSessionsBySchedule`,
  `CancelFutureSessionsByClass`, and `UpdateFutureSessionsTutor` act on a set of
  rows chosen by a `WHERE` clause rather than on one row identified by a key. A
  scoped read is not sufficient protection for them: the statement must itself
  refuse to widen.
- **`ChangeTutorTemporary` ran with no transaction.** Its read and its write were
  separate statements with no transaction around them, so the row it loaded was not
  guaranteed to be the row it later wrote.

## Decision

Tenant ownership became part of the SQL for every one of the five operations, and
the resource id is resolved through the tenant rather than checked after the fact.
There is no new permission, no new migration, and no new configuration.

**Tenant source.** Each of the five handlers begins by resolving the tenant with
`tenantIDFromContext`, which reads the `tenant_id` claim and ignores request
headers entirely. A missing claim is 403, an unusable claim is 401, and an
unrecognised tenant error fails closed through `writeTenantError` — all before any
use case runs.

**Scoped reads.** Two repository methods were added:

- `SessionRepository.GetByIDForTenant(ctx, tenantID, id)` and
  `ClassScheduleRepository.GetByIDForTenant(ctx, tenantID, id)`

Each joins `classes` and filters on the owning class's tenant:

```sql
FROM "class_sessions" JOIN classes c ON c.id = class_sessions.class_id
WHERE (class_sessions.id = $1 AND c.tenant_id = $2) AND "class_sessions"."deleted_at" IS NULL
```

The join is required because neither table carries a `tenant_id` column of its own:
ownership is inherited from the class. Preloads are preserved, so response payloads
are unchanged. A foreign id produces no row, which GORM reports as
`gorm.ErrRecordNotFound` and the use cases map to the pre-existing
`ErrSessionNotFound` / `ErrScheduleNotFound`. No new error type and no new response
shape was introduced.

**Bulk writes.** The three bulk statements repeat the tenant predicate instead of
trusting an earlier scoped read:

```sql
WHERE ... AND class_id IN (SELECT id FROM classes WHERE tenant_id = $N)
```

This is deliberate defence in depth, and it is the reason the two layers are not
redundant: resolution and mutation are separate statements, and a future caller
that forgets the scoped read still cannot widen a write across tenants.

**Attendee reads.** `GetSessionAttendees` resolves the session through the scoped
read before any enrollment is consulted. The private-enrollment branch reads through
`GetByIDForAccess` with the tenant passed in; the group branch reads through
`EnrollmentRepository.GetActiveByScheduleID`, which carries
`tenant_id = ?` in the same statement that selects the rows. Attendee data is never
loaded and then filtered.

**Transactions.** `ChangeTutorTemporary` is now wrapped in
`txManager.WithTransaction` like the other four, so its scoped read and the write it
authorises cannot be interleaved.

**Compatibility.** The alias routes and their `:id` path-param fallback are
untouched, request and response DTOs are unchanged, and the existing `schedule:update`
permission middleware still runs ahead of every mutation handler.

Three properties are deliberate and match the existing scoped-mutation convention:

- **A foreign resource is 404, not 403.** Returning forbidden would confirm that the
  row exists in another tenant's data, turning the endpoint into an existence oracle
  for other tenants' session and schedule ids.
- **A foreign resource is indistinguishable from a missing one.** The response body,
  status, and absence of side effects are identical, so the endpoint leaks nothing
  about whether the id exists at all.
- **Repository failures are not flattened into 404.** The not-found mapping is
  applied only when the error is `gorm.ErrRecordNotFound` or the loaded value is nil;
  any other error propagates as a server error. Treating every error as "not found"
  would hide genuine database failures behind an ordinary missing-row response.

## Alternatives considered

- **Check `session.Class.TenantID` in the use case after an unscoped read.** Rejected:
  it loads another tenant's row, including its student references on the attendee
  path, before deciding whether the caller may see it. The row would exist in the
  process even if never returned, and each of the five call sites would have to
  remember the check.
- **Check the tenant only in the handlers.** Rejected: it leaves the use cases and
  repositories callable without the guard, so any future caller — a worker, a second
  transport, a maintenance command — reintroduces the exposure. The task's own
  constraint was to use the existing scoped repository pattern rather than
  handler-only checks.
- **Scope only the single-row reads and trust them for the bulk writes.** Rejected:
  the bulk statements select their own row sets, so a scoped read authorises an
  unscoped write. A concurrent change between the two statements would also make the
  read an unreliable authority for the write.
- **Add a `tenant_id` column to sessions and schedules.** Rejected for this change:
  it is a schema migration with a backfill, it duplicates a value already reachable
  through `class_id`, and it can drift from the class's tenant. Class ownership
  remains the single source of truth, and the join keeps that authority in one place.
- **Return 403 for a foreign resource so the caller knows they were refused.**
  Rejected: a tenant has no legitimate need to learn that another tenant holds a
  given id, and 404 already distinguishes the case for the calling client's purposes
  (the operation did not happen).
- **Move the alias id resolution ahead of `ShouldBindJSON` so a path-only body
  works.** Rejected for this change: every mutation DTO marks the resource id
  `binding:"required"`, so the bind step rejects such a request with 400 before the
  alias runs. This is pre-existing behaviour, it is unrelated to tenant scoping, and
  changing it alters the accepted request contract. It is recorded as a follow-up
  below rather than changed here.

## Consequences

Academic gains two repository methods, five scoped use-case signatures, and five
handler guards; the gateway, identity, billing, and web repositories are unchanged.
No schema, migration, seed, or configuration change was required, and no new
dependency was introduced.

Existing clients are unaffected. Every previously working request against a
resource the caller's tenant owns still succeeds through the same route with the
same payload and response. Requests that previously crossed tenants now return 404
with no data change — that is the intended behaviour change, and it is the only one.

Deployment order is not constrained: the change is internal to academic, the routes
and contracts are unchanged, and no other service observes the difference except
through the fixed authorization behaviour.

Four properties of the result are worth stating explicitly:

- **The attendee read is the highest-impact fix.** It disclosed student records, not
  just scheduling metadata, so the cross-tenant 404 is a data-protection guarantee
  and not only a correctness one.
- **The bulk writes are protected twice.** Even a caller that resolved the resource
  correctly still runs writes whose tenant predicate is evaluated by the database.
- **Error semantics are preserved.** Callers that already handle
  `class session not found` and `class schedule not found` need no change; those two
  messages now also cover the cross-tenant case, which is exactly the point.
- **Observability does not distinguish the two cases.** A cross-tenant attempt is
  logged as a not-found result, so detecting attempted cross-tenant access requires a
  deliberate signal that does not exist yet.

Known gaps this decision leaves open:

- **Path-only bodies are rejected before the alias runs.** Because each mutation DTO
  marks the resource id `binding:"required"`, `POST /sessions/:id/reschedule` with a
  body that omits `session_id` returns 400 without reaching the alias. The alias
  routes remain supported and are exercised by tests, but the path id currently
  cannot substitute for a missing body id. Pinned by
  `TestPathAliasCannotSupplyAMissingBodyID` so a change to it is a deliberate
  decision.
- **A permanent change can produce an inverted schedule validity range.** Both
  permanent-change use cases copy `oldSchedule.ValidUntil` into the replacement
  schedule after overwriting it with `effective_date - 1`, so the new schedule can
  end before it starts and session generation clamps to an empty window. This
  predates this change, is a scheduling-correctness defect rather than a
  data-exposure one, and altering it changes scheduling behaviour, so it needs its
  own task.
- **A tutor is not validated against identity membership.** `substitute_tutor_id` and
  `new_tutor_id` are accepted as "a tutor of this tenant" only in the sense that the
  session or schedule being changed is already the caller's own. Whether the supplied
  user is a member of the tenant with a tutoring role is a separate check that does
  not exist.
- **Attendance and report permissions are separate surfaces.** The attendee endpoint
  is guarded by the tenant claim but not by a dedicated permission, so any
  authenticated member of the owning tenant can read it. A narrower permission is a
  product decision.
