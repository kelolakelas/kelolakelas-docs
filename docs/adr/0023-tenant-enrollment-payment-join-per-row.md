# ADR 0023: Tenant enrollment rows carry their newest transaction, fetched per row

## Status

Accepted and implemented in KEL-33.

## Context

KEL-33 asks the tenant dashboard to show "the enrollments of the tenant's classes
together with the payment status of each one, matching the backend". Academic owns
enrollments and billing owns transactions, and no endpoint in either service
returns the two joined:

- `GET /api/v1/enrollments` (academic) returns the enrollment record, its
  `class`, its `student`, its `schedule_id` and its `billing_cycle`, guarded by
  the `enrollment:read` permission.
- `GET /api/v1/billing/transactions` (billing) accepts `enrollment_id` and
  returns that enrollment's transactions, newest first, with no permission
  guard of its own.

The web client therefore has to decide how to associate the two, and the
association is not one-to-one. Migration `000002_payment_idempotency` created a
unique index on `transactions.enrollment_id`; migration
`000003_subscription_renewals` drops it
(`kelolakelas-billing-service/migrations/000003_subscription_renewals.up.sql:13`)
because a renewal legitimately creates a second transaction for the same
enrollment. A tenant looking at a renewed enrollment must see the current
transaction, not the original one.

Two properties of the billing API constrain the shape of the answer:

1. `transactionResponse()` collapses the database's `pending` and `processing`
   into the API status `reconciling`, so the web only ever observes
   `reconciling`, `active`, or `terminal_failed`. The row cannot distinguish
   "invoice created, not yet paid" from "paid, activation in flight" — and the
   tenant-facing copy must not claim it can.
2. There is no bulk lookup. No endpoint accepts a list of enrollment ids, so a
   page of N enrollments costs one billing request per enrollment.

## Decision

**Each enrollment row is joined with its own most recent transaction, fetched
with one request per enrollment using `page_size=1` and the billing service's
existing newest-first ordering. Missing or unreadable payment detail degrades to
an explicit "not available" label rather than failing the page.**

The query layer (`_queries/queries.ts`) reads the enrollment list and the
schedule list concurrently, then performs the transaction lookups with
`Promise.all`, one `GET /api/v1/billing/transactions?enrollment_id=…&page_size=1&page=1`
per enrollment that carries a valid UUID. `pickEnrollmentTransaction` then
selects the newest row from whatever comes back.

Three consequences are deliberate:

### The newest transaction is selected, not "the" transaction

Because the unique index was dropped, "the transaction for this enrollment" is
not well defined. The list is ordered `created_at DESC` by the billing service,
so taking the first row of a `page_size=1` response yields the current
transaction and a renewed enrollment reports its latest state. Reading without
the ordering, or assuming a single row, would silently display a superseded
`terminal_failed` transaction for an enrollment that has since been renewed and
paid.

### Payment detail is best-effort; the enrollment list is not

The transaction lookups are individually caught. A failure for one enrollment
renders that row with `Menunggu transaksi` and `Nominal belum tersedia`; a
failure for another still renders its own payment state. The schedule list is
treated the same way — a failed read drops every schedule label, and rows still
render.

Only an unreadable *enrollment* list is an error state. This asymmetry is the
point: the page exists to answer "who enrolled", and payment status is
supplementary. Failing the whole screen because one billing lookup timed out
would withhold the primary information over a detail.

> **Superseded in part by [ADR 0024](0024-billing-read-permission-on-tenant-transaction-reads.md) (KEL-57):**
> billing now requires `billing:read` on the transaction list, so a `403` from a
> payment lookup is a real authorization result. The page marks that row
> "Tidak tersedia untuk role Anda" instead of "Menunggu transaksi"; every other
> lookup failure still degrades as described here, and the page-level forbidden
> state is still driven only by the enrollment read.

This is also why the forbidden state is driven exclusively by the enrollment
read. Neither the schedule list nor the transaction list is permission-guarded,
so neither can legitimately produce a `403`; treating a `403` from them as
"no permission" would misreport an authorization result that the backend never
issued.

### Permission, not ownership, defines the tenant's view

The tenant sees the enrollments the academic service returns for its own tenant
scope behind `enrollment:read`. The web performs no filtering of its own and
adds no tenant identifier to any request: the gateway republishes the tenant
from the verified JWT claim ([ADR 0017](0017-gateway-context-header-trust-boundary.md))
and academic resolves it from that claim only ([ADR 0010](0010-tenant-context-from-verified-jwt-claim-only.md)).
A member without `enrollment:read` receives `403` and sees a forbidden panel
naming the missing permission.

## Consequences

- A page issues `2 + N` gateway requests for N enrollments on the page. With
  `ENROLLMENT_PAGE_SIZE = 20` that is at most 22 requests per render. This is
  the main cost of the decision and it is bounded by the page size.
- The billing service needs no new endpoint, and no cross-service join is
  introduced into either backend.
- Payment state shown to the tenant is exactly the billing API's vocabulary.
  The page does not infer success from a provider redirect, and it does not
  claim to distinguish the two database states that `reconciling` merges.
- An enrollment whose transaction lookup fails is indistinguishable in the UI
  from one that genuinely has no transaction yet. Both render "waiting for
  transaction". This is accepted: from the tenant's point of view the actionable
  statement is the same, and the alternative — surfacing a per-row technical
  error — would put backend detail in front of a tenant.
- If the page size grows, the request count grows with it. A bulk
  list-by-enrollment-ids route on billing is the fix; it does not exist today.

## Alternatives considered

**Fan out the transactions list once and join in memory.** Rejected: the billing
list is not scoped to a set of enrollments, so this would require paging the
entire transaction history of the tenant and filtering client-side, which is
unbounded work and could omit matches beyond the first page.

**Add a batch lookup to the billing service.** The correct long-term shape, and
rejected for this change as out of scope: it adds a contract to a second
repository for a page that is bounded at 20 rows. Recorded here so the trade-off
is not rediscovered as a surprise.

**Add a composed endpoint to academic that returns enrollments with payment.**
Rejected: it would make academic depend on billing for a read path, duplicating
the ownership of payment state that ADR 0001 deliberately keeps in billing.

**Show the oldest transaction, or all transactions.** Rejected: the tenant's
question is about the current payment state of the enrollment, and a renewed
enrollment's history is not what "status pembayaran" means for that row.

**Treat a failed lookup as an error and fail the page.** Rejected: it converts a
degraded supplementary detail into a total loss of the primary information.
