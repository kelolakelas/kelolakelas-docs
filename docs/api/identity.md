# Identity API

Implemented routes are registered in `kelolakelas-identity-service/cmd/server/main.go:103-131`; request binding structs and response branches are in `internal/delivery/http/handler/`.

| Operation | Key request schema | Result / notable errors |
|---|---|---|
| Register | `RegisterPayload`: email, password min 6, first/last name, phone?, is_parent | 201 user record; does **not** issue token despite web action checking for one; 409 email conflict |
| Login | `LoginPayload`: email, password | 200 token + user + tenant_id; 401 invalid credentials |
| Tenant register | `RegisterTenantRequest` | 201 token/user/tenant; 409 name/email conflict |
| Invitation create/verify/register | `CreateInvitationPayload`; token query; invited-user payload | creation emails invite; validation handles absent/expired/used tokens |
| Members / tutors | pagination/query filters; UUID path | tenant context from token; 400 malformed query/ID |
| Roles / permissions | role DTOs | custom role restrictions are enforced in role use case |
| Tenant settings/location | update DTOs | optional geocode on address-only location update |

All payload fields should be confirmed against current Go domain structs or `docs/swagger.json` before client generation. The in-web copied Swagger documents are stale `Tutorin` artifacts and should not be used as the primary contract.
