# ADR 0060: Full manual refund with per-status enrollment cleanup

Status: Accepted; implemented for KEL-152.

## Context and owner decision

Refund records a transfer already performed manually, not a provider refund. The owner selected status-specific cleanup without changing Academic or wallet ledger semantics. A financial record must not be rolled back because Academic is unavailable, nor can stale payment activation or subscription work resurrect a refunded enrollment.

## Decision

Billing enforces tenant-scoped `billing:refund` (system Creator default only) and required trimmed reason/reference. A locked paid transaction becomes refunded atomically with its immutable actor/time audit, subscription cancellation and cancellation of open unpaid renewal transactions. A transaction-ID primary key and serialized replay prevent duplicate audit. Existing refunds return the original data.

| Enrollment state | Decision using existing Academic endpoints |
|---|---|
| active / suspended | `/end`, resulting in dropped |
| pending | Neutralise queued activation and guard in-flight activation; `/end` 409 followed by `/release` |
| release responds active | `/end` again; active is not a successful cleanup result |
| dropped | Idempotent cleanup, remains dropped |
| completed | `/end` and `/release` 409 leave it untouched; refund remains valid |

Cleanup state is durable on `transaction_refunds`; bounded idempotent HTTP calls execute under its row lock, with crash-safe replay and persisted capped backoff. Transaction/subscription locks also guard activation, resume and renewal creation against concurrent refunds. Success of the refund API means financial recording, not that the asynchronous Academic job has finished. Wallet/ledger remain unchanged. Paid-only sales reports exclude refunded rows, including historical periods.

## Alternatives and consequences

A new unconditional Academic termination endpoint was rejected: completed enrollments must remain untouched and the owner forbade Academic changes. Synchronous-only cleanup was rejected because an outage must not lose a real manual refund. Delaying subscription cancellation until Academic cleanup would permit unwanted renewal billing during an outage. Holding locks across bounded internal calls trades some contention for explicit ordering; jobs retry independently from payment reconciliation admin endpoints.

Apply identity migration `000015_billing_refund_permission` and billing migration `20261005000000_manual_refunds` before serving this route. Deploy identity, billing, then gateway. No provider refund, partial refund, wallet adjustment or new web refund UI is implemented.

## Evidence

- Identity PR #39, squash `f4b607f7fec57964f97ce01cfd9b277d5e6874f4`: permission migration/seeder and regression tests.
- Billing PR #35, squash `db5cc401acffc04ecf681a857b91a6eeec5e626c`: `internal/repository/refund_repository.go`, `subscription_refund_guard.go`, `internal/usecase/refund_worker_test.go`, `internal/repository/refund_postgres_test.go`, `pkg/academic/refund_test.go` and callback guards.
- Gateway PR #39, squash `8f2776658d80ad26c69e0caed49528c6619409d9`: authenticated route forwarding.
- Local full Go race/vet/build gates and all three PR/post-merge gates passed. Operator real-database gateway E2E `.kel-autopilot/kel152/manual-e2e.md`, SUMMARY 42/42 PASS, remains outside repositories. No independent review session ran (owner token-budget policy); land self-check and CI provided the delivery gate.
