// The Typography page of the documentation site must say what the component really does. The API, config object, semantic part and
// token tables are data (docs/src/docs/data/typography.ts); these tests compare them with the sources.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRows, copyableRows, demos, editableRows, ellipsisRows, partRows, tokenRows } from '../../docs/src/docs/data/typography';

const root = join(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const types = read('src/lib/Typography/types.ts');
const tokensCss = read('src/lib/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');

/** The property names of an interface of types.ts. */
function fields(name: string): string[] {
  const body = new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`).exec(types)?.[1];
  expect(body, `${name} not found`).toBeDefined();
  return [...body!.matchAll(/^ {2}(\w+)\??:/gm)].map((match) => match[1]);
}

const exampleFolder = join(root, 'docs/src/docs/examples/typography');
const exampleFiles = readdirSync(exampleFolder).sort();
const allExamples = exampleFiles.map((file) => readFileSync(join(exampleFolder, file), 'utf8')).join('\n');
const modules = import.meta.glob<{ default: Component }>('../../docs/src/docs/examples/typography/*.svelte', { eager: true });

afterEach(() => vi.restoreAllMocks());

describe('Typography page: the API tables', () => {
  it('documents every base property, level and the native attributes, and nothing else', () => {
    const names = apiRows.map((row) => row.name);
    expect(names.filter((name) => name !== 'native attributes' && name !== 'level').sort()).toEqual(fields('TypographyBaseProps').sort());
    expect(names).toContain('level');
    expect(names).toContain('native attributes');
    expect(new Set(names).size).toBe(names.length);
  });

  it.each([
    ['TypographyCopyable', copyableRows],
    ['TypographyEditable', editableRows],
    ['TypographyEllipsis', ellipsisRows]
  ] as const)('%s: documents every field of the object and nothing else', (name, rows) => {
    expect(rows.map((row) => row.name).sort()).toEqual(fields(name).sort());
  });

  it('documents the four semantic parts', () => {
    const names = /export type TypographySemanticName = ([^;]+);/.exec(types)![1].match(/'(\w+)'/g)!.map((value) => value.slice(1, -1));
    expect(partRows.map((row) => row.name).sort()).toEqual(names.sort());
  });

  it('every description is written in three languages', () => {
    for (const row of [...apiRows, ...copyableRows, ...editableRows, ...ellipsisRows, ...partRows, ...tokenRows, ...demos]) {
      for (const lang of ['en', 'ru', 'zh'] as const) expect(row.description[lang].length, `${'name' in row ? row.name : row.slug} ${lang}`).toBeGreaterThan(2);
    }
  });
});

describe('Typography page: tokens', () => {
  const declared = new Map(
    [...(/:root\s*\{([\s\S]*?)\n\}/.exec(tokensCss)![1]).matchAll(/(--ads-typography-[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].replace(/\s+/g, ' ').trim()])
  );

  it('lists every Typography token with its value in tokens.css', () => {
    expect(tokenRows.map((row) => row.name).sort()).toEqual([...declared.keys()].sort());
    for (const row of tokenRows) expect(row.value, row.name).toBe(declared.get(row.name));
  });
});

describe('Typography page: examples', () => {
  it('has one file for every demo, in the order of the page, with the same slug', () => {
    expect(exampleFiles.map((file) => file.replace(/^\d+-/, '').replace(/\.svelte$/, ''))).toEqual(demos.map((demo) => demo.slug));
  });

  it.each(Object.keys(modules))('%s renders', (path) => {
    const error = vi.spyOn(console, 'error');
    const { container } = render(modules[path].default);
    expect(container.querySelector('.ads-typography')).not.toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it.each(
    [
      ['type', /\btype="(?:secondary|success|warning|danger)"/],
      ['disabled', /\bdisabled\b/],
      ['level', /\blevel=\{[1-5]\}/],
      ['mark', /<TypographyText mark>/],
      ['code', /<TypographyText code>/],
      ['keyboard', /<TypographyText keyboard>/],
      ['underline', /<TypographyText underline>/],
      ['delete', /<TypographyText delete>/],
      ['strong', /<TypographyText strong>/],
      ['italic', /<TypographyText italic>/],
      ['content', /bind:content=|content=\{long\}|content=""/],
      ['editing', /bind:editing=/],
      ['expanded', /bind:expanded=/],
      ['actions.placement', /placement: 'start'/],
      ['shimmer', /shimmer=\{\{ duration/],
      ['onclick', /onclick=\{\(\) => \(clicks/],
      ['classNames', /classNames=\{\{/],
      ['styles', /styles=\{\{/],
      ['class and style', /class="demo-note" style=/],
      ['href and target', /href="https:\/\/svelte.dev" target="_blank"/]
    ] as const
  )('shows %s in an example', (_name, pattern) => {
    expect(allExamples).toMatch(pattern);
  });

  it.each([
    ['copyable', copyableRows],
    ['editable', editableRows],
    ['ellipsis', ellipsisRows]
  ] as const)('shows every field of %s in an example', (_name, rows) => {
    for (const row of rows) {
      if (row.name === 'tabIndex') continue; // a Tab order is not something a demo can show; the table and the tests cover it
      expect(allExamples, row.name).toMatch(new RegExp(`\\b${row.name}\\b`));
    }
  });
});
