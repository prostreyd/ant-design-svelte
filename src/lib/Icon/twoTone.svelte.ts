/*
 * The colors of two-tone icons. The one file that imports `@ant-design/colors` (rule 6b, criterion 3): the second
 * color of a two-tone drawing is the lightest shade of the ten-step palette of the first, which is what Ant Design draws
 * (`#eb2f96` gives `#fff0f6`, measured on its demo); the package is the same palette function React, Vue and Angular use.
 */
import { generate } from '@ant-design/colors';
import type { TwoToneColor } from './types.js';

/** The colors of a two-tone icon that has none of its own: the theme (`--ads-icon-twotone-*` in `tokens.css`). */
export const DEFAULT_TWO_TONE: readonly [string, string] = ['var(--ads-icon-twotone-primary)', 'var(--ads-icon-twotone-secondary)'];

// A color that is not a literal one (a CSS variable, `currentColor`) has no shade to compute: the default second color is used.
const NOT_A_LITERAL = /var\(|env\(|currentcolor|inherit|initial|unset/i;

/** The pair of colors for one color or a pair. */
export function toPair(color: TwoToneColor): [string, string] {
  if (Array.isArray(color)) return [color[0], color[1]];
  return [color, NOT_A_LITERAL.test(color) ? DEFAULT_TWO_TONE[1] : generate(color)[0]];
}

// The global value. A rendered icon reads it through `resolveTwoTone`, so a change reaches it.
let globalPair = $state<[string, string] | null>(null);

/**
 * Sets the colors of every two-tone icon that has no `twoToneColor` of its own: one color (the second is derived)
 * or `[primary, secondary]`. Call it once at start-up: on the server the value is shared by every request.
 */
export function setTwoToneColor(color: TwoToneColor): void {
  globalPair = toPair(color);
}

/** The current global pair `[primary, secondary]`; before `setTwoToneColor` it is the theme tokens (`var(...)`). */
export function getTwoToneColor(): [string, string] {
  return globalPair ? [globalPair[0], globalPair[1]] : [DEFAULT_TWO_TONE[0], DEFAULT_TWO_TONE[1]];
}

/** The pair an icon draws: its own `twoToneColor`, else the global one, else the theme. */
export function resolveTwoTone(own?: TwoToneColor): [string, string] {
  if (own !== undefined) return toPair(own);
  return globalPair ?? [DEFAULT_TWO_TONE[0], DEFAULT_TWO_TONE[1]];
}
