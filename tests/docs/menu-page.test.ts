// The Menu page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/menu.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, itemTables, tokenRows } from '../../docs/src/docs/data/menu';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const menuSource = read('src/lib/Menu/Menu.svelte');
const listSource = read('src/lib/Menu/MenuList.svelte');
const tipSource = read('src/lib/Menu/MenuTip.svelte');
const typesSource = read('src/lib/Menu/types.ts');
const indexSource = read('src/lib/index.ts');
const tokensCss = read('src/lib/tokens.css');

const documentedNames = apiRows.map((row) => row.name);
const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();

/** The member names of `export interface <name> ... { }` in types.ts. */
function members(name: string): string[] {
  const body = new RegExp(`export interface ${name}\\b[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
}

/** Default values from the `$props()` destructuring of the component. */
function declaredDefaults(): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: MenuProps = \$props\(\);/.exec(menuSource)?.[1];
  expect(body, '$props() destructuring not found in Menu.svelte').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = (.+?),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

describe('Menu page: API table', () => {
  it('documents every property of the component and nothing else', () => {
    expect([...documentedNames].sort()).toEqual(members('MenuProps').sort());
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
    const constant = (name: string) => {
      const accepted = new RegExp(`export const ${name} = \\[([^\\]]+)\\] as const`).exec(typesSource)?.[1];
      expect(accepted, `${name} not found in types.ts`).toBeDefined();
      return values(accepted!);
    };

    it('mode, theme and triggerSubMenuAction: the documented values are the ones the component accepts', () => {
      expect(values(apiRows.find((r) => r.name === 'mode')!.type)).toEqual(constant('MENU_MODES'));
      expect(values(apiRows.find((r) => r.name === 'theme')!.type)).toEqual(constant('MENU_THEMES'));
      expect(values(apiRows.find((r) => r.name === 'triggerSubMenuAction')!.type)).toEqual(constant('MENU_TRIGGER_ACTIONS'));
    });

    it('classNames and styles: the description names every part', () => {
      const parts = /export type MenuSemanticName = ([^;]+);/.exec(typesSource)?.[1];
      const subParts = /export type MenuSubMenuSemanticName = ([^;]+);/.exec(typesSource)?.[1];
      expect(parts, 'MenuSemanticName not found').toBeDefined();
      expect(subParts, 'MenuSubMenuSemanticName not found').toBeDefined();
      for (const name of [...values(parts!), ...values(subParts!)]) {
        expect(apiRows.find((r) => r.name === 'classNames')!.description.en, name).toContain(`<code>${name}</code>`);
      }
    });

    it('tooltip: the description names the props of MenuTooltipProps', () => {
      for (const name of members('MenuTooltipProps')) {
        expect(apiRows.find((r) => r.name === 'tooltip')!.description.en, name).toContain(`<code>${name}</code>`);
      }
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

describe('Menu page: the item types, the arguments of the callbacks and the markup components', () => {
  const table = (id: string) => itemTables.find((entry) => entry.id === id)!;
  const names = (id: string) => table(id).rows.map((row) => row.name).sort();

  it('item: the fields of MenuItemType', () => {
    expect(names('item')).toEqual(members('MenuItemType').sort());
  });

  it('submenu: the fields of MenuSubMenuType', () => {
    expect(names('submenu')).toEqual(members('MenuSubMenuType').sort());
  });

  it('group and divider: the fields of MenuGroupType and MenuDividerType', () => {
    expect(names('group')).toEqual(members('MenuGroupType').sort());
    expect(names('divider')).toEqual(members('MenuDividerType').sort());
  });

  it('info: every field of the objects the callbacks and snippets get', () => {
    const all = new Set(['MenuClickInfo', 'MenuSelectInfo', 'MenuTitleClickInfo', 'MenuExpandIconInfo', 'MenuPopupInfo'].flatMap(members));
    expect(names('info')).toEqual([...all].sort());
  });

  it('markup: a row for each component that the library exports, naming every prop of it', () => {
    const exported = [...indexSource.matchAll(/as (Menu(?:Item|SubMenu|ItemGroup|Divider)) \}/g)].map((m) => m[1]);
    expect(names('markup')).toEqual([...exported].sort());
    const propsOf: Record<string, string> = { MenuItem: 'MenuItemProps', MenuSubMenu: 'MenuSubMenuProps', MenuItemGroup: 'MenuItemGroupProps', MenuDivider: 'MenuDividerProps' };
    for (const row of table('markup').rows) {
      for (const prop of members(propsOf[row.name]).filter((name) => name !== 'children')) {
        expect(row.description.en, `${row.name}.${prop}`).toContain(`<code>${prop}</code>`);
      }
    }
  });

  it('every row is described in English, Russian and Chinese, and every table has a title in three languages', () => {
    for (const entry of itemTables) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(entry.title[lang].trim(), `${entry.id} title (${lang})`).not.toBe('');
        for (const row of entry.rows) expect(row.description[lang].trim(), `${entry.id}.${row.name} (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Menu page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].replace(/\s+/g, ' ').trim().toLowerCase()]));
  const used = menuSource + listSource + tipSource;

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.replace(/\s+/g, ' ').toLowerCase());
    });

    it(`${row.name}: is used by the Menu`, () => {
      expect(used).toContain(row.name);
    });
  }

  it('lists every --ads-menu-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-menu-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });
});

describe('Menu page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/menu/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/menu/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders menus of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('ul.ads-menu-root').length).toBeGreaterThan(0);
    });
  }

  it('every property of the API table is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    // `children` is the markup of the last example; `class` and `style` are the attributes of any element.
    for (const name of documentedNames.filter((n) => !['children', 'class', 'style'].includes(n))) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every mode, theme and trigger action, and every item field and markup component, is shown in an example', () => {
    const code = Object.values(sources).join('\n');
    for (const value of ['vertical', 'horizontal', 'inline', 'light', 'dark', 'hover', 'click']) expect(code, value).toContain(value);
    for (const table of itemTables.filter((entry) => ['item', 'submenu', 'group', 'divider'].includes(entry.id))) {
      for (const row of table.rows.filter((r) => !['type', 'key', 'class'].includes(r.name))) {
        expect(new RegExp(`\\b${row.name}\\b`).test(code), `${table.id}.${row.name} is not used in any example`).toBe(true);
      }
    }
    for (const row of itemTables.find((entry) => entry.id === 'markup')!.rows) expect(code, row.name).toContain(`<${row.name}`);
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of ['en', 'ru', 'zh'] as const) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });

  it('every demo takes a whole row: the bars and the popups that open to the side need the width of the page', () => {
    expect(demos.filter((demo) => !demo.wide).map((demo) => demo.slug)).toEqual([]);
  });
});
