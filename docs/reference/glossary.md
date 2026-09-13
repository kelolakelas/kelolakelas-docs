# Glossary

| Term | Meaning in this implementation |
|---|---|
| Tenant | education organization record in identity; copied UUID scope in other services |
| Parent | user with `is_parent` JWT claim; required for catalog enrollment and schedule assignment |
| Member | identity relation joining user, tenant, and role |
| Catalog | publicly readable published/open academic class surface |
| Enrollment | academic pending/active membership of student in class, with payment linkage |
| Subscription | billing renewal record keyed by enrollment |
| Transaction | billing payment attempt/order, usually with a Duitku checkout URL |
| Internal credential | static service-to-service Bearer secret, distinct from user JWT |
| Gateway | HTTP reverse proxy; not an API contract translator |
