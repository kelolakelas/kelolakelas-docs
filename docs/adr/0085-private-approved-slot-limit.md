# ADR 0085: Private approved weekly-slot limit (KEL-229)

## Decision

Add nullable PostgreSQL integer `classes.private_slot_limit`. Existing rows stay
NULL (legacy all-slots behavior); new private classes default to 1 when an older
client omits the field. Explicit values must be positive integers within the
PostgreSQL integer range. Group classes reject this private-only field. Existing
class-type immutability remains unchanged; update omission/null preserves the
stored value and cannot clear an established limit.

The limit counts distinct weekly timetable slots in a single purchase decision,
not students, generated sessions, schedule history or other enrollments. Parent
proposal validation remains unchanged. Bodyless approval takes all proposals and
fails without side effects when their count exceeds the current limit. Tenant
recommendations are checked before persistence and again at parent acceptance.

Pending decisions lock the request then the class, using the same class row lock
as class edits. Materialized enrollment retries reuse existing artifacts before
consulting the current limit. Billing I/O remains outside the transaction. This
keeps edits forward-only and avoids changing an already agreed purchase intent.

## Alternatives and rollout

Backfilling 1 would silently change legacy commitments; frontend-only validation
would allow direct API/stale-form bypasses. Counting sessions/history would turn
calendar length or rescheduling into a purchase policy. These are rejected.

Apply migration 1790900006 before academic, then deploy web. Gateway continues
forwarding raw JSON. Roll back applications before dropping the column. No
existing schedule, enrollment, invoice or event is migrated. Subset selection is
explicitly deferred to KEL-230; too-large proposals require a smaller tenant
recommendation meanwhile, not silent truncation.

## Verification

Implementation and executed checks are recorded separately in the KEL-229
acceptance evidence; this ADR does not claim deployment or test success.
