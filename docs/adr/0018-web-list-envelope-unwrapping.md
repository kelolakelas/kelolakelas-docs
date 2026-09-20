# ADR 0018: Unwrapping the paginated list envelope in the web client

## Status

Accepted and implemented in KEL-31.

## Context

Every tenant-scoped academic list endpoint (`GET /api/v1/classes`,
`/categories`, `/schedules`) answers with a paginated envelope rather than a
bare array:

```json
{
  "status": "success",
  "message": "Classes fetched successfully",
  "data": {
    "items": [ ... ],
    "pagination": { "page": 1, "page_size": 20, "total_items": 3, "total_pages": 1 }
  }
}
```

The gateway is a pure pass-through for these routes: `ProxyToAcademicService`
installs a reverse proxy whose only mutation is `req.Host`, and no
`ModifyResponse` hook exists anywhere in the gateway. The envelope therefore
reaches the web client unchanged.

The tenant dashboard readers in
`app/(dashboard)/dashboard/tenant/classes/_queries/queries.ts` nevertheless
tested the payload as if it were a bare array:

```ts
if (result.status === 'success' && Array.isArray(result.data)) {
  return result.data;
}
return [];
```

`Array.isArray` is `false` for an object, so all three readers returned `[]` for
every response. `ClassListTable` renders an empty state whenever its `classes`
prop is empty, so the tenant class list had never rendered a single row
regardless of database contents. The defect was latent because it degrades to an
empty list rather than an error, and it was hidden from the web developers by the
academic Swagger artifact vendored under `kelolakelas-web/_docs/api/`, whose
`paths['/api/v1/classes'].get.responses['200']` is `{}` — the web was never
handed a usable contract for these endpoints. Regenerating that artifact is
tracked separately as KEL-43.

The defect blocked KEL-31's acceptance criteria, which require that a published
class *appear* in `/kelas` and that withdrawing publication make it *disappear*:
neither can be demonstrated through a list that never renders.

The web client already contained the correct pattern for this shape.
`lib/students.ts` exposes `normalizeStudentList`, which parent student queries use
to read `{ items, pagination }` while tolerating a bare array.

## Decision

Add `lib/list-envelope.ts` with `normalizeListEnvelope` and
`normalizeListPagination`, and route the three tenant class readers through it
through a single shared `fetchTenantList` helper.

`normalizeListEnvelope` accepts:

- the paginated envelope — `items` is taken as-is and `pagination` is read;
- a bare array — treated as a single full page, preserving compatibility with
  endpoints and older payloads that are not paginated;
- malformed input (`null`, a primitive, a missing or non-array `items`) — an
  empty envelope is returned instead of throwing.

`normalizeListPagination` coerces each field independently, falls back to `0`
for values that are not non-negative integers, and clamps `page` to at least
`1`. The client therefore prefers a defensible default over failing a render on
an unexpected field type.

The readers also request `page_size=100`, the maximum the academic service
accepts (`listQuery` rejects values above 100, and defaults to 20), so the
dashboard lists every configured class in one page.

The correction is deliberately confined to the three readers on this page. No
other list consumer was changed, and the helper is presentation-layer only: it
performs no authorization and makes no request.

## Alternatives considered

- **Read `result.data.items` directly at each call site.** Smallest diff, but it
  repeats an unguarded property access three times, throws on a malformed
  payload, and drops compatibility with any endpoint that answers with a bare
  array.
- **Change the gateway to flatten envelopes.** Rejected: the envelope carries
  pagination metadata that the web needs, the gateway is intentionally a
  transparent proxy, and flattening there would break every consumer expecting
  the documented contract.
- **Change the academic service to return a bare array.** Rejected for the same
  reason, and it would remove pagination from a service that already caps
  `page_size` at 100.
- **Leave the readers alone and treat the empty list as a separate defect.**
  Rejected because KEL-31's acceptance criteria become undemonstrable, and a
  class-publication control rendered above a permanently empty table would be
  misleading.

## Consequences

- The tenant class, category and schedule lists render their real contents for
  the first time, which is what makes the publication control in KEL-31
  observable.
- The fix is backward compatible: a bare-array response still yields the same
  rows as before.
- Malformed payloads degrade to an empty list rather than throwing during a
  Server Component render, matching the existing behaviour of these readers
  (they already logged and returned `[]` on a non-OK response).
- The dashboard lists at most 100 classes per view; beyond that the list is
  truncated until this page implements pagination.
- Any other web consumer of an enveloped list endpoint that still tests
  `Array.isArray(result.data)` carries the same latent defect. Those call sites
  were not audited here and should be checked before relying on them.
