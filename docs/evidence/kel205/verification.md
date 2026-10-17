# KEL-205 verification

Date: 2026-10-17 (Asia/Jakarta).

**Observed:** 1,734 tests passed; seven opt-in integration tests skipped in the default run. Targeted action/wizard suite: 34 tests passed. `npm run lint`, `npx tsc --noEmit`, `npm audit --omit=dev --audit-level=high` and `git diff --check` passed. No separate formatter script exists.

Action cases cover 400/401/403/409/429/500/502/503/504, malformed success/non-JSON, network rejection, inactive teacher, invalid capacity, safe request references and suppression of arbitrary SQL/stack details. Wizard cases verify focused alerts outside disabled forms, retained inputs, duplicate-submit protection, and identical payload/key on retry after interrupted response or later permission refusal.

Default local production build hit the existing Turbopack worker port restriction (`Operation not permitted`); the no-worker attempt hit the same boundary. The normal GitHub production build remains a required merge gate. No successful local production build is claimed.

Backend/gateway contracts, authorization, migrations, and private scheduling policy are unchanged. The browser cannot distinguish every pre-commit service error from a lost committed response using the current API, so 5xx retain the original request conservatively. More granular backend error codes are outside this web-only scope.

**Observed integration:** opt-in migration seam test passed in 27.2 seconds against the current-main academic fixture and gateway executable, disposable PostgreSQL schema and controlled identity responses. The temporary fixture overlay restricted `search_path` to its schema, removing the existing fixture's `public` fallback; no repository fixture source was changed. The earlier unisolated attempts incorrectly saw the development retry table and failed their expected-missing-table assertion, so those attempts are not counted as passing.

**Observed Chromium:** actual Next.js dev wizard, existing category and synthetic Teacher, group draft “KEL205 browser retry”. An injected session-write failure returned 500. The [error alert](error.png) remained visible, received focus, was outside the disabled fieldset, preserved the draft and offered Retry Same Request. The response in this fixture supplied no reference header to the action, so none was fabricated. After removing the injection, retry confirmed the save and closed the modal ([recovery](recovered.png)). No raw SQL appeared in the UI. The seam test separately verifies unchanged counts on rollback and exactly-once replay after committed-response loss. No live identity, email or payment-provider acceptance is claimed.

Final web revision `2c1e79c` also keeps Tab/Shift+Tab inside the dialog after programmatically focusing the error alert; the full 1,732-test suite, lint and TypeScript passed again on that revision. The main fixture shut down cleanly and dropped its disposable schema.
