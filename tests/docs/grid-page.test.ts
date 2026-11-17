// The Grid page of the documentation site must say what Row, Col and Breakpoints really do.
// The API tables are data (docs/src/docs/data/grid.ts); these tests compare them with the sources.
// There is no method table and no token table on this page: Row and Col have no methods and the grid draws nothing.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { breakpointsRows, colApiRows, constantRows, demos, rowApiRows, sizeRows } from '../../docs/src/docs/data/grid';
import { BREAKPOINT_NAMES, BREAKPOINTS } from '../../src/lib/Grid/constants';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const rowSource = read('src/lib/Grid/Row.svelte');
const colSource = read('src/lib/Grid/Col.svelte');
const typesSource = read('src/lib/Grid/types.ts');
const breakpointsSource = read('src/lib/Grid/Breakpoints.ts');
const tokensCss = read('src/lib/tokens.css');

const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
const documented = (rows: { name: string }[]) => rows.filter((row) => row.name !== 'native attributes').map((row) => row.name);

/** Property names of the props type (`RowProps`, `ColProps`) of a component. */
function declaredProps(source: string, type: string, file: string): string[] {
  const body = new RegExp(`type ${type} = [\\s\\S]*?& \\{([\\s\\S]*?)\\n {2}\\};`).exec(source)?.[1];
  expect(body, `${type} block not found in ${file}`).toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values written in the `$props()` destructuring of the component. */
function declaredDefaults(source: string, type: string, file: string): Map<string, string> {
  const body = new RegExp(`let \\{([\\s\\S]*?)\\}: ${type} = \\$props\\(\\);`).exec(source)?.[1];
  expect(body, `$props() destructuring not found in ${file}`).toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim()]));
}

describe('Grid page: the Row table', () => {
  it('documents every property of Row and nothing else', () => {
    expect(documented(rowApiRows).sort()).toEqual(declaredProps(rowSource, 'RowProps', 'Row.svelte').sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documented(rowApiRows)).size).toBe(documented(rowApiRows).length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults(rowSource, 'RowProps', 'Row.svelte');
    // The defaults of align, justify and gutter are in the stylesheet (a Row that does not set them carries no inline
    // style), so the destructuring has none and the table states them.
    const inStylesheet: Record<string, string> = { align: "'top'", justify: "'start'", gutter: '0' };
    for (const row of rowApiRows.filter((r) => r.name !== 'native attributes')) {
      it(`${row.name}: the default column matches the component`, () => {
        const declared = defaults.get(row.name);
        expect(row.default).toBe(inStylesheet[row.name] ?? declared ?? '—');
      });
    }

    it('the defaults of the stylesheet are really there: flex-start twice and a zero gap', () => {
      expect(rowSource).toContain('--ads-row-align-xs, flex-start');
      expect(rowSource).toContain('--ads-row-justify-xs, flex-start');
      expect(rowSource).toContain('--ads-row-gx-xs, 0px');
    });
  });

  describe('allowed values', () => {
    it('align: the type column and the documented values are the ones of RowAlign', () => {
      const declared = /export type RowAlign = ([^;]+);/.exec(typesSource)?.[1];
      expect(declared, 'RowAlign not found in types.ts').toBeDefined();
      const description = rowApiRows.find((r) => r.name === 'align')!.description.en;
      for (const value of values(declared!)) expect(description, value).toContain(`<code>${value}</code>`);
      expect(rowApiRows.find((r) => r.name === 'align')!.type).toBe('RowAlign | Partial<Record<Breakpoint, RowAlign>>');
    });

    it('justify: the documented values are the ones of RowJustify', () => {
      const declared = /export type RowJustify = ([^;]+);/.exec(typesSource)?.[1];
      expect(declared, 'RowJustify not found in types.ts').toBeDefined();
      const description = rowApiRows.find((r) => r.name === 'justify')!.description.en;
      for (const value of values(declared!)) expect(description, value).toContain(`<code>${value}</code>`);
    });

    it('the Row source accepts exactly the documented align and justify values', () => {
      const layout = read('src/lib/Grid/layout.ts');
      const align = /ROW_ALIGNS = \[([^\]]+)\]/.exec(layout)?.[1];
      const justify = /ROW_JUSTIFIES = \[([^\]]+)\]/.exec(layout)?.[1];
      expect(values(align!)).toEqual(values(/export type RowAlign = ([^;]+);/.exec(typesSource)![1]));
      expect(values(justify!)).toEqual(values(/export type RowJustify = ([^;]+);/.exec(typesSource)![1]));
    });
  });
});

describe('Grid page: the Col table', () => {
  it('documents every property of Col and nothing else', () => {
    expect(documented(colApiRows).sort()).toEqual(declaredProps(colSource, 'ColProps', 'Col.svelte').sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documented(colApiRows)).size).toBe(documented(colApiRows).length);
  });

  it('every property is unset by default in the component, and the table says so', () => {
    const defaults = declaredDefaults(colSource, 'ColProps', 'Col.svelte');
    expect([...defaults.keys()]).toEqual([]);
    for (const row of colApiRows.filter((r) => ['span', 'flex', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'].includes(r.name))) {
      expect(row.default, row.name).toBe('—');
    }
    for (const name of ['offset', 'push', 'pull', 'order']) {
      expect(colApiRows.find((r) => r.name === name)!.default, name).toBe('0');
    }
  });

  it('the breakpoint props are the breakpoints of the library, in order', () => {
    expect(documented(colApiRows).filter((name) => (BREAKPOINT_NAMES as readonly string[]).includes(name))).toEqual([
      ...BREAKPOINT_NAMES
    ]);
  });

  it('the breakpoint widths written in the table are the ones of BREAKPOINTS', () => {
    for (const name of BREAKPOINT_NAMES.filter((n) => n !== 'xs')) {
      const row = colApiRows.find((r) => r.name === name)!;
      expect(row.description.en, name).toContain(`From ${BREAKPOINTS[name]} px up.`);
      expect(row.description.ru, name).toContain(`${BREAKPOINTS[name]} px`);
      expect(row.description.zh, name).toContain(`${BREAKPOINTS[name]} px`);
    }
  });

  it('ColSize: the keys of the object are the ones of the type', () => {
    const body = /export type ColSize = \{([\s\S]*?)\n\};/.exec(typesSource)?.[1];
    expect(body, 'ColSize not found in types.ts').toBeDefined();
    const declared = [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
    expect(sizeRows.map((row) => row.name)).toEqual(declared);
  });

  it('ColSize: the type of each key is the type of the plain prop of the same name', () => {
    for (const row of sizeRows) {
      expect(row.type, row.name).toBe(colApiRows.find((r) => r.name === row.name)!.type);
    }
  });
});

describe('Grid page: the Breakpoints table', () => {
  const members = [...breakpointsSource.matchAll(/^ {2}get (\w+)\(\): (\w+) \{/gm)].map((m) => [m[1], m[2]]);

  it('documents every getter of the class and nothing else', () => {
    const rows = breakpointsRows.map((row) => row.name).filter((name) => !name.startsWith('new ') && !name.startsWith('options.'));
    expect(rows.sort()).toEqual(members.map(([name]) => name).sort());
  });

  it('gives each getter its type', () => {
    for (const [name, type] of members) {
      const row = breakpointsRows.find((r) => r.name === name)!;
      expect(row.type, name).toBe(type === 'Breakpoint' ? 'Breakpoint' : 'boolean');
    }
  });

  it('documents the option and its default', () => {
    expect(breakpointsSource).toContain("options.fallback ?? 'xs'");
    expect(breakpointsRows.find((row) => row.name === 'options.fallback')!.default).toBe("'xs'");
  });

  it('BREAKPOINTS: the constants table is the constant of the library', () => {
    expect(constantRows).toEqual(BREAKPOINT_NAMES.map((name) => ({ name, value: String(BREAKPOINTS[name]) })));
  });
});

describe('Grid page: descriptions', () => {
  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...rowApiRows, ...colApiRows, ...sizeRows, ...breakpointsRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });

  it('has no method table and no token table: Row and Col have no methods and the grid draws nothing', () => {
    expect(rowSource + colSource).not.toMatch(/^ {2}export function /m);
    expect(tokensCss).not.toMatch(/--ads-(grid|row|col)-/);
  });
});

describe('Grid page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/grid/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/grid/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();
  const code = Object.values(sources).join('\n');

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });

  it('the demos that need the width of the page take both columns, and no other does', () => {
    expect(demos.filter((demo) => demo.wide).map((demo) => demo.slug)).toEqual(['responsive', 'responsive-more', 'playground']);
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders rows of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-row').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: stands on a stack of units, with no loose text next to a row`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelector(':scope > .stack'), 'the root of the example is a .stack').not.toBeNull();
      for (const child of container.querySelector(':scope > .stack')!.children) {
        expect(child.matches('.ads-row, .field'), child.outerHTML.slice(0, 80)).toBe(true);
      }
      expect(container.querySelectorAll(':scope > :not(.stack)').length).toBe(0);
    });
  }

  it('every property of every API table is shown in at least one example', () => {
    for (const name of [...documented(rowApiRows), ...documented(colApiRows)].filter((n) => !['children', 'class', 'style'].includes(n))) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
    for (const name of ['push', 'pull', 'order', 'flex']) {
      expect(code, `${name} inside a breakpoint object`).toMatch(new RegExp(`\\{\\{[^}]*\\b${name}\\b`));
    }
  });

  it('Breakpoints: an example uses the class and reads current and the flags', () => {
    const example = sources[files.find((file) => file.endsWith('-breakpoints.svelte'))!];
    expect(example).toContain('new Breakpoints()');
    expect(example).toContain('screens.current');
    expect(example).toMatch(/screens\[name\]/);
  });

  it('every row of every example sits in a field or on the stack, so a caption stands above its component', () => {
    for (const [file, source] of Object.entries(sources)) {
      const loose = source.slice(0, source.indexOf('<style>')).match(/<span class="caption">/g)?.length ?? 0;
      const fields = source.slice(0, source.indexOf('<style>')).match(/<div class="field">/g)?.length ?? 0;
      expect(loose, `${file}: a caption outside a field`).toBeLessThanOrEqual(fields);
    }
  });

  describe('the groups of the playground are independent (rule 6a)', () => {
    const file = files.find((f) => f.endsWith('-playground.svelte'))!;

    it('a choice in one group does not change another', async () => {
      const { container, getByRole } = render(examples[file].default);
      const checked = (name: string) => (getByRole('radiogroup', { name }).querySelector('input:checked') as HTMLInputElement).value;
      const before = { h: checked('Horizontal gutter'), v: checked('Vertical gutter'), c: checked('Columns in a row') };
      await fireEvent.click(getByRole('radiogroup', { name: 'Horizontal gutter' }).querySelector('input[value="32"]')!);
      expect(checked('Horizontal gutter')).toBe('32');
      expect(checked('Vertical gutter')).toBe(before.v);
      expect(checked('Columns in a row')).toBe(before.c);
      await fireEvent.click(getByRole('radiogroup', { name: 'Columns in a row' }).querySelector('input[value="8"]')!);
      expect(container.querySelectorAll('.ads-row .ads-col').length).toBe(16);
      expect(checked('Horizontal gutter')).toBe('32');
      expect(checked('Vertical gutter')).toBe(before.v);
    });
  });

  it('the wrap example: the switch drives its own Row only', async () => {
    const file = files.find((f) => f.endsWith('-wrap.svelte'))!;
    const { container, getByRole } = render(examples[file].default);
    const row = container.querySelector('.ads-row')!;
    expect(row).not.toHaveClass('ads-row-nowrap');
    await fireEvent.click(getByRole('switch', { name: 'wrap' }));
    expect(row).toHaveClass('ads-row-nowrap');
    expect(container.querySelector('[role="status"]')).toHaveTextContent('wrap={false}');
  });

  it('the layout of the examples is in the shown code, not in the site styles', () => {
    for (const [file, source] of Object.entries(sources)) {
      expect(source, file).toContain('<style>');
      expect(source, file).toMatch(/\.stack \{/);
    }
  });

  it('the examples use only tokens of the library for their colors', () => {
    for (const [file, source] of Object.entries(sources)) {
      expect(source.slice(source.indexOf('<style>')), file).not.toMatch(/var\(--s-/);
    }
  });
});
