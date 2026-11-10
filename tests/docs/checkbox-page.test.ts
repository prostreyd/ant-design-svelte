// The Checkbox page of the documentation site must say what the components really do.
// The API, methods and token tables are data (docs/src/docs/data/checkbox.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, groupApiRows, methodRows, tokenRows } from '../../docs/src/docs/data/checkbox';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const checkboxSource = read('src/lib/Checkbox/Checkbox.svelte');
const groupSource = read('src/lib/Checkbox/CheckboxGroup.svelte');
const typesSource = read('src/lib/Checkbox/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
const named = (rows: typeof apiRows) => rows.filter((row) => row.name !== 'native attributes').map((row) => row.name);

/** Property names of the `<Name>Props` type of a component. */
function declaredProps(source: string, name: string): string[] {
  const body = new RegExp(`type ${name}Props = [\\s\\S]*?& \\{([\\s\\S]*?)\\n {2}\\};`).exec(source)?.[1];
  expect(body, `${name}Props block not found`).toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of a component. */
function declaredDefaults(source: string, name: string): Map<string, string> {
  const body = new RegExp(`let \\{([\\s\\S]*?)\\}: ${name}Props = \\$props\\(\\);`).exec(source)?.[1];
  expect(body, `$props() destructuring of ${name} not found`).toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

const components = [
  { label: 'Checkbox', name: 'Checkbox', source: checkboxSource, rows: apiRows },
  { label: 'CheckboxGroup', name: 'CheckboxGroup', source: groupSource, rows: groupApiRows }
];

for (const { label, name, source, rows } of components) {
  describe(`Checkbox page: ${label} API table`, () => {
    it('documents every property of the component and nothing else', () => {
      expect([...named(rows)].sort()).toEqual(declaredProps(source, name).sort());
    });

    it('has no property listed twice', () => {
      expect(new Set(named(rows)).size).toBe(named(rows).length);
    });

    describe('default values', () => {
      const defaults = declaredDefaults(source, name);
      for (const row of rows.filter((r) => r.name !== 'native attributes')) {
        it(`${row.name}: the default column matches the component`, () => {
          const declared = defaults.get(row.name);
          expect(row.default).toBe(declared === undefined || declared === 'undefined' ? '—' : declared);
        });
      }
    });
  });
}

describe('Checkbox page: allowed values', () => {
  it('Checkbox classNames and styles: both document exactly the parts of CheckboxSemanticName', () => {
    const parts = /export type CheckboxSemanticName = ([^;]+);/.exec(typesSource)?.[1];
    expect(parts, 'CheckboxSemanticName not found in types.ts').toBeDefined();
    for (const name of ['classNames', 'styles']) {
      expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual(values(parts!));
    }
  });

  it('CheckboxGroup classNames and styles: both document exactly the parts of CheckboxGroupSemanticName', () => {
    const parts = /export type CheckboxGroupSemanticName = ([^;]+);/.exec(typesSource)?.[1];
    expect(parts, 'CheckboxGroupSemanticName not found in types.ts').toBeDefined();
    for (const name of ['classNames', 'styles']) {
      expect(values(groupApiRows.find((r) => r.name === name)!.type), name).toEqual(values(parts!));
    }
  });

  it('value: the type column equals CheckboxValue in types.ts', () => {
    const declared = /export type CheckboxValue = ([^;]+);/.exec(typesSource)?.[1];
    expect(declared, 'CheckboxValue not found in types.ts').toBeDefined();
    expect(squash(apiRows.find((r) => r.name === 'value')!.type)).toBe(squash(declared!));
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...groupApiRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Checkbox page: methods table', () => {
  it('documents the methods the Checkbox exports, and nothing else', () => {
    const exported = [...checkboxSource.matchAll(/^ {2}export function (\w+)\(/gm)].map((m) => m[1]);
    expect(methodRows.map((row) => row.name).sort()).toEqual(exported.sort());
  });

  it('the group exports no methods', () => {
    expect([...groupSource.matchAll(/^ {2}export function (\w+)\(/gm)]).toHaveLength(0);
  });

  it('gives each method the signature of the component', () => {
    for (const row of methodRows) {
      const parameters = new RegExp(`export function ${row.name}\\(([^)]*)\\): void`).exec(checkboxSource)?.[1];
      expect(parameters, `${row.name} not found in Checkbox.svelte`).toBeDefined();
      expect(row.type).toBe(`(${parameters}) => void`);
    }
  });
});

describe('Checkbox page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Checkbox or the CheckboxGroup`, () => {
      expect(checkboxSource + groupSource).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-checkbox-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-checkbox-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => !/-(size|radius|width|padding|gap|font-size|line-height)$/.test(r.name))) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Checkbox page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/checkbox/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/checkbox/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders checkboxes of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('label.ads-checkbox input[type="checkbox"]').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: every checkbox has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const input of container.querySelectorAll<HTMLInputElement>('.ads-checkbox input')) {
        const named =
          input.hasAttribute('aria-label') ||
          input.hasAttribute('aria-labelledby') ||
          input.closest('label')?.querySelector('.ads-checkbox-label') != null ||
          (input.id !== '' && container.querySelector(`label[for="${input.id}"]`) !== null);
        expect(named, input.outerHTML).toBe(true);
      }
    });

    it(`${file.split('/').pop()}: every group has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const group of container.querySelectorAll('.ads-checkbox-group')) {
        expect(group.hasAttribute('aria-label') || group.hasAttribute('aria-labelledby'), group.outerHTML).toBe(true);
      }
    });
  }

  it('every property of both API tables is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    for (const name of [...new Set([...named(apiRows), ...named(groupApiRows)])]) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every property of the CheckboxGroup is used on a CheckboxGroup, not only on a Checkbox', () => {
    const code = Object.values(sources).join('\n');
    const groups = [...code.matchAll(/<CheckboxGroup\b[\s\S]*?(?:\/>|<\/CheckboxGroup>)/g)].map((m) => m[0]).join('\n');
    for (const name of ['value', 'options', 'disabled', 'name', 'onchange', 'classNames', 'styles', 'class', 'style']) {
      expect(new RegExp(`\\b${name}\\b`).test(groups), `${name} is not used on a CheckboxGroup in any example`).toBe(true);
    }
  });

  it('every method is called in an example', () => {
    const code = Object.values(sources).join('\n');
    for (const row of methodRows) expect(code, row.name).toContain(`.${row.name}(`);
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });
});
