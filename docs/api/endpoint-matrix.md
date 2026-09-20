# Endpoint matrix

All public business rows below are **Implemented** gateway registrations. Gateway handler is `ProxyToIdentityService`, `ProxyToAcademicService`, or `ProxyToBillingService`; downstream path is identical to public path. `JWT` means gateway and target service JWT middleware; “role rule not found” means no per-route role middleware was found, not that resource checks are absent. Named schema means the corresponding handler/domain DTO; standard success is the usual `{status,message,data}` envelope. Evidence for every row is `kelolakelas-api-gateway/internal/delivery/http/router.go` (lines shown) and matching service `cmd/server/main.go`.

| Method | Public path | Gateway handler → service/downstream path | Auth / role rule | Request → response / important errors | Evidence |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Identity → same | public | `RegisterPayload` → `AuthUserResponse`; 400/409 | gateway:52; identity main:103 |
| POST | `/api/v1/auth/login` | Identity → same | public | `LoginPayload` → token/user; 400/401 | gateway:53; identity main:104 |
| POST | `/api/v1/tenants/register` | Identity → same | public | `RegisterTenantRequest` → token/user/tenant; 400/409 | gateway:54; identity main:105 |
| GET | `/api/v1/invitations/verify` | Identity → same | public | query `token` → invitation; 400/404 | gateway:55; identity main:106 |
| POST | `/api/v1/invitations/register` | Identity → same | public | invited-user payload → user; 400/404/409 | gateway:56; identity main:107 |
| GET | `/api/v1/catalog/classes` | Academic → same | public | catalog filters → catalog list; 400 | gateway:58; academic main:105 |
| GET | `/api/v1/catalog/classes/:id` | Academic → same | public | UUID path → catalog class; 400/404 | gateway:59; academic main:106 |
| POST | `/api/v1/billing/webhooks/duitku` | Billing → same | public, provider HMAC | `DuitkuCallbackPayload` → envelope; 400/404 | gateway:62; billing main:94 |
| POST | `/api/v1/invitations` | Identity → same | JWT; endpoint role rule not found | create invitation → invitation; 400/409 | gateway:69; identity main:113 |
| GET | `/api/v1/members` | Identity → same | JWT; tenant claim only | pagination/filter → member list; 400/403 | gateway:70; identity main:114 |
| GET | `/api/v1/tutors` | Identity → same | JWT; tenant claim only | pagination/filter → tutor list; 400/403 | gateway:71; identity main:115 |
| GET | `/api/v1/members/:id` | Identity → same | JWT; tenant scope | UUID → member; 400/404 | gateway:72; identity main:116 |
| PUT | `/api/v1/members/:id/role` | Identity → same | JWT; caller role used | update role DTO → member; 400/403/404/409 | gateway:73; identity main:117 |
| DELETE | `/api/v1/members/:id` | Identity → same | JWT; handler/use case scope | UUID → envelope; 400/403/404 | gateway:74; identity main:118 |
| GET/PATCH | `/api/v1/tenant/settings` | Identity → same | JWT; tenant claim only | none / settings DTO → tenant; 400/403/404 | gateway:75-72; identity main:119-120 |
| GET/PATCH | `/api/v1/tenants/settings` | Identity → same | JWT; alias | same as singular settings path | gateway:77-74; identity main:121-122 |
| GET/PUT | `/api/v1/tenant/settings/location` | Identity → same | JWT; tenant claim only | none / location DTO → location; geocode may fail; 403 without a tenant claim | gateway:79-76; identity main:123-124 |
| GET | `/api/v1/permissions` | Identity → same | JWT; no role rule found | none → permission list | gateway:81; identity main:127 |
| GET/POST | `/api/v1/roles` | Identity → same | JWT; tenant claim only | none / create role DTO → roles/role; 400/403/409 | gateway:82-79; identity main:128-129 |
| PUT/DELETE | `/api/v1/roles/:id` | Identity → same | JWT; custom-role ownership | update DTO/none → role/envelope; 400/403/404/409 | gateway:84-81; identity main:130-131 |
| GET/POST | `/api/v1/categories` | Academic → same | JWT; tenant claim | none / category DTO → list/category; 400 | gateway:88-85; academic main:109-110 |
| DELETE | `/api/v1/categories/:id` | Academic → same | JWT; tenant scope | UUID → envelope; 400/404/409 | gateway:90; academic main:111 |
| GET/POST | `/api/v1/classes` | Academic → same | JWT; tenant claim | filters / class DTO → list/class; 400 | gateway:91-88; academic main:112-113 |
| POST | `/api/v1/classes/with-category` | Academic → same | JWT; tenant claim | combined DTO → class/category | gateway:93; academic main:114 |
| DELETE | `/api/v1/classes/:id` | Academic → same | JWT; tenant scope | UUID → envelope; 400/404 | gateway:94; academic main:115 |
| PATCH | `/api/v1/classes/:id` | Academic → same | JWT; `class:update` permission and tenant scope | `UpdateClassRequest` partial update; `type` immutable → class; 400/403/404/422 | gateway:95; academic main:116 |
| PATCH | `/api/v1/classes/:id/published` | Academic → same | JWT; tenant scope | publication DTO → class | gateway:96; academic main:117 |
| GET/POST | `/api/v1/students` | Academic → same | JWT; handler rules | filters / student DTO → list/student | gateway:97-94; academic main:119-120 |
| GET/PATCH/DELETE | `/api/v1/students/:id` | Academic → same | JWT; access scoped by handler/use case | UUID / update DTO → student/envelope | gateway:99-97; academic main:121-123 |
| GET/POST | `/api/v1/attendance` | Academic → same | JWT | filters / attendance DTO → list/item | gateway:102-99; academic main:124-125 |
| GET/PATCH | `/api/v1/attendance/:id` | Academic → same | JWT | UUID / update DTO → item | gateway:104-101; academic main:126-127 |
| GET/POST | `/api/v1/reports` | Academic → same | JWT | filters / report DTO → list/item | gateway:106-103; academic main:128-129 |
| GET/PATCH/DELETE | `/api/v1/reports/:id` | Academic → same | JWT | UUID / update DTO → item/envelope | gateway:108-106; academic main:130-132 |
| GET/POST | `/api/v1/schedules` | Academic → same | JWT | filters / initial schedules DTO → list/created schedules | gateway:113-110; academic main:118,140 |
| DELETE | `/api/v1/schedules/:id` | Academic → same | JWT | UUID → envelope | gateway:115; academic main:141 |
| PUT | `/api/v1/schedules/permanent` | Academic → same | JWT | permanent change DTO → schedules/sessions | gateway:116; academic main:142 |
| PUT | `/api/v1/schedules/:id/permanent` | Academic → same | JWT | permanent change DTO → schedules/sessions | gateway:117; academic main:143 |
| PATCH/PUT | `/api/v1/schedules/tutor-permanent` | Academic → same | JWT | permanent tutor DTO → schedules/sessions | gateway:118,116; academic main:144,146 |
| PATCH/PUT | `/api/v1/schedules/:id/tutor-permanent` | Academic → same | JWT | permanent tutor DTO → schedules/sessions | gateway:119,117; academic main:145,147 |
| GET | `/api/v1/sessions` | Academic → same | JWT | filters → session list | gateway:124; academic main:150 |
| GET/DELETE | `/api/v1/sessions/:id` | Academic → same | JWT | UUID → session/envelope | gateway:125-122; academic main:151-152 |
| GET | `/api/v1/sessions/:id/attendees` | Academic → same | JWT | UUID → attendees | gateway:127; academic main:157 |
| POST | `/api/v1/sessions/reschedule` | Academic → same | JWT | reschedule DTO → changed session | gateway:128; academic main:153 |
| POST | `/api/v1/sessions/:id/reschedule` | Academic → same | JWT | reschedule DTO → changed session | gateway:129; academic main:154 |
| PATCH | `/api/v1/sessions/substitute-tutor` | Academic → same | JWT | substitute tutor DTO → changed session | gateway:130; academic main:155 |
| PATCH | `/api/v1/sessions/:id/substitute-tutor` | Academic → same | JWT | substitute tutor DTO → changed session | gateway:131; academic main:156 |
| GET | `/api/v1/enrollments` | Academic → same | JWT; tenant/parent scoped use case | filters → enrollment list | gateway:134; academic main:135 |
| GET | `/api/v1/enrollments/:id` | Academic → same | JWT; tenant/parent scoped use case | UUID → enrollment | gateway:135; academic main:136 |
| PATCH | `/api/v1/enrollments/:id/schedule` | Academic → same | JWT; parent required | schedule assignment DTO → enrollment; 403/409/422 | gateway:136; academic main:137 |
| POST | `/api/v1/tenants/:tenant_id/enrollments` | Academic → same | JWT; parent takes public flow, else claim must equal path | enrollment DTO + `Idempotency-Key` → enrollment/payment; 400/403 | gateway:137; academic main:133 |
| POST | `/api/v1/catalog/classes/:class_id/enrollments` | Academic → same | JWT; parent required | public enrollment DTO + `Idempotency-Key` → enrollment/payment; 403/409/422 | gateway:138; academic main:134 |
| GET | `/api/v1/billing/transactions` | Billing → same | JWT; tenant/parent scope | query → transaction list | gateway:141; billing main:97 |
| GET | `/api/v1/billing/transactions/:id` | Billing → same | JWT; tenant/parent scope | UUID → transaction; 404 | gateway:142; billing main:98 |

There is no user-facing invoice-creation route. `POST /api/v1/billing/transactions` is **Not found** in the gateway: it was deliberately removed (commit `bdaa8797b05d7e5bc85d6d6fe3e043196d62ca60`, “block user-facing invoice creation”), and `kelolakelas-api-gateway/internal/delivery/http/router_test.go` (`TestUserFacingBillingTransactionCreationIsNotRouted`) asserts the path returns 404. Invoice creation exists only at `POST /internal/billing/transactions` below; see [billing API](billing.md) and [ADR 0014](../decisions/014-parent-enrollment-checkout.md).

## Internal, non-gateway endpoints

| Method/path | Target authentication | Purpose / evidence |
|---|---|---|
| PUT `/internal/enrollments/:id/activate` | internal credential | Billing activates a paid pending enrollment; `kelolakelas-academic-service/cmd/server/main.go:161` |
| PUT `/internal/enrollments/:id/release` | internal credential | Billing releases the seat of a pending enrollment whose payment failed or expired (KEL-26, [ADR 0012](../adr/0012-release-enrollment-seat-on-failed-payment.md)); idempotent, 409 for a non-releasable status; `kelolakelas-academic-service/cmd/server/main.go:162` |
| POST `/internal/billing/transactions` | internal credential | Academic creates a billing invoice; `kelolakelas-billing-service/cmd/server/main.go:100-102` |
