// The Button page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/button.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, tokenRows } from '../../docs/src/docs/data/button';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const buttonSource = read('src/lib/Button/Button.svelte');
const typesSource = read('src/lib/Button/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
/** 'target / rel / download' documents three properties in one row. */
const documentedNames = apiRows.flatMap((row) => row.name.split(' / ')).filter((name) => name !== 'native attributes');

/** Property names of the `ButtonProps` type of the component. */
function declaredProps(): string[] {
  const body = /type ButtonProps = [\s\S]*?& \{([\s\S]*?)\n {2}\};/.exec(buttonSource)?.[1];
  expect(body, 'ButtonProps block not found in Button.svelte').toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of the component. */
function declaredDefaults(): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: ButtonProps = \$props\(\);/.exec(buttonSource)?.[1];
  expect(body, '$props() destructuring not found in Button.svelte').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim()]));
}

describe('Button page: API table', () => {
  it('documents every property of the component and nothing else', () => {
    expect([...documentedNames].sort()).toEqual(declaredProps().sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documentedNames).size).toBe(documentedNames.length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults();
    for (const row of apiRows.filter((r) => r.name !== 'native attributes')) {
      for (const name of row.name.split(' / ')) {
        it(`${name}: the default column matches the component`, () => {
          const declared = defaults.get(name);
          const expected = declared === undefined || declared === 'undefined' ? '—' : declared;
          expect(row.default).toBe(expected);
        });
      }
    }
  });

  describe('allowed values', () => {
    const aliases: Record<string, string> = {
      type: 'ButtonType',
      size: 'ButtonSize',
      shape: 'ButtonShape',
      htmlType: 'ButtonHTMLType',
      iconPlacement: 'ButtonIconPlacement',
      loading: 'ButtonLoading'
    };
    for (const [prop, alias] of Object.entries(aliases)) {
      it(`${prop}: the type column equals ${alias} in types.ts`, () => {
        const declared = new RegExp(`export type ${alias} = ([^;]+);`).exec(typesSource)?.[1];
        expect(declared, `${alias} not found in types.ts`).toBeDefined();
        expect(squash(apiRows.find((r) => r.name === prop)!.type)).toBe(squash(declared!));
      });
    }

    const constants: Record<string, string> = {
      type: 'BUTTON_TYPES',
      size: 'BUTTON_SIZES',
      shape: 'BUTTON_SHAPES',
      htmlType: 'BUTTON_HTML_TYPES',
      iconPlacement: 'BUTTON_ICON_PLACEMENTS'
    };
    for (const [prop, constant] of Object.entries(constants)) {
      it(`${prop}: the documented values are the ones the component accepts`, () => {
        const accepted = new RegExp(`const ${constant} = \\[([^\\]]+)\\] as const`).exec(buttonSource)?.[1];
        expect(accepted, `${constant} not found in Button.svelte`).toBeDefined();
        const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
        expect(values(apiRows.find((r) => r.name === prop)!.type)).toEqual(values(accepted!));
      });
    }
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of apiRows) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Button page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Button`, () => {
      expect(buttonSource).toContain(`var(${row.name}`);
    });
  }
});

describe('Button page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/button/*.svelte', { eager: true });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders buttons of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-btn').length).toBeGreaterThan(0);
    });
  }

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });
});
