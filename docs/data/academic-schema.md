# Academic schema

**Implemented migration authority:** `kelolakelas-academic-service/migrations/00000000000000_init_schema.up.sql` plus subsequent migrations including `00001790600000_private_schedule_requests.up.sql` (KEL-107), `00001790600001_private_schedule_recommendations.up.sql` (KEL-115), and `00001790812223_add_rescheduled_from_to_class_sessions.up.sql` (KEL-134: nullable self-FK `class_sessions.rescheduled_from_session_id` linking a reschedule replacement to its origin session, partial index, no backfill).

```mermaid
erDiagram
  CATEGORIES ||--o{ CLASSES : classifies
  CLASSES ||--o{ CLASS_SCHEDULES : has
  CLASSES ||--o{ ENROLLMENTS : receives
  STUDENTS ||--o{ ENROLLMENTS : enrolls
  CLASSES ||--o{ PRIVATE_SCHEDULE_REQUESTS : requested
  STUDENTS ||--o{ PRIVATE_SCHEDULE_REQUESTS : requests
  CLASS_SCHEDULES ||--o{ ENROLLMENTS : selected
  CLASS_SCHEDULES ||--o{ CLASS_SESSIONS : generates
  ENROLLMENTS ||--o{ ATTENDANCES : has
  CLASS_SESSIONS ||--o{ ATTENDANCES : records
  ENROLLMENTS ||--o{ REPORTS : has
```

| Table | Current key facts |
|---|---|
| `categories`, `classes` | tenant IDs; class FK to category; soft deletes; catalog composite index |
| `students` | parent ID, personal fields, soft delete |
| `private_schedule_requests` | UUID primary key; tenant, class and student IDs (class/student FKs), parent ID and email, billing cycle, JSONB weekly slots, optional note and rejection reason, status (`pending`, `approved`, `rejected`, `declined`, `cancelled`), created/decided timestamps. KEL-115 adds nullable JSONB `recommended_slots` for tenant offers; `declined` records a parent-declined recommendation. Partial unique index on `(student_id, class_id)` where `status = 'pending'`; tenant/status and parent/created indexes support scoped lists (KEL-107). The request row stores approval state and resulting enrollment reference; no enrollment or invoice is created merely by submitting a request. |
| `enrollments` | student/class FKs; schedule FK; unique non-null idempotency key; partial unique active/pending student/class. Status `dropped` is also what billing-driven seat release writes when a payment fails or expires, which frees the seat because the capacity predicate counts only `pending`/`active` (KEL-26, [ADR 0012](../adr/0012-release-enrollment-seat-on-failed-payment.md)). Since KEL-149 the lifecycle also includes `suspended`, written only by the internal suspend endpoint and likewise seat-free; resume reclaims the seat under lock and end writes `dropped` ([ADR 0050](../adr/0050-enrollment-suspend-resume-end.md)) |
| `class_schedules`, `class_sessions` | schedule capacity positive; class FK; schedule/session enrolment FKs added conditionally. `class_schedules.sessions_generated_until` (DATE, internal) is the last date already generated; partial unique index `uq_class_sessions_schedule_date (schedule_id, session_date) WHERE schedule_id IS NOT NULL` covers soft-deleted/cancelled/rescheduled rows too (migration `00001790492411`, KEL-90, [ADR 0042](../adr/0042-rolling-session-generation-horizon.md)). Since KEL-134 `class_sessions.rescheduled_from_session_id` (nullable self-FK, partial index `idx_class_sessions_rescheduled_from`) links a reschedule replacement to its origin session so its cohort resolves without a schedule; pre-migration replacements keep NULL and use the status fallback ([ADR 0052](../adr/0052-reschedule-replacement-origin-link.md)) |
| `attendances`, `student_notes`, `reports` | attendance unique `(session_id,enrollment_id)` — since KEL-134 the bulk upsert (`POST /api/v1/attendance/bulk`) writes whole sessions against it idempotently, rows carrying the session's own date; reports have enrollment FK and soft delete |
| `tenant_location_snapshots`, `seed_versions` | public-catalog tenant-location cache; seed tracking |

`class_schedules.capacity` is the current write target; `classes.capacity` is retained for compatibility according to migration `000004`. All times were migrated to PostgreSQL `time` in `00001786681222`.
