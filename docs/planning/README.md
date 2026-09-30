# Backlog planning runs

Each run of `LINEAR_PLANNING_PROMPT.md` (workspace root) writes its artifacts to one folder named after the run's local date and time: `docs/planning/<YYYY-MM-DD_HHmm>/`. These folders are **draft planning**, not evidence of current state; verify claims against code and Linear before relying on them.

| File | Author | Purpose |
| --- | --- | --- |
| `baseline.json` | `scripts/planning.mjs init` | Run time, branch/SHA of each repository, pointer to the previous run. Drives incremental discovery. |
| `discovery.md` | agent | Current-state inventory, coverage table, assessed and rejected candidates. |
| `backlog.yaml` | agent | `kelolakelas.planning-backlog/v1` payload; single source of truth for drafted Projects and Issues. |
| `backlog.md`, `projects/*.md`, `issues/*.md` | `scripts/planning.mjs render` | Execution order, metadata index, and exact Linear descriptions including the AI Orchestrator contracts. Do not edit by hand. |
| `report.md` | agent | Executive summary, prioritisation rationale, deferred candidates, open questions, Linear delivery status. |
| `linear-sync.json` | agent | Mapping from draft keys to created Linear identifiers. |

Commands (run from the workspace root):

```sh
node kelolakelas-docs/scripts/planning.mjs init
node kelolakelas-docs/scripts/planning.mjs render kelolakelas-docs/docs/planning/<YYYY-MM-DD_HHmm>
```

`render` validates `backlog.yaml` with `npm --prefix kelolakelas-ai-orchestrator run intake:validate` and renders nothing when validation fails.

Runs `2026-09-16_1824` and `2026-09-24_2041` predate this layout: they contain only `report.md` (and `backlog.yaml` for the first) and have no `baseline.json`. Credential-like sample values in them are redacted.
