# ADR 0062: Tenant-scoped category update

## Status

Accepted and implemented in KEL-188.

## Context

An academic category could be created, listed, and deleted, but never corrected
(`internal/usecase/category_usecase.go` had `CreateCategory`, `ListCategories`,
and `DeleteCategory` only). The only way to fix a typo in a category name was
to delete the category and create a replacement. Unlike a class price change,
a category rename is structurally safe: classes reference categories by id, so
a rename never touches any class row — but the delete-and-recreate workaround
still forced the tenant to re-link every class, and a category with active
classes cannot be deleted at all (`ErrCategoryActiveClasses`), so a typo in a
category in active use was unfixable.

No `category:update` permission existed in identity, so the new route also
needed a permission catalog entry following the existing pattern: a row in
`permissions` plus a grant to the system `Creator` role, idempotent
(`ON CONFLICT DO NOTHING`) and reversible (down migration deletes the grant
and the row).

## Decision

Academic exposes `PATCH /api/v1/categories/:id`, registered behind
`RequirePermission("category:update")`, and the gateway proxies the same path
and method in its protected group. Identity migration `000016` registers the
`category:update` permission with a system `Creator` grant, following the
existing permission pattern. The existing `CheckPermission` machinery is
reused unchanged; there is no new middleware, no new configuration, and no
schema change to the `categories` table.

The endpoint is a partial update. Only the fields the caller actually sent are
applied, so an update can never blank an attribute by omission:

- `name` — rejected as 422 (`ErrCategoryNameRequired`) when blank after
  trimming. A `nil` request (no usable body) is rejected the same way.
- `description` — accepted as `*json.RawMessage`; an omitted key keeps the
  stored value.

Three properties are deliberate:

- **Tenant scope is enforced twice.** The handler resolves the tenant only from
  the verified JWT claim ([ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md)),
  the use case loads the category with `GetByID` and rejects a foreign
  `TenantID` with `ErrCategoryForbidden` (403), and the repository
  `UpdateByTenant` repeats `WHERE id = ? AND tenant_id = ?` and reports a zero
  row count as `gorm.ErrRecordNotFound`. The duplicated scope means a caller
  mistake or a concurrent tenant change still cannot write across tenants, and
  a silent no-op is impossible.
- **A foreign-tenant category is 403, not 404.** Unlike the class update
  ([ADR 0013](0013-tenant-scoped-class-update.md)), which answers 404 to avoid
  an existence oracle, the category use case distinguishes "missing"
  (`ErrCategoryNotFound`, 404) from "another tenant's" (`ErrCategoryForbidden`,
  403) after loading the row. Both readings are defensible; the category
  endpoint keeps the domain error the delete path already used rather than
  inventing a new mapping.
- **A rename never touches class rows.** The write updates only the `name`,
  `description`, and `updated_at` columns of the single category row. Existing
  classes keep pointing at the same category id with no migration, no snapshot
  copy, and no re-linking.

The whole use case runs inside `txManager.WithTransaction`, so the load, the
tenant check, and the write see one consistent snapshot.

Error mapping is deliberate and documented: 400 for a malformed UUID or bind
failure, 401/403 from the JWT and tenant-context middleware, 403 for a
foreign-tenant category, 404 for a missing category, 422 for a blank name, and
500 for anything unexpected.

## Alternatives considered

- **Reuse the existing `CategoryRepository.Update` without tenant scoping.**
  Rejected: the generic `Update` has no tenant predicate, so authorization
  would rest entirely on the use case's prior read. A
  `WHERE id = ? AND tenant_id = ?` clause is cheap and makes the write safe
  even if the caller is wrong — the same argument as ADR 0013.
- **Answer 404 for a foreign-tenant category (class-update parity).**
  Rejected for this endpoint: the category domain already distinguishes
  forbidden from not-found and the delete path already surfaces that
  distinction, so the update keeps the existing mapping instead of adding a
  second convention for the same resource.
- **Accept `null` for `description` to clear it.** Rejected for the first
  version: `encoding/json` cannot distinguish an omitted field from an
  explicit `null` in a pointer-typed DTO, so "clear the description" would be
  indistinguishable from "leave it alone". Clearing is explicitly out of scope
  rather than approximated by a rule a client cannot predict — the same
  argument as ADR 0013.
- **Create a distinct `PUT /categories/:id` with full-replacement semantics.**
  Rejected: full replacement would require the caller to resend every
  attribute, which makes a concurrent edit silently destructive for no benefit
  on a two-field resource.
- **Grant `category:update` to Teacher or other tenant roles by default.**
  Rejected: only the system `Creator` role receives the grant in the
  migration, matching the conservative default of the existing catalog
  permissions. Tenants can assign the permission to their own roles through
  the existing role machinery.

## Consequences

Academic gains one route, one use-case method, one repository method, and one
request DTO plus one error value; the gateway gains one proxied route;
identity gains one permission row and one role grant. No configuration change
was required.

The academic Swagger document adds the operation together with the new request
DTO. The generated artifacts (`docs/swagger.json`, `docs/swagger.yaml`,
`docs/docs.go`) were regenerated rather than hand-edited, and the change is
purely additive.

Deployment order is not constrained between academic and gateway: the academic
route is additive, so an older gateway simply does not expose it yet, and the
gateway route is useless until academic serves it. The identity migration must
be applied before the endpoint authorizes anyone — until then the permission
check denies, which is fail-closed and safe.

Because the write is a partial update over a single row, there is no new
operational surface: no worker, no retry, no reconciliation row, and no
cross-service call.

Known gaps this decision leaves open: there is no audit trail for category
attribute changes; explicit description clearing is out of scope.

**Implemented (KEL-189):** the web dashboard now exposes permission-gated
name/description editing and confirmed deletion. The previous direct-API-only
observation no longer applies; the API decision itself is unchanged. Evidence:
[web PR #91](https://github.com/kelolakelas/kelolakelas-web/pull/91), squash
`b2d8b8c2e1a14be40147b3adb244de9f41e42a0c`, `CategoryControl` and
`updateCategory`/`deleteCategory` in the tenant classes route.
