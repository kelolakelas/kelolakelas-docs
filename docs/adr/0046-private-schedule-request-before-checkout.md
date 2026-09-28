# ADR 0046: Private schedule request before checkout

Status: Accepted (KEL-107, 2026-09-28)

## Context

Direct private-class enrollment previously created an invoice before parent and tenant agreed on a weekly schedule. A parent had no request channel. The same request is visible to two personas, making ownership and tenant isolation critical.

## Decision

A parent first creates a private schedule request for an owned student in a published, open private class. Academic stores proposed weekly slots and a verified-token parent email in `private_schedule_requests`, with status `pending`; it creates no enrollment or invoice. A partial unique PostgreSQL index permits only one pending request per student/class. Tenant and parent reads are scoped in SQL, and rejection/cancellation conditionally transition only a pending row. Tenant members need `enrollment:read` to view and `enrollment:update` to reject; parent ownership authorizes creation, viewing and cancellation. Direct private checkout on both enrollment entrypoints returns HTTP 422 with `code: private_schedule_request_required`, while group checkout remains available.

## Consequences

A rejected or cancelled request allows another request for the student/class. A race between rejecting and cancelling has one winner; a decided request cannot be cancelled. Approval, schedule creation, enrollment, invoice, notifications and UI are separate work. The migration must precede traffic to the new endpoints; the gateway may deploy after academic. Existing private checkout clients must handle the new 422 and submit a request instead.

Evidence: academic [PR #34](https://github.com/kelolakelas/kelolakelas-academic-service/pull/34), squash `41a73e8c2e9223285863b6830cc10ad5912e2723`; gateway [PR #28](https://github.com/kelolakelas/kelolakelas-api-gateway/pull/28), squash `fef837a40edef676d86c7715a024e7b440f40c51`; academic `internal/usecase/private_schedule_request_usecase.go`, `internal/repository/private_schedule_request_repository.go`, `internal/delivery/http/handler/enrollment_handler.go`, and `migrations/00001790600000_private_schedule_requests.up.sql`.
