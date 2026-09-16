# ADR 0003: Parent tasks with per-repository work units

## Status

Accepted for implementation in AI orchestrator Phase 1.

## Context

The planning intake contract permits one Linear Issue to declare multiple affected repositories. The Phase 1 `tasks` table can store only one nullable repository, branch, and workspace, so it cannot faithfully persist a multi-repository contract or recovery state. It also has no lease, checkpoint, blocker, or external-operation record.

The worker will make external changes in later phases. A process crash after a Git, Linear, GitHub, or model operation can leave its outcome ambiguous. Automatically repeating such an operation could duplicate side effects or overwrite work.

## Decision

One `tasks` row is the parent workflow and is the authority for the Linear Issue, contract snapshot, dependency graph, lifecycle state, and lease. Each repository named in the validated contract receives one `task_work_units` row. A work unit records the repository-specific branch, workspace, base commit, state, and outcome.

Task dependencies are persisted as parent-task relations. A queued task is eligible for claim only when every blocker parent task is `COMPLETED`. Parent task transitions are validated by the existing state machine, update the task, and append exactly one transition-history record in a single database transaction.

The parent task lease has an owner, expiry, and heartbeat. State-changing calls require the current lease owner while a lease exists. When a lease expires, recovery changes the task to `BLOCKED`, records the transition, clears the lease, and marks it for manual intervention. Automatic replay is deferred until a later phase can use durable stage checkpoints and idempotency records to prove it is safe.

## Alternatives considered

- A separate task for every repository would obscure the source Linear Issue, make dependency and final-completion semantics harder to coordinate, and require a second aggregate entity later.
- A JSON array on `tasks` would make uniqueness, foreign keys, queryable readiness, and repository-specific recovery weaker.
- Automatically re-queueing a stale lease is faster but can repeat an external side effect whose result was not durably observed.

## Consequences

The database gains normalized task dependencies, work units, attempts, checkpoints, and external-operation records. The current legacy single-repository columns remain during Phase 1 for migration compatibility and will not be used by new workflow code.

Future phases must define when all work units may advance a parent task and how a partial delivery is surfaced. Any automatic stale-lease resume requires a new ADR and test evidence for idempotent recovery of the affected stage.