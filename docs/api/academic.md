# Academic API

Routes registered in `kelolakelas-academic-service/cmd/server/main.go:99-154` are the source of truth. `GET /api/v1/catalog/classes` and `GET /api/v1/catalog/classes/:id` are public; all other `/api/v1` routes require JWT. Internal activation is outside `/api/v1`.

| Area | Operations | Request/response source |
|---|---|---|
| Catalog | list/detail public classes | `catalog_handler.go`, `domain/catalog.go` |
| Categories/classes | list/create/delete, create-with-category, publication toggle | `category_handler.go`, `class_handler.go`, `domain/category.go`, `domain/class.go` |
| Schedules/sessions | create/list/delete, permanent/time or tutor changes, reschedule/substitute, attendees | `schedule_handler.go`, `session_handler.go`, `domain/schedule_dto.go` |
| Students | list/create/get/update/delete; parent list/create/update/delete is ownership-scoped | `student_handler.go`, `domain/student.go`, web `app/(dashboard)/dashboard/parent/students/**` |
| Attendance/reports | list/create/get/update (reports also delete) | respective handlers/domain files |
| Enrollments | create tenant/catalog enrollment, list/get, schedule assignment; internal activate | `enrollment_handler.go`, `domain/enrollment.go` |

The public catalog enrollment route is in the gateway’s protected group despite its path beginning `/catalog`; callers need a JWT at the gateway. This is a route-policy distinction from public catalog reads. `POST /api/v1/catalog/classes/{class_id}/enrollments` requires a parent JWT and `Idempotency-Key`; the request body contains only `student_id`, `billing_cycle`, and optional `schedule_id`. Group classes require a schedule, and any supplied schedule must belong to the selected class; capacity is rechecked under a database lock. On success it returns a payment transaction ID and checkout URL. `ErrScheduleFull` and idempotency conflicts are HTTP 409; missing class/student is 404; ownership, schedule validation, or an unpublished/closed class is 422; provider or other unexpected failures are 500. Evidence: `internal/delivery/http/handler/enrollment_handler.go`, `internal/usecase/enrollment_usecase.go`, `internal/repository/enrollment_repository.go`, and the web enrollment action.

## Student ownership and deletion guard

**Implemented:** `GET /api/v1/students` scopes parent requests by the authenticated `user_id`; tenant requests use the tenant context. Create requires `parent_id` and the academic use case rejects a parent ID that does not match the authenticated parent. Get/update/delete use the same access scope. Delete returns HTTP 409 with `Student has active enrollments` when the student still has active enrollments. The parent web page surfaces forbidden, validation, API, and conflict outcomes and never treats a client-supplied parent ID as authorization. Evidence: `kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go`, `internal/usecase/student_usecase.go`, `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_actions/actions.ts`, `lib/auth-session.ts`.

**Current-state caveat:** the academic `Student` response struct currently serializes the last-name field under the typo `lastå_name`; the web normalizes that response while sending the API request field `last_name`. This is documented behavior of the current executable code, not a new API migration.
