#!/usr/bin/env node
// Mutation testing for src/lib/Button/Button.svelte.
//
// Stryker has no Svelte mutator, so this runner does the same job directly:
//   1. applies one mutation at a time to the component's script and markup
//      (the <style> block is excluded; unit tests do not assert CSS),
//   2. skips mutants that no longer compile (they are not meaningful),
//   3. runs the unit tests; a failing run means the mutant was "killed",
//   4. restores the original file, even on error or Ctrl+C.
//
// Mutation score = killed / (killed + survived). Survivors point to behavior
// that no test pins down.
//
// Usage: npm run test:mutation -- [--threshold=90] [--only=<operator-id>]

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/lib/Button/Button.svelte');
const reportPath = resolve(root, 'coverage/mutation-report.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  })
);
const threshold = Number(args.threshold ?? 90);
const onlyOperator = args.only;

const original = readFileSync(target, 'utf8');
const styleIndex = original.indexOf('<style>');
const scopeEnd = styleIndex === -1 ? original.length : styleIndex;
const scope = original.slice(0, scopeEnd);

/**
 * Each operator is a rule that can produce several mutants, one per match.
 * `pattern` must have the `g` flag.
 */
const OPERATORS = [
  { id: 'eq-to-neq', description: '=== → !==', pattern: /===/g, replace: '!==' },
  { id: 'neq-to-eq', description: '!== → ===', pattern: /!==/g, replace: '===' },
  { id: 'and-to-or', description: '&& → ||', pattern: /&&/g, replace: '||' },
  { id: 'or-to-and', description: '|| → &&', pattern: /\|\|/g, replace: '&&' },
  {
    id: 'negate-remove',
    description: 'remove ! before an identifier',
    pattern: /!(?=[A-Za-z_(])/g,
    replace: ''
  },
  { id: 'negate-if', description: 'negate a {#if} condition', pattern: /\{#if /g, replace: '{#if !' },
  { id: 'if-disabled-false', description: 'if (isDisabled) → if (false)', pattern: /if \(isDisabled\)/g, replace: 'if (false)' },
  { id: 'true-to-false', description: 'true → false', pattern: /\btrue\b/g, replace: 'false' },
  { id: 'false-to-true', description: 'false → true', pattern: /\bfalse\b/g, replace: 'true' },
  { id: 'start-end', description: "'start' → 'end'", pattern: /'start'/g, replace: "'end'" },
  { id: 'end-start', description: "'end' → 'start'", pattern: /'end'/g, replace: "'start'" },
  { id: 'lt-zero', description: '< 0 → <= 0', pattern: /< 0/g, replace: '<= 0' },
  { id: 'delay-zero-check', description: 'delay === 0 → delay === 1', pattern: /delay === 0\)/g, replace: 'delay === 1)' },
  { id: 'loading-zero-return', description: 'drop boolean early return', pattern: /if \(typeof loading === 'boolean'\) return 0;/g, replace: 'if (false) return 0;' },
  { id: 'loading-zero-or', description: 'loadingDelay === 0 → === 1 in isLoading', pattern: /loadingDelay === 0 \|\| delayedLoading/g, replace: 'loadingDelay === 1 || delayedLoading' },
  { id: 'tabindex', description: 'tabindex -1 → 0', pattern: /\? -1 : undefined/g, replace: '? 0 : undefined' },
  { id: 'aria-hidden', description: 'aria-hidden="true" → "false"', pattern: /aria-hidden="true"/g, replace: 'aria-hidden="false"' },
  { id: 'remove-prevent', description: 'remove event.preventDefault()', pattern: /event\.preventDefault\(\);/g, replace: '' },
  { id: 'double-onclick', description: 'call onclick twice', pattern: /onclick\?\.\(event\);/g, replace: 'onclick?.(event); onclick?.(event);' },
  { id: 'unsafe-onclick', description: 'call onclick without optional chaining', pattern: /onclick\?\.\(/g, replace: 'onclick(' },
  { id: 'remove-return', description: 'remove early return', pattern: /\breturn;/g, replace: ';' },
  { id: 'remove-timer-cleanup', description: 'remove timer cleanup', pattern: /return \(\) => clearTimeout\(timer\);/g, replace: '' },
  { id: 'remove-assert', description: 'remove an enum validation call', pattern: /assertAllowed\('\w+', \w+, \w+\);/g, replace: '' },
  { id: 'rangeerror-to-error', description: 'RangeError → Error', pattern: /new RangeError\(/g, replace: 'new Error(' },
  { id: 'finite-to-nan', description: 'Number.isFinite → Number.isNaN', pattern: /Number\.isFinite\(/g, replace: 'Number.isNaN(' },
  {
    id: 'class-suffix',
    description: 'corrupt a modifier class name',
    pattern: /list\.push\('ads-btn-(\w+)'\)/g,
    replace: (m) => m[0].replace(/'ads-btn-(\w+)'/, "'ads-btn-$1-x'")
  },
  { id: 'drop-custom-class', description: 'drop the custom class', pattern: /list\.push\(customClass\)/g, replace: "list.push('')" },
  { id: 'join-separator', description: 'join classes without spaces', pattern: /\.join\(' '\)/g, replace: ".join('')" },
  { id: 'size-alias', description: 'drop the middle size alias', pattern: /size === 'medium' \|\| size === 'middle'/g, replace: "size === 'medium'" },
  { id: 'middle-class', description: 'medium maps to the medium class', pattern: /\? 'middle' : size/g, replace: "? 'medium' : size" },
  { id: 'default-htmltype', description: 'default htmlType → submit', pattern: /htmlType = 'button'/g, replace: "htmlType = 'submit'" },
  { id: 'default-size', description: 'default size → large', pattern: /size = 'medium'/g, replace: "size = 'large'" },
  { id: 'default-type', description: 'default type → primary', pattern: /type = 'default'/g, replace: "type = 'primary'" },
  { id: 'default-shape', description: 'default shape → round', pattern: /shape = 'default'/g, replace: "shape = 'round'" },
  { id: 'default-placement', description: 'default iconPlacement → end', pattern: /iconPlacement = 'start'/g, replace: "iconPlacement = 'end'" },
  { id: 'download-true', description: 'download=true renders "true"', pattern: /download === true \? ''/g, replace: "download === true ? 'true'" },
  { id: 'download-false', description: 'download=false renders "false"', pattern: /download === false \? undefined/g, replace: "download === false ? ''" },
  { id: 'href-null', description: 'href check uses null', pattern: /href !== undefined/g, replace: 'href !== null' }
];

function lineOf(index) {
  return scope.slice(0, index).split('\n').length;
}

function* generateMutants() {
  for (const op of OPERATORS) {
    if (onlyOperator && op.id !== onlyOperator) continue;
    for (const match of scope.matchAll(op.pattern)) {
      const replacement =
        typeof op.replace === 'function' ? op.replace(match) : op.replace;
      const mutatedScope =
        scope.slice(0, match.index) + replacement + scope.slice(match.index + match[0].length);
      const line = lineOf(match.index);
      yield {
        operator: op.id,
        description: op.description,
        line,
        original: match[0],
        replacement,
        source: mutatedScope + original.slice(scopeEnd)
      };
    }
  }
}

async function compiles(source) {
  try {
    const pre = await preprocess(source, vitePreprocess(), { filename: target });
    compile(pre.code, { filename: target, generate: 'client' });
    return true;
  } catch {
    return false;
  }
}

function runUnitTests() {
  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--coverage.enabled=false', '--bail', '1'],
    { cwd: root, encoding: 'utf8', timeout: 180_000 }
  );
  if (result.error?.code === 'ETIMEDOUT' || result.signal) return 'timeout';
  return result.status === 0 ? 'pass' : 'fail';
}

function restore() {
  writeFileSync(target, original);
}

process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

const baseline = runUnitTests();
if (baseline !== 'pass') {
  console.error(`Baseline unit tests are not green (${baseline}). Fix them before mutating.`);
  process.exit(1);
}

const results = [];
let index = 0;
for (const mutant of generateMutants()) {
  index += 1;
  const label = `#${index} [${mutant.operator}] line ${mutant.line}: ${mutant.original} → ${mutant.replacement}`;

  writeFileSync(target, mutant.source);
  if (!(await compiles(mutant.source))) {
    results.push({ ...mutant, status: 'invalid' });
    console.log(`  invalid   ${label}`);
    continue;
  }

  const outcome = runUnitTests();
  const status = outcome === 'pass' ? 'survived' : 'killed';
  results.push({ ...mutant, status });
  console.log(`  ${status.padEnd(9)} ${label}`);
}

restore();

const count = (status) => results.filter((r) => r.status === status).length;
const killed = count('killed');
const survived = count('survived');
const invalid = count('invalid');
const valid = killed + survived;
const score = valid === 0 ? 0 : Math.round((killed / valid) * 1000) / 10;

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  JSON.stringify({ target: 'src/lib/Button/Button.svelte', score, killed, survived, invalid, results }, null, 2)
);

console.log('\nMutation summary');
console.log(`  total mutants: ${results.length}`);
console.log(`  killed:        ${killed}`);
console.log(`  survived:      ${survived}`);
console.log(`  invalid:       ${invalid} (excluded from score)`);
console.log(`  score:         ${score}% (threshold ${threshold}%)`);

const survivors = results.filter((r) => r.status === 'survived');
if (survivors.length > 0) {
  console.log('\nSurvivors (no test fails when these change):');
  for (const s of survivors) {
    console.log(`  line ${s.line} [${s.operator}] ${s.original} → ${s.replacement}`);
  }
}

process.exit(score >= threshold ? 0 : 1);
