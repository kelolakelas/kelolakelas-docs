# ADR 0045: Drop the enrollment when billing refuses its invoice for the platform fee

## Status

Accepted. Implemented in KEL-106: academic PR [#33](https://github.com/kelolakelas/kelolakelas-academic-service/pull/33) (`23fc8dc7a3750a9f2592d62557017da7e0a95379`), web PR [#48](https://github.com/kelolakelas/kelolakelas-web/pull/48) (`f98f22cd2c06240a459beb0efa7c8f9e4784a3f9`).

## Context

Since KEL-99 ([ADR 0044](0044-platform-fee-policy-applied-snapshot.md)) billing refuses an invoice with HTTP 422 `code: platform_fee_exceeds_gross` when `platform_fee + payment_gateway_fee > gross_amount`, and writes no subscription or transaction. Academic creates the enrollment row (`status = pending`) inside its enrollment transaction before it asks billing for the invoice. Before KEL-106 academic treated every invoice failure the same way: it answered 500 and kept the pending row so a retry with the same `Idempotency-Key` could ask billing again. For this refusal that was wrong in three ways: the parent saw the payment-service outage message; the pending row held a schedule seat and made every new attempt for the same student and class answer `duplicate_enrollment` (KEL-54) until the invoice window passed; and a same-key retry asked billing again for a result that does not change until an operator changes the policy.

## Decision

- Academic recognises the refusal only by billing's exact pair: HTTP 422 and `code: platform_fee_exceeds_gross`. Any other billing failure (another status, a 422 without a code or with another code, `platform_fee_policy_unavailable` 503, transport errors) stays transient and keeps the pending row, as before.
- On the refusal, academic moves the enrollment it just created from `pending` to `status = dropped` with `payment_status = platform_fee_rejected`, under a row lock. `dropped` is outside the live set (`pending`, `active`) used by capacity counting and the `idx_student_class_active` unique index, so the attempt holds no seat and does not block a new attempt.
- The HTTP answer is 422 with `code: platform_fee_exceeds_gross` and billing's message, on the catalog enrollment route and the tenant enrollment route (both callers). Clients key on `code`, not the message.
- A replay with the same `Idempotency-Key` that finds a row dropped this way answers the same 422 without calling billing and without creating an enrollment or transaction. The key stays bound to that refused request; a new attempt after the policy changes uses a new key (the web form issues a new key per render).
- If the drop itself fails, academic answers an internal error instead of the 422 and leaves the row pending with no transaction, so the refusal is never reported for an attempt that still holds a seat, and a same-key retry asks billing again.
- `platform_fee_rejected` is a new value of the existing `payment_status` varchar(30) column. No migration is needed and no web code reads `payment_status`.
- Web shows "Kelas ini belum dapat dibayar karena biaya platform melebihi jumlah pembayaran. Hubungi penyelenggara kelas." only for a 422 with that code. A response without the code (an older academic still answering 500) keeps the previous message, so either deploy order is safe.

## Alternatives considered

- **Keep the pending row (the transient path).** Rejected: the seat and the duplicate-enrollment guard stay blocked until the invoice window passes, although no invoice can exist.
- **Delete the enrollment row.** Rejected: a same-key replay would create a fresh row and call billing again, and the refused attempt would leave no trace for support.
- **Answer 409 or pass billing's body through unchanged.** Rejected: 409 already means a conflict the parent can resolve (full schedule, duplicate, idempotency), and the academic error envelope is the contract its clients parse.

## Consequences

- A tenant's class priced below the platform fee cannot be checked out until the tenant changes the price or an operator changes the policy; the parent is told to contact the class organiser.
- Dropped rows with `payment_status = platform_fee_rejected` accumulate, one per refused attempt; they are not live and are not counted anywhere.
- Evidence: academic `pkg/billing/client.go`, `internal/domain/enrollment.go`, `internal/usecase/enrollment_usecase.go` (`invoiceFailure`, `dropPlatformFeeRejected`, `platformFeeRejected`), `internal/delivery/http/handler/enrollment_handler.go`; web `lib/enrollment.ts` (`isPlatformFeeRejectedResponse`, `platformFeeRejectedState`), `app/(public)/kelas/[id]/_actions/actions.ts`; tests listed in [academic API](../api/academic.md#platform-fee-rejection-kel-106).
