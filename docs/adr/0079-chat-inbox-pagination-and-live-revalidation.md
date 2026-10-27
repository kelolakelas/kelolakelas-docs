# ADR 0079: Recoverable chat inbox reads and live delivery checks

Status: accepted for KEL-223. Date: 2026-10-27.

## Observed problem

**Reproduced:** with 105 persisted request conversations, the oldest is absent
from page 1 but present on page 2 and direct GET. The old browser timer replaced
its entire list with page 1, unlike manual refresh's direct-room recovery. The
old backend converted permission RPC failures into false: the same database
returned HTTP200 with an empty list and HTTP404 for an existing room/messages.
The old staff-owner path also skipped live membership checks. These mechanisms
explain disappearance without deleting conversation rows. Evidence is in
[KEL-223 acceptance](../evidence/kel223-chat-inbox-recovery.md).

## Decision

**Implemented:** REST permission and membership failures return generic 503.
Actual permission denial retains empty authorized list/404 detail semantics;
inactive membership returns 403 list and masked 404 detail. Production chat wires
identity's existing `CheckActiveMembership` RPC, including for staff owners, while
active staff owners still need no `chat:manage`. Parent ownership and immutable
conversation participants are unchanged. RPC deadlines use the existing timeout;
malformed boolean responses are unavailable, not false permission results.

List resolves active membership and each permission once per request, then uses
those request-local rights in SQL before pagination and in the defensive filter.
It does not issue two permission calls for every row. Pagination remains the
existing `page`/`page_size` array contract, with deterministic database ordering.
No migration, cursor API, archive/delete feature or gateway contract is added.

The shared inbox exposes Load older conversations, refreshes every requested page
and deduplicates by ID. Paging intent is reserved before awaiting so a concurrent
poll/reconnect cannot contract the user's expanded list back to page1. Selection,
timer/focus, manual refresh and reconnect share one generation-guarded read path.
The selected/deep-linked room is revalidated by direct GET even outside the
visible page window. Obsolete reads cannot commit after a newer request, selection
or account/tenant scope remount. Error and successful empty states are distinct;
initial page errors provide an explicit retry. Selection updates the existing
conversation query so a hard reload retains the selected room.

Uncertain/unavailable reads hide server messages and rooms pending revalidation.
Locally pending/failed deliveries retain their original retry key, hidden until
the room is authorized again. Confirmed denial clears the selection/cache and
disables reply. Existing message merge, read watermark and idempotent send remain
the persistence authority. Browser WS events trigger authoritative reads rather
than directly inserting payloads from a potentially obsolete connection. A read
acknowledgment refreshes without another read mutation, avoiding feedback loops.
Send results use the selection generation so an intervening poll cannot strand
a failed local delivery while navigation still invalidates obsolete results.

Connect-time WS rights remain an upper bound: a new permission grant does not add
access to an existing socket. Before each queued frame is written, the connection
pump rechecks the persisted conversation through the same live REST visibility
gate. Denial or dependency failure closes that socket with policy violation and
no payload; reconnect uses updated rights. This tightens ADR0047's previous
connect-only revocation window without distributed fan-out or a new event shape.
The live check runs outside hub locks, is deadline-bounded, and retains the existing
bounded per-connection queue and slow-consumer policy.

## Alternatives and consequences

Keeping a missing room forever in browser cache would retain revoked access.
Refreshing only page1 loses older rooms; scanning every page automatically imposes
unbounded work for every inbox poll. Refreshing the explicitly requested window
plus one authorized direct room preserves navigation intent with bounded user
control. Offset pagination can move under concurrent message ordering; dedup and
direct active-room recovery handle that without claiming a point-in-time snapshot.

Per-frame live authorization adds one persisted read and bounded identity checks
to relevant outbound frames. An identity outage disconnects affected tenant
sockets and makes REST visibly retryable, rather than keeping stale authority or
claiming an empty inbox. Parent-owned reads need no tenant permission RPC.

Deploy chat before web; identity's membership RPC is already on main (KEL-135).
No environment changes except the existing identity timeout/host. Chat's minimum
Go patch is 1.26.10 for the existing reachable-vulnerability gate. The chat CI gate
provisions disposable PostgreSQL and enables `KEL223_TEST_DATABASE_URL`; its test
creates and removes a unique schema and applies the actual migration chain.
