// The workflows that publish (.github/workflows/publish.yml, pages.yml). A release is published to npm only after the tests passed for the
// exact commit of the tag (the owner, 2026-11-20): CI and the screen reader, waited for when GitHub already ran them for the commit, run
// by publish.yml itself when it has not. The documentation site is built after a green CI on main and does not wait for a release.
// These tests keep what npm Trusted Publishing trusts (the file name, the environment, the one job that may publish) and the
// conditions of the stages, because a loosened `if` would let a commit that was not tested out, and nothing else would notice.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
// The comments of a file explain why; only the lines count.
const read = (file: string) => readFileSync(join(root, file), 'utf8').replace(/^\s*#.*$/gm, '');

/** The text of each job of a workflow: from `  name:` to the next job. */
function jobsOf(text: string): Record<string, string> {
  const body = text.slice(text.search(/^jobs:\s*$/m) + 'jobs:'.length);
  const parts = body.split(/^ {2}([\w-]+):\s*$/m);
  const jobs: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) jobs[parts[i]] = parts[i + 1];
  return jobs;
}

const publishText = read('.github/workflows/publish.yml');
const publish = jobsOf(publishText);
const needsOf = (job: string) => [...(job.match(/^ {4}needs:\s*(.+)$/m)?.[1].matchAll(/[\w-]+/g) ?? [])].map((match) => match[0]);

describe('the publish workflow keeps what npm Trusted Publishing trusts', () => {
  it('is started by a version tag and by nothing else', () => {
    expect(publishText).toMatch(/^on:\n {2}push:\n {4}tags: \['v\*'\]\n/m);
    expect(publishText).not.toMatch(/branches:|workflow_dispatch|pull_request|schedule:/);
  });

  it('publishes in one job that has the environment `npm` and is the only one with `id-token: write`', () => {
    expect(publish.publish).toMatch(/^ {4}environment: npm\s*$/m);
    expect(publish.publish).toMatch(/id-token: write/);
    expect(publishText.match(/id-token:/g) ?? []).toHaveLength(1);
    expect(publishText.match(/npm publish/g)?.length).toBeGreaterThan(0);
    for (const [name, job] of Object.entries(publish)) if (name !== 'publish') expect(job, name).not.toMatch(/npm publish/);
  });

  it('the stages are the guard, the gate, the two workflows that may be run here, and the publication, in this order', () => {
    expect(Object.keys(publish)).toEqual(['guard', 'gate', 'ci', 'screen-reader', 'publish']);
  });
});

describe('nothing is published before the tests passed for the commit of the tag', () => {
  it('the guard comes first and the gate waits for it', () => {
    expect(needsOf(publish.gate)).toEqual(['guard']);
  });

  it('the gate reads the runs of the commit with the script that is tested, and may read the runs of the workflows (actions: read)', () => {
    expect(publish.gate).toMatch(/run: node scripts\/release-gate\.mjs/);
    expect(publish.gate).toMatch(/actions: read/);
    expect(publish.gate).toMatch(/ci: \$\{\{ steps\.gate\.outputs\.ci \}\}/);
    expect(publish.gate).toMatch(/orca: \$\{\{ steps\.gate\.outputs\.orca \}\}/);
  });

  it('a workflow with no run for the commit is run here, as a reusable workflow, and only then', () => {
    expect(needsOf(publish.ci)).toEqual(['gate']);
    expect(publish.ci).toMatch(/if: needs\.gate\.outputs\.ci == 'missing'/);
    expect(publish.ci).toMatch(/uses: \.\/\.github\/workflows\/ci\.yml/);
    expect(needsOf(publish['screen-reader'])).toEqual(['gate']);
    expect(publish['screen-reader']).toMatch(/if: needs\.gate\.outputs\.orca == 'missing'/);
    expect(publish['screen-reader']).toMatch(/uses: \.\/\.github\/workflows\/screen-reader\.yml/);
    expect(read('.github/workflows/ci.yml')).toMatch(/^ {2}workflow_call:/m);
    expect(read('.github/workflows/screen-reader.yml')).toMatch(/^ {2}workflow_call:/m);
  });

  it('the publication needs all four stages and runs only when the guard and the gate passed and the workflows run here passed or were not needed', () => {
    expect(needsOf(publish.publish).sort()).toEqual(['ci', 'gate', 'guard', 'screen-reader']);
    const condition = publish.publish.match(/^ {4}if: (.+)$/m)?.[1] ?? '';
    expect(condition).toContain('!cancelled()');
    expect(condition).toContain("needs.guard.result == 'success'");
    expect(condition).toContain("needs.gate.result == 'success'");
    expect(condition).toContain(`contains(fromJSON('["success","skipped"]'), needs.ci.result)`);
    expect(condition).toContain(`contains(fromJSON('["success","skipped"]'), needs.screen-reader.result)`);
    // `always()` and `failure()` would let it run after a red stage.
    expect(condition).not.toMatch(/always\(\)|failure\(\)/);
  });

  it('the gate and the fallbacks never run the publication, and the publication runs no e2e tests itself', () => {
    expect(publishText).not.toMatch(/test:e2e|playwright/);
  });
});

describe('the documentation site is built after a green CI on main', () => {
  const pagesText = read('.github/workflows/pages.yml');
  const pages = jobsOf(pagesText);

  it('starts when the CI workflow has completed on main, or by hand, and not by a push', () => {
    expect(pagesText).toMatch(/^on:\n {2}workflow_run:\n {4}workflows: \[CI\]\n {4}types: \[completed\]\n {4}branches: \[main\]\n {2}workflow_dispatch:/m);
    expect(pagesText).not.toMatch(/^ {2}push:/m);
  });

  it('builds only after a CI that is green (a manual run always builds), and deploys only after the build', () => {
    expect(pages.build).toMatch(/if: \$\{\{ github\.event_name == 'workflow_dispatch' \|\| github\.event\.workflow_run\.conclusion == 'success' \}\}/);
    expect(needsOf(pages.deploy)).toEqual(['build']);
  });

  it('builds the commit that the CI tested, not the latest of main', () => {
    expect(pages.build).toMatch(/ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  });

  it('is not part of the release: the publish workflow does not mention it', () => {
    expect(publishText).not.toMatch(/pages|deploy/i);
  });
});
