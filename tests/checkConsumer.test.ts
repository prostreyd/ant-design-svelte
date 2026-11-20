// The helpers of scripts/check-consumer.mjs (`npm run check:consumer`): what it reads out of the output of the tools it runs. The
// run itself needs the network and a clean install, so it is not part of the tests; it is run before a release that changes how
// the package is imported (rule 7б).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APP_SOURCE,
  BAD_SOURCE,
  COVERED_EXPORTS,
  EXPECTED_BAD_ERRORS,
  firstPath,
  parseSvelteCheck,
  ssrSummary,
  uncoveredExports
} from '../scripts/check-consumer.mjs';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { exports: Record<string, unknown>; scripts: Record<string, string> };

describe('check:consumer: the entries it imports', () => {
  it('every key of the exports map of the package is imported by the consumer app, so a new entry cannot be left unchecked', () => {
    expect(uncoveredExports(manifest.exports)).toEqual([]);
    expect(COVERED_EXPORTS.filter((key) => !(key in manifest.exports))).toEqual([]);
  });

  it('a key that nothing checks is named', () => {
    expect(uncoveredExports({ '.': {}, './new': {} })).toEqual(['./new']);
  });

  it('the app imports the main entry, the icons entry, one icon by its path and both stylesheets', () => {
    expect(APP_SOURCE).toContain("from 'svelte-ant-design';");
    expect(APP_SOURCE).toContain("from 'svelte-ant-design/icons';");
    expect(APP_SOURCE).toContain("from 'svelte-ant-design/icons/StarFilled';");
    expect(APP_SOURCE).toContain("import 'svelte-ant-design/tokens.css';");
    expect(APP_SOURCE).toContain("import 'svelte-ant-design/tokens-accessible.css';");
  });

  it('the file of wrong calls has one wrong line for each error that is expected', () => {
    const lines = BAD_SOURCE.split('\n').filter((line) => line.startsWith('<StarOutlined '));
    expect(lines).toHaveLength(EXPECTED_BAD_ERRORS);
  });

  it('the script is an npm script', () => {
    expect(manifest.scripts['check:consumer']).toBe('node scripts/check-consumer.mjs');
  });
});

describe('check:consumer: what it reads', () => {
  it('svelte-check output: the errors by file, the warnings apart, and whether it finished', () => {
    const output = [
      '1795197520256 START "/tmp/app"',
      '1795197520256 ERROR "src/App.svelte" 2:10 "Cannot find module \'x\'."',
      '1795197520257 ERROR "src/Bad.svelte" 6:15 "Type \'string\' is not assignable to type \'boolean | undefined\'."',
      '1795197520257 WARNING "src/Bad.svelte" 7:1 "A warning"',
      '1795197520257 COMPLETED 987 FILES 2 ERRORS 1 WARNINGS 1 FILES_WITH_PROBLEMS'
    ].join('\n');
    const parsed = parseSvelteCheck(output);
    expect(parsed.completed).toBe(true);
    expect(parsed.errors.map((error) => error.file)).toEqual(['src/App.svelte', 'src/Bad.svelte']);
    expect(parsed.warnings).toHaveLength(1);
    expect(parseSvelteCheck('a crash\n  at Module.load').completed).toBe(false);
  });

  it('the mark of a drawing is the start of its first path, and a module with no path gives none', () => {
    const star = readFileSync(join(root, 'node_modules/@ant-design/icons-svg/es/asn/StarOutlined.js'), 'utf8');
    const other = readFileSync(join(root, 'node_modules/@ant-design/icons-svg/es/asn/AccountBookOutlined.js'), 'utf8');
    expect(firstPath(star)).toHaveLength(48);
    expect(firstPath(star)).not.toBe(firstPath(other));
    expect(firstPath('var x = 1;')).toBeNull();
  });

  it('a server render is counted by icons, images and paths', () => {
    const html = '<span class="ads-icon ads-icon-star" role="img"><svg><path d="a"></path></svg></span><span aria-hidden="true" class="ads-icon"><svg><path d="b"></path></svg></span><button class="ads-btn">x</button>';
    expect(ssrSummary(html)).toEqual({ icons: 2, images: 1, paths: 2 });
  });
});
