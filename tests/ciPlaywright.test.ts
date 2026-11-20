// The two e2e jobs of the CI run in the official image of Playwright (.github/workflows/ci.yml): the browsers and their system
// packages are in the image, so a job downloads and installs nothing (on 2026-11-18 the `apt` of `playwright install --with-deps`
// timed out in every e2e job). The image carries the browsers of one exact version of Playwright, and the tests use the Playwright
// of package-lock.json: when the two differ, the tests look for browsers that are not there. These tests keep them together.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
  packages: Record<string, { version: string }>;
};
const playwright = lock.packages['node_modules/playwright'].version;
const playwrightTest = lock.packages['node_modules/@playwright/test'].version;
const images = [...ci.matchAll(/^\s+image:\s*(mcr\.microsoft\.com\/playwright:\S+)\s*$/gm)].map((match) => match[1]);

describe('the Playwright image of the CI', () => {
  it('the library and the site e2e jobs both run in it', () => {
    expect(images).toHaveLength(2);
  });

  it('its tag is the version of Playwright in package-lock.json, on Ubuntu 24.04 (noble)', () => {
    for (const image of images) expect(image).toBe(`mcr.microsoft.com/playwright:v${playwright}-noble`);
  });

  it('Playwright and @playwright/test are one version', () => {
    expect(playwrightTest).toBe(playwright);
  });

  it('the jobs install no browsers and no system packages themselves', () => {
    // The comments of the file explain why; only the steps count.
    const steps = ci.replace(/^\s*#.*$/gm, '');
    expect(steps).not.toMatch(/playwright install/);
    expect(steps).not.toMatch(/apt-get|apt install/);
  });

  it('the steps that run Playwright set HOME=/root, or Firefox does not start in a container job', () => {
    const steps = ci.replace(/^\s*#.*$/gm, '');
    expect(steps.match(/^\s+HOME:\s*\/root\s*$/gm) ?? []).toHaveLength(2);
  });

  it('the host of every job is the pinned Ubuntu 24.04 runner, not a moving label', () => {
    const hosts = [...ci.matchAll(/^\s+runs-on:\s*(\S+)\s*$/gm)].map((match) => match[1]);
    expect(hosts).toHaveLength(3);
    for (const host of hosts) expect(host).toBe('ubuntu-24.04');
  });
});

// The two e2e jobs run once for every engine, at the same time, so a run takes the time of one part and not of all of them
// (2026-11-19: 16 and 26 minutes one after the other, about a third of that apart). Firefox and WebKit are the slowest engines, so
// both jobs cut them in two parts (`--shard`): the site since 2026-11-19, the library since 2026-11-20, when its jobs took 13, 19
// and more than 25 minutes for a while and Firefox was stopped by the limit.
describe('the e2e jobs of the CI go by engine', () => {
  const steps = ci.replace(/^\s*#.*$/gm, '');
  const configured = (file: string) => [...readFileSync(join(root, file), 'utf8').matchAll(/name:\s*'(\w+)'/g)].map((match) => match[1]);
  // The text of every job of the workflow, by its name: a job starts at its key (two spaces) and goes to the next one.
  const jobs = new Map<string, string>();
  for (const part of steps.split(/\n(?=  [a-z][\w-]*:\s*\n)/)) {
    const key = /^\s*([a-z][\w-]*):/.exec(part)?.[1];
    if (key) jobs.set(key, part);
  }
  // One `{ engine, shard }` line per part in the `include:` of the matrix of a job.
  const partsOf = (job: string) =>
    [...(jobs.get(job) ?? '').matchAll(/^\s+-\s*\{\s*engine:\s*(\w+),\s*shard:\s*(\d+)\/(\d+)\s*\}\s*$/gm)].map((match) => ({ engine: match[1], part: Number(match[2]), parts: Number(match[3]) }));
  const library = partsOf('e2e-library');
  const site = partsOf('e2e-site');
  const enginesOf = (entries: { engine: string }[]) => [...new Set(entries.map((entry) => entry.engine))];

  it('both e2e jobs have a list of parts', () => {
    expect(jobs.has('e2e-library')).toBe(true);
    expect(jobs.has('e2e-site')).toBe(true);
    expect(library.length).toBeGreaterThan(0);
    expect(site.length).toBeGreaterThan(0);
  });

  it('the matrices list every project of the Playwright config of their job, so no engine is left out of the CI', () => {
    expect(enginesOf(library)).toEqual(configured('playwright.config.ts'));
    expect(enginesOf(site)).toEqual(configured('docs/playwright.config.ts'));
  });

  it.each([
    ['the library', library],
    ['the site', site]
  ])('the parts of each engine of %s are complete: 1 to n of n, each once (a missing part leaves tests out of the run)', (_name, entries) => {
    for (const engine of enginesOf(entries)) {
      const mine = entries.filter((entry) => entry.engine === engine);
      const parts = mine[0].parts;
      expect(
        mine.every((entry) => entry.parts === parts),
        `${engine}: one number of parts`
      ).toBe(true);
      expect(mine.map((entry) => entry.part).sort(), `${engine}: the parts`).toEqual(Array.from({ length: parts }, (_, index) => index + 1));
    }
  });

  it.each([
    ['the library', library],
    ['the site', site]
  ])('Firefox and WebKit of %s are cut in parts, the quickest engine is not', (_name, entries) => {
    const partsOfEngine = (engine: string) => entries.find((entry) => entry.engine === engine)?.parts;
    expect(partsOfEngine('firefox')).toBeGreaterThan(1);
    expect(partsOfEngine('webkit')).toBeGreaterThan(1);
  });

  it('each job gives its engine and its part to Playwright, and a failed job keeps its report under its own name', () => {
    expect(steps.match(/--project=\$\{\{ matrix\.engine \}\}/g) ?? []).toHaveLength(2);
    expect(steps.match(/--shard=\$\{\{ matrix\.shard \}\}/g) ?? []).toHaveLength(2);
    // Two parts of one engine must not write the same artifact: the number of the job is in the name.
    expect(steps.match(/name: playwright-test-results-library-\$\{\{ matrix\.engine \}\}-\$\{\{ strategy\.job-index \}\}\s*$/gm) ?? []).toHaveLength(1);
    expect(steps.match(/name: playwright-test-results-site-\$\{\{ matrix\.engine \}\}-\$\{\{ strategy\.job-index \}\}\s*$/gm) ?? []).toHaveLength(1);
  });

  it('the name of each job shows its engine and its part', () => {
    expect(jobs.get('e2e-library')).toMatch(/name: e2e-library \(\$\{\{ matrix\.engine \}\} \$\{\{ matrix\.shard \}\}\)/);
    expect(jobs.get('e2e-site')).toMatch(/name: e2e-site \(\$\{\{ matrix\.engine \}\} \$\{\{ matrix\.shard \}\}\)/);
  });

  it('an engine or a part that fails does not stop the others', () => {
    expect(steps.match(/fail-fast:\s*false/g) ?? []).toHaveLength(2);
  });
});
