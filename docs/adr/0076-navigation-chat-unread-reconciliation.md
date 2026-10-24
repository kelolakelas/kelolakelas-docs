# ADR 0076: authoritative chat unread reconciliation in navigation

- Status: accepted for KEL-217
- Scope: web parent and permission-gated tenant navigation

## Context

Conversation lists expose viewer-specific unread message counts and offset pagination, not a total count. The inbox reads only its first 100 conversations. Navigation must cover older conversations, avoid double increments on event replay, and reconcile after cross-tab reads and outages. Opening another socket for every navigation would duplicate inbox connections and consume the backend's five-socket/user budget.

## Decision

A server action reads all visible conversation pages of 100 until exhaustion or accumulated unread reaches 100 (the display cap). It sums message counts, deduplicates conversation IDs across reordered pages, rejects malformed counts/repeated full pages and returns unknown on any partial failure. Backend ownership, active membership and permission checks remain authoritative; the UI scope is not an authorization grant.

One client provider per dashboard shares the count across desktop/mobile and secondary Chat links. It reconciles on mount/route changes, every ten seconds while visible, focus, visibility return and online. Successful inbox reads and recognized websocket events/open invalidate locally and via BroadcastChannel; only invalidation, never counts or user data, crosses tabs. All updates reread REST; there is no optimistic increment/decrement. A refresh that arrives during another read queues one follow-up, and unmount discards late results.

The server derives an opaque SHA-256 scope from the auth/tenant cookie pair, passes no token to the browser, and checks the expected scope before reading. Scope/eligibility changes remount the provider before rendering new values. Missing auth or a changed scope returns unknown. Tenant navigation starts polling only when its existing Chat nav permission is present. Zero hides the badge; unknown/loading/failure displays an accessible ellipsis, 1–99 is exact and >=100 displays 99+ with an accessible “100 atau lebih” label.

## Consequences and alternatives

Polling provides a bounded normal refresh interval without additional sockets or backend endpoints. Inbox events/read completion usually refresh sooner. Hidden tabs reconcile on return; browsers can throttle timers. Offset pagination is not a transactional snapshot: concurrent conversation reordering may move a row between pages, so subsequent reconciliation remains necessary. ID dedup prevents double counting; partial failures never claim complete zero. Reaching 100 stops traversal because a larger total has no display benefit. An exact aggregate endpoint/snapshot cursor can replace traversal later if usage warrants it; none is added here.

BroadcastChannel absence or browser-policy denial falls back to polling/focus. Existing first-page inbox behavior, backend read markers, socket transport, visibility SQL, migrations and notification delivery remain unchanged. No persistent client unread cache is introduced. See [verification evidence](../evidence/kel217-chat-navigation-unread.md).
