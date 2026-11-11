import type { Component } from 'svelte';

const components = import.meta.glob<{ default: Component }>('./examples/input/*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/input/*.svelte', { eager: true, query: '?raw', import: 'default' });

export interface InputExample {
  /** 'basic' for ./input/01-basic.svelte; matches the slug in data/input.ts. */
  slug: string;
  component: Component;
  /** The file itself: the code shown on the page is the code that runs above it. */
  code: string;
}

export const inputExamples: InputExample[] = Object.keys(components)
  .sort()
  .map((file) => ({
    slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
    component: components[file].default,
    code: sources[file]
  }));
