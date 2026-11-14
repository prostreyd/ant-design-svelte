// The Tooltip page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/tooltip.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, tokenRows } from '../../docs/src/docs/data/tooltip';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const tooltipSource = read('src/lib/Tooltip/Tooltip.svelte');
const popupSource = read('src/lib/internal/popup/Popup.svelte');
const typesSource = read('src/lib/Tooltip/types.ts');
const popupTypes = read('src/lib/internal/popup/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const documentedNames = apiRows.map((row) => row.name);
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

/** Property names of the `TooltipProps` type of the component. */
function declaredProps(): string[] {
  const body = /type TooltipProps = \{([\s\S]*?)\n {2}\};/.exec(tooltipSource)?.[1];
  expect(body, 'TooltipProps block not found in Tooltip.svelte').toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of the component. */
function declaredDefaults(): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: TooltipProps = \$props\(\);/.exec(tooltipSource)?.[1];
  expect(body, '$props() destructuring not found in Tooltip.svelte').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = (.+?),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

describe('Tooltip page: API table', () => {
  it('documents every property of the component and nothing else', () => {
    expect([...documentedNames].sort()).toEqual(declaredProps().sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documentedNames).size).toBe(documentedNames.length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults();
    for (const row of apiRows) {
      it(`${row.name}: the default column matches the component`, () => {
        const declared = defaults.get(row.name);
        expect(row.default).toBe(declared === undefined || declared === 'undefined' ? '—' : declared);
      });
    }
  });

  describe('allowed values', () => {
    it('placement: the documented values are the 12 of the popup primitive', () => {
      const accepted = /export const POPUP_PLACEMENTS = \[([^\]]+)\] as const/.exec(popupTypes)?.[1];
      expect(accepted, 'POPUP_PLACEMENTS not found').toBeDefined();
      expect(values(apiRows.find((r) => r.name === 'placement')!.type)).toEqual(values(accepted!));
    });

    it('trigger: the documented values are the ones the component accepts', () => {
      const accepted = /const TRIGGERS = \[([^\]]+)\] as const/.exec(tooltipSource)?.[1];
      expect(accepted, 'TRIGGERS not found in Tooltip.svelte').toBeDefined();
      expect([...new Set(values(apiRows.find((r) => r.name === 'trigger')!.type))]).toEqual(values(accepted!));
    });

    it('classNames and styles: both document exactly the parts of TooltipSemanticName', () => {
      const parts = /export type TooltipSemanticName = ([^;]+);/.exec(typesSource)?.[1];
      expect(parts, 'TooltipSemanticName not found in types.ts').toBeDefined();
      for (const name of ['classNames', 'styles']) {
        expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual(values(parts!));
      }
    });

    it('color: the description names the 13 presets of the component', () => {
      const presets = /TOOLTIP_PRESET_COLORS = \[([^\]]+)\] as const/.exec(typesSource)?.[1];
      expect(presets, 'TOOLTIP_PRESET_COLORS not found in types.ts').toBeDefined();
      const description = apiRows.find((r) => r.name === 'color')!.description.en;
      for (const name of values(presets!)) expect(description, name).toContain(`<code>${name}</code>`);
    });

    it('title: the type column matches the prop type of the component', () => {
      const declared = /^ {4}title\?: ([^;]+);/m.exec(tooltipSource)?.[1];
      expect(squash(apiRows.find((r) => r.name === 'title')!.type)).toBe(squash(declared!));
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of apiRows) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Tooltip page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
  const used = tooltipSource + popupSource;

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Tooltip`, () => {
      // The 13 presets are used through a name built from the color: `--ads-tooltip-preset-${preset}`.
      const name = row.name.startsWith('--ads-tooltip-preset-') ? '--ads-tooltip-preset-${preset}' : row.name;
      expect(used).toContain(name);
    });
  }

  it('lists every --ads-tooltip-* token of tokens.css (a preset text token belongs to the row of its preset)', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-tooltip-') && !name.endsWith('-text') || name === '--ads-tooltip-color').sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
    for (const row of tokenRows.filter((r) => r.name.startsWith('--ads-tooltip-preset-'))) {
      expect(tokens.has(`${row.name}-text`), `${row.name}-text`).toBe(true);
    }
  });

  it('defines the colour tokens again for the dark theme', () => {
    for (const row of tokenRows.filter((r) => r.name === '--ads-tooltip-bg' || r.name.startsWith('--ads-tooltip-preset-'))) {
      expect(dark, row.name).toContain(`${row.name}:`);
      if (row.name.startsWith('--ads-tooltip-preset-')) expect(dark, `${row.name}-text`).toContain(`${row.name}-text:`);
    }
  });
});

describe('Tooltip page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/tooltip/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/tooltip/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders tooltips of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-tooltip-trigger').length).toBeGreaterThan(0);
    });
  }

  it('every property of the API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    // `children` is the content between the tags, in every example.
    for (const name of documentedNames.filter((n) => n !== 'children')) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every placement, every trigger and every preset color is shown in an example', () => {
    const code = Object.values(sources).join('\n');
    for (const trigger of ['hover', 'focus', 'click', 'contextMenu']) expect(code, trigger).toContain(trigger);
    expect(code).toContain('TOOLTIP_PRESET_COLORS');
    const placements = /export const POPUP_PLACEMENTS = \[([^\]]+)\] as const/.exec(popupTypes)![1];
    for (const placement of values(placements)) expect(code, placement).toContain(`'${placement}'`);
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
