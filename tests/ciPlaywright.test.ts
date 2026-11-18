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

  it('the host of every job is the pinned Ubuntu 24.04 runner, not a moving label', () => {
    const hosts = [...ci.matchAll(/^\s+runs-on:\s*(\S+)\s*$/gm)].map((match) => match[1]);
    expect(hosts).toHaveLength(3);
    for (const host of hosts) expect(host).toBe('ubuntu-24.04');
  });
});
