// The highlighter of the code blocks of the documentation site (docs/src/docs/highlight.ts): every attribute of a tag has one
// color, however it is written (`type="x"`, `level={2}`, `strong`, `bind:value`, `{value}`, `{...rest}`), the script is read as
// TypeScript, the rules of a style block as CSS, and the code reads as it was written. The attributes of every example are found by the Svelte compiler,
// not by the highlighter itself.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { highlight, type CodeKind } from '../../docs/src/docs/highlight';
import * as snippets from '../../docs/src/docs/snippets';

const examples = join(import.meta.dirname, '../../docs/src/docs/examples');
const files = readdirSync(examples, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.svelte'));
const read = (file: string) => readFileSync(join(examples, file), 'utf8');

const unescape = (html: string) => html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The highlighted HTML back as text, with the color (`attr`, `str`... or `''`) of each of its characters. */
function painted(source: string, kind: CodeKind = 'svelte'): { text: string; colors: string[] } {
  let text = '';
  const colors: string[] = [];
  for (const [, color, inside, plain] of highlight(source, kind).matchAll(/<span class="hl-(\w+)">([^<]*)<\/span>|([^<]+)/g)) {
    const chunk = unescape(inside ?? plain);
    text += chunk;
    for (let i = 0; i < chunk.length; i++) colors.push(color ?? '');
  }
  return { text, colors };
}

/** The pieces of one color, in order: `['strong', 'level']`. */
const pieces = (source: string, color: string, kind: CodeKind = 'svelte'): string[] =>
  [...highlight(source, kind).matchAll(new RegExp(`<span class="hl-${color}">([^<]*)</span>`, 'g'))].map((match) => unescape(match[1]));

const ATTRIBUTES = new Set(['Attribute', 'SpreadAttribute', 'AttachTag', 'BindDirective', 'ClassDirective', 'StyleDirective', 'OnDirective', 'UseDirective', 'TransitionDirective', 'AnimateDirective', 'LetDirective']);

/** Where each attribute of a component starts, as the Svelte compiler reads it. */
function attributeStarts(source: string): number[] {
  const found: number[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    const { type, start } = node as { type?: string; start?: number };
    if (type && ATTRIBUTES.has(type) && typeof start === 'number') found.push(start);
    Object.values(node).forEach(visit);
  };
  visit(parse(source, { modern: true }));
  return found;
}

describe('the highlighter of the code blocks', () => {
  it('an attribute without a value has the color of an attribute', () => {
    expect(pieces('<TypographyText strong>x</TypographyText>', 'attr')).toEqual(['strong']);
    expect(pieces('<TypographyText code keyboard\n  mark disabled>x</TypographyText>', 'attr')).toEqual(['code', 'keyboard', 'mark', 'disabled']);
    expect(pieces('<Input bind:value disabled />', 'attr')).toEqual(['bind:value', 'disabled']);
  });

  it('a name that is also a word of the language is still an attribute inside a tag', () => {
    const source = '<script lang="ts">\n</script>\n<Button type="primary">x</Button>';
    expect(pieces(source, 'attr')).toEqual(['lang', 'type']);
    expect(pieces(source, 'key')).toEqual([]);
    expect(pieces(source, 'str')).toEqual(['"ts"', '"primary"']);
  });

  it('the shorthand, the spread and an expression with nested braces are expressions, whole', () => {
    expect(pieces('<Input {placeholder} {...rest} />', 'expr')).toEqual(['{placeholder}', '{...rest}']);
    const deep = "<Button onclick={() => { if (a > b) { c = { d: '}' }; } }}>after</Button>";
    expect(pieces(deep, 'expr')).toEqual(["{() => { if (a > b) { c = { d: '}' }; } }}"]);
    expect(pieces(deep, 'tag')).toEqual(['<Button', '</Button']);
  });

  it('the words of the text between tags have no color', () => {
    expect(highlight("<p>It's from the const type, said \"twice\"</p>", 'svelte')).toBe(
      '<span class="hl-tag">&lt;p</span>&gt;It\'s from the const type, said "twice"<span class="hl-tag">&lt;/p</span>&gt;'
    );
  });

  it('the script keeps its keywords, strings and comments', () => {
    const source = "<script lang=\"ts\">\n  import { Button } from 'svelte-ant-design';\n  let a = 1;\n</script>\n<!-- a <b> note -->";
    expect(pieces(source, 'key')).toEqual(['import', 'from', 'let']);
    expect(pieces(source, 'str')).toEqual(['"ts"', "'svelte-ant-design'"]);
    expect(pieces(source, 'com')).toEqual(['<!-- a <b> note -->']);
  });

  it('in a script the braces of an import, an object or a body are not expressions, and what stands inside has its own color', () => {
    const source = "<script lang=\"ts\">\n  import { Typography, TypographyText } from 'svelte-ant-design';\n  const form = createForm<Signup>();\n  function save() {\n    return [{ label: 'One' }];\n  }\n</script>";
    expect(pieces(source, 'expr')).toEqual([]);
    expect(pieces(source, 'tag')).toEqual(['<script', '</script']);
    expect(pieces(source, 'attr')).toEqual(['lang']);
    expect(pieces(source, 'key')).toEqual(['import', 'from', 'const', 'function', 'return']);
    expect(pieces(source, 'str')).toEqual(['"ts"', "'svelte-ant-design'", "'One'"]);
  });

  it('a word of the language is not a keyword as the name of a property, and a comment keeps its quotes', () => {
    const source = "<script>\n  // it's from the type\n  /* const */\n  import type { A } from 'a';\n  type B = { type: 'x', from?: number };\n  list.from(a.type, `new ${b}`, 'http://x');\n</script>";
    expect(pieces(source, 'com')).toEqual(["// it's from the type", '/* const */']);
    expect(pieces(source, 'key')).toEqual(['import', 'type', 'from', 'type']);
    expect(pieces(source, 'str')).toEqual(["'a'", "'x'", '`new ${b}`', "'http://x'"]);
  });

  it('a block of the kind ts is read the same way', () => {
    const { code } = snippets.darkSystem;
    expect(pieces(code, 'key', 'ts')).toEqual(['const', 'const']);
    expect(pieces(code, 'str', 'ts')).toEqual(["'theme'", "'dark'", "'(prefers-color-scheme: dark)'", "'dark'", "'light'"]);
    expect(painted(code, 'ts').text).toBe(code);
  });

  it('no script of any example has the color of markup', () => {
    let scripts = 0;
    for (const file of files) {
      const source = read(file);
      const { colors } = painted(source);
      for (const match of source.matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/g)) {
        scripts += 1;
        const inside = colors.slice(match.index + match[1].length, match.index + match[1].length + match[2].length);
        expect(inside.filter((color) => ['expr', 'tag', 'attr'].includes(color)), file).toEqual([]);
      }
    }
    expect(scripts).toBeGreaterThan(200);
  });

  it('in a style block a selector, a property and a value each have their color, and no brace is an expression', () => {
    const source = '<style>\n  .stack {\n    display: grid;\n    --gap: 12px\n  }\n</style>';
    expect(pieces(source, 'tag')).toEqual(['<style', '.stack', '</style']);
    expect(pieces(source, 'attr')).toEqual(['display', '--gap']);
    expect(pieces(source, 'str')).toEqual(['grid', '12px']);
    expect(pieces(source, 'expr')).toEqual([]);
  });

  it('at-rules, nested rules, pseudo-classes, comments and strings with braces are read as CSS', () => {
    const source = '<style>\n  /* a { */\n  @media (max-width: 600px) {\n    a:hover, .b::after { content: "};"; color: red }\n  }\n</style>';
    expect(pieces(source, 'com')).toEqual(['/* a { */']);
    expect(pieces(source, 'key')).toEqual(['@media']);
    expect(pieces(source, 'tag')).toEqual(['<style', 'a:hover, .b::after', '</style']);
    expect(pieces(source, 'attr')).toEqual(['content', 'color']);
    expect(pieces(source, 'str')).toEqual(['"};"', 'red']);
  });

  it('a block of the kind css is read the same way', () => {
    const { code } = snippets.themeOverride;
    expect(pieces(code, 'tag', 'css')).toEqual([':root', ":root[data-theme='dark']"]);
    expect(pieces(code, 'attr', 'css')).toEqual(['--ads-radius-md', '--ads-control-height', '--ads-color-primary-solid', '--ads-color-primary-solid']);
    expect(pieces(code, 'str', 'css')).toEqual(['8px', '36px', '#1f5fd1', '#5b9bff']);
    expect(painted(code, 'css').text).toBe(code);
  });

  it('no style block of any example has the color of an expression', () => {
    let blocks = 0;
    for (const file of files) {
      const source = read(file);
      const start = source.indexOf('<style');
      if (start < 0) continue;
      blocks += 1;
      expect(painted(source).colors.slice(start).filter((color) => color === 'expr'), file).toEqual([]);
    }
    expect(blocks).toBeGreaterThan(100);
  });

  it('code that breaks off keeps all of its text', () => {
    for (const source of ['<Button', '<Button type="', '<Button onclick={() => {', '{', '<!-- open', "<p>{'", '<script>let a', 'a < b', '<style>a { content: "', '<style>/* open', '<style>a / b', '<script>/* open', '<script>`open\n{', "<script>'open\nlet"]) {
      expect(painted(source).text, source).toBe(source);
    }
  });

  it('every example and snippet of the site reads as it was written', () => {
    const sources = [...files.map(read), ...Object.values(snippets).filter((snippet) => snippet.kind === 'svelte').map((snippet) => snippet.code)];
    expect(sources.length).toBeGreaterThan(200);
    for (const source of sources) expect(painted(source).text).toBe(source);
  });

  it('every attribute of every example has the color of an attribute, and a braced one that of an expression', () => {
    const wrong: string[] = [];
    let checked = 0;
    for (const file of files) {
      const source = read(file);
      const { colors } = painted(source);
      for (const start of attributeStarts(source)) {
        const braced = source[start] === '{';
        const name = braced ? '{' : /^[^\s=/>{}"']+/.exec(source.slice(start))![0];
        checked += 1;
        const expected = braced ? 'expr' : 'attr';
        if (!colors.slice(start, start + name.length).every((color) => color === expected)) wrong.push(`${file}: ${name}`);
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(wrong).toEqual([]);
  });
});
