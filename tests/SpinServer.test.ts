// The server render of Spin: no document, no layout, no effect, so no timer runs. The components are rendered in a
// process of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays what it is.
import { render } from '@testing-library/svelte';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import SpinHarness from './fixtures/SpinHarness.svelte';

const root = join(import.meta.dirname, '..');
const harness = 'tests/fixtures/SpinHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

/**
 * The elements only, in a canonical form. The comments that Svelte writes for hydration are not part of the markup that
 * is compared; the order of the attributes differs between the server and the client, so they are sorted; and the
 * generated ids (the server and a plain client render count them differently) are replaced.
 */
function normalized(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html.replace(/<!--.*?-->/g, '');
  for (const element of host.querySelectorAll('*')) {
    const attributes = [...element.attributes].map((attribute) => [attribute.name, attribute.value] as const);
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes.sort(([x], [y]) => x.localeCompare(y))) {
      const canonical = name === 'id' || name === 'aria-labelledby' ? '#' : name === 'style' ? value.replace(/;\s*$/, '') : value;
      element.setAttribute(name, canonical);
    }
  }
  return host.innerHTML;
}

const scenes: Record<string, Record<string, unknown>> = {
  standalone: { description: 'Loading' },
  small: { size: 'small', 'aria-label': 'Saving' },
  embedded: { content: 'text', description: 'Loading' },
  'embedded, not spinning': { content: 'text', spinning: false },
  'a delay that has not passed': { delay: 500, description: 'Loading' },
  'embedded, a delay that has not passed': { content: 'text', delay: 500, description: 'Loading' },
  fullscreen: { fullscreen: true, description: 'Loading' },
  'ring with a number': { percent: 40, description: 'Uploading' },
  'ring, indeterminate': { percent: 'auto', 'aria-label': 'Uploading' },
  'not spinning': { spinning: false }
};

describe('Spin on the server', () => {
  const names = Object.keys(scenes);
  const server = renderOnServer(names.map((name) => ({ file: harness, props: scenes[name] })));

  it.each(names.map((name, index) => [name, index] as const))(
    'SPN-23: %s: the server markup is the client markup',
    (name, index) => {
      const { container } = render(SpinHarness, { props: scenes[name] as never });
      expect(normalized(server[index])).toBe(normalized(container.innerHTML));
    }
  );

  it('SPN-23: a delay that has not passed renders no indicator on the server (no flash, no mismatch)', () => {
    const index = names.indexOf('a delay that has not passed');
    expect(server[index]).not.toContain('ads-spin');
    const embedded = server[names.indexOf('embedded, a delay that has not passed')];
    expect(embedded).toContain('ads-spin-container');
    expect(embedded).not.toContain('ads-spin-section');
    expect(embedded).not.toContain('aria-busy');
  });

  it('SPN-23: an embedded Spin that is spinning is busy in the server markup, so the first paint is already dimmed', () => {
    const html = server[names.indexOf('embedded')];
    expect(html).toContain('ads-spin-container-busy');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
  });
});
