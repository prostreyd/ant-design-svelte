// The Modal page of the documentation site must say what the component really does.
// The API and token tables are data (docs/src/docs/data/modal.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { demos, funcRows, methodRows, propRows, tokenRows } from '../../docs/src/docs/data/modal';
import { removeLayer } from '../../src/lib/Modal/layer';
import { resetModals } from '../../src/lib/Modal/store';
import { MODAL_PARTS } from '../../src/lib/Modal/types';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const typesSource = read('src/lib/Modal/types.ts');
const tokensCss = read('src/lib/tokens.css');
const sources = ['Modal.svelte', 'StaticDialog.svelte'].map((file) => read(`src/lib/Modal/${file}`)).join('\n');

/** The property names of an interface of types.ts. */
function interfaceMembers(name: string): string[] {
  const body = new RegExp(`export interface ${name}(?: extends [^{]+)? \\{([\\s\\S]*?)\\n\\}`).exec(typesSource)?.[1];
  expect(body, `${name} not found in types.ts`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:|^ {2}'([\w-]+)'\??:/gm)].map((m) => m[1] ?? m[2]);
}

/** The own props of `ModalProps`: the lines of the object part of the type. */
function modalProps(): string[] {
  const start = typesSource.indexOf('export type ModalProps');
  const body = typesSource.slice(typesSource.indexOf('& {', start) + 3, typesSource.indexOf('\n};', start));
  return [...body.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
}

afterEach(() => {
  cleanup();
  removeLayer();
  resetModals();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

describe('Modal page: API tables', () => {
  it('the props table documents every prop of ModalProps and nothing else', () => {
    expect(propRows.map((row) => row.name).sort()).toEqual(modalProps().sort());
  });

  it('the static options table documents every option of ModalFuncOptions and nothing else', () => {
    expect(funcRows.map((row) => row.name).sort()).toEqual(interfaceMembers('ModalFuncOptions').sort());
  });

  it('the methods table names every method of the api and of the handle, and the host', () => {
    const text = methodRows.map((row) => row.name).join('\n');
    for (const method of ['confirm', 'info', 'success', 'warning', 'error', 'destroyAll']) expect(text, method).toContain(method);
    for (const member of interfaceMembers('ModalHandle')) expect(text, member).toContain(member);
    expect(text).toContain('handle.then');
    expect(text).toContain('ModalHost');
  });

  it('no table lists a name twice', () => {
    for (const rows of [propRows, funcRows, methodRows]) {
      const names = rows.map((row) => row.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('classNames and styles document the ten parts of the Modal, and the static options the three more', () => {
    const parts = (type: string) => [...type.matchAll(/(\w+)\?/g)].map((m) => m[1]);
    const own = MODAL_PARTS.slice(0, 10);
    for (const name of ['classNames', 'styles']) {
      expect(parts(propRows.find((row) => row.name === name)!.type)).toEqual([...own]);
    }
    expect(MODAL_PARTS.slice(10)).toEqual(['confirmBody', 'icon', 'description']);
    for (const name of ['classNames', 'styles']) {
      const text = funcRows.find((row) => row.name === name)!;
      for (const part of MODAL_PARTS.slice(10)) expect(text.type + JSON.stringify(text.description), `${name} ${part}`).toContain(part);
    }
  });

  describe('defaults', () => {
    it('the Modal: the primary OK button, the close button, keyboard and the mask are on, closeOnOk is off', () => {
      const row = (name: string) => propRows.find((item) => item.name === name)!;
      expect(row('okType').default).toBe("'primary'");
      expect(row('closeOnOk').default).toBe('false');
      expect(row('closable').default).toBe('true');
      expect(row('keyboard').default).toBe('true');
      expect(row('mask').default).toBe('true');
      expect(row('centered').default).toBe('false');
      expect(row('scrollLock').default).toBe('true');
    });

    it('the widths and the layer are the tokens', () => {
      const token = (name: string) => /:\s*(\d+)px/.exec(new RegExp(`${name}:\\s*[^;]+;`).exec(tokensCss)![0])![1];
      expect(propRows.find((row) => row.name === 'width')!.default).toBe(token('--ads-modal-width'));
      expect(funcRows.find((row) => row.name === 'width')!.default).toBe(token('--ads-modal-confirm-width'));
      expect(propRows.find((row) => row.name === 'zIndex')!.default).toBe(/--ads-modal-z-index:\s*(\d+)/.exec(tokensCss)![1]);
    });

    it('a static dialog: no close button, the mask does not close it, closeOnOk is on and focus goes to OK', () => {
      const row = (name: string) => funcRows.find((item) => item.name === name)!;
      expect(row('closable').default).toBe('false');
      expect(row('mask').default).toBe('{ closable: false }');
      expect(row('focusable').default).toContain("autoFocusButton: 'ok'");
      expect(funcRows.find((item) => item.name === 'onok')!.description.en).toContain('closeOnOk');
    });
  });

  it('describes every row in English, Russian and Chinese', () => {
    for (const row of [...propRows, ...funcRows, ...methodRows]) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
    }
  });
});

describe('Modal page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.replace(/\s+/g, ' '));
    });

    it(`${row.name}: is used by the Modal`, () => {
      expect(sources).toContain(row.name);
    });
  }

  it('lists every --ads-modal-* token of tokens.css', () => {
    expect(tokenRows.map((row) => row.name).sort()).toEqual([...tokens.keys()].filter((name) => name.startsWith('--ads-modal-')).sort());
  });

  it('defines the colors of the card again for the dark theme', () => {
    for (const name of ['content-bg', 'shadow', 'title-color', 'body-color', 'close-color', 'confirm-icon-info', 'confirm-icon-success', 'confirm-icon-warning', 'confirm-icon-error']) {
      expect(dark, name).toContain(`--ads-modal-${name}:`);
    }
  });
});

describe('Modal page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/modal/*.svelte', { eager: true });
  const code = import.meta.glob<string>('../../docs/src/docs/examples/modal/*.svelte', { eager: true, query: '?raw', import: 'default' });
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

  /** The opening tags `<Modal ...>` of an example (the end of a tag is the first `>` outside braces and quotes: `onok={() => ...}` has one inside). */
  function modalTags(source: string): string[] {
    const tags: string[] = [];
    for (let start = source.indexOf('<Modal'); start !== -1; start = source.indexOf('<Modal', start + 1)) {
      if (!/[\s>]/.test(source[start + 6] ?? '')) continue;
      let depth = 0;
      let quote = '';
      let end = start;
      for (; end < source.length; end++) {
        const char = source[end];
        if (quote) {
          if (char === quote) quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '{') depth++;
        else if (char === '}') depth--;
        else if (char === '>' && depth === 0) break;
      }
      tags.push(source.slice(start, end + 1));
    }
    return tags;
  }

  it('the parser of the tags finds the tags of an example, with an arrow function inside one', () => {
    const tags = modalTags('<Modal bind:open title="A" onok={() => (open = false)}><p>x</p></Modal><ModalHost /><Modal\n  bind:open={b}\n  closeOnOk>y</Modal>');
    expect(tags).toEqual(['<Modal bind:open title="A" onok={() => (open = false)}>', '<Modal\n  bind:open={b}\n  closeOnOk>']);
  });

  it('in every example the OK button of a Modal does something: onok, closeOnOk, or a footer of its own', () => {
    let seen = 0;
    for (const [file, source] of Object.entries(code)) {
      for (const tag of modalTags(source)) {
        seen++;
        expect(/\bonok=|\bcloseOnOk\b|\bfooter=/.test(tag), `${file.split('/').pop()}: ${tag.replace(/\s+/g, ' ').slice(0, 90)} has an OK button that closes nothing`).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(25);
  });

  it('every prop and every option is used in at least one example, and every method', () => {
    const all = Object.values(code).join('\n');
    // `children` is the content between the tags, which every example writes.
    for (const name of [...propRows, ...funcRows].map((row) => row.name).filter((name) => name !== 'children')) {
      expect(new RegExp(`\\b${name}\\b`).test(all), `${name} is not used in any example`).toBe(true);
    }
    for (const method of ['confirm', 'info', 'success', 'warning', 'error', 'destroyAll']) expect(all, method).toContain(`modal.${method}`);
    for (const member of ['destroy', 'update', 'then']) expect(all, member).toMatch(new RegExp(`\\.${member}\\b|await modal`));
    expect(all).toContain('ModalHost');
    expect(all).toContain('await modal.confirm');
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
