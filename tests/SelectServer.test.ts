// The server render of a Select: nothing here has a document, a layout or an effect. The components are rendered in
// a process of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays what it is.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const markup = 'tests/fixtures/SelectMarkupHarness.svelte';
const select = 'src/lib/Select/Select.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

describe('Select on the server', () => {
  const [byProp, byMarkup, byOrder, searching] = renderOnServer([
    { file: select, props: { 'aria-label': 'L', options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }], value: 'b' } },
    { file: markup, props: { 'aria-label': 'L', value: 'c' } },
    { file: markup, props: { 'aria-label': 'L', value: 'd', showMiddle: true } },
    { file: select, props: { 'aria-label': 'L', options: ['x', 'y'], value: 'y', showSearch: true } }
  ]);

  it('the label of the initial value is in the HTML, for options given as a prop', () => {
    expect(byProp).toContain('Beta');
    expect(byProp).toContain('role="combobox"');
    expect(byProp).not.toContain('role="listbox"');
  });

  it('the label of the initial value is in the HTML, for options written as markup', () => {
    expect(byMarkup).toContain('Option C');
    expect(byMarkup).toContain('ads-select-registry');
  });

  it('the options written as markup are in a hidden area before the field', () => {
    expect(byOrder.indexOf('ads-select-registry')).toBeLessThan(byOrder.indexOf('ads-select '));
    expect(byOrder).toContain('Option D');
  });

  it('a field with a search input renders its input, with the selected text for assistive technology', () => {
    expect(searching).toContain('<input');
    expect(searching).toContain('aria-autocomplete="list"');
    expect(searching).toMatch(/aria-describedby="[^"]+"/);
  });
});
