# ADR 0011: Provider-agnostic, configurable model transport for the AI orchestrator

## Status

Accepted for implementation in AI orchestrator Phase 8. Implements milestone M1 of the model-provider refactor. M2 (a declarative CLI adapter) is planned and is not covered by this record.

## Context

ADR 0006 chose the Codex CLI as the runner behind an `AgentRunner` port and made model *identifiers* configuration (`models.tiers.<tier>.model`). That left the *transport* hardcoded: every run was `codex exec` with OpenAI-style flags, effort names (`xhigh`), JSONL events, credential variable names, and Codex's own command sandbox. `agents.runner.kind` existed in configuration but was a single-value enum that nothing branched on, so it could not select anything.

ADR 0006 and ADR 0008 also establish that the service's security posture depends on the provider confining the commands the model issues. A direct HTTP model API (Anthropic Messages, OpenAI Responses) has no tool sandbox at all: the orchestrator would have to execute model-requested tools itself, outside every provider sandbox. Any change that lets operators route roles to arbitrary providers therefore has to carry an explicit capability contract, or it silently destroys the security model.

The goal is that routing — which complexity or role uses which provider, model, effort, and how retries escalate — becomes data, and that `codex-cli` becomes one interchangeable adapter among several.

## Decision

**One provider registry, one port.** `AgentRunner` (`src/execution/agent-runner.ts`) is a pure port: it imports only `zod` types and `AgentRole`/`ModelSelection` from `src/types/model.ts`. `ModelSelection` gained a required `provider` field, so a model selection is now `{ provider, tier, model, effort }` and can no longer be interpreted without naming a transport.

`src/execution/provider-registry.ts` turns `models.providers` into a handle per alias and builds one adapter per handle through a `switch` on `kind`. `src/execution/dispatching-runner.ts` implements the port by resolving the handle a selection names and delegating. Execution stages depend only on the port, so which provider serves a role is a configuration fact rather than a code path; a fence test enforces that `src/execution/stages/*.ts` imports neither adapters, the registry, nor the dispatching runner.

**Capability contract in code, confinement derived, fail-closed.** Each adapter kind declares its capabilities beside its implementation in `src/execution/adapters/capabilities.ts`:

- `ownConfinement: 'provider-sandbox' | 'none'` — confinement the adapter provides by itself.
- `wrappable: boolean` — whether the orchestrator's own command sandbox may wrap it.
- `effortMap` — provider-specific names for canonical effort levels.

`effectiveConfinement` derives the confinement actually in force from the adapter's own guarantee and `sandbox.kind`. Configuration validation cross-checks every role assignment against those capabilities and rejects a write-enabled role (`implementer`, `fixer`) whose provider would run with confinement `none`. Configuration can narrow a capability but never widen it: no configuration value can grant an adapter a sandbox it does not have, and there is no opt-out flag.

`codex-cli` declares `wrappable: false`, and the reason is recorded in the module: `codex exec --sandbox read-only|workspace-write` already confines every model-issued command, and nesting one command sandbox inside another is unsupported and would weaken both. Because `ownConfinement` short-circuits, a Codex provider is always confined by its own sandbox whatever `sandbox.kind` says.

**Routing, tiers, and effort are data.** `src/routing/defaults.ts` holds the default routing and escalation ladders, and `src/routing/model-router.ts` reads `models.routes`, `models.escalation`, `models.roles`, `models.analyzer`, and `models.reviewer` over those defaults. The canonical effort scale (`low`, `medium`, `high`, `max`) is provider-neutral; `resolveEffortMap` translates it to the names one provider accepts, so an unmapped level keeps its canonical name and `max` reaches Codex as `xhigh`. When several providers are declared, a tier that a reachable route uses must name its provider, and configuration rejects the ambiguous case rather than guessing a transport.

**Reachability is derived from the runtime's own fallback.** Validation computes the tiers a run can reach using the same `config.models.routes[complexity] ?? defaultRouting[complexity]` expression the router uses, so overriding every route does not leave a default tier mandatory.

**Provider vocabulary stays in adapter modules.** A module whose name sounded neutral, `src/execution/adapters/events.ts`, still hardcoded Codex event and usage vocabulary; it was replaced by `codex-events.ts` so the naming tells the truth. Credential variable names for the supported provider CLIs live only in `src/security/credentials.ts`. `tests/provider-fence.test.ts` fails the build if Codex flags, `codex exec`, Codex event types, Codex environment variables, OpenAI usage field names, or `gpt-*` literals reappear outside the adapter directory, the credential module, the fixtures, the allowlisted tests, and the example configuration.

**Backwards compatibility with a real migration path.** An existing `agents.runner` block keeps working: when `models.providers` is empty, the legacy block is promoted to a single provider aliased by its `kind`, and the service logs one `legacy_runner_configuration` warning per promoted provider. Because that warning tells operators to declare providers, `agents.runner.executable` became optional so the block can actually be deleted once providers exist: validation requires an executable only while the legacy block is the provider in force, and requires either declared providers or a legacy executable whenever `orchestrator.execution.runAgents` is true.

**Generalized evidence and pause semantics.** Every agent attempt records the provider that served it, so run evidence can be reproduced from configuration. `orchestrator_model_tokens_total` carries `provider` alongside `model` and `kind`, `orchestrator_model_cost_usd_total` carries `provider`, and the token aggregate reads the provider from the stored input. `PauseReason` gained the neutral `USAGE_LIMIT`, which the scheduler and the pause helpers treat like the existing rate and provider-limit reasons; the older `CODEX_USAGE_LIMIT` is retained so persisted rows stay readable.

## Alternatives considered

- **Keep Codex and add an HTTP provider adapter next to it.** Rejected for M1: a direct HTTP model API has no tool sandbox, so the orchestrator would execute model-issued commands itself, outside every provider sandbox. That decision needs its own record and its own confinement story.
- **Select the transport with an `if` per provider at each call site.** Rejected: it makes every stage aware of every provider, which is the coupling this work removes.
- **Declare capabilities in configuration instead of code.** Rejected: configuration would then be able to claim a sandbox an adapter does not have, which is exactly the widening the security model forbids.
- **Wrap the Codex CLI in bubblewrap to make confinement uniform.** Rejected: nesting a command sandbox inside another is unsupported and would weaken both, so `codex-cli` is declared `wrappable: false` rather than wrapped.
- **Keep the legacy `agents.runner` block required.** Rejected: a deprecation warning whose migration cannot be completed is not a migration path. The block stays functional but its executable becomes optional once providers are declared.
- **Require every default tier to be configured.** Rejected: it contradicts "routing is data". Validation now derives reachable tiers from the same fallback the router uses.
- **Trust a provider's own sandbox based on its documentation.** Rejected: an adapter's confinement guarantee is verified against a real local process before it is declared, and the declaration is the code that must change if that stops being true.

## Consequences

Operators can route any role to any registered provider, model, and effort through configuration, and add a provider kind without touching stage code. The cost is that a new kind needs an adapter module, an entry in the capability table, and evidence that its declared confinement matches what the process really does. Until M2, only `codex-cli` is registered, so the practical set of usable providers is unchanged; what changed is that nothing outside the adapter directory assumes it.

The security posture is unchanged for Codex: it remains confined by its own sandbox, identically to ADR 0006, and the orchestrator's bubblewrap configuration is untouched. The residual risks recorded in ADR 0006 and ADR 0008 — quality commands running agent-written code outside the provider sandbox, and the read-only sandbox limiting writes but not reads — still apply and are unchanged.

Making `provider` a required part of a model selection is a breaking change for code that constructs a selection, but not for existing configuration files. Two implementation details are easy to get wrong again and are therefore fenced:

- A module that parses provider events must be named for that provider, and the neutrality fence must stay permanent because a neutral-looking module can still encode one provider's vocabulary.
- A raw-SQL integration fixture that inserts an attempt input is invisible to the type checker, so adding a required field to a model selection does not surface there; `tests/operations.integration.test.ts` covers the provider dimension explicitly.

## Evidence

- `kelolakelas-ai-orchestrator` at the commit that introduces this ADR.
- `src/types/model.ts`, `src/routing/defaults.ts`, `src/routing/model-router.ts`.
- `src/execution/agent-runner.ts`, `src/execution/dispatching-runner.ts`, `src/execution/provider-registry.ts`, `src/execution/adapters/capabilities.ts`, `src/execution/adapters/codex-cli.ts`, `src/execution/adapters/codex-events.ts`.
- `src/config/schema.ts` (`models.providers`, ambiguity, and write-role confinement validation), `src/config/providers.ts`, `src/security/credentials.ts`.
- `src/index.ts` (per-provider fail-closed executable check and the `legacy_runner_configuration` warning); `src/observability/orchestrator-metrics.ts`; `src/repositories/metrics.repository.ts`; `ops/grafana/ai-orchestrator-dashboard.json`.
- Tests: `tests/provider-fence.test.ts` (neutrality fence), `tests/provider-registry.test.ts` (registry, confinement, backwards compatibility, migration off-ramp), `tests/agent-execution.integration.test.ts` (an analyzer, implementer, fixer, and reviewer cycle served by two distinct real spawned provider processes, asserting the per-role model, access, and effort each process received and the provider recorded on every attempt).
- Verified locally: `npm run build`, `npm run lint`, `npm test` (24 files, 168 tests), and `npm run test:repository` (8 files, 42 tests) against PostgreSQL 16.
