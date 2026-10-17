# KEL-209 explicit group timetable draft

**Implemented:** `ScheduleForm` initializes wizard drafts with zero slots, including when the initial private draft later switches to group. The empty state offers Add Slot and Generate Slots. The final create button is disabled until existing schedule validation succeeds, every slot has a teacher from the complete eligible member list, and no save is pending. Validation remains in the submission handler and aggregate server action.

Removing the last draft slot returns to empty. Invalid generation or a valid window with no complete session leaves the timetable unchanged. Explicit slot drafts survive Back/Next and type changes. Private creation still submits no timetable; persisted schedules are loaded by the existing configuration editor rather than initialized from the new-draft state. Standalone schedule creation behavior is retained.

Source: web `app/(dashboard)/dashboard/tenant/classes/_components/ScheduleForm.tsx`, `ScheduleForm.test.tsx`, `ClassCreationWizard.flow.test.tsx`, `ClassCreationWizard.integration.test.tsx`; revision `d632b47`. No backend API, data migration or architecture decision changes.

## Verification on 2026-10-18 (Asia/Jakarta)

- Full `npm test` with `KEL197_INTEGRATION_CONFIG` pointed at the temporary acceptance stack: **1743 passed**, **4 skipped** (existing editor/migration opt-in suites). Four wizard acceptance cases ran against actual main gateway and academic handlers/usecases with PostgreSQL: cancel zero writes; rollback/retry; group two tutors; private no schedules/sessions.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` passed. Dependencies were unchanged and production audit in this batch returned zero vulnerabilities. No formatter script/configuration exists in the repository.
- Production browser at 390×844: initial empty state, zero slot controls and save disabled; choosing an active bulk teacher and Add Slot enables save; capacity 0 disables; removing the sole slot restores empty/save disabled. Re-add/save on desktop succeeded; API read-back found one `KEL209 Browser Group` with one slot, capacity 10.
- Existing Edit Class loaded its persisted Wednesday 14:00–15:30 slot, capacity 10 and Teacher One. Mobile edit retained that schedule, had no horizontal overflow, and Tab remained usable. Browser error list was empty. Temporary screenshots: `/private/tmp/kel209-empty-mobile.png`, `/private/tmp/kel209-existing-mobile.png`.

Identity authentication, permission and membership were test doubles in the acceptance fixture. PostgreSQL data was synthetic and schema-isolated. Existing editor tests additionally verify preload/reopen and mutations; live production identity, payments and email are not claimed.

## Delivery

Web [PR #118](https://github.com/kelolakelas/kelolakelas-web/pull/118) merged to main on 2026-10-18 (Asia/Jakarta), squash `d8edeba65e3922fd998e3d564303d94e74f4190c`; required [gate](https://github.com/kelolakelas/kelolakelas-web/actions/runs/39059150116) and preview deployment succeeded. Commit reachability from fetched `origin/main` was verified. The acceptance fixture exited successfully and dropped its temporary schema; browser and local web server were stopped.
