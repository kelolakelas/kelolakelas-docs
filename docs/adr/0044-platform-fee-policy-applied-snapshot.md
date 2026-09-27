# ADR 0044: Platform fee policy, applied in identity and snapshotted per transaction

## Status

Accepted by the owner (Zam, 2026-09-28, recorded as the "Owner Decision" in KEL-99). Implemented in KEL-99: identity PR [#33](https://github.com/kelolakelas/kelolakelas-identity-service/pull/33) (`16406dfdbcf6950654fa21105907559f86dba684`), billing PR [#24](https://github.com/kelolakelas/kelolakelas-billing-service/pull/24) (`95cce66636e5efa4f01b55fae0d0d9423969fa19`), gateway PR [#27](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/27) (`df5f0dbc39b77732b3d96626bb2388631c806954`).

## Context

Before this change billing took `platform_fee` from the internal invoice request that academic sends. It computed `net_amount = gross_amount - platform_fee - payment_gateway_fee` from that value, and the renewal worker copied the first transaction's `platform_fee` into every renewal. No approved formula existed, platform admins could not change the fee, and a transaction did not record which rule had priced it. KEL-96 provides versioned configuration with operator application reports, and ADR 0031 and 0036 established the pattern of an applied policy in identity, read over the existing identity gRPC channel, that fails closed.

## Decision

Owner decisions (not the implementer's choice):

- Formula: `platform_fee = floor(gross_amount × percent_bps / 10000) + fixed_fee`, where `gross_amount` is subtotal minus discount, the amount the parent pays. `percent_bps` is an integer from 0 to 2000 (0–20%) and `fixed_fee` is an integer in rupiah from 0 to 50000. One policy version binds both numbers, and the initial value is 0 bps + Rp0, so the release changes nothing for tenants.
- The tenant bears the fee: it is deducted from `net_amount`, and the price the parent pays does not change.
- Rounding is down to the whole rupiah.
- A policy applies only to invoices created after the version is applied. Every new transaction stores an immutable snapshot of the policy it used, and nothing is recalculated.
- A renewal is priced by the policy applied when the renewal invoice is created.
- When `platform_fee + payment_gateway_fee > gross_amount`, the invoice is refused with no record: HTTP 422, code `platform_fee_exceeds_gross`, message `Biaya platform melebihi jumlah pembayaran`.
- A policy that is not applied, unreadable, malformed or missing refuses the invoice (fail closed). A 0 fee only ever comes from the explicitly recorded applied version 0.

Implementation choices left to the implementer (smallest reversible option, following ADR 0031/0036):

- Identity owns the catalog key `billing/platform/PLATFORM_FEE_POLICY` with type `platform_fee_policy`. A version's value is the canonical string `percent_bps=N,fixed_fee=N`. Non-canonical or out-of-bounds values are rejected when written. Migration `000013_platform_fee_policy` seeds the applied baseline head at version 0 (0 bps + Rp0). Its down migration removes only an untouched v0 head, so operator versions are never discarded.
- The effective policy is the newest version with an `applied` report. Once a desired version exists without an applied report, the policy is `applied: false`. A missing head, a read error or a corrupt stored value is an error, never a zero rule. History, applied acknowledgement and rollback are the generic KEL-96 configuration endpoints.
- Admin surface: `GET /api/v1/platform/fee-policy` returns `application`, `key`, `environment`, `applied`, `percent_bps`, `fixed_fee`, `applied_version` and `desired_version`. `POST /api/v1/platform/fee-policy` takes `{percent_bps, fixed_fee}` and appends a desired version: 400 when out of bounds, 409 on a concurrent version. The gateway protects both routes with `RequirePlatform`, and identity checks the live platform assignment again.
- Billing reads `tenant.FeePolicyService/GetPlatformFeePolicy` (`structpb.Struct`: `percent_bps`, `fixed_fee`, `applied_version`, `desired_version`) on identity's existing gRPC listener, reusing `IDENTITY_GRPC_HOST` and the `IDENTITY_PERMISSION_TIMEOUT_MS` bound, so there is no new environment variable. Identity answers `Unavailable` when evaluation fails and `FailedPrecondition` when no version is applied. Billing strictly checks that every field is an in-bounds integer.
- Billing computes the fee before any write, and the request's `platform_fee` is ignored. A policy failure answers `503` with code `platform_fee_policy_unavailable`. A re-invoice of an existing transaction keeps that transaction's snapshot and does not read the policy.
- Billing migration `20260928000000_transaction_platform_fee_snapshot` adds nullable `platform_fee_policy_version`, `platform_fee_percent_bps` and `platform_fee_fixed` columns. Transactions from before this change stay NULL (no policy version) and are not backfilled. A CHECK constraint makes the snapshot all-or-nothing, within bounds, and consistent with `platform_fee` and `net_amount`. A BEFORE UPDATE trigger rejects any change to a snapshot, or to the amounts it produced.

## Examples

`payment_gateway_fee` is Rp0 unless stated otherwise.

| Policy | Gross | platform_fee | net_amount |
|---|---|---|---|
| v0: 0 bps + Rp0 (baseline) | Rp180.000 | Rp0 | Rp180.000 |
| v1: 500 bps + Rp1.000 | Rp180.000 | 9.000 + 1.000 = Rp10.000 | Rp170.000 |
| 250 bps + Rp0 (rounding) | Rp99.999 | floor(2.499,975) = Rp2.499 | Rp97.500 |
| 0 bps + Rp2.500, gateway fee Rp1.000 | Rp2.000 | 2.500 + 1.000 > 2.000 | refused, 422 `platform_fee_exceeds_gross` |

An invoice created under v0 keeps `platform_fee` Rp0 and `platform_fee_policy_version` 0 after v1 is applied.

## Consequences and rollout

Deploy identity (migration 000013) first, then run billing's migration and deploy billing, then the gateway. Billing without an answering identity `FeePolicyService` refuses every new enrollment payment with 503. That is the intended fail-closed behavior, but it makes identity availability a precondition for checkout and renewal. After setting a version, an operator must record its applied report; until then billing refuses new invoices.

As with ADR 0036, the applied report is an operator acknowledgement: billing does not report back which version it enforced, although every transaction records it. Academic still sends `platform_fee`; billing accepts and ignores it. A parent sees a policy outage or an over-gross refusal as a generic payment failure, because a dedicated message needs academic and web changes outside KEL-99. The gRPC link keeps the existing unauthenticated plaintext transport, so network restriction remains essential.

## Verification

Tests cover the formula, bounds, overflow and each example above, the re-invoice snapshot, a policy change during checkout, renewal pricing and fail-closed renewal, the strict client parse, the 422 and 503 handler mapping, and the gateway 401/403 cases. Identity PostgreSQL tests cover the seed, the applied state and rollback, and the missing head. Billing PostgreSQL tests cover the legacy NULL row, the CHECK rejecting a partial or inconsistent snapshot, the immutability trigger, and up/down/up. Go formatting, vet, race tests, build and govulncheck passed in all three repositories, as did PR and post-merge `gate` checks.
