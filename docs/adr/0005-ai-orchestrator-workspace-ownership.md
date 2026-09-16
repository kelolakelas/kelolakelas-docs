# ADR 0005: Workspace ownership, locking, and recovery

## Status

Accepted for implementation in AI orchestrator Phase 4.

## Context

Phase 4 prepares Git worktrees in the local clones of KelolaKelas repositories. Those clones are shared with people, and they can contain branches, worktrees, and uncommitted changes that the orchestrator did not create. A worker can crash between a Git side effect and the database write that records it. Several tasks can touch the same repository at the same time. The plan requires deterministic workspaces from current remote `main`, confinement to declared repositories, reuse or manual recovery after restart, and cleanup that never destroys user work.

## Decision

**Identity.** A work unit's workspace is `<workspace.root>/<taskId>/<repository>` on the Linear `branchName` from the hydrated contract. Its base is the fetched remote base-branch commit at creation. The path, branch, and base commit are persisted on the work unit while the task lease is held. Unique indexes on `(repository, branch)` and `workspace_path` prevent two work units from recording the same branch or path.

**Ownership proof in Git.** Before creating a worktree, the worker writes `branch.<name>.orchestratortask`, `orchestratorbase`, and `orchestratorworktree` in the clone's local config. It then creates the worktree with `git worktree add --lock --reason "kelolakelas-ai-orchestrator task=<id> repository=<name>"`. The markers are written first so that a crash leaves recoverable state rather than an unmarked branch. Anything without matching markers, including a branch or path that already exists, is treated as user-owned or ambiguous and is never modified.

**Reuse and recovery.** A worktree at the expected path with the expected branch, lock reason, and markers is reused without fetching when its HEAD still descends from the recorded base. This covers both a normal restart and a crash before the database write. Every other mismatch blocks the task for manual intervention:

- a persisted identity whose worktree is missing;
- a differing base or branch;
- rewritten history;
- a foreign task's marker;
- a remote branch that already exists;
- an unexpected remote URL.

An unreachable remote is treated as transient and pauses the task with `REMOTE_UNAVAILABLE`.

**Locking.** Git mutations for one repository run under a PostgreSQL session advisory lock held on a dedicated connection, so tasks and processes serialize fetches, ref updates, and worktree changes. A lost connection releases the lock.

**Dependencies.** Preparation re-checks that every blocker task is `COMPLETED`. The planning contract cannot express a stacked PR, so an unmerged dependency always blocks.

**Cleanup.** Workspaces of `COMPLETED` and `CANCELLED` tasks are released by a scheduler maintenance hook only when the worktree is at the orchestrator path, locked for that task, marked for that task, and has no uncommitted or untracked files. Removal never uses `--force`. Branches are kept so no commit is lost. Blocked releases record a reason and are retried.

**Execution boundary.** Git runs as a fixed executable with argument arrays, `core.hooksPath=/dev/null`, a timeout, bounded output, and an environment allowlist without provider credentials. The remote check reads the configured `remote.<name>.url`; `url.<base>.insteadOf` rewrites are host configuration and trusted.

## Alternatives considered

- Deriving branch names from task IDs would avoid collisions but lose Linear's issue-to-branch linkage used by later delivery phases.
- Recording ownership only in PostgreSQL cannot distinguish an orchestrator-created branch from a user branch after a crash before the database write.
- File locks in each clone do not coordinate reliably across hosts or survive stale lock files; the shared database already provides advisory locks.
- Forced worktree removal or branch deletion on cancellation would be simpler but can destroy user or agent work.
- Re-fetching and resetting a reused worktree to current `main` would silently discard or rebase in-progress work.

## Consequences

Operators resolve blocked preparations in the local clone and retry the task. Cancelled and completed tasks leave branches behind until a later delivery phase or an operator removes them. A dirty worktree of a terminal task stays on disk until someone cleans it. Enabling preparation without an analyzer parks every prepared task in `BLOCKED`, so `prepareWorkspaces` stays disabled by default.
