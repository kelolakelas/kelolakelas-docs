# KelolaKelas current-state documentation

This is an evidence-based onboarding and operations guide for the implementation found on 2026-09-15 (Asia/Jakarta). It describes code as it exists; it is not a design proposal or deployment runbook.

## Scope and snapshot

| Repository | Branch | HEAD | State at inspection |
|---|---|---|---|
| `kelolakelas-web` | `main` | `c9c1ff22c7782738cd66ef530d7346cc212fa1f3` | clean |
| `kelolakelas-api-gateway` | `main` | `5327d10eb9b2f5351b268b0363552d7ca1ab5a78` | clean |
| `kelolakelas-identity-service` | `main` | `0b2301827342b542ece395ec0a8a316279342e2d` | clean |
| `kelolakelas-academic-service` | `main` | `74e01fa666788c5404ee46bb6cf30be1c081038a` | clean |
| `kelolakelas-billing-service` | `main` | `f25a3fbb73e46469e180981f5f7d3a663547efde` | clean before KEL-8 |

**Implemented:** KelolaKelas is a Next.js App Router UI, a Gin reverse-proxy gateway, and separate identity, academic, and billing Go services. The code configures PostgreSQL per stateful service, Redis for gateway rate limiting and identity permission caching, identity gRPC on `:50051`, Duitku payment requests, Resend email, and optional Google Maps geocoding. Parent enrollment now uses the public catalog detail page to select an owned student and schedule before redirecting to the backend-provided checkout URL. See [architecture](docs/02-architecture.md).

```mermaid
flowchart LR
  Browser --> Web[Next.js web :3000]
  Web --> Gateway[API gateway :8000]
  Gateway --> Identity[Identity HTTP :8080]
  Gateway --> Academic[Academic HTTP :8081]
  Gateway --> Billing[Billing HTTP :8082]
  Academic <-->|gRPC :50051| Identity
  Academic -->|internal HTTP| Billing
  Billing -->|internal HTTP| Academic
```

## Navigation

- [Executive summary](docs/00-executive-summary.md), [system context](docs/01-system-context.md), and [architecture](docs/02-architecture.md)
- [Local development](docs/03-local-development.md), [configuration](docs/04-configuration.md), [security](docs/05-security.md), [testing](docs/06-testing-and-quality.md), and [operations](docs/07-operations.md)
- [Known gaps and risks](docs/08-known-gaps-and-risks.md)
- Planning: [AI orchestrator implementation plan](docs/planning/ai-orchestrator-implementation-plan.md)
- Runbooks: [AI orchestrator operations](docs/runbooks/ai-orchestrator-operations.md)
- Components: [web](docs/components/web.md), [gateway](docs/components/api-gateway.md), [identity](docs/components/identity-service.md), [academic](docs/components/academic-service.md), [billing](docs/components/billing-service.md)
- API: [overview](docs/api/overview.md), [endpoint matrix](docs/api/endpoint-matrix.md), [authentication](docs/api/authentication.md), [gateway](docs/api/gateway.md), [identity](docs/api/identity.md), [academic](docs/api/academic.md), [billing](docs/api/billing.md)
- Data and flows: [data overview](docs/data/overview.md), [authentication](docs/flows/authentication.md), [academic](docs/flows/academic.md), [billing](docs/flows/billing-and-subscriptions.md), [callback](docs/flows/payment-callback.md)
- Reference: [repository map](docs/reference/repository-map.md), [dependencies](docs/reference/dependency-matrix.md), [environment](docs/reference/environment-variables.md), [ports](docs/reference/ports-and-protocols.md), [glossary](docs/reference/glossary.md), [evidence index](docs/reference/evidence-index.md)

## Conventions and limitations

**Implemented** means confirmed in executable source. **Configured** means a setting/dependency exists but execution was not established. **Inferred** is a code-supported conclusion. **Not found** means searched but absent. **Unknown** cannot be settled statically.

The review was static: services, migrations, seeders, payment callbacks, email delivery, and external APIs were deliberately not run. Generated Swagger is useful but route registration and handler code win where they disagree. This independent repository has no declared documentation license because none was found in the source repositories.
