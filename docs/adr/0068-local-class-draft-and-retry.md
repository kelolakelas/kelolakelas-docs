# ADR 0068: Local class draft and retry ownership

Status: Implemented (KEL-197, 2026-10-16).

The tenant must configure category, class, Teacher and schedules before any record is persisted. Independent intermediate writes cannot satisfy cancellation or atomic failure semantics. KEL-196 provides the aggregate API on main.

Keep the wizard draft in local mounted components, with hidden steps preserving input and generator state across Back/Next. Closing or navigation unmounts the draft. Existing category CRUD and standalone schedule creation remain separate paths. The wizard makes one final aggregate Server Action call, uses a synchronous busy ref against repeated events, and disables controls while pending. The backend remains the permission and membership authority.

The client retains the first submitted payload and generated key until a known result. For a definite initial rejection, the user may correct the draft and submit a new key. Network/5xx/malformed-success uncertainty and key conflicts freeze the attempt and allow identical replay. A later rejection of a replay cannot resolve earlier uncertainty; the original attempt remains frozen. This avoids silently making a second class after a lost successful response. A close after uncertainty tells the user to check the class list; recovery across navigation/session is outside scope.

Keeping server-side partial drafts would introduce persistence, lifecycle and cleanup policy beyond this issue. Recreating a key after every retry would defeat the backend guarantee. Local state with explicit uncertainty has no new persistence or API surface beyond KEL-196.

Evidence: web ClassCreationWizard.tsx and interactive flow tests, classActions.ts and action tests, opt-in API/PostgreSQL integration suite. The local stack uses academic main, gateway main, a unique disposable schema and test identity responses; it validates writes and rollback without production data or provider credentials. Browser layout screenshots and a production rollout are not claimed by these tests.
