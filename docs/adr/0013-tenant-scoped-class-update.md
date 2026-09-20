# ADR 0013: Tenant-scoped class update with forward-only pricing

## Status

Accepted and implemented in KEL-30.

## Context

A tenant could create, list, delete, and publish a class, but not correct one. The
only way to change a typo in a class name, move a class to a different category, or
adjust its price was to delete the class and create a replacement. Deleting a class is
destructive: it soft-deletes the row and every enrollment that pointed at it becomes an
orphan for reporting purposes. The permission `class:update` already existed and was
already wired into route registration, but it only guarded the publication toggle
(`PATCH /api/v1/classes/:id/published`, [ADR 0002](0002-academic-permission-enforcement.md)),
so the permission name promised more than the surface delivered.

Price is what makes an update endpoint non-trivial. An enrollment persists its own
`gross_amount` snapshot at creation time
(`internal/usecase/enrollment_usecase.go:116,196` copy `class.Price` into
`domain.Enrollment.GrossAmount`, a `bigint NOT NULL DEFAULT 0` column in the initial
schema). That snapshot is what the payment flow charges and what billing records. A
class price change therefore must not silently re-price work that was already sold, but
it also must not be blocked, because a tenant needs to charge a different price for
future enrollments.

Class `type` is a second structural attribute. `private` and `group` carry different
schedule and capacity obligations: a group class requires a selected schedule, and the
capacity predicate counts seats per schedule. Flipping the type of a class that already
has schedules, sessions, and enrollments would leave those rows describing a class
shape that no longer exists.

## Decision

Academic exposes `PATCH /api/v1/classes/:id`, registered behind the existing
`class:update` permission check, and the gateway proxies the same path and method.
There is no new permission, no new migration, and no new configuration.

The endpoint is a partial update. Only the fields the caller actually sent are applied,
so an update can never wipe an attribute by omission:

- `category_id` — re-validated as an existing category owned by the same tenant; both a
  missing category (`ErrCategoryNotFound`) and a foreign-tenant category
  (`ErrCategoryForbidden`) are mapped to 422, so the endpoint is not an existence oracle
  for another tenant's categories either.
- `name` — rejected as 422 when blank after trimming.
- `description` — accepted as `*json.RawMessage`.
- `type` — validated against `private`/`group` but **not writable**: a value that
  differs from the stored type is rejected with `ErrClassTypeImmutable` (422). Repeating
  the current type is a no-op so idempotent clients can round-trip a full class object.
- `price` — a negative value is rejected as 422.

Three properties are deliberate:

- **Tenant scope is enforced twice.** The handler resolves the tenant only from the
  verified JWT claim ([ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md)),
  the use case loads the class with `GetByID` and rejects a foreign `TenantID`, and the
  repository `UpdateByTenant` repeats `WHERE id = ? AND tenant_id = ?` and reports a
  zero row count as `gorm.ErrRecordNotFound`. The duplicated scope means a caller
  mistake or a concurrent tenant change still cannot write across tenants, and a silent
  no-op is impossible.
- **A foreign-tenant class is 404, not 403.** Returning forbidden would confirm that the
  row exists in another tenant's data; not found keeps the endpoint from being an
  existence oracle.
- **Price changes are forward-only.** The update path touches only the `classes` row. It
  never writes to the enrollment repository, so every existing enrollment keeps the
  `gross_amount` it was created with, and a later price change cannot alter what an
  already-initiated payment owes.

The whole use case runs inside `txManager.WithTransaction`, so the category
re-validation, the tenant check, and the write see one consistent snapshot.

Error mapping is deliberate and documented: 400 for a malformed UUID or bind failure,
401/403 from the JWT and tenant-context middleware, 404 for a missing or foreign-tenant
class, 422 for a rejected business rule (bad category, immutable type, blank name,
negative price), and 500 for anything unexpected.

## Alternatives considered

- **Allow changing class `type`.** Rejected: schedules, sessions, and enrollments were
  created against the current type, and the capacity and schedule-requirement rules
  differ per type. A type change would need a migration plan for existing rows, which is
  a product decision and not part of an attribute-update endpoint.
- **Return 403 for a class owned by another tenant.** Rejected: the caller already knows
  the class ID from their own request, and 403 versus 404 would let a tenant probe for
  the existence of other tenants' class IDs. 404 leaks nothing.
- **Reuse the existing `ClassRepository.Update` without tenant scoping.** Rejected: the
  generic `Update` has no tenant predicate, so authorization would rest entirely on the
  use case's prior read. A `WHERE id = ? AND tenant_id = ?` clause is cheap and makes the
  write safe even if the caller is wrong.
- **Re-price existing enrollments when a class price changes.** Rejected: the enrollment
  `gross_amount` is the agreed price of a specific sale, and a payment may already be
  in flight against it. Retroactive repricing belongs to discounts, proration, and
  invoicing adjustments, not to a class attribute edit.
- **Accept `null` for `description` to clear it.** Rejected for the first version:
  `encoding/json` cannot distinguish an omitted field from an explicit `null` in a
  pointer-typed DTO, so "clear the description" would be indistinguishable from "leave it
  alone" for every other field's semantics. Clearing is explicitly out of scope rather
  than approximated by a rule a client cannot predict.
- **Create a distinct `PUT /classes/:id` with full-replacement semantics.** Rejected:
  full replacement would require the caller to resend every attribute, which makes a
  concurrent edit silently destructive and forces the client to know about immutable
  fields it did not intend to change.

## Consequences

Academic gains one route, one use-case method, one repository method, and one request
DTO plus error values; the gateway gains one proxied route. No schema, migration, seed,
or configuration change was required, and `class:update` was already seeded in identity
(`seeders/000001_default_permissions_and_roles.sql`) for the publication toggle, so no
identity change was needed either.

The academic Swagger document adds the operation together with the new request DTO. The
generated artifacts (`docs/swagger.json`, `docs/swagger.yaml`, `docs/docs.go`) were
regenerated rather than hand-edited, and the change is purely additive.

Deployment order is not constrained between academic and gateway: the academic route is
additive, so an older gateway simply does not expose it yet, and the gateway route is
useless until academic serves it. Deploying them together is still the intended
sequence.

Because the write is a partial update over a single row, there is no new operational
surface: no worker, no retry, no reconciliation row, and no cross-service call.

Known gaps this decision leaves open: there is no price history or audit trail for class
attribute changes, so "what did this class cost last month" is not answerable from the
class table alone; discounts, proration, and re-pricing of existing enrollments remain
out of scope; the web application still has no edit-class UI, so the endpoint is
currently reachable only by direct API callers; schedule and session editing is a
separate surface; and the immutability of `type` means migrating a class between private
and group still requires an explicit, supervised operation that does not exist yet.
