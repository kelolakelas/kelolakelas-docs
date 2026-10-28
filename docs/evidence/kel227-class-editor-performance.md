# KEL-227 selected class editor performance

**Observed,28 October2026 (Asia/Jakarta):** task1 in a new exactly-two-issue batch. Fresh discovery retrieved223 full Linear descriptions/native relations/attachments, including archived/completed/canceled, and comments for all8 unfinished issues. Seven origin/main refs and every open PR were refreshed. Eligible ranking: KEL-227 Medium/2 then KEL-228 Medium/3, each unblocking zero descendants. KEL-221 retains active draft billing40/docs231 and its original checkout was preserved. KEL-222 real post-payment acceptance remains unavailable: official Duitku simulator returned403 again. KEL-100/101/102 lack verifiable staging/topology/secret-manager rollout (connected Railway read requires reauthentication);104 depends on unfinished issues. No second issue started before this delivery.

KEL-227 native blockedBy is empty. Explicit foundations198/211 and chain197→196 were read afresh, all Done. Provider merged_at/merge SHA/main target and fresh-fetch ancestry prove all10 PRs:

| Issue | PR | Merge SHA | merged_at UTC | origin/main |
|---|---|---|---|---|
| KEL-198 | [PR](https://github.com/kelolakelas/kelolakelas-docs/pull/201) | `65215506b15e226bf7cbe261fec0d0a949648001` | 2026-10-16T11:29:33Z | reachable |
| KEL-198 | [PR](https://github.com/kelolakelas/kelolakelas-web/pull/108) | `3cf0b280bd06ce550f9c79aafdc7583b135f7d9d` | 2026-10-16T11:28:22Z | reachable |
| KEL-198 | [PR](https://github.com/kelolakelas/kelolakelas-academic-service/pull/57) | `7fd11396f4f21e1430c12641d80e77a58d351c1c` | 2026-10-16T11:27:07Z | reachable |
| KEL-211 | [PR](https://github.com/kelolakelas/kelolakelas-docs/pull/216) | `4a2a6ca444b95d5f4583eb33c777fa015228964c` | 2026-10-18T06:49:12Z | reachable |
| KEL-211 | [PR](https://github.com/kelolakelas/kelolakelas-web/pull/120) | `73ae4c399ee05308b75aa272b906ac0b4c9c6949` | 2026-10-18T06:49:06Z | reachable |
| KEL-197 | [PR](https://github.com/kelolakelas/kelolakelas-docs/pull/200) | `c858bcfe6e6402b50e300e2261e5324c8c44446e` | 2026-10-16T09:14:20Z | reachable |
| KEL-197 | [PR](https://github.com/kelolakelas/kelolakelas-web/pull/107) | `fd3b1a41afa7237f60aa8e55fa733f40f79238d1` | 2026-10-16T09:13:26Z | reachable |
| KEL-196 | [PR](https://github.com/kelolakelas/kelolakelas-docs/pull/208) | `4b73b20f5518b45e04940ec84f95221f7ff6abe2` | 2026-10-16T16:37:56Z | reachable |
| KEL-196 | [PR](https://github.com/kelolakelas/kelolakelas-docs/pull/199) | `6f2bb57e3308b52c7b744a315588bcc40cd8d341` | 2026-10-16T08:54:24Z | reachable |
| KEL-196 | [PR](https://github.com/kelolakelas/kelolakelas-academic-service/pull/56) | `84fc0a9f1bec4c57593e404dbed5c38ae37488ab` | 2026-10-16T08:54:19Z | reachable |

## Implementation and correctness

**Implemented:** [ADR0083](../adr/0083-scoped-class-editor-reads.md) records protected selected-class and class-schedule reads, complete choices and an editor-local shared teacher provider. Existing public/collection and write/effective-date/history contracts remain; no migration/index/infrastructure/global cache. All new reads use live permissions, SQL ownership and no-store. Web refuses malformed/partial/duplicate/cross-scope saved data and retains drafts while blocking dependent writes on failed reads. Reload generations and unmount guards prevent stale response overwrite.

**Observed:** actual migrations in a disposable PostgreSQL schema exercised an unpublished class behind205 unrelated records and125 target schedules across pages. Three class-detail queries and three queries per schedule page remain constant (including category/teacher assignments or ownership/count/select respectively); no enrollment/parent preload. Tests cover historical/future/deleted rows, deterministic pagination, foreign/missing/deleted class, all125 unique slots and fresh-after-write values. Production-route tests cover absent/parent/revoked/denied context, both permissions, invalid pagination, sanitized dependency503 and tenant claim authority. Gateway tests cover absent/revoked/unavailable sessions and forged context stripping with path/query intact.

Web regressions cover105 schedules/205 categories, no exhaustive/public reads, complete metadata, later-page failure/duplicates/wrong IDs/tenant, fresh-after-save, one teacher loader/coalesced retry, independent editor scopes, draft retention, close/reopen late replies and out-of-order reloads after two already-started operations. Existing KEL-198/211 behaviors, wizard and schedule forms passed. Review used local Next16.4.3 guides and the React best-practices skill.

## Benchmark protocol and boundaries

Actual Chrome production web → actual gateway router/session check → actual identity HTTP/gRPC and Academic → two newly created synthetic PostgreSQL databases. Small profile has3 unrelated classes/categories/teachers; large205; each selected group has4 slots and is unpublished. A teacher/category beyond page100 is included. Main baselines: web4f6af85, gateway57945fd, identity7808fe5, academic09fd70a. Before uses detached main checkouts; after uses the candidate source. Same databases, viewport1440×1000, browser/production build settings, observer and interaction script. Email and scheduled workers disabled; optional Redis absent/gateway uses its existing fail-open fixture mode. Unrelated chat/billing are not part of this editor path. No production/shared database was migrated or mutated.

Gateway observer records only method/path/query/status/response bytes/duration (no credential/cookie/header/body). Each sample resets the observer, performs actual open, explicit reload or description-save plus refresh, then waits for saved data/teacher readiness. Latency is browser action-to-ready wall time including server functions and rendering; server-action invocation counts and summed downstream HTTP time are separate CSV fields. Network/SQL time is not claimed as an isolated production latency distribution. Background shell/layout reads may add server actions; operation counts focus on class/category/schedule/member resources. Database query counts were independently verified by the PostgreSQL logger test.

One warm-up per profile precedes measured repetitions. The first6-sample run prompted a second20-sample run because one after-save outlier increased p95. Both runs are retained. Empirical p50/p95 use nearest-rank;20 samples are not a production SLO or statistical guarantee. Before/after are sequential on the same remote PostgreSQL connection path, so network/host variability remains.

## Repeated20-sample results

| Profile / operation | p50 before→after ms | p95 before→after ms | Reads before→after | Response bytes before→after |
|---|---:|---:|---:|---:|
| small / open | 409.6→139.2 | 524.2→184.1 | 9→4 | 101,252→18,224 |
| small / reload | 115.2→100.9 | 230.7→215.0 | 3→3 | 7,226→2,554 |
| small / save-refresh | 330.0→286.1 | 420.5→440.8 | 7→7 | 30,123→25,451 |
| large / open | 1005.8→298.5 | 1169.8→454.8 | 27→8 | 3,125,660→516,980 |
| large / reload | 277.0→146.5 | 288.9→283.7 | 9→5 | 236,726→35,492 |
| large / save-refresh | 555.9→453.7 | 641.7→644.9 | 15→11 | 832,152→630,918 |

Large open reduces27→8 reads and about3.13MB→0.517MB; median improves about70%. Large reload reduces9→5 reads; save-refresh15→11. Small explicit reload has the same3 reads with less data; its latency is similar/noisy. Large save-refresh p50 improves, while p95 is effectively flat642→645ms: no tail improvement is claimed. The initial6-sample after save p95 was1014ms versus764ms before; it remains in the retained first-run CSV. No speculative cache/index or unrelated whole-page rewrite was added to chase this sample variation.

- [Before20 raw samples](kel227/before-repeat.csv), [after20 raw samples](kel227/after-repeat.csv)
- [Initial before6](kel227/before.csv), [initial after6](kel227/after.csv)

## Local gate evidence

**Observed:** Academic and gateway gofmt, go mod verify, go vet ./..., go test -race -count=1 ./..., go build ./... and govulncheck@v1.8.0 ./... passed. Academic uses Go1.27.3; gateway1.26.10. Academic full run enabled all existing PostgreSQL suites plus KEL-226 and KEL-227; new query tests run in required CI through KEL227_TEST_DSN. Generated Swagger and route/permission contract checks passed. No reachable vulnerability was found; uncalled module advisories remain informational.

Web final full suite:1900 passed,8 existing unrelated opt-in skips; ESLint clean, TypeScript, production webpack build and production dependency audit passed. The8 skipped integration cases are not claimed executed; actual browser/API/PostgreSQL acceptance is recorded separately below. No product test was weakened or skipped to pass.

## Browser acceptance and delivery

**Observed:** actual Chrome desktop1440×1000 and native mobile390×844 passed. An authorized Creator selected a category from page3 and the late teacher, saved an unpublished class, then read the exact persisted category/description via protected detail. Academic was actually stopped; reload showed unavailable feedback, retained the unsaved class-name draft and disabled dependent writes. Restart plus explicit retry restored editing without losing the draft. Keyboard Enter reloaded; Escape from a focused modal control closed it. Foreign-tenant class/schedule reads returned404 and missing-session reads401. No browser page errors.

Initial harness assertions did not wait for React/layout completion and resized an open desktop modal into the separate mobile rendering branch; the final run explicitly opens each native viewport. The existing duplicate responsive modal branches and focus behavior across disabling/reflow are not redesigned or claimed solved here. The unchanged initial list remains limited to100; selected-ID backend reads beyond100 are covered by PostgreSQL, independently of that listing limitation.

- [Saved desktop](kel227/saved-desktop.png)
- [Outage retains draft](kel227/unavailable-desktop.png)
- [Recovered mobile](kel227/recovered-mobile.png)

Coordinated PR/merge evidence follows provider verification. Deployment order: Academic + gateway before web; no migration. Existing class-list first100 behavior remains outside this selected-editor task. Separate paged reads do not create an atomic distributed snapshot; changed totals/duplicates cause a visible retry, and mutations retain existing live authorization/domain checks.


## Verified source delivery

**Observed:** all four initial PR required gates passed before coordinated implementation merges: [academic64 gate](https://github.com/kelolakelas/kelolakelas-academic-service/actions/runs/40569971119), [gateway47 gate](https://github.com/kelolakelas/kelolakelas-api-gateway/actions/runs/40569978718), [web133 gate](https://github.com/kelolakelas/kelolakelas-web/actions/runs/40569985370), [docs235 corrected gate](https://github.com/kelolakelas/kelolakelas-docs/actions/runs/40570152575). Web preview succeeded. Docs' first gate rejected exported CSV CRLF; normalization to LF preserved every parsed value and corrected CI passed. No bypass, CI weakening or data alteration.

| PR | Merge SHA | merged_at UTC | Fresh fetched origin/main |
|---|---|---|---|
| [academic64](https://github.com/kelolakelas/kelolakelas-academic-service/pull/64) | `c75c1c75d893a56a0ee16846605805fdc49d70fd` | 2026-10-27T19:35:17Z | reachable |
| [gateway47](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/47) | `d70421e3ba3c8f40d4df5599f72dd885a7059a6b` | 2026-10-27T19:35:26Z | reachable |
| [web133](https://github.com/kelolakelas/kelolakelas-web/pull/133) | `6aefe7430591ba6f01918f6a1701800747b71dcc` | 2026-10-27T19:35:33Z | reachable |

Original source commits were academic d4af75e, gateway293500b and webd5a4e02. Main protection required successful strict/up-to-date gate and PRs, with zero approving reviews required. Squash merges matched exact head SHAs. Coordinated documentation is tracked by [docs235](https://github.com/kelolakelas/kelolakelas-docs/pull/235); its live gate/merge state supplies final delivery proof. Both owned browser databases, fixture listeners and outage helper were removed; unrelated user services and billing KEL-221 branch were preserved. No task2 started before all task1 delivery gates.
