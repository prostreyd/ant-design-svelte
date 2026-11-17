import type { Component } from 'svelte';

const components = import.meta.glob<{ default: Component }>('./examples/grid/*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/grid/*.svelte', { eager: true, query: '?raw', import: 'default' });

export interface GridExample {
  /** 'basic' for ./grid/01-basic.svelte; matches the slug in data/grid.ts. */
  slug: string;
  component: Component;
  /** The file itself: the code shown on the page is the code that runs above it. */
  code: string;
}

export const gridExamples: GridExample[] = Object.keys(components)
  .sort()
  .map((file) => ({
    slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
    component: components[file].default,
    code: sources[file]
  }));
