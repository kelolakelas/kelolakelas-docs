#!/usr/bin/env node
// Planning run helper for LINEAR_PLANNING_PROMPT.md.
//
//   node kelolakelas-docs/scripts/planning.mjs init
//     Creates docs/planning/<YYYY-MM-DD_HHmm>/ with baseline.json (repo SHAs and
//     the previous run) so the next run can do incremental discovery.
//
// Draft descriptions and their metadata index are authored directly in Markdown.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(docsRoot, '..');
const planningDir = join(docsRoot, 'docs', 'planning');
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

const [command] = process.argv.slice(2);
if (command === 'init') init();
else if (command === 'render') fail('render is retired. Write backlog.md, projects/*.md and issues/*.md directly; see docs/planning/README.md. Existing drafts are unchanged.');
else fail('Usage: node kelolakelas-docs/scripts/planning.mjs init');
