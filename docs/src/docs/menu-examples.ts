import type { Component } from 'svelte';

const components = import.meta.glob<{ default: Component }>('./examples/menu/*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/menu/*.svelte', { eager: true, query: '?raw', import: 'default' });

export interface MenuExample {
  /** 'horizontal' for ./menu/01-horizontal.svelte; matches the slug in data/menu.ts. */
  slug: string;
  component: Component;
  /** The file itself: the code shown on the page is the code that runs above it. */
  code: string;
}

export const menuExamples: MenuExample[] = Object.keys(components)
  .sort()
  .map((file) => ({
    slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
    component: components[file].default,
    code: sources[file]
  }));
