// The server render of Icon (specs/icon.md, I7): no document and no browser API, and the markup is the markup of a browser
// render. The components are rendered in a process of their own (tests/helpers/renderOnServer.mjs), as a SvelteKit server
// does: the data package is loaded by Node itself there, which is what the deep `es/` imports of the package could not do.
import { render } from '@testing-library/svelte';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import IconHarness from './fixtures/IconHarness.svelte';

const root = join(import.meta.dirname, '..');
const harness = 'tests/fixtures/IconHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

/** The elements only, in a canonical form: no hydration comments, attributes sorted, the order of a `style` list kept. */
function normalized(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html.replace(/<!--.*?-->/g, '');
  for (const element of host.querySelectorAll('*')) {
    const attributes = [...element.attributes].map((attribute) => [attribute.name, attribute.value] as const);
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes.sort(([x], [y]) => x.localeCompare(y))) {
      element.setAttribute(name, name === 'style' ? value.replace(/;\s*$/, '') : value);
    }
  }
  return host.innerHTML;
}

const scenes = [
  'outlined',
  'ready component',
  'two-tone',
  'two-tone with a color',
  'two-tone with a pair',
  'spin, rotate, class and style',
  'loading',
  'label',
  'decorative',
  'custom component',
  'children',
  'iconfont'
];

describe('Icon on the server', () => {
  const server = renderOnServer(scenes.map((scene) => ({ file: harness, props: { scene } })));

  it.each(scenes.map((scene, index) => [scene, index] as const))('I7: %s: the server markup is the client markup', (scene, index) => {
    const { container } = render(IconHarness, { props: { scene } });
    expect(server[index].length).toBeGreaterThan(20);
    expect(normalized(server[index])).toBe(normalized(container.innerHTML));
  });

  it('I7: a drawing is rendered on the server with its paths, its name and no browser API', () => {
    const html = server[scenes.indexOf('outlined')];
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="star"');
    expect(html).toContain('data-icon="star"');
    expect(html).toContain('<path');
  });

  it('I10: an iconfont icon is rendered on the server without a document, and its shared class is applied', () => {
    const html = server[scenes.indexOf('iconfont')];
    expect(html).toContain('<use xlink:href="#icon-tuichu"');
    // The prerender crawler of SvelteKit takes every `href` for a link; a symbol reference must not be one.
    expect(html).not.toMatch(/\shref=/);
    expect(html).toContain('shared');
    expect(html).toContain('ads-icon-spin');
  });
});
