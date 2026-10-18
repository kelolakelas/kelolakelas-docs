# ADR 0071: Shared wall-clock schedule entry

Date: 2026-10-18. Status: Accepted (KEL-210).

## Context

Create, generated and saved schedules accept HH:mm or HH:mm:ss strings. Native time controls have browser-owned selection and presentation; their segments cannot be selected with the text selection API. A standalone Chromium probe already advanced hours to minutes, so the reported defect is not established across all native controls.

## Decision

Use one labeled text input with a numeric keyboard hint, 24-hour pattern and shared schedule styles. Only a single typed digit completing a valid hour moves selection to minutes. Paste, deletion, arrows and Tab are left to the browser. Single-digit segments normalize on blur; optional stored seconds remain intact. Weekday keeps a semantic native select with explicit appearance and a shared chevron.

## Consequences and alternatives

The UI has deterministic, testable selection and string serialization without Date/timezone conversions. The browser's native time picker is replaced by text entry; partial/invalid input remains visible and existing schemas gate generation/save. Keeping native type=time would preserve its picker but cannot implement deterministic segment selection across engines. Separate hour/minute fields would add focus stops and labels. Safari automation was unavailable; WebKit and physical assistive/mobile verification remain a stated limit.
