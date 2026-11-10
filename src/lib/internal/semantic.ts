/**
 * Helpers for the `classNames` / `styles` props, which address the named parts of a
 * component ("semantic DOM"). Kept free of Svelte so they are easy to test and to share.
 */

/** Inline styles of one part: CSS property names in kebab-case (or custom properties) to values. */
export type SemanticStyle = Record<string, string | number>;

/** Joins the class names that are set, in order. */
export function classList(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Builds the text of a `style` attribute from strings and style objects, in order, so a
 * later one wins. Numbers are written as they are (no automatic `px`), property names are
 * not converted. Returns `undefined` when nothing is left, so Svelte drops the attribute.
 */
export function styleText(
  ...styles: ReadonlyArray<string | SemanticStyle | false | null | undefined>
): string | undefined {
  const declarations: string[] = [];
  for (const style of styles) {
    if (!style) continue;
    if (typeof style === 'string') {
      const text = style.trim().replace(/;+$/, '');
      if (text) declarations.push(text);
      continue;
    }
    for (const [property, value] of Object.entries(style)) {
      if (value === undefined || value === null || value === '') continue;
      declarations.push(`${property}: ${value}`);
    }
  }
  return declarations.length > 0 ? declarations.join('; ') : undefined;
}
