# ADR 0055: Billing owns tenant finance data (wallet, ledger, payout accounts)

Status: Accepted (KEL-142, 2026-10-01)

## Context

The paid Duitku callback credits `NetAmount` to the tenant wallet's
`AvailableBalance` and writes a `payment_received` ledger entry
(`kelolakelas-billing-service/internal/usecase/transaction_usecase.go`),
but no route existed to read the balance or the ledger. The
`bank_accounts` table existed in billing's init schema, yet the
withdrawal repository and use case were interfaces only. Identity also
carries finance tables
(`kelolakelas-identity-service/migrations/00000000000000_init_schema.up.sql:51-91`)
that nothing uses. KEL-142 added tenant reads (wallet balance, paged
ledger mutations) and payout-account management (CRUD + atomic
set-primary), plus gateway forwarding. A durable owner had to be named
so future finance work lands in one service.

## Decision

- Billing-service owns all tenant finance data: `wallets`,
  `ledger_entries`, `bank_accounts`, and `withdrawals`.
- Wallet and ledger reads are tenant-only behind `billing:read` (same
  `tenant.PermissionService/CheckPermission` contract as the transaction
  reads): parents are refused with 403 before identity is consulted, a
  tenant without a wallet gets a zero balance and an empty ledger page
  (not an error), and ledger entries are append-only evidence listed
  newest first.
- Payout accounts are managed behind `billing:withdraw`: create, update,
  soft delete (history-preserving), and atomic set-primary. Exactly one
  primary per tenant is enforced by the partial unique index
  `uq_bank_accounts_tenant_primary` plus a transactional
  clear-then-promote with row lock, so two concurrent set-primary calls
  still leave one primary. Deleting the primary while an active
  withdrawal references it answers 409. Account numbers are always
  masked to the last four digits in tenant reads.
- The gateway only forwards the seven protected routes and publishes
  the verified tenant header; it never authorizes them.
- Sandbox transactions never credit the wallet or the ledger; the
  balance response documents this instead of hiding it.
- Identity's finance tables stay unused; no code reads or writes them.

## Alternatives considered

- **Identity owns finance data.** Rejected: wallet, ledger, and
  withdrawal state plus the Duitku callback already live in billing, so
  moving reads elsewhere would split one financial write path across
  two services and two databases.
- **Gateway authorizes the new routes.** Rejected: the gateway cannot
  evaluate `billing:read`/`billing:withdraw` or tenant scope; the
  downstream service owns the check, matching every existing billing
  route.
- **Hard-delete bank accounts.** Rejected: payout history must survive
  primary replacement for audit, so delete is a soft delete and
  replacement never removes rows.

## Consequences

- New finance endpoints, tables, or columns belong in billing-service;
  identity finance tables are candidates for a reviewed removal, not
  for new writes.
- The partial primary index is additive and non-destructive; pre-existing
  rows are unaffected.
- Withdrawal submission/processing and automatic bank-account
  verification via a bank API remain out of scope; account ownership is
  verified manually by the platform admin during processing.

Evidence: billing [PR #28](https://github.com/kelolakelas/kelolakelas-billing-service/pull/28),
squash `8f11a95dafbe5381db4f40da9f6374450319fc7c`
(`cmd/server/routes.go`, `internal/delivery/http/handler/wallet_bank_account_handler.go`,
`internal/usecase/{wallet,bank_account}_usecase.go`,
`internal/repository/{ledger,bank_account}_repository.go`,
`migrations/20261001000000_bank_account_single_primary.{up,down}.sql`);
gateway [PR #33](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/33),
squash `30d843b13b99023b82b4c46f32b0f20fb1dd9cf8`
(`internal/delivery/http/router.go`).
