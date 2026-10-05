# ADR 0061: Group checkout voucher reservations

Status: Accepted (KEL-162, owner decisions)

## Context

A voucher with one remaining use must not discount concurrent checkouts twice. Preview cannot consume quota. A provider-confirmed payment may arrive after expiry released its reservation, and rejecting that money or changing the old invoice price would break settlement integrity.

## Decision

Billing owns eligibility, discount arithmetic and immutable invoice fee snapshots. Clients send only voucher_code. Academic derives tenant and subtotal from the published group class; gateway exposes only authenticated POST /api/v1/catalog/classes/:class_id/voucher-preview to academic. Preview delegates to billing's protected internal read-only endpoint and creates no enrollment, transaction or reservation. There is no checkout dry_run flag.

The cap applies to paid uses plus active reservations. Billing locks the voucher row and reserves atomically with invoice snapshot creation. Failed, expired or cancelled transitions release once. A confirmed late paid transition retakes a released usage unconditionally, even when current_uses exceeds max_uses, preserving the original discount and fee snapshot. Existing current_uses makes this exceptional over-cap state visible.

A replacement invoice after release must re-reserve under lock and pass current eligibility, or be refused with voucher_rejected (including exhaustion/inactive voucher). It never changes the original price snapshot. A still-valid invoice replay uses the existing reservation. Private vouchers, automatic voucher application and recurring discounts remain out of scope.

## Consequences and verification

Apply migration 20261006000000_transaction_voucher_use before new checkout traffic. Preview is advisory; quota can change before checkout. A late payment may legitimately exceed the cap; this is explicit owner policy, not a concurrency failure. Percent arithmetic rounds down and discount is capped; applied fees use discounted gross.

Real PostgreSQL race count3 verifies last-use concurrency, expiry release, late paid over-cap with unchanged snapshot and idempotent replay, replacement refusal on exhausted/inactive voucher and one-use re-reservation. It returned 12 top-level and 18 subtests PASS. Operator sandbox evidence .kel-autopilot/kel162/sandbox-evidence.md is PASS 8/8 and stays outside repositories. No separate review session ran (owner decision).

Evidence: billing PR #36 squash a87e3345f6f639b89ab0058f9cfd8dd668d5d88b; academic PR #46 squash e499bc523db930539d2832b1ddc8e8fcc34d4e73; gateway PR #41 squash 4b718d28046080d3b673d0d60fa0fa628e9729c8; web PR #77 squash 923ca5b6cb2b1cf20d1a7b2c8ccc3775bc3e30e6. See internal/repository/kel162_voucher_postgres_test.go in billing and the API/flow pages.
