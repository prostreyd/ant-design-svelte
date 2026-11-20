// The Icon page of the documentation site must say what the component really does.
// The API, function and token tables are data (docs/src/docs/data/icon.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRows, demos, fnRows, tokenRows } from '../../docs/src/docs/data/icon';
import { iconGroups } from '../../docs/src/docs/data/icon-groups';
import * as library from '../../src/lib/Icon/data';
import { iconExamples } from '../../docs/src/docs/icon-examples';
import { setTwoToneColor } from '../../src/lib/Icon/twoTone.svelte';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const typesSource = read('src/lib/Icon/types.ts');
const iconSource = read('src/lib/Icon/Icon.svelte');
const indexSource = read('src/lib/index.ts');
const tokensCss = read('src/lib/tokens.css');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const documentedNames = apiRows.filter((row) => row.name !== 'native attributes').map((row) => row.name);

/** Property names of the `IconProps` type. */
function declaredProps(): string[] {
  const body = /export type IconProps = [\s\S]*?& \{([\s\S]*?)\n\};/.exec(typesSource)?.[1];
  expect(body, 'IconProps block not found in types.ts').toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
}

describe('Icon page: API table', () => {
  it('documents every property of the icon and nothing else', () => {
    expect([...documentedNames].sort()).toEqual(declaredProps().sort());
  });

  it('has no property listed twice', () => {
    expect(new Set(documentedNames).size).toBe(documentedNames.length);
  });

  it('the type column of each property equals the type of types.ts', () => {
    expect(squash(apiRows.find((r) => r.name === 'twoToneColor')!.type)).toBe(squash(/export type TwoToneColor = ([^;]+);/.exec(typesSource)![1]));
    expect(squash(apiRows.find((r) => r.name === 'icon')!.type)).toBe('IconDefinition');
    expect(typesSource).toMatch(/icon\?: IconDefinition;/);
    expect(typesSource).toMatch(/component\?: Component<IconComponentProps>;/);
    expect(typesSource).toMatch(/children\?: Snippet;/);
    expect(typesSource).toMatch(/spin\?: boolean;/);
    expect(typesSource).toMatch(/rotate\?: number;/);
    expect(typesSource).toMatch(/label\?: string;/);
  });

  it('the default column is true to the component: spin is off, except for the loading drawing', () => {
    expect(apiRows.find((r) => r.name === 'spin')!.default).toBe('false');
    expect(iconSource).toContain("spin ?? icon?.name === 'loading'");
    for (const name of documentedNames.filter((n) => n !== 'spin')) expect(apiRows.find((r) => r.name === name)!.default, name).toBe('—');
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...apiRows, ...fnRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
    }
  });

  it('has no method table: the component exports no method', () => {
    expect(iconSource).not.toMatch(/^ {2}export function /m);
  });
});

describe('Icon page: functions table', () => {
  it('lists the three functions that the package exports, and only those', () => {
    expect(fnRows.map((row) => row.name)).toEqual(['setTwoToneColor', 'getTwoToneColor', 'createFromIconfontCN']);
    for (const row of fnRows) expect(indexSource, row.name).toMatch(new RegExp(`\\b${row.name}\\b`));
  });

  it('the signatures are the ones of the sources', () => {
    expect(read('src/lib/Icon/twoTone.svelte.ts')).toContain('export function setTwoToneColor(color: TwoToneColor): void');
    expect(read('src/lib/Icon/twoTone.svelte.ts')).toContain('export function getTwoToneColor(): [string, string]');
    expect(read('src/lib/Icon/iconfont.ts')).toContain('export function createFromIconfontCN(options: IconFontOptions = {})');
    expect(fnRows.find((r) => r.name === 'setTwoToneColor')!.signature).toContain('string | [string, string]');
  });
});

describe('Icon page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
  const colorSource = read('src/lib/Icon/twoTone.svelte.ts');

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the icon`, () => {
      expect(colorSource).toContain(`var(${row.name})`);
    });
  }

  it('lists every --ads-icon-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-icon-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('the dark theme has its own light color', () => {
    const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
    expect(dark).toContain('--ads-icon-twotone-secondary:');
  });

  it('the spinner uses the shared motion tokens, with the 1 s and 2.5 s the page states', () => {
    expect(iconSource).toContain('var(--ads-motion-duration-spinner, 1s)');
    expect(iconSource).toContain('var(--ads-motion-duration-spinner-reduced, 2.5s)');
    expect(tokens.get('--ads-motion-duration-spinner')).toBe('1s');
    expect(tokens.get('--ads-motion-duration-spinner-reduced')).toBe('2.5s');
  });
});

describe('Icon page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/icon/[0-9]*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/icon/[0-9]*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // jsdom has no object URLs; the iconfont example makes its sprite script with one.
    URL.createObjectURL = vi.fn(() => 'blob:sprite');
  });
  afterEach(() => {
    setTwoToneColor(['var(--ads-icon-twotone-primary)', 'var(--ads-icon-twotone-secondary)']);
    vi.restoreAllMocks();
    for (const script of document.querySelectorAll('script[data-ads-iconfont]')) script.remove();
  });

  it('there is one example file per demo, in the order of the page, and the registry holds them', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
    expect(iconExamples.map((example) => example.slug)).toEqual(demos.map((demo) => demo.slug));
  });

  it('the code shown for an example is its file, and the file of the component it imports comes after it', () => {
    for (const example of iconExamples) {
      const file = files.find((f) => f.endsWith(`-${example.slug}.svelte`))!;
      expect(example.code.startsWith(sources[file]), example.slug).toBe(true);
    }
    const component = iconExamples.find((example) => example.slug === 'component')!;
    expect(component.code).toContain('<!-- panda-svg.part.svelte -->');
    expect(component.code).toContain('A custom drawing for Icon');
    expect(iconExamples.find((example) => example.slug === 'basic')!.code).not.toContain('part.svelte -->');
  });

  for (const file of files) {
    const name = file.split('/').pop()!;

    it(`${name}: renders icons of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-icon').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.ads-icon svg').length).toBeGreaterThan(0);
    });

    it(`${name}: every icon that is an image has a name, so none is unnamed`, () => {
      const { container } = render(examples[file].default);
      for (const image of container.querySelectorAll('[role="img"]')) {
        expect((image.getAttribute('aria-label') ?? '').trim(), image.outerHTML.slice(0, 120)).not.toBe('');
      }
    });

    it(`${name}: is built on a stack of units, with no loose text at the root`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelector('.stack'), 'a .stack wrapper').not.toBeNull();
      for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) expect((node.textContent ?? '').trim(), 'loose text').toBe('');
      }
    });
  }

  it('every property of the API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n') + iconExamples.map((example) => example.code).join('\n');
    for (const name of documentedNames) expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    expect(code).toContain('onclick');
  });

  it('every function of the functions table is shown in an example', () => {
    const code = Object.values(sources).join('\n');
    for (const row of fnRows) expect(code, row.name).toContain(row.name);
  });

  it('the examples keep the state of each group apart: no two icons bind one variable', () => {
    for (const [file, code] of Object.entries(sources)) expect(code.match(/bind:/g)?.length ?? 0, file).toBeLessThanOrEqual(1);
  });

  it('the global color example puts the default back when it leaves the page', async () => {
    const file = files.find((f) => f.includes('two-tone'))!;
    const { unmount, container } = render(examples[file].default);
    const button = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Orange'))!;
    button.click();
    await Promise.resolve();
    expect(container.querySelector('[role="status"]')!.textContent).toContain('#fa8c16');
    unmount();
    const probe = render(examples[file].default);
    expect(probe.container.querySelector('[role="status"]')!.textContent).toContain('var(--ads-icon-twotone-primary)');
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });

  it('the iconfont example makes its own sprite, so it needs no network, and asks for it once per font', () => {
    const file = files.find((f) => f.includes('iconfont'))!;
    render(examples[file].default);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('script[data-ads-iconfont]')).toHaveLength(1);
  });
});

describe('Icon page: the groups of the gallery', () => {
  const THEMES = ['Outlined', 'Filled', 'TwoTone'];
  const drawings = Object.keys(library).filter((key) => /^[A-Z]/.test(key) && typeof (library as Record<string, { theme?: string }>)[key]?.theme === 'string');
  const listed = iconGroups.flatMap((group) => group.names.flatMap((name) => THEMES.map((theme) => name + theme)).filter((full) => drawings.includes(full)));

  it('there are the six groups of the Ant Design list, in its order, each with a title in three languages', () => {
    expect(iconGroups.map((group) => group.id)).toEqual(['direction', 'suggestion', 'editor', 'data', 'brand', 'application']);
    expect(iconGroups.map((group) => group.title.en)).toEqual(['Directional Icons', 'Suggested Icons', 'Editor Icons', 'Data Icons', 'Brand and Logos', 'Application Icons']);
    for (const group of iconGroups) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(group.title[lang].trim(), `${group.id} (${lang})`).not.toBe('');
      expect(group.names.length, group.id).toBeGreaterThan(10);
    }
  });

  it('every drawing of the package is in exactly one group, in one place, so the gallery shows all of them and none twice', () => {
    expect(listed.length).toBe(drawings.length);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...drawings].sort());
  });

  it('no name of a group is missing from the package: each has at least one theme', () => {
    for (const group of iconGroups) {
      for (const name of group.names) expect(THEMES.some((theme) => drawings.includes(name + theme)), `${group.id}: ${name}`).toBe(true);
    }
  });

  it('a name stands once in the whole list, without a theme in it', () => {
    const names = iconGroups.flatMap((group) => group.names);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name, name).not.toMatch(/(Outlined|Filled|TwoTone)$/);
  });

  it('the order is the one of the Ant Design list (its first and last names, and the two drawings that stand beside their kin)', () => {
    expect(iconGroups[0].names.slice(0, 4)).toEqual(['StepBackward', 'StepForward', 'FastBackward', 'FastForward']);
    expect(iconGroups[1].names.slice(0, 3)).toEqual(['Question', 'QuestionCircle', 'Plus']);
    expect(iconGroups[2].names.slice(0, 3)).toEqual(['Edit', 'Form', 'Copy']);
    expect(iconGroups[3].names.slice(0, 3)).toEqual(['AreaChart', 'PieChart', 'BarChart']);
    expect(iconGroups[4].names.slice(0, 3)).toEqual(['Android', 'Apple', 'Windows']);
    expect(iconGroups[5].names.slice(0, 3)).toEqual(['AccountBook', 'Aim', 'Alert']);
    const application = iconGroups[5].names;
    expect(application[application.indexOf('Copyright') + 1]).toBe('CopyrightCircle');
    expect(application[application.indexOf('Dollar') + 1]).toBe('DollarCircle');
  });
});
