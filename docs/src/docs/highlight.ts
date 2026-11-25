const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paint = (color: 'tag' | 'attr' | 'str' | 'expr' | 'com' | 'key', code: string) => `<span class="hl-${color}">${escape(code)}</span>`;

export type CodeKind = 'svelte' | 'ts' | 'css' | 'sh';

/** A small highlighter for the few kinds of snippets the site shows. Returns trusted HTML. */
export function highlight(code: string, kind: CodeKind = 'svelte'): string {
  if (kind === 'svelte') return highlightSvelte(code);
  if (kind === 'css') return highlightCss(code);
  if (kind === 'ts') return highlightScript(code);
  return escape(code).replace(/(#.*)$/gm, '<span class="hl-com">$1</span>');
}

const KEYWORDS = new Set(['import', 'from', 'export', 'type', 'interface', 'const', 'let', 'function', 'return', 'if', 'else', 'for', 'async', 'await', 'new']);

/** TypeScript, in a `<script>` or alone: comments, strings and keywords. Braces and everything else stay plain. */
function highlightScript(code: string): string {
  // A comment, a string (a quote ends with its line, a template does not) or a word, with the dot before it if there is one.
  const token = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?)|(\.?[A-Za-z_$][\w$]*)/g;
  const colon = /\s*\??:/y;
  let html = '';
  let last = 0;
  for (const match of code.matchAll(token)) {
    const [text, comment, string, word] = match;
    colon.lastIndex = match.index + text.length;
    // A name before a `:` is the key of an object or of a type, whatever it says.
    const keyword = word !== undefined && KEYWORDS.has(word) && !colon.test(code);
    const color = comment ? 'com' : string ? 'str' : keyword ? 'key' : undefined;
    html += escape(code.slice(last, match.index)) + (color ? paint(color, text) : escape(text));
    last = match.index + text.length;
  }
  return html + escape(code.slice(last));
}

/** The text between two of `{`, `;`, `}` and comments; `end` is the one of them that closed it, if one did. */
function highlightCssPiece(piece: string, end: string): string {
  const [, before, body, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(piece)!;
  if (!body) return escape(piece);
  const atRule = /^@[\w-]+/.exec(body)?.[0];
  const declaration = /^([-\w]+)(\s*:\s*)([\s\S]+)$/.exec(body);
  const painted = atRule
    ? paint('key', atRule) + escape(body.slice(atRule.length))
    : end === '{'
      ? paint('tag', body) // a selector
      : declaration
        ? paint('attr', declaration[1]) + escape(declaration[2]) + paint('str', declaration[3])
        : escape(body);
  return before + painted + after;
}

/** CSS is read rule by rule, so that a selector, a property and a value are told apart by where they stand. */
function highlightCss(code: string): string {
  let html = '';
  let piece = '';
  // A comment, a string (so that its braces do not count), a mark that closes a piece, or anything else.
  for (const [token] of code.matchAll(/\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|[{};]|[^{};"'/]+|\//g)) {
    const comment = token.startsWith('/*');
    if (comment || token === '{' || token === ';' || token === '}') {
      html += highlightCssPiece(piece, token) + (comment ? paint('com', token) : token);
      piece = '';
    } else piece += token;
  }
  return html + highlightCssPiece(piece, '');
}

/** The index after the string whose quote is at `start`. A quote that does not close on its line is an ordinary character. */
function afterString(code: string, start: number): number {
  const quote = code[start];
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') i++;
    else if (code[i] === quote) return i + 1;
    else if (code[i] === '\n' && quote !== '`') break;
  }
  return start + 1;
}

/** The index after the `}` that closes the brace at `start`; braces inside strings do not count. */
function afterBraces(code: string, start: number): number {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') i = afterString(code, i) - 1;
    else if (code[i] === '{') depth++;
    else if (code[i] === '}' && --depth === 0) return i + 1;
  }
  return code.length;
}

/**
 * The markup of a component is read in order, so that a name is colored by where it stands: inside a tag every name is an
 * attribute, with a value or without one (`strong`, `bind:value`); the words of the text between tags have no color.
 */
function highlightSvelte(code: string): string {
  let html = '';
  let i = 0;
  const take = (pattern: RegExp): string | undefined => {
    pattern.lastIndex = i;
    return pattern.exec(code)?.[0];
  };
  const add = (color: Parameters<typeof paint>[0], end: number) => {
    html += paint(color, code.slice(i, end));
    i = end;
  };

  while (i < code.length) {
    const comment = take(/<!--[\s\S]*?(?:-->|$)/y);
    const tag = take(/<\/?[A-Za-z][\w.:-]*/y);
    if (comment) add('com', i + comment.length);
    else if (code[i] === '{') add('expr', afterBraces(code, i));
    else if (!tag) html += escape(code[i++]);
    else {
      add('tag', i + tag.length);
      let isValue = false; // an `=` was read, so what comes next is the value of an attribute
      while (i < code.length && code[i] !== '>') {
        const name = take(/[^\s=/>{}"']+/y);
        if (code[i] === '{') add('expr', afterBraces(code, i));
        else if (code[i] === '"' || code[i] === "'") {
          const close = code.indexOf(code[i], i + 1);
          add('str', close < 0 ? code.length : close + 1);
        } else if (name) add(isValue ? 'str' : 'attr', i + name.length);
        else {
          if (code[i] === '=') isValue = true;
          html += escape(code[i++]);
          continue;
        }
        isValue = false;
      }
      if (i >= code.length) break;
      html += escape(code[i++]);
      const block = /^<(script|style)$/.exec(tag)?.[1];
      if (block) {
        const close = code.indexOf(`</${block}`, i);
        const end = close < 0 ? code.length : close;
        html += (block === 'style' ? highlightCss : highlightScript)(code.slice(i, end));
        i = end;
      }
    }
  }
  return html;
}
