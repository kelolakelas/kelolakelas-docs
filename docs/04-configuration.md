# Configuration

All Go services call `godotenv.Load()`, then Viper reads `.env` if present and consults process environment. Variables and defaults are inventoried in [environment variables](reference/environment-variables.md). Do not use source fallback credentials outside local experimentation.

Configuration precedence for database settings is **Implemented:** `DATABASE_URL`, when supplied, fills otherwise-empty individual DB settings; individual settings retain precedence. Identity, academic, and billing validate PostgreSQL scheme and channel-binding value. Evidence: their `internal/config/config.go` `applyDatabaseURL` functions.

The web reads variables directly at render/action time. `NEXT_PUBLIC_*` values are browser-exposable by Next.js convention; do not use them for secrets. `AUTH_COOKIE_NAME` and `TENANT_ID_COOKIE_NAME` are cookie keys, not credentials.
