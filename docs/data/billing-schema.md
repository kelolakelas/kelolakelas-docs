# Billing schema

**Implemented migration authority:** `kelolakelas-billing-service/migrations/00000000000000_init_schema.up.sql` plus migrations `000002_payment_idempotency`, `000003_subscription_renewals`, `20260915000000_payment_reconciliations`, `20260920000000_transaction_invoice_expiry`, and `20260921000000_reconciliation_kind`.

```mermaid
erDiagram
  VOUCHERS ||--o{ TRANSACTIONS : discounts
  SUBSCRIPTIONS ||--o{ TRANSACTIONS : renewal
  WALLETS ||--o{ LEDGER_ENTRIES : records
  BANK_ACCOUNTS ||--o{ WITHDRAWALS : paid_to
```

| Table | Current key facts |
|---|---|
| `vouchers` | unique tenant/code, usage and validity fields, soft delete |
| `wallets`, `bank_accounts`, `ledger_entries`, `withdrawals` | wallet unique tenant; ledger uniqueness for payment event; bank account FK for withdrawal |
| `subscriptions` | unique enrollment ID; renewal migration adds tenant/parent/student/contact/class/amount fields |
| `transactions` | unique merchant order; stores amounts/status/provider/payment URL; unique enrollment index introduced by `000002`, then dropped in `000003` in favor of partial subscription-period uniqueness; `invoice_expires_at` holds the invoice deadline sent to Duitku and `expired_at` records when the local expiry worker moved the row to `expired` (both nullable, retained as evidence when a late payment still succeeds) |
| `payment_reconciliations` | one durable Academic job per transaction; `kind` is `activation` (confirm a paid seat, the default) or `release` (return the seat of a failed or expired payment, KEL-26); tracks attempts, lease, next retry, latest error, and terminal completion |
| `seed_versions` | seed tracking |

Indexes on `transactions`: `idx_transactions_due_expiry` is a partial index on `invoice_expires_at` limited to `status = 'pending'`, which supports the expiry worker's due-row scan. Migration `20260920000000_transaction_invoice_expiry` also backfills `invoice_expires_at = created_at + interval '14 days'` for pre-existing `pending` rows so the worker does not expire them immediately.

`payment_reconciliations.transaction_id` stays unique, which is what allows a single row to carry either an activation or a release for a transaction: the `kind` column added by `20260921000000_reconciliation_kind` names which action is owed, and `idx_payment_reconciliations_kind_due` covers `(kind, status, next_attempt_at)`. The migration's `DEFAULT 'activation'` gives every pre-existing row its original meaning.

Foreign keys only connect voucher/subscription/wallet/bank-account tables locally. Enrollment, tenant, parent, and student UUIDs are not cross-database FKs.
