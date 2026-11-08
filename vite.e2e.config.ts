import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Dedicated Vite app for Playwright. It serves e2e/fixtures and imports the real
// library source through `$lib`, so e2e tests exercise the shipped components.
export default defineConfig({
  root: 'e2e/fixtures',
  plugins: [svelte({ configFile: fileURLToPath(new URL('./svelte.config.js', import.meta.url)) })],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  },
  server: {
    port: 4174,
    strictPort: true
  }
});
