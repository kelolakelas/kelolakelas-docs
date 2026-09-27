# ADR 0039: Tenant sales summary is tenant-only, per currency, over UTC days

## Status

Accepted and implemented in KEL-58.

## Context

A tenant could only see revenue by opening transactions one page at a time; billing had no aggregate read, and the tenant overview showed only member and role counts. KEL-58 asked for the paid transaction count, total `gross_amount` and total `net_amount` for a period, tenant-scoped from the JWT, guarded by `billing:read`, with `from <= to`, at most 366 days, a default of the last 30 days, and no access for parent tokens. It left the path name open and set UTC boundaries unless decided otherwise.

The existing transaction reads use `RequirePermissionUnlessParent` ([ADR 0024](0024-billing-read-permission-on-tenant-transaction-reads.md)), which lets a parent through without an identity call because the handler scopes parents to their own `parent_id`. An aggregate has no parent scope, and transactions of one tenant can carry more than one currency.

## Decision

- Path `GET /api/v1/billing/transactions/summary`, registered before `/transactions/:id` in billing and in the gateway's protected group.
- A new `middleware.RequirePermission(billing:read)` guards it: a parent token is refused with 403 before identity is consulted, even when it carries a tenant claim; a member needs `billing:read` through the same identity `CheckPermission` call and failure semantics as ADR 0024 (403 denied, 503 identity unavailable). The list/get reads keep `RequirePermissionUnlessParent`.
- The tenant comes only from the verified JWT `tenant_id` claim. The handler reads no tenant query parameter or header.
- `from` and `to` are optional `YYYY-MM-DD` UTC calendar days, both inclusive. The default is today (UTC) and the 29 preceding days. A malformed date, `from > to`, or more than 366 inclusive days is 400. SQL filters `status = 'paid'` and `paid_at >= from AND paid_at < to + 1 day`, so a row paid exactly at midnight after `to` is excluded and one at midnight of `from` is included.
- The response groups by currency: `{from, to, totals: [{currency, transaction_count, gross_amount, net_amount}]}`, ordered by currency, `[]` when there are no sales. Amounts of different currencies are never added.
- Net is the stored `net_amount`; no platform fee is computed.

  > **Superseded in part by ADR 0044:** since KEL-99, invoice creation deducts the applied platform fee from each new transaction's stored `net_amount`. The summary still computes no fee, but its net totals reflect the fee policy in force when each transaction was created.
- The web dashboard requests the default range and shows one bucket per currency in its own Suspense boundary, with loading, empty, forbidden and error states.

## Consequences

- UTC days: `paid_at` is written over a `TimeZone=UTC` connection, so the bounds are consistent with stored data. A tenant in WIB sees the day cut at 07:00 local time; the card labels the period "(UTC)". Changing to a tenant timezone later is reversible (add a parameter or tenant setting) without changing the response shape.
- The PostgreSQL integration test (tenant isolation, status filter, range bounds, soft delete) is gated on `KEL58_TEST_DATABASE_URL` because billing CI has no database service. CI runs the sqlmock test that pins the SQL shape.
- The aggregate runs over `transactions` filtered by `tenant_id`, `status` and `paid_at`; no new index was added. At current data sizes this is acceptable; a large tenant may need an index on `(tenant_id, status, paid_at)` later.

## Evidence

Billing [PR #21](https://github.com/kelolakelas/kelolakelas-billing-service/pull/21), squash `2f0982de17fe993ef9c2ed74a148af9bd1aa1da0`: `internal/delivery/http/handler/transaction_handler.go` (`SalesSummary`), `internal/repository/transaction_repository.go` (`SummarizePaid`), `internal/delivery/http/middleware/permission_middleware.go` (`RequirePermission`), `cmd/server/routes.go`, tests `internal/repository/transaction_sales_summary_{test,integration_test}.go`, `internal/delivery/http/handler/transaction_sales_summary_handler_test.go`, `internal/delivery/http/middleware/permission_middleware_test.go`, `cmd/server/routes_test.go`. Gateway [PR #25](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/25), squash `c90e4ae9c9bfd0db87331c4b242a581cccc97e38`: `internal/delivery/http/router.go`, `router_test.go`. Web [PR #40](https://github.com/kelolakelas/kelolakelas-web/pull/40), squash `b3456ad16349ff62da38c1e09a325c237b3308a4`: `app/(dashboard)/dashboard/tenant/{page.tsx,_components/SalesSummaryCard.tsx,_queries/sales-summary.ts}` and tests. PR and main-push `gate` checks passed in all three repositories.
