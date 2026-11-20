// `npm run check:consumer [-- --node22] [-- --keep]`: the package as a consumer gets it (rule 7б of the rules for AI assistants).
//
// It packs the library the way `npm publish` would (`npm run package`, then `npm pack`), installs the tarball into a clean
// Svelte 5 + TypeScript + Vite project in a temporary folder, and checks what the tests of the repository cannot:
//
//  1. Types. `svelte-check` of the consumer: the entries that the `exports` map names resolve (`.`, `./icons`, `./icons/<Name>`,
//     the stylesheets) and the types are real: a file of deliberately wrong calls must give exactly the errors that are expected,
//     and nothing else, and without that file there are no errors.
//  2. Build. `vite build` passes, and tree shaking works on the installed package: a drawing that the app uses is in the bundle and
//     one that it does not use is not.
//  3. Server render. The app is rendered on the server by Vite (the loader of SvelteKit) from the installed package on the Node
//     that runs this script and, with `--node22`, on Node 22 (what CI runs; Node 22 and 24 differ in how they find the named
//     exports of a CommonJS dependency, which broke the icons once). Every icon has to be drawn.
//
// Run it before a release that changes `exports`, adds an entry point or a dependency, or changes how the library imports a package.
// It needs the network (the install) and takes one to two minutes. Nothing of the repository is changed except `dist/`.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The keys of the `exports` map that the consumer app below imports. A key that is not here fails the check: add its check first. */
export const COVERED_EXPORTS = ['.', './icons', './icons/*', './tokens.css', './tokens-accessible.css'];

/** How many type errors `Bad.svelte` is written to give: one for each of its lines. */
export const EXPECTED_BAD_ERRORS = 4;

/** The keys of an `exports` map that no check covers. */
export function uncoveredExports(exportsMap, covered = COVERED_EXPORTS) {
  return Object.keys(exportsMap).filter((key) => !covered.includes(key));
}

/**
 * The diagnostics of `svelte-check --output machine`.
 * @param {string} output
 * @returns {{ errors: { file: string, message: string }[], warnings: { file: string, message: string }[], completed: boolean }}
 */
export function parseSvelteCheck(output) {
  const errors = [];
  const warnings = [];
  let completed = false;
  for (const line of output.split('\n')) {
    const found = /^\d+ (ERROR|WARNING) "([^"]+)" \d+:\d+ "(.*)"\s*$/.exec(line.trim());
    if (found) (found[1] === 'ERROR' ? errors : warnings).push({ file: found[2], message: found[3] });
    if (/^\d+ COMPLETED /.test(line.trim())) completed = true;
  }
  return { errors, warnings, completed };
}

/** The first characters of the first path of a drawing from the source of its data module: a mark to look for in a bundle. */
export function firstPath(source) {
  const found = /"d":\s*"([^"]{40,})"/.exec(source);
  return found ? found[1].slice(0, 48) : null;
}

/** What a server render drew. */
export function ssrSummary(html) {
  return {
    icons: (html.match(/class="ads-icon[ "]/g) ?? []).length,
    images: (html.match(/role="img"/g) ?? []).length,
    paths: (html.match(/<path /g) ?? []).length
  };
}

export const APP_SOURCE = `<script lang="ts">
  import 'svelte-ant-design/tokens.css';
  import 'svelte-ant-design/tokens-accessible.css';
  import { Button, createFromIconfontCN, getTwoToneColor, Icon, setTwoToneColor, type IconDefinition, type IconProps } from 'svelte-ant-design';
  import { HeartTwoTone, LoadingOutlined, StarOutlined } from 'svelte-ant-design/icons';
  import StarFilled from 'svelte-ant-design/icons/StarFilled';

  const mine: IconDefinition = { name: 'flag', theme: 'filled', icon: { tag: 'svg', attrs: { viewBox: '0 0 24 24' }, children: [{ tag: 'path', attrs: { d: 'M5 2h2v20H5z' } }] } };
  setTwoToneColor('#eb2f96');
  const pair: [string, string] = getTwoToneColor();
  const Font = createFromIconfontCN({ scriptUrl: '' });
  const props: IconProps = { spin: true, label: 'x' };
</script>

<Button type="primary">Save</Button>
<StarOutlined spin rotate={90} label="Favourite" class="a" style="color: red" onclick={() => {}} />
<HeartTwoTone twoToneColor={['#fff', '#000']} />
<LoadingOutlined />
<StarFilled label="" />
<Icon icon={mine} {...props} />
<Font type="icon-x" />
<span>{pair.join(',')}</span>
`;

export const BAD_SOURCE = `<script lang="ts">
  import { StarOutlined } from 'svelte-ant-design/icons';
</script>

<!-- every line below must be a type error: the types are real, not any (${EXPECTED_BAD_ERRORS} lines, ${EXPECTED_BAD_ERRORS} errors) -->
<StarOutlined spin="yes" />
<StarOutlined rotate="fast" />
<StarOutlined twoToneColor={5} />
<StarOutlined icon={undefined as never} nonsense={1} />
`;

const SSR = `import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true }, plugins: [svelte()] });
try {
  const { render } = await server.ssrLoadModule('svelte/server');
  const app = await server.ssrLoadModule('/src/App.svelte');
  process.stdout.write('SSR-HTML:' + JSON.stringify(render(app.default).body) + '\\n');
} finally {
  await server.close();
}
`;

const FILES = {
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        strict: true,
        noEmit: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        skipLibCheck: true,
        types: ['vite/client']
      },
      include: ['src/**/*.ts', 'src/**/*.svelte']
    },
    null,
    2
  ),
  'svelte.config.js': "import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\nexport default { preprocess: vitePreprocess() };\n",
  'vite.config.ts': "import { svelte } from '@sveltejs/vite-plugin-svelte';\nimport { defineConfig } from 'vite';\nexport default defineConfig({ plugins: [svelte()] });\n",
  'index.html': '<!doctype html><div id="app"></div><script type="module" src="/src/main.ts"></script>\n',
  'src/main.ts': "import { mount } from 'svelte';\nimport App from './App.svelte';\nmount(App, { target: document.getElementById('app')! });\n",
  'src/App.svelte': APP_SOURCE,
  'ssr.mjs': SSR
};

/** Runs a command; returns what it printed. */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** One line of the report. */
const results = [];
function record(ok, name, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
  const keep = process.argv.includes('--keep');
  const withNode22 = process.argv.includes('--node22');
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

  const missing = uncoveredExports(manifest.exports ?? {});
  if (missing.length) {
    console.error(`The exports map has keys that this check does not import: ${missing.join(', ')}. Add them to the consumer app and to COVERED_EXPORTS.`);
    process.exit(1);
  }

  console.log('Packing the library...');
  const packed = run(npm, ['run', 'package'], { cwd: root });
  if (packed.status !== 0) {
    console.error(packed.stdout + packed.stderr);
    process.exit(1);
  }
  const work = mkdtempSync(join(tmpdir(), 'ads-consumer-'));
  const project = join(work, 'app');
  mkdirSync(join(project, 'src'), { recursive: true });
  try {
    const tarball = JSON.parse(run(npm, ['pack', '--json', '--pack-destination', work], { cwd: root }).stdout)[0].filename;

    const dev = manifest.devDependencies;
    writeFileSync(
      join(project, 'package.json'),
      JSON.stringify(
        {
          name: 'consumer-check',
          private: true,
          type: 'module',
          dependencies: { [manifest.name]: `file:${join(work, tarball)}`, svelte: dev.svelte },
          devDependencies: { vite: dev.vite, '@sveltejs/vite-plugin-svelte': dev['@sveltejs/vite-plugin-svelte'], 'svelte-check': dev['svelte-check'], typescript: dev.typescript }
        },
        null,
        2
      )
    );
    for (const [file, content] of Object.entries(FILES)) writeFileSync(join(project, file), content);

    console.log(`Installing ${tarball} into a clean project (network)...`);
    const installed = run(npm, ['install', '--no-audit', '--no-fund'], { cwd: project });
    if (installed.status !== 0) {
      console.error(installed.stdout + installed.stderr);
      process.exit(1);
    }

    // 1. Types: with the file of wrong calls there are exactly its errors, without it there are none.
    writeFileSync(join(project, 'src/Bad.svelte'), BAD_SOURCE);
    const withBad = parseSvelteCheck(run('npx', ['svelte-check', '--tsconfig', './tsconfig.json', '--output', 'machine'], { cwd: project }).stdout);
    const outside = withBad.errors.filter((error) => error.file !== 'src/Bad.svelte');
    record(
      withBad.completed && withBad.errors.length === EXPECTED_BAD_ERRORS && outside.length === 0,
      'types: the entries resolve and the wrong calls are type errors (the types are not any)',
      `${withBad.errors.length} errors of ${EXPECTED_BAD_ERRORS} expected${outside.length ? `, also in: ${outside.map((error) => `${error.file}: ${error.message}`).join('; ')}` : ''}`
    );
    rmSync(join(project, 'src/Bad.svelte'));
    const clean = parseSvelteCheck(run('npx', ['svelte-check', '--tsconfig', './tsconfig.json', '--output', 'machine'], { cwd: project }).stdout);
    record(clean.completed && clean.errors.length === 0 && clean.warnings.length === 0, 'types: the app that uses the entries has no error and no warning', clean.errors.concat(clean.warnings).map((one) => `${one.file}: ${one.message}`).join('; '));

    // 2. Build and tree shaking.
    const built = run('npx', ['vite', 'build'], { cwd: project });
    record(built.status === 0, 'build: vite build passes', built.status === 0 ? '' : (built.stdout + built.stderr).split('\n').slice(-6).join(' | '));
    if (built.status === 0) {
      const assets = join(project, 'dist/assets');
      const bundle = run('sh', ['-c', `cat ${assets}/*.js`], { cwd: project }).stdout;
      const star = firstPath(readFileSync(join(project, 'node_modules/@ant-design/icons-svg/es/asn/StarOutlined.js'), 'utf8'));
      const other = firstPath(readFileSync(join(project, 'node_modules/@ant-design/icons-svg/es/asn/AccountBookOutlined.js'), 'utf8'));
      record(Boolean(star && other && bundle.includes(star) && !bundle.includes(other)), 'build: a drawing the app uses is in the bundle and one it does not use is not (tree shaking)', `${Math.round(bundle.length / 1024)} kB of script`);
    }

    // 3. Server render, on this Node and on Node 22.
    const nodes = [{ label: `Node ${process.version}`, path: process.execPath }];
    if (withNode22) {
      const prefix = join(work, 'node22');
      mkdirSync(prefix, { recursive: true });
      writeFileSync(join(prefix, 'package.json'), '{"private":true}');
      const got = run(npm, ['install', '--no-audit', '--no-fund', 'node@22'], { cwd: prefix });
      const path = join(prefix, 'node_modules/node/bin/node');
      if (got.status === 0 && existsSync(path)) nodes.push({ label: `Node ${run(path, ['--version']).stdout.trim()}`, path });
      else record(false, 'server render: Node 22 could not be installed', (got.stdout + got.stderr).split('\n').slice(-3).join(' | '));
    } else if (!process.version.startsWith('v22.')) {
      console.log('NOTE  Node 22 (the Node of CI) is not run: add --node22');
    }
    for (const node of nodes) {
      const rendered = run(node.path, ['ssr.mjs'], { cwd: project });
      const line = rendered.stdout.split('\n').find((text) => text.startsWith('SSR-HTML:'));
      if (!line) {
        record(false, `server render on ${node.label}: the app did not render`, (rendered.stdout + rendered.stderr).split('\n').slice(-4).join(' | '));
        continue;
      }
      const summary = ssrSummary(JSON.parse(line.slice('SSR-HTML:'.length)));
      record(summary.icons >= 6 && summary.paths >= 6 && summary.images >= 4, `server render on ${node.label}: every icon is drawn`, `${summary.icons} icons, ${summary.paths} paths, ${summary.images} images`);
    }
  } finally {
    if (keep) console.log(`The project is kept in ${project}`);
    else rmSync(work, { recursive: true, force: true });
  }
  const failed = results.filter((result) => !result.ok);
  console.log(failed.length ? `\n${failed.length} of ${results.length} checks failed.` : `\nConsumer check: ${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
