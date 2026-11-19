// Renders components to HTML the way a server does, in a process of its own: Vitest measures the coverage of the
// code its own process runs, and the server build of a component would be counted against the browser build of it.
//   node renderOnServer.mjs '[{"file": "src/lib/Select/Select.svelte", "props": {...}}, ...]'
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../..', import.meta.url));
const cases = JSON.parse(process.argv[2]);

// ADS_SSR_CACHE_DIR gives a run of its own the pre-bundled dependencies of its own (a mutation run, or any run that
// shares the machine with other Vite processes): the default cache is shared by every checkout and every chat.
const cacheDir = process.env.ADS_SSR_CACHE_DIR;

const server = await createServer({
  root,
  ...(cacheDir ? { cacheDir } : {}),
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
  // The validation library of the Form is named up front: a process that found it after the others had built the
  // pre-bundled dependencies would re-bundle the shared cache under them (`ERR_OUTDATED_OPTIMIZED_DEP`).
  ssr: { optimizeDeps: { include: ['@rc-component/async-validator'] } },
  plugins: [svelte({ configFile: fileURLToPath(new URL('../../svelte.config.js', import.meta.url)) })],
  resolve: { alias: { $lib: fileURLToPath(new URL('../../src/lib', import.meta.url)) } }
});

try {
  // From the same Vite server as the components, so that both use one copy of Svelte.
  const { render } = await server.ssrLoadModule('svelte/server');
  const bodies = [];
  for (const { file, props } of cases) {
    const module = await server.ssrLoadModule(`/${file}`);
    bodies.push(render(module.default, { props }).body);
  }
  process.stdout.write(JSON.stringify(bodies));
} finally {
  await server.close();
}
