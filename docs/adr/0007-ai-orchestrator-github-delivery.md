# ADR 0007: GitHub delivery, merge observation, and Linear synchronization

## Status

Accepted and implemented in AI orchestrator Phase 6.

## Context

Phase 5 leaves a reviewed, gated, committed local branch per repository. Phase 6 must deliver those branches to human review without bypassing repository policy.

The plan requires:

- one pull request per repository work unit;
- idempotent pushes, pull requests, and Linear updates;
- required checks and approvals derived from current repository policy;
- merge observation instead of merging;
- completion only when every work unit is merged into remote `main`;
- a manual-intervention path for force-pushes, closed pull requests, base-branch drift, and conflicting edits.

Delivery is the first phase whose side effects leave the host and are visible to other people. They also depend on services that are slow, rate limited, and sometimes unavailable. A worker can crash, or lose a response, after GitHub or Linear has already applied a write. A pull request can wait days for review, and people can change it while it waits: update the branch, push fixes, close it, or force-push.

## Decision

**Stages.** Delivery uses the existing delivery states behind `orchestrator.execution.deliver`, which requires `runAgents`, a `delivery` section, and `GITHUB_TOKEN`.

- A review approval moves the task to `PR_CREATED` instead of parking it.
- The `PR_CREATED` handler pushes and creates or recovers pull requests, then moves to `WAITING_CI`.
- One observation handler serves `WAITING_CI` and `READY_FOR_HUMAN_REVIEW`.

Two transitions are added: `READY_FOR_HUMAN_REVIEW -> WAITING_CI`, for a pull request head that moved and must pass checks again, and `READY_FOR_HUMAN_REVIEW -> BLOCKED`.

**Waiting without a lease.** A new stage outcome, `wait`, keeps the state, releases the lease, and sets `resume_after`. It records no transition because the state does not change. A parked state is claimable only after its `resume_after`. Delivery states form a separate claim lane, limited by `orchestrator.maxConcurrentDeliveryTasks` and claimed before execution work. Leases in each lane count only toward that lane's limit, so pull requests awaiting review never take an execution slot, and new work never starves observation.

**Verification before a push.** `PR_CREATED` requires:

- the review-approval and quality-pass checkpoints for the current commits;
- a worktree that still proves orchestrator ownership, and a registered remote URL;
- base-to-head commits that are all single-parent commits by `agents.commitAuthor`, each carrying this task's `Orchestrator-Task` trailer;
- a cumulative diff that passes the diff policy's content rules: forbidden and generated paths, binaries, symbolic links, submodules, and secrets.

The push sends the exact reviewed commit to the task branch without force and with hooks disabled. It uses the service user's Git credentials, the same ones Phase 4 fetches with.

**One pull request per work unit.** Pull requests are found by head branch in the registered repository. The stage adopts:

- the single open pull request whose base is the configured base branch and whose head still contains the reviewed commit; or
- a single merged pull request.

A closed unmerged, duplicated, retargeted, replaced, or rewritten pull request blocks for an operator. A creation whose response was lost is reconciled on the next run: GitHub refuses a second open pull request for the same head and base, and that refusal waits for reconciliation instead of blocking.

**Idempotency.** Each side effect first records an intent row in `external_operations`. Its key combines the task with the repository and commit, the pull request, or the event and a digest of its identity. Before acting, the stage reconciles with the external system:

- a push reads the remote branch;
- a pull request is looked up by head branch;
- a Linear comment carries its key in the body and is looked up when an earlier attempt left the intent `PENDING`;
- a Linear attachment is keyed by URL, which Linear treats as unique per issue.

The GitHub and Linear adapters retry reads only. A write is never retried inside an adapter because its outcome can be ambiguous.

**Required checks and approvals.** Each observation reads the base branch's classic protection and rulesets from GitHub. Nothing in an issue contributes. A required check counts only when its latest report is an explicit `success`:

- Missing, pending, skipped, neutral, cancelled, stale, timed-out, and action-required results never count.
- A requirement pinned to a GitHub App matches only that app's check runs.
- A base branch without required checks is a misconfigured merge gate and blocks the task.
- Checks still missing or pending `requiredChecksTimeoutMinutes` after a head was first observed block the task.

Approvals are observed and reported per reviewer, including the ruleset's required count when GitHub exposes it. GitHub enforces the count at merge.

**Merge observation and completion.** The orchestrator never merges. A task moves to `READY_FOR_HUMAN_REVIEW` when every open pull request has passed its required checks; merged ones count. It moves to `COMPLETED` only when every pull request is merged and GitHub reports its merge commit reachable from the remote base branch.

Each work unit records its own delivery state (`PR_CREATED`, `WAITING_CI`, `READY_FOR_HUMAN_REVIEW`, `COMPLETED`, or `BLOCKED`), outcome, pushed commit, pull request, merge commit, and latest observation, so partial delivery is visible while the parent task waits.

A head that moves forward from the reviewed commit is accepted and observed again, for example after "Update branch" or a reviewer's commit. The task blocks when:

- the head no longer contains the reviewed commit;
- the pull request is closed unmerged, retargeted, or conflicting;
- a required check fails;
- a merge commit stays unreachable past the timeout.

**Failures.** Transient GitHub, Git remote, and Linear failures and rate limits wait in the current state, using the provider's reset time when one is given. Authentication failures, rejections, malformed responses, and ownership problems block for manual intervention. An operator retry re-runs every stage from `QUEUED`. It reuses checkpoints and recorded side effects without calling an agent.

**Linear.** Pull requests are attached to the issue. When `linearComments` is enabled, one comment is posted per milestone: pull requests opened, required checks passed, delivery blocked, and every pull request merged. Milestone comments are retried until they succeed. A blocked notification is best effort and never delays blocking. The orchestrator never changes an issue's status.

## Alternatives considered

- **Merge automatically when checks and approvals pass.** Rejected for the first usable release. The plan reserves automatic merge for a separately approved capability.
- **Push with `GITHUB_TOKEN` through an HTTP header.** Rejected: the token would have to reach Git's environment or arguments. Pushes keep using the host credentials that already fetch, and the token stays in the API adapter.
- **Poll inside a long-running stage.** Rejected: it would hold a lease and an execution slot for days, and a crash would block the task through lease recovery.
- **One claim limit for all states.** Rejected: pull requests awaiting review would starve new work, and ordering them last would delay observation behind hours of agent work.
- **Trust GitHub's `mergeable_state` or combined status as the gate.** Rejected: neither names missing required checks, and neither distinguishes a skipped or app-spoofed check from a success.
- **Block on any change to the pull request head.** Rejected: updating a branch from the base is routine under up-to-date branch protection, and it still contains the reviewed commit.
- **Mark Linear issues Done on merge.** Rejected by the plan: acceptance still needs a human decision.

## Consequences

The service meets the plan's first-usable-release workflow, from a validated issue to observed merge. Operators see per-repository delivery state in `GET /operator/tasks/:id`.

Disabling `deliver` leaves tasks already in delivery states unclaimed until it is enabled again.

A task blocked during delivery is recovered on GitHub first, for example by rerunning a check or reopening a pull request, and then retried. A pull request closed on purpose means the task should be cancelled.

The ADR 0006 isolation risk becomes more serious with delivery. Quality commands run agent-written code as the service user. On Linux, such code can read the orchestrator's initial environment through `/proc/<pid>/environ`, including `GITHUB_TOKEN`, and can use the user's Git credentials.

Until quality commands and agents run under a separate user or container without those credentials, `deliver` must stay disabled in production, or that exposure must be explicitly accepted. The token should be fine-grained and limited to the registered repositories, and `main` must require review and required checks.
