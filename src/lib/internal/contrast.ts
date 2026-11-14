/**
 * Picks a text color for a background (specs/tooltip.md, decision 3b): black or white, whichever contrasts more.
 * For any background the better of the two reaches at least 4.58:1, so WCAG AA text (4.5:1) is always possible.
 */

export const TEXT_ON_DARK = '#ffffff';
export const TEXT_ON_LIGHT = '#000000';

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** The relative luminance (WCAG) of an sRGB color given as 0 to 255 channels. */
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Reads a color the way `getComputedStyle` writes it: `rgb(r, g, b)`, `rgba(r, g, b, a)` (comma or space separated)
 * or `color(srgb r g b)` with 0 to 1 channels. Returns `null` for anything else. The alpha is ignored: the page
 * behind a translucent tooltip is not known.
 */
export function parseComputedColor(value: string): [number, number, number] | null {
  const text = value.trim().toLowerCase();
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const srgb = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(text);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  return null;
}

/** The text color for a computed background color, or `null` when the color cannot be read. */
export function contrastText(background: string): string | null {
  const parsed = parseComputedColor(background);
  if (!parsed) return null;
  const l = luminance(...parsed);
  // White contrasts at least as much as black while (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.05).
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? TEXT_ON_DARK : TEXT_ON_LIGHT;
}
