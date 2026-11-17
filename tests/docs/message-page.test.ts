// The Message page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/message.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { demos, methodRows, optionRows, settingRows, tokenRows } from '../../docs/src/docs/data/message';
import { removeLayer } from '../../src/lib/Message/layer';
import { DEFAULT_DURATION, DEFAULT_LABELS, DEFAULT_THRESHOLD, resetMessages } from '../../src/lib/Message/store';
import { MESSAGE_TYPES } from '../../src/lib/Message/types';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const typesSource = read('src/lib/Message/types.ts');
const tokensCss = read('src/lib/tokens.css');
const sources = ['MessageItem.svelte', 'MessageLayer.svelte', 'MessageIcon.svelte', 'motion.ts'].map((file) => read(`src/lib/Message/${file}`)).join('\n');

/** The property names of an interface of types.ts. */
function members(name: string): string[] {
  const body = new RegExp(`export interface ${name}(?: extends [^{]+)? \\{([\\s\\S]*?)\\n\\}`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:|^ {2}(\w+)\(/gm)].map((m) => m[1] ?? m[2]);
}

const values = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]);

afterEach(() => {
  removeLayer();
  resetMessages();
  document.body.innerHTML = '';
});

describe('Message page: API tables', () => {
  it('the options table documents every option of MessageOptions and nothing else', () => {
    expect(optionRows.map((row) => row.name).sort()).toEqual(members('MessageOptions').sort());
  });

  it('the settings table documents every setting of MessageConfig and nothing else', () => {
    expect(settingRows.map((row) => row.name).sort()).toEqual(members('MessageConfig').sort());
  });

  it('the methods table names every method of the message object and the handle', () => {
    const text = methodRows.map((row) => row.name).join('\n');
    for (const method of members('MessageApi')) expect(text, method).toContain(method);
    expect(text).toContain('handle()');
    expect(text).toContain('handle.then');
  });

  it('no table lists a name twice', () => {
    for (const rows of [optionRows, settingRows, methodRows]) {
      const names = rows.map((row) => row.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('type: the documented kinds are the five of the component', () => {
    expect(values(optionRows.find((row) => row.name === 'type')!.type)).toEqual([...MESSAGE_TYPES]);
    const labels = settingRows.find((row) => row.name === 'labels')!.type;
    expect(values(labels)).toEqual([...MESSAGE_TYPES, 'close']);
  });

  it('classNames and styles: the options document the five parts, the settings the seven', () => {
    const parts = (type: string) => [...type.matchAll(/(\w+)\?/g)].map((m) => m[1]);
    const source = (name: string) => [...new RegExp(`export type ${name} = ([^;]+);`).exec(typesSource)![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
    for (const name of ['classNames', 'styles']) {
      expect(parts(optionRows.find((row) => row.name === name)!.type)).toEqual(source('MessageSemanticName'));
      expect(parts(settingRows.find((row) => row.name === name)!.type)).toEqual([...source('MessageSemanticName'), ...source('MessageListSemanticName')]);
    }
  });

  describe('defaults', () => {
    it('duration is the default of the store, in the options table and the settings table', () => {
      expect(optionRows.find((row) => row.name === 'duration')!.default).toBe(String(DEFAULT_DURATION));
      expect(settingRows.find((row) => row.name === 'duration')!.default).toBe(String(DEFAULT_DURATION));
    });

    it('labels: the default words are the ones of the store', () => {
      const text = settingRows.find((row) => row.name === 'labels')!.default;
      expect(values(text.replace(/"/g, "'"))).toEqual([DEFAULT_LABELS.info, DEFAULT_LABELS.success, DEFAULT_LABELS.error, DEFAULT_LABELS.warning, DEFAULT_LABELS.loading, DEFAULT_LABELS.close]);
    });

    it('top is the token, pauseOnHover is on, closable and stack are off, the threshold is 3', () => {
      expect(settingRows.find((row) => row.name === 'top')!.default).toBe(/--ads-message-top:\s*(\d+)px/.exec(tokensCss)![1]);
      expect(optionRows.find((row) => row.name === 'pauseOnHover')!.default).toBe('true');
      expect(optionRows.find((row) => row.name === 'closable')!.default).toBe('false');
      expect(settingRows.find((row) => row.name === 'stack')!.default).toBe('false');
      expect(DEFAULT_THRESHOLD).toBe(3);
      expect(demos.find((demo) => demo.slug === 'stack')!.description.en).toContain('(3)');
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...optionRows, ...settingRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
    }
  });
});

describe('Message page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.replace(/\s+/g, ' '));
    });

    it(`${row.name}: is used by the Message`, () => {
      expect(sources).toContain(row.name);
    });
  }

  it('lists every --ads-message-* token of tokens.css', () => {
    expect(tokenRows.map((row) => row.name).sort()).toEqual([...tokens.keys()].filter((name) => name.startsWith('--ads-message-')).sort());
  });

  it('defines the colors of the box again for the dark theme', () => {
    for (const name of ['bg', 'color', 'shadow', 'icon-info', 'icon-success', 'icon-error', 'icon-warning', 'close-color']) {
      expect(dark, name).toContain(`--ads-message-${name}:`);
    }
  });
});

describe('Message page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/message/*.svelte', { eager: true });
  const code = import.meta.glob<string>('../../docs/src/docs/examples/message/*.svelte', { eager: true, query: '?raw', import: 'default' });
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
    // `type` is the kind that the typed methods fix; `message.open` takes it, and the types demo shows the methods.
    for (const name of [...optionRows, ...settingRows].map((row) => row.name).filter((name) => name !== 'type')) {
      expect(new RegExp(`\\b${name}\\b`).test(all), `${name} is not used in any example`).toBe(true);
    }
    for (const method of ['info', 'success', 'error', 'warning', 'loading', 'destroy', 'config']) expect(all, method).toContain(`message.${method}`);
    expect(all).toContain('MessageHost');
    expect(all).toContain('.then(');
  });

  it('the examples that change a setting take it back when they go (a demo must not change the others)', () => {
    for (const file of files.filter((name) => /message\.config\(\{/.test(code[name]))) {
      expect(code[file], file).toMatch(/return \(\) => message\.config\(\{/);
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
});
