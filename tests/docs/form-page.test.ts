// The Form page of the documentation site must say what the component really does.
// The tables are data (docs/src/docs/data/form.ts); these tests compare them with the sources.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { apiRows, demos, fieldRows, helperRows, itemApiRows, methodRows, ruleRows, tokenRows } from '../../docs/src/docs/data/form';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', '..', path), 'utf8');
const typesSource = read('src/lib/Form/types.ts');
const formSource = read('src/lib/Form/Form.svelte');
const itemSource = read('src/lib/Form/FormItem.svelte');
const storeSource = read('src/lib/Form/store.svelte.ts');
const tokensCss = read('src/lib/tokens.css');

const LANGS = ['en', 'ru', 'zh'] as const;
const namesOf = (rows: { name: string }[]) => rows.flatMap((row) => row.name.split(' / ')).map((name) => name.replace(/\(.*$/, '').trim());

/** The property names of the object type that follows `startMarker` (the props sit at four spaces, inside an intersection). */
function declaredProps(source: string, startMarker: string): string[] {
  const start = source.indexOf(startMarker);
  expect(start, `${startMarker} not found`).toBeGreaterThan(-1);
  const rest = source.slice(start);
  const body = /\& \{([\s\S]*?)\n\};/.exec(rest)?.[1];
  expect(body, `${startMarker}: the block of props was not found`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((match) => match[1]);
}

/** The default values from the `$props()` destructuring of a component. */
function declaredDefaults(source: string): Map<string, string> {
  const body = /let \{([\s\S]*?)\}: \w+(?:<[^>]*>)? = \$props\(\);/.exec(source)?.[1];
  expect(body, '$props() destructuring not found').toBeDefined();
  return new Map([...body!.matchAll(/^ {4}(\w+) = (.+?),?$/gm)].map((m) => [m[1], m[2].trim().replace(/^\$bindable\((.*)\)$/, '$1')]));
}

describe('Form page: Form API table', () => {
  const documented = namesOf(apiRows).filter((name) => name !== 'native attributes');
  const props = declaredProps(typesSource, 'export type FormProps').filter((name) => name !== 'children' || true);

  it('documents every prop of the form and nothing else', () => {
    expect([...documented].sort()).toEqual([...props].sort());
  });

  it('lists no property twice', () => {
    expect(new Set(documented).size).toBe(documented.length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults(formSource);
    const documentedDefault = (name: string) => apiRows.find((row) => row.name === name)!.default;
    for (const name of documented) {
      it(`${name}: the default column matches the component`, () => {
        const declared = defaults.get(name);
        if (name === 'form') return; // the store is made when there is none: documented as a dash
        const shown = documentedDefault(name).replace(/^'(.*)'$/, "'$1'");
        if (declared === undefined || declared === 'undefined') expect(shown).toBe('—');
        else expect(shown.replace(/\s+/g, ' ')).toBe(declared.replace(/\s+/g, ' '));
      });
    }
  });

  it('classNames and styles document exactly the six parts of FormSemanticName', () => {
    const parts = /export type FormSemanticName = ([^;]+);/.exec(typesSource)![1];
    const names = [...parts.matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    for (const name of ['classNames', 'styles']) {
      const type = apiRows.find((row) => row.name === name)!.type;
      expect(type.match(/root \| label \| content \| help \| helpItem \| extra/), name).not.toBeNull();
      expect(names).toEqual(['content', 'extra', 'help', 'helpItem', 'label', 'root']);
    }
  });

  it('the scrollToFirstError default is the documented one, and the form really passes it', () => {
    expect(apiRows.find((row) => row.name === 'scrollToFirstError')!.default).toBe('{ focus: true }');
    expect(formSource).toContain('scrollToFirstError = { focus: true }');
  });
});

describe('Form page: FormItem API table', () => {
  const documented = namesOf(itemApiRows).filter((name) => name !== 'native attributes');
  const props = declaredProps(typesSource, 'export type FormItemProps');

  it('documents every prop of the item and nothing else', () => {
    expect([...documented].sort()).toEqual([...props].sort());
  });

  it('lists no property twice', () => {
    expect(new Set(documented).size).toBe(documented.length);
  });

  describe('default values', () => {
    const defaults = declaredDefaults(itemSource);
    for (const row of itemApiRows) {
      for (const name of row.name.split(' / ')) {
        const declared = defaults.get(name);
        if (declared === undefined || declared === 'undefined' || row.default.startsWith('the ') || row.default === 'as on the form') continue;
        it(`${name}: the default column matches the component`, () => {
          expect(row.default).toBe(declared);
        });
      }
    }
  });
});

describe('Form page: field table', () => {
  it('documents every member of FormField and nothing else', () => {
    const body = /export interface FormField \{([\s\S]*?)\n\}/.exec(typesSource)![1];
    const declared = [...body.matchAll(/^ {2}(?:readonly )?(\w+):/gm)].map((match) => match[1]).sort();
    expect(namesOf(fieldRows).sort()).toEqual(declared);
  });

  it('every documented member is something the item really gives', () => {
    for (const name of namesOf(fieldRows)) expect(itemSource, name).toMatch(new RegExp(`(get|set) ${name}\\(`));
  });
});

describe('Form page: instance methods', () => {
  it('documents every public method of the store and nothing else', () => {
    const published = [...storeSource.slice(storeSource.indexOf('export class FormStore')).matchAll(/^ {2}(?:async )?(\w+)\(/gm)]
      .map((match) => match[1])
      .filter((name) => !['constructor', 'init', 'bind', 'setItemInitial', 'register', 'fieldMeta', 'valueAt', 'userChange', 'blur', 'compositionEnd', 'attachModel', 'observe'].includes(name));
    const documented = methodRows.flatMap((row) => row.name.split(' / ')).map((name) => /^(\w+)/.exec(name)![1]);
    expect([...new Set(documented)].sort()).toEqual([...new Set(published)].sort());
  });
});

describe('Form page: rule table', () => {
  it('documents every key of FormRuleConfig and nothing else', () => {
    const body = /export interface FormRuleConfig \{([\s\S]*?)\n\}/.exec(typesSource)![1];
    const declared = [...body.matchAll(/^ {2}(\w+)\??:/gm)].map((match) => match[1]).sort();
    const documented = ruleRows.flatMap((row) => row.name.split(' / ')).sort();
    expect(documented).toEqual(declared);
  });

  it('the documented types are the ones of FormRuleType', () => {
    const declared = [...(/export type FormRuleType =([\s\S]*?);/.exec(typesSource)![1]).matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    const description = ruleRows.find((row) => row.name === 'type')!.description.en;
    const documented = [...description.matchAll(/<code>(\w+)<\/code>/g)].map((m) => m[1]).filter((name) => name !== 'string' || true);
    for (const name of declared) expect(documented, name).toContain(name);
  });
});

describe('Form page: helpers', () => {
  it('createForm and getFormInstance exist as documented', () => {
    expect(namesOf(helperRows)).toEqual(['createForm', 'getFormInstance']);
    expect(storeSource).toContain('export function createForm<Values extends object = Record<string, unknown>>(): FormStore<Values>');
    expect(read('src/lib/Form/context.ts')).toContain(
      'export function getFormInstance<Values extends object = Record<string, unknown>>(): FormInstance<Values>'
    );
  });
});

describe('Form page: texts', () => {
  const rows = [...apiRows, ...itemApiRows, ...fieldRows, ...methodRows, ...ruleRows, ...helperRows, ...tokenRows];
  it('describes every row in English, Russian and Chinese', () => {
    for (const row of rows) for (const lang of LANGS) expect(row.description[lang].trim(), `${row.name} (${lang})`).not.toBe('');
  });

  it('every demo has a title and a description in three languages', () => {
    for (const demo of demos) {
      for (const lang of LANGS) {
        expect(demo.title[lang].trim(), `${demo.slug} title (${lang})`).not.toBe('');
        expect(demo.description[lang].trim(), `${demo.slug} description (${lang})`).not.toBe('');
      }
    }
  });
});

describe('Form page: design tokens table', () => {
  const light = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const dark = /:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(tokensCss)?.[1] ?? '';
  const tokens = new Map([...light.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));
  const used = itemSource + read('src/lib/Form/FeedbackIcon.svelte');

  for (const row of tokenRows) {
    it(`${row.name}: exists in tokens.css with the documented default`, () => {
      expect(tokens.get(row.name)).toBe(row.value.toLowerCase());
    });

    it(`${row.name}: is used by the Form`, () => {
      expect(used).toContain(row.name);
    });
  }

  it('lists every --ads-form-* token of tokens.css', () => {
    const defined = [...tokens.keys()].filter((name) => name.startsWith('--ads-form-')).sort();
    expect(tokenRows.map((row) => row.name).sort()).toEqual(defined);
  });

  it('the dark theme defines again the colours that are not defined by another token', () => {
    for (const name of ['--ads-form-warning-text', '--ads-form-success-icon', '--ads-form-warning-icon', '--ads-form-error-icon']) {
      expect(dark, name).toContain(`${name}:`);
    }
  });
});

describe('Form page: examples', () => {
  const examples = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/form/*.svelte', { eager: true });
  const sources = import.meta.glob<string>('../../docs/src/docs/examples/form/*.svelte', { eager: true, query: '?raw', import: 'default' });
  const files = Object.keys(examples).sort();

  it('there is one example file per demo, in the order of the page', () => {
    expect(files.map((file) => file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
    expect(files.map((file) => Number(/\/(\d+)-/.exec(file)![1]))).toEqual(demos.map((_, i) => i + 1));
  });

  for (const file of files) {
    it(`${file.split('/').pop()}: renders a form of the real library`, () => {
      const { container } = render(examples[file].default);
      expect(container.querySelectorAll('.ads-form').length).toBe(1);
    });
  }

  it('every prop of the form and of the item is shown in at least one example', () => {
    const code = Object.values(sources).join('\n');
    // `children` is the content between the tags, `class`, `style` and the native attributes are plain HTML.
    const skip = new Set(['children', 'class', 'style', 'novalidate']);
    for (const name of [...namesOf(apiRows), ...namesOf(itemApiRows)].filter((n) => !skip.has(n) && n !== 'native attributes')) {
      expect(new RegExp(`\\b${name}\\b`).test(code), `${name} is not used in any example`).toBe(true);
    }
  });

  it('every member of field and every method of the instance is used in an example', () => {
    const code = Object.values(sources).join('\n');
    for (const name of ['value', 'status', 'attrs', 'feedback', 'disabled', 'size', 'variant']) expect(code, name).toContain(`field.${name}`);
    for (const method of ['getFieldValue', 'getFieldsValue', 'getFieldsError', 'isFieldsTouched', 'setFieldValue', 'setFieldsValue', 'setFields', 'validateFields', 'resetFields']) {
      expect(code, method).toContain(`${method}(`);
    }
  });

  it('every rule key and every type that the page names appears in an example or the rule table', () => {
    const code = Object.values(sources).join('\n');
    for (const key of ['required', 'type', 'min', 'max', 'len', 'pattern', 'enum', 'whitespace', 'transform', 'message', 'validator', 'warningOnly', 'validateFirst', 'dependencies']) {
      expect(new RegExp(`\\b${key}\\b`).test(code), key).toBe(true);
    }
  });

  it('the examples follow the layout rules: every example is a stage with its form on a sheet, and nothing else at its root', () => {
    // A block of results may wait for its first result: `{#if result}` and then the results at the root of the stage.
    const allowed = /^(<div class="(controls|sheet|row|results)">|\{#if [^}]+\})$/;
    for (const file of files) {
      const source = sources[file];
      // Free text or a <span> at the root of an example would sit in a row with the components (rule 6a).
      const markup = source.replace(/<script[\s\S]*?<\/script>/, '').replace(/<style[\s\S]*?<\/style>/, '').replace(/\{#snippet[\s\S]*?\{\/snippet\}/g, '');
      const root = /<div class="stage">\n([\s\S]*)\n<\/div>\s*$/.exec(markup.trim());
      expect(root, `${file}: no stage`).not.toBeNull();
      // The children of the stage are the blocks at an indent of two: the controls above the sheet, the sheet with the form,
      // the buttons that act on the form and the results under it.
      const blocks = root![1].split('\n').filter((line) => /^ {2}\S/.test(line) && !/^ {2}(<\/|\/>|>|\{\/)/.test(line));
      for (const block of blocks) expect(block.trim(), `${file}: ${block.trim()} at the root of the stage`).toMatch(allowed);
      for (const condition of root![1].matchAll(/^ {2}\{#if [^}]+\}\n(.*)$/gm)) expect(condition[1], `${file}: an {#if} at the root holds something but the results`).toMatch(/^ {4}<div class="results">$/);
      expect(root![1], `${file}: the form is not on a sheet`).toMatch(/<div class="sheet">\n\s+<Form\b/);
    }
  });

  it('every demo takes a whole row', () => {
    for (const demo of demos) expect(demo.wide, `${demo.slug} is not wide`).toBe(true);
  });

  it('no example shows a prompt before anything has happened: a result appears when there is one', () => {
    for (const file of files) {
      expect(sources[file], file).not.toMatch(/\$state\('(Press Submit|Submit the form)/);
    }
  });
});
