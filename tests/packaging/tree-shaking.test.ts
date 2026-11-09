// @vitest-environment node
/**
 * Packaging test: what ends up in a consumer's production bundle.
 *
 * The test packages a copy of the library with `svelte-package` (the same tool as `npm run package`),
 * installs the result into a throw-away app and builds that app with Vite. The copy gets one extra
 * "probe" component, so the test can check that a component the app does not import is left out even
 * while the library still has a single real component.
 *
 * What is copied from the repository unchanged: `src/lib` and `package.json`, so the `exports` map and the
 * `sideEffects` field under test are the ones that are published.
 *
 * Bundler: Vite (Rolldown). Webpack and other bundlers are not covered.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  name: string;
  sideEffects?: unknown;
};

interface Bundle {
  /** Source of every emitted chunk. */
  js: string;
  /** Source of every emitted stylesheet. */
  css: string;
  /** Module ids that contribute code to the bundle, with `/` separators. */
  modules: string[];
}

interface Chunk {
  type: 'chunk';
  code: string;
  modules: Record<string, { renderedLength: number }>;
}

interface Asset {
  type: 'asset';
  fileName: string;
  source: string | Uint8Array;
}

const work = mkdtempSync(join(tmpdir(), 'ads-tree-shaking-'));
const packageDir = join(work, 'package');
const appDir = join(work, 'app');
const links = [join(packageDir, 'node_modules'), join(appDir, 'node_modules', 'svelte')];

const probeComponent = `<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<div class="ads-probe-marker">{@render children?.()}</div>

<style>
  .ads-probe-marker {
    padding: 3px;
  }
</style>
`;

async function bundle(entry: string, source: string): Promise<Bundle> {
  const dir = join(appDir, entry);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), '<!doctype html><script type="module" src="./main.ts"></script>');
  writeFileSync(join(dir, 'main.ts'), source);

  // Vitest sets NODE_ENV=test, and Vite then compiles Svelte components in development mode, which keeps
  // code a production bundle does not contain. Build with NODE_ENV=production, as a real app build does.
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let result: Awaited<ReturnType<typeof build>>;
  try {
    result = await build({
      root: dir,
      mode: 'production',
      configFile: false,
      logLevel: 'silent',
      plugins: [svelte({ configFile: false, preprocess: vitePreprocess() })],
      // Unminified, so the output stays readable if an assertion fails.
      build: { write: false, minify: false }
    });
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
  }

  const outputs = (Array.isArray(result) ? result : [result]).flatMap(
    (item) => (item as unknown as { output: (Chunk | Asset)[] }).output
  );
  const chunks = outputs.filter((item): item is Chunk => item.type === 'chunk');
  const assets = outputs.filter((item): item is Asset => item.type === 'asset');

  return {
    js: chunks.map((chunk) => chunk.code).join('\n'),
    css: assets
      .filter((asset) => asset.fileName.endsWith('.css'))
      .map((asset) => String(asset.source))
      .join('\n'),
    modules: chunks
      .flatMap((chunk) => Object.entries(chunk.modules))
      .filter(([, info]) => info.renderedLength > 0)
      .map(([id]) => id.replaceAll('\\', '/'))
  };
}

const bundled = (result: Bundle, fragment: string) => result.modules.some((id) => id.includes(fragment));

let button: Bundle;
let version: Bundle;
let probe: Bundle;
let tokens: Bundle;

beforeAll(async () => {
  // 1. A copy of the library: the real sources and the real package.json, plus the probe component.
  mkdirSync(packageDir, { recursive: true });
  cpSync(join(root, 'src/lib'), join(packageDir, 'src/lib'), { recursive: true });
  for (const file of ['package.json', 'svelte.config.js', 'tsconfig.json']) {
    cpSync(join(root, file), join(packageDir, file));
  }
  symlinkSync(join(root, 'node_modules'), join(packageDir, 'node_modules'), 'junction');
  mkdirSync(join(packageDir, 'src/lib/Probe'), { recursive: true });
  writeFileSync(join(packageDir, 'src/lib/Probe/Probe.svelte'), probeComponent);
  const index = join(packageDir, 'src/lib/index.ts');
  writeFileSync(index, `${readFileSync(index, 'utf8')}export { default as Probe } from './Probe/Probe.svelte';\n`);

  // 2. Package it. Type declarations are not needed here, so they are skipped to keep the test fast.
  const tool = JSON.parse(readFileSync(join(root, 'node_modules/@sveltejs/package/package.json'), 'utf8')) as {
    bin: Record<string, string>;
  };
  const packaged = spawnSync(
    process.execPath,
    [join(root, 'node_modules/@sveltejs/package', tool.bin['svelte-package']), '-i', 'src/lib', '-o', 'dist', '--no-types'],
    { cwd: packageDir, encoding: 'utf8' }
  );
  if (packaged.status !== 0) {
    throw new Error(`svelte-package failed:\n${packaged.stdout}\n${packaged.stderr}`);
  }

  // 3. Install it into the app the way a package manager would: package.json and dist.
  const installed = join(appDir, 'node_modules', rootPackage.name);
  mkdirSync(installed, { recursive: true });
  cpSync(join(packageDir, 'dist'), join(installed, 'dist'), { recursive: true });
  cpSync(join(packageDir, 'package.json'), join(installed, 'package.json'));
  symlinkSync(join(root, 'node_modules/svelte'), join(appDir, 'node_modules', 'svelte'), 'junction');

  const name = rootPackage.name;
  const mountIt = (component: string) =>
    `import { ${component} } from '${name}'; import { mount } from 'svelte'; mount(${component}, { target: document.body, props: {} });`;
  button = await bundle('button', mountIt('Button'));
  probe = await bundle('probe', mountIt('Probe'));
  version = await bundle('version', `import { VERSION } from '${name}'; document.body.textContent = VERSION;`);
  tokens = await bundle('tokens', `import '${name}/tokens.css';`);
}, 180_000);

afterAll(() => {
  // Remove the links first, so deleting the work folder can never reach the repository's node_modules.
  for (const link of links) {
    try {
      unlinkSync(link);
    } catch {
      /* already removed */
    }
  }
  if (work.startsWith(tmpdir()) && basename(work).startsWith('ads-tree-shaking-')) {
    rmSync(work, { recursive: true, force: true });
  }
});

describe('tree shaking of the packaged library (Vite production build)', () => {
  it('sideEffects: package.json declares that only CSS files have side effects', () => {
    expect(rootPackage.sideEffects).toEqual(['**/*.css']);
  });

  it('one component: importing Button bundles Button and its styles but not the other components', () => {
    expect(bundled(button, '/dist/Button/Button.svelte'), 'Button module is bundled').toBe(true);
    expect(button.css, 'Button styles are bundled').toContain('.ads-btn');
    expect(bundled(button, '/dist/Probe/'), 'unused component module').toBe(false);
    expect(button.js, 'unused component markup').not.toContain('ads-probe-marker');
    expect(button.css, 'unused component styles').not.toContain('ads-probe-marker');
  });

  it('constant only: importing VERSION bundles no component code, no styles, and no Svelte runtime', () => {
    expect(bundled(version, '/dist/Button/'), 'Button module').toBe(false);
    expect(bundled(version, '/dist/Probe/'), 'probe module').toBe(false);
    expect(version.css, 'stylesheets').toBe('');
    // Without `sideEffects`, the bundler keeps the Svelte runtime pulled in by the unused component modules.
    expect(
      version.modules.filter((id) => id.includes('/node_modules/svelte/')),
      'Svelte runtime modules'
    ).toEqual([]);
  });

  it('control: importing the probe component does bundle it, so the checks above can detect a bundled component', () => {
    expect(bundled(probe, '/dist/Probe/Probe.svelte')).toBe(true);
    expect(probe.js).toContain('ads-probe-marker');
    expect(probe.css).toContain('ads-probe-marker');
    expect(bundled(probe, '/dist/Button/'), 'Button is not imported here').toBe(false);
  });

  it('tokens.css: a side-effect import of the stylesheet is kept', () => {
    expect(tokens.css).toContain('--ads-color-primary-solid');
  });
});
