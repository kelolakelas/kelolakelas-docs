# AI orchestrator operations runbook

Status: **Implemented** procedures for the Phase 7 orchestrator\
Last reviewed: 2026-09-17\
Source: `kelolakelas-ai-orchestrator` (branch `feat/phase-7-production-hardening`), [ADR 0008](../adr/0008-ai-orchestrator-production-hardening.md)

This runbook is for operators of the orchestrator service. Every Prometheus alert in `ops/prometheus/alerts.yml` links to a section below. Commands assume the hardened systemd unit, the configuration at `/etc/ai-orchestrator/orchestrator.yaml`, and the HTTP listener on `127.0.0.1:8089`.

```sh
# Shell helpers used below. Load the operator token without printing it.
export OP="http://127.0.0.1:8089"
export ORCHESTRATOR_OPERATOR_TOKEN="$(sudo grep -oP '^ORCHESTRATOR_OPERATOR_TOKEN=\K.*' /etc/ai-orchestrator/orchestrator.env)"
op() { curl -fsS -H "authorization: Bearer $ORCHESTRATOR_OPERATOR_TOKEN" "$@"; }
act() { op -X POST "$OP/operator/$1" -d "{\"actor\":\"$USER\",\"reason\":\"$2\"${3:+,$3}}"; }
```

## Contents

- [Host setup](#host-setup)
- [First response](#first-response)
- [Alerts](#alerts)
- [Kill switch operations](#kill-switch-operations)
- [Backup and restore](#backup-and-restore)
- [Model providers and routing](#model-providers-and-routing)
- [Credential rotation](#credential-rotation)
- [Canary rollout](#canary-rollout)
- [Sandbox delivery run](#sandbox-delivery-run)
- [Recovery exercises](#recovery-exercises)
- [Capacity and polling limits](#capacity-and-polling-limits)

## Host setup

Run once per host, and again after an operating system upgrade.

1. Create the service user with a home that holds no credentials:
   `sudo useradd --system --home-dir /var/lib/ai-orchestrator/home --create-home --shell /usr/sbin/nologin ai-orchestrator`.
2. Allow unprivileged user namespaces for bubblewrap. On Ubuntu 24.04 set `kernel.apparmor_restrict_unprivileged_userns=0` in `/etc/sysctl.d/60-ai-orchestrator.conf`, or install an AppArmor profile that grants `userns` to `/usr/bin/bwrap`. Then verify as the service user:
   `sudo -u ai-orchestrator bwrap --unshare-user --unshare-pid --ro-bind / / --proc /proc -- /bin/true && echo ok`.
3. Install the configuration and secrets:
   - `/etc/ai-orchestrator/orchestrator.yaml`: `root:ai-orchestrator`, mode `0640`, directory not group- or world-writable.
   - `/etc/ai-orchestrator/orchestrator.env`: `root:root`, mode `0600`, containing `DATABASE_URL` (with a password), `LINEAR_API_KEY`, `GITHUB_TOKEN`, and `ORCHESTRATOR_OPERATOR_TOKEN`.
   - `/etc/ai-orchestrator/backup.env`: `root:root`, mode `0600`, containing only a `DATABASE_URL` for a role that can read the orchestrator database.
4. Require password authentication for the orchestrator role in `pg_hba.conf` (`scram-sha-256`), including local socket connections. The startup audit cannot read `pg_hba.conf`.
5. Clone the repositories under `/srv/kelolakelas` with HTTPS remotes, owned by `ai-orchestrator`.
6. Set, for production delivery: `sandbox.kind: bubblewrap`, `workspace.gitAuthentication: github-token`, and `sandbox.readOnlyPaths` covering every toolchain the quality commands use (for example `/opt/node`, `/usr/local/go`).
7. Install `/opt/ai-orchestrator`, run `npm ci && npm run build`, apply migrations with `DATABASE_URL=... node dist/src/db/migrate.js`, copy the units from `systemd/`, and enable them:
   `sudo systemctl enable --now ai-orchestrator ai-orchestrator-backup.timer`.
8. Confirm `journalctl -u ai-orchestrator` shows `orchestrator_started` and no `credential_exposure_finding`, and that `curl -s $OP/readyz` reports ready.

The unit's systemd protections were verified to keep the sandbox working. Do not add `ProtectKernelTunables`, `ProtectKernelLogs`, or `ProtectHostname`: the sandbox's `/proc` mount then fails and the service refuses to start with `Command sandbox bubblewrap failed its startup check`.

## First response

1. **Stop harm first.** If agents or delivery might be doing damage, [engage the kill switch](#kill-switch-procedure). It stops everything within one heartbeat and loses no state.
2. **Look.**
   - `curl -s $OP/readyz`: which dependency is failing.
   - `curl -s $OP/status`: controls, kill-switch source, lane holds, in-flight tasks, and counts by state.
   - `op $OP/operator/tasks | jq '.tasks[] | select(.requiresManualIntervention or .state=="FAILED")'`: tasks needing a person.
   - `op $OP/operator/tasks/<id>`: work units, attempts with failure categories and redacted evidence, and the audit trail.
   - `journalctl -u ai-orchestrator --since -1h`: logs carry `taskId`, `linearIdentifier`, `stage`, and `event`.
3. **Fix the cause** using the matching alert section.
4. **Recover** with a retry, cancellation, or kill-switch release, and record the incident with the task identifiers and `operator_actions` rows.

## Alerts

### Orchestrator down

`OrchestratorDown`: Prometheus cannot scrape `/metrics`.

1. `systemctl status ai-orchestrator` and `journalctl -u ai-orchestrator -n 200`.
2. Startup failures name their cause:
   - `credential exposure audit reported N finding(s)`: fix each `credential_exposure_finding` (see [Host setup](#host-setup)). Do not set `security.acceptCredentialExposure` in production.
   - `Command sandbox bubblewrap failed its startup check`: repeat host setup step 2 as the service user.
   - Zod configuration errors: correct the named path.
   - `GITHUB_TOKEN is required`: restore the environment file.
3. A crash loop leaves leases behind; the restarted worker recovers them for manual intervention (see [Manual intervention](#manual-intervention)).

### Tick stalled

`OrchestratorTickStalled`: no scheduler tick completed for 10 minutes. `/healthz` returns 503 once a tick runs past its stuck threshold.

1. Check whether PostgreSQL is slow: `select pid, now()-query_start, wait_event, left(query,120) from pg_stat_activity where datname = 'ai_orchestrator' and state <> 'idle' order by 2 desc;`. A tick holds `pg_advisory_xact_lock` only briefly per claim.
2. Check whether Linear intake hangs: the log shows `linear_intake_failed` or no `scheduler_tick_completed`.
3. A tick is bounded by about two polling intervals of claiming. Longer means a dependency is slow, not a busy queue.
4. If it stays stuck, restart: `sudo systemctl restart ai-orchestrator`. In-flight stages park or their leases are recovered.

### Database unavailable

`OrchestratorDatabaseMetricsFailing`: the metrics collector cannot query PostgreSQL. `/readyz` reports `database: unavailable`.

1. Check the server (`pg_isready`), connection limits, and disk space.
2. Workers cannot claim, heartbeat, or transition without the database. Leases expire, and recovery blocks those tasks for manual intervention once the database returns. No side effect is retried blindly.
3. If data loss or corruption is suspected, go to [Backup and restore](#backup-and-restore) before restarting workers.

### Provider outage

`OrchestratorLinearIntakeFailing` or `OrchestratorProviderCircuitOpen`.

1. Check the provider's status page and `orchestrator_provider_calls_total` by result.
   - `rejected` rising means the circuit is open.
   - `error` rising with `failure` flat means requests are rejected (authentication or validation), not an outage. Go to [Credential rotation](#credential-rotation).
2. While the GitHub circuit is open, delivery claims are held (`/status` → `laneHolds.delivery`), and delivery stages wait in their state with `resume_after` set to the reopen time. Nothing blocks, and nothing needs retrying.
3. While Linear is down, intake is skipped and readiness fails. Delivery waits for Linear comments and attachments.
4. After recovery the circuit half-opens after `providers.circuitBreaker.openSeconds` and closes on the first success. No operator action is needed.
5. For a long GitHub outage, [pause new work](#queue-not-draining) so reviewed branches do not accumulate.

### Kill switch

`OrchestratorKillSwitchEngaged` is informational: the switch is engaged. See the [Kill switch](#kill-switch-procedure) procedure.

### Stuck workflow

`OrchestratorStaleLeases`, `OrchestratorExecutionStateStuck`, or `OrchestratorInFlightStageLong`.

1. Find the task: `op $OP/operator/tasks | jq '.tasks | sort_by(.updatedAt) | .[:10]'`. Check `leaseOwner`, `leaseExpiresAt`, and `lastHeartbeatAt`.
2. **Stale lease** (expired, still owned): the owning worker died. The next tick of any worker recovers it to `BLOCKED` with `requiresManualIntervention`. If the alert persists, no worker is ticking (see [Tick stalled](#tick-stalled)).
3. **Long in-flight stage** (heartbeats current): an agent or quality command is running. Runner timeouts in `agents.runner.timeoutMinutes` and command `timeoutSeconds` end it. To stop it now: `act tasks/<id>/manual-intervention "Stage running too long"`. The owner aborts the stage at its next heartbeat and blocks the task.
4. **Task in a working state without a lease for hours:** check `/status` for `pauseNewWork`, the kill switch, lane holds, the schedule override, `orchestrator.rollout`, and repository `maxConcurrentTasks`. A task whose stage has no handler (for example after disabling `deliver`) is never claimed.
5. Continue with [Manual intervention](#manual-intervention).

### Manual intervention

`OrchestratorManualInterventionRequired`, `OrchestratorStageFailures`, or `OrchestratorTasksFailed`.

1. `op $OP/operator/tasks/<id>`: read `lastError`, the latest attempts' `failureCategory` and `evidence`, the work units, and the audit trail.
2. Decide by cause:
   - **Recovered stale lease:** inspect the worktrees under `workspace.root/<taskId>/` and any pushed branch. Checkpoints decide what is reused, so a retry is safe once nothing external is half-done.
   - **`workspace-integrity`:** an agent changed Git state. Inspect before retrying; the orchestrator never repairs a worktree.
   - **Delivery block** (failed check, closed pull request, force-push): fix it on GitHub first.
   - **`quality-infrastructure`:** a tool is missing inside the sandbox. Extend `sandbox.readOnlyPaths` or `writablePaths`, or set `network: true` on the command, then restart the service.
   - **`FAILED`:** bounded attempts are exhausted. Improve the contract or configuration before retrying.
3. Retry or cancel:
   - Retry: `act tasks/<id>/retry "Fixed <cause>"`. A retry of a `FAILED` task resets its attempt counters.
   - Cancel: `act tasks/<id>/cancel "Not deliverable: <reason>"`.

### Queue not draining

`OrchestratorQueueAgeHigh`.

1. Check `/status` for `pauseNewWork`, `killSwitch`, `laneHolds.execution`, and the schedule override. Check the time against the operating-hours schedule.
2. Check `orchestrator.rollout.maxNewTasksPerDay`. `select count(*) from state_transitions where from_state='QUEUED' and to_state='ANALYZING' and created_at > now() - interval '24 hours';` shows the starts in the rolling window.
3. Check `orchestrator.rollout.repositories` and the unresolved blockers of the oldest queued task.
4. To stop new work while keeping delivery observations running: `act pause "Reason"`; resume with `act resume "Reason"`.

### CI wait

`OrchestratorCiWaitLong` or `OrchestratorHumanReviewBacklog`.

1. `op $OP/operator/tasks/<id> | jq '.workUnits[] | {repository, pullRequestUrl, deliveryObservation}'` shows the required checks that are missing or pending.
2. Checks still missing after `delivery.requiredChecksTimeoutMinutes` block the task automatically. A long wait below that means CI is slow or queued. Check the repository's Actions queue.
3. A review backlog is a people queue; notify the reviewers. The orchestrator never merges.

### Retries and limits

`OrchestratorRetryRateHigh`, `OrchestratorRunnerLimited`, or `OrchestratorModelSpendHigh`.

1. Rising unsuccessful attempts: group by category on the dashboard.
   - `invalid-output` or `needs-clarification`: contract quality.
   - `diff-rejected`: plans too broad for `agents.diffPolicy`.
   - `quality-failed`: repository health.
2. **Runner limited:** a usage or rate limit holds execution claims until the provider's reset (`/status` → `laneHolds.execution`). Paused tasks resume automatically. Raise the account limit or reduce `maxConcurrentTasks`.
3. **Spend:** `orchestrator_model_cost_usd_total` is an estimate from `metrics.modelPricing`. To cap spend:
   - lower `orchestrator.rollout.maxNewTasksPerDay`, or pause new work;
   - lower `limits` to reduce retries;
   - [engage the kill switch](#kill-switch-procedure) for a runaway.

## Kill switch operations

### Kill switch procedure

**Engage** when agents, quality commands, or delivery might cause harm, or before a restore or credential revocation:

```sh
act kill-switch "Incident <id>: <reason>" '"engaged":true'
curl -s $OP/status | jq '.scheduler | {controls, killSwitchSource, inFlight}'
```

- The worker that serves the request aborts its stages immediately. Other workers abort theirs at their next heartbeat (`orchestrator.heartbeatIntervalSeconds`).
- Stages stop at a safe point: agent and quality processes are killed with their namespaces. A Git push already in progress is not interrupted.
- Tasks keep their state and checkpoints and release their leases. No transition is recorded.
- Claims and maintenance (workspace release, retention) stop. Read-only Linear intake continues, and readiness stays green.
- `in_flight` reaching 0 confirms the stop.

**When the database is not trusted** (for example right after a restore): set `ORCHESTRATOR_KILL_SWITCH=true` in a systemd drop-in, restart, and confirm `killSwitchSource: environment`.

```sh
sudo systemctl edit ai-orchestrator   # [Service]\nEnvironment=ORCHESTRATOR_KILL_SWITCH=true
sudo systemctl restart ai-orchestrator
```

**Release** after the cause is fixed. Parked tasks resume from their checkpoints on the next tick.

```sh
act kill-switch "Incident <id> resolved" '"engaged":false'
```

Remove the drop-in and restart if the environment override was used. Every engage and release is an `operator_actions` row (`ENGAGE_KILL_SWITCH`, `RELEASE_KILL_SWITCH`) with actor and reason.

## Backup and restore

### Backups

- `ai-orchestrator-backup.timer` runs every 6 hours:

  ```sh
  node dist/src/ops/backup.js /var/backups/ai-orchestrator 14
  ```

  Each run writes `ai-orchestrator-<UTC>.dump` (custom format, mode `0600`) and `<dump>.json` with its SHA-256, size, server version, migration count, and row counts. It removes local dumps older than 14 days.
- Copy dumps and manifests off the host after every run, to storage encrypted at rest and readable only by operators. Keep 30 days of 6-hourly dumps and 12 monthly dumps, unless KelolaKelas retention policy says otherwise.
- Dumps contain issue contract snapshots, redacted evidence, and pull request metadata, but no credentials. Treat them as confidential.
- Check `systemctl list-timers ai-orchestrator-backup.timer` and the latest manifest weekly.
- **Not backed up:** worktrees, local unpushed branches, and runner scratch directories. Pushed branches and pull requests live on GitHub.

### Restore

Targets: recovery point objective 6 hours (backup interval), recovery time objective 1 hour.

1. [Engage the kill switch](#kill-switch-procedure) if any worker is still running, or stop the service: `sudo systemctl stop ai-orchestrator`.
2. Create a new, empty database (never restore over the live one): `createdb ai_orchestrator_restored`.
3. Restore and verify. The restore refuses a checksum mismatch or a non-empty target, applies everything in one transaction, and compares row counts and migrations with the manifest:

   ```sh
   RESTORE_DATABASE_URL='postgres://orchestrator:...@127.0.0.1/ai_orchestrator_restored' \
     node dist/src/ops/restore.js /var/backups/ai-orchestrator/ai-orchestrator-<UTC>.dump
   ```

4. Point `DATABASE_URL` in the environment file at the restored database, or rename databases during the outage window. Apply migrations if the build is newer than the dump: `node dist/src/db/migrate.js`.
5. Start with `ORCHESTRATOR_KILL_SWITCH=true` (see the [procedure](#kill-switch-procedure)) and inspect:
   - Tasks leased at backup time are recovered to `BLOCKED` with manual intervention on the first tick. Their stages are never replayed automatically.
   - Work done after the backup is missing from the database but may exist externally: pushed branches, pull requests, and Linear comments. Delivery reconciles pushes and pull requests by branch, and comments by key, on retry, so a retry converges instead of duplicating.
   - Worktrees newer than the restored identities make preparation block for manual intervention. Remove orchestrator-owned worktrees of affected tasks (`git worktree remove` without `--force` after checking for changes), then retry.
6. Retry or cancel each blocked task per [Manual intervention](#manual-intervention), remove the override, and restart.

### Disaster recovery

For host loss:

1. Provision a host per [Host setup](#host-setup).
2. Restore the latest off-host dump.
3. Clone repositories fresh.
4. Follow the restore steps above.

Tasks in delivery states re-observe GitHub. Tasks earlier in the workflow block, and retrying re-runs analysis because their worktrees are gone.

## Model providers and routing

Which provider, model, and effort serve a stage is configuration. `models.providers.<alias>` names an executable and an adapter `kind`; `models.tiers.<tier>` pairs a model identifier with the alias that serves it; `models.routes`, `models.escalation`, `models.roles`, `models.analyzer`, and `models.reviewer` override the built-in defaults. See [ADR 0011](../adr/0011-ai-orchestrator-provider-agnostic-model-transport.md).

1. **Change a model or effort:** edit `models.tiers.<tier>.model` and `models.roles.<role>.effort`, then restart. The canonical effort levels are `low`, `medium`, `high`, and `max`; each provider translates them to its own names, so `max` reaches the Codex CLI as `xhigh`. A role names a tier and an effort; a role reaches a provider through that tier, because `models.tiers.<tier>.provider` is where a provider is attached.
2. **Add a provider:** declare `models.providers.<alias>` with an `executable`, then make every reachable tier name it. With more than one provider configured, a tier that omits `provider` is a startup error rather than a guess. The executable must be present and executable or startup fails. If the client has no adapter, give it `kind: cli` and a `cli` block instead of writing code; see step 3.
3. **Register a model client without an adapter:** declare `kind: cli` with a `cli.args` argument template. The supported placeholders are `{model}`, `{effort}`, `{schema}`, `{schemaFile}`, `{resultFile}`, `{taskDirectory}`, and `{prompt}`; any other placeholder is a startup error, so a typo cannot reach the client as a literal argument. `cli.prompt` is `stdin` or `argument`; `cli.result.source` is `stdout` or `file`; `cli.result.path` is a dotted path into whatever the client printed. `cli.usage` names the same kind of path for token counts. Nothing is inferred from the client, so declare the result path it actually uses: if the path is wrong, the run fails with `has no value at declared path` instead of producing an empty result. Verify a new client against its own `--help` output and one real invocation before adding it; never assume its flags, its envelope shape, or the schema dialect it accepts. Claude Code, for example, accepts the generated schema as-is, rejects an explicit draft 2020-12 URI by name, and only honours `--json-schema` in print mode.
4. **Make a client's failures visible:** a client's exit code is a claim, not a fact, and some clients exit 0 even when their own API call fails — Claude Code does. Declare `cli.failure` with the `path`, the `values` that mark a failure, and optionally a `messagePath` for the text to classify. A declared failure is classified as a usage limit or rate limit when its message says so, so the task pauses instead of burning retries; anything else fails the attempt. Without this block, such a client's error envelope is read as a result. Choose values that appear only in failures; a value that is also present on success would fail every run.
5. **Know what a provider may serve:** each adapter kind declares whether it confines model-issued commands itself. Startup rejects a configuration that assigns the implementer or fixer to a provider whose commands would run unconfined, so an adapter that cannot confine can serve only the analyzer and reviewer. A `cli` provider has no confinement of its own and is wrapped by the orchestrator's sandbox, so it serves writing roles when `sandbox.kind` is `bubblewrap` and only non-writing roles otherwise. Fix the configuration or add an adapter; there is no override, and no configuration value can claim confinement a process does not enforce.
6. **Understand what wrapping a `cli` provider does and does not do:** the task directory is mounted writable for implementer and fixer and read-only for analyzer and reviewer, and writable mounts win over read-only ones. The wrapper keeps network access, because the client must reach its own API and `bubblewrap --unshare-net` is all-or-nothing; `codex-cli`, by contrast, denies network to the commands the model itself issues. So a wrapped client confines the process's filesystem view but not the network reach of the subprocesses that client spawns. Prefer `codex-cli` when the model's own subprocesses must not reach the network.
7. **Finish or reverse a migration:** `agents.runner` still works and supplies one provider named after its `kind`, but startup logs `legacy_runner_configuration` for it. Because `agents.runner.executable` is required only while that block is the provider in force, declaring `models.providers` is what lets you delete the block. The shorthand cannot carry a command line, so `agents.runner.kind: cli` is rejected; declare such a client as a provider. To reverse, remove `models.providers` and restore the executable; the block becomes the provider again.
8. **Inspect which provider ran a stage:** `op $OP/operator/tasks/<id> | jq '.attempts[] | {stage, attempt, model: .input.model, failureCategory}'`. Every agent attempt records its provider, so evidence can be reproduced from configuration. Non-agent stages such as `READY` and `TESTING` run no model and record no selection.
9. **Attribute usage and spend:** `orchestrator_model_tokens_total` carries `provider`, `model`, and `kind`; `orchestrator_model_cost_usd_total` carries `provider` and `model`. Attempts written before a provider was recorded show as `unknown` in those labels. Token counts appear only when the provider's transport declares a `usage` block, so a `cli` provider reports no tokens until one is declared.

## Credential rotation

Credentials:

- `GITHUB_TOKEN`: a fine-grained token limited to the registered repositories. Grants: Contents read/write, Pull requests read/write, Metadata read, Commit statuses read, and Checks read. Administration read is needed only when classic branch protection must be readable. Set an expiry of 90 days or less.
- `LINEAR_API_KEY`: a key of a dedicated Linear user with access only to the orchestrator team; comments and attachments need write access.
- `ORCHESTRATOR_OPERATOR_TOKEN`: a random value of at least 32 bytes (`openssl rand -base64 32`).
- The PostgreSQL password of the orchestrator role.
- The runner credential under `CODEX_HOME`. When a different provider is declared in `models.providers`, rotate that provider's own credential instead; the legacy block is deprecated and supplies the Codex credential only while it is the provider in force. A provider's credential names its variables in `models.providers.<alias>.environment`; provider credentials are refused everywhere repository quality commands run, and a `cli` provider receives only the variables it lists.

Rotate on schedule (every 90 days, or 14 days before the GitHub expiry that `credentials:check` warns about), and immediately after suspected exposure.

1. Issue the new credential. Keep the old one valid.
2. Verify it before installing, without starting the service:

   ```sh
   sudo -u ai-orchestrator env ORCHESTRATOR_CONFIG=/etc/ai-orchestrator/orchestrator.yaml \
     GITHUB_TOKEN="$NEW_GITHUB_TOKEN" LINEAR_API_KEY="$NEW_LINEAR_API_KEY" \
     node /opt/ai-orchestrator/dist/src/ops/check-credentials.js
   ```

   The check reads Linear team access, and GitHub repository metadata, branch policy (warning when a base branch has no required checks), and pull requests. It fails classic tokens with unnecessary scopes, and fails when delivery is enabled but the token cannot push. It prints no credential. Exit status 1 means do not install.
3. Replace the value in `/etc/ai-orchestrator/orchestrator.env` (still `root:root 0600`) and restart: `sudo systemctl restart ai-orchestrator`. Credentials are read only at startup. In-flight stages park on shutdown and resume after the restart.
4. Confirm `/readyz`, a `scheduler_tick_completed` log entry, and `orchestrator_provider_calls_total{result="ok"}` rising.
5. Revoke the old credential. For the database, `ALTER ROLE ... PASSWORD` must precede step 3, and the old password is gone once it does.

**After suspected exposure:** engage the kill switch, revoke first, then rotate. Review GitHub audit logs and pushes to orchestrator branches since the exposure window, and the `external_operations` rows for that period.

## Canary rollout

Enable capabilities in stages. Stay at each stage until its exit condition holds for the stated time, and keep the kill switch procedure at hand.

| Stage | Configuration | Exit condition |
|---|---|---|
| 1. Intake audit | `ORCHESTRATOR_DRY_RUN=true`, no execution flags | Every candidate's dry-run decision is explained; no alert for 3 days |
| 2. Workspaces | `prepareWorkspaces: true`, `rollout.repositories: [<one>]`, `maxNewTasksPerDay: 2` | Worktrees prepared and released cleanly for 5 tasks |
| 3. Local agents | `runAgents: true`, sandbox and token Git enabled, same rollout | 10 reviewed local branches, no `workspace-integrity`, spend within budget |
| 4. Sandbox delivery | The [sandbox delivery run](#sandbox-delivery-run) | Evidence collector passes, including restart checks |
| 5. Production delivery, one repository | `deliver: true`, `rollout.repositories: [<one>]`, `maxNewTasksPerDay: 2`, repository `maxConcurrentTasks: 1` | 10 merged pull requests without reverts; no unexplained manual intervention for 2 weeks |
| 6. Widen | Add one repository at a time; raise `maxNewTasksPerDay` gradually | Per repository, as in stage 5 |

Rollback at any stage: narrow `rollout`, or unset the flag of the stage and restart. Tasks already past a stage keep their state; tasks in states without a handler wait unclaimed until the flag returns. Engage the kill switch first if anything is running.

## Sandbox delivery run

A Phase 7 exit item: prove delivery end to end against real GitHub and Linear without touching KelolaKelas repositories.

**Status: Not yet performed.** The configuration and evidence collector are implemented.

1. **Prepare.**
   - A private repository `kelolakelas/orchestrator-sandbox` with a small Node.js project, a CI workflow that runs lint and tests on pull requests, and branch protection on `main` requiring that check and one approval.
   - A sandbox Linear team (key `SBX`) with labels `ai-ready` and `ai-sandbox`.
   - A fine-grained token limited to the sandbox repository.
   - One `ai-ready` issue with a valid planning contract for a trivial change.
2. **Configure** from `ops/sandbox/orchestrator.sandbox.yaml`: model identifiers, toolchain paths, and a separate database and workspace root. Run `check-credentials.js` against it.
3. **Run** a separate service instance with that configuration.
4. **Collect evidence** while it runs:

   ```sh
   ORCHESTRATOR_CONFIG=ops/sandbox/orchestrator.sandbox.yaml ORCHESTRATOR_URL=http://127.0.0.1:8090 \
     node dist/src/ops/sandbox-evidence.js SBX-1 READY_FOR_HUMAN_REVIEW 240 > sandbox-run.json
   ```

5. **Inject restarts between side effects.** Run `systemctl kill -s SIGKILL` on the instance:
   - right after the log shows the push;
   - right after the pull request appears on GitHub;
   - right after the Linear comment appears.

   Restart each time, and retry the task once its lease has been recovered.
6. **Exercise failure and success paths.**
   - Make a required check fail (push a failing commit through the GitHub UI to a copy of the branch, or re-run CI with a forced failure). Confirm the task blocks. Fix it, retry, and confirm it returns to waiting.
   - Approve and merge the pull request, then confirm `COMPLETED` and a merged-pull-request comment in Linear.
   - With a second issue, close the pull request unmerged and confirm the task blocks.
7. **Accept** when:
   - the collector exits 0 (exactly one pull request per work unit);
   - `external_operations` holds exactly one push, pull request, attachment, and comment per milestone;
   - Linear shows no duplicate comments;
   - no credential appears in logs.

   Record `sandbox-run.json` and the observations in the [implementation plan](../planning/ai-orchestrator-implementation-plan.md).

## Recovery exercises

Run in a non-production environment and record the date, operator, duration, and findings in the incident log.

| Exercise | Frequency | Procedure |
|---|---|---|
| Backup restore and stale-task recovery | Quarterly, and after any schema migration | [Restore](#restore) the latest production dump into a scratch database on a staging host with the kill switch forced. Confirm the manifest verification, then recover and retry one blocked task. The automated equivalent runs in CI as `tests/backup-restore.integration.test.ts`. |
| Kill switch | Quarterly | Engage during a running stage on staging. Confirm parking within one heartbeat and resumption after release. |
| Credential rotation | Every rotation | [Credential rotation](#credential-rotation) steps, including the check. |
| Forced termination | Quarterly | `systemctl kill -s SIGKILL` during a stage on staging. Confirm the lease is recovered to manual intervention after restart, then retry. |
| Provider outage | Semi-annually | Block `api.github.com` with a staging firewall rule. Confirm the circuit opens, delivery waits, the alert fires, and recovery happens without operator action. |
| Disaster recovery | Annually | Rebuild a staging host from [Host setup](#host-setup) and an off-host dump within the 1-hour recovery time objective. |

## Capacity and polling limits

**Database and scheduler: measured.** `npm run load:scheduler` on a developer workstation with PostgreSQL 16 in Docker, 50 ms synthetic stages, and a 2 s polling interval:

| Workers | Queue | Limits (execution / delivery / per repository) | Violations | Tasks finished per second | Tick p95 | Metrics snapshot p95 |
|---|---|---|---|---|---|---|
| 4 | 5,000 queued, 500 waiting | 8 / 16 / 3 | 0 | 12.0 | 4.3 s | 15.5 ms |
| 8 | 10,000 queued, 1,000 waiting | 32 / 32 / 8 | 0 | 12.8 | 4.4 s | 18.5 ms |

- Limits held at every 25 ms sample.
- Claims are serialized by one advisory lock, so claim throughput (about 13 per second here, bound by commit latency) does not grow with workers. Real stages take minutes, so this ceiling is far above need.
- Adding workers adds agent capacity, not claim capacity.
- A tick stays within about two polling intervals regardless of queue size.
- Before the lane-refill fix, the first configuration claimed nothing for 5 minutes.

**Safe settings:**

- **`maxConcurrentTasks`:** bounded by host resources, because each task runs an agent and the repository's quality commands inside the service cgroup (`MemoryMax=16G`). Start at 1 per host and raise it by one while memory stays below `MemoryHigh` during full quality runs.
- **Repository `maxConcurrentTasks`:** 1 for repositories whose tests share external resources.
- **Pool size:** each worker uses the `pg` default pool of 10 connections. Keep `workers × 10 + 10` below PostgreSQL `max_connections`.
- **`pollingIntervalSeconds`:** 60. Lower values mainly increase Linear usage.

**Provider API budgets: Inferred** from the adapter's request pattern. Confirm current limits in the GitHub and Linear documentation.

- **GitHub.** One delivery observation of one work unit makes about 8 requests:
  - pull request (1)
  - head comparison (1)
  - branch and rulesets (2)
  - check runs and statuses (2)
  - reviews (1)
  - merge reachability when merged (1)

  At `delivery.pollIntervalSeconds: 120` that is about 240 requests per hour per open pull request. With the 5,000 requests per hour limit of a token, keep open orchestrator pull requests below about 15 per token to leave headroom for pushes, pull request creation, and retries. Raise `pollIntervalSeconds` for larger backlogs.
- **Linear.** Each intake poll reads ⌈issues in the team ÷ 50⌉ pages. At `pollingIntervalSeconds: 60` that is 60 × pages requests per hour. Keep `pages × 3600 ÷ pollingIntervalSeconds` well below the API key's hourly request limit, leaving room for comments and attachments.
