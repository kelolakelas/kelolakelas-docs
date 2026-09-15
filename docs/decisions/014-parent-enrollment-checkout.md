# ADR 014: Parent enrollment checkout boundary

Status: Accepted

Date: 2026-09-15

## Context

The academic service already exposes a parent-scoped catalog enrollment endpoint. It validates parent identity, student ownership, publication/enrollment state, capacity, and idempotency before asking Billing to create the invoice. The web had public class discovery and parent student management, but no path connecting them to checkout.

## Decision

The web class detail page owns selection UI only. A Server Action reads the HTTP-only JWT cookie, validates the class/student/schedule/billing-cycle references, forwards the request to `POST /api/v1/catalog/classes/{class_id}/enrollments`, and sends the backend checkout URL to the browser only after validating it is an HTTP(S) URL. The browser does not submit price, tenant, parent, or direct billing fields.

The idempotency key is generated for the mounted form and submitted as `Idempotency-Key`; retries of that form keep the same key. A new page render creates a new intent. Schedule availability is presented from the catalog response, but the academic service rechecks capacity while creating the enrollment.

The academic handler maps capacity exhaustion to HTTP 409 so the web can distinguish a schedule conflict from a provider/server failure. Billing remains responsible for invoice creation and the payment provider redirect.

## Alternatives considered

- Direct browser-to-billing invoice creation was rejected because it bypasses academic enrollment verification and authoritative pricing.
- Generating a new idempotency key for every submit was rejected because double-submit and retry would not be the same enrollment intent.
- Moving schedule-capacity checks into the web was rejected because availability can change after the detail page loads and the academic transaction must remain authoritative.

## Evidence

`kelolakelas-web/app/(public)/kelas/[id]/_actions/actions.ts`, `app/(public)/kelas/[id]/_components/EnrollmentPanel.tsx`, `kelolakelas-academic-service/internal/delivery/http/handler/enrollment_handler.go`, `internal/usecase/enrollment_usecase.go`, and `internal/repository/enrollment_repository.go`.
