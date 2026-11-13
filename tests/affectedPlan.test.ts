// The plan of `npm run test:affected` (scripts/affected/plan.mjs): which checks a change needs. The tests build a small
// library in a temporary folder, so they do not depend on the components the repository has today.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { componentFolders, importers, planFor, reachedBy, runsDocs, runsLibrary } from '../scripts/affected/plan.mjs';

let root = '';
const put = (path: string, text = '') => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'affected-'));
  // Button and Switch use only helpers. Input uses Button. Select uses the popup, which uses a helper of its own.
  put('src/lib/internal/options.ts', 'export const a = 1;');
  put('src/lib/internal/semantic.ts', 'export const b = 1;');
  put('src/lib/internal/popup/Popup.svelte', "<script>import { b } from '../semantic.js';</script>");
  put('src/lib/Button/Button.svelte', "<script>import { a } from '../internal/options.js';</script>");
  put('src/lib/Switch/Switch.svelte', "<script>import { a } from '../internal/options.js';</script>");
  put('src/lib/Input/Input.svelte', "<script>import Button from '../Button/Button.svelte';</script>");
  put('src/lib/Select/Select.svelte', "<script>import Popup from '../internal/popup/Popup.svelte';</script>");
  put('src/lib/Select/types.ts', 'export type T = 1;');
  put('src/lib/index.ts', "export { default as Button } from './Button/Button.svelte';");
  put('src/lib/tokens.css', ':root{}');
  for (const spec of ['button', 'switch', 'input', 'input-ime.chromium', 'select', 'popup', 'popup-touch.chromium', 'forced-colors']) put(`e2e/${spec}.spec.ts`);
  for (const slug of ['button', 'switch', 'input', 'select']) put(`docs/src/routes/[[lang=lang]]/components/${slug}/+page.svelte`);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const plan = (files: string[], options: Record<string, unknown> = {}) => planFor(files, { root, ...options });

describe('the import graph and its direction', () => {
  it('finds the components, not the helpers', () => {
    expect(componentFolders(root)).toEqual(['Button', 'Input', 'Select', 'Switch']);
  });

  it('knows who imports a file: Input imports Button, and Button does not import Input', () => {
    const graph = importers(root);
    // `index.ts` exports it as well, which is no component folder.
    expect([...graph.get('src/lib/Button/Button.svelte')!].sort()).toEqual(['src/lib/Input/Input.svelte', 'src/lib/index.ts']);
    expect([...graph.get('src/lib/Input/Input.svelte')!]).toEqual([]);
  });

  it('a change reaches everything that imports it, however far, and not what it imports', () => {
    const graph = importers(root);
    expect([...reachedBy(graph, ['src/lib/internal/semantic.ts'])].sort()).toEqual([
      'src/lib/Select/Select.svelte',
      'src/lib/internal/popup/Popup.svelte',
      'src/lib/internal/semantic.ts'
    ]);
    expect([...reachedBy(graph, ['src/lib/Input/Input.svelte'])]).toEqual(['src/lib/Input/Input.svelte']);
  });
});

describe('a change in the library', () => {
  it('Switch: its tests, its page, forced colors; not the tests of the others', () => {
    const result = plan(['src/lib/Switch/Switch.svelte']);
    expect(result.lib.specs).toEqual(['e2e/forced-colors.spec.ts', 'e2e/switch.spec.ts']);
    expect(result.docs.filters).toEqual(['Switch page|components/switch/ has no']);
    expect(result.docs.all).toBe(false);
  });

  it('Button also checks Input, which uses it (the engine part of the direction: the user of a changed part is checked)', () => {
    const result = plan(['src/lib/Button/Button.svelte']);
    expect(result.lib.specs).toEqual(['e2e/button.spec.ts', 'e2e/forced-colors.spec.ts', 'e2e/input-ime.chromium.spec.ts', 'e2e/input.spec.ts']);
    expect(result.docs.filters).toEqual(['Button page|components/button/ has no', 'Input page|components/input/ has no']);
  });

  it('Input does not check Button', () => {
    const result = plan(['src/lib/Input/Input.svelte']);
    expect(result.lib.specs).not.toContain('e2e/button.spec.ts');
    expect(result.docs.filters).toEqual(['Input page|components/input/ has no']);
  });

  it('the popup: its own tests and those of the component that uses it', () => {
    const result = plan(['src/lib/internal/popup/Popup.svelte']);
    expect(result.lib.specs).toEqual(['e2e/forced-colors.spec.ts', 'e2e/popup-touch.chromium.spec.ts', 'e2e/popup.spec.ts', 'e2e/select.spec.ts']);
    expect(result.lib.components).toEqual(['Select']);
  });

  it('a helper of the popup reaches the popup and then Select, and not Button', () => {
    const result = plan(['src/lib/internal/semantic.ts']);
    expect(result.lib.specs).toContain('e2e/popup.spec.ts');
    expect(result.lib.specs).toContain('e2e/select.spec.ts');
    expect(result.lib.specs).not.toContain('e2e/button.spec.ts');
  });

  it('a library change asks for the lowest browser versions, a text file in the library does not', () => {
    expect(plan(['src/lib/Switch/Switch.svelte']).floor).toBe(true);
    expect(plan(['src/lib/Switch/README.md']).floor).toBe(false);
    expect(runsLibrary(plan(['src/lib/Switch/README.md']))).toBe(false);
  });

  it('a component without a page of its own on the site gets no filter, and a deleted file counts by its folder', () => {
    put('src/lib/Rating/Rating.svelte');
    expect(plan(['src/lib/Rating/Rating.svelte']).docs.filters).toEqual([]);
    expect(plan(['src/lib/Switch/Gone.svelte']).lib.components).toEqual(['Switch']);
  });
});

describe('what runs everything', () => {
  it.each([
    ['design tokens', 'src/lib/tokens.css'],
    ['the exports of the library', 'src/lib/index.ts'],
    ['the dependencies', 'package.json'],
    ['the lockfile', 'package-lock.json'],
    ['a configuration', 'tsconfig.json'],
    ['a file nobody knows', 'tools/unknown.bin']
  ])('%s', (_name, file) => {
    const result = plan([file]);
    expect(result.all).toContain(file);
    expect(runsLibrary(result)).toBe(true);
    expect(runsDocs(result)).toBe(true);
    expect(result.floor).toBe(true);
  });

  it('the option --all', () => {
    const result = plan([], { all: true });
    expect(result.all).toBeTruthy();
    expect(result.lib.all && result.docs.all).toBe(true);
  });
});

describe('what needs no browser test', () => {
  it.each(['specs/select.md', 'CHANGELOG.md', 'README.md', 'ai/CLAUDE.md', '.github/workflows/ci.yml', 'scripts/test-affected.mjs', 'tests/Select.test.ts', 'tests/docs/overview.test.ts', 'docs/README.md', 'LICENSE'])('%s', (file) => {
    const result = plan([file]);
    expect(result.all).toBeNull();
    expect(runsLibrary(result)).toBe(false);
    expect(runsDocs(result)).toBe(false);
  });

  it('no change at all: only the checks that always run', () => {
    const result = plan([]);
    expect(runsLibrary(result)).toBe(false);
    expect(runsDocs(result)).toBe(false);
  });

  it('the folder node_modules is not a change', () => {
    expect(runsLibrary(plan(['node_modules']))).toBe(false);
    expect(plan(['node_modules']).all).toBeNull();
  });
});

describe('a change in the browser tests of the library', () => {
  it('one test file: that file only', () => {
    expect(plan(['e2e/select.spec.ts']).lib.specs).toEqual(['e2e/select.spec.ts']);
  });

  it.each(['e2e/fixtures/SelectLab.svelte', 'e2e/main.ts', 'playwright.config.ts', 'vite.e2e.config.ts'])('the shared part %s: all of them, and none of the site', (file) => {
    const result = plan([file]);
    expect(result.lib.all).toBe(true);
    expect(runsDocs(result)).toBe(false);
  });
});

describe('a change on the site', () => {
  it('the examples, the tables or the route of one component: the page of that component', () => {
    for (const file of ['docs/src/docs/examples/select/01-basic.svelte', 'docs/src/docs/data/select.ts', 'docs/src/docs/select-examples.ts', 'docs/src/routes/[[lang=lang]]/components/select/+page.svelte']) {
      const result = plan([file]);
      expect(result.docs.filters, file).toEqual(['Select page|components/select/ has no']);
      expect(result.docs.all, file).toBe(false);
      expect(runsLibrary(result), file).toBe(false);
    }
  });

  it('a name without a page: all of the site', () => {
    expect(plan(['docs/src/docs/data/shared.ts']).docs.all).toBe(true);
  });

  it('the overview, the home page, a page of the documentation: their own tests', () => {
    expect(plan(['docs/src/routes/[[lang=lang]]/components/+page.svelte']).docs.filters).toEqual(['components overview|components/ has no']);
    expect(plan(['docs/src/routes/[[lang=lang]]/+page.svelte']).docs.filters).toEqual(['home page|theme (/ru/|/zh/|/) has no']);
    expect(plan(['docs/src/routes/[[lang=lang]]/docs/faq/+page.svelte']).docs.filters).toEqual(['docs/faq/ has no']);
    expect(plan(['docs/src/routes/[[lang=lang]]/docs/getting-started/+page.svelte']).docs.filters).toEqual(['docs/getting-started/ has no', 'installation tabs']);
  });

  it.each([
    'docs/src/docs/styles/site.css',
    'docs/src/docs/components/SiteHeader.svelte',
    'docs/src/docs/i18n/strings.ts',
    'docs/src/docs/pages.ts',
    'docs/src/routes/[[lang=lang]]/+layout.svelte',
    'docs/src/routes/[[lang=lang]]/components/+layout.svelte',
    'docs/e2e/site.spec.ts',
    'docs/vite.config.ts'
  ])('the whole site, so all its tests, and none of the library: %s', (file) => {
    const result = plan([file]);
    expect(result.docs.all).toBe(true);
    expect(runsLibrary(result)).toBe(false);
  });

  it('a change in the library also checks the page of the component on the site', () => {
    const result = plan(['src/lib/Select/types.ts', 'docs/src/docs/styles/site.css']);
    expect(result.docs.all).toBe(true);
    expect(result.lib.specs).toContain('e2e/select.spec.ts');
  });
});

describe('the engines', () => {
  it('three by default, and the one asked for', () => {
    expect(plan([]).engines).toEqual(['chromium', 'firefox', 'webkit']);
    expect(plan([], { engines: ['chromium'] }).engines).toEqual(['chromium']);
  });
});
