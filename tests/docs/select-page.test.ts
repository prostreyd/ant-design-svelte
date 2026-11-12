// The Select page of the documentation site must say what the components really do.
// The API, methods and token tables are data (docs/src/docs/data/select.ts); these tests compare them with the sources.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, groupApiRows, methodRows, optionApiRows, tokenRows } from '../../docs/src/docs/data/select';

const root = join(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const selectDir = 'src/lib/Select';
const selectSource = read(`${selectDir}/Select.svelte`);
const optionSource = read(`${selectDir}/SelectOption.svelte`);
const groupSource = read(`${selectDir}/SelectOptGroup.svelte`);
const allSources = readdirSync(join(root, selectDir))
  .filter((file) => file.endsWith('.svelte'))
  .map((file) => read(`${selectDir}/${file}`))
  .join('\n');
const typesSource = read(`${selectDir}/types.ts`);
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
type Rows = typeof apiRows;
const documented = (rows: Rows) => rows.filter((row) => row.name !== 'native attributes').flatMap((row) => row.name.split(' / '));

/** The members of a block of a type: `indent` spaces, then the name. */
const members = (body: string | undefined, indent: number) =>
  [...(body ?? '').matchAll(new RegExp(`^ {${indent}}(\\w+)\\??:`, 'gm'))].map((m) => m[1]);

/** The values of a union alias of types.ts. */
function union(name: string): string[] {
  const body = new RegExp(`export type ${name} =\\s*([^;]+);`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return body!
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.slice(1, -1));
}

/** Default values from the `$props()` destructuring of a component. */
function declaredDefaults(source: string, type: string): Map<string, string> {
  const body = new RegExp(`let \\{([\\s\\S]*?)\\}: ${type} = \\$props\\(\\);`).exec(source)?.[1];
  expect(body, `$props() destructuring of ${type} not found`).toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

/** The own block of `export type SelectProps = Omit<...> & { ... };`. */
const ownProps = members(/export type SelectProps = [\s\S]*?\n> & \{([\s\S]*?)\n\};/.exec(typesSource)?.[1], 2);
const optionProps = members(/export interface SelectOptionProps \{([\s\S]*?)\n\}/.exec(typesSource)?.[1], 2);
const groupProps = members(/export interface SelectOptGroupProps \{([\s\S]*?)\n\}/.exec(typesSource)?.[1], 2);
const defaultOf = (defaults: Map<string, string>, name: string) => {
  const declared = defaults.get(name);
  return declared === undefined || declared === 'undefined' ? '—' : declared;
};

describe('Select page: API table', () => {
  it('documents every property of Select and nothing else', () => {
    expect(ownProps.length).toBeGreaterThan(40);
    expect([...documented(apiRows)].sort()).toEqual([...new Set(ownProps)].sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documented(apiRows)).size).toBe(documented(apiRows).length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults(selectSource, 'SelectProps');
    for (const row of apiRows.filter((r) => r.name !== 'native attributes' && !r.name.includes(' / '))) {
      it(`${row.name}: the default column matches the component`, () => {
        expect(row.default).toBe(defaultOf(defaults, row.name));
      });
    }
  });

  it('every row is described in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...optionApiRows, ...groupApiRows, ...methodRows, ...tokenRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Select page: allowed values', () => {
  for (const [prop, alias] of [
    ['mode', 'SelectMode'],
    ['size', 'SelectSize'],
    ['variant', 'SelectVariant'],
    ['status', 'SelectStatus'],
    ['placement', 'SelectPlacement']
  ] as const) {
    it(`${prop}: the type column equals ${alias} in types.ts`, () => {
      expect(values(apiRows.find((r) => r.name === prop)!.type)).toEqual([...union(alias)].sort());
    });
  }

  it('classNames and styles: both document exactly the parts of SelectSemanticName', () => {
    for (const name of ['classNames', 'styles']) {
      expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual([...union('SelectSemanticName')].sort());
    }
  });

  it('allowClear: the object form documents the fields of SelectAllowClear', () => {
    const body = /export interface SelectAllowClear \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    const type = apiRows.find((r) => r.name === 'allowClear')!.type;
    for (const field of members(body, 2)) expect(type, field).toContain(`${field}?:`);
  });

  it('fieldNames: documents the keys of SelectFieldNames', () => {
    const body = /export interface SelectFieldNames \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    const type = apiRows.find((r) => r.name === 'fieldNames')!.type;
    for (const field of members(body, 2)) expect(type, field).toContain(`${field}?:`);
  });

  it('tagRender: documents the fields of SelectTag', () => {
    const body = /export interface SelectTag \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    const type = apiRows.find((r) => r.name === 'tagRender')!.type;
    for (const field of members(body, 2)) expect(type, field).toContain(`${field}:`);
  });
});

describe('Select page: SelectOption and SelectOptGroup tables', () => {
  it('SelectOption documents the props of SelectOptionProps and the component reads them', () => {
    expect(documented(optionApiRows).sort()).toEqual([...optionProps].sort());
    const body = /let \{([\s\S]*?)\}: SelectOptionProps = \$props\(\);/.exec(optionSource)?.[1] ?? '';
    for (const prop of optionProps) expect(body, prop).toMatch(new RegExp(`\\b${prop}\\b|class: customClass`));
  });

  it('SelectOptGroup documents the props of SelectOptGroupProps and the component reads them', () => {
    expect(documented(groupApiRows).sort()).toEqual([...groupProps].sort());
    const body = /let \{([\s\S]*?)\}: SelectOptGroupProps = \$props\(\);/.exec(groupSource)?.[1] ?? '';
    for (const prop of groupProps) expect(body, prop).toMatch(new RegExp(`\\b${prop}\\b|class: customClass`));
  });

  it('the default columns match the components', () => {
    const option = declaredDefaults(optionSource, 'SelectOptionProps');
    for (const row of optionApiRows) expect(row.default, `SelectOption ${row.name}`).toBe(defaultOf(option, row.name));
    const group = declaredDefaults(groupSource, 'SelectOptGroupProps');
    for (const row of groupApiRows) expect(row.default, `SelectOptGroup ${row.name}`).toBe(defaultOf(group, row.name));
  });
});

describe('Select page: methods table', () => {
  it('documents the methods Select exports, and nothing else', () => {
    const exported = [...selectSource.matchAll(/^ {2}export function (\w+)\(/gm)].map((m) => m[1]);
    expect(methodRows.map((row) => row.name).sort()).toEqual(exported.sort());
  });

  it('gives each method the signature of the component', () => {
    expect(selectSource).toMatch(/export function focus\(options\?: SelectFocusOptions\): void/);
    expect(selectSource).toMatch(/export function blur\(\): void/);
    expect(methodRows.find((r) => r.name === 'focus')!.type).toBe('(options?: { preventScroll?: boolean }) => void');
    expect(methodRows.find((r) => r.name === 'blur')!.type).toBe('() => void');
    const body = /export interface SelectFocusOptions \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    expect(members(body, 2)).toEqual(['preventScroll']);
  });
});

describe('Select page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], squash(m[2]).toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(squash(row.value).toLowerCase());
    });

    it(`${row.name}: is used by a component of the select family`, () => {
      expect(allSources).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-select-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-select-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => /-(bg|color|border|shadow)$|-color-disabled$/.test(r.name))) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Select page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/select/*.svelte', { eager: true });
  const exampleSources = import.meta.glob<string>('../../docs/src/docs/examples/select/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();
  const code = Object.values(exampleSources).join('\n');

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders fields of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-select [role=combobox]').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: every field has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const field of container.querySelectorAll<HTMLElement>('.ads-select [role=combobox]')) {
        const named =
          field.hasAttribute('aria-label') ||
          field.hasAttribute('aria-labelledby') ||
          (field.id !== '' && container.querySelector(`label[for="${field.id}"]`) !== null);
        expect(named, field.outerHTML).toBe(true);
      }
    });
  }

  it('no two examples use the same element id (the page shows them all at once)', () => {
    const ids = [...code.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** The opening tags of one component in the examples (`<Select` does not match `<SelectOption`). */
  const tagsOf = (component: string) =>
    [...code.matchAll(new RegExp(`<${component}\\b[\\s\\S]*?(?:\\/>|<\\/${component}>)`, 'g'))].map((m) => m[0]).join('\n');

  it('every property of Select is used on Select in an example', () => {
    const used = tagsOf('Select');
    for (const prop of documented(apiRows)) {
      // The children are the options written inside the tag, in the markup example.
      if (prop === 'children') continue;
      expect(new RegExp(`\\b${prop}\\b`).test(used), `${prop} is not used on Select in any example`).toBe(true);
    }
    expect(code).toContain('<SelectOption');
  });

  it('every property of SelectOption and SelectOptGroup is used in an example', () => {
    for (const [name, rows] of [['SelectOption', optionApiRows], ['SelectOptGroup', groupApiRows]] as const) {
      const used = tagsOf(name);
      for (const prop of documented(rows)) {
        if (prop === 'children') continue;
        expect(new RegExp(`\\b${prop}\\b`).test(used), `${prop} is not used on ${name} in any example`).toBe(true);
      }
    }
  });

  it('every method is called in an example', () => {
    for (const row of methodRows) expect(code, row.name).toContain(`.${row.name}(`);
    expect(code).toContain('preventScroll');
  });

  it('every value of mode, size, variant, status and placement is shown', () => {
    for (const alias of ['SelectMode', 'SelectSize', 'SelectVariant', 'SelectStatus', 'SelectPlacement']) {
      for (const value of union(alias)) expect(code, `${alias} ${value}`).toContain(value);
    }
  });

  it('every part of classNames and styles is used', () => {
    const semantic = exampleSources[files.find((file) => file.includes('12-semantic'))!];
    const classNames = /classNames=\{\{([\s\S]*?)\}\}/.exec(semantic)?.[1] ?? '';
    const styles = /styles=\{\{([\s\S]*?)\n {2}\}\}/.exec(semantic)?.[1] ?? '';
    for (const part of union('SelectSemanticName')) {
      expect(`${classNames}${styles}`, part).toContain(`${part}:`);
    }
  });

  it('the markup example inserts, moves and ignores options', () => {
    const markup = exampleSources[files.find((file) => file.includes('13-children'))!];
    expect(markup).toContain('{#each');
    expect(markup).toContain('{#if');
    expect(markup).toContain('options={');
  });
});
