// Content rules of the documentation site: translations are complete, the page registry matches the routes,
// and every code snippet shown on a page is valid and refers to things that exist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { compile } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { strings } from '../../docs/src/docs/i18n/strings';
import { allEntries, allPages, componentGroups, componentsIn, localize } from '../../docs/src/docs/pages';
import * as snippets from '../../docs/src/docs/snippets';

const root = join(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const LANGS = ['en', 'ru', 'zh'] as const;
const cyrillic = /[А-Яа-яЁё]/;
const cjk = /[一-鿿]/;
const entries = Object.entries(strings) as [string, Record<(typeof LANGS)[number], string>][];

describe('translations', () => {
  // Empty on purpose: nothing follows the highlighted "Svelte 5" in the home page title in some languages, and the
  // note next to a component name ("n.*") is a translation of that English name, so English has none.
  const mayBeEmpty = (key: string, lang: string) =>
    (key === 'hero.t2' && lang !== 'zh') || (key.startsWith('n.') && lang === 'en');

  it('every text exists in English, Russian and Chinese', () => {
    for (const [key, text] of entries) {
      for (const lang of LANGS) {
        if (mayBeEmpty(key, lang)) continue;
        expect(text[lang].trim(), `${key} (${lang})`).not.toBe('');
      }
    }
  });

  // Texts that really are the same in every language (names, technical terms); add a key here only on purpose.
  const sameInEveryLanguage = new Set(['start.h.kit', 'start.h.ts']); // the names SvelteKit and TypeScript

  it('every text is written in its own language, so none is left untranslated', () => {
    for (const [key, text] of entries) {
      expect(cyrillic.test(text.en) || cjk.test(text.en), `${key}: English text contains Cyrillic or Chinese`).toBe(false);
      if (mayBeEmpty(key, 'ru') && text.ru === '') continue;
      if (sameInEveryLanguage.has(key)) continue;
      expect(cyrillic.test(text.ru), `${key}: Russian text is not Russian`).toBe(true);
      if (mayBeEmpty(key, 'zh') && text.zh === '') continue;
      expect(cjk.test(text.zh), `${key}: Chinese text is not Chinese`).toBe(true);
      expect(cjk.test(text.ru), `${key}: Russian text contains Chinese`).toBe(false);
      expect(cyrillic.test(text.zh), `${key}: Chinese text contains Cyrillic`).toBe(false);
    }
  });

  it('inline markup is limited to balanced <code> tags (texts are rendered as HTML)', () => {
    for (const [key, text] of entries) {
      for (const lang of LANGS) {
        const value = text[lang];
        const tags = [...value.matchAll(/<\/?([a-zA-Z][\w-]*)[^>]*>/g)];
        expect(tags.every((t) => t[1] === 'code' && /^<\/?code>$/.test(t[0])), `${key} (${lang}): only <code> is allowed`).toBe(true);
        const opened = tags.filter((t) => !t[0].startsWith('</')).length;
        expect(opened, `${key} (${lang}): unbalanced <code>`).toBe(tags.length - opened);
      }
    }
  });

  it('the same markup appears in every language of a text', () => {
    for (const [key, text] of entries) {
      const codes = (value: string) => (value.match(/<code>/g) ?? []).length;
      expect(codes(text.ru), `${key}: ru`).toBe(codes(text.en));
      expect(codes(text.zh), `${key}: zh`).toBe(codes(text.en));
    }
  });

  it('every text is used somewhere on the site', () => {
    const sources = [...walk(join(root, 'docs/src'))]
      .filter((file) => /\.(svelte|ts)$/.test(file) && !file.endsWith('strings.ts'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    // A key may be built in a template literal, like `faq.q${n}`; that counts as using every key with the prefix.
    const prefixes = [...sources.matchAll(/`([\w.]+)\$\{/g)].map((m) => m[1]);
    const unused = entries
      .map(([key]) => key)
      .filter((key) => !sources.includes(`'${key}'`) && !sources.includes(`"${key}"`) && !prefixes.some((prefix) => key.startsWith(prefix)));
    expect(unused).toEqual([]);
  });
});

describe('page registry', () => {
  it('has one route file per registered page', () => {
    for (const page of allPages) {
      const file = join(root, 'docs/src/routes/[[lang=lang]]', page.path, '+page.svelte');
      expect(existsSync(file), `${page.path} has no ${relative(root, file)}`).toBe(true);
    }
  });

  it('has no route that is missing from the registry (it would be left out of the sitemap and the search)', () => {
    const routes = [...walk(join(root, 'docs/src/routes/[[lang=lang]]'))]
      .filter((file) => file.endsWith('+page.svelte'))
      .map((file) => '/' + relative(join(root, 'docs/src/routes/[[lang=lang]]'), file).replace(/\+page\.svelte$/, '').replace(/\\/g, '/'))
      .map((path) => (path === '//' ? '/' : path))
      .sort();
    expect(routes).toEqual(allPages.map((page) => page.path).sort());
  });

  it('uses paths that start and end with a slash, each only once', () => {
    const paths = allPages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path).toMatch(/^\/(.+\/)?$/);
  });

  it('gives every page a title and a description that exist', () => {
    for (const page of allPages) {
      expect(strings, page.path).toHaveProperty([page.title]);
      expect(strings, page.path).toHaveProperty([page.description]);
    }
  });

  describe('search results and link previews', () => {
    // Search engines cut a title at about 60 characters and a description at about 160; Chinese characters are
    // about twice as wide, so they count double.
    const width = (text: string) => [...text].reduce((total, ch) => total + (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
    const homeTitleKey = allPages.find((page) => page.path === '/')!.title;

    it('every page has a description of 70 to 160 characters, as plain text, in every language', () => {
      for (const page of allPages) {
        for (const lang of LANGS) {
          const text = strings[page.description][lang];
          expect(width(text), `${localize(page.path, lang)} description is ${width(text)} wide`).toBeGreaterThanOrEqual(70);
          expect(width(text), `${localize(page.path, lang)} description is ${width(text)} wide`).toBeLessThanOrEqual(160);
          expect(text, `${localize(page.path, lang)} description must be plain text`).not.toMatch(/[<>&]/);
        }
      }
    });

    it('every title fits 65 characters with the site name', () => {
      for (const page of allPages) {
        for (const lang of LANGS) {
          const title = strings[page.title][lang];
          const full = page.title === homeTitleKey ? title : `${title} · svelte-ant-design`;
          expect(width(full), `${localize(page.path, lang)}: "${full}"`).toBeLessThanOrEqual(65);
        }
      }
    });

    it('no two pages share a description or a title within a language', () => {
      for (const lang of LANGS) {
        const descriptions = allPages.map((page) => strings[page.description][lang]);
        const titles = allPages.map((page) => strings[page.title][lang]);
        expect(new Set(descriptions).size, `descriptions (${lang})`).toBe(descriptions.length);
        expect(new Set(titles).size, `titles (${lang})`).toBe(titles.length);
      }
    });

    it('the preview image has a description in every language', () => {
      for (const lang of LANGS) expect(strings['seo.ogalt'][lang].trim()).not.toBe('');
    });
  });

  it('builds the URL list of all languages: English at the root, the others under /ru/ and /zh/', () => {
    const urls = allEntries();
    expect(urls).toHaveLength(allPages.length * 3);
    expect(urls).toContain('/docs/faq/');
    expect(urls).toContain('/ru/docs/faq/');
    expect(urls).toContain('/zh/');
    expect(localize('/', 'en')).toBe('/');
    expect(localize('/components/button/', 'ru')).toBe('/ru/components/button/');
  });

  it('gives a page to the components that are ready (phase "now") and to no other', () => {
    for (const group of componentGroups) {
      for (const item of group.items) {
        expect(item.phase === 'now', `${item.name}: a page exists only for a component that is ready`).toBe(item.path !== undefined);
        if (item.path) expect(allPages.map((p) => p.path), item.name).toContain(item.path);
      }
    }
  });

  it('builds the roadmap from the same list: every component is in exactly one phase', () => {
    const names = componentGroups.flatMap((group) => group.items.map((item) => item.name));
    expect(new Set(names).size).toBe(names.length);
    expect([...componentsIn('now'), ...componentsIn('next'), ...componentsIn('later')].sort()).toEqual([...names].sort());
    expect(componentsIn('now')).toEqual(['Button', 'Input', 'Checkbox', 'Switch', 'Select']);
  });

  it('has a localized note for every component', () => {
    for (const item of componentGroups.flatMap((group) => group.items)) {
      expect(strings, item.name).toHaveProperty([item.note]);
    }
  });
});

describe('code snippets', () => {
  const all = Object.entries(snippets).filter(([, value]) => typeof value === 'object') as [string, snippets.Snippet][];
  const libraryExports = read('src/lib/index.ts');
  const tokensCss = read('src/lib/tokens.css');
  const rootScripts = Object.keys((JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts);

  it('there are snippets to check', () => {
    expect(all.length).toBeGreaterThan(5);
  });

  // Shown as a single tag of src/app.html, not as a component.
  const fragments = new Set(['darkAttribute']);

  for (const [name, { code, kind }] of all) {
    if (kind === 'svelte' && !fragments.has(name)) {
      it(`${name}: is valid Svelte 5 code`, () => {
        expect(() => compile(code, { generate: 'client', runes: true, filename: `${name}.svelte` })).not.toThrow();
      });
    }

    if (kind === 'ts') {
      it(`${name}: is valid TypeScript`, () => {
        const result = ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022 } });
        expect(result.diagnostics?.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
      });
    }

    it(`${name}: imports only what the library exports`, () => {
      for (const match of code.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+'svelte-ant-design'/g)) {
        for (const imported of match[1].split(',').map((part) => part.trim().replace(/^type\s+/, ''))) {
          expect(libraryExports, `${imported} is not exported by the library`).toMatch(new RegExp(`\\b${imported}\\b`));
        }
      }
    });

    if (kind === 'css') {
      it(`${name}: overrides only tokens that exist`, () => {
        for (const [, token] of code.matchAll(/(--ads-[\w-]+)\s*:/g)) {
          expect(tokensCss, `${token} is not defined in tokens.css`).toContain(`${token}:`);
        }
      });
    }
  }

  it('the dark-mode snippet uses the attribute that tokens.css reacts to', () => {
    expect(snippets.darkAttribute.code).toContain('data-theme="dark"');
    expect(tokensCss).toContain("[data-theme='dark']");
    expect(snippets.themeOverride.code).toContain("[data-theme='dark']");
  });

  it('the development snippet mentions only npm scripts that exist', () => {
    for (const [, script] of snippets.development.code.matchAll(/npm run ([\w:-]+)/g)) {
      expect(rootScripts, `npm run ${script}`).toContain(script);
    }
  });

  it('the install commands name the published package', () => {
    const name = (JSON.parse(read('package.json')) as { name: string }).name;
    expect(read('docs/src/docs/components/PackageTabs.svelte')).toContain(`install ${name}`);
    for (const [, snippet] of Object.entries(snippets).filter(([, v]) => typeof v === 'object') as [string, snippets.Snippet][]) {
      for (const [, imported] of snippet.code.matchAll(/from '(svelte-ant-design[^']*)'/g)) {
        expect(imported.startsWith(name), imported).toBe(true);
      }
    }
  });
});
