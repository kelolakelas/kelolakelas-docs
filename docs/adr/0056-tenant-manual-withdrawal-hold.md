# ADR 0056 — Tenant manual withdrawal holds

- Status: Accepted and implemented (KEL-143)
- Date: 2026-10-01

## Context

The billing wallet had an available and a pending balance, but no tenant withdrawal path. A request racing another request or a payment callback must not spend the same available money twice. A primary payout account can change after a request; the destination must remain auditable. Gateway retries can arrive after a timeout.

## Decision

Billing owns request, history, detail and cancellation. The gateway exposes four protected routes but forwards tenant context rather than making a balance decision. Billing requires `billing:withdraw` with active membership; parents are refused. The tenant supplies an IDR amount and mandatory idempotency key (up to 255 characters). The default minimum is **Rp 50.000**, approved by the owner on 2026-10-01; `WITHDRAWAL_MINIMUM_AMOUNT=50000` is the safe example, and unset/non-positive configuration falls back to that default. Admin fee is zero.

Within one database transaction, request locks the tenant wallet, checks an existing tenant/key first (same amount and explicit account means same result), rejects a second open (`requested` or `processing`) request, checks available balance and the primary account, snapshots its bank fields, moves amount from available to pending and writes a negative `withdrawal_hold` ledger entry. A partial unique index on `(tenant_id,idempotency_key)` and existing ledger uniqueness reinforce retry behavior. Cancellation takes the same wallet lock and conditionally changes only `requested` to `cancelled`; it returns pending money to available and writes a positive `withdrawal_release` ledger entry in that transaction. A losing cancel sees 409; foreign or absent IDs see 404. Historical withdrawal rows retain null keys and empty destination snapshot fields rather than inventing old account data. Tenant reads mask account numbers.

## Consequences and limits

The wallet row serializes payment credits, new holds and releases. One-open-request enforcement is a transaction-time guard under that lock, not a database partial unique index; other future writers must use the same lock/transition protocol. The `processing` status is reserved for future platform-admin work; this change does not implement admin processing, disbursement, fees or a provider payout. The additive migration must precede serving the new binary; rollback after live requests discards keys/snapshots and needs a data recovery plan. PostgreSQL race tests need `KEL143_TEST_DATABASE_URL`, and default CI skips them. The operator exercised 18 race-test passes and 20/20 gateway API assertions locally, not a production payment-provider payout.

## Evidence

Billing `internal/usecase/withdrawal_usecase.go`, `internal/repository/withdrawal_repository.go`, `internal/domain/withdrawal.go`, `cmd/server/routes.go`, `migrations/20261002000000_withdrawal_request_cancel.{up,down}.sql`; tests `internal/repository/kel143_withdrawal_postgres_test.go`, `internal/domain/withdrawal_test.go`, `cmd/server/withdrawal_routes_test.go`. Gateway `internal/delivery/http/router.go` and `router_test.go`. Billing [PR #29](https://github.com/kelolakelas/kelolakelas-billing-service/pull/29), squash `6c70af4d3fb76e7257c4b2c7e813771b414358c1`; gateway [PR #34](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/34), squash `20a3a521c2526e5ff9cce51483d8c9886015bfeb`.
