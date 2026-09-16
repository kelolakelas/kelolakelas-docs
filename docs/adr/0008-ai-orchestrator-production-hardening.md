# ADR 0008: AI orchestrator production hardening and controlled scale

## Status

Accepted and implemented in AI orchestrator Phase 7. Supersedes two parts of [ADR 0007](0007-ai-orchestrator-github-delivery.md): pushes may now authenticate with `GITHUB_TOKEN`, and the delivery lane is no longer claimed before the execution lane.

## Context

After Phase 6 the orchestrator delivers reviewed branches to human review. ADR 0007 left production delivery gated on one risk. Agents and quality commands run agent-written code as the service user. Such code can read the orchestrator's environment through `/proc/<pid>/environ`, including `GITHUB_TOKEN`, `LINEAR_API_KEY`, and `DATABASE_URL`. It can also read credential files the service user can read, such as Git credential stores, GitHub CLI configuration, and SSH keys.

Phase 7 must also let operators detect, pause, and recover stuck workflows. It must prove backup restoration and stale-task recovery, verify credential scopes and rotation, and establish safe concurrency and polling limits, without enabling automatic merge or deployment.

Constraints observed on the deployment platform:

- The service runs under systemd as one dedicated user per host, and root access is available only at installation time.
- Codex CLI 0.154.0 already runs model-issued commands in its own bubblewrap sandbox with a private PID namespace. Starting bubblewrap inside another bubblewrap fails with `No permissions to create a new namespace`, and Codex's Landlock fallback rejects `workspace-write` (`permission profiles requiring direct runtime enforcement are incompatible with --use-legacy-landlock`).
- Several systemd protections (`ProtectKernelTunables`, `ProtectKernelLogs`, `ProtectHostname`) cover `/proc` in ways that make the kernel refuse a fresh `/proc` mount inside a user namespace. This was verified with transient units on systemd 259.

## Decision

### Credential isolation

Three controls are combined. Delivery refuses to start until a startup audit finds none missing.

1. **Command sandbox.** With `sandbox.kind: bubblewrap`, every repository setup and check command runs in new user, PID, IPC, UTS, cgroup, and network namespaces with a fresh `/proc`:
   - Orchestrator processes, their environments, and their memory are unreachable.
   - The command sees only `sandbox.readOnlyPaths` (default `/usr`, `/etc`, `/opt`, `/run/systemd/resolve`), the clone's `.git` directory read-only, the worktree read-write, `sandbox.writablePaths`, a private `/tmp`, and an empty `HOME`.
   - `sandbox.maskedPaths` (default `/etc/ai-orchestrator`) are replaced by empty directories.
   - Checks run in an empty network namespace unless a command sets `network: true`; setup commands get network access by default because dependency installs need it.
   - The command is killed with its whole namespace on timeout, cancellation, or orchestrator exit.
   - Configuration that would mount `/`, a whole home directory, `/proc`, or systemd credentials is rejected. A startup probe fails fast when the host blocks unprivileged user namespaces.
2. **Token-only Git.** With `workspace.gitAuthentication: github-token`, fetches and pushes authenticate with `GITHUB_TOKEN` through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_n`/`GIT_CONFIG_VALUE_n` environment variables, never arguments, files, or remote URLs. Host credential helpers are cleared, `protocol.ssh.allow` is `never`, and `SSH_AUTH_SOCK` is dropped. The service user therefore needs no Git credentials.
3. **Startup credential-exposure audit.** It reports:
   - a disabled sandbox;
   - host Git authentication;
   - any readable path in `security.credentialFiles` (for a directory, any readable private file directly inside it);
   - a `DATABASE_URL` without a password, because peer or trust authentication lets any process of the service user connect;
   - configuration writable by group or others.

   With `deliver` enabled, any finding stops startup unless `security.acceptCredentialExposure` is set, which is intended only for a non-production sandbox.

The Codex runner is not wrapped by the command sandbox, because bubblewrap cannot nest. Codex already confines model-issued commands in a PID namespace without network access. The hardened unit keeps the environment file root-owned with mode `0600`, so systemd reads it before dropping privileges and no process of the service user can read it.

### Operator control

- **Kill switch.** It is stored in `orchestrator_controls.kill_switch`, set through the audited `POST /operator/kill-switch`, or forced per worker by `ORCHESTRATOR_KILL_SWITCH=true`. When engaged:
  - workers abort in-flight stages with the new abort reason `kill-switch` at the next heartbeat, or immediately on the worker that served the request;
  - tasks are parked at the stage boundary by releasing their leases, without a transition, so state and checkpoints are unchanged;
  - no claims and no maintenance run;
  - read-only intake continues.

  Releasing the switch lets every parked task resume from its checkpoints. The environment override exists for situations where the database cannot be trusted, such as immediately after a restore.
- **Canary rollout.** `orchestrator.rollout.repositories` allows new tasks only when every repository is listed. `orchestrator.rollout.maxNewTasksPerDay` counts `QUEUED -> ANALYZING` transitions in the preceding 24 hours across all workers. Both apply only to starting a `QUEUED` task, so narrowing a rollout never strands work already started.

### Controlled scale

- **Per-repository concurrency.** `repositories.<name>.maxConcurrentTasks` counts leased execution-lane tasks that touch the repository, inside the existing claim transaction and advisory lock. A task is claimable only when all of its repositories are below their limits.
- **Bounded lane refill.** A lane previously kept claiming while its claimed stages finished. When stages finish in less time than a claim takes, as delivery observations of many waiting pull requests do, that loop never ended: the tick never completed, execution slots were never refilled, and intake stopped polling. The load test reproduced this with 500 waiting pull requests. Each lane now claims for at most one polling interval per tick, execution first, so a tick is bounded by about twice the polling interval.
- **Circuit breakers and backpressure.** GitHub and Linear calls pass through per-process consecutive-failure circuit breakers (`providers.circuitBreaker`: 5 failures, 300 seconds by default, one half-open probe).
  - GitHub transient failures and rate limits count; authentication, rejection, and not-found errors do not. A rate limit with a reset time opens the circuit until that time.
  - An open circuit surfaces as a retryable wait, never as a task failure.
  - An open GitHub circuit holds delivery-lane claims until it reopens.
  - A runner usage or rate limit holds execution-lane claims until its `resume_after`, because every other task would hit the same account limit.

### Observability

`GET /metrics` serves Prometheus text format without authentication on the loopback listener. Labels carry states, stages, lanes, providers, failure categories, and model identifiers, never task, issue, pull request, or credential identifiers.

- **Scheduler events:** ticks, intake polls, stage runs and durations, time spent in a state before leaving it (CI wait is `WAITING_CI`), lease recoveries, parking reasons, provider calls, and circuit state.
- **PostgreSQL aggregates at scrape time:** tasks and oldest age per state, stale leases, manual intervention, quarantines, open pull requests, attempts by stage and failure category, and model tokens by model. Token counts are durable, so they survive restarts.
- **Estimated spend:** from `metrics.modelPricing`, pricing cached input tokens at the cached rate and not charging reasoning tokens twice.

Alert rules and a Grafana dashboard ship with the service and are tested against the exported metric names. Every alert links to a section of the [operations runbook](../runbooks/ai-orchestrator-operations.md).

### Retention, backup, and restore

- **Retention** runs as scheduler maintenance at most every `retention.intervalMinutes`. It removes:
  - attempt evidence and checkpoint payloads of `COMPLETED` and `CANCELLED` tasks older than `terminalTaskArtifactDays` (90);
  - quarantines unseen for `quarantineDays` (30);
  - runner scratch directories older than `runnerScratchHours` (24; configuration requires it to exceed the longest runner timeout).

  `BLOCKED` and `FAILED` tasks can be retried and keep everything. Tasks, transitions, attempt inputs, results and usage, external operations, and operator actions form the audit record and are not removed.
- **Backups** are PostgreSQL custom-format dumps with a SHA-256 checksum and a manifest of server version, migration count, and row counts. They are written by a oneshot unit on a 6-hour timer with its own environment file that holds only `DATABASE_URL`.
- **Restores** go only into an empty database. The dump is rendered to SQL and applied in one transaction with `ON_ERROR_STOP`, then row counts and migrations are compared with the manifest. Tools receive credentials only through libpq environment variables.
- **Worktrees and local branches are not backed up.** Reviewed work is recoverable from pushed branches and pull requests; unpushed local work is re-created by an operator retry after recovery blocks the task.

### Automatic merge

Evaluated and not enabled. The orchestrator has no merge code path, and no configuration can add one. Automatic merge requires a separate, approved capability and its own ADR. The following evidence thresholds are **Proposed** and need product and engineering approval before they are used:

- at least 50 orchestrator pull requests merged by humans without post-merge reverts or incidents attributable to the change;
- a completed sandbox delivery run and quarterly recovery exercises without unresolved findings;
- per-repository opt-in limited to low-risk contracts;
- required human approval retained in branch protection.

## Alternatives considered

- **Separate Unix user through `sudo`.** Rejected: it requires dropping `NoNewPrivileges`, shared-group worktree permissions, and signal relaying through `sudo`, and `SIGKILL` of `sudo` orphans the command's descendants. It could not be tested without root.
- **Transient systemd units per command under a runner user.** Stronger resource accounting, but it needs a polkit rule to let the service start units, root to install it, and verification that only CI could provide. Deferred; the unit-level cgroup limits bound all children today.
- **Containers.** Rejected for this release: membership of the `docker` group is equivalent to root, and rootless Podman is not installed on the target host.
- **Wrapping Codex in the command sandbox as well.** Not possible: bubblewrap cannot nest, and Codex's Landlock fallback does not support `workspace-write`. Running Codex with `danger-full-access` inside our sandbox would give model-issued commands network access.
- **Systemd `LoadCredential=` files instead of an environment file.** Rejected: the credentials directory is readable by the service user and therefore by its processes. A root-owned environment file never is.
- **Pause-new-work as the kill switch.** Rejected: pause lets in-flight stages run to their next boundary, which can be hours of agent work and delivery side effects.
- **A global, database-backed circuit breaker.** Deferred: per-process breakers bound each worker's own traffic, which is sufficient for one worker per host.
- **A fixed claim count per tick instead of a time budget.** Rejected: it would throttle delivery observations to the slot count per polling interval regardless of how quickly they finish.

## Consequences

- Production delivery can be enabled once the host allows unprivileged user namespaces and the audit reports no findings. Hosts must follow the host setup in the [operations runbook](../runbooks/ai-orchestrator-operations.md#host-setup).
- Tools used by quality commands must be under `sandbox.readOnlyPaths`, caches under `sandbox.writablePaths`, and checks that need a network must opt in.
- Remaining exposure:
  - model-issued commands can read the runner's own model credential under `CODEX_HOME`;
  - sandboxed commands can read anything inside mounted paths;
  - setup commands with network access can reach local services, so PostgreSQL must require passwords;
  - the hardened unit's `systemd-analyze security` exposure is 5.0 because the sandbox needs namespaces and an unmasked `/proc`.
- The execution lane is now claimed before the delivery lane, and each lane has a per-tick time budget.
- Circuit breakers and lane holds are per process and reset on restart.
- A live delivery run against real GitHub and Linear sandbox repositories is prepared but not yet performed; it remains a Phase 7 exit item.
