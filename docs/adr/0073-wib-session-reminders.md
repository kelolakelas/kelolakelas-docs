# ADR 0073: WIB calendar-date parent session reminders

Status: Implemented (KEL-156, 2026-10-19).

## Context and decision

Reuse KEL-155's outbox, chat/email transport, immutable snapshots and bounded retries. Interpret H-1 as tomorrow's whole Asia/Jakarta calendar date, matching the issue's “sesi besok” acceptance criterion. Convert the clock to WIB (UTC+7) before deriving date-only bounds; never use host timezone or an elapsed 24-hour window. Configurable day offset (default 1), width (default 1 day) and polling (default 900 seconds) define a half-open calendar window. A separate enable flag controls capture. No per-parent preference or teacher reminder is introduced.

## Durable capture and concurrency

Select only live scheduled sessions, live classes/students and active enrollments scoped by class/tenant and private enrollment or resolved group schedule. Lock up to 100 sessions per transaction with SKIP LOCKED, then drain batches. A materialized eligible-recipient snapshot feeds both the existing outbox and a `(session_id,enrollment_id)` coverage ledger atomically. A deterministic UUID for each session event plus the outbox parent/channel unique key suppresses replay across replicas, restarts and window changes. The ledger indexes the event so the existing dispatcher can distinguish reminder rows without changing external provider contracts.

Siblings present at capture are grouped once per parent/channel. A late new parent can receive a reminder on the next poll inside the date window; a new sibling for an already-reminded parent/channel is covered without a duplicate message. Already-queued content is immutable. Missing verified-email enrollments remain chat-only, including when grouped with an email-bearing sibling. Coverage means captured, not delivered.

Follow same-class reschedule ancestors with cycle protection: already-covered enrollments rely on KEL-155 reschedule notices, while a replacement moved into the window before any reminder coverage is picked up on the next pass. Before each dispatch claim, stale reminder rows whose session is no longer scheduled/live or whose parent has no qualifying active covered enrollment are marked failed with a safe `reminder_no_longer_eligible` code. Other notification events are unaffected. Capture and dispatch both require the new migration.

## Alternatives and limits

A rolling 24-hour interval was rejected because it does not mean tomorrow near midnight. In-memory flags and a global cron singleton were rejected because restarts or extra replicas duplicate reminders. Separate per-enrollment messages were rejected because siblings would receive duplicate parent notices; the ledger retains per-enrollment coverage while deliveries group by parent/channel. Sending directly in the reminder pass was rejected because provider latency must not hold session locks.

Missed windows are not backfilled after the selected dates have passed. Eligibility is checked at capture and again at claim; concurrent changes after claim or provider acceptance cannot recall messages. The immutable payload can still contain a sibling who became inactive after capture while another sibling remains active. Down migration refuses to discard nonempty coverage; disable capture/dispatch to pause rather than deleting rows. No shared environment migration or new live provider send is inferred from automated tests.

## Evidence

Fake-clock tests cover WIB midnight, month/year/leap boundaries, process timezone independence, custom windows, batching, cancellation and repository errors. PostgreSQL tests cover replay/window changes, siblings/late enrollments, private/group/tenant/deleted/inactive boundaries, concurrent workers, atomic outbox/coverage rollback, post-pass reschedule capture, ancestor coverage and suppression of stale queued reminders. Provider-double acceptance executes reminder repository → shared dispatcher → chat/Resend HTTP retry with stable identities. The existing migration-driver regression advances through version 1790900003.
