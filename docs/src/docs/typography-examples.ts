import type { Component } from 'svelte';

const components = import.meta.glob<{ default: Component }>('./examples/typography/*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/typography/*.svelte', { eager: true, query: '?raw', import: 'default' });

export interface TypographyExample {
  /** 'basic' for ./typography/01-basic.svelte; matches the slug in data/typography.ts. */
  slug: string;
  component: Component;
  /** The file itself: the code shown on the page is the code that runs above it. */
  code: string;
}

export const typographyExamples: TypographyExample[] = Object.keys(components)
  .sort()
  .map((file) => ({
    slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
    component: components[file].default,
    code: sources[file]
  }));
