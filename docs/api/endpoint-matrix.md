# Endpoint matrix

All public business rows below are **Implemented** gateway registrations. Gateway handler is `ProxyToIdentityService`, `ProxyToAcademicService`, or `ProxyToBillingService`; downstream path is identical to public path. `JWT` means gateway and target service JWT middleware; “role rule not found” means no per-route role middleware was found, not that resource checks are absent. Named schema means the corresponding handler/domain DTO; standard success is the usual `{status,message,data}` envelope. Evidence for every row is `kelolakelas-api-gateway/internal/delivery/http/router.go` (lines shown) and matching service `cmd/server/main.go`.

| Method | Public path | Gateway handler → service/downstream path | Auth / role rule | Request → response / important errors | Evidence |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Identity → same | public | `RegisterPayload` → `AuthUserResponse`; 400/409 | gateway:48; identity main:103 |
| POST | `/api/v1/auth/login` | Identity → same | public | `LoginPayload` → token/user; 400/401 | gateway:49; identity main:104 |
| POST | `/api/v1/tenants/register` | Identity → same | public | `RegisterTenantRequest` → token/user/tenant; 400/409 | gateway:50; identity main:105 |
| GET | `/api/v1/invitations/verify` | Identity → same | public | query `token` → invitation; 400/404 | gateway:51; identity main:106 |
| POST | `/api/v1/invitations/register` | Identity → same | public | invited-user payload → user; 400/404/409 | gateway:52; identity main:107 |
| GET | `/api/v1/catalog/classes` | Academic → same | public | catalog filters → catalog list; 400 | gateway:54; academic main:99 |
| GET | `/api/v1/catalog/classes/:id` | Academic → same | public | UUID path → catalog class; 400/404 | gateway:55; academic main:100 |
| POST | `/api/v1/billing/webhooks/duitku` | Billing → same | public, provider HMAC | `DuitkuCallbackPayload` → envelope; 400/404 | gateway:58; billing main:85 |
| POST | `/api/v1/invitations` | Identity → same | JWT; endpoint role rule not found | create invitation → invitation; 400/409 | gateway:65; identity main:113 |
| GET | `/api/v1/members` | Identity → same | JWT; tenant claim | pagination/filter → member list; 400 | gateway:66; identity main:114 |
| GET | `/api/v1/tutors` | Identity → same | JWT; tenant claim | pagination/filter → tutor list; 400 | gateway:67; identity main:115 |
| GET | `/api/v1/members/:id` | Identity → same | JWT; tenant scope | UUID → member; 400/404 | gateway:68; identity main:116 |
| PUT | `/api/v1/members/:id/role` | Identity → same | JWT; caller role used | update role DTO → member; 400/403/404/409 | gateway:69; identity main:117 |
| DELETE | `/api/v1/members/:id` | Identity → same | JWT; handler/use case scope | UUID → envelope; 400/403/404 | gateway:70; identity main:118 |
| GET/PATCH | `/api/v1/tenant/settings` | Identity → same | JWT; tenant claim | none / settings DTO → tenant; 400/404 | gateway:71-72; identity main:119-120 |
| GET/PATCH | `/api/v1/tenants/settings` | Identity → same | JWT; alias | same as singular settings path | gateway:73-74; identity main:121-122 |
| GET/PUT | `/api/v1/tenant/settings/location` | Identity → same | JWT; tenant claim | none / location DTO → location; geocode may fail | gateway:75-76; identity main:123-124 |
| GET | `/api/v1/permissions` | Identity → same | JWT; no role rule found | none → permission list | gateway:77; identity main:127 |
| GET/POST | `/api/v1/roles` | Identity → same | JWT; tenant scope | none / create role DTO → roles/role; 400/409 | gateway:78-79; identity main:128-129 |
| PUT/DELETE | `/api/v1/roles/:id` | Identity → same | JWT; custom-role ownership | update DTO/none → role/envelope; 400/403/404/409 | gateway:80-81; identity main:130-131 |
| GET/POST | `/api/v1/categories` | Academic → same | JWT; tenant claim | none / category DTO → list/category; 400 | gateway:84-85; academic main:103-104 |
| DELETE | `/api/v1/categories/:id` | Academic → same | JWT; tenant scope | UUID → envelope; 400/404/409 | gateway:86; academic main:105 |
| GET/POST | `/api/v1/classes` | Academic → same | JWT; tenant claim | filters / class DTO → list/class; 400 | gateway:87-88; academic main:106-107 |
| POST | `/api/v1/classes/with-category` | Academic → same | JWT; tenant claim | combined DTO → class/category | gateway:89; academic main:108 |
| DELETE | `/api/v1/classes/:id` | Academic → same | JWT; tenant scope | UUID → envelope; 400/404 | gateway:90; academic main:109 |
| PATCH | `/api/v1/classes/:id/published` | Academic → same | JWT; tenant scope | publication DTO → class | gateway:91; academic main:110 |
| GET/POST | `/api/v1/students` | Academic → same | JWT; handler rules | filters / student DTO → list/student | gateway:92-93; academic main:112-113 |
| GET/PATCH/DELETE | `/api/v1/students/:id` | Academic → same | JWT; access scoped by handler/use case | UUID / update DTO → student/envelope | gateway:94-96; academic main:114-116 |
| GET/POST | `/api/v1/attendance` | Academic → same | JWT | filters / attendance DTO → list/item | gateway:97-98; academic main:117-118 |
| GET/PATCH | `/api/v1/attendance/:id` | Academic → same | JWT | UUID / update DTO → item | gateway:99-100; academic main:119-120 |
| GET/POST | `/api/v1/reports` | Academic → same | JWT | filters / report DTO → list/item | gateway:101-102; academic main:121-122 |
| GET/PATCH/DELETE | `/api/v1/reports/:id` | Academic → same | JWT | UUID / update DTO → item/envelope | gateway:103-105; academic main:123-125 |
| GET/POST | `/api/v1/schedules` | Academic → same | JWT | filters / initial schedules DTO → list/created schedules | gateway:108-109; academic main:111,133 |
| DELETE | `/api/v1/schedules/:id` | Academic → same | JWT | UUID → envelope | gateway:110; academic main:134 |
| PUT | `/api/v1/schedules/permanent` | Academic → same | JWT | permanent change DTO → schedules/sessions | gateway:111; academic main:135 |
| PUT | `/api/v1/schedules/:id/permanent` | Academic → same | JWT | permanent change DTO → schedules/sessions | gateway:112; academic main:136 |
| PATCH/PUT | `/api/v1/schedules/tutor-permanent` | Academic → same | JWT | permanent tutor DTO → schedules/sessions | gateway:113,115; academic main:137,139 |
| PATCH/PUT | `/api/v1/schedules/:id/tutor-permanent` | Academic → same | JWT | permanent tutor DTO → schedules/sessions | gateway:114,116; academic main:138,140 |
| GET | `/api/v1/sessions` | Academic → same | JWT | filters → session list | gateway:119; academic main:143 |
| GET/DELETE | `/api/v1/sessions/:id` | Academic → same | JWT | UUID → session/envelope | gateway:120-121; academic main:144-145 |
| GET | `/api/v1/sessions/:id/attendees` | Academic → same | JWT | UUID → attendees | gateway:122; academic main:150 |
| POST | `/api/v1/sessions/reschedule` | Academic → same | JWT | reschedule DTO → changed session | gateway:123; academic main:146 |
| POST | `/api/v1/sessions/:id/reschedule` | Academic → same | JWT | reschedule DTO → changed session | gateway:124; academic main:147 |
| PATCH | `/api/v1/sessions/substitute-tutor` | Academic → same | JWT | substitute tutor DTO → changed session | gateway:125; academic main:148 |
| PATCH | `/api/v1/sessions/:id/substitute-tutor` | Academic → same | JWT | substitute tutor DTO → changed session | gateway:126; academic main:149 |
| GET | `/api/v1/enrollments` | Academic → same | JWT; tenant/parent scoped use case | filters → enrollment list | gateway:129; academic main:128 |
| GET | `/api/v1/enrollments/:id` | Academic → same | JWT; tenant/parent scoped use case | UUID → enrollment | gateway:130; academic main:129 |
| PATCH | `/api/v1/enrollments/:id/schedule` | Academic → same | JWT; parent required | schedule assignment DTO → enrollment; 403/409/422 | gateway:131; academic main:130 |
| POST | `/api/v1/tenants/:tenant_id/enrollments` | Academic → same | JWT; parent takes public flow, else claim must equal path | enrollment DTO + `Idempotency-Key` → enrollment/payment; 400/403 | gateway:132; academic main:126 |
| POST | `/api/v1/catalog/classes/:class_id/enrollments` | Academic → same | JWT; parent required | public enrollment DTO + `Idempotency-Key` → enrollment/payment; 403/409/422 | gateway:133; academic main:127 |
| POST | `/api/v1/billing/transactions` | Billing → same | JWT; tenant/parent scope | payment DTO → checkout transaction; 400 | gateway:136; billing main:88 |
| GET | `/api/v1/billing/transactions` | Billing → same | JWT; tenant/parent scope | query → transaction list | gateway:137; billing main:89 |
| GET | `/api/v1/billing/transactions/:id` | Billing → same | JWT; tenant/parent scope | UUID → transaction; 404 | gateway:138; billing main:90 |

## Internal, non-gateway endpoints

| Method/path | Target authentication | Purpose / evidence |
|---|---|---|
| PUT `/internal/enrollments/:id/activate` | internal credential | Billing activates a paid pending enrollment; `kelolakelas-academic-service/cmd/server/main.go:152-154` |
| POST `/internal/billing/transactions` | internal credential | Academic creates a billing invoice; `kelolakelas-billing-service/cmd/server/main.go:100-102` |
