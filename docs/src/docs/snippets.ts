// Code snippets shown on the documentation pages (the Button examples live in examples/button).
import type { CodeKind } from './highlight';

export interface Snippet { code: string; kind: CodeKind }

export const quickStart: Snippet = {
  kind: 'svelte',
  code: `<script lang="ts">
  import 'svelte-ant-design/tokens.css';
  import { Button } from 'svelte-ant-design';
</script>

<Button type="primary" onclick={() => console.log('saved')}>
  Save
</Button>
<Button danger>Delete</Button>`
};

export const usage: Snippet = {
  kind: 'svelte',
  code: `<script lang="ts">
  import 'svelte-ant-design/tokens.css';
  import { Button } from 'svelte-ant-design';
</script>

<Button type="primary">Hello</Button>`
};

export const kitLayout: Snippet = {
  kind: 'svelte',
  code: `<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import 'svelte-ant-design/tokens.css';
  let { children } = $props();
</script>

{@render children()}`
};

export const typesImport: Snippet = {
  kind: 'ts',
  code: `import type { ButtonType, ButtonSize } from 'svelte-ant-design';`
};

export const themeOverride: Snippet = {
  kind: 'css',
  code: `:root {
  --ads-radius-md: 8px;
  --ads-control-height: 36px;
  --ads-color-primary-solid: #1f5fd1;
}

:root[data-theme='dark'] {
  --ads-color-primary-solid: #5b9bff;
}`
};

export const accessibleTokens: Snippet = {
  kind: 'ts',
  code: `import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';`
};

export const darkAttribute: Snippet = {
  kind: 'svelte',
  code: `<html data-theme="dark">`
};

export const darkSystem: Snippet = {
  kind: 'ts',
  code: `const saved = localStorage.getItem('theme');
const dark = saved
  ? saved === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = dark ? 'dark' : 'light';`
};

export const iconOnly: Snippet = {
  kind: 'svelte',
  code: `<Button shape="circle" icon={searchIcon} aria-label="Search" />`
};

export const development: Snippet = {
  kind: 'sh',
  code: `npm install
npm run dev          # this documentation site, with live reload
npm test             # unit and accessibility tests
npm run test:e2e     # library tests in a browser
npm run check        # type check of the library
npm run check:docs   # type check of the documentation site
npm run lint
npm run build        # build this site, then
npm run test:docs    # check links and run its browser tests`
};
