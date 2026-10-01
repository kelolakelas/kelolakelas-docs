# ADR 0058 — Tenant transaction paid-date filter and CSV export

- Status: Accepted and implemented (KEL-147)
- Date: 2026-10-02

## Context

`GET /api/v1/billing/transactions` filtered its date range on `created_at`, while the
sales summary (ADR 0039) aggregates on the UTC payment date `paid_at`, so a tenant could
not pull the row-level transactions behind a summary period. There was no export: bookkeeping
meant paging through JSON. KEL-147 asked for an opt-in `paid_at` basis on the list without
changing the old default, plus a tenant-only CSV export with the same filters that reconciles
with the summary.

## Decision

Billing owns the list basis and the export; the gateway only forwards the export route.

- List: optional `date_by` query parameter (`internal/domain/transaction.go`,
  `IsTransactionDateByValue`). Empty or `created_at` keeps the historical `created_at`
  comparison byte-identical; `paid_at` filters the half-open UTC interval
  `[date_from, date_to + 1 day)` so the `to` date is inclusive for every payment on that
  UTC day, exactly like `SummarizePaid`. An unknown basis is 400 `Invalid date basis`, an
  unknown status 400, so a caller can never silently receive rows for a basis it did not ask
  for. List and export share `applyTransactionFilters`
  (`internal/repository/transaction_repository.go`), so the two predicates cannot drift apart.
- Export: `GET /api/v1/billing/transactions/export` (`cmd/server/routes.go`), registered
  before `/transactions/:id`, behind `middleware.RequirePermission(billing:read)` plus a
  handler-level parent refusal: a parent token is 403 before identity is consulted, a member
  needs `billing:read` (403 denied, 503 identity unavailable), a missing tenant is 401.
  It accepts the list's filters (`status`, `student_id`, `enrollment_id`, `search`,
  `date_from`, `date_to`, `date_by`) but defaults to `status=paid`, `date_by=paid_at`, and
  the summary window (today and the 29 preceding UTC days), so a parameterless export
  reconciles with the summary by construction. Malformed or empty dates, `from > to`, and a
  span over 366 days are 400 `Invalid transaction date range`. Days are inclusive
  `YYYY-MM-DD` UTC calendar days (ADR 0039: a UTC day ends at 07:00 WIB).
- The response is `text/csv` with `Content-Disposition: attachment` naming the effective
  range, columns `order_id, created_at, paid_at, status, student_id, enrollment_id,
  currency, subtotal, discount, gross, platform_fee, gateway_fee, net`. Currency is a
  column so multi-currency ranges stay reconcilable per currency and are never summed.
  Times are UTC RFC3339; an unpaid row's `paid_at` is an empty cell. Every cell starting
  with `=`, `+`, `-`, or `@` carries a leading single quote (`NeutralizeCSVCell` in
  `internal/domain/transaction_export.go`), so spreadsheets render it as text; `encoding/csv`
  still owns comma/quote/newline quoting. No BOM is emitted: every column is ASCII-safe.
- Rows stream via `IterateExport` in 500-row batches with a flush per batch
  (`internal/usecase/transaction_usecase.go`), so a full 366-day export never loads fully
  into memory. An error before the first flush answers 500 with the generic KEL-61 message
  (no internal detail); after the first flush only truncating the stream is left, which the
  handler logs server-side.
- Gateway: `GET /api/v1/billing/transactions/export` is registered explicitly in the
  protected group before `/billing/transactions/:id`
  (`kelolakelas-api-gateway/internal/delivery/http/router.go`), forwarding path and query
  unchanged. All authorization and validation stay in billing-service.

## Consequences and limits

- UTC days again: like the summary, a WIB tenant sees the day cut at 07:00 local time; the
  export default window and the swagger annotation document the UTC semantics.
- No migration and no new index: EXPLAIN of the export predicate uses the existing
  `idx_transactions_tenant_status` on `(tenant_id, status)`; the predicate shape is identical
  to `SummarizePaid`. A very large tenant may still need a `(tenant_id, status, paid_at)`
  index later, same residual as ADR 0039.
- A truncated stream (failure mid-export) is detectable only by the missing flush/EOF, not
  by a status code; the client must treat a short read as incomplete.
- Empty ranges yield a header-only CSV, which is a valid export, not an error.

## Evidence

Billing [PR #31](https://github.com/kelolakelas/kelolakelas-billing-service/pull/31), squash
`49e275f2e8713dc7234e3e45fa6ca2e3f77707b0`: `internal/domain/transaction.go`
(`TransactionDateBy*`, `IsTransactionDateByValue`), `internal/domain/transaction_export.go`
(new), `internal/repository/transaction_repository.go` (`applyTransactionFilters`,
`IterateExport`), `internal/usecase/transaction_usecase.go` (`ExportTransactions`),
`internal/delivery/http/handler/transaction_handler.go` (`List` date basis, `Export`),
`cmd/server/routes.go`, regenerated Swagger; tests `internal/domain/transaction_export_test.go`,
`internal/usecase/transaction_export_test.go`,
`internal/delivery/http/handler/transaction_export_handler_test.go`,
`internal/repository/transaction_export_integration_test.go` (PostgreSQL: CSV net per currency
equals `SummarizePaid`), `cmd/server/routes_test.go`. Gateway
[PR #36](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/36), squash
`89ae62ed084d5b1053bb6f0b833dcf80b9733932`: `internal/delivery/http/router.go`,
`router_test.go` (`TestTransactionExportRouteForwardsFiltersToBilling`). PR and post-merge
`gate` checks passed in both repositories.
