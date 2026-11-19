// The server render of a Form: nothing here has a document, a layout or an effect. The components are rendered in a
// process of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays what it is. This is
// also where the validation library is loaded by a Node process: the server build of a site must be able to import it.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const harness = 'tests/fixtures/FormHarness.svelte';
const plain = 'tests/fixtures/FormPlainHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

describe('Form on the server', () => {
  const [basic, initial, vertical, unnamed] = renderOnServer([
    { file: harness, props: {} },
    { file: harness, props: { formProps: { initialValues: { username: 'ann', remember: false } } } },
    { file: plain, props: { formProps: { layout: 'vertical' }, itemProps: { tooltip: 'Tip', extra: 'Hint' } } },
    { file: harness, props: { formProps: { name: undefined } } }
  ]);

  it('draws the <form>, the label, the control and the required mark', () => {
    expect(basic).toContain('<form');
    expect(basic).toContain('novalidate');
    expect(basic).toContain('ads-form-horizontal');
    expect(basic).toContain('<label');
    expect(basic).toContain('for="t_username"');
    expect(basic).toContain('aria-required="true"');
    expect(basic).toContain('aria-labelledby="t_username_label"');
  });

  it('the star and the colon are aria-hidden elements in the markup', () => {
    expect(basic).toMatch(/<span class="ads-form-item-mark[^"]*" aria-hidden="true">\*<\/span>/);
    expect(basic).toMatch(/<span class="ads-form-item-colon[^"]*" aria-hidden="true">:<\/span>/);
  });

  it('the initial values are in the HTML, so the first paint already shows them', () => {
    expect(initial).toContain('value="ann"');
  });

  it('draws no message and no live region before anything is validated, but keeps the area the ids point to', () => {
    expect(basic).toContain('id="t_username_help"');
    expect(basic).not.toContain('ads-form-item-help-item');
    expect(basic).not.toContain('aria-live');
    expect(basic).not.toContain('aria-invalid');
  });

  it('the layout, the tooltip button and the extra hint are in the HTML', () => {
    expect(vertical).toContain('ads-form-vertical');
    expect(vertical).toContain('aria-label="More information"');
    expect(vertical).toContain('Hint');
  });

  it('a form without a name gets an id from Svelte, the same for the label and the control', () => {
    const label = /for="([^"]+_username)"/.exec(unnamed)?.[1];
    expect(label).toBeDefined();
    expect(unnamed).toContain(`id="${label}"`);
  });
});

describe('Form with a model on the server (MODEL-12, FRULES-2)', () => {
  const [plainModel, withRules] = renderOnServer([
    { file: 'tests/fixtures/FormModelServerHarness.svelte', props: {} },
    { file: 'tests/fixtures/FormModelServerHarness.svelte', props: { rules: { username: [{ required: true }] } } }
  ]);

  it('draws the values of the consumer\'s own state, nested ones too', () => {
    expect(plainModel).toContain('value="from the model"');
    expect(plainModel).toContain('value="Bishkek"');
  });

  it('a required rule given to the Form by name gives the mark and aria-required', () => {
    expect(plainModel).not.toContain('aria-required');
    expect(withRules).toContain('aria-required="true"');
    expect(withRules).toMatch(/<span class="ads-form-item-mark[^"]*" aria-hidden="true">\*<\/span>/);
  });
});
