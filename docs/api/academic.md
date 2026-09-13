# Academic API

Routes registered in `kelolakelas-academic-service/cmd/server/main.go:99-154` are the source of truth. `GET /api/v1/catalog/classes` and `GET /api/v1/catalog/classes/:id` are public; all other `/api/v1` routes require JWT. Internal activation is outside `/api/v1`.

| Area | Operations | Request/response source |
|---|---|---|
| Catalog | list/detail public classes | `catalog_handler.go`, `domain/catalog.go` |
| Categories/classes | list/create/delete, create-with-category, publication toggle | `category_handler.go`, `class_handler.go`, `domain/category.go`, `domain/class.go` |
| Schedules/sessions | create/list/delete, permanent/time or tutor changes, reschedule/substitute, attendees | `schedule_handler.go`, `session_handler.go`, `domain/schedule_dto.go` |
| Students | list/create/get/update/delete | `student_handler.go`, `domain/student.go` |
| Attendance/reports | list/create/get/update (reports also delete) | respective handlers/domain files |
| Enrollments | create tenant/catalog enrollment, list/get, schedule assignment; internal activate | `enrollment_handler.go`, `domain/enrollment.go` |

The public catalog enrollment route is in the gateway’s protected group despite its path beginning `/catalog`; callers need a JWT at the gateway. This is a route-policy distinction from public catalog reads.
