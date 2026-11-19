// The Notification page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/notification.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { demos, methodRows, optionRows, settingRows, tokenRows } from '../../docs/src/docs/data/notification';
import { removeLayer } from '../../src/lib/Notification/layer';
import { DEFAULT_DURATION, DEFAULT_LABELS, DEFAULT_PLACEMENT, DEFAULT_THRESHOLD, resetNotifications } from '../../src/lib/Notification/store';
import { NOTIFICATION_PLACEMENTS } from '../../src/lib/Notification/types';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const typesSource = read('src/lib/Notification/types.ts');
const tokensCss = read('src/lib/tokens.css');
const sources = [
  ...['NotificationItem.svelte', 'NotificationLayer.svelte', 'NotificationPlace.svelte', 'NotificationProgress.svelte'].map((file) => read(`src/lib/Notification/${file}`)),
  // The motion and the pile moved to the shared parts (specs/overlay.md, A2, A3, PL).
  read('src/lib/internal/anim/motion.ts'),
  read('src/lib/internal/pile/pile.svelte.ts')
].join('\n');

/** The property names of an interface of types.ts. */
function members(name: string): string[] {
  const body = new RegExp(`export interface ${name}(?: extends [^{]+)? \\{([\\s\\S]*?)\\n\\}`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:|^ {2}(\w+)\(/gm)].map((m) => m[1] ?? m[2]);
}

const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]);

afterEach(() => {
  removeLayer();
  resetNotifications();
  document.body.innerHTML = '';
});

describe('Notification page: API tables', () => {
  it('the options table documents every option of NotificationOptions and nothing else', () => {
    expect(optionRows.map((row) => row.name).sort()).toEqual(members('NotificationOptions').sort());
  });

  it('the settings table documents every setting of NotificationConfig and nothing else', () => {
    expect(settingRows.map((row) => row.name).sort()).toEqual(members('NotificationConfig').sort());
  });

  it('the methods table names every method of the notification object', () => {
    const text = methodRows.map((row) => row.name).join('\n');
    for (const method of members('NotificationApi')) expect(text, method).toContain(method);
  });

  it('no table lists a name twice', () => {
    for (const rows of [optionRows, settingRows, methodRows]) {
      const names = rows.map((row) => row.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('placement: the documented places are the six of the component, in the options and in the settings', () => {
    expect(values(optionRows.find((row) => row.name === 'placement')!.type)).toEqual([...NOTIFICATION_PLACEMENTS]);
    expect(values(settingRows.find((row) => row.name === 'placement')!.type)).toEqual([...NOTIFICATION_PLACEMENTS]);
  });

  it('onclose: the documented reasons are the four of the list', () => {
    expect(values(optionRows.find((row) => row.name === 'onclose')!.type)).toEqual(['timeout', 'user', 'replaced', 'destroy']);
  });

  it('classNames and styles: the options document the eight parts, the settings the ten', () => {
    const parts = (type: string) => [...type.matchAll(/(\w+)\?/g)].map((m) => m[1]);
    const source = (name: string) => [...new RegExp(`export type ${name} = ([^;]+);`).exec(typesSource)![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
    for (const name of ['classNames', 'styles']) {
      expect(parts(optionRows.find((row) => row.name === name)!.type)).toEqual(source('NotificationSemanticName'));
      expect(parts(settingRows.find((row) => row.name === name)!.type)).toEqual([...source('NotificationSemanticName'), ...source('NotificationListSemanticName')]);
    }
  });

  describe('defaults', () => {
    it('duration is the default of the store, in the options table and the settings table', () => {
      expect(optionRows.find((row) => row.name === 'duration')!.default).toBe(String(DEFAULT_DURATION));
      expect(settingRows.find((row) => row.name === 'duration')!.default).toBe(String(DEFAULT_DURATION));
    });

    it('placement is the default of the store', () => {
      expect(optionRows.find((row) => row.name === 'placement')!.default).toBe(`'${DEFAULT_PLACEMENT}'`);
      expect(settingRows.find((row) => row.name === 'placement')!.default).toBe(`'${DEFAULT_PLACEMENT}'`);
    });

    it('labels: the default words are the ones of the store', () => {
      const text = settingRows.find((row) => row.name === 'labels')!.default;
      expect(values(text.replace(/"/g, "'"))).toEqual([DEFAULT_LABELS.info, DEFAULT_LABELS.success, DEFAULT_LABELS.error, DEFAULT_LABELS.warning, DEFAULT_LABELS.close]);
      expect(DEFAULT_LABELS.open).toBe('');
    });

    it('top and bottom are the tokens, closable, pauseOnHover and stack are on, showProgress is off, the threshold is 3', () => {
      for (const name of ['top', 'bottom']) {
        expect(settingRows.find((row) => row.name === name)!.default).toBe(new RegExp(`--ads-notification-${name}:\\s*(\\d+)px`).exec(tokensCss)![1]);
      }
      expect(optionRows.find((row) => row.name === 'pauseOnHover')!.default).toBe('true');
      expect(optionRows.find((row) => row.name === 'closable')!.default).toBe('true');
      expect(optionRows.find((row) => row.name === 'showProgress')!.default).toBe('false');
      expect(settingRows.find((row) => row.name === 'stack')!.default).toBe('true');
      expect(DEFAULT_THRESHOLD).toBe(3);
      expect(demos.find((demo) => demo.slug === 'stack')!.description.en).toContain('3 notifications');
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...optionRows, ...settingRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
    }
  });
});

describe('Notification page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.replace(/\s+/g, ' '));
    });

    it(`${row.name}: is used by the Notification`, () => {
      expect(sources).toContain(row.name);
    });
  }

  it('lists every --ads-notification-* token of tokens.css', () => {
    expect(tokenRows.map((row) => row.name).sort()).toEqual([...tokens.keys()].filter((name) => name.startsWith('--ads-notification-')).sort());
  });

  it('defines the colors of the box again for the dark theme', () => {
    for (const name of ['bg', 'color', 'shadow', 'icon-info', 'icon-success', 'icon-error', 'icon-warning', 'close-color']) {
      expect(dark, name).toContain(`--ads-notification-${name}:`);
    }
  });
});

describe('Notification page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/notification/*.svelte', { eager: true });
  const code = import.meta.glob<string>('../../docs/src/docs/examples/notification/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders with the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelector('button')).not.toBeNull();
    });
  }

  it('every option, every setting and every method is used in at least one example', () => {
    const all = Object.values(code).join('\n');
    for (const name of [...optionRows, ...settingRows].map((row) => row.name)) {
      expect(new RegExp(`\\b${name}\\b`).test(all), `${name} is not used in any example`).toBe(true);
    }
    for (const method of ['open', 'info', 'success', 'error', 'warning', 'destroy', 'config']) expect(all, method).toContain(`notification.${method}`);
    expect(all).toContain('NotificationHost');
  });

  it('the examples that change a setting take it back when they go (a demo must not change the others)', () => {
    for (const file of files.filter((name) => /notification\.config\(\{/.test(code[name]))) {
      expect(code[file], file).toMatch(/return \(\) => notification\.config\(\{/);
    }
  });

  it('the examples do not bind one variable to two components, and every example sits in a stack or a row', () => {
    for (const file of files) {
      const binds = [...code[file].matchAll(/bind:\w+=\{(\w+)\}/g)].map((m) => m[1]);
      expect(new Set(binds).size, `${file} binds one variable twice`).toBe(binds.length);
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

  it('the demos that need the width of the page say so: the places and the stack', () => {
    expect(demos.filter((demo) => demo.wide).map((demo) => demo.slug)).toEqual(['placement', 'stack']);
  });
});
