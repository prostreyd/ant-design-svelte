import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// The demo playground lives in `demo/` and imports the real library from
// `src/lib` through the `$lib` alias (never from copied sources).
export default defineConfig({
  root: 'demo',
  plugins: [svelte({ configFile: fileURLToPath(new URL('./svelte.config.js', import.meta.url)) })],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  },
  server: {
    port: 5173
  },
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true
  }
});
