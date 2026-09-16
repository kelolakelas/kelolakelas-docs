# ADR 0006: Agent execution trust boundaries and bounded cycles

## Status

Accepted for implementation in AI orchestrator Phase 5.

## Context

Phase 5 lets model-driven agents analyze, change, and review code in the worktrees that Phase 4 prepares. It is the first phase in which untrusted model output changes repository content and in which repository commands run on changed code.

The plan requires:

- versioned results that cannot select tools, commands, or models;
- confinement to the declared worktrees and a trusted command allowlist;
- quality gates from repository configuration;
- inspection of every diff before commit;
- bounded fix cycles that end in a deterministic state;
- persisted evidence without secrets.

Push and pull-request creation stay disabled until the supervised-worker milestone is stable.

Agent runs are long and costly. They can hit provider usage and rate limits, be cancelled by an operator or a shutdown, or be interrupted by lease loss. A retried task must not pay for, or be misled by, work that already succeeded.

## Decision

**Stages and outcomes.** Execution uses the existing state machine and stage-handler port, behind `orchestrator.execution.runAgents`:

- `ANALYZING` runs workspace preparation and then a read-only analyzer.
- `READY` runs trusted setup commands.
- `IMPLEMENTING` runs a write-enabled implementer.
- `TESTING` runs trusted quality gates.
- `FIXING` runs a write-enabled fixer.
- `REVIEWING` runs a read-only reviewer.

A review approval moves the task to `BLOCKED` with the reason `Reviewed local branch ready; delivery is not enabled` and without the manual-intervention flag, the same parking pattern Phase 4 used before an analyzer existed. One new transition, `IMPLEMENTING -> READY`, retries a rejected implementation through the schedule gate.

**Structured results.** Each role returns a strict JSON result versioned as `kelolakelas.agent.analysis/v1`, `implementation/v1`, `fix/v1`, or `review/v1`. Unknown keys are rejected, so a result cannot carry a command, tool, model, or credential. The runner receives a JSON schema generated from the same validator. The orchestrator then checks semantics that the schema cannot express:

- A plan covers exactly the contract repositories.
- Paths are safe and relative.
- Review findings name declared repositories.
- An approval with a blocker or major finding counts as a change request.

Malformed output never advances a stage.

**Runner boundary.** The first runner adapter is the Codex CLI, behind an `AgentRunner` port. Each run:

- Starts in a task directory that contains only the declared worktrees.
- Ignores user configuration, execution-policy rules, and session persistence.
- Uses the `read-only` sandbox for the analyzer and reviewer. The implementer and fixer use `workspace-write` with network access disabled, the shared `/tmp` excluded, and a private per-run `TMPDIR`.
- Receives an allowlisted environment. Agent shell commands inherit only core variables.
- Has a timeout, cancellation through the stage abort signal, event and result size limits, and process-group termination.

A local verification with Codex CLI 0.154.0 found that `workspace-write` otherwise leaves `/tmp` writable. That finding is why `/tmp` is excluded explicitly.

Models are selected only by deterministic routing: the escalation route for contract complexity and attempt, or the configured analyzer and reviewer tiers. Model identifiers are always read from configuration.

**Trusted commands.** Setup and check commands come only from `repositories.<name>.quality` in operator configuration. They are addressed by repository and run as argument arrays without a shell, with a timeout, bounded output, and process-group termination. They receive no credentials: configuration rejects orchestrator, GitHub, and model credentials in their environment list. Their output is redacted before it is persisted or given to a fixer.

**Verification before commit.** The orchestrator commits agent work locally, never the agent, and only after it re-verifies the worktree and applies a diff policy.

Worktree verification covers the Git common directory, the checked-out branch, the ownership markers and lock reason, ancestry from the base, and a HEAD the agent did not move. An agent can write the worktree's `.git` pointer file, so it is never trusted.

The diff policy rejects:

- unchanged diffs;
- diffs over the file, line, or unplanned-file limits;
- protected configuration, including CI workflows, CODEOWNERS, agent instruction files, and environment files;
- generated output, binaries, symbolic links, and submodules;
- added lines that match credential patterns or the literal value of an orchestrator credential.

A rejected attempt is discarded in full. Commits carry task and stage trailers. Nothing is pushed.

**Bounded cycles.** Implementation attempts, quality fixes, and review cycles are counted on the task. Each count is incremented in the transaction that makes the consuming state change.

- A rejected implementation retries with the next escalation route until `maxImplementationAttempts`, then the task fails.
- A failed gate requests a fix until `maxQualityFixAttempts`, then the task fails.
- A change request starts a fix until `maxReviewCycles`, then the task fails.
- Every fix returns to the gates, whether or not it was applied, so no cycle can loop without consuming an attempt.

Usage and rate limits pause the task with `PAUSED_LIMIT` and do not consume attempts; neither does cancellation. An operator retry of a `FAILED` task resets the counters for one new bounded cycle.

Outcomes that need a human stop for manual intervention:

- a clarification request;
- an agent that reports it is blocked;
- a review rejection;
- a quality command that cannot start;
- a failed integrity check.

**Checkpoints and evidence.** Accepted plans, completed setup, committed implementations, passing gates, applied fixes, and approvals are checkpointed against the exact commits they cover. Resumed and retried stages reuse them instead of calling an agent again.

Each stage run is a `task_attempts` row containing:

- normalized input: prompt SHA-256, size, template version, model selection, and commits (not the prompt);
- the validated result;
- redacted evidence;
- token usage;
- a failure category.

## Alternatives considered

- **Let agents commit, or push directly.** Rejected: the orchestrator could not prove which content was inspected. Verification and commit must happen in the process that holds the lease and the repository lock.
- **Use commands proposed by the analyzer or read from repository files.** Rejected: that makes model output or changed repository content the source of what runs.
- **Free-form model output parsed heuristically.** Rejected: malformed or adversarial output could be misread as an instruction.
- **Retry implementation inside one stage run.** Rejected: that would skip schedule gates and operator controls between long attempts. Routing a retry through `READY` keeps every attempt at a stage boundary.
- **Stop for an operator after any failed fix.** Rejected: fix failures are expected and bounded. Counting every return to the gates keeps cycles finite without manual toil.
- **Run quality commands inside the Codex sandbox.** Deferred: the CLI's standalone sandbox command is not a stable interface, and typical dependency installs need network access.

## Consequences

The service can act as a supervised coding worker that leaves a reviewed, committed local branch per repository. Enabling it requires quality checks for every registered repository and every routed model tier.

Residual risks remain and block the write-enabled Phase 6 milestone until stronger isolation is evaluated:

- Quality commands execute agent-written code outside the Codex sandbox, with the service user's permissions minus credentials.
- The read-only sandbox limits writes but not reads.

The service must run as a dedicated user that cannot read secrets or other users' files. Its environment file must be readable only by the service manager.

Retrying a parked, reviewed task re-verifies its worktrees and gates without calling an agent. A task whose agent changed Git state is blocked for an operator, who inspects the worktree; the orchestrator does not repair it.
