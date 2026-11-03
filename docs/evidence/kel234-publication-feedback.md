# KEL-234: Publication feedback

## Source snapshot

Observed on 2026-11-03, from web baseline
`c4543bd0028f414cdaa975d310db03848806b389`.
The implementation changes only `updateClassPublication` in
`kelolakelas-web/app/(dashboard)/dashboard/tenant/classes/_actions/classActions.ts`:
a successful publish returns `message: ''`. Successful unpublish keeps its
existing copy. The `ActionResponse` shape, backend PATCH, authentication,
validation, `data` and classes-route revalidation remain unchanged.

Implementation source:
`b2f93657407cb2802f6e10ac6cc374e16ea16dca` in `kelolakelas-web`.

`ClassPublicationButton` already omits empty messages, exposing the existing
screen-reader publication detail instead. No new copy replaces the removed
sentence. `ClassStatusBadges` and the action target continue to use refreshed
server records rather than claiming success optimistically.

## Acceptance evidence

**Implemented and tested:**
`_components/ClassPublicationControl.test.tsx` imports the real component and
server action, with mocked session cookies, route revalidation and HTTP gateway.
Its eleven tests cover:

- Publish returns no success copy, while preserving authenticated PATCH body,
  response data and route revalidation.
- A 403 remains an alert with Publish still offered; retry success removes the
  prior error and does not render a status message or the removed sentence.
- Re-rendering with the returned published server record shows Published and
  Unpublish; unpublish preserves its status message and returns to Publish after
  a server-record refresh.
- 401, 403, 404, 503 and network failures remain visible without revalidation.
- Publish and unpublish stay disabled/busy during a deferred HTTP response;
  a second click does not send another request.
- Malformed publication state fails validation before HTTP or revalidation.

The existing thirteen `lib/class-publication.test.ts` cases retain badge,
enrollment-state and next-action coverage. This is component/action integration
with a gateway double, not a live backend, browser reload or production check.

## Local validation

- Focused Vitest run: 24 tests passed in two files.
- Full `npm run test`: 1,933 passed, 11 existing optional skips, 176 passing files.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed; no formatter script/configuration is present.
- Production build: default Turbopack failed on sandbox font access, then on
  denied local port binding after network approval.
  `GATEWAY_API_URL=http://localhost:8000 npm run build -- --webpack` passed
  (exit 0, all 20 static pages generated). GitHub's required `gate` still runs the
  unchanged default production build.

## Scope and limitations

No API, authorization, catalog visibility, data migration, dependency upgrade or
architectural decision changes. No new ADR is needed. No real production
publish/unpublish is performed. Required PR CI and merge/reachability evidence
must be verified separately before marking the issue Done.
