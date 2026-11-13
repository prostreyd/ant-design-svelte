import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import e2eConfig from './vite.e2e.config';

// The e2e fixtures as a static site for the browser floor (specs/popup.md): Chrome 89, Firefox 85, Safari 15.4.
// The syntax is lowered to that floor the way a consumer's build with the same `browserslist` would lower it, so
// what is left to fail in the old engines is the library's own use of a CSS feature or an API that is not there.
const FLOOR = ['chrome89', 'firefox85', 'safari15.4'];

export default mergeConfig(
  e2eConfig,
  defineConfig({
    build: {
      target: FLOOR,
      cssTarget: FLOOR,
      outDir: fileURLToPath(new URL('./tmp/floor/site', import.meta.url)),
      emptyOutDir: true
    }
  })
);
