# ADR 0075: Budget the checkout calls and shutdown drain separately

## Status

Accepted by the owner for KEL-216; implemented on the academic issue branch, pending merge and complete QRIS acceptance. This partially supersedes the academic timeout/drain values in [ADR 0040](0040-bounded-graceful-lifecycle-identity-academic.md). Invoice policy is unchanged.

## Context

Real sandbox QRIS requests were accepted as pending upstream but academic cancelled billing at ten seconds. Billing's provider timeout was also ten seconds, leaving no caller margin for returning an error or releasing the claim. The owner explicitly authorized diagnosis and correction of the cross-service timeout budget. A 15/20-second provider/caller profile improved cleanup but did not complete QRIS. A new order under the final profile returned a real Duitku HTTP 500 in 16.74 seconds, proving an additional external NQ sandbox failure rather than a caller deadline alone.

## Decision

- Academic `billing.RequestTimeout` is 40 seconds, bounded for the entire billing request including its body. Shorter caller cancellation is still honored. Academic write and shutdown bounds must both exceed this constant; the default shutdown drain becomes 45 seconds. The default write timeout remains 60 seconds.
- The coordinated local/deployment checkout profile uses existing settings: billing `DUITKU_HTTP_TIMEOUT_SECONDS=30`; gateway `PROXY_UPSTREAM_TIMEOUT_SECONDS=50` and `SERVER_SHUTDOWN_TIMEOUT_SECONDS=55`; academic shutdown 45. HTTP write timeouts remain 60. Gateway and billing source defaults are unchanged: the profile must be applied explicitly before/with deployment. The 30/40/50/60 ordering leaves error/persistence/transport margin instead of equal nested deadlines.
- Billing's existing startup validator still requires its write timeout to exceed its sequential webhook chain. With provider 30, Resend 10 and its Academic client 10, the chain is 50 seconds below the 60-second write bound. No timeout is disabled. Billing's existing ten-second process shutdown remains as documented in ADR 0043; an interrupted invoice still uses its existing abandoned-claim recovery. Do not claim that this change makes all billing restarts wait for a full provider call.
- Deployments must give academic more than 45 seconds and gateway more than 55 seconds of termination grace to realize those drains. Production topology/grace is not independently verified here. Apply compatible gateway/write/drain configuration before deploying the longer academic client. Keep existing invoice rows, order IDs, method snapshots, claim leases and retry identities; do not shorten claims or backfill/reset data to force acceptance.
- Academic's minimum Go language version is patched to 1.26.10 and its toolchain pinned to 1.27.3 for [GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809), discovered by the existing required vulnerability check. No application dependency or financial contract changes.

## Verification and limits

A delayed HTTP regression crosses the former ten-second boundary; a separate regression proves shorter caller cancellation remains effective. Configuration tests reject write/drain at or below the billing client bound. Formatter, module verification, vet, race tests, build and govulncheck pass; the final scan finds zero reachable vulnerabilities.

Local service readiness and the profile were verified. QRIS replay still reached provider timeout at 30 seconds; an independent fresh order received provider HTTP 500 before that bound. Additional signed controls with a non-empty customer name and with the documented 60-minute QRIS expiry limit also received HTTP 500 in about 16 seconds. Therefore KEL-216 remains blocked on successful NQ sandbox acceptance and its linked PRs must not be counted as delivered merely because CI is green. No public API, migration, invoice regeneration policy, claim duration or settlement behavior changed. See [evidence](../evidence/2026-10-24-kel-216.md).
