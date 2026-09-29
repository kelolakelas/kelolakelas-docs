# ADR 0049: Optional channel selection for new enrollment invoices

Status: Accepted (KEL-125, owner decision 2026-09-29)

## Context

Subscription invoices always used Duitku `VC`. Choosing a virtual account or QRIS on a new enrollment requires a channel to travel from academic's enrollment request to billing's internal invoice request and the provider. A replay or concurrent request must not replace the channel or link of an invoice already issued. Private schedule approval and recommendation acceptance create invoices immediately; delaying or changing them is a separate product decision.

The operator's sandbox `getpaymentmethod` and `v2/inquiry` probes returned HTTP 200 and statusCode `00` for `VC`, `VA`, `BC`, `SP` and `NQ` on 2026-09-29. The evidence is retained outside the repositories at `.kel-autopilot/kel125/sandbox-evidence.md` without credentials. This establishes sandbox behavior, not production availability.

## Decision

- Add an optional JSON `payment_method` to public and tenant enrollment requests and the internal billing invoice request. Accept only `VC` (hosted card), `VA`/`BC` (virtual accounts), and `SP`/`NQ` (QRIS); absent means the previous `VC`. No card or CVV fields are introduced.
- Validate at academic's HTTP boundary and enrollment use case before reserving a seat, and at billing's HTTP boundary and trusted invoice use case before writing a subscription or transaction. Reject unknown values with HTTP 400. Forward the requested value through the existing internal billing client.
- Store the chosen method in the existing `transactions.payment_method` column when creating a transaction. An issued invoice's link and method are immutable to a replay with a different request channel. An expired invoice reissued on the same transaction retains its saved method; treat a legacy empty method as `VC`. A paid callback does not overwrite a nonempty selected method. Keep the existing merchant order and exclusive invoice claim semantics.
- Do not change private schedule purchase code or add a parent checkout endpoint. Private approval and recommendation acceptance omit the field and remain on `VC`; KEL-133 owns private selection. Renewal invoice behavior and fee snapshots are unchanged.

No schema migration is needed. Deploy billing before academic: an older academic client omits the field and continues to use `VC`. This change is a backend capability, not a web channel selector.

## Consequences and evidence

The optional field is backwards compatible for callers that omit it. The allowlist is intentionally smaller than the full sandbox `getpaymentmethod` response; only the five codes that also succeeded in inquiry are accepted. If provider availability changes, the adapter may fail invoice creation through its existing error path. The sandbox accepted `expiryPeriod=20160` for QRIS, while the provider documentation describes shorter QRIS limits (SP 60 minutes, NQ 1440 minutes). Production behavior is unverified, so expiry settings are not changed here; a production limit may cause inquiry failure.

Evidence: academic `internal/domain/enrollment.go`, `internal/usecase/enrollment_usecase.go`, `pkg/billing/client.go` and [PR #38](https://github.com/kelolakelas/kelolakelas-academic-service/pull/38) (squash `94b485ad1086379c32ece8af86545ef5ccca7e78`); billing `internal/domain/transaction.go`, `internal/usecase/transaction_usecase.go`, `internal/repository/payment_method_postgres_test.go`, `internal/usecase/payment_method_test.go` and [PR #25](https://github.com/kelolakelas/kelolakelas-billing-service/pull/25) (squash `f1e1a14cfe19b3f238b16c4676f9eced9f1a8093`). The local PostgreSQL claim test checks exclusivity; there is no end-to-end concurrent HTTP/provider test.
