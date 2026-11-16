/** The values of the enum-like props of the radio components, and the rules that go with them. */
import type { RadioSize } from './types.js';

export const RADIO_SIZES = ['large', 'medium', 'middle', 'small', 'default'] as const;
export const RADIO_BUTTON_STYLES = ['outline', 'solid'] as const;
export const RADIO_OPTION_TYPES = ['default', 'button'] as const;
export const RADIO_ORIENTATIONS = ['horizontal', 'vertical'] as const;

/** `middle` and `default` are aliases of `medium`. */
export function normalizeSize(size: RadioSize): 'large' | 'medium' | 'small' {
  return size === 'large' || size === 'small' ? size : 'medium';
}

/** Whether a value stands for "nothing selected": `null` and `undefined`, and only those (`false` and `0` are values). */
export function isNone(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}
