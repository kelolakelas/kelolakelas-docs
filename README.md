# KelolaKelas current-state documentation

This is an evidence-based onboarding and operations guide for the implementation found on 2026-09-21 (Asia/Jakarta). It describes code as it exists; it is not a design proposal or deployment runbook.

## Scope and snapshot

| Repository | Branch | HEAD | State at inspection |
|---|---|---|---|
| `kelolakelas-web` | `main` | `22673d266049fd8c3baf288a6b6312fc8b334d76` | KEL-130 add-student trigger on every populated class-detail enrollment branch (PR #58); PR and post-merge CI gate passed; KEL-113 class creation form without class-level capacity (PR #57); PR and post-merge CI gate passed; KEL-127 in-page VA/QRIS checkout and card redirect (PR #56); PR `gate` passed; KEL-124 chat entry points from schedule requests and student reports (PR #55); PR `gate` passed; KEL-131 parent enrollment history envelope unwrapping (PR #54); PR `gate` passed; KEL-123 parent/tenant chat inbox and realtime (PR #53); PR `gate` passed |
| `kelolakelas-api-gateway` | `main` | `51a8a23876e18495f220bc115671b2125daa9230` | KEL-122 REST chat + ticket WebSocket proxies to chat-service (PR #31); PR and post-merge CI gate passed |
| `kelolakelas-identity-service` | `main` | `b05a137ba390604dd1ab02ebcd5ff2e8e14055e8` | KEL-117 `chat:manage` catalog entry and system Creator grant (migration 000014, default seed, PostgreSQL integration tests; PR #34); PR and post-merge CI gate passed |
| `kelolakelas-academic-service` | `main` | `08aa007b488914281be917ccd00eeda1f22d0637` | KEL-128 private approval passes verified parent email and private flag (PR #39); KEL-125 optional payment channel for enrollment invoices (PR #38); PR and post-merge gate passed; KEL-118 internal chat contexts for private schedule requests and reports (PR #37); PR and post-merge CI gate passed |
| `kelolakelas-billing-service` | `main` | `750d5fad8d059fd791b5cb10393c3b97beaa930b` | KEL-128 private invoice email claim, retry worker and migration (PR #27); KEL-126 scoped VA/QR instructions and nullable migration (PR #26); PR and post-merge gate passed; KEL-125 selected invoice channel, replay and expiry preservation (PR #25); PR and post-merge gate passed; KEL-99 new transactions priced from identity's applied platform fee policy with an immutable per-transaction snapshot (migration `20260928000000`), fail-closed 503 and 422 `platform_fee_exceeds_gross` (PR #24); PR and post-merge CI gate passed |
| `kelolakelas-chat-service` | `main` | `0fd73a2a69981677db3cf6fe6bb4914e40dffd5e` | KEL-121 ticket-based realtime WebSocket, in-memory single-instance fan-out (PR #3); PR and post-merge CI gate passed; not yet gateway-routed |

**Implemented:** KelolaKelas is a Next.js App Router UI, a Gin reverse-proxy gateway, and separate identity, academic, and billing Go services. The code configures PostgreSQL per stateful service, Redis for gateway rate limiting and identity permission caching, identity gRPC on `:50051`, Duitku payment requests, Resend email, and optional Google Maps geocoding. Group-class parent enrollment now uses the public catalog detail page to select an owned student, schedule and payment method before showing backend VA/QRIS instructions in-page or redirecting card payment to the backend-provided hosted checkout URL, and a parent can cancel their own pending enrollment, which withdraws the invoice and returns the seat; the parent enrollment screen exposes that cancellation through a keyboard-accessible in-page confirmation rather than a browser prompt. The gateway strips the client-supplied `X-Tenant-ID` and `X-Internal-Service-Credential` from every inbound request and republishes the tenant header from the verified JWT claim on protected routes. It also bounds every proxied request in time and body size, and answers a downstream timeout with `504`, an unreachable downstream with `502`, and an oversized body with `413`, all as one JSON error envelope. Academic session and schedule mutations resolve the target resource through the caller's tenant in SQL, so a session or schedule owned by another tenant is reported as not found with no data change. The web app can now end the browser session: a logout control in the tenant shell and the parent surfaces deletes the auth and tenant cookies, purges the client cache, and returns the user to `/login`. A tenant can now see the enrollments of its own classes with each row's payment status at `/dashboard/tenant/enrollments`, behind the academic `enrollment:read` permission, with the newest billing transaction joined per row. Role and permission decisions are now tenant-scoped: identity only counts an assignment when the role belongs to the tenant being operated on or is a system role, an invitation is rejected when the role it would grant is neither, and academic sends that tenant on every internal permission check. Academic enforces those permissions on catalog, student, and enrollment operations for tenant-side callers, while parent tokens skip the lookup and remain governed only by the handler's owned-resource rules. Billing can now recover a durable enrollment job that exhausted its retry limit: two internal-credential endpoints list reconciliation rows by status and move permanently failed ones back to pending without waiting for a provider callback, and every reconciliation transition is written to the service log with the transaction and enrollment ids. Invitation creation now reports the email delivery outcome: identity answers 201 with `data.email_sent` and an outcome-specific message, logs delivery failures with the invitation and tenant IDs, and bounds the Resend call with a 10-second timeout, while the members screen mirrors the outcome and keeps the invite form open when the email did not go out. See [architecture](docs/02-architecture.md).

```mermaid
flowchart LR
  Browser --> Web[Next.js web :3000]
  Web --> Gateway[API gateway :8000]
  Gateway --> Identity[Identity HTTP :8080]
  Gateway --> Academic[Academic HTTP :8081]
  Gateway --> Billing[Billing HTTP :8082]
  Gateway --> Chat[Chat HTTP :8083]
  Academic <-->|gRPC :50051| Identity
  Academic -->|internal HTTP| Billing
  Billing -->|internal HTTP| Academic
```

**Implemented (KEL-119, KEL-120):** chat-service persists staff, private schedule-request and report conversations and text messages with direct authenticated HTTP access, academic context checks on creation, identity permission and tenant-name lookup, and service-owned PostgreSQL. Since KEL-121 it also serves ticket-based realtime WebSocket events (`message.created`, `conversation.read`) fanned out in-memory on a single instance. Since KEL-122 the gateway exposes the chat routes (seven protected REST routes plus the ticket WebSocket upgrade); since KEL-123 parent and tenant web dashboards provide chat inboxes, send/retry, and ticket-based realtime with REST fallback. See [chat component](docs/components/chat-service.md), [API](docs/api/chat.md) and [schema](docs/data/chat-schema.md).

## Navigation

- [Executive summary](docs/00-executive-summary.md), [system context](docs/01-system-context.md), and [architecture](docs/02-architecture.md)
- [Local development](docs/03-local-development.md), [configuration](docs/04-configuration.md), [security](docs/05-security.md), [testing](docs/06-testing-and-quality.md), and [operations](docs/07-operations.md)
- [Known gaps and risks](docs/08-known-gaps-and-risks.md)
- Planning: [AI orchestrator implementation plan](docs/planning/ai-orchestrator-implementation-plan.md)
- Runbooks: [AI orchestrator operations](docs/runbooks/ai-orchestrator-operations.md)
- Components: [web](docs/components/web.md), [gateway](docs/components/api-gateway.md), [identity](docs/components/identity-service.md), [academic](docs/components/academic-service.md), [billing](docs/components/billing-service.md), [chat](docs/components/chat-service.md)
- API: [overview](docs/api/overview.md), [endpoint matrix](docs/api/endpoint-matrix.md), [authentication](docs/api/authentication.md), [gateway](docs/api/gateway.md), [identity](docs/api/identity.md), [academic](docs/api/academic.md), [billing](docs/api/billing.md), [chat](docs/api/chat.md)
- Data and flows: [data overview](docs/data/overview.md), [chat schema](docs/data/chat-schema.md), [authentication](docs/flows/authentication.md), [academic](docs/flows/academic.md), [billing](docs/flows/billing-and-subscriptions.md), [callback](docs/flows/payment-callback.md)
- Reference: [repository map](docs/reference/repository-map.md), [dependencies](docs/reference/dependency-matrix.md), [environment](docs/reference/environment-variables.md), [ports](docs/reference/ports-and-protocols.md), [glossary](docs/reference/glossary.md), [evidence index](docs/reference/evidence-index.md)

## Conventions and limitations

**Implemented** means confirmed in executable source. **Configured** means a setting/dependency exists but execution was not established. **Inferred** is a code-supported conclusion. **Not found** means searched but absent. **Unknown** cannot be settled statically.

The review was static: services, migrations, seeders, payment callbacks, email delivery, and external APIs were deliberately not run. Generated Swagger is useful but route registration and handler code win where they disagree. This independent repository has no declared documentation license because none was found in the source repositories.
