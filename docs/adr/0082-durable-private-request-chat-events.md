# ADR 0082: durable private request chat with captured human actors

Status: accepted for KEL-226; 27 October 2026 (Asia/Jakarta).

## Context and scope

Private request submission and decisions previously required manual chat/payment-link actions. A browser callback cannot guarantee eventual delivery after the business transition commits. Human attribution must come from that committed transition, never an arbitrary sender field supplied to chat. Background delivery must not persist, mint or impersonate a user's JWT.

The owner explicitly approved a minimal internal read-only billing contract after inspection found that current invoice reads require a user session. The billing change is developed from main in a separate worktree; unmerged KEL-221 activation changes are not dependencies.

## Decision

Academic's production private-request repository captures an immutable event and an outbox row in the same PostgreSQL transaction as create/approve/reject. A private-request version distinguishes reopened decisions. Events contain the verified actor, tenant/parent/class/student scope, class/student display snapshot, slots and rejection/recommendation facts. The original repository constructor remains for legacy in-process consumers; production unconditionally uses the capturing constructor. Actor context is populated by JWT middleware and decision routes retain their existing live operation permission guards. Missing/mismatched actor context rolls back the mutation.

Submission is parent-authored; direct approve/reject is member-authored by the deciding admin. A parent accepting a recommendation is a distinct parent-authored `recommendation_accepted` event. This truthfully attributes the actual transition and also supports legacy recommendations that have no recorded admin actor. The original admin's rejection/recommendation remains its separate event. Replaying approval as another admin does not rewrite the first event's actor. Reopening a provisional approval after platform-fee rejection supersedes its unsent delivery; a later approval captures a new version and actor.

The worker claims with SKIP LOCKED, a 90-second lease, token fencing and bounded retries. Earlier pending/sending/failed events of one request hold later ones so recovery preserves causal order. Captured intent survives a disabled worker, a chat outage and process restart. Credential-protected diagnostics expose only event/request IDs, kind, attempt/status, scheduling and bounded error codes; operators can requeue a failed event without repeating the business decision or invoice creation.

Chat receives only event/request/tenant/parent identifiers at POST `/internal/private-request-events`. It obtains the persisted projection from Academic and validates exact scope and actor kind. It reuses the frozen-parent schedule-request conversation and inserts one parent/member message with a globally unique source_event_id. Replays reuse the existing message and do not broadcast or update last-message time again. The `private-event:` client key namespace is reserved from public send. Existing message/read/unread/WebSocket authorization remains in force.

Approval projections resolve Academic's request→enrollment idempotency linkage, then POST to billing `/internal/billing/private-request-invoice` using the existing internal credential. Billing matches transaction/enrollment/tenant/parent/student, the private flag and the initial transaction identity. Billing has no stored request-id/idempotency-key column, so it does not pretend to verify that linkage independently. It returns only scoped IDs, status, checkout URL and expiry, without financial totals or mutations. The endpoint is never gateway-proxied. Parent/admin JWTs cannot authorize it.

Chat obtains the projection again after acquiring the room lock: delayed delivery re-reads invoice status/expiry. Pending payable invoices include their authoritative checkout URL and a WIB (UTC+07:00) deadline. Paid/terminal/elapsed invoices produce a truthful decision message without a payable URL; missing/unavailable/incomplete invoices remain retryable and never imply successful payment or delivery. PostgreSQL checks wall-clock expiry again in the final insert predicate. There is no distributed transaction across billing and chat: settlement can still happen immediately after the final read; shared links remain historical messages, not a perpetual promise of payability.

Typed lifecycle bodies may contain fifty slots plus a reason and checkout URL. Chat's storage limit grows additively to8192 code points; ordinary user Send still enforces2000. Existing plain-text web rendering accepts the larger body; no web feature change is needed. The down migration refuses while longer bodies exist instead of deleting or truncating history.

## Compatibility, deployment and alternatives

Deploy billing's read contract and chat migration/protocol before academic migration/capture/worker. Configure the existing matching internal credential and service URLs. PRIVATE_REQUEST_CHAT_WORKER_ENABLED and PRIVATE_REQUEST_CHAT_INTERVAL_SECONDS control dispatch only, not capture. Roll back/pause the Academic producer first; retain events, outbox rows and chat deduplication markers. New migrations do not invent historical actors or backfill old notifications.

Rejected alternatives: user JWT storage/minting; trusting a browser actor; using parent-only notification rooms or system senders; retrying business transitions to recover chat delivery; replaying invoice creation to emulate a read; silently trimming slots or payment deadlines to the old text limit.

Manual payment-link delivery retains its system sender, key and contract. Parent-only notifications and private invoice email are unchanged. No new provider, automatic invoice regeneration, payment activation/refund change or distributed WebSocket redesign is included.

## Validation

The acceptance report records actual checks and source/merge evidence; see [KEL-226 evidence](../evidence/kel226-private-request-chat.md).
