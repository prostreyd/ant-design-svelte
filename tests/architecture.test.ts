// The check of the dependencies between components (scripts/check-architecture.mjs, rule 6b).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkArchitecture,
  DEPENDENCIES,
  dependenciesSection,
  exportedFiles,
  findCycle,
  importsBetweenFolders,
  parseImports,
  publicFiles,
  readRepository,
  specName
} from '../scripts/check-architecture.mjs';

const root = join(__dirname, '..');

/** The entry of a small library: every listed file is public. */
const entry = (...files: string[]) => files.map((file) => `export { default as X } from './${file}';`).join('\n');

const NONE = '## Dependencies\n\nNone.\n';
const section = (text: string) => `# Spec\n\n## Dependencies\n\n${text}\n\n## Next\n`;

/** A library of three components and the specifications that go with it; `files` and `specs` replace or add entries. */
function library(
  files: Record<string, string> = {},
  specs: Record<string, string> = {},
  extra: { dependencies?: typeof DEPENDENCIES; legacy?: string[]; packageExports?: Record<string, unknown> } = {}
) {
  const allFiles: Record<string, string> = {
    'index.ts': entry('Button/Button.svelte', 'Select/Select.svelte', 'Input/Input.svelte'),
    'Button/Button.svelte': '<script lang="ts">import { classList } from "../internal/semantic.js";</script>',
    'Select/Select.svelte': '<script lang="ts">import Popup from "../internal/popup/Popup.svelte";</script>',
    'Input/Input.svelte': '<script lang="ts">import { classList } from "../internal/semantic.js";</script>',
    'internal/semantic.ts': 'export const classList = () => "";',
    'internal/popup/Popup.svelte': '<script lang="ts">import { place } from "./placement.js";</script>',
    'internal/popup/placement.ts': 'export const place = () => 0;',
    ...files
  };
  const allSpecs: Record<string, string> = {
    button: NONE,
    select: '## Dependencies\n\n| Needs | Kind | Why |\n|---|---|---|\n| internal/popup | primitive | places the list |\n',
    input: NONE,
    ...specs
  };
  return checkArchitecture({
    files: allFiles,
    indexSource: allFiles['index.ts'],
    specs: allSpecs,
    dependencies: extra.dependencies ?? [],
    legacy: extra.legacy ?? [],
    packageExports: extra.packageExports
  });
}

describe('architecture: reading the imports', () => {
  it('finds static imports, re-exports, side effects and import() and tells types from values', () => {
    const source = [
      "import Button from '../Button/Button.svelte';",
      "import type { A } from '../Button/types.js';",
      "import { type B, type C } from '../Button/types.js';",
      "import { type D, e } from '../Button/other.js';",
      "export { f } from './f.js';",
      "import './side.css';",
      "const lazy = import('./lazy.js');"
    ].join('\n');
    expect(parseImports(source)).toEqual([
      { specifier: '../Button/Button.svelte', type: false },
      { specifier: '../Button/types.js', type: true },
      { specifier: '../Button/types.js', type: true },
      { specifier: '../Button/other.js', type: false },
      { specifier: './f.js', type: false },
      { specifier: './side.css', type: false },
      { specifier: './lazy.js', type: false }
    ]);
  });

  it('finds several imports on one line, even right after the script tag', () => {
    const source = '<script lang="ts">import a from "./a.js"; import { type T } from "./t.js"; import b from "../B/b.svelte";</script>';
    expect(parseImports(source)).toEqual([
      { specifier: './a.js', type: false },
      { specifier: './t.js', type: true },
      { specifier: '../B/b.svelte', type: false }
    ]);
  });

  it('reads an import that spans lines and ignores imports in comments', () => {
    const source = "import {\n  a,\n  b\n} from './x.js';\n// import c from './no.js';\n/* import d from './no2.js'; */\n<!-- import e from './no3.js' -->";
    expect(parseImports(source)).toEqual([{ specifier: './x.js', type: false }]);
  });

  it('resolves a relative import to the folder it leaves for, and treats .js as .ts', () => {
    const edges = importsBetweenFolders({
      'Input/InputSearch.svelte': "import Button from '../Button/Button.svelte'; import { a } from './helper.js'; import type { T } from '../Button/types.js';",
      'Input/helper.ts': 'export const a = 1;',
      'index.ts': "import x from './Button/Button.svelte';"
    });
    expect(edges).toEqual([
      { from: 'Input', to: 'Button', target: 'Button/Button.svelte', type: false, file: 'Input/InputSearch.svelte' },
      { from: 'Input', to: 'Button', target: 'Button/types.ts', type: true, file: 'Input/InputSearch.svelte' }
    ]);
  });

  it('the public surface is what src/lib/index.ts exports, values and types alike', () => {
    const source = "export { default as Button } from './Button/Button.svelte';\nexport type { P } from './Button/types.js';";
    expect([...publicFiles(source)].sort()).toEqual(['Button/Button.svelte', 'Button/types.ts']);
  });

  it('a component folder name becomes the name of its specification', () => {
    expect(specName('Input')).toBe('input');
    expect(specName('InputNumber')).toBe('input-number');
    expect(specName('DatePicker')).toBe('date-picker');
  });
});

describe('architecture: cycles', () => {
  it('no cycle in a chain', () => {
    expect(findCycle([{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'A', to: 'C' }])).toBeNull();
  });

  it('finds a cycle of two and of three, with the path', () => {
    expect(findCycle([{ from: 'DatePicker', to: 'TimePicker' }, { from: 'TimePicker', to: 'DatePicker' }])).toEqual(['DatePicker', 'TimePicker', 'DatePicker']);
    expect(findCycle([{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' }])).toEqual(['A', 'B', 'C', 'A']);
  });
});

describe('architecture: the dependencies section of a specification', () => {
  it('takes the text up to the next heading and finds nothing when there is no section', () => {
    expect(dependenciesSection('# Spec\n\n## Dependencies\n\nButton.\n\n## Next\nelse')).toContain('Button.');
    expect(dependenciesSection('# Spec\n\n## Dependencies\n\nButton.\n\n## Next\nelse')).not.toContain('else');
    expect(dependenciesSection('# Spec\n\n## Other\n')).toBeNull();
    expect(dependenciesSection('## Dependencies and more\n')).toBeNull();
  });
});

describe('architecture: the rules', () => {
  it('a library with helpers, a primitive and no dependencies between components passes', () => {
    expect(library().errors).toEqual([]);
  });

  it('internal/ importing a component fails', () => {
    const { errors } = library({ 'internal/semantic.ts': "import Button from '../Button/Button.svelte';" });
    expect(errors.join('\n')).toMatch(/`internal\/` imports the component Button/);
  });

  it('importing a private file of another component fails, a public file passes the surface check', () => {
    const dependencies = [{ from: 'Input', to: 'Button', why: 'the search button is the real button' }];
    const specs = { input: section('Button: the search button.') };
    const privateImport = library({ 'Input/Input.svelte': "import x from '../Button/private.ts';" }, specs, { dependencies });
    expect(privateImport.errors.join('\n')).toMatch(/Input\/Input.svelte: imports Button\/private.ts, a private file of Button/);
    const publicImport = library({ 'Input/Input.svelte': "import Button from '../Button/Button.svelte';" }, specs, { dependencies });
    expect(publicImport.errors).toEqual([]);
  });

  it('importing the package entry fails', () => {
    const { errors } = library({ 'Button/Button.svelte': "import { Select } from '../index.js';" });
    expect(errors.join('\n')).toMatch(/imports the package entry/);
  });

  it('rendering a component that is not in DEPENDENCIES fails and says what to do', () => {
    const { errors } = library({ 'Select/Select.svelte': "import Button from '../Button/Button.svelte';" });
    expect(errors.join('\n')).toMatch(/Select renders Button, which is not in DEPENDENCIES/);
    expect(errors.join('\n')).toMatch(/specs\/select\.md/);
  });

  it('a type-only import needs no entry, but still only the public surface', () => {
    const ok = library({ 'Select/Select.svelte': "import type { ButtonProps } from '../Button/types.js';" }, {}, {});
    expect(ok.errors.join('\n')).toMatch(/imports Button\/types\.ts, a private file of Button/); // types.ts is not exported by this entry
    const entryWithTypes = `${entry('Button/Button.svelte', 'Select/Select.svelte', 'Input/Input.svelte')}\nexport type { P } from './Button/types.js';`;
    const result = checkArchitecture({
      files: { ...{ 'index.ts': entryWithTypes, 'Button/Button.svelte': '', 'Select/Select.svelte': "import type { ButtonProps } from '../Button/types.js';", 'Button/types.ts': 'export type ButtonProps = {};' } },
      indexSource: entryWithTypes,
      specs: { button: NONE, select: NONE },
      dependencies: [],
      legacy: []
    });
    expect(result.errors).toEqual([]);
  });

  it('a listed dependency that the code no longer has fails, and so does one without a reason', () => {
    const stale = library({}, {}, { dependencies: [{ from: 'Input', to: 'Button', why: 'the search button is the real button' }] });
    expect(stale.errors.join('\n')).toMatch(/DEPENDENCIES lists Input -> Button, but the code does not import it/);
    const files = { 'Input/Input.svelte': "import Button from '../Button/Button.svelte';" };
    const short = library(files, { input: section('Button') }, { dependencies: [{ from: 'Input', to: 'Button', why: 'short' }] });
    expect(short.errors.join('\n')).toMatch(/the reason is missing or too short/);
  });

  it('two components that render each other fail', () => {
    const files = {
      'Select/Select.svelte': "import Input from '../Input/Input.svelte';",
      'Input/Input.svelte': "import Select from '../Select/Select.svelte';"
    };
    const dependencies = [
      { from: 'Select', to: 'Input', why: 'a reason that is long enough' },
      { from: 'Input', to: 'Select', why: 'a reason that is long enough' }
    ];
    const { errors } = library(files, { select: section('Input'), input: section('Select') }, { dependencies });
    expect(errors.join('\n')).toMatch(/make a cycle: (Select -> Input -> Select|Input -> Select -> Input)/);
  });

  it('a component without a specification fails', () => {
    const { errors } = library({ 'Switch/Switch.svelte': '' });
    expect(errors.join('\n')).toMatch(/src\/lib\/Switch\/ has no specification \(specs\/switch\.md\)/);
  });

  it('a specification without the section fails, unless it is LEGACY', () => {
    const failing = library({}, { button: '# Spec\n' });
    expect(failing.errors.join('\n')).toMatch(/specs\/button\.md: no "## Dependencies" section \(rule 6b\)/);
    const legacy = library({}, { button: '# Spec\n' }, { legacy: ['button'] });
    expect(legacy.errors).toEqual([]);
    expect(legacy.legacy).toEqual(['button']);
  });

  it('the section must name every component and every primitive the component uses, but not a helper', () => {
    const dependencies = [{ from: 'Input', to: 'Button', why: 'the search button is the real button' }];
    const files = { 'Input/Input.svelte': "import Button from '../Button/Button.svelte'; import Popup from '../internal/popup/Popup.svelte'; import { classList } from '../internal/semantic.js';" };
    const missing = library(files, { input: section('Nothing is needed here.') }, { dependencies });
    expect(missing.errors.join('\n')).toMatch(/does not name the component Button/);
    expect(missing.errors.join('\n')).toMatch(/does not name the primitive internal\/popup/);
    expect(missing.errors.join('\n')).not.toMatch(/semantic/); // a helper file is not a primitive
    const named = library(files, { input: section('Button for the search; the popup primitive places the panel.') }, { dependencies });
    expect(named.errors).toEqual([]);
  });

  it('LEGACY naming a specification that does not exist fails', () => {
    const { errors } = library({}, {}, { legacy: ['nothing'] });
    expect(errors.join('\n')).toMatch(/LEGACY lists "nothing", but specs\/nothing\.md does not exist/);
  });
});

describe('architecture: the files that the exports map exposes', () => {
  const ICONS_EXPORTS = { '.': { default: './dist/index.js' }, './icons/*': { svelte: './dist/Icon/icons/*.svelte' }, './tokens.css': './dist/tokens.css' };
  const files = {
    'Icon/Icon.svelte': '<script lang="ts">export {};</script>',
    'Icon/icons/Star.svelte': '<script lang="ts">import Icon from "../Icon.svelte";</script>',
    'Button/Button.svelte': '<script lang="ts">import Star from "../Icon/icons/Star.svelte";</script>'
  };
  const specs = { icon: NONE, button: section('| Icon | whole | the star |') };
  const dependencies = [{ from: 'Button', to: 'Icon', why: 'the button draws a ready icon of the Icon family' }];

  it('a ready icon is public surface when the exports map exposes it by path', () => {
    expect(library(files, specs, { dependencies, packageExports: ICONS_EXPORTS }).errors).toEqual([]);
  });

  it('without that entry the same import is a private file of Icon', () => {
    const { errors } = library(files, specs, { dependencies });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('a private file of Icon');
    expect(errors[0]).toContain('exports map of package.json');
  });

  it('a file the map does not expose stays private, also next to an exposed folder', () => {
    const { errors } = library({ ...files, 'Button/Button.svelte': '<script lang="ts">import X from "../Icon/internal.svelte";</script>', 'Icon/internal.svelte': '' }, specs, {
      dependencies,
      packageExports: ICONS_EXPORTS
    });
    expect(errors.some((message) => message.includes('a private file of Icon'))).toBe(true);
  });

  it('exportedFiles: a wildcard becomes a pattern for one folder level, an exact path stays exact, the root and other files are skipped', () => {
    const { exact, patterns } = exportedFiles({ ...ICONS_EXPORTS, './icons': { svelte: './dist/Icon/icons/index.js' } });
    expect([...exact].sort()).toEqual(['Icon/icons/index.ts', 'tokens.css']);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].test('Icon/icons/CopyOutlined.svelte')).toBe(true);
    expect(patterns[0].test('Icon/Icon.svelte')).toBe(false);
    expect(patterns[0].test('Icon/icons/deep/Star.svelte')).toBe(false);
    expect(patterns[0].test('Icon/icons/Star.js')).toBe(false);
    expect(exportedFiles(undefined)).toEqual({ exact: new Set(), patterns: [] });
    expect(exportedFiles({ './x': { types: './dist/x.d.ts' }, './y': './other/y.js' })).toEqual({ exact: new Set(), patterns: [] });
  });
});

describe('architecture: this repository', () => {
  it('follows the rules: no cycle, no private import, every dependency listed and written down', () => {
    const result = checkArchitecture(readRepository(root));
    expect(result.errors).toEqual([]);
    expect(result.components.length).toBeGreaterThan(0);
  });

  it('every entry of DEPENDENCIES says why', () => {
    for (const entry of DEPENDENCIES) expect(entry.why.length).toBeGreaterThanOrEqual(15);
  });

  it('npm run check:docs runs it and the command passes', () => {
    const result = spawnSync('node', [join(root, 'scripts/check-architecture.mjs')], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/Architecture: \d+ components/);
  });
});
