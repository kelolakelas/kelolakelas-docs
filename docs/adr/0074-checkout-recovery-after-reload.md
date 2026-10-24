# ADR 0074: Preserve the group checkout attempt after reload

## Status

Accepted and implemented for KEL-216 in web. Academic and billing contracts are unchanged.

## Context

Group checkout reserves an enrollment before requesting an invoice. A transient billing failure leaves a pending enrollment which the existing academic endpoint can recover only with the original `Idempotency-Key`. The previous class page generated a fresh UUID on every server render; reload also cleared the parent's selected student/schedule/channel. A new key can encounter the existing enrollment instead of continuing its invoice creation. Keeping only in-memory form state, as KEL-194 did, cannot recover after reload.

## Decision

- Store the latest submitted group checkout attempt in `sessionStorage`, scoped by schema version, parent user ID and class ID. It contains the original UUID plus student/schedule IDs, cycle, channel and voucher text. Do not store JWTs, credentials, names, addresses, prices, payment instructions or provider URLs.
- Write before dispatch, so network interruption or a lost action response still leaves the original identity. Restore through `useSyncExternalStore` after hydration; the server snapshot is empty. Remount the panel when parent/class changes. Validate the bounded serialized record against the existing enrollment schema before using it. Corrupt records are ignored.
- This is a UI draft, never authorization or proof of an invoice. Gateway/academic/billing still verify the parent, student ownership, class rules, capacity and idempotency. Retry the restored attempt even if its schedule is now full: a seat reserved by that attempt may account for the capacity. A new request still cannot bypass backend capacity checks.
- Retain the latest attempt after success too, allowing reload/card-return replay to reach the same invoice. Selecting another student begins a distinct UUID; returning to the complete original draft before submitting restores its UUID. Existing voucher edits retain their existing new-key behavior. A subsequent submission replaces the latest tab draft; this is not a multi-order store or a cross-device recovery service.
- If storage is denied/unavailable, continue the current in-memory form and explicitly ask the parent not to reload/close the tab before confirmation. Tab closure or cleared storage can lose the draft. Server-side durable cross-device recovery would require a separate contract and is not introduced here.
- Use the manually dispatched action's pending state to disable repeated submit. Missing enrollment identity or absent VA/QRIS instructions remains a retryable failure, preserving the submitted values. VA/QRIS remain in KelolaKelas; card keeps its validated hosted-provider redirect and original invoice method on replay.

## Consequences and verification

The latest attempt can be restored in the same tab and account after reload. Account/class scoping prevents accidental adoption of another account's draft; backend authorization remains the security boundary. Browser storage is readable by application JavaScript and is deliberately limited to these non-credential identifiers/options.

Regression tests cover remount with a new server UUID, preserved payload, a now-full reserved schedule, account separation, corrupt data, blocked storage, pending-submit state and incomplete payment responses. See [KEL-216 evidence](../evidence/2026-10-24-kel-216.md) for real browser/provider/persistence validation and its limits.
