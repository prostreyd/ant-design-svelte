// The Input page of the documentation site must say what the components really do.
// The API, methods and token tables are data (docs/src/docs/data/input.ts); these tests compare them with the sources.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import {
  apiRows,
  demos,
  methodRows,
  otpApiRows,
  passwordApiRows,
  searchApiRows,
  textAreaApiRows,
  tokenRows
} from '../../docs/src/docs/data/input';

const root = join(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const inputDir = 'src/lib/Input';
const sources = {
  Input: read(`${inputDir}/Input.svelte`),
  InputTextArea: read(`${inputDir}/InputTextArea.svelte`),
  InputPassword: read(`${inputDir}/InputPassword.svelte`),
  InputSearch: read(`${inputDir}/InputSearch.svelte`),
  InputOTP: read(`${inputDir}/InputOTP.svelte`)
};
const allSources = readdirSync(join(root, inputDir))
  .filter((file) => file.endsWith('.svelte'))
  .map((file) => read(`${inputDir}/${file}`))
  .join('\n');
const typesSource = read(`${inputDir}/types.ts`);
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
type Rows = typeof apiRows;
const documented = (rows: Rows) => rows.filter((row) => row.name !== 'native attributes').flatMap((row) => row.name.split(' / '));

/** The members of a block of a type: `indent` spaces, then the name. */
const members = (body: string | undefined, indent: number) =>
  [...(body ?? '').matchAll(new RegExp(`^ {${indent}}(\\w+)\\??:`, 'gm'))].map((m) => m[1]);

/** The props `FieldProps` gives to `Input` and `InputTextArea`. */
const fieldProps = members(/interface FieldProps \{([\s\S]*?)\n\}/.exec(typesSource)?.[1], 2);

/** The own block (`& { ... }`) of `export type <name> = ...` in types.ts. */
const typesOwnProps = (name: string) => members(new RegExp(`export type ${name} = [\\s\\S]*?FieldProps & \\{([\\s\\S]*?)\\n {2}\\};`).exec(typesSource)?.[1], 4);

/** The props of `type <name>Props = Omit<...> & { ... }` written in a component. */
function componentOwnProps(source: string, name: string): string[] {
  const body = new RegExp(`type ${name}Props = [\\s\\S]*?& \\{([\\s\\S]*?)\\n {2}\\};`).exec(source)?.[1];
  expect(body, `${name}Props block not found`).toBeDefined();
  return members(body, 4);
}

/** Default values from the `$props()` destructuring of a component. */
function declaredDefaults(source: string, name: string): Map<string, string> {
  const body = new RegExp(`let \\{([\\s\\S]*?)\\}: ${name}Props = \\$props\\(\\);`).exec(source)?.[1];
  expect(body, `$props() destructuring of ${name} not found`).toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

/** The values of a union alias of types.ts, following the aliases it refers to (`InputSemanticName | 'button'`). */
function union(name: string): string[] {
  const body = new RegExp(`export type ${name} = ([^;]+);`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return body!
    .split('|')
    .map((part) => part.trim())
    .flatMap((part) => (part.startsWith("'") ? [part.slice(1, -1)] : union(part)));
}

const tables = [
  { label: 'Input', name: 'Input', source: sources.Input, rows: apiRows, expected: [...fieldProps, ...typesOwnProps('InputProps'), 'readonly', 'maxlength'], parts: 'InputSemanticName' },
  { label: 'InputTextArea', name: 'InputTextArea', source: sources.InputTextArea, rows: textAreaApiRows, expected: [...fieldProps, ...typesOwnProps('InputTextAreaProps'), 'readonly', 'maxlength'], parts: 'InputTextAreaSemanticName' },
  { label: 'InputPassword', name: 'InputPassword', source: sources.InputPassword, rows: passwordApiRows, expected: componentOwnProps(sources.InputPassword, 'InputPassword'), parts: undefined },
  { label: 'InputSearch', name: 'InputSearch', source: sources.InputSearch, // `class` and `style` are Input's, but on the search they reach the wrapper of the field and the button, so the table lists them.
    rows: searchApiRows, expected: [...componentOwnProps(sources.InputSearch, 'InputSearch'), 'class', 'style'], parts: 'InputSearchSemanticName' },
  { label: 'InputOTP', name: 'InputOTP', source: sources.InputOTP, rows: otpApiRows, expected: componentOwnProps(sources.InputOTP, 'InputOTP'), parts: 'InputOTPSemanticName' }
];

for (const { label, name, source, rows, expected } of tables) {
  describe(`Input page: ${label} API table`, () => {
    it('documents every property of the component and nothing else', () => {
      expect([...documented(rows)].sort()).toEqual([...new Set(expected)].sort());
    });

    it('has no property listed twice', () => {
      expect(new Set(documented(rows)).size).toBe(documented(rows).length);
    });

    describe('default values', () => {
      const defaults = declaredDefaults(source, name);
      for (const row of rows.filter((r) => r.name !== 'native attributes' && !r.name.includes(' / '))) {
        it(`${row.name}: the default column matches the component`, () => {
          const declared = defaults.get(row.name);
          expect(row.default).toBe(declared === undefined || declared === 'undefined' ? '—' : declared);
        });
      }
    });
  });
}

describe('Input page: allowed values', () => {
  for (const { label, rows, parts } of tables) {
    if (!parts) continue;
    it(`${label} classNames and styles: both document exactly the parts of ${parts}`, () => {
      for (const name of ['classNames', 'styles']) {
        expect(values(rows.find((r) => r.name === name)!.type), `${label} ${name}`).toEqual([...union(parts)].sort());
      }
    });
  }

  for (const [prop, alias] of [
    ['size', 'InputSize'],
    ['variant', 'InputVariant'],
    ['status', 'InputStatus']
  ] as const) {
    it(`${prop}: the type column equals ${alias} in types.ts, in every table that has it`, () => {
      for (const { label, rows } of tables) {
        const row = rows.find((r) => r.name === prop);
        if (row) expect(values(row.type), label).toEqual([...union(alias)].sort());
      }
    });
  }

  it('focus: the cursor values of the method equal those of InputFocusOptions', () => {
    const declared = /cursor\?: ([^;]+);/.exec(typesSource)?.[1];
    expect(declared, 'cursor not found in types.ts').toBeDefined();
    expect(values(methodRows.find((r) => r.name === 'focus')!.type)).toEqual(values(declared!));
  });

  it('allowClear: the object form documents the fields of AllowClearConfig', () => {
    const body = /export interface AllowClearConfig \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    const type = apiRows.find((r) => r.name === 'allowClear')!.type;
    for (const field of members(body, 2)) expect(type, field).toContain(`${field}?:`);
  });

  it('count: the type column documents the fields of CountConfig', () => {
    const body = /export interface CountConfig \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    const type = apiRows.find((r) => r.name === 'count')!.type;
    for (const field of members(body, 2)) expect(type, field).toContain(`${field}?:`);
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...textAreaApiRows, ...passwordApiRows, ...searchApiRows, ...otpApiRows, ...methodRows, ...tokenRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Input page: methods table', () => {
  for (const [name, source] of Object.entries(sources)) {
    it(`documents the methods ${name} exports, and nothing else`, () => {
      const exported = [...source.matchAll(/^ {2}export function (\w+)\(/gm)].map((m) => m[1]);
      expect(methodRows.map((row) => row.name).sort()).toEqual(exported.sort());
    });
  }

  it('gives each method the signature of the component (focus takes InputFocusOptions)', () => {
    expect(sources.Input).toMatch(/export function focus\(options\?: InputFocusOptions\): void/);
    expect(sources.Input).toMatch(/export function blur\(\): void/);
    expect(methodRows.find((r) => r.name === 'focus')!.type).toBe("(options?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => void");
    expect(methodRows.find((r) => r.name === 'blur')!.type).toBe('() => void');
  });
});

describe('Input page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], squash(m[2]).toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(squash(row.value).toLowerCase());
    });

    it(`${row.name}: is used by a component of the input family`, () => {
      expect(allSources).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-input-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-input-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => !/(font-size|padding|radius|border-width|line-height|gap|icon-size|addon-padding|otp-gap)/.test(r.name))) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Input page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/input/*.svelte', { eager: true });
  const exampleSources = import.meta.glob<string>('../../docs/src/docs/examples/input/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();
  const code = Object.values(exampleSources).join('\n');

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders fields of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-input input, .ads-input textarea').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: every field has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const field of container.querySelectorAll<HTMLElement>('.ads-input input, .ads-input textarea')) {
        const named =
          field.hasAttribute('aria-label') ||
          field.hasAttribute('aria-labelledby') ||
          (field.id !== '' && container.querySelector(`label[for="${field.id}"]`) !== null);
        expect(named, field.outerHTML).toBe(true);
      }
    });

    it(`${file.split('/').pop()}: every one-time code has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const group of container.querySelectorAll('.ads-input-otp')) {
        expect(group.hasAttribute('aria-label') || group.hasAttribute('aria-labelledby'), group.outerHTML).toBe(true);
      }
    });
  }

  it('no two examples use the same element id (the page shows them all at once)', () => {
    const ids = [...code.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** The opening tags of one component in the examples (`<Input` does not match `<InputPassword`). */
  const tagsOf = (component: string) =>
    [...code.matchAll(new RegExp(`<${component}\\b[\\s\\S]*?(?:\\/>|<\\/${component}>)`, 'g'))].map((m) => m[0]).join('\n');

  for (const { label, name, rows } of tables) {
    it(`every property of ${label} is used on ${name} in an example`, () => {
      const used = tagsOf(name);
      for (const prop of documented(rows)) {
        expect(new RegExp(`\\b${prop}\\b`).test(used), `${prop} is not used on ${name} in any example`).toBe(true);
      }
    });
  }

  it('every method is called in an example', () => {
    for (const row of methodRows) expect(code, row.name).toContain(`.${row.name}(`);
  });

  it('every cursor value and preventScroll of focus() is shown', () => {
    for (const value of ['start', 'end', 'all']) expect(code).toContain(`cursor: '${value}'`);
    expect(code).toContain('preventScroll');
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
