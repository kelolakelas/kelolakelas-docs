# ADR 0087: Immutable private proposal selection (KEL-230)

## Decision

The existing approval endpoint accepts `selected_slot_indexes` (zero-based proposal
indexes), `proposal_snapshot` (the complete ordered `slots` read by the reviewer),
and `expected_private_slot_limit` (the nullable class limit read by the reviewer).
The server compares the snapshot and limit under the existing request/class locks.
Only indexes into the stored proposal are accepted; empty, duplicate, foreign or
stale choices fail before materialization. Selection is normalized to proposal
order. No arbitrary timetable or new endpoint is introduced.

Persist nullable JSONB `approved_slots` separately from immutable original
`slots`. Save it in the same transaction as enrollment, schedules, sessions and
decision/chat capture. Approval chat uses approved slots; recommendation consent
continues to use the agreed recommendation without a new selection flow. Price
remains the class price, independent of slot count.

Materialized retries reuse the stored timetable before reading the current cap.
An explicit different selection fails with conflict, including invoice failures
that reopened the request. A bodyless retry reuses the persisted decision.
Bodyless first approval remains compatible only for legacy NULL-limit classes;
bounded classes require explicit selection, not implicit truncation or first-slot
choice. Existing approvals with no selection marker retain their old timetable.

## Alternatives And Rollout

Persisted per-proposal IDs require rewriting historical proposals; indexes alone
cannot detect stale proposals. Snapshot-qualified indexes avoid both. Silent
all-slot defaults for bounded classes would bypass deliberate admin consent.

Apply the additive migration, deploy academic, then web. Old bounded clients get
an actionable validation error until upgraded. Gateway forwards the existing raw
body. Roll back web first; do not remove the persisted selection while any
consumer may retry an approval. Migration rollback refuses to drop real decisions.

## Verification

This records the contract before implementation, not completed acceptance or a
production deployment. Executed evidence is tracked separately for KEL-230.
