# KEL-228 route coverage

Initial baseline audit:100 Chrome visits,34 route templates. These are observations, not a claim that every possible state on every page is tested. Raw [coverage](coverage.json) records rendered text, headings, alerts, status, overflow and errors for every persona/viewport entry. Screenshots contain synthetic data only.

| Route | Persona | Observed state | Captures |
| --- | --- | --- | --- |
| `/forgot-password` | public | readable content/form | [desktop](public-1440-forgot-password.png) · [mobile](public-390-forgot-password.png) |
| `/invitations/verify` | public | invalid invitation notice | [desktop](public-1440-invitations-verify.png) · [mobile](public-390-invitations-verify.png) |
| `/login` | public | readable content/form | [desktop](public-1440-login.png) · [mobile](public-390-login.png) |
| `/register` | public | readable content/form | [desktop](public-1440-register.png) · [mobile](public-390-register.png) |
| `/reset-password` | public | readable content/form | [desktop](public-1440-reset-password.png) · [mobile](public-390-reset-password.png) |
| `/dashboard/parent/chat` | parent | owned data / relevant empty sections | [desktop](parent-1440-dashboard-parent-chat.png) · [mobile](parent-390-dashboard-parent-chat.png) |
| `/dashboard/parent/enrollments` | parent | owned data / relevant empty sections | [desktop](parent-1440-dashboard-parent-enrollments.png) · [mobile](parent-390-dashboard-parent-enrollments.png) |
| `/dashboard/parent/enrollments/return` | parent | owned lookup not found | [desktop](parent-1440-dashboard-parent-enrollments-return.png) · [mobile](parent-390-dashboard-parent-enrollments-return.png) |
| `/dashboard/parent/progress` | parent | owned data / relevant empty sections | [desktop](parent-1440-dashboard-parent-progress.png) · [mobile](parent-390-dashboard-parent-progress.png) |
| `/dashboard/parent/progress/reports/[reportId]` | parent | owned data / relevant empty sections | [desktop](parent-1440-dashboard-parent-progress-reports-0f53ef81-659a-46a8-9757-56b71b21102b.png) · [mobile](parent-390-dashboard-parent-progress-reports-0f53ef81-659a-46a8-9757-56b71b21102b.png) |
| `/dashboard/parent/students` | parent | owned data / relevant empty sections | [desktop](parent-1440-dashboard-parent-students.png) · [mobile](parent-390-dashboard-parent-students.png) |
| `/dashboard/tenant/chat` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-chat.png) · [mobile](admin-390-dashboard-tenant-chat.png) |
| `/dashboard/tenant/classes` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-classes.png) · [mobile](admin-390-dashboard-tenant-classes.png) |
| `/dashboard/tenant/creator-requests` | admin | redirect → /dashboard/tenant/members#owner-account-request | [desktop](admin-1440-dashboard-tenant-creator-requests.png) · [mobile](admin-390-dashboard-tenant-creator-requests.png) |
| `/dashboard/tenant/enrollments` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-enrollments.png) · [mobile](admin-390-dashboard-tenant-enrollments.png) |
| `/dashboard/tenant/finance` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-finance.png) · [mobile](admin-390-dashboard-tenant-finance.png) |
| `/dashboard/tenant/members` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-members.png) · [mobile](admin-390-dashboard-tenant-members.png) |
| `/dashboard/tenant` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant.png) · [mobile](admin-390-dashboard-tenant.png) |
| `/dashboard/tenant/reports` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-reports.png) · [mobile](admin-390-dashboard-tenant-reports.png) |
| `/dashboard/tenant/roles` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-roles.png) · [mobile](admin-390-dashboard-tenant-roles.png) |
| `/dashboard/tenant/schedule-requests` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-schedule-requests.png) · [mobile](admin-390-dashboard-tenant-schedule-requests.png) |
| `/dashboard/tenant/sessions` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-sessions.png) · [mobile](admin-390-dashboard-tenant-sessions.png) |
| `/dashboard/tenant/settings` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-settings.png) · [mobile](admin-390-dashboard-tenant-settings.png) |
| `/dashboard/tenant/transactions` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-transactions.png) · [mobile](admin-390-dashboard-tenant-transactions.png) |
| `/dashboard/tenant/vouchers` | admin | Creator data/forms/empty state; Teacher permission cases in raw coverage | [desktop](admin-1440-dashboard-tenant-vouchers.png) · [mobile](admin-390-dashboard-tenant-vouchers.png) |
| `/kelas/[id]` | public | readable content/form | [desktop](public-1440-kelas-a1910ce0-ac17-4f2e-9cb0-2e1e029cb4e3.png) · [mobile](public-390-kelas-a1910ce0-ac17-4f2e-9cb0-2e1e029cb4e3.png) |
| `/kelas` | public | readable content/form | [desktop](public-1440-kelas.png) · [mobile](public-390-kelas.png) |
| `/` | public | readable content/form | [desktop](public-1440-.png) · [mobile](public-390-.png) |
| `/tenant/[id]` | public | readable content/form | [desktop](public-1440-tenant-4f83ff30-6022-44b7-b2c6-9e4cb7c298c3.png) · [mobile](public-390-tenant-4f83ff30-6022-44b7-b2c6-9e4cb7c298c3.png) |
| `/platform/challenge` | public | guest expired-session entry; authorized TOTP success also exercised | [desktop](public-1440-platform-challenge.png) · [mobile](public-390-platform-challenge.png) |
| `/platform/creator-requests` | platform | authorized empty queue; owner-request decision additionally exercised | [desktop](platform-1440-platform-creator-requests.png) · [mobile](platform-390-platform-creator-requests.png) |
| `/platform/login` | public | readable content/form | [desktop](public-1440-platform-login.png) · [mobile](public-390-platform-login.png) |
| `/platform` | platform | readable content/form | [desktop](platform-1440-platform.png) · [mobile](platform-390-platform.png) |
| `/platform/withdrawals` | platform | authorized empty queue; owner-request decision additionally exercised | [desktop](platform-1440-platform-withdrawals.png) · [mobile](platform-390-platform-withdrawals.png) |
