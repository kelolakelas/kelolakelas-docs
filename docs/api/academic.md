# Academic API

Routes registered in `kelolakelas-academic-service/cmd/server/main.go:98-160` are the source of truth. `GET /api/v1/catalog/classes` and `GET /api/v1/catalog/classes/:id` are public; all other `/api/v1` routes require JWT. Internal activation is outside `/api/v1`.

| Area | Operations | Request/response source |
|---|---|---|
| Catalog | list/detail public classes | `catalog_handler.go`, `domain/catalog.go` |
| Categories/classes | list/create/delete, create-with-category, publication toggle | `category_handler.go`, `class_handler.go`, `domain/category.go`, `domain/class.go` |
| Schedules/sessions | create/list/delete, permanent/time or tutor changes, reschedule/substitute, attendees | `schedule_handler.go`, `session_handler.go`, `domain/schedule_dto.go` |
| Students | list/create/get/update/delete; parent list/create/update/delete is ownership-scoped | `student_handler.go`, `domain/student.go`, web `app/(dashboard)/dashboard/parent/students/**` |
| Attendance/reports | list/create/get/update (reports also delete) | respective handlers/domain files |
| Enrollments | create tenant/catalog enrollment, list/get, schedule assignment; internal activate | `enrollment_handler.go`, `domain/enrollment.go` |

The public catalog enrollment route is in the gateway’s protected group despite its path beginning `/catalog`; callers need a JWT at the gateway. This is a route-policy distinction from public catalog reads. `POST /api/v1/catalog/classes/{class_id}/enrollments` requires a parent JWT and `Idempotency-Key`; the request body contains only `student_id`, `billing_cycle`, and optional `schedule_id`. Group classes require a schedule, and any supplied schedule must belong to the selected class; capacity is rechecked under a database lock. On success it returns a payment transaction ID and checkout URL. `ErrScheduleFull` and idempotency conflicts are HTTP 409; missing class/student is 404; ownership, schedule validation, or an unpublished/closed class is 422; provider or other unexpected failures are 500. Evidence: `internal/delivery/http/handler/enrollment_handler.go`, `internal/usecase/enrollment_usecase.go`, `internal/repository/enrollment_repository.go`, and the web enrollment action.

## Catalog mutation authorization

**Implemented:** authenticated category, class, schedule, and schedule-related session mutations call identity's persisted permission check before entering the handler. `category:create|delete`, `class:create|update|delete`, and `schedule:create|update|delete` are mapped at route registration. A parent token without `role_id` and a tenant member without the required assignment receive 403; an identity dependency failure receives 503. Public catalog list/detail reads remain unauthenticated. Tenant/resource ownership checks remain in the academic use cases. Evidence: `cmd/server/main.go`, `internal/delivery/http/middleware/permission_middleware.go`, and identity `internal/delivery/grpc/permission_service.go`.

## Tenant context resolution

**Implemented:** every tenant-scoped academic handler derives the tenant from the verified JWT claim. `tenantIDFromContext` reads only the `tenant_id` value `AuthMiddleware` stored from the token and never reads `X-Tenant-ID`; category, class, list, and schedule handlers call it directly, and `list_handler.go` keeps a `tenantID` wrapper onto the same helper. A request whose token carries no tenant claim receives 403, and a claim that is not a parseable non-nil UUID receives 401; unknown tenant errors fail closed to 403. Headers are inert for tenant resolution, so a caller cannot select a tenant the token does not carry. See [ADR 0010](../adr/0010-tenant-context-from-verified-jwt-claim-only.md). Evidence: `internal/delivery/http/handler/tenant_context.go`, `tenant_context_regression_test.go`, `internal/delivery/http/middleware/auth_middleware.go`.

For `POST /api/v1/tenants/:tenant_id/enrollments`, a non-parent caller must present a claim equal to the `:tenant_id` path segment; a mismatch is 403 and no enrollment is created. A parent caller keeps the existing public catalog enrollment flow, which is scoped by student ownership rather than by tenant, and the path segment is still validated as a UUID (400 when malformed). Evidence: `internal/delivery/http/handler/enrollment_handler.go`.

The academic Swagger document no longer declares `X-Tenant-ID` as a request parameter on any operation; the regenerated `docs/swagger.{json,yaml}` and `docs/docs.go` contain no occurrence of it.

## Student ownership and deletion guard

**Implemented:** `GET /api/v1/students` scopes parent requests by the authenticated `user_id`; tenant requests use the tenant context. Create requires `parent_id` and the academic use case rejects a parent ID that does not match the authenticated parent. Get/update/delete use the same access scope. Delete returns HTTP 409 with `Student has active enrollments` when the student still has active enrollments. The parent web page surfaces forbidden, validation, API, and conflict outcomes and never treats a client-supplied parent ID as authorization. Evidence: `kelolakelas-academic-service/internal/delivery/http/handler/student_handler.go`, `internal/usecase/student_usecase.go`, `kelolakelas-web/app/(dashboard)/dashboard/parent/students/_actions/actions.ts`, `lib/auth-session.ts`.

**Current-state caveat:** the academic `Student` response struct currently serializes the last-name field under the typo `lastå_name`; the web normalizes that response while sending the API request field `last_name`. This is documented behavior of the current executable code, not a new API migration.
