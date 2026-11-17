import type { Breakpoint } from './types.js';

/** The breakpoints, from the smallest. */
export const BREAKPOINT_NAMES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const satisfies readonly Breakpoint[];

/**
 * The minimum screen width of each breakpoint, in pixels (the Bootstrap 4 widths that Ant Design uses).
 * The `@media (min-width: ...)` rules of `Row.svelte` and `Col.svelte` use the same numbers; a test compares them.
 */
export const BREAKPOINTS: Readonly<Record<Breakpoint, number>> = Object.freeze({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
  xxxl: 1920
});
