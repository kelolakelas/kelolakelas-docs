# KEL-220 public proposed schedule controls

**Implemented**, web revision `a53790c`. The public private-request weekday and native time controls use `lib/schedule-field-styles.ts`. Tenant forms retain compatibility exports and their existing colors/dark colors. Shared geometry is 44px height, 12px radius, 14px font, bounded width and matching padding. Public controls keep the public light palette; no public dark theme is claimed. The weekday uses the shared explicit chevron and keeps semantic select/keyboard behavior. Native time and weekday numbering/payload remain unchanged.

Slot-level validation feedback is associated through `aria-describedby` and `aria-invalid`; client and server slot failures share an alert beside the controls. A disabled fieldset freezes slot edits/add/remove during the existing action pending state. The hidden serialized slots input remains outside the fieldset, preserving submission.

## Eligibility audit

Fresh Linear list returned all 216 issues including archived/completed, no pagination; full issue descriptions/relations were fetched. Nine remain unfinished. KEL-216 has open web #124, academic #62 and docs #223 and latest comments identify unresolved real QRIS acceptance; excluded as active. KEL-100/101 require staging canary/rollback and deployed consumers whose integration is not evidenced in current source/operations/ADR 0027; KEL-102 explicitly awaits staging secret-manager/deployment integration. KEL-104 also awaits those three. None are replaced by local environment files or record-only operator acknowledgements.

Eligible order: KEL-220 (Medium/1), KEL-217 (Medium/2, older), KEL-218 (Medium/2), KEL-219 (Medium/3). All have zero unfinished descendants and no blocking relations, explicit implementation dependencies, active comments or open PRs. KEL-109/200/210 are related work, explicitly not blockers. All seven allowed repository remotes were fetched. Web baseline `a57133fa9db277183bf1aa6fda47b828579f4cdb`; main was checked out and pulled fast-forward-only before branching. Docs user-owned untracked planning files were preserved and excluded.

## Validation

- `npm test`: 1,779 passed, eight opt-in integration tests skipped (160 passed files, three skipped).
- `npx tsc --noEmit`, `npm run lint`, `npm run build -- --webpack`, `npm audit --omit=dev --audit-level=high`, `git diff --check`: passed; zero production vulnerabilities.
- Regression coverage verifies numeric weekday/time payload after add/remove, retained native controls, and client/server feedback association. Existing tenant schedule/time and public action/validation tests pass.
- Chromium fixture renders the actual ScheduleRequestForm with synthetic student/class and a delayed action double. This verifies presentation/submission mechanics, not a backend workflow change. At 320px each slot control measured 44px high, 262px wide, 14px text and 12px radius; 375px document scroll width equaled viewport. Desktop 1280px also had no overflow.
- Browser submitted `{day_of_week:7,start_time:"09:15",end_time:"10:45"}` with class/student, monthly and VC fields intact. Pending fieldset was disabled. Server error appeared beside fields; keyboard weekday selection and focus ring remained available; invalid border was visibly red. Browser time filling required native value-setter/input events because CLI fill did not populate Chromium time segments. Safari/Firefox were not tested.

## Visual evidence

Synthetic fixture, source CSS compiled with Tailwind; captures contain no credentials or production data.

| State | Desktop | Mobile |
| --- | --- | --- |
| Before | [1280px](kel220/before-desktop.png) | [320px](kel220/before-mobile.png) |
| After | [1280px](kel220/after-desktop.png) | [320px](kel220/after-mobile.png) |
| Error | [1280px](kel220/error-desktop.png) | [375px](kel220/error-mobile.png) |

[Pending/disabled screenshot](kel220/disabled.png). The tenant palette and time component were not migrated; their style definitions remain semantically identical. No new architectural decision or ADR is required for this token reuse.
