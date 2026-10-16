// Run-local compatibility adapter; does not change repository tooling.
// Invoke from workspace root: node <this-file>
import { registerHooks, createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const runDir = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(runDir, '../../../../');
const docsRoot = resolve(workspace, 'kelolakelas-docs');
const zodURL = pathToFileURL(createRequire(resolve(workspace, 'kelolakelas-web/package.json')).resolve('zod')).href;
registerHooks({resolve(specifier, context, next) {
  if (specifier === 'zod') return next(zodURL, context);
  try { return next(specifier, context); } catch (error) {
    if (specifier.endsWith('.js') && context.parentURL?.includes('kelolakelas-ai-orchestrator')) return next(specifier.slice(0, -3) + '.ts', context);
    throw error;
  }
}});
const schemaPath = resolve(workspace, 'kelolakelas-ai-orchestrator/src/intake/planning-contract.ts');
const { validatePlanningBacklog } = await import(pathToFileURL(schemaPath).href);
const backlog = JSON.parse(readFileSync(resolve(runDir, 'backlog.yaml'), 'utf8'));
validatePlanningBacklog(backlog);
if (backlog.issues.some(issue => issue.source !== undefined)) throw new Error('Draft cannot contain source');
// Current render command is retired and npm intake:validate lacks tsx locally.
// Validate with the actual schema above using Node native TypeScript and web's
// installed zod; then replay the original renderer with JSON (valid YAML) parsing.
let renderer = execFileSync('git', ['show', 'ba4f3af:scripts/planning.mjs'], {cwd: docsRoot, encoding: 'utf8'});
const oldValidation = /const validation = spawnSync\('npm', \['--prefix', orchestrator, 'run', '--silent', 'intake:validate', '--', backlogPath\], \{\n    stdio: 'inherit',\n  \}\);/;
if (!oldValidation.test(renderer)) throw new Error('Historical validation adapter anchor changed');
renderer = renderer.replace("const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');", `const docsRoot = ${JSON.stringify(docsRoot)};`)
  .replace(oldValidation, 'const validation = { status: 0 }; // Actual current schema validated by adapter before rendering.')
  .replace("const { parse } = createRequire(join(orchestrator, 'package.json'))('yaml');", 'const parse = JSON.parse; // backlog.yaml uses the JSON subset of YAML.');
process.argv = [process.execPath, fileURLToPath(import.meta.url), 'render', runDir];
await import('data:text/javascript;base64,' + Buffer.from(renderer).toString('base64'));
writeFileSync(resolve(runDir, 'validation.json'), JSON.stringify({status:'passed',method:'Current planning-contract.ts via Node native TypeScript; historical renderer ba4f3af replayed in memory',standardRender:'failed: retired',standardIntakeCommand:'unavailable: tsx not installed',schemaSha256:createHash('sha256').update(readFileSync(schemaPath)).digest('hex'),projects:backlog.projects.length,issues:backlog.issues.length,sourceAbsent:true,repositoryToolingChanged:false},null,2)+'\n');
