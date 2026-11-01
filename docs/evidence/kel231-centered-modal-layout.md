# KEL-231: Centered web modal layout

## Source snapshot (2026-11-02)

Observed implementation on branch
`skinel123/kel-231-pusatkan-seluruh-modal-web-termasuk-tambah-anak-dari-detail`,
based on web `a3bc1db`. These are source snapshots, not deployment claims.

Web: `components/ModalDialog.tsx` (`layout`, `data-modal-layout`),
`app/globals.css` (shared `dialog:modal` centering rules),
`app/(public)/_components/EarlyAccessModal.tsx`,
`app/(dashboard)/dashboard/tenant/roles/_components/RoleEditModal.tsx`,
`app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.tsx`
(migrated to the shared wrapper),
`app/(dashboard)/dashboard/tenant/_components/MobileNav.tsx`
(explicit `layout="drawer"` opt-out),
`components/ModalDialog.test.tsx`,
`app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.flow.test.tsx`,
`app/(dashboard)/dashboard/tenant/classes/_components/ClassCreationWizard.integration.test.tsx`,
`scripts/verify-modal-layout.mjs`, `package.json`
(`test:modal-browser`, pinned `esbuild`/`postcss`).
[Decision](../adr/0086-centered-modal-layout.md).

## Inventory

**Implemented:** the shared wrapper plus every independent native dialog is
covered. The verifier scans `app/**/*.tsx` for `<dialog>` with a string-literal
`className` and asserts exactly 20 templates (19 files; accept/decline in
`ScheduleRecommendationActions.tsx` count twice):

- parent `enrollments/CancelEnrollmentButton`, `students/DeleteStudentButton`
- tenant classes `DeleteClassButton`, members `RemoveMemberButton`,
  `RevokeInvitationButton`, reports `ReportDeleteDialog`/`ReportFormDialog`,
  roles `DeleteRoleButton`, schedule-requests
  `ApproveScheduleRequestDialog`/`RejectScheduleRequestDialog`, sessions
  `AttendanceDialog`/`RescheduleDialog`/`SubstituteTutorDialog`, transactions
  `RefundTransactionButton`
- public `kelas/[id]` `CancelScheduleRequestButton`, `EnrollmentPanel`
  (add-child dialog), `ScheduleRecommendationActions` accept/decline
- platform `creator-requests/DecisionForm`, `withdrawals/DecisionForm`

Three former fixed-position `div` overlays now render through the shared native
wrapper: `EarlyAccessModal`, `RoleEditModal`, `ClassCreationWizard`
(`WizardDraft`). The tenant mobile navigation drawer keeps
`layout="drawer"` and stays left-anchored. The `DateInput` calendar popover
(`role="dialog"`) is an anchored non-modal control and is intentionally not
centered. No submit/validation/business logic was changed.

## Executed local acceptance

- Default suite: 173 files passed, 4 skipped (177); 1910 tests passed,
  10 existing opt-in skips (1920). The earlier targeted run caught one
  wizard focus/cancel-harness mismatch; the committed test fix passes in the
  final suite. `npm run lint` passes, `npx tsc --noEmit` is clean,
  production `npm run build -- --webpack` compiles, `git diff --check`
  passes, `npm audit --omit=dev --audit-level=high` reports zero
  vulnerabilities.
- Browser runner `npm run test:modal-browser` (Chrome via agent-browser,
  isolated deterministic server-action stubs; no gateway/database claim):
  23 results, 20 templates, 4 viewport configs at 2px centering tolerance
  (desktop 1280x900, mobile 390x844, short/keyboard 390x320, zoom-200
  equivalent 640x450); every template measured short and long. Live
  components verified desktop/mobile: add-child student (304,193 672x514;
  16,77 358x690), class edit, creation wizard, role edit, early access,
  schedule approval, reschedule, shared fixture and drawer (0,0 left
  anchored). Each reports native top layer, contained focus, inert
  background and Escape close with trigger focus return. Add-child flow:
  validation failure stays in-modal, error-expansion resize 390x844 to
  390x320 keeps the submit reachable, retry success closes and selects the
  new child in the private request form without navigation. Shared
  1600px expansion keeps title and final close reachable; removed-trigger
  close restores body scroll.

## Rollout and limits

No migration, configuration, API, permission or business-rule change; roll
back the web PR to revert. Dev-only `esbuild`/`postcss` pins support the
local browser runner. Safari/Firefox, physical mobile keyboards, screen
readers, production backend login/payment and every modal on every route
remain unverified. Delivery requires provider verification, not local
tests alone.
