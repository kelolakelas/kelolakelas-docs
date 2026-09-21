# Identity API

Implemented routes are registered in `kelolakelas-identity-service/cmd/server/main.go:103-131`; request binding structs and response branches are in `internal/delivery/http/handler/`.

| Operation | Key request schema | Result / notable errors |
|---|---|---|
| Register | `RegisterPayload`: email, password min 6, first/last name, phone?, is_parent | 201 user record; does **not** issue token despite web action checking for one; 409 email conflict |
| Login | `LoginPayload`: email, password | 200 token + user + tenant_id; 401 invalid credentials |
| Tenant register | `RegisterTenantRequest` | 201 token/user/tenant; 409 name/email conflict |
| Invitation create/verify/register | `CreateInvitationPayload`; token query; invited-user payload | creation requires `member:invite` and returns 403 when absent, and 400 when the requested `role_id` belongs to another tenant and is not a system role (no invitation row and no email); validation handles absent/expired/used tokens. A stored invitation answers **201 whether or not the email was delivered**: the body carries `data.email_sent` (KEL-36) and the message states the outcome — `Invitation created and email sent successfully` versus `Invitation created but the email could not be sent. …`. Delivery failures are logged with the invitation and tenant IDs, never the token |
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
