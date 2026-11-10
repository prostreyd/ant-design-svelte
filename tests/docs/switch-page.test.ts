// The Switch page of the documentation site must say what the component really does.
// The API, methods and token tables are data (docs/src/docs/data/switch.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, methodRows, tokenRows } from '../../docs/src/docs/data/switch';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const switchSource = read('src/lib/Switch/Switch.svelte');
const typesSource = read('src/lib/Switch/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const documentedNames = apiRows.filter((row) => row.name !== 'native attributes').map((row) => row.name);
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

/** Property names of the `SwitchProps` type of the component. */
function declaredProps(): string[] {
  const body = /type SwitchProps = [\s\S]*?& \{([\s\S]*?)\n {2}\};/.exec(switchSource)?.[1];
  expect(body, 'SwitchProps block not found in Switch.svelte').toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of the component. */
function declaredDefaults(): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: SwitchProps = \$props\(\);/.exec(switchSource)?.[1];
  expect(body, '$props() destructuring not found in Switch.svelte').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

describe('Switch page: API table', () => {
  it('documents every property of the component and nothing else', () => {
    expect([...documentedNames].sort()).toEqual(declaredProps().sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documentedNames).size).toBe(documentedNames.length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults();
    for (const row of apiRows.filter((r) => r.name !== 'native attributes')) {
      it(`${row.name}: the default column matches the component`, () => {
        const declared = defaults.get(row.name);
        expect(row.default).toBe(declared === undefined || declared === 'undefined' ? '—' : declared);
      });
    }
  });

  describe('allowed values', () => {
    it('size: the type column equals SwitchSize in types.ts', () => {
      const declared = /export type SwitchSize = ([^;]+);/.exec(typesSource)?.[1];
      expect(declared, 'SwitchSize not found in types.ts').toBeDefined();
      expect(squash(apiRows.find((r) => r.name === 'size')!.type)).toBe(squash(declared!));
    });

    it('size: the documented values are the ones the component accepts', () => {
      const accepted = /const SWITCH_SIZES = \[([^\]]+)\] as const/.exec(switchSource)?.[1];
      expect(accepted, 'SWITCH_SIZES not found in Switch.svelte').toBeDefined();
      expect(values(apiRows.find((r) => r.name === 'size')!.type)).toEqual(values(accepted!));
    });

    it('classNames and styles: both document exactly the parts of SwitchSemanticName', () => {
      const parts = /export type SwitchSemanticName = ([^;]+);/.exec(typesSource)?.[1];
      expect(parts, 'SwitchSemanticName not found in types.ts').toBeDefined();
      for (const name of ['classNames', 'styles']) {
        expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual(values(parts!));
      }
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Switch page: methods table', () => {
  it('documents the methods the component exports, and nothing else', () => {
    const exported = [...switchSource.matchAll(/^ {2}export function (\w+)\(/gm)].map((m) => m[1]);
    expect(methodRows.map((row) => row.name).sort()).toEqual(exported.sort());
  });

  it('gives each method the signature of the component', () => {
    for (const row of methodRows) {
      const parameters = new RegExp(`export function ${row.name}\\(([^)]*)\\): void`).exec(switchSource)?.[1];
      expect(parameters, `${row.name} not found in Switch.svelte`).toBeDefined();
      expect(row.type).toBe(`(${parameters}) => void`);
    }
  });
});

describe('Switch page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Switch`, () => {
      expect(switchSource).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-switch-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-switch-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => /-(track|handle-bg|content-color)/.test(r.name) && !/-(height|size|width)/.test(r.name))) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Switch page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/switch/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/switch/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders switches of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('button.ads-switch[role="switch"]').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: every switch has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const element of container.querySelectorAll('.ads-switch')) {
        const named =
          element.hasAttribute('aria-label') ||
          element.hasAttribute('aria-labelledby') ||
          (element.id !== '' && container.querySelector(`label[for="${element.id}"]`) !== null);
        expect(named, element.outerHTML).toBe(true);
      }
    });
  }

  it('every property of the API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    for (const name of documentedNames) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
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
