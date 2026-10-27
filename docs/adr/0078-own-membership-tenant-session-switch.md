# ADR 0078: Own-membership tenant sessions and browser context replacement

Status: accepted for KEL-224. Date: 2026-10-27.

## Context

Identity already stores one membership per tenant/user, but ordinary login selected
one active membership without a way to choose another. A tenant JWT carries one
tenant, role and membership. Browser cookies are shared between tabs, while React
state, pending actions, caches and chat sockets belong to the document.

## Decision

**Implemented:** identity exposes authenticated `GET /api/v1/auth/memberships` and
`POST /api/v1/auth/tenant` with `{ "tenant_id": "<uuid>" }`. The first returns an
array of `{tenant_id, tenant_name, member_id, role_id, role_name}` for the signed-in
account's active, non-deleted memberships in active, non-deleted tenants. A role
must be system-owned or belong to that tenant. The browser cannot choose role or
member IDs. Choices are ordered by tenant name and ID.

Switch re-reads the user and chosen membership in a PostgreSQL transaction. `FOR
SHARE` holds the user, membership, tenant and role against reset, revocation,
deletion and role changes through token issuance and commit. A concurrent revoke
that wins the row lock is re-evaluated before issuance. Both endpoints verify JWT
signature/expiry and the committed user session boundary; parent, platform and
pending-factor principals are refused. User parent status is checked again in
storage. Backend error responses do not disclose storage details. Invalid session
is 401, unavailable/non-owned membership or forbidden principal is 403, invalid
target UUID is 400, infrastructure failure is 503. Successful responses are
`no-store`; switch returns `data.token` and `data.membership`.

Gateway routes use the existing signature and live session checker, strip browser
context headers and publish the tenant from the verified JWT. Target tenant in the
switch body is only an input to the identity ownership check. Existing permission
checks remain authoritative for every domain operation.

The web keeps single-membership login direct and shows the active tenant and role
in the tenant shell. Several choices expose a native, labelled select and explicit
confirmation explaining that unsaved work on all tabs is discarded. An own-scope
Server Action writes both HttpOnly cookies only after a valid matching response,
then invalidates the layout. A Web Lock serializes cooperating browser switches.
Browsers without Web Locks or allowed local storage receive an explicit recovery
message before any switch request.

An opaque hash of auth/tenant cookies is a UI cache boundary, not authorization.
Before switch, local storage plus the same-tab event unmount the complete tenant
subtree, including badge pollers and chat. On completion every tab loads the tenant
overview as a new document. Focus/pageshow and a 10-second cookie-scope read via
`GET /api/tenant-context` reconcile missed events and new logins. A recovery button
re-reads cookies after acquiring the switch lock, including when the initiating
tab closes. Tokens never enter browser storage or that scope endpoint.

Tenant Server Action fetches are bound to the original document scope using
`X-Tenant-UI-Scope`. The Next proxy rejects a mismatching scope with 409 before the
action can use replacement cookies. The client discards that obsolete action
response and reloads the document. This prevents a late form/action from using a
different tenant's new cookies. It does not grant authority or replace backend
JWT, ownership or permission checks. Existing callers without the UI header keep
their previous backend authorization behavior.

## Alternatives and consequences

Keeping component trees alive and clearing individual stores would require every
consumer to correctly invalidate its own state. Replacing the document and
unmounting it before issuance creates one lifecycle boundary and closes sockets.
The cost is losing unsaved forms, explicitly confirmed before switch. A failed
switch leaves cookies unchanged and reloads the previous context with a recovery
message; an uncertain response is reconciled against cookies.

No memberships, accounts, wallets, schema or persisted last-tenant preference are
created. Login continues choosing one deterministic active membership. Password
reset and platform factor checks retain their existing boundaries. Previously
copied tenant JWTs remain scoped to their original tenant until expiry/revocation;
switch is not logout from other devices or a global token revocation mechanism.

Deploy identity and gateway before web. Rollback web first; additive endpoints can
remain available. The identity PR gate provisions disposable PostgreSQL and runs
the real migration, issuance, ownership and concurrent-revocation suite. Both Go
repositories use minimum Go 1.26.10 to satisfy the existing vulnerability gate for
[GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809).

## Evidence

Identity `internal/{domain,repository,usecase}/tenant_session.go`,
`internal/delivery/http/handler/tenant_session{,_integration_test}.go`; gateway
`internal/delivery/http/tenant_session_route_test.go`; web
`components/Tenant{Switcher,ContextBoundary}.tsx`, `lib/tenant-*`, `proxy.test.ts`.
See [acceptance evidence](../evidence/kel224-tenant-session-switch.md).
