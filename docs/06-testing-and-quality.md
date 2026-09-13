# Testing and quality

**Implemented:** Go unit tests exist for config, middleware, selected handlers/use cases, database utilities, migration tooling, Duitku signatures, email client, and subscription worker. Web exposes `eslint` via `npm run lint`, but no web test script is present. Evidence: `rg --files` under each repository and `package.json`/`Makefile`.

No tests were run for this documentation snapshot: doing so may compile with the host Go version and could require module/cache changes; no end-to-end configuration or external-service sandbox was authorized. Static checks performed are recorded in the root README and evidence index.

Swagger JSON/YAML is generated and present for all three services. Treat it as a secondary contract: it can lag route/handler changes, as indicated by stale `Tutorin` copies under web `_docs/api`.
