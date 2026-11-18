// The Spin page of the documentation site must say what the component really does.
// The API, semantic parts and token tables are data (docs/src/docs/data/spin.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRows, demos, partRows, tokenRows } from '../../docs/src/docs/data/spin';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const spinSource = read('src/lib/Spin/Spin.svelte');
const typesSource = read('src/lib/Spin/types.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const documentedNames = apiRows.filter((row) => row.name !== 'native attributes').map((row) => row.name);
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

/** Property names of the `SpinProps` type of the component. */
function declaredProps(): string[] {
  const body = /type SpinProps = [\s\S]*?& \{([\s\S]*?)\n {2}\};/.exec(spinSource)?.[1];
  expect(body, 'SpinProps block not found in Spin.svelte').toBeDefined();
  return [...body!.matchAll(/^ {4}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of the component. */
function declaredDefaults(): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: SpinProps = \$props\(\);/.exec(spinSource)?.[1];
  expect(body, '$props() destructuring not found in Spin.svelte').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = ([^,\n]+),?$/gm)].map((m) => [m[1], m[2].trim()]));
}

describe('Spin page: API table', () => {
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
    it('size: the type column equals SpinSize in types.ts', () => {
      const declared = /export type SpinSize = ([^;]+);/.exec(typesSource)?.[1];
      expect(declared, 'SpinSize not found in types.ts').toBeDefined();
      expect(squash(apiRows.find((r) => r.name === 'size')!.type)).toBe(squash(declared!));
    });

    it('size: the documented values are the ones the component accepts', () => {
      const accepted = /const SPIN_SIZES = \[([^\]]+)\] as const/.exec(spinSource)?.[1];
      expect(accepted, 'SPIN_SIZES not found in Spin.svelte').toBeDefined();
      expect(values(apiRows.find((r) => r.name === 'size')!.type)).toEqual(values(accepted!));
    });

    it('classNames and styles: both document exactly the parts of SpinSemanticName', () => {
      const parts = /export type SpinSemanticName = ([^;]+);/.exec(typesSource)?.[1];
      expect(parts, 'SpinSemanticName not found in types.ts').toBeDefined();
      for (const name of ['classNames', 'styles']) {
        expect(values(apiRows.find((r) => r.name === name)!.type), name).toEqual(values(parts!));
      }
    });

    it('percent: the type column is a number or the word auto', () => {
      expect(squash(apiRows.find((r) => r.name === 'percent')!.type)).toBe("number | 'auto'");
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...partRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
      }
    }
  });

  it('has no method table: the component exports no method', () => {
    expect(spinSource).not.toMatch(/^ {2}export function /m);
  });
});

describe('Spin page: semantic parts table', () => {
  it('lists exactly the parts of SpinSemanticName, in order', () => {
    const parts = /export type SpinSemanticName = ([^;]+);/.exec(typesSource)?.[1] ?? '';
    expect(partRows.map((row) => row.name)).toEqual([...parts.matchAll(/'([^']+)'/g)].map((m) => m[1]));
  });

  it('every part has a class of its own in the component', () => {
    for (const row of partRows) {
      const className = row.name === 'root' ? 'ads-spin' : `ads-spin-${row.name}`;
      expect(spinSource, row.name).toContain(`'${className}'`);
    }
  });
});

describe('Spin page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Spin`, () => {
      expect(spinSource).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-spin-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-spin-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('defines the colour tokens again for the dark theme', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    for (const row of tokenRows.filter((r) => /-(color|mask-bg|ring-track)$/.test(r.name) && r.name !== '--ads-spin-fullscreen-color')) {
      expect(dark, row.name).toContain(`${row.name}:`);
    }
  });
});

describe('Spin page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/spin/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/spin/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    const name = file.split('/').pop()!;

    it(`${name}: renders Spins of the real library`, async () => {
      const { container } = render(examples[file].default);
      if (name.includes('fullscreen')) {
        // Nothing spins until the button is pressed, and a Spin that does not spin renders nothing.
        expect(container.querySelector('.ads-spin')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Show fullscreen' }));
        expect(container.querySelector('.ads-spin-fullscreen')).not.toBeNull();
      } else {
        expect(container.querySelectorAll('.ads-spin').length).toBeGreaterThan(0);
      }
    });

    it(`${name}: every Spin that speaks has a message or a name, so none is silent`, async () => {
      const { container } = render(examples[file].default);
      if (name.includes('fullscreen')) await userEvent.click(screen.getByRole('button', { name: 'Show fullscreen' }));
      for (const status of container.querySelectorAll('[role="status"]')) {
        // The Spin's own status elements only; an example may have a status text of its own (a log line).
        if (!status.matches('.ads-spin, .ads-spin-section')) continue;
        const named =
          status.hasAttribute('aria-label') ||
          status.hasAttribute('aria-labelledby') ||
          (status.querySelector('.ads-spin-description')?.textContent ?? '').trim() !== '';
        expect(named, status.outerHTML).toBe(true);
      }
    });

    it(`${name}: is built on a stack of units, with no loose text at the root`, () => {
      const { container } = render(examples[file].default);
      const root = container.querySelector('.stack');
      expect(root, 'a .stack wrapper').not.toBeNull();
      for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) expect((node.textContent ?? '').trim(), 'loose text').toBe('');
      }
    });
  }

  it('every property of the API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    for (const name of documentedNames) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });

  it('the embedded example lets the keyboard reach the covered button, as the page says', async () => {
    const file = files.find((f) => f.includes('embedded'))!;
    render(examples[file].default);
    const button = screen.getByRole('button', { name: 'Press me' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/pressed 1 times/)).toBeInTheDocument();
  });

  it('the examples keep the state of each Spin apart: no two Spins bind one variable', () => {
    for (const [file, code] of Object.entries(sources)) {
      expect(code.match(/bind:/g)?.length ?? 0, file).toBeLessThanOrEqual(1);
    }
  });
});
