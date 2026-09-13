# Data ownership overview

Each stateful service opens its own PostgreSQL database; migrations define the schema. The identity repository also contains financial/wallet-style tables, while the active billing service owns the payment transaction/subscription tables. This overlap is an observed ownership ambiguity, not a cross-database relationship.

| Database owner | Main entities | Cross-system IDs stored without DB FK |
|---|---|---|
| Identity | users, tenants, roles, permissions, memberships, invitations, identity financial records | none required internally; tenant/user IDs are canonical source |
| Academic | categories, classes, students, enrollments, schedules/sessions, attendance, notes, reports | tenant, parent, tutor, reporter IDs |
| Billing | vouchers, wallets, bank accounts, subscriptions, transactions, ledger, withdrawals | tenant, parent, student, enrollment IDs |

See detailed migration-based pages: [identity schema](identity-schema.md), [academic schema](academic-schema.md), [billing schema](billing-schema.md).
