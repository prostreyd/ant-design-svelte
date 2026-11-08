import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ configFile: fileURLToPath(new URL('./svelte.config.js', import.meta.url)) })],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url))
    },
    conditions: ['browser']
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,js}'],
    setupFiles: ['./vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.{ts,svelte}'],
      exclude: ['src/lib/**/types.ts'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        branches: 100
      }
    }
  }
});
