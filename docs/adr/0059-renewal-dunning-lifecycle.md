# ADR 0059: Overdue renewal uses durable suspend and resume reconciliation

## Status

Accepted, implemented in KEL-150: billing [PR #33](https://github.com/kelolakelas/kelolakelas-billing-service/pull/33), squash `e99d273344225b78bf577408620cff2f5a178d03`.

## Context

The renewal worker used to stop after billing date plus seven days without changing an active subscription. Local invoice expiry enqueued a permanent Academic seat release even for renewal transactions, but release does not revoke an active enrollment. Academic's idempotent suspend and resume endpoints from [ADR 0050](0050-enrollment-suspend-resume-end.md) can park an active enrollment without losing its history. A callback can race the overdue sweep, and a seat freed by suspension may be taken before resume.

## Decision

`SUBSCRIPTION_GRACE_PERIOD_DAYS` sets the renewal scan horizon and overdue boundary (default seven when unset or nonpositive). Strictly after the boundary, the subscription worker locks an active subscription row, verifies its billing period and absence of a paid transaction, and atomically updates status to `suspended` and upserts a durable per-subscription lifecycle row requesting `suspend`. The active-only scan then excludes suspended subscriptions from new invoices and reminders.

The payment reconciliation worker claims due lifecycle rows with `FOR UPDATE SKIP LOCKED` and a stale-processing lease, calls Academic's idempotent suspend/resume endpoint, and persists success, retry or `terminal_failed` with the response error. A confirmed paid renewal callback locks the same subscription row in its payment transaction, requests `resume` when suspended, marks it active and advances the billing date. If payment arrives while a suspend call is in flight, the suspend completion leaves the newer resume pending rather than marking it finished. Operators can inspect the credential-protected `GET /internal/billing/subscription-lifecycle` with optional status filter; there is no automatic terminal requeue.

Invoice expiry and failed-payment release exclude renewals: an expired renewal can be paid legitimately and must not permanently drop the enrollment. The migration deletes only pending legacy renewal release jobs. Previously claimed or completed release jobs remain for audit and operator investigation.

## Consequences and limits

The migration `20261002020000_subscription_lifecycle` must run before the code starts. The callback remains subject to Duitku confirmation ([ADR 0033](0033-confirm-duitku-payment-status-before-settlement.md)); expiry remains chronological evidence, not proof of nonpayment ([ADR 0009](0009-local-invoice-expiry-without-losing-late-payments.md)). Suspension frees capacity, so Academic can reject resume with 409 if full; billing retains the failure in the lifecycle list, but subscription billing status may already be active while Academic enrollment remains suspended. Operators must reconcile such conflicts manually. Retry after a stale lease can repeat an idempotent Academic call. In-process scheduling still has no leader election, but row claims and the unique subscription job protect transition ownership. No late fee or new suspension notice is introduced.

Evidence: billing `internal/repository/subscription_lifecycle_repository.go`, `internal/repository/subscription_lifecycle_postgres_test.go`, `internal/usecase/subscription_worker.go`, `internal/usecase/transaction_usecase.go`, `internal/usecase/reconciliation_worker.go`, `migrations/20261002020000_subscription_lifecycle.up.sql`.
