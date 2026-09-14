# Testing and quality

**Implemented:** Go unit tests exist for config, middleware, selected handlers/use cases, database utilities, migration tooling, Duitku signatures, email client, and subscription worker. Web exposes Vitest through `npm run test`, plus `eslint`, TypeScript checking, and production build commands. Auth-routing and proxy regression tests cover role-aware destinations, open-redirect rejection, and malformed/expired cookie handling. Evidence: `rg --files` under each repository and `package.json`, `lib/auth-routing.test.ts`, and `proxy.test.ts`.

No tests were run for this documentation snapshot: doing so may compile with the host Go version and could require module/cache changes; no end-to-end configuration or external-service sandbox was authorized. Static checks performed are recorded in the root README and evidence index.

Swagger JSON/YAML is generated and present for all three services. Treat it as a secondary contract: it can lag route/handler changes, as indicated by stale `Tutorin` copies under web `_docs/api`.
