# Web (`kelolakelas-web`)

**Implemented:** a Next.js App Router application with public `/`, auth `/login` and `/register`, and tenant dashboard pages for overview, members, roles, settings, and classes. Its root layout remains create-next-app metadata while multiple screens and package name still say `Tutorin`. Evidence: `app/**/page.tsx`, `app/layout.tsx:16-17`, `package.json:2`.

Server actions validate form inputs with Zod, then call `${NEXT_PUBLIC_API_URL}/api/v1/...`; successful login and registrations set an HTTP-only cookie (`app/(auth)/login/_actions/actions.ts`, `app/(auth)/register/_actions/actions.ts`). Tenant dashboard actions/queries read the cookie and send it as a Bearer token. They also send an optional `X-Tenant-ID` from a separate cookie, though no inspected login action creates that cookie.

`proxy.ts` protects `/dashboard` and `/profile` by cookie presence only, redirects auth pages for any cookie, and does not validate the token. It excludes `/api/` and static assets. Browser-side UI coverage is narrower than backend route coverage: no implemented frontend payment, student, attendance, report, enrollment, or invitation-acceptance screen was found.

**Risk:** `DEFAULT_API_URL` is `http://localhost:3000`, the web server itself, in server actions. The gateway defaults to `:8000`, and this web repository has no matching App API route. A working environment therefore needs `NEXT_PUBLIC_API_URL` set; see [risks](../08-known-gaps-and-risks.md).
