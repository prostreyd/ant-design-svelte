import { createSubscriber } from 'svelte/reactivity';
import { resolveOption } from '../internal/options.js';
import { BREAKPOINT_NAMES, BREAKPOINTS } from './constants.js';
import type { Breakpoint } from './types.js';

/**
 * The media query of each breakpoint. `xs` is the complement of `sm` (below 576 px), the others are "from their
 * minimum width up", so at any width `xs` is true or `sm` is, never both and never neither, even at 575.5 px.
 */
const QUERIES: Readonly<Record<Breakpoint, string>> = Object.freeze({
  xs: `not all and (min-width: ${BREAKPOINTS.sm}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  xxl: `(min-width: ${BREAKPOINTS.xxl}px)`,
  xxxl: `(min-width: ${BREAKPOINTS.xxxl}px)`
});

export type BreakpointsOptions = {
  /**
   * The breakpoint to report where the screen cannot be asked (on the server). The flags are those of a screen exactly
   * as wide as this breakpoint starts. Default `'xs'`.
   */
  fallback?: Breakpoint;
};

/** Whether a screen exactly `width` px wide matches the breakpoint. */
function matchesWidth(breakpoint: Breakpoint, width: number): boolean {
  return breakpoint === 'xs' ? width < BREAKPOINTS.sm : width >= BREAKPOINTS[breakpoint];
}

/**
 * Which breakpoints the screen matches now, as plain properties that a template or a `$derived` can read:
 *
 * ```svelte
 * <script>
 *   const screens = new Breakpoints();
 * </script>
 * {#if screens.md}...{/if}
 * ```
 *
 * `xs` is true below 576 px; every other flag is true from its minimum width up (so at 1000 px `sm`, `md` and `lg` are
 * true), and `current` is the largest one that matches. The values are read from the screen when the object is created,
 * so they are right on the first render in a browser. On the server they follow `options.fallback`. The listeners exist
 * only while something reactive reads the values.
 */
export class Breakpoints {
  readonly #fallback: Breakpoint;
  readonly #lists: Record<Breakpoint, MediaQueryList> | undefined;
  readonly #subscribe: () => void;

  constructor(options: BreakpointsOptions = {}) {
    this.#fallback = resolveOption('Breakpoints', 'fallback', options.fallback ?? 'xs', BREAKPOINT_NAMES, 'xs');
    this.#lists =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? (Object.fromEntries(BREAKPOINT_NAMES.map((name) => [name, window.matchMedia(QUERIES[name])])) as Record<
            Breakpoint,
            MediaQueryList
          >)
        : undefined;
    this.#subscribe = createSubscriber((update) => {
      const lists = this.#lists;
      if (!lists) return;
      for (const name of BREAKPOINT_NAMES) lists[name].addEventListener('change', update);
      return () => {
        for (const name of BREAKPOINT_NAMES) lists[name].removeEventListener('change', update);
      };
    });
  }

  #matches(breakpoint: Breakpoint): boolean {
    this.#subscribe();
    const list = this.#lists?.[breakpoint];
    return list ? list.matches : matchesWidth(breakpoint, BREAKPOINTS[this.#fallback]);
  }

  /** Below 576 px. */
  get xs(): boolean {
    return this.#matches('xs');
  }
  /** From 576 px up. */
  get sm(): boolean {
    return this.#matches('sm');
  }
  /** From 768 px up. */
  get md(): boolean {
    return this.#matches('md');
  }
  /** From 992 px up. */
  get lg(): boolean {
    return this.#matches('lg');
  }
  /** From 1200 px up. */
  get xl(): boolean {
    return this.#matches('xl');
  }
  /** From 1600 px up. */
  get xxl(): boolean {
    return this.#matches('xxl');
  }
  /** From 1920 px up. */
  get xxxl(): boolean {
    return this.#matches('xxxl');
  }

  /** The largest breakpoint that matches (`'xs'` below 576 px). */
  get current(): Breakpoint {
    let current: Breakpoint = 'xs';
    for (const name of BREAKPOINT_NAMES) if (name !== 'xs' && this.#matches(name)) current = name;
    return current;
  }
}
