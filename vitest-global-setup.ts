// Runs once before the tests. The tests of the documentation site (tests/docs) import files of docs/, whose
// tsconfig extends "$app/tsconfig". SvelteKit generates that file (docs/node_modules/$app/tsconfig.json) with
// `svelte-kit sync`; a clean checkout does not have it, so without this step `npm test` fails there, for example
// in the step that runs before `npm publish`. CI used to hide it because `npm run check:docs` ran first.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const docs = fileURLToPath(new URL('./docs', import.meta.url));

export default function setup(): void {
  if (existsSync(`${docs}/node_modules/$app/tsconfig.json`)) return;
  execSync('npx svelte-kit sync', { cwd: docs, stdio: 'inherit' });
}
