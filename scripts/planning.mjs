#!/usr/bin/env node
// Planning run helper for LINEAR_PLANNING_PROMPT.md.
//
//   node kelolakelas-docs/scripts/planning.mjs init
//     Creates docs/planning/<YYYY-MM-DD_HHmm>/ with baseline.json (repo SHAs and
//     the previous run) so the next run can do incremental discovery.
//
//   node kelolakelas-docs/scripts/planning.mjs render <run-dir>
//     Validates <run-dir>/backlog.yaml with the orchestrator intake validator and
//     renders backlog.md, issues/*.md and projects/*.md from it. The rendered
//     files are the exact Linear descriptions; edit backlog.yaml, not them.

import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(docsRoot, '..');
const planningDir = join(docsRoot, 'docs', 'planning');
const orchestrator = join(workspace, 'kelolakelas-ai-orchestrator');
const RUN_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{4}(?:-\d+)?$/;
const REPOSITORIES = [
  'kelolakelas-web',
  'kelolakelas-api-gateway',
  'kelolakelas-identity-service',
  'kelolakelas-academic-service',
  'kelolakelas-billing-service',
  'kelolakelas-chat-service',
  'kelolakelas-docs',
];

const pad = (value, length = 2) => String(value).padStart(length, '0');
const fromWorkspace = (path) => relative(workspace, path);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function git(repository, args) {
  try {
    return execFileSync('git', ['-C', join(workspace, repository), ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function listRuns() {
  if (!existsSync(planningDir)) return [];
  return readdirSync(planningDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && RUN_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function init() {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const runs = listRuns();
  let runId = stamp;
  for (let suffix = 2; runs.includes(runId); suffix += 1) runId = `${stamp}-${suffix}`;

  const previousRunId = [...runs].reverse().find((run) => existsSync(join(planningDir, run, 'baseline.json'))) ?? null;
  const previousBaseline = previousRunId
    ? JSON.parse(readFileSync(join(planningDir, previousRunId, 'baseline.json'), 'utf8'))
    : null;

  const repositories = Object.fromEntries(REPOSITORIES.map((repository) => [repository, {
    branch: git(repository, ['rev-parse', '--abbrev-ref', 'HEAD']),
    head: git(repository, ['rev-parse', 'HEAD']),
    dirty: (git(repository, ['status', '--porcelain', '--untracked-files=no']) ?? '') !== '',
  }]));

  const runDir = join(planningDir, runId);
  mkdirSync(runDir, { recursive: true });
  const baseline = {
    schema: 'kelolakelas.planning-run/v1',
    runId,
    createdAt: now.toISOString(),
    previousRun: previousRunId && {
      runId: previousRunId,
      path: fromWorkspace(join(planningDir, previousRunId)),
      createdAt: previousBaseline.createdAt,
      repositories: previousBaseline.repositories,
    },
    repositories,
  };
  writeFileSync(join(runDir, 'baseline.json'), `${JSON.stringify(baseline, null, 2)}\n`);

  console.log(JSON.stringify({
    runDir: fromWorkspace(runDir),
    previousRun: baseline.previousRun?.path ?? null,
    linearUpdatedSince: baseline.previousRun?.createdAt ?? null,
    changedSincePreviousRun: previousBaseline
      ? Object.fromEntries(REPOSITORIES.map((repository) => {
        const from = previousBaseline.repositories?.[repository]?.head;
        const to = repositories[repository].head;
        return [repository, from && to ? `${from.slice(0, 12)}..${to.slice(0, 12)}` : 'unknown'];
      }))
      : null,
    unrelatedWorktreeChanges: REPOSITORIES.filter((repository) => repositories[repository].dirty),
  }, null, 2));
}

const bullets = (items) => items.map((item) => `- ${item}`).join('\n');
const checkboxes = (items) => items.map((item) => `- [ ] ${item}`).join('\n');
const codeBullets = (items) => items.map((item) => `- \`${item}\``).join('\n');
const jsonBlock = (value) => `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
const clean = (markdown) => `${markdown.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()}\n`;
const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function renderIssue(issue) {
  const { body } = issue;
  return clean(`## Background / Problem

${body.backgroundProblem.trim()}

## Goal

${body.goal.trim()}

## Requirements

${bullets(body.requirements)}

## Acceptance Criteria

${checkboxes(body.acceptanceCriteria)}

## Technical Notes

${body.technicalNotes.trim()}

Relevant areas:

${codeBullets(body.relevantAreas)}

## Edge Cases

${bullets(body.edgeCases)}

## Testing / Validation

${checkboxes(body.testingValidation)}

## Out of Scope

${bullets(body.outOfScope)}

## AI Orchestrator Contract

${jsonBlock(issue)}
`);
}

function renderProject(project, issues) {
  return clean(`## Tujuan/outcome

${project.outcome.trim()}

## Masalah yang diselesaikan

${project.problem.trim()}

## Nilai dan prioritas

${project.valueAndPriority.trim()}

## Scope

${bullets(project.scope)}

## Di luar scope

${bullets(project.outOfScope)}

## Success metrics

${bullets(project.successMetrics)}

## Dependencies/risiko

${project.dependenciesAndRisks.length ? bullets(project.dependenciesAndRisks) : 'Tidak ada yang diketahui.'}

## Issue yang diusulkan

${issues.map((issue, index) => `${index + 1}. ${issue.title} (\`${issue.draftKey}\`)`).join('\n')}

## AI Orchestrator Project Contract

${jsonBlock(project)}
`);
}

// Stable topological order: blockers first, otherwise payload order.
function executionOrder(issues) {
  const done = new Set();
  const ordered = [];
  while (ordered.length < issues.length) {
    const next = issues.find((issue) => !done.has(issue.draftKey)
      && issue.blockedByDraftKeys.every((key) => done.has(key)));
    done.add(next.draftKey);
    ordered.push(next);
  }
  return ordered;
}

function render(runArgument) {
  if (!runArgument) fail('Usage: node kelolakelas-docs/scripts/planning.mjs render <run-dir>');
  const runDir = resolve(runArgument);
  if (!RUN_PATTERN.test(basename(runDir)) || dirname(runDir) !== planningDir) {
    fail(`Run directory must be ${fromWorkspace(planningDir)}/<YYYY-MM-DD_HHmm>; got ${runArgument}`);
  }
  const backlogPath = join(runDir, 'backlog.yaml');
  if (!existsSync(backlogPath)) fail(`Missing ${fromWorkspace(backlogPath)}`);

  const validation = spawnSync('npm', ['--prefix', orchestrator, 'run', '--silent', 'intake:validate', '--', backlogPath], {
    stdio: 'inherit',
  });
  if (validation.status !== 0) fail('backlog.yaml failed kelolakelas.planning-backlog/v1 validation; nothing rendered.');

  const { parse } = createRequire(join(orchestrator, 'package.json'))('yaml');
  const backlog = parse(readFileSync(backlogPath, 'utf8'));
  const hydrated = backlog.issues.filter((issue) => issue.source !== undefined).map((issue) => issue.draftKey);
  if (hydrated.length) fail(`Draft payload must not contain source: ${hydrated.join(', ')}`);

  const ordered = executionOrder(backlog.issues);
  const issueFiles = new Map(ordered.map((issue, index) => [issue.draftKey, `issues/${pad(index + 1)}-${issue.draftKey}.md`]));
  const projectFiles = new Map(backlog.projects.map((project) => [project.key, `projects/${project.key}.md`]));

  for (const directory of ['issues', 'projects']) {
    rmSync(join(runDir, directory), { recursive: true, force: true });
    mkdirSync(join(runDir, directory));
  }
  for (const issue of ordered) writeFileSync(join(runDir, issueFiles.get(issue.draftKey)), renderIssue(issue));
  for (const project of backlog.projects) {
    const projectIssues = ordered.filter((issue) => issue.projectKey === project.key);
    writeFileSync(join(runDir, projectFiles.get(project.key)), renderProject(project, projectIssues));
  }

  const projectName = (key) => backlog.projects.find((project) => project.key === key)?.name ?? 'Tidak ada';
  const index = clean(`# Backlog draft ${basename(runDir)}

> Dirender otomatis dari \`backlog.yaml\` oleh \`kelolakelas-docs/scripts/planning.mjs render\`. Jangan edit file ini, \`issues/\`, atau \`projects/\` secara manual; ubah \`backlog.yaml\` lalu render ulang. Isi \`issues/*.md\` dan \`projects/*.md\` adalah description Linear apa adanya.

## Projects

| Key | Nama | Jumlah issue | File |
| --- | --- | --- | --- |
${backlog.projects.map((project) => `| \`${project.key}\` | ${cell(project.name)} | ${ordered.filter((issue) => issue.projectKey === project.key).length} | [${projectFiles.get(project.key)}](${projectFiles.get(project.key)}) |`).join('\n') || '| - | Tidak ada | 0 | - |'}

## Urutan eksekusi dan metadata issue

| # | Issue | Project | Type | Priority | Estimate | Complexity | Labels | Blocked by | External dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${ordered.map((issue, position) => `| ${position + 1} | [${cell(issue.title)}](${issueFiles.get(issue.draftKey)}) | ${cell(projectName(issue.projectKey))} | ${issue.type} | ${issue.priority} | ${issue.estimate} | ${issue.complexity} | ${issue.labels.map((label) => `\`${label}\``).join(', ')} | ${issue.blockedByDraftKeys.map((key) => `\`${key}\``).join(', ') || '-'} | ${issue.externalDependencies.map((dependency) => `\`${dependency.key}\``).join(', ') || '-'} |`).join('\n')}
`);
  writeFileSync(join(runDir, 'backlog.md'), index);

  console.log(JSON.stringify({
    event: 'planning_backlog_rendered',
    runDir: fromWorkspace(runDir),
    projects: backlog.projects.length,
    issues: ordered.length,
    files: ['backlog.md', ...projectFiles.values(), ...issueFiles.values()],
  }, null, 2));
}

const [command, ...args] = process.argv.slice(2);
if (command === 'init') init();
else if (command === 'render') render(args[0]);
else fail('Usage: node kelolakelas-docs/scripts/planning.mjs <init|render <run-dir>>');
