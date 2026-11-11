/**
 * Logic that `Input` and `InputTextArea` share, kept free of Svelte so it is easy to test:
 * the options, the character count and the caret placement of `focus()`.
 */
import { isProduction } from '../internal/env.js';
import type { CountConfig, CountInfo, InputFocusOptions, InputSize, InputStatus } from './types.js';

export const INPUT_SIZES = ['large', 'medium', 'middle', 'small', 'default'] as const;
export const INPUT_VARIANTS = ['outlined', 'filled', 'borderless', 'underlined'] as const;

/** `middle` and `default` are aliases of `medium`. */
export function normalizeSize(size: InputSize): 'large' | 'medium' | 'small' {
  return size === 'large' || size === 'small' ? size : 'medium';
}

/**
 * The validated status. Anything but `error`, `warning` or nothing throws while developing, and
 * means "no status" in a production build, so a bad value cannot paint the field as invalid.
 */
export function resolveStatus(component: string, status: unknown): InputStatus | undefined {
  if (status === undefined || status === null) return undefined;
  if (status === 'error' || status === 'warning') return status;
  if (!isProduction()) throw new RangeError(`${component} status must be one of: error, warning.`);
  return undefined;
}

/** What the character counter does, worked out from `showCount`, `count` and `maxlength`. */
export interface ResolvedCount {
  /** Whether the counter is shown. */
  show: boolean;
  /** The limit shown next to the count: `count.max`, else `maxlength`. */
  max: number | undefined;
  /** The soft limit (`count.max`); past it the field is marked invalid. */
  softMax: number | undefined;
  strategy: ((value: string) => number) | undefined;
  exceedFormatter: CountConfig['exceedFormatter'];
  formatter: ((info: CountInfo) => string) | undefined;
}

export function resolveCount(
  showCount: boolean | { formatter: (info: CountInfo) => string } | undefined,
  count: CountConfig | undefined,
  maxlength: number | string | null | undefined
): ResolvedCount {
  const native = maxlength === undefined || maxlength === null || maxlength === '' ? undefined : Number(maxlength);
  // `count.show` wins over `showCount`; a function (either one) formats the text.
  const shown = count?.show !== undefined ? count.show : showCount;
  return {
    show: Boolean(shown),
    max: count?.max ?? native,
    softMax: count?.max,
    strategy: count?.strategy,
    exceedFormatter: count?.exceedFormatter,
    formatter: typeof shown === 'function' ? shown : typeof shown === 'object' && shown ? shown.formatter : undefined
  };
}

/** The count of a text: code points (an emoji outside the BMP counts 1), or what `strategy` returns. */
export function countOf(counting: ResolvedCount, value: string): number {
  return counting.strategy ? counting.strategy(value) : [...value].length;
}

/** Whether the text is past the soft limit. */
export function isOverLimit(counting: ResolvedCount, value: string): boolean {
  return counting.softMax !== undefined && countOf(counting, value) > counting.softMax;
}

/** The text of the counter: `n`, or `n / max`, or what the formatter returns. */
export function countText(counting: ResolvedCount, value: string): string {
  const count = countOf(counting, value);
  if (counting.formatter) return counting.formatter({ value, count, maxLength: counting.max });
  return counting.max === undefined ? `${count}` : `${count} / ${counting.max}`;
}

/** The text cut by `count.exceedFormatter` when it is past the soft limit; otherwise the text itself. */
export function clipText(counting: ResolvedCount, value: string): string {
  if (!counting.exceedFormatter || counting.softMax === undefined) return value;
  if (countOf(counting, value) <= counting.softMax) return value;
  return counting.exceedFormatter(value, { max: counting.softMax });
}

/** `focus()` of a text field with the caret placement of `options.cursor`. */
export function focusField(
  element: HTMLInputElement | HTMLTextAreaElement | undefined,
  options?: InputFocusOptions
): void {
  if (!element) return;
  element.focus({ preventScroll: options?.preventScroll });
  try {
    if (options?.cursor === 'all') element.select();
    else if (options?.cursor === 'start') element.setSelectionRange(0, 0);
    else if (options?.cursor === 'end') element.setSelectionRange(element.value.length, element.value.length);
  } catch {
    // Some input types (`email`, `number`) have no selection: the caret stays where the browser put it.
  }
}
