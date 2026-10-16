# ADR 0069: Complete class editor and protected schedule versions

Status: Implemented (KEL-198, 2026-10-16).

The creation form exposes capacity, location, Teacher and class attributes that the old editor could not manage. A class can already have sold enrollments and attendance; editing those records in place would change historical meaning.

Extend the existing class PATCH additively, with inline category and class Teacher replacement in its transaction. Reuse the existing permanent schedule PUT with optional capacity/location/tutor overrides. Lock the owned schedule (shared with capacity reservation), reject capacity below reserved pending/active seats, lock affected sessions and reject completed/attended history, then create the replacement version, transfer live enrollment links and regenerate upcoming sessions atomically. Omission preserves older clients' fields. A zero tutor UUID explicitly clears assignment; nonzero tutors require active tenant membership. Today follows Asia/Jakarta; past edits are refused. Deletion requires no live seats and no affected attended/completed session.

Keep group/private type immutable and private scheduling per enrollment. Keep sold price snapshots untouched. Use separate, explicit save operations for class details and each schedule, with persisted state reload after success or failure and honest partial failure. Reuse the create schedule form and shared validation; remove the redundant Add Schedule entry points only after embedding that capability. Initial modal open reads all list pages and fails closed on incomplete reads.

A single atomic editor aggregate would require retry ownership and coordination across heterogeneous existing mutations; it is unnecessary for the specified per-operation outcome. In-place historical changes and silent capacity reductions were rejected. No migration, gateway route or new enrollment/payment policy is introduced. Deploy the additive academic API before the web editor.

Evidence: academic class/schedule DTOs, handlers, repositories and usecases; PostgreSQL editor and permanent-change regressions, including injected rollback, seats, attendance, tenant and sold-price assertions. Web editor/action tests and opt-in real gateway → academic → disposable PostgreSQL integration verify save/reopen, capacity refusal, versioning and add/delete. Identity responses are controlled test doubles. No production data or provider integration is used, and browser screenshots/live rollout are not claimed by these tests.
