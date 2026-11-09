const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export type CodeKind = 'svelte' | 'ts' | 'css' | 'sh';

/** A small highlighter for the few kinds of snippets the site shows. Returns trusted HTML. */
export function highlight(code: string, kind: CodeKind = 'svelte'): string {
  const text = escape(code);
  if (kind === 'sh') return text.replace(/(#.*)$/gm, '<span class="hl-com">$1</span>');
  if (kind === 'css') {
    return text
      .replace(/(--[\w-]+)/g, '<span class="hl-attr">$1</span>')
      .replace(/(#[0-9a-fA-F]{3,8}\b|\b\d+px)/g, '<span class="hl-str">$1</span>');
  }
  if (kind === 'ts') {
    return text
      .replace(/('[^']*')/g, '<span class="hl-str">$1</span>')
      .replace(/\b(import|from|type|const|let)\b/g, '<span class="hl-key">$1</span>');
  }
  const token =
    /(&lt;!--[\s\S]*?--&gt;)|("[^"]*"|'[^']*')|(&lt;\/?[A-Za-z][\w.]*)|(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})|(\b(?:import|from|let|const|function|type|lang)\b)|([A-Za-z:-]+)(?==)/g;
  return text.replace(token, (match, comment, string, tag, expression, keyword) =>
    comment
      ? `<span class="hl-com">${match}</span>`
      : string
        ? `<span class="hl-str">${match}</span>`
        : tag
          ? `<span class="hl-tag">${match}</span>`
          : expression
            ? `<span class="hl-expr">${match}</span>`
            : keyword
              ? `<span class="hl-key">${match}</span>`
              : `<span class="hl-attr">${match}</span>`
  );
}
