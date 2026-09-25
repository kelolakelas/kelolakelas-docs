# Identity API

Implemented routes are registered in `kelolakelas-identity-service/cmd/server/main.go:103-131`; request binding structs and response branches are in `internal/delivery/http/handler/`.

| Operation | Key request schema | Result / notable errors |
|---|---|---|
| Register | `RegisterPayload`: email, password min 6, first/last name, phone?, is_parent | 201 user record; does **not** issue token despite web action checking for one; 409 email conflict |
| Login | `LoginPayload`: email, password | 200 token + user + tenant_id; 401 invalid credentials |
| Platform login (`POST /api/v1/platform/auth/login`) | `LoginPayload`: email, password | 200 `data.token` (tenantless `is_platform_admin` JWT); 400 invalid payload, 401 invalid credentials/inactive assignment, 503 assignment store failure |
| Platform identity (`GET /api/v1/platform/me`) | Bearer platform token | 200 `data.user_id` after live assignment check; 401 invalid/expired token, 403 missing platform principal or revoked assignment, 503 store failure |
| Configuration inventory (`GET /api/v1/platform/configurations`) | Bearer platform token; required `environment` query | 200 metadata/status for all five applications; sensitive entries are `not_managed`, with no secret default or value; 400 invalid environment, 403 revoked assignment, 503 authorization store unavailable |
| Configuration history (`GET /api/v1/platform/configurations/{application}/{key}/history`) | Bearer platform token; required `environment` query | 200 non-secret version/report history; 400 unknown or sensitive key |
| Configuration request (`POST /api/v1/platform/configurations/{application}/{key}/versions`) | `environment`, `expected_version`, and either non-secret JSON scalar `value` or `rollback_version_id` | 201 new `requested` version with actor; 400 invalid/unknown/secret key or value; 409 stale version; no runtime application |
| Configuration report (`POST /api/v1/platform/configurations/reports`) | `version_id`, `status` (`applied`, `failed`, `rollback`) | 201 operator acknowledgement; 400 invalid status; 404 unknown version; record-only, not deployment proof |
| Tenant register | `RegisterTenantRequest` | 201 token/user/tenant; 409 name/email conflict |
| Invitation create/verify/register | `CreateInvitationPayload`; token query; invited-user payload | creation requires `member:invite` and returns 403 when absent, and 400 when the requested `role_id` belongs to another tenant and is not a system role (no invitation row and no email), or 403 when the target is the system Creator role; redemption of legacy Creator invitations also returns 403 before membership is created. Validation handles absent/expired/used tokens. A stored invitation answers **201 whether or not the email was delivered**: the body carries `data.email_sent` (KEL-36) and the message states the outcome — `Invitation created and email sent successfully` versus `Invitation created but the email could not be sent. …`. Delivery failures are logged with the invitation and tenant IDs, never the token |
| Creator request create (`POST /api/v1/creator-requests`) | Bearer tenant token; `target_email` and/or `target_user_id`, required `reason` | 201 pending request without role assignment; live active Creator membership in the token's tenant required (403); 400 invalid target/reason; 409 duplicate pending request or target already Creator |
|| Creator request list (`GET /api/v1/creator-requests`) | Bearer tenant token | 200 requests scoped to token tenant, newest first; 403 without live Creator membership |
|| Creator request decide (`POST /api/v1/platform/creator-requests/{id}/approve`) | Bearer platform token; live active assignment rechecked in-transaction | 200 decided request; registered target granted Creator exactly once with audit row; unregistered target gets email-bound invitation, role only on valid acceptance; 400 bad UUID, 403 revoked/absent admin, 404 unknown request, 409 replayed/stale/already-Creator; invitation email failure logged, not fatal |
|| Creator request decide (`POST /api/v1/platform/creator-requests/{id}/reject`) | Bearer platform token; live active assignment rechecked in-transaction; required `reason` (1-2000 chars, trimmed) | 200 decided request with stored rejection reason and audit row; no membership or invitation change; 400 missing/oversize reason or bad UUID, 403 revoked/absent admin, 404 unknown request, 409 replayed decision |
| Members / tutors | pagination/query filters; UUID path | tenant context from the verified JWT claim only; 403 when the token carries no tenant claim, 401 when the claim is unusable, 400 malformed query/ID |
| Roles / permissions | role DTOs | custom-role create/update/delete require `role:create`, `role:update`, and `role:delete`; tenant ownership and system-role restrictions are enforced in the role use case. Every permission decision is evaluated inside the caller's tenant: the assignment counts only when the role belongs to that tenant or is a system role (`roles.tenant_id IS NULL`), so a role lifted from another tenant is denied and a role deleted after the token was issued resolves no rows and is denied |
| Tenant settings/location | update DTOs | settings and location mutation require `tenant:update` (403 when absent); optional geocode on address-only location update |

Every tenant-scoped route resolves its tenant from the `tenant_id` claim of the
validated access token (`internal/delivery/http/handler/tenant_context.go`,
KEL-16). A caller whose token carries no tenant claim — all parents, and any
user without an active membership — is rejected with **403 before the use case
is invoked**, so no repository query runs and no other tenant's data is read or
written. A `X-Tenant-ID` header is ignored entirely and is no longer part of any
published operation in `docs/swagger.json`; sending the caller's own tenant in
the header changes nothing, because the claim always wins.

Status codes on these routes are deliberately distinct:

- **403** — the token is valid but grants no tenant scope for this operation.
- **401** — the token was accepted by the middleware but carries an unusable
  (unparseable) tenant claim; a missing or nil claim is 403, not 401.
- **400** — malformed request input such as an unparseable UUID in the path or
  query, unchanged from before.

All payload fields should be confirmed against current Go domain structs or `docs/swagger.json` before client generation. The in-web copied Swagger documents are stale `Tutorin` artifacts and should not be used as the primary contract.
