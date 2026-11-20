// Tree-shaking (specs/icon.md, I9): importing one ready icon bundles that drawing and the shared Icon, not the other 847.
// A bundle of the barrel entry, built the way an application's build does, once for one icon and once for all of them.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { join } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { StarOutlined, HeartOutlined, SmileOutlined } from '../src/lib/Icon/data';

const root = join(import.meta.dirname, '..');

async function bundle(entry: string): Promise<string> {
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
  return outputs.map((output) => ('code' in output ? output.code : '')).join('\n');
}

const pathOf = (definition: { icon: unknown }) => ((definition.icon as { children: { attrs: { d: string } }[] }).children[0].attrs.d).slice(0, 60);

describe('Icon: tree-shaking (I9)', () => {
  it('I9: the build of one icon holds that drawing and not the others, and is a fraction of the build of all', async () => {
    const one = await bundle('tests/fixtures/iconBundleOne.ts');
    const all = await bundle('tests/fixtures/iconBundleAll.ts');
    expect(one).toContain(pathOf(StarOutlined));
    expect(one).not.toContain(pathOf(HeartOutlined));
    expect(one).not.toContain(pathOf(SmileOutlined));
    expect(all).toContain(pathOf(HeartOutlined));
    expect(all).toContain(pathOf(StarOutlined));
    expect(one.length).toBeLessThan(all.length / 20);
    expect(one.length).toBeLessThan(60_000);
  }, 120_000);
});
