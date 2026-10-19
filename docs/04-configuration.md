# Configuration

All Go services call `godotenv.Load()`, then Viper reads `.env` if present and consults process environment. Variables and defaults are inventoried in [environment variables](reference/environment-variables.md). Billing's `SUBSCRIPTION_GRACE_PERIOD_DAYS` defaults to 7 when unset or nonpositive; it controls the renewal scan and overdue suspension boundary, not the Duitku invoice lifetime. Apply billing migration `20261002020000_subscription_lifecycle` before enabling the KEL-150 worker deployment. `JWT_SECRET` is required by every Go service that issues or verifies JWTs (gateway, identity, academic, and billing): it must be nonblank and use the same strong value at each JWT boundary. The loaders never provide a source fallback.

Configuration precedence for database settings is **Implemented:** `DATABASE_URL`, when supplied, fills otherwise-empty individual DB settings; individual settings retain precedence. Identity, academic, and billing validate PostgreSQL scheme and channel-binding value. Evidence: their `internal/config/config.go` `applyDatabaseURL` functions.

The web reads variables directly at render/action time. `NEXT_PUBLIC_*` values are browser-exposable by Next.js convention; do not use them for secrets. `AUTH_COOKIE_NAME` and `TENANT_ID_COOKIE_NAME` are cookie keys, not credentials.


## Academic parent notifications (KEL-155)

Apply migration `1790900002` before deploying the new academic binary. Configure `CHAT_SERVICE_URL` and `INTERNAL_SERVICE_CREDENTIAL` to reach chat directly, plus `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for email. Never publish credential values. `PARENT_NOTIFICATION_WORKER_ENABLED` defaults to `true`; setting it `false` pauses dispatch but leaves transactional capture active. `PARENT_NOTIFICATION_INTERVAL_SECONDS` defaults to 15 and must be 1–3600. `RESEND_FROM_EMAIL` is optional at startup but, when supplied, must parse as an email address. Missing sender/key leaves email deliveries retrying; configure dependencies before enabling the worker. HTTP timeout is fixed at 10 seconds, independent of billing's Resend timeout.

Up to 100 rows are processed per pass, one claim per actual send. Leases last 60 seconds. Exponential retry starts at 5 seconds and caps at one hour; 12 failed attempts require operator reconciliation. Email retries stop at 23 hours after the first claim, before Resend's 24-hour idempotency window. The original key, content and addresses must be preserved on retry. Successful acceptance of one channel does not retry that channel because the other failed. See [operations](07-operations.md#parent-notification-operations-kel-155).


## Academic session reminders (KEL-156)

Apply migration `1790900003_session_reminders` after `1790900002` and before the new binary, even on replicas with reminder capture disabled: notification dispatch also checks the coverage table to suppress stale reminders.

| Variable | Default | Bounds and effect |
|---|---|---|
| `SESSION_REMINDER_WORKER_ENABLED` | `true` | Enable periodic reminder capture on this replica |
| `SESSION_REMINDER_INTERVAL_SECONDS` | `900` | 1–3600 seconds; startup pass then polling |
| `SESSION_REMINDER_DAYS_AHEAD` | `1` | 1–30 calendar days after today in WIB |
| `SESSION_REMINDER_WINDOW_DAYS` | `1` | 1–7 calendar days, exclusive upper date bound |

The default window is tomorrow's whole WIB date. Changing the window does not reset coverage or resend an existing parent/session reminder. The separate `PARENT_NOTIFICATION_WORKER_ENABLED` switch controls delivery; disable both switches when pausing capture and dispatch. Existing chat credential and Resend settings are reused. Downtime that skips a date window is not backfilled after that window has passed; reschedules/new active enrollments inside the current window are reconsidered every poll. No preference is stored per parent.
