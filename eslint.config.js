import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-demo/**',
      'build/**',
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
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte']
      }
    }
  }
);
