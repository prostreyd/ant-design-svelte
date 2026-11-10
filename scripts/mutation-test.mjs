#!/usr/bin/env node
// Mutation testing for a component of src/lib (Button by default, or `--target=Switch`). A folder may hold
// several components: `--target=Checkbox --file=CheckboxGroup` mutates src/lib/Checkbox/CheckboxGroup.svelte.
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
// Usage: npm run test:mutation -- [--target=Button|Switch|Checkbox] [--file=<component>] [--threshold=90] [--only=<operator-id>]
//
// Button runs the whole unit test suite for every mutant. Any other target runs only its own
// test files (tests/<Target>*.test.ts, so Checkbox also runs tests/CheckboxGroup.test.ts), which is much
// faster and is all the component can affect.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { compile, preprocess } from 'svelte/compiler';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  })
);
const component = args.target ?? 'Button';
if (!/^[A-Z][A-Za-z]*$/.test(component)) {
  console.error(`--target must be a component name such as Switch, got "${component}".`);
  process.exit(2);
}
const file = args.file ?? component;
if (!/^[A-Z][A-Za-z]*$/.test(file)) {
  console.error(`--file must be a component name such as CheckboxGroup, got "${file}".`);
  process.exit(2);
}
const target = resolve(root, `src/lib/${component}/${file}.svelte`);
const reportPath = resolve(
  root,
  component === 'Button' && file === 'Button' ? 'coverage/mutation-report.json' : `coverage/mutation-report-${file.toLowerCase()}.json`
);
// The unit test files that can see a change of the target: tests/<Target>.test.ts and the files of the other
// components of the folder (tests/CheckboxGroup.test.ts for Checkbox).
const testFiles = readdirSync(resolve(root, 'tests'))
  .filter((name) => name.startsWith(component) && name.endsWith('.test.ts'))
  .map((name) => `tests/${name}`);
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
  { id: 'href-null', description: 'href check uses null', pattern: /href !== undefined/g, replace: 'href !== null' },

  // Switch
  { id: 'inactive-guard', description: 'if (isInactive) → if (false)', pattern: /if \(isInactive\)/g, replace: 'if (false)' },
  { id: 'keep-default-prevented', description: 'ignore preventDefault() of onclick', pattern: /if \(event\.defaultPrevented\) return;/g, replace: '' },
  { id: 'no-flip', description: 'do not flip the state', pattern: /const next = !isOn;/g, replace: 'const next = isOn;' },
  { id: 'drop-assign', description: 'do not assign checked', pattern: /checked = next;/g, replace: '' },
  { id: 'drop-onchange', description: 'do not call onchange', pattern: /onchange\?\.\(next, event\);/g, replace: '' },
  { id: 'onchange-old-value', description: 'onchange gets the old value', pattern: /onchange\?\.\(next, event\)/g, replace: 'onchange?.(isOn, event)' },
  { id: 'onchange-before-click', description: 'call onclick after the state flips', pattern: /onclick\?\.\(event\);\n\s+if \(event\.defaultPrevented\) return;/g, replace: 'if (event.defaultPrevented) return;' },
  { id: 'small-to-medium', description: "size small renders medium", pattern: /=== 'small' \? 'small' : 'medium'/g, replace: "=== 'small' ? 'medium' : 'medium'" },
  { id: 'boolean-coerce', description: 'drop Boolean(checked)', pattern: /Boolean\(checked\)/g, replace: 'checked' },
  { id: 'drop-focus-options', description: 'focus() ignores its options', pattern: /element\?\.focus\(options\)/g, replace: 'element?.focus()' },
  { id: 'drop-blur', description: 'blur() does nothing', pattern: /element\?\.blur\(\);/g, replace: ';' },
  { id: 'html-type', description: 'type button → submit', pattern: /type="button"/g, replace: 'type="submit"' },
  { id: 'role', description: 'role switch → button', pattern: /role="switch"/g, replace: 'role="button"' },
  { id: 'style-order', description: 'styles.root before style', pattern: /styleText\(customStyle, styles\?\.root\)/g, replace: 'styleText(styles?.root, customStyle)' },
  { id: 'switch-class', description: 'corrupt a Switch class name', pattern: /'ads-switch-[\w-]+'/g, replace: (m) => m[0].replace(/'$/, "-x'") },
  { id: 'hidden-when-unchecked', description: 'checked content is not hidden while unchecked', pattern: /class:ads-switch-content-hidden=\{!isOn\}/g, replace: 'class:ads-switch-content-hidden={isOn}' },
  { id: 'hidden-when-checked', description: 'unchecked content is not hidden while checked', pattern: /class:ads-switch-content-hidden=\{isOn\}/g, replace: 'class:ads-switch-content-hidden={!isOn}' },
  { id: 'item-class', description: 'corrupt the content item class', pattern: /class="ads-switch-content-item"/g, replace: 'class="ads-switch-content-item-x"' },
  { id: 'busy-when-loading', description: 'loading no longer sets aria-busy', pattern: /loading \? true : ariaBusy/g, replace: 'ariaBusy' },
  { id: 'inactive-when-loading', description: 'loading no longer sets aria-disabled', pattern: /loading && !disabled \? true : ariaDisabled/g, replace: 'ariaDisabled' },

  // Checkbox and CheckboxGroup
  { id: 'cb-drop-write-checked', description: 'do not write the checked state back to the input', pattern: /target\.checked = isChecked;/g, replace: '' },
  { id: 'cb-drop-write-indeterminate', description: 'do not write indeterminate back to the input', pattern: /target\.indeterminate = indeterminate;/g, replace: '' },
  { id: 'cb-drop-toggle', description: 'a group item does not tell the group', pattern: /group!\.toggle\(value!, next, event\);/g, replace: '' },
  { id: 'cb-drop-assign', description: 'a standalone checkbox does not assign checked', pattern: /checked = next;/g, replace: '' },
  { id: 'cb-drop-onchange', description: 'do not call onchange', pattern: /onchange\?\.\(next, event\);/g, replace: '' },
  { id: 'cb-onchange-old-value', description: 'onchange of a standalone checkbox gets the old value', pattern: /checked = next;\n\s+onchange\?\.\(next, event\);/g, replace: 'checked = next;\n      onchange?.(!next, event);' },
  { id: 'cb-item-after-group', description: 'the item onchange runs after the group', pattern: /onchange\?\.\(next, event\);\n\s+group!\.toggle\(value!, next, event\);/g, replace: 'group!.toggle(value!, next, event);\n      onchange?.(next, event);' },
  { id: 'cb-name-priority', description: 'the own name wins over the group name', pattern: /group\?\.name \?\? name/g, replace: 'name ?? group?.name' },
  { id: 'cb-disabled-group', description: 'the group disabled does not apply', pattern: /disabled \|\| Boolean\(group\?\.disabled\)/g, replace: 'disabled' },
  { id: 'cb-default-value', description: "the input has no default value", pattern: /value \?\? 'on'/g, replace: 'value' },
  { id: 'cb-member-ignore', description: 'a checkbox with a value is not a member', pattern: /if \(value !== undefined\) return true;/g, replace: 'if (value !== undefined) return false;' },
  { id: 'cb-throw-type', description: 'TypeError → Error', pattern: /new TypeError\(/g, replace: 'new Error(' },
  { id: 'cb-group-checked', description: 'a member ignores the group value', pattern: /member \? group!\.isChecked\(value!\) : Boolean\(checked\)/g, replace: 'Boolean(checked)' },
  { id: 'cb-boolean-coerce', description: 'drop Boolean(checked)', pattern: /Boolean\(checked\)/g, replace: 'checked' },
  { id: 'cb-style-order', description: 'styles.root before style', pattern: /styleText\(group\?\.styles\?\.item, customStyle, styles\?\.root\)/g, replace: 'styleText(styles?.root, customStyle, group?.styles?.item)' },
  { id: 'cb-style-group-item', description: 'the group item style is dropped', pattern: /styleText\(group\?\.styles\?\.item, /g, replace: 'styleText(' },
  { id: 'cb-class-group-item', description: 'the group item class is dropped', pattern: /,\n\s+group\?\.classNames\?\.item\n/g, replace: '\n' },
  { id: 'cb-class', description: 'corrupt a Checkbox class name', pattern: /'ads-checkbox(-[\w-]+)?'/g, replace: (m) => m[0].replace(/'$/, "-x'") },
  { id: 'cb-type', description: 'type checkbox → radio', pattern: /type="checkbox"/g, replace: 'type="radio"' },
  { id: 'cb-drop-focus-options', description: 'focus() ignores its options', pattern: /input\?\.focus\(options\)/g, replace: 'input?.focus()' },
  { id: 'cb-drop-blur', description: 'blur() does nothing', pattern: /input\?\.blur\(\);/g, replace: ';' },
  { id: 'cb-unregister', description: 'a destroyed checkbox stays registered', pattern: /registered = registered\.filter\(\(other\) => other !== read\);/g, replace: '' },
  { id: 'cb-register-order', description: 'a mounted checkbox is registered first', pattern: /registered = \[\.\.\.registered, read\];/g, replace: 'registered = [read, ...registered];' },
  { id: 'cb-toggle-remove', description: 'unchecking does not remove the value', pattern: /: current\.filter\(\(other\) => other !== item\);/g, replace: ': current;' },
  { id: 'cb-toggle-dedupe', description: 'checking adds a duplicate', pattern: /current\.includes\(item\)\n\s+\? current\n\s+: \[\.\.\.current, item\]/g, replace: '[...current, item]' },
  { id: 'cb-sort-drop', description: 'the value is not put in order', pattern: /const ordered = sorted\(next\);/g, replace: 'const ordered = next;' },
  { id: 'cb-unknown-first', description: 'unknown values go first', pattern: /return \[\.\.\.known, \.\.\.unknown\];/g, replace: 'return [...unknown, ...known];' },
  { id: 'cb-order-options', description: 'the order ignores the options', pattern: /if \(hasOptions\) return normalized\.findIndex\(\(option\) => option\.value === item\);/g, replace: '' },
  { id: 'cb-drop-group-onchange', description: 'the group does not call onchange', pattern: /onchange\?\.\(ordered, event\);/g, replace: '' },
  { id: 'cb-drop-group-assign', description: 'the group does not assign value', pattern: /value = ordered;/g, replace: '' },
  { id: 'cb-role', description: 'role group → list', pattern: /role="group"/g, replace: 'role="list"' },
  { id: 'cb-option-string', description: 'a plain option has no label', pattern: /label: String\(option\)/g, replace: "label: ''" },
  { id: 'cb-reset-checked', description: 'a form reset leaves the checked state as the browser reset it', pattern: /input\.checked = isChecked;/g, replace: '' },
  { id: 'cb-reset-listener', description: 'the reset listener is never removed', pattern: /return \(\) => form\.removeEventListener\('reset', restore\);/g, replace: '' },
  { id: 'cb-reset-no-form', description: 'a checkbox outside a form also listens', pattern: /if \(!form\) return;/g, replace: '' },
  { id: 'cb-reset-unmounted', description: 'restore runs on an unmounted checkbox', pattern: /if \(!input\) return;/g, replace: '' },
  { id: 'cb-has-options', description: 'empty options also hide the children', pattern: /normalized\.length > 0/g, replace: 'options !== undefined' }
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
    [
      'vitest',
      'run',
      '--coverage.enabled=false',
      '--bail',
      '1',
      ...(component === 'Button' && file === 'Button' ? [] : testFiles)
    ],
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
  JSON.stringify({ target: `src/lib/${component}/${file}.svelte`, score, killed, survived, invalid, results }, null, 2)
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
