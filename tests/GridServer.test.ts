// The server render of Row and Col: nothing here has a document, a layout or an effect. The components are rendered in a
// process of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays what it is.
import { render } from '@testing-library/svelte';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import GridHarness from './fixtures/GridHarness.svelte';

const root = join(import.meta.dirname, '..');
const harness = 'tests/fixtures/GridHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

/**
 * The elements only. The comments that Svelte writes for hydration are not part of the markup that is compared, and a
 * `style` attribute is compared by its declarations (the server ends it with a semicolon, the DOM does not).
 */
const normalized = (html: string) => html.replace(/<!--.*?-->/g, '').replace(/;(\s*)"/g, '"');

const scenes: Record<string, { rowProps: Record<string, unknown>; cols: Record<string, unknown>[] }> = {
  plain: { rowProps: {}, cols: [{ span: 12 }, { span: 12 }] },
  gutter: { rowProps: { gutter: [16, { xs: 8, lg: 32 }], align: { md: 'middle' }, justify: 'space-between' }, cols: [{ span: 6, offset: 2 }, { xs: 24, md: { span: 6, push: 1 } }] },
  hidden: { rowProps: { wrap: false }, cols: [{ xs: 0, md: 8 }, { flex: '100px', xxxl: { span: 4, order: 2 } }] }
};

describe('Row and Col on the server', () => {
  const names = Object.keys(scenes);
  const server = renderOnServer(names.map((name) => ({ file: harness, props: scenes[name] })));

  it.each(names.map((name, index) => [name, index] as const))(
    'RES-4: %s: the server markup is the client markup, with the same inline style',
    (name, index) => {
      const { container } = render(GridHarness, { props: scenes[name] });
      expect(normalized(server[index])).toBe(normalized(container.innerHTML));
    }
  );

  it('the responsive values are in the HTML as custom properties: nothing depends on the screen in JavaScript', () => {
    const html = server[names.indexOf('gutter')];
    expect(html).toContain('--ads-row-gx-xs: 16px');
    expect(html).toContain('--ads-row-gy-lg: 32px');
    expect(html).toContain('--ads-col-span-md: 6');
  });

  it('a column hidden on a small screen is in the HTML (hidden by the stylesheet, not removed)', () => {
    const html = server[names.indexOf('hidden')];
    expect(html).toContain('--ads-col-d-xs: none');
    expect(html).toContain('--ads-col-d-md: block');
    expect(html).toContain('column 0');
  });

  it('a plain Row carries no inline style, and a Col only the values it was given', () => {
    const html = server[names.indexOf('plain')];
    const rowTag = /<div[^>]*class="ads-row[^>]*>/.exec(html)![0];
    expect(rowTag).not.toContain('style=');
    expect(html.match(/style="/g)).toHaveLength(2);
  });
});
