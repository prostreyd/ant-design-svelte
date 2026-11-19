// The workflow `Screen reader` (.github/workflows/screen-reader.yml) runs Orca, a real screen reader, about nine minutes a run. It
// starts when what the speech depends on changes, and once a week by itself: Orca, Firefox, the Ubuntu image and the packages of
// the screen reader change without a commit of ours. These tests keep the paths in step with what the build of the fixtures reads,
// keep the weekly run, and keep the workflow in the gate of a release (the owner, 2026-11-20: a release is published only after
// the screen reader passed for its commit).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const read = (file: string) => readFileSync(join(root, file), 'utf8');
// The comments of the file explain why; only the lines count.
const workflow = read('.github/workflows/screen-reader.yml').replace(/^\s*#.*$/gm, '');
const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));

/** The lines of one trigger (`push`, `pull_request`, ...) inside the `on:` block: from its name to the next trigger. */
function trigger(name: string): string {
  const start = triggers.search(new RegExp(`^  ${name}:`, 'm'));
  expect(start, `the trigger ${name}`).toBeGreaterThanOrEqual(0);
  const rest = triggers.slice(start + 1);
  const next = rest.slice(rest.indexOf('\n')).search(/^  \w/m);
  return next < 0 ? rest : rest.slice(0, rest.indexOf('\n') + next);
}

const pathsOf = (name: string) => [...trigger(name).matchAll(/^\s+-\s*'([^']+)'\s*$/gm)].map((match) => match[1]);

/** Whether a path of the repository is matched by a pattern of a workflow (`**` any depth, `*` inside a name). */
const matches = (pattern: string, path: string) =>
  new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`).test(path);
const covered = (paths: string[], file: string) => paths.some((pattern) => matches(pattern, file));

describe('the paths that start the Screen reader workflow', () => {
  const push = pathsOf('push');

  it('a push to main and a pull request use the same list', () => {
    expect(push.length).toBeGreaterThan(0);
    expect(pathsOf('pull_request')).toEqual(push);
  });

  it('everything the build of the fixtures and the tests read starts it', () => {
    const files = [
      'src/lib/Form/Form.svelte',
      'src/lib/tokens.css',
      'src/lib/internal/popup/Popup.svelte',
      'e2e/fixtures/main.ts',
      'e2e/fixtures/FormLab.svelte',
      'screen-reader/form.spec.ts',
      'screen-reader/package-lock.json',
      'vite.e2e.config.ts',
      'svelte.config.js',
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      '.github/workflows/screen-reader.yml'
    ];
    for (const file of files) expect(covered(push, file), file).toBe(true);
  });

  it('the build of the fixtures still reads only what the paths name (a new input has to get a path)', () => {
    const config = read('vite.e2e.config.ts');
    const inputs = [...config.matchAll(/(?:root:\s*|new URL\()'(\.\/)?([^']+)'/g)].map((match) => match[2]).sort();
    expect(inputs).toEqual(['e2e/fixtures', 'src/lib', 'svelte.config.js']);
  });

  it('a push that only touches documentation, specifications, rules or the docs site does not start it', () => {
    const files = ['README.md', 'CHANGELOG.md', 'specs/form.md', 'ai/CLAUDE.md', 'docs/src/docs/pages.ts', 'docs/e2e/site.spec.ts', 'tests/Form.test.ts'];
    for (const file of files) expect(covered(push, file), file).toBe(false);
  });

  it('the matcher of these tests tells a folder from a name', () => {
    expect(matches('src/lib/**', 'src/lib/a/b.svelte')).toBe(true);
    expect(matches('src/lib/**', 'src/library/a.ts')).toBe(false);
    expect(matches('tsconfig*.json', 'tsconfig.docs.json')).toBe(true);
    expect(matches('tsconfig*.json', 'sub/tsconfig.json')).toBe(false);
  });
});

describe('the weekly run of the Screen reader workflow', () => {
  const schedule = trigger('schedule');
  const crons = [...schedule.matchAll(/^\s+-\s*cron:\s*'([^']+)'\s*$/gm)].map((match) => match[1]);

  it('has one schedule: a fixed minute and hour, any day of the month, any month, one day of the week', () => {
    expect(crons).toHaveLength(1);
    expect(crons[0]).toMatch(/^\d{1,2} \d{1,2} \* \* [0-6]$/);
  });

  it('can still be started by hand, and a push is limited to main', () => {
    expect(triggers).toMatch(/^ {2}workflow_dispatch:/m);
    expect(trigger('push')).toMatch(/branches:\s*\[main\]/);
  });
});

describe('the Screen reader workflow is part of the gate of a release', () => {
  it('it can be called by the publish workflow', () => {
    expect(triggers).toMatch(/^ {2}workflow_call:/m);
  });

  it('the publish workflow waits for it through the gate and runs it itself when the commit has no run', () => {
    const publish = read('.github/workflows/publish.yml').replace(/^\s*#.*$/gm, '');
    expect(publish).toMatch(/uses:\s*\.\/\.github\/workflows\/screen-reader\.yml/);
    expect(read('scripts/release-gate.mjs')).toMatch(/file:\s*'screen-reader\.yml'/);
  });
});
