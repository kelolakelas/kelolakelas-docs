# ADR 0066: App-owned baseline security headers

## Status

Accepted, implemented (KEL-187). Web [PR #101](https://github.com/kelolakelas/kelolakelas-web/pull/101), squash `afe2dcb636039b8faffd23834ed7c8d7b994ced0`.

## Context and decision

The previous web `next.config.ts` had no configured baseline headers. Edge configuration is unknown. An edge-only policy would leave direct/local responses inconsistent; putting headers in the auth proxy would miss its excluded asset/API paths. The app therefore owns the baseline in `next.config.ts::headers()` on `/:path*`, via `lib/security-headers.ts::appSecurityHeaders()`.

Emit `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` and `Content-Security-Policy-Report-Only`. No enforcing CSP or HSTS is added. Edge operators must preserve these headers without adding duplicate/conflicting policies; this is an ownership requirement, not evidence that production edge has been configured.

## Inventory and compatibility boundary

The report-only policy uses self for default/script/style/font/connect/base/form; images allow self and data; frame/object/frame-ancestors use none. It deliberately reports inline script/style use rather than prematurely enforcing a broken policy.

- Next.js/React hydration scripts, landing JSON-LD and inline styles require further analysis before enforcement. Geist fonts are self-hosted by the build.
- QRIS images use data URLs (`lib/pay-qr.ts`).
- Browser chat uses `NEXT_PUBLIC_CHAT_WS_URL` (`lib/chat.ts`); a different origin can produce report-only violations. Gateway API requests run server-side and are not governed by browser connect-src.
- Hosted payment checkout uses top-level anchor navigation, not provider iframe/fetch/form POST, so no provider host is allowlisted. Frame denial does not prevent this navigation.
- The same configured baseline applies in dev and production; dev inline/eval/HMR activity can generate report-only noise without being blocked. The recorded browser compatibility run used a production build, not a dedicated devtools/HMR test.

No external report collector is configured: report-only console diagnostics are not durable server-side telemetry. Provider settlement/sandbox behavior and deployed edge behavior are not proven by these checks. Authorization/session predicates and payment contracts are unchanged.

## Verification and evidence

Run a production build with the required gateway origin, then `npm run start`. Directly request `curl -sI http://localhost:3000/login` and `curl -sI http://localhost:3000/tidak-ada-seperti-ini`. Expect 200 and branded 404 respectively; each baseline header and report-only CSP appears once. No enforcing CSP/HSTS should appear. Repeat against the deployed origin to detect edge stripping or duplication before claiming production parity.

`lib/security-headers.test.ts` covers baseline values, uniqueness, report-only/no-HSTS, frame consistency, inventory and single-line serialization (7 tests). Land reran 143 files / 1599 tests, TypeScript, touched-file lint and production build successfully; required PR gate passed. Implementer stack `09803d2d0a81`, `.kel-autopilot/kel187/manual-e2e.md`, records direct 200/404 and redirect headers, login hydration, catalog browser rendering, parent return response and unauthenticated protected-route redirect PASS. No separate review session ran (owner decision).

## Consequences

Local app behavior no longer depends on edge for the baseline. CSP remains inventory-only and can be noisy; enforcement, production HSTS, edge provisioning and external CSP reporting require separate evidence and are outside this change. No new environment variable or service-to-service dependency is introduced.
