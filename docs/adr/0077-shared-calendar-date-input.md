# ADR 0077 — Shared calendar date entry

Date: 2026-10-25 (Asia/Jakarta). Status: accepted through KEL-219 implementation.

## Context

Native date controls did not guarantee Indonesian day→month→year typing, automatic segment advancement or direct distant-year selection. Nine source inputs across seven components cover DOB, filters, schedule changes and voucher boundaries. Existing API date and voucher instant policies must remain intact.

## Decision

Use one dependency-free client `DateInput`: day/month/year text segments with numeric keyboard hints, valid two-digit day/month auto-advance, editable segments and full ISO or DD/MM/YYYY paste. Submit one canonical YYYY-MM-DD named hidden field; unnamed visible fields enforce required, real-calendar and inclusive min/max constraints through browser custom validity. Empty optional dates remain empty; partial or impossible dates display an associated error and cannot submit. Complete invalid paste displays the attempted date instead of retaining stale data.

A nonmodal calendar dialog exposes direct numeric year and month selection, a roving-focus calendar grid, arrow/Home/End navigation, Escape, close and clear. Selection/Escape restore trigger focus; Tab can leave the popup. Popup positioning responds to viewport space. Labels, errors, disabled state, existing palettes and visible focus are preserved.

Date parsing and serialization use calendar strings and leap-year rules, not local-to-UTC conversion. UTC arithmetic is used only for grid navigation. VoucherDateTimeField retains its existing hydration, local time and exact untouched instant serialization, including seconds/fraction. DateInput follows controlled value changes, changed edit defaults and uncontrolled form reset without erasing incomplete local drafts. DOB recomputes its existing max-today boundary at focus. Backend validation remains authoritative.

## Alternatives and consequences

Retaining native date inputs cannot guarantee the requested segment/year behavior. Adding a date library would add a dependency for this bounded interaction; the shared control follows existing React/Tailwind patterns instead. This creates a maintained keyboard/calendar surface, covered by component, serializer and migrated form regressions. No API, migration, backend timezone policy, time-input redesign or production deployment change.

Chrome desktop/mobile viewport, UTC and Asia/Jakarta were exercised. Safari, Firefox, physical mobile keyboards and an actual screen reader were not exercised and are not claimed equivalent. [Acceptance and migration inventory](../evidence/kel219-shared-date-input.md).
