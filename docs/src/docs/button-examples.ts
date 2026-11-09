import type { Component } from 'svelte';

const components = import.meta.glob<{ default: Component }>('./examples/button/*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/button/*.svelte', { eager: true, query: '?raw', import: 'default' });

export interface ButtonExample {
  /** 'types' for ./button/01-types.svelte; matches the slug in data/button.ts. */
  slug: string;
  component: Component;
  /** The file itself: the code shown on the page is the code that runs above it. */
  code: string;
}

export const buttonExamples: ButtonExample[] = Object.keys(components)
  .sort()
  .map((file) => ({
    slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
    component: components[file].default,
    code: sources[file]
  }));
