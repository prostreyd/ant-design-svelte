#!/usr/bin/env node
// Runs the checks a change needs, and nothing else (CLAUDE.md 8a). The plan is made by scripts/affected/plan.mjs.
//
//   npm run test:affected                 the checks of what changed, in all three browser engines (before a commit)
//   npm run test:affected -- --quick      the same, but the browser tests in Chromium only (while working)
//   npm run test:affected -- --dry-run    only print the plan: what runs, what is skipped, and why
//   npm run test:affected -- --all        everything, as CI does
//   npm run test:affected -- --floor      also the lowest browser versions (Docker), when the library code changed
//   npm run test:affected -- --base=<ref> compare with another commit (default: origin/main, else main)
//   npm run test:affected -- --files=a,b  plan as if only these files had changed ("what would run if I changed this?")
//
// Always run, because they take under a minute together: lint, types, the unit tests with the coverage thresholds, the
// package. The browser tests are the part that takes time (about 20 minutes in full), and they are the part that is
// chosen. CI on GitHub runs everything on every pushed branch, so what this skips locally is checked there before it
// can be merged or released.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planFor, runsDocs, runsLibrary } from './affected/plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const option = (name) => process.argv.slice(2).find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

if (args.has('--help') || args.has('-h')) {
  console.log(readHelp());
  process.exit(0);
}

function git(...params) {
  const result = spawnSync('git', params, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function changedFiles() {
  const given = option('files');
  if (given) return { base: 'the list given', files: given.split(',') };
  const base = option('base') ?? (git('rev-parse', '--verify', '--quiet', 'origin/main') ? 'origin/main' : 'main');
  const mergeBase = git('merge-base', 'HEAD', base) ?? base;
  const lists = [
    git('diff', '--name-only', `${mergeBase}..HEAD`),
    git('diff', '--name-only'),
    git('diff', '--name-only', '--cached'),
    git('ls-files', '--others', '--exclude-standard')
  ];
  return { base, files: lists.flatMap((list) => (list ? list.split('\n') : [])) };
}

function newestSourceTime() {
  let newest = 0;
  const visit = (path) => {
    if (!existsSync(path)) return;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path)) if (name !== 'node_modules' && name !== '.svelte-kit') visit(join(path, name));
    } else newest = Math.max(newest, stat.mtimeMs);
  };
  for (const path of ['docs/src', 'docs/static', 'src/lib', 'docs/vite.config.ts', 'docs/svelte.config.js', 'CHANGELOG.md']) visit(join(root, path));
  return newest;
}

const buildIsFresh = () => {
  const index = join(root, 'docs/build/index.html');
  return existsSync(index) && statSync(index).mtimeMs > newestSourceTime();
};

const { base, files } = changedFiles();
const engines = args.has('--quick') ? ['chromium'] : ['chromium', 'firefox', 'webkit'];
const plan = planFor(files, { root, engines, all: args.has('--all') });

// ---- the plan, printed
const lines = [];
lines.push(`Changes since ${base}: ${new Set(files).size} file(s).`);
if (plan.all) lines.push(`Everything runs: ${plan.all}.`);
for (const { file, text } of plan.notes.slice(0, 25)) lines.push(`  ${file}\n      ${text}`);
if (plan.notes.length > 25) lines.push(`  ... and ${plan.notes.length - 25} more`);
lines.push('');
lines.push('Always: lint, types, check:docs, unit tests with coverage, package.');
lines.push(`Browser tests of the library:  ${runsLibrary(plan) ? (plan.lib.all ? 'all' : plan.lib.specs.join(', ')) : 'skipped, nothing in the library or its tests changed'}`);
lines.push(`Browser tests of the site:     ${runsDocs(plan) ? (plan.docs.all ? 'all' : `only ${plan.docs.filters.join('  |  ')}`) : 'skipped, nothing on the site changed'}`);
lines.push(`Browser engines:               ${engines.join(', ')}${args.has('--quick') ? '  (quick: the other two run before the commit and in CI)' : ''}`);
lines.push(`Lowest browser versions:       ${plan.floor ? (args.has('--floor') ? 'will run (Docker)' : 'the library code changed: run `npm run test:floor` (Docker) before a release, or add --floor') : 'not needed'}`);
lines.push('CI on GitHub runs everything on every pushed branch.');
console.log(lines.join('\n'));
if (args.has('--dry-run')) process.exit(0);

// ---- the steps
const env = { ...process.env, BASE_PATH: '/ant-design-svelte' };
const engineArgs = args.has('--quick') ? ['--project=chromium'] : [];
const steps = [
  ['lint', 'npm', ['run', 'lint']],
  ['types of the library', 'npm', ['run', 'check']],
  ['types of the site and the quality matrix', 'npm', ['run', 'check:docs']],
  ['unit tests with coverage', 'npm', ['run', 'test:coverage']],
  ['package', 'npm', ['run', 'package']]
];
if (runsDocs(plan)) {
  if (!buildIsFresh()) steps.push(['build of the site', 'npm', ['run', 'build']]);
  steps.push(['checks of the built site', 'npm', ['run', 'verify', '-w', 'docs']]);
}
if (runsLibrary(plan)) {
  steps.push(['browser tests of the library', 'npx', ['playwright', 'test', ...(plan.lib.all ? [] : plan.lib.specs), ...engineArgs]]);
}
if (runsDocs(plan)) {
  const filter = plan.docs.all ? [] : ['-g', plan.docs.filters.join('|')];
  steps.push(['browser tests of the site', 'npm', ['run', 'test:e2e', '-w', 'docs', '--', ...filter, ...engineArgs]]);
}
if (plan.floor && args.has('--floor')) steps.push(['lowest browser versions', 'npm', ['run', 'test:floor']]);

const started = Date.now();
const report = [];
for (const [name, command, params] of steps) {
  console.log(`\n=== ${name}: ${command} ${params.join(' ')}`);
  const begin = Date.now();
  const result = spawnSync(command, params, { cwd: root, env, stdio: 'inherit' });
  const seconds = Math.round((Date.now() - begin) / 1000);
  report.push(`${result.status === 0 ? 'ok    ' : 'FAILED'} ${name} (${seconds} s)`);
  if (result.status !== 0) {
    console.log(`\n${report.join('\n')}\n\nStopped at the first failure: nothing after "${name}" ran.`);
    process.exit(result.status ?? 1);
  }
}
console.log(`\n${report.join('\n')}\n\nAll chosen checks passed in ${Math.round((Date.now() - started) / 1000)} s. CI runs the rest on GitHub.`);

function readHelp() {
  return [
    'npm run test:affected [-- options]',
    '  (no options)   the checks of what changed, browser tests in three engines',
    '  --quick        browser tests in Chromium only',
    '  --dry-run      print the plan and stop',
    '  --all          everything, as CI does',
    '  --floor        also the lowest browser versions (Docker)',
    '  --base=<ref>   compare with another commit (default origin/main)',
    '  --files=a,b    plan as if only these files had changed'
  ].join('\n');
}
