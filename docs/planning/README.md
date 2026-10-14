# Backlog planning runs

From 2026-10-14 (Asia/Jakarta), new planning runs and Linear issues are independent of the retired AI orchestrator. They use the [issue template](../example/issue.md), with ordinary Markdown descriptions and native Linear dependency relations. No orchestrator schema, JSON contract, contract heading, validator, or `ai-ready` label is required.

Each run of `LINEAR_PLANNING_PROMPT.md` (workspace root) writes artifacts to `docs/planning/<YYYY-MM-DD_HHmm>/`. These folders are draft planning, not evidence of current state; verify claims against code and Linear.

| File | Author | Purpose |
| --- | --- | --- |
| `baseline.json` | `scripts/planning.mjs init` | Run time, branch/SHA of each repository, pointer to the previous run. Drives incremental discovery. Do not edit. |
| `discovery.md` | agent | Current-state inventory, coverage, assessed and rejected candidates. |
| `backlog.md` | agent | Metadata index: keys, linked drafts, Project, type, priority, estimate, complexity, repository labels, dependencies, and execution order. |
| `projects/*.md`, `issues/*.md` | agent | Source of truth for the exact Project and Issue descriptions to send to Linear. Write and edit directly. |
| `report.md` | agent | Prioritisation rationale, deferred candidates, open questions, draft verification and Linear delivery status. |
| `linear-sync.json` | agent | Mapping from draft keys to created Linear identifiers, IDs and URLs. |

Run from the workspace root:

```sh
node kelolakelas-docs/scripts/planning.mjs init
```

The helper only creates a baseline; `render` is retired and exits without changing files. Check draft template sections, index/description consistency, links, unique keys, and valid acyclic dependencies before requesting approval. After explicit approval, create the selected items in Linear, resolve draft keys, set native blocking relations, and fetch the items again to verify their descriptions and metadata.

Historical runs retain their original `backlog.yaml`, generated Markdown, contracts, and labels. Do not migrate existing drafts or Linear items automatically. When continuing an old run, explicitly rewrite selected drafts and their index under the new rules before sending them to Linear; archived contracts are not requirements for new issues.

Executor configuration (including Hermes cron jobs and parsers) is outside this format change. Removing a contract from planning does not establish that an external executor accepts the new format; verify executor compatibility separately before relying on automatic intake.

Evidence: workspace `LINEAR_PLANNING_PROMPT.md`, sections “Batas scope”, “Fase B”, and “Fase C”; `scripts/planning.mjs` command dispatch. These establish the local planning workflow, not a runtime deployment claim.

Runs `2026-09-16_1824` and `2026-09-24_2041` predate the baseline layout. They have no `baseline.json`; credential-like sample values are redacted.
