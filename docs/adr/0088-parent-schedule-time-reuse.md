# ADR 0088: Reuse shared wall-clock input on parent and reschedule surfaces

Date: 2026-11-03. Status: Accepted (KEL-233).

## Context

KEL-210 fixed hour-to-minute advancement only in the tenant class-schedule
editor (`ScheduleTimeInput`). The parent private schedule-request form and the
tenant reschedule dialog still used native `input[type=time]`, whose
browser-owned segments cannot be selected deterministically. KEL-233 asks for
the same behavior on the parent surface without a parallel implementation, and
names reschedule as the related surface for the same input behavior only.

## Decision

Reuse `ScheduleTimeInput` unchanged on both surfaces: parent request start/end
slots keep the public palette and controlled-draft contract, while reschedule
`new_start_time`/`new_end_time` keep tenant styling, field names, action
payload, and the `HH:MM`/`HH:MM:SS` schema. Payload formats, validation,
timezone handling, durations, and reschedule flow are unchanged.

## Consequences and alternatives

One time-entry semantic exists across tenant editor, parent request, and
reschedule inputs, covered by the shared component tests plus surface tests.
The native time picker is replaced on these two surfaces by the same text
entry already accepted in ADR 0071. A surface-local duplicate input was
rejected because it would fork hour/minute semantics. The remaining native
time inputs (voucher datetime with seconds, tenant rejection recommendations)
stay out of scope. Browser selection still carries the KEL-210
Safari/WebKit/physical-mobile verification limit.
