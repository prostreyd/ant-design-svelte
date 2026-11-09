import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { allEntries } from './src/docs/pages.ts';

// The site imports the real library from ../src/lib, never a copy, so the examples show what ships.
const lib = fileURLToPath(new URL('../src/lib', import.meta.url));

/** Where the site is served from: '' locally, '/ant-design-svelte' on GitHub Pages (set by CI). */
const base = process.env.BASE_PATH ?? '';
/** Used for canonical URLs, hreflang links and the sitemap while prerendering. */
const origin = process.env.SITE_ORIGIN ?? 'https://prostreyd.github.io';

export default defineConfig({
  define: {
    __SITE_BASE__: JSON.stringify(base),
    __SITE_ORIGIN__: JSON.stringify(origin)
  },
  resolve: {
    alias: [
      { find: /^svelte-ant-design\/tokens\.css$/, replacement: `${lib}/tokens.css` },
      { find: /^svelte-ant-design$/, replacement: `${lib}/index.ts` }
    ],
    // One copy of Svelte for the site and for the library sources outside this folder.
    dedupe: ['svelte']
  },
  server: { fs: { allow: ['..'] } },
  plugins: [
    sveltekit({
      compilerOptions: {
        // Runes mode for the site and the library sources; dependencies decide for themselves.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      // Every page is prerendered; 404.html boots the client router for unknown URLs.
      adapter: adapter({ fallback: '404.html' }),
      paths: { base: base as '' | `/${string}`, origin },
      // '*' finds the English pages; the Russian and Chinese ones are listed explicitly so none is missed.
      prerender: { entries: ['*', ...allEntries()] }
    })
  ]
});
