# ADR 0086: Centered web modal layout (KEL-231)

## Decision

Center every web modal on the viewport through the shared native
`ModalDialog` wrapper plus one global fallback for independent native
`dialog` templates. `ModalDialog` gains an explicit
`layout: 'centered' | 'drawer'` prop (default `centered`) rendered as
`data-modal-layout`; the tenant mobile navigation drawer passes
`layout="drawer"` and stays left-anchored. Global CSS centers unmarked
native modal templates (`margin: auto`, bounded width/height with internal
scroll) and gives centered wrappers column layout whose first child is
auto-margined, so long content starts at a safe margin while its panel
and final action stay scroll-reachable instead of being clipped for
mathematical centering.

## Alternatives and rollout

Per-caller centering classes were rejected: the audit found three divergent
patterns (wrapper without a default, local classes on one editor, fully
independent dialogs), so a shared default plus a fallback covers all 20
templates including future unmarked ones. A non-native overlay system was
rejected because native `showModal` already supplies the top layer,
inert background, focus containment, Escape/cancel and trigger focus
return without new dependencies. Migrating the three fixed-position `div`
overlays (early access, role edit, class-creation wizard) into the shared
wrapper was preferred over patching each overlay's stacking and keyboard
handling separately. The anchored `DateInput` calendar popover stays
non-centered, and no submit/validation/business behavior changes.

No migration, configuration, API or permission change; roll back the web
PR to revert. Dev-only `esbuild`/`postcss` pins support the local browser
runner only.

## Verification

Implementation and executed checks are recorded separately in the KEL-231
acceptance evidence; this ADR does not claim deployment or test success.
