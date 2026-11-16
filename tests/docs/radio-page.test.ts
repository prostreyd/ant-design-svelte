// The Radio page of the documentation site must say what the components really do.
// The API, option, methods and token tables are data (docs/src/docs/data/radio.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, buttonApiRows, demos, groupApiRows, methodRows, optionRows, tokenRows } from '../../docs/src/docs/data/radio';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const radioSource = read('src/lib/Radio/Radio.svelte');
const buttonSource = read('src/lib/Radio/RadioButton.svelte');
const groupSource = read('src/lib/Radio/RadioGroup.svelte');
const typesSource = read('src/lib/Radio/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
const named = (rows: typeof apiRows) => rows.filter((row) => row.name !== 'native attributes').map((row) => row.name);
const union = (name: string) => {
  const declared = new RegExp(`export type ${name} = ([^;]+);`).exec(typesSource)?.[1];
  expect(declared, `${name} not found in types.ts`).toBeDefined();
  return declared!;
};

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
  { label: 'Radio', name: 'Radio', source: radioSource, rows: apiRows },
  { label: 'RadioButton', name: 'RadioButton', source: buttonSource, rows: buttonApiRows },
  { label: 'RadioGroup', name: 'RadioGroup', source: groupSource, rows: groupApiRows }
];

for (const { label, name, source, rows } of components) {
  describe(`Radio page: ${label} API table`, () => {
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

describe('Radio page: allowed values', () => {
  it('Radio classNames and styles: both document exactly the parts of RadioSemanticName', () => {
    for (const name of ['classNames', 'styles']) {
      expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual(values(union('RadioSemanticName')));
    }
  });

  it('RadioButton classNames and styles: both document exactly the parts of RadioButtonSemanticName', () => {
    for (const name of ['classNames', 'styles']) {
      expect(values(buttonApiRows.find((r) => r.name === name)!.type), name).toEqual(values(union('RadioButtonSemanticName')));
    }
  });

  it('RadioGroup classNames and styles: both document exactly the parts of RadioGroupSemanticName', () => {
    for (const name of ['classNames', 'styles']) {
      expect(values(groupApiRows.find((r) => r.name === name)!.type), name).toEqual(values(union('RadioGroupSemanticName')));
    }
  });

  it('value: the type column equals RadioValue in types.ts, for the radio, the option and (with null) the group', () => {
    const declared = squash(union('RadioValue'));
    expect(squash(apiRows.find((r) => r.name === 'value')!.type)).toBe(declared);
    expect(squash(optionRows.find((r) => r.name === 'value')!.type)).toBe(declared);
    expect(squash(groupApiRows.find((r) => r.name === 'value')!.type)).toBe(`${declared} | null`);
  });

  it.each([
    ['optionType', 'RadioOptionType'],
    ['buttonStyle', 'RadioButtonStyle'],
    ['size', 'RadioSize'],
    ['orientation', 'RadioOrientation']
  ])('%s: the type column lists exactly the values of %s', (prop, type) => {
    expect(values(groupApiRows.find((r) => r.name === prop)!.type)).toEqual(values(union(type)));
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...buttonApiRows, ...groupApiRows, ...optionRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Radio page: option table', () => {
  it('documents every field of RadioOption and nothing else', () => {
    const body = /export interface RadioOption \{([\s\S]*?)\n\}/.exec(typesSource)?.[1];
    expect(body, 'RadioOption not found in types.ts').toBeDefined();
    const fields = [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
    expect(optionRows.map((row) => row.name).sort()).toEqual(fields.sort());
  });
});

describe('Radio page: methods table', () => {
  it('documents the methods Radio and RadioButton export, and nothing else', () => {
    for (const source of [radioSource, buttonSource]) {
      const exported = [...source.matchAll(/^ {2}export function (\w+)\(/gm)].map((m) => m[1]);
      expect(methodRows.map((row) => row.name).sort()).toEqual(exported.sort());
    }
  });

  it('the group exports no methods', () => {
    expect([...groupSource.matchAll(/^ {2}export function (\w+)\(/gm)]).toHaveLength(0);
  });

  it('gives each method the signature of the components', () => {
    for (const source of [radioSource, buttonSource]) {
      for (const row of methodRows) {
        const parameters = new RegExp(`export function ${row.name}\\(([^)]*)\\): void`).exec(source)?.[1];
        expect(parameters, `${row.name} not found`).toBeDefined();
        expect(row.type).toBe(`(${parameters}) => void`);
      }
    }
  });
});

describe('Radio page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
  const sources = radioSource + buttonSource + groupSource;

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by a Radio component`, () => {
      expect(sources).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-radio-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-radio-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => !/-(size|radius|width|padding|padding-inline|padding-inline-sm|gap|font-size|line-height)$/.test(r.name))) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Radio page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/radio/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/radio/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders radios of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('label.ads-radio input[type="radio"], label.ads-radio-button input[type="radio"]').length).toBeGreaterThan(0);
    });

    it(`${file.split('/').pop()}: every radio has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const input of container.querySelectorAll<HTMLInputElement>('.ads-radio input, .ads-radio-button input')) {
        const named =
          input.hasAttribute('aria-label') ||
          input.hasAttribute('aria-labelledby') ||
          input.closest('label')?.querySelector('.ads-radio-label, .ads-radio-button-label') != null ||
          (input.id !== '' && container.querySelector(`label[for="${input.id}"]`) !== null);
        expect(named, input.outerHTML).toBe(true);
      }
    });

    it(`${file.split('/').pop()}: every group has an accessible name`, () => {
      const { container } = render(examples[file].default);
      for (const group of container.querySelectorAll('.ads-radio-group')) {
        expect(group.hasAttribute('aria-label') || group.hasAttribute('aria-labelledby'), group.outerHTML).toBe(true);
      }
    });
  }

  it('every property of every API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    for (const name of [...new Set([...named(apiRows), ...named(buttonApiRows), ...named(groupApiRows), ...optionRows.map((row) => row.name)])]) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every property of the RadioGroup is used on a RadioGroup, not only on a Radio', () => {
    const code = Object.values(sources).join('\n');
    const groups = [...code.matchAll(/<RadioGroup\b[\s\S]*?(?:\/>|<\/RadioGroup>)/g)].map((m) => m[0]).join('\n');
    for (const name of named(groupApiRows).filter((prop) => prop !== 'children')) {
      expect(new RegExp(`\\b${name}\\b`).test(groups), `${name} is not used on a RadioGroup in any example`).toBe(true);
    }
  });

  it('every property of RadioButton is used on a RadioButton or through a group of buttons', () => {
    const code = Object.values(sources).join('\n');
    expect(code).toMatch(/<RadioButton\b/);
    expect(code).toMatch(/optionType="button"/);
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
