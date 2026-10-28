# KEL-222 private enrollment schedule acceptance

## Selection and scope

**Observed, 28 October 2026:** after KEL-221 code/docs merged, required and main CI passed, merge commits were reachable from fresh `origin/main`, and Linear was Done, discovery was repeated from zero. It returned223 issues without another page; all full descriptions/native relations were re-read. Five issues remained unfinished and no organization PR was open. KEL-222 was the sole eligible candidate: High, estimate2, no blockedBy, active owner/delegate, comment or PR. It opens no backlog descendant. KEL-100/101/102 still lacked verified staging rollout/secret integration; KEL-104 depends on them. KEL-70/KEL-33 are explicitly related predecessors, not blockers. The now-successful real sandbox settlement removes the prior external acceptance uncertainty.

Implementation owners: academic and web; current-state documentation here. Gateway proxies the additive response unchanged. KEL-221 is already merged, and no branch stacking or third issue was used. See [ADR0084](../adr/0084-private-enrollment-schedule-projection.md).

## Contract and lifecycle

**Implemented:** scoped enrollment list/detail include `private_schedules` only after successfully loading a live private class's retained slots. Explicit `[]` is empty; omitted/malformed projection for a known private class renders “Jadwal tidak tersedia”. SQL errors fail the read. Group singular summary remains compatible. Each version exposes only ID, ISO weekday, start/end, optional location and validity dates; tutor/capacity are not added.

Retained ended/current/future versions appear once each, sorted day/start/valid_from/ID and shown with dates. Soft-deleted versions and deleted classes are excluded; payment status does not filter schedules. Migration00001790900005 adds the live enrollment lookup index, without changing business rows or requiring it for correctness.

## Acceptance evidence

- Real PostgreSQL isolated-schema regression uses the current schema, applies the index migration, and reads via the real GORM repository. It verifies multiple slots, past/future versions/order, deletion, a corrupt cross-class link, foreign tenant/parent denial,105 slots beyond the old100 cap, and constant total query count for one versus multiple enrollment rows. Pending→active retains the same projection. An injected schedule query failure fails the read rather than returning an empty collection. The disposable database is removed afterward.
- Mapper regression validates enrollment/class/deletion ownership, duplicate-version suppression, optional validity dates and absence of tutor fields. Loaded-empty and unloaded JSON shapes differ. Existing group summary, authorization and enrollment lifecycle regression suites pass.
- Web tests verify plural slots, effective periods, duplicate IDs, unavailable versus empty, malformed values, pending display in both layouts, group fallback and105 projected rows with no `/api/v1/schedules` request. Shared parent formatting uses the same contract. Existing error and loading skeleton paths remain in place.
- Full web run:1904 tests passed,8 explicitly gated integration tests skipped (173 passed files,3 skipped); lint and `tsc --noEmit` pass. Production Next.js16.4.3 build passes using `next build --webpack` in a separate source copy, preserving the running user's dev `.next`. No source/build artifacts are copied back.
- Go1.26.10: formatting, mod verify, vet, full race tests, build and vulnerability gate pass. The complete race suite also passes with all seven PostgreSQL CI DSNs enabled against one disposable database, including existing migration upgrade/replay tests at version1790900005. `govulncheck@v1.8.0` finds no called/imported-package vulnerabilities; three module-only advisories are uncalled. The new PostgreSQL regression is enabled in required Academic CI via `KEL222_TEST_DSN`.

## Real stack and browser journey

Candidate Academic18081 and unchanged main gateway18000 read the existing synthetic approval/payment fixture through actual identity, Academic and billing services. Academic background workers are disabled for acceptance. Production web13300 uses that gateway. No API/data boundary in this journey is mocked.

Parent and tenant scoped gateway list and both detail reads return HTTP200. The private paid-active and unpaid-pending enrollments each have two slots: Tuesday10:00–11:00 and Thursday14:00–15:00, valid from27 October2026. The card fixture has real owner-completed Duitku sandbox settlement independently verified in [KEL-221](kel221-initial-payment-activation.md); the unpaid VA fixture remains pending. This read-only change reuses those persisted fixtures and does not create another payment or claim a second settlement.

Chrome at1440px and390px verifies both slots and periods on parent and tenant, normal reload, accurate pending/active payment presentation, and no page errors. [Tenant mobile](kel222/tenant-mobile.png) and [tenant desktop](kel222/tenant-desktop.png) show both states. Previously the tenant table showed no private schedule despite persisted rows. The existing local tenant-selector unavailable message is independent of this projection and remains outside scope.

Fresh unrelated synthetic tenant and parent sessions receive404 for the fixture detail even with a spoofed tenant header and empty list results. No other tenant's slots are returned. No personal data or credentials are retained in this evidence.

## Delivery and operations

Implementation PRs: [Academic #65](https://github.com/kelolakelas/kelolakelas-academic-service/pull/65), final source tracked by the PR, and [web #135](https://github.com/kelolakelas/kelolakelas-web/pull/135), source `49e55d0`. All code/documentation PRs must merge into main with required CI before Linear Done. Apply the additive lookup index using normal migrations, deploy Academic, then web. The index migration was exercised only in a disposable database; no shared or production database migration or deployment is claimed. Payment/session mutations, teacher disclosure and calendar redesign remain outside scope. Large retained histories may increase the additive response; pagination of enrollment rows and one batch query remain bounded independently of that history size.
