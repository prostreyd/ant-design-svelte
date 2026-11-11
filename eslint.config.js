import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      // The documentation site (docs/) is linted; its build output and caches are not.
      'docs/build/**',
      'docs/.svelte-kit/**',
      'docs/test-results/**',
      'coverage/**',
      'node_modules/**',
      '.svelte-kit/**',
      // Local scratch folders (git-ignored): throw-away test apps and temporary files.
      // `npm publish` runs the linter, so build output in these folders must not fail it.
      'svelte-demo/**',
      'svelte-demo-local/**',
      'tmp/**'
    ]
  },
  ...tseslint.configs.recommended,
  ...eslintPluginSvelte.configs['flat/recommended'],
  {
    // This rule wants `resolve()` from SvelteKit in every link. The library renders plain anchors and must
    // not depend on SvelteKit, and the documentation site builds its links with `href()`
    // (docs/src/docs/href.ts), a wrapper around `resolve()` that the rule cannot see through.
    rules: { 'svelte/no-navigation-without-resolve': 'off' }
  },
  {
    // `*.svelte.ts` are modules with runes: the Svelte parser, with TypeScript inside it.
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte']
      }
    }
  }
);
