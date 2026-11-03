# KEL-232: Public authentication entry navigation

## Source snapshot (2026-11-03)

Verified web source commit: `a976273999b7838af43f422dd4f1fdee2d5944de`.

**Implemented:** web `LoginForm`, `RegisterFormSwitch` and public homepage provide
reciprocal login/register links and direct header login entry. The obsolete
`EarlyAccessModal` and its browser fixture are removed. No backend, auth action,
cookie, invitation parser or redirect policy changes; no migration or new ADR.
This snapshot records local source and acceptance, not production deployment.

## Acceptance mapping

| Requirement | Source and verification |
| --- | --- |
| Parent/organization Masuk | Shared `RegisterFormSwitch`; both personas covered in `app/(auth)/auth-navigation.test.tsx` and production browser |
| Login Daftar independent of submit | Outside `LoginForm` form; empty/error regression and no action calls; browser navigates with a populated password field without forwarding it |
| Landing Akses awal to login | Semantic `Link` replaces modal; `app/(public)/page.test.tsx` and keyboard browser checks assert `/login`, no dialog |
| Keyboard and narrow layout | Explicit focus-visible outline and minimum44px target; browser uses native Tab/Enter at1280x900,390x844 and320x640 |
| Preserve other flows | Other two landing CTAs remain `/register`; existing forgot/admin links, persona query and invitation hidden return target tested; full auth/action/routing regression suite retained |
| Safe navigation | New links use literal `/login` or `/register`; no query/input copying; failed-login component regression retains invitation target only in the existing form |

## Reproduce

- `npm test`: default suite1922passes,11existing opt-in skips; focused navigation,
  input and action suite32passes. Opt-in backend integration tests are not needed
  for this UI-only change and are not claimed as executed.
- `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack`.
- Start the production build on loopback port3232, then run
  `node scripts/verify-auth-navigation.mjs`. Override `AUTH_NAVIGATION_ORIGIN` to
  target another local production server. No account credentials are needed;
  this checks public navigation, not a provider login or registration.
- `npm run test:modal-browser`: remaining shared/native dialog, drawer, focus,
  dismissal and responsive-layout regression after removal of the old fixture.

**Boundary:** native Chromium keyboard and viewport checks are not a screen-reader
audit. No production auth provider, email delivery or deployment is asserted.
