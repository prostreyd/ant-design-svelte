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

// The two e2e jobs run once for every engine, at the same time, so a run takes the time of one engine and not of three
// (2026-11-19: 16 and 26 minutes one after the other, about a third of that apart).
describe('the e2e jobs of the CI go by engine', () => {
  const steps = ci.replace(/^\s*#.*$/gm, '');
  const matrix = [...steps.matchAll(/^\s+engine:\s*\[([^\]]*)\]\s*$/gm)].map((match) => match[1].split(',').map((name) => name.trim()));
  const configured = (file: string) => [...readFileSync(join(root, file), 'utf8').matchAll(/name:\s*'(\w+)'/g)].map((match) => match[1]);

  it('the library job and the site job each have a matrix of the engines', () => {
    expect(matrix).toHaveLength(2);
  });

  it('the matrix lists every project of the Playwright config of its job, so no engine is left out of the CI', () => {
    expect(matrix[0]).toEqual(configured('playwright.config.ts'));
    expect(matrix[1]).toEqual(configured('docs/playwright.config.ts'));
  });

  it('each job gives its engine to Playwright, and a failed job keeps its report under its own name', () => {
    expect(steps.match(/--project=\$\{\{ matrix\.engine \}\}/g) ?? []).toHaveLength(2);
    expect(steps.match(/name: playwright-test-results-(library|site)-\$\{\{ matrix\.engine \}\}/g) ?? []).toHaveLength(2);
  });

  it('an engine that fails does not stop the other engines', () => {
    expect(steps.match(/fail-fast:\s*false/g) ?? []).toHaveLength(2);
  });
});
