# Web (`kelolakelas-web`)

**Implemented:** a Next.js App Router application with public `/`, auth `/login` and `/register`, and tenant dashboard pages for overview, members, roles, settings, and classes. Its root layout remains create-next-app metadata while multiple screens and package name still say `Tutorin`. Evidence: `app/**/page.tsx`, `app/layout.tsx:16-17`, `package.json:2`.

Server actions and tenant dashboard queries validate input as applicable, then call `${GATEWAY_API_URL}/api/v1/...`. `GATEWAY_API_URL` is a required server-side HTTP(S) gateway origin: blank, malformed, non-HTTP(S), and path-bearing values fail diagnostically, and a trailing slash is normalized. Successful login and registrations set an HTTP-only cookie (`app/(auth)/login/_actions/actions.ts`, `app/(auth)/register/_actions/actions.ts`). Tenant dashboard actions/queries read the cookie and send it as a Bearer token. They also send an optional `X-Tenant-ID` from a separate cookie, though no inspected login action creates that cookie.

`proxy.ts` protects `/dashboard` and `/profile` by cookie presence only, redirects auth pages for any cookie, and does not validate the token. It excludes `/api/` and static assets. Browser-side UI coverage is narrower than backend route coverage: no implemented frontend payment, student, attendance, report, enrollment, or invitation-acceptance screen was found.

The gateway origin is deliberately server-only rather than a `NEXT_PUBLIC_*` variable because the relevant requests run in Server Actions and Server Components. The web package includes Vitest coverage for valid and missing gateway configuration.
