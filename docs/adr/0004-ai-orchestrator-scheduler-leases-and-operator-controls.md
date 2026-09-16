# ADR 0004: Scheduler leases, recovery, and operator controls

## Status

Accepted for implementation in AI orchestrator Phase 3.

## Context

Phase 3 turns the persisted workflow into a long-running worker. Several processes may share one PostgreSQL database, a stage can run for minutes, and a process can stop gracefully or be killed. The implementation plan requires the concurrency limit to hold across processes, operating hours to be applied at stage boundaries, safe shutdown, and audited operator controls. ADR 0003 requires stale leases to be recovered conservatively.

Stage handlers for repository preparation and agent execution do not exist yet. The scheduler still needs a contract that later phases can implement without changing lease and recovery semantics.

## Decision

**Concurrency.** A claim runs in one transaction that takes a PostgreSQL advisory transaction lock, counts every task with a lease owner, and claims only while that count is below `maxConcurrentTasks`. Expired but unrecovered leases still count, so the limit is never exceeded while recovery is pending.

**Leases and heartbeats.** Leases default to 300 seconds, and heartbeats to 60 seconds. Configuration rejects a heartbeat longer than half the lease, so one missed heartbeat cannot expire a lease. Heartbeats never overlap. A transition made as a lease owner requires that the caller still holds the lease, so a late result from a worker whose lease was recovered is discarded.

**Stage boundaries.** A stage handler returns a normalized outcome: `advance`, `pause-limit`, or `interrupted`. Before each stage the owner re-reads the task and controls, and parks the task (releases the lease without a state change) when it cannot continue. A parked task in an active state can be claimed by any worker with a handler for that state. Schedule closure moves an AI stage to `PAUSED_SCHEDULE` with `resumeState`. A usage limit moves it to `PAUSED_LIMIT` with `resume_after`. Pauses release the lease.

**Recovery.** Automatic replay of an interrupted stage remains out of scope:

- A graceful shutdown aborts running stages and waits for a grace period. A stage that stops at a safe point is parked.
- A stage that does not stop in time, and a forcibly terminated worker, keep the lease until it expires. Recovery then moves the task to `BLOCKED` with manual intervention required. A state that cannot enter `BLOCKED` is flagged without a transition.
- A worker with a stable, per-process-unique identity recovers its own previous leases at startup instead of waiting for expiry.

**Operator controls.** A singleton `orchestrator_controls` row stores `pause_new_work` and the schedule override (`normal`, `enabled`, `disabled`) for all workers. Retry, cancel, and manual-intervention actions change the task and append an `operator_actions` audit row in one transaction. A new terminal `CANCELLED` state is reachable from every non-terminal state. Cancelling or flagging a leased task records a request that the lease owner applies at its next heartbeat or stage boundary, so one process never interrupts another process's side effect. The HTTP operator API binds to loopback by default and requires a bearer token.

## Alternatives considered

- Counting only this process's in-flight tasks would let N processes run N times the limit.
- Using a row-level `SKIP LOCKED` claim without a global lock prevents duplicate claims but not over-subscription across processes.
- Re-queueing expired leases automatically is faster, but can repeat an external side effect whose result was not durably observed.
- Mapping cancellation to `BLOCKED` or `FAILED` would make an operator decision indistinguishable from a failure and allow accidental retry.
- Having operator requests clear another worker's lease directly would race with that worker's in-flight side effect.

## Consequences

Stage handlers must be idempotent with respect to their own checkpoints, because paused, parked, and retried stages run again. Recovery of a hard crash takes up to one lease duration unless a stable worker identity is configured. Operators must inspect and retry every blocked task. A parked task in a state that cannot be retried (such as `READY_FOR_HUMAN_REVIEW` after manual intervention) needs cancellation or a later-phase recovery procedure. Adding `CANCELLED` to the `task_state` enum is forward-only.
