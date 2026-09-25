# ADR 0022: Session logout ends the browser session only

## Status

Accepted and implemented in KEL-46.

## Context

No logout implementation existed anywhere in `kelolakelas-web/app` or
`kelolakelas-web/lib`. The session cookie that login and tenant registration
write has a `maxAge` of seven days
(`app/(auth)/login/_actions/actions.ts`, `app/(auth)/register/_actions/actions.ts`),
and no account affordance existed in the tenant sidebar, the tenant mobile
drawer, or any parent screen. A user signing in on a shared device therefore had
no way to release the session, and the next person to use the browser inherited
it.

The constraint that shapes the decision is that the session is carried by a
self-contained JWT. Identity issues HS256 tokens with a 24-hour expiry and no
server-side session table, and no revocation endpoint or token denylist exists
to invalidate one (`kelolakelas-identity-service/pkg/jwt/jwt.go`,
`internal/usecase/auth_usecase.go`). Anything the web app does can only remove
the browser's copy of the token; it cannot make the token stop being accepted by
the gateway or by a service.

That raises the question this ADR records: given that a truthful logout cannot
revoke the token, what exactly does the logout control promise, and how is the
remaining window described?

> **Superseded in part by ADR 0030:** KEL-66 introduces a per-user session boundary checked by the gateway after password reset. The no-revocation statement below describes logout specifically: logout still does not advance this boundary and remains browser-only. Direct academic/billing JWT validation is unchanged.

## Decision

**Logout is a web-only operation that deletes the browser's session cookies. It
is documented as ending the browser session, not the token's validity.**

`logoutAction` in `app/(auth)/logout/_actions/actions.ts`:

1. Deletes both session cookies — the auth token and the tenant context — with
   `cookieStore.delete(name)`.
2. Calls `revalidatePath('/', 'layout')` before navigating.
3. Calls `redirect('/login')`.

The cookie names are resolved through `sessionCookieNames` in `lib/logout.ts`,
which applies the same `process.env.AUTH_COOKIE_NAME || 'auth_token'` and
`process.env.TENANT_ID_COOKIE_NAME || 'tenant_id'` fallbacks that login and
registration use to write them, and collapses the two to one name when both
environment variables point at the same value.

Three properties are deliberate:

### Deletion is unconditional, and an absent cookie is not an error

`clearSessionCookies` issues `delete` for every resolved name without first
reading the cookie store. Upstream, `ResponseCookies.delete` writes an
already-expired cookie and `MutableRequestCookiesAdapter.delete` tracks the name
and emits the expiring `Set-Cookie` regardless of whether the incoming request
carried it, so deleting a name that was never set is a silent no-op rather than
a failure.

This is what makes the ordinary already-signed-out cases work instead of
erroring: an expired cookie the proxy cleared before redirecting, a second tab
whose session another tab already ended, a stale back-button view, and a
`/logout` reached while signed out. It also means logout is idempotent, which
matters because the control is a plain form that can be submitted twice.

### The Client Cache is purged before the redirect

Without `revalidatePath('/', 'layout')`, the client router can serve a protected
page it already rendered and cached, so the user would appear to remain signed
in until a hard reload even though the cookies were gone. The call purges the
client cache and invalidates cached data for revalidation on the next visit.

### The control is a plain form, not a handler with client state

`LogoutButton` renders a `<form action={logoutAction}>` whose submit control
reads `useFormStatus`. Signing out therefore works without client JavaScript,
and the pending state disables the button so a double tap cannot submit twice.
`className` is a prop because the tenant shell and the parent screens do not
share a palette.

## Where the control appears

| Surface | Reason |
|---|---|
| Tenant sidebar footer, tenant mobile drawer footer | The tenant shell has no other account affordance, and the drawer is the only navigation on small screens |
| Parent student-management header | The parent landing surface for that section |
| Parent enrollment-history header | The second parent screen |
| Public catalog, only when a parent session is active | `/kelas` is the parent's post-login destination, so without this the session could not be ended from where the parent actually lands |

## Consequences

- Signing out removes the browser's session; opening a protected route
  afterwards reaches `/login` through the unchanged `proxy.ts`, which already
  redirects a cookie-less protected request.
- **The JWT stays valid until its 24-hour expiry.** A copy of the token taken
  before logout continues to be accepted by the gateway and the services. This
  is the residual risk of not having a revocation backend, and it is recorded
  rather than mitigated.
- Logout in one tab does not immediately update other open tabs; they lose the
  session on their next navigation or reload, when the proxy or a server action
  observes the missing cookie.
- The documented limitation is mirrored in the action's own docblock, so a
  reader of the code does not have to consult this repository to learn it.
- No `/logout` route exists. `_actions` and `_components` are private Next.js
  folders, so logout adds no URL to the route table and no new public surface.

## Alternatives considered

**Adding a revocation endpoint or denylist to identity.** Rejected for this
change as out of scope: it requires a durable denylist, a lookup on every
authenticated request, and a decision about what a service does when the
denylist is unreachable. Logout from a shared browser does not need it, because
the threat is the next person at the same browser rather than an attacker
holding a stolen token.

**Calling an identity logout endpoint that does not exist.** Rejected: it would
misrepresent the operation as server-side revocation and make the front end
depend on a route that returns 404.

**Redirecting to `/` instead of `/login`.** Rejected for this change: `/` is the
marketing landing page while `/login` is where the proxy already sends an
unauthenticated protected request, so the destination stays consistent with the
existing redirect behaviour. The requirement permitted either.

**Hiding the control when no session cookie is present.** Rejected: it would
leave a signed-out user on a stale view with no way to act, and deletion is
already safe when nothing is set.

**Guarding the deletion with a read of the cookie store.** Rejected: it adds a
branch whose only effect is to skip a call that is already a no-op, and the
tests assert the unconditional behaviour directly.
