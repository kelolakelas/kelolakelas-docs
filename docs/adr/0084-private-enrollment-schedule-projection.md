# ADR 0084: scoped private enrollment schedule projection

Status: accepted for KEL-222.

## Context

Private approval stores multiple `class_schedules` linked by `enrollment_id`; its enrollment has no singular `schedule_id`. Group enrollment instead references one schedule. The tenant web's first100 tenant-wide schedule lookup could describe neither private slots nor schedules outside that page.

## Decision

Add optional `private_schedules` to `EnrollmentResponse` on the existing scoped list/detail. Each element contains schedule version `id`, day/start/end, optional location, and optional `valid_from`/`valid_until`. Do not expose tutor identity or capacity. Keep group `schedule_id`/`schedule` unchanged. Raw Enrollment JSON and write responses do not acquire this projection.

The repository loads the private collection in one batch for only the enrollment IDs already admitted by tenant/parent scope and whose live private Class matches the enrollment tenant. SQL additionally joins enrollment/class IDs and class tenant, excludes soft-deleted enrollments/classes/schedules, and restricts class type. Read failure fails the endpoint; it never becomes a successful empty collection. The response mapper rechecks enrollment/class ownership and emits each version ID once.

Include retained ended, current and future versions, ordered by ISO day, start time, valid_from (null first), then ID. Existing replacement logic closes the old version and creates a new row retaining EnrollmentID. Both versions remain meaningful history with disjoint effective periods; do not collapse them into an arbitrary slot or hide pending-payment slots. Exclude deleted versions. A deleted/missing Class does not produce a private projection. An explicit loaded `[]` means no retained visible slot; absent projection means unavailable to a client that knows the class is private.

The existing gateway transparently proxies the additive shape. Tenant and parent web use the shared schedule label, preserve version order, deduplicate IDs, show periods and keep line breaks on mobile/desktop. Tenant stops scanning `/schedules`. A new endpoint or frontend pagination scan was rejected because the authorized enrollment is already the stable owner and batching avoids both scan truncation and N+1 reads.

## Rollout and consequences

Migration00001790900005 adds a partial `class_schedules(enrollment_id)` index for non-deleted, enrollment-owned rows. The previous class/day index does not directly index this lookup. It changes no data/column; normal migration locking must be budgeted by the operator. Rollback drops only the new index. Apply through the normal migration process, then deploy Academic and web; either consumer order remains compatible, with an unavailable label until the projection exists. No shared development or production migration is claimed.

Academic adds at most one schedule round trip per scoped enrollment page, regardless of enrollment count. Collections are not capped by the tenant schedule page size; large version histories can grow the response. Payment lifecycle, session generation, permissions and billing reads are unchanged. See [evidence](../evidence/kel222-private-enrollment-schedules.md).
