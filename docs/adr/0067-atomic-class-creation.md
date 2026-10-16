# ADR 0067: Atomic initial class configuration

Status: Implemented (KEL-196, 2026-10-16).

The former composite endpoint only created a class and teacher links under an existing category. Creating a category or schedules separately exposed partial configuration when a later step failed.

Extend the same endpoint with an optional new category and initial group schedules. The creation use case owns the transaction and calls repositories directly; it reuses the session generation calendar functions without invoking another committing use case. Existing-category requests remain compatible. Category reads use a tenant predicate and SHARE lock; each teacher is checked against identity active membership. Class creation requires class:create, with category:create and schedule:create added only when that operation occurs.

Use a durable tenant/key unique row with a SHA-256 payload fingerprint and response JSON. PostgreSQL serializes concurrent inserts, and the row commits with the complete aggregate. Identical replay returns original IDs; changed payload conflicts. A key is required for the extended aggregate while legacy unkeyed calls keep their former behavior. A client must retain its key after a lost response; generating another key cannot deduplicate the original operation. There is no automatic key expiry in this scope.

Alternatives: coordinating independent writes and compensating deletes cannot guarantee rollback and could destroy existing references. Nesting independently committing use cases would leave transaction ownership unclear. Private schedules continue to require enrollment; no checkout or payment behavior changes.

Identity checks describe membership at validation time; no distributed transaction locks identity membership until the academic commit. Existing session generation horizons and advisory overlap behavior remain. Apply the additive retry-table migration before rollout; rolling back application code can retain that table.

Evidence: academic class_creation_usecase.go, class_creation_store.go, class_handler.go, class_creation_postgres_test.go and migration 00001790900000; API and flow pages in this repository.
