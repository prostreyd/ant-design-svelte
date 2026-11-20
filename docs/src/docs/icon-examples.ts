import type { Component } from 'svelte';

// The numbered files are the examples; a file such as `panda-svg.part.svelte` is a part of one of them (a component that the
// example passes to the icon). Its code is shown after the code of the example that uses it.
const components = import.meta.glob<{ default: Component }>('./examples/icon/[0-9]*.svelte', { eager: true });
const sources = import.meta.glob<string>('./examples/icon/[0-9]*.svelte', { eager: true, query: '?raw', import: 'default' });
const parts = import.meta.glob<string>('./examples/icon/*.part.svelte', { eager: true, query: '?raw', import: 'default' });

export interface IconExample {
  /** 'basic' for ./icon/01-basic.svelte; matches the slug in data/icon.ts. */
  slug: string;
  component: Component;
  /** The file itself, then the parts it imports: the code shown on the page is the code that runs above it. */
  code: string;
}

/** The parts a source file imports, by their `./name.part.svelte` path. */
function partsOf(source: string): string[] {
  return [...source.matchAll(/from '\.\/([\w-]+\.part\.svelte)'/g)].map((match) => match[1]);
}

export const iconExamples: IconExample[] = Object.keys(components)
  .sort()
  .map((file) => {
    const source = sources[file];
    const extra = partsOf(source).map((name) => `\n<!-- ${name} -->\n${parts[`./examples/icon/${name}`]}`);
    return {
      slug: file.replace(/^.*\/\d+-/, '').replace(/\.svelte$/, ''),
      component: components[file].default,
      code: [source, ...extra].join('\n')
    };
  });
