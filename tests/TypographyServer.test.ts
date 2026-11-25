// The server render of Typography: no document, no layout, no effect, so nothing is measured and nothing is copied. The
// components are rendered in a process of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays
// what it is.
import { render } from '@testing-library/svelte';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import TypographyHarness from './fixtures/TypographyHarness.svelte';

const root = join(import.meta.dirname, '..');
const harness = 'tests/fixtures/TypographyHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

/**
 * The elements only, in a canonical form (see SpinServer.test.ts). Svelte's scoping class (`svelte-…`) is dropped too: the test
 * pipeline (vitest) and the plain Vite server of the helper compile the styles differently, so they scope different elements; one
 * pipeline compiles both sides in a real build.
 */
function normalized(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html.replace(/<!--.*?-->/g, '');
  for (const element of host.querySelectorAll('*')) {
    const attributes = [...element.attributes].map((attribute) => [attribute.name, attribute.value] as const);
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes.sort(([x], [y]) => x.localeCompare(y))) {
      const canonical =
        name === 'id' || name === 'aria-labelledby' || name === 'aria-describedby'
          ? '#'
          : name === 'style'
            ? value
                .replace(/\s*:\s*/g, ':')
                .replace(/\s*;\s*/g, ';')
                .replace(/;$/, '')
                // jsdom writes the prefixed line clamp back as its shorthand.
                .replace(/(?<![\w-])line-clamp:(\d+) -webkit-legacy/g, '-webkit-line-clamp:$1')
            : name === 'class'
              ? value.replace(/\s*\bsvelte-[a-z0-9]+\b/g, '').trim()
              : value;
      if (name === 'class' && canonical === '') continue;
      element.setAttribute(name, canonical);
    }
  }
  return host.innerHTML;
}

const LONG = 'word '.repeat(60).trim();
const scenes: Record<string, Record<string, unknown>> = {
  paragraph: { text: 'Hello' },
  title: { kind: 'title', text: 'Heading', props: { level: 3 } },
  'text with styles': { kind: 'text', text: 'Hello', props: { strong: true, code: true, type: 'danger' } },
  link: { kind: 'link', text: 'Go', props: { href: '/x', target: '_blank' } },
  'disabled link': { kind: 'link', text: 'Go', props: { href: '/x', disabled: true } },
  copyable: { text: 'Hello', props: { copyable: true } },
  editable: { text: 'Hello', props: { editable: true } },
  'editable, open from the start': { text: 'Hello', props: { editable: true, editing: true } },
  'one row in CSS': { text: LONG, props: { ellipsis: true, copyable: true } },
  'rows in CSS': { text: LONG, props: { ellipsis: { rows: 3 } } },
  'script cut, before the first measurement': { text: LONG, asContent: true, props: { ellipsis: { rows: 2, expandable: true, suffix: '--Ant' } } },
  'script cut with a child': { text: LONG, props: { ellipsis: { rows: 2, expandable: 'collapsible' }, copyable: true } },
  'a tip on the text': { text: LONG, props: { ellipsis: { tooltip: true } } },
  shimmer: { kind: 'text', text: 'Thinking', props: { shimmer: { duration: [2, 1] } } }
};

describe('Typography on the server', () => {
  const names = Object.keys(scenes);
  const server = renderOnServer(names.map((name) => ({ file: harness, props: scenes[name] })));

  // The parts that are cut by script are measured in an effect, so their client markup a moment after the mount differs from the
  // server's by design; the tests below cover their server markup.
  const measured = (name: string) => name.startsWith('script cut');

  it.each(names.map((name, index) => [name, index] as const).filter(([name]) => !measured(name)))(
    'TYP-41: %s: the server markup is the client markup',
    (name, index) => {
      const { container } = render(TypographyHarness, { props: scenes[name] as never });
      expect(normalized(server[index])).toBe(normalized(container.innerHTML));
    }
  );

  it('TYP-41: a part that is cut by script is drawn whole and clamped before it is measured, with no button that is not needed yet', () => {
    const html = server[names.indexOf('script cut, before the first measurement')];
    expect(html).toContain('ads-typography-pending');
    expect(html).not.toContain('ads-typography-sr');
    expect(html).not.toContain('ads-typography-suffix');
    expect(html).toContain(LONG);
    expect(html).toMatch(/<span class="ads-typography-actions[^"]*" hidden/);
  });

  it('TYP-41: the copy state, the cut state and the field are not on the server', () => {
    const html = server[names.indexOf('copyable')];
    expect(html).toContain('aria-label="Copy"');
    expect(html).not.toContain('Copied</');
    expect(server[names.indexOf('one row in CSS')]).toContain('ads-typography-single');
    expect(server[names.indexOf('shimmer')]).toContain('aria-busy="true"');
  });
});
