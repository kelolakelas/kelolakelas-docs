# ADR 0083: scoped saved-class reads and editor-local teacher loading

Status: accepted for KEL-227; 28 October 2026 (Asia/Jakarta).

## Context and measured problem

The saved editor fetched every tenant class, schedule and category page, then selected one class in the web action. Class details, each saved schedule form and the new-schedule form independently loaded every member page for teacher choices. A tenant with205 unrelated classes/categories/teachers and4 selected schedules produced27 downstream reads and about3.13MB on open in the initial actual-stack benchmark. Scope is read latency and fan-out, preserving KEL-198 editing and KEL-211 draft/retry behavior.

## Decision

Add compatible protected academic reads, exposed by the existing session-checked gateway:

| Route | Permission | Data |
|---|---|---|
| GET `/api/v1/classes/:id` | class:read; parent denied | Existing class response including unpublished state, teacher assignment IDs and tenant-scoped category identity |
| GET `/api/v1/classes/:id/schedules` | class:read and schedule:read; parent denied | Existing paginated schedule fields for exactly that owned class, without enrollment/parent/payment preloads |

Permissions use the existing live identity check with authenticated tenant/role/member claims. Ownership is in SQL. Missing, foreign and soft-deleted classes yield404, even when the schedule page is empty; invalid ID/pagination400, missing session401, denied403, authorization or data dependency outage503. Reads set no-store. Existing collection and public-catalog routes retain their contracts; the editor never substitutes the public catalog for protected data.

Schedule pagination uses the existing maximum100 and page bounds, with deterministic valid_from descending/nulls-last, day, start time and UUID order. All nondeleted current/future/historical versions remain available; enrollment-owned private slots are not reclassified as group schedules. No index, cache, migration or write/history semantics change was needed. SQL query count is3 for class detail and3 per schedule page, independent of unrelated tenant rows and result size.

The web server action reads only the selected class, every selected-class schedule page and every category page. It checks DTO identity/scope and complete pagination metadata, detects duplicates/changed totals and refuses partial or malformed success. Category and teacher choices beyond100 remain available. All reads are no-store; no mutable process-wide tenant cache is introduced. Separate HTTP pages are fresh reads, not an atomic database snapshot across concurrent writes.

One provider lives inside each open ClassConfigurationEditor. All class, saved-schedule and add-schedule consumers share its single teacher loader, pending state and coalesced retry. Standalone create/schedule forms retain independent loaders. Closing/changing class unmounts the provider; old results are ignored. A successful class save refreshes the shared teacher list instead of remounting another independent loader. Ordinary explicit configuration reload preserves the existing teacher-list lifetime and draft behavior. Live membership/permission checks on reads and mutations remain authoritative; cached choices never authorize writes. No cache spans editors, users or tenants.

Reload responses are fenced so a slower older read cannot overwrite a newer operation's snapshot. Failed reads retain the prior draft and block dependent mutations until recovery; they do not become an empty saved state. Existing loading/retry/forbidden/empty feedback, effective-date/version rules and assignment validation remain in place.

## Alternatives and compatibility

Rejected: public detail reads (wrong authorization/publishing semantics); retaining exhaustive scans with a cache/index (hides fan-out and adds invalidation risk); module-global teacher caching (cross-tenant/stale-rights risk); first-page-only choices (truncation); duplicating mutation/domain logic in a new aggregate service. Two narrow reads reuse existing response shapes and permit explicit independent schedule pagination.

Deploy academic reads and gateway routes before the web consumer. No database migration. Rolling back web first leaves additive backend reads unused. No old route is removed. The normal class-list screen's existing first100 behavior is outside this selected-editor optimization; late-ID protected reads and full selected-class schedules are separately covered.

## Verification and limits

See [KEL-227 evidence](../evidence/kel227-class-editor-performance.md) for source revisions, fresh dependency proof, PostgreSQL query-count/ownership/history/freshness checks, browser benchmark distributions and acceptance screenshots. The benchmark uses synthetic disposable databases, actual production web/gateway/identity/gRPC/academic and a local gateway observer recording only path/query/status/bytes/latency. It does not measure a production SLO, external provider or distributed snapshot consistency.
