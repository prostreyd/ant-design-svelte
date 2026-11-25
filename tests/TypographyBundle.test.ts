// The styles that reach an application which uses only the article, or only a text part (specs/typography.md, TYP-5 and TYP-5a): a bundle of the barrel entry,
// built the way an application's build does it, where the unused parts and their styles are left out.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { join } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

async function styles(entry: string): Promise<string> {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [svelte({ configFile: join(root, 'svelte.config.js') })],
    build: {
      write: false,
      minify: false,
      lib: { entry: join(root, entry), formats: ['es'], fileName: 'out' },
      rollupOptions: { external: [/^svelte(\/.*)?$/] }
    }
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((one) => ('output' in one ? one.output : []));
  return outputs.map((output) => (output.type === 'asset' && output.fileName.endsWith('.css') ? String(output.source) : '')).join('\n');
}

describe('Typography: the styles of an application that uses only the article, or only a part', () => {
  it('TYP-5: code, kbd, mark and strong are styled, in forced colors too, without the parts in the bundle', async () => {
    const css = await styles('tests/fixtures/typographyBundle.ts');
    expect(css).toContain('ads-typography-article');
    for (const tag of ['code', 'kbd', 'mark', 'strong']) expect(css).toMatch(new RegExp(`\\.ads-typography ${tag}\\b`));
    // Inside the forced-colors block, after any number of whole rules.
    expect(css).toMatch(/@media \(forced-colors: active\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\.ads-typography mark \{/);
    expect(css).toMatch(/\.ads-typography a:where\(\[href\]/);
    // The parts were not asked for: their own styles stay out.
    expect(css).not.toContain('ads-typography-copy-loading');
  }, 120_000);

  it('TYP-5a: an application that uses one part and no article gets the look of the plain links too', async () => {
    const css = await styles('tests/fixtures/typographyPartsBundle.ts');
    expect(css).toMatch(/\.ads-typography a:where\(\[href\]/);
    expect(css).not.toContain('ads-typography-article');
  }, 120_000);
});
