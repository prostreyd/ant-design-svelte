<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { classList, styleText } from '../internal/semantic.js';
  import { colVars } from './layout.js';
  import type { ColSize } from './types.js';

  type ColProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'> & {
    /** How many of the 24 columns to take. `0` hides the column. Unset: the column keeps its content width. */
    span?: number;
    /** Empty columns before this one. */
    offset?: number;
    /** Columns to shift it towards the inline end, visually only (the DOM order does not change). */
    push?: number;
    /** Columns to shift it towards the inline start, visually only (the DOM order does not change). */
    pull?: number;
    /** The flex `order`, visually only (the DOM order does not change). */
    order?: number;
    /** A raw flex value: a number `n` is `n n auto`; a string is used as written (digits only: `n 1 0px`). */
    flex?: string | number;
    /** From 0 px up (the base of all widths). A number is a `span`. */
    xs?: number | ColSize;
    /** From 576 px up. A number is a `span`. */
    sm?: number | ColSize;
    /** From 768 px up. A number is a `span`. */
    md?: number | ColSize;
    /** From 992 px up. A number is a `span`. */
    lg?: number | ColSize;
    /** From 1200 px up. A number is a `span`. */
    xl?: number | ColSize;
    /** From 1600 px up. A number is a `span`. */
    xxl?: number | ColSize;
    /** From 1920 px up. A number is a `span`. */
    xxxl?: number | ColSize;
    /** Additional CSS class appended to the component classes. */
    class?: string;
    /** Inline style of the root; it is written after the component's own, so it wins on the same property. */
    style?: string;
    /** The content of the column. */
    children?: Snippet;
  };

  let {
    span,
    offset,
    push,
    pull,
    order,
    flex,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    xxxl,
    class: customClass,
    style,
    children,
    ...rest
  }: ColProps = $props();

  // Each given value is checked here (outside its contract it throws in development and is ignored in production)
  // and written as a custom property; the `@media` rules below pick the one that fits the screen.
  const vars = $derived(
    colVars({ span, offset, push, pull, order, flex }, { xs, sm, md, lg, xl, xxl, xxxl })
  );
  const classes = $derived(classList('ads-col', customClass));
  const inlineStyle = $derived(styleText(vars, style));
</script>

<div {...rest} class={classes} style={inlineStyle}>
  {@render children?.()}
</div>

<style>
  /*
   * The component writes the values it was given as `--ads-col-<name>-<breakpoint>` (see layout.ts). A value that was
   * not given stays "invalid" in the chains below, and a declaration that uses an invalid variable is dropped when the
   * style is computed, so a column without `span` keeps its content width (`flex: 0 1 auto`). The `@media` rules at
   * the end switch the resolved variables. The gutter `--_row-gx` comes from the Row the column stands in.
   *
   * Custom properties inherit, so the public ones are reset here: a Col inside a Col must not take the span of the outer
   * one. An inline value, which the component writes, wins over this reset.
   */
  .ads-col {
    --ads-col-span-xs: initial;
    --ads-col-span-sm: initial;
    --ads-col-span-md: initial;
    --ads-col-span-lg: initial;
    --ads-col-span-xl: initial;
    --ads-col-span-xxl: initial;
    --ads-col-span-xxxl: initial;
    --ads-col-offset-xs: initial;
    --ads-col-offset-sm: initial;
    --ads-col-offset-md: initial;
    --ads-col-offset-lg: initial;
    --ads-col-offset-xl: initial;
    --ads-col-offset-xxl: initial;
    --ads-col-offset-xxxl: initial;
    --ads-col-push-xs: initial;
    --ads-col-push-sm: initial;
    --ads-col-push-md: initial;
    --ads-col-push-lg: initial;
    --ads-col-push-xl: initial;
    --ads-col-push-xxl: initial;
    --ads-col-push-xxxl: initial;
    --ads-col-pull-xs: initial;
    --ads-col-pull-sm: initial;
    --ads-col-pull-md: initial;
    --ads-col-pull-lg: initial;
    --ads-col-pull-xl: initial;
    --ads-col-pull-xxl: initial;
    --ads-col-pull-xxxl: initial;
    --ads-col-order-xs: initial;
    --ads-col-order-sm: initial;
    --ads-col-order-md: initial;
    --ads-col-order-lg: initial;
    --ads-col-order-xl: initial;
    --ads-col-order-xxl: initial;
    --ads-col-order-xxxl: initial;
    --ads-col-flex-xs: initial;
    --ads-col-flex-sm: initial;
    --ads-col-flex-md: initial;
    --ads-col-flex-lg: initial;
    --ads-col-flex-xl: initial;
    --ads-col-flex-xxl: initial;
    --ads-col-flex-xxxl: initial;
    --ads-col-mw-xs: initial;
    --ads-col-mw-sm: initial;
    --ads-col-mw-md: initial;
    --ads-col-mw-lg: initial;
    --ads-col-mw-xl: initial;
    --ads-col-mw-xxl: initial;
    --ads-col-mw-xxxl: initial;
    --ads-col-d-xs: initial;
    --ads-col-d-sm: initial;
    --ads-col-d-md: initial;
    --ads-col-d-lg: initial;
    --ads-col-d-xl: initial;
    --ads-col-d-xxl: initial;
    --ads-col-d-xxxl: initial;

    --_span-xs: var(--ads-col-span-xs);
    --_span-sm: var(--ads-col-span-sm, var(--_span-xs));
    --_span-md: var(--ads-col-span-md, var(--_span-sm));
    --_span-lg: var(--ads-col-span-lg, var(--_span-md));
    --_span-xl: var(--ads-col-span-xl, var(--_span-lg));
    --_span-xxl: var(--ads-col-span-xxl, var(--_span-xl));
    --_span-xxxl: var(--ads-col-span-xxxl, var(--_span-xxl));
    --_off-xs: var(--ads-col-offset-xs, 0);
    --_off-sm: var(--ads-col-offset-sm, var(--_off-xs));
    --_off-md: var(--ads-col-offset-md, var(--_off-sm));
    --_off-lg: var(--ads-col-offset-lg, var(--_off-md));
    --_off-xl: var(--ads-col-offset-xl, var(--_off-lg));
    --_off-xxl: var(--ads-col-offset-xxl, var(--_off-xl));
    --_off-xxxl: var(--ads-col-offset-xxxl, var(--_off-xxl));
    --_push-xs: var(--ads-col-push-xs, 0);
    --_push-sm: var(--ads-col-push-sm, var(--_push-xs));
    --_push-md: var(--ads-col-push-md, var(--_push-sm));
    --_push-lg: var(--ads-col-push-lg, var(--_push-md));
    --_push-xl: var(--ads-col-push-xl, var(--_push-lg));
    --_push-xxl: var(--ads-col-push-xxl, var(--_push-xl));
    --_push-xxxl: var(--ads-col-push-xxxl, var(--_push-xxl));
    --_pull-xs: var(--ads-col-pull-xs, 0);
    --_pull-sm: var(--ads-col-pull-sm, var(--_pull-xs));
    --_pull-md: var(--ads-col-pull-md, var(--_pull-sm));
    --_pull-lg: var(--ads-col-pull-lg, var(--_pull-md));
    --_pull-xl: var(--ads-col-pull-xl, var(--_pull-lg));
    --_pull-xxl: var(--ads-col-pull-xxl, var(--_pull-xl));
    --_pull-xxxl: var(--ads-col-pull-xxxl, var(--_pull-xxl));
    --_order-xs: var(--ads-col-order-xs, 0);
    --_order-sm: var(--ads-col-order-sm, var(--_order-xs));
    --_order-md: var(--ads-col-order-md, var(--_order-sm));
    --_order-lg: var(--ads-col-order-lg, var(--_order-md));
    --_order-xl: var(--ads-col-order-xl, var(--_order-lg));
    --_order-xxl: var(--ads-col-order-xxl, var(--_order-xl));
    --_order-xxxl: var(--ads-col-order-xxxl, var(--_order-xxl));
    --_flex-xs: var(--ads-col-flex-xs);
    --_flex-sm: var(--ads-col-flex-sm, var(--_flex-xs));
    --_flex-md: var(--ads-col-flex-md, var(--_flex-sm));
    --_flex-lg: var(--ads-col-flex-lg, var(--_flex-md));
    --_flex-xl: var(--ads-col-flex-xl, var(--_flex-lg));
    --_flex-xxl: var(--ads-col-flex-xxl, var(--_flex-xl));
    --_flex-xxxl: var(--ads-col-flex-xxxl, var(--_flex-xxl));
    --_mw-xs: var(--ads-col-mw-xs);
    --_mw-sm: var(--ads-col-mw-sm, var(--_mw-xs));
    --_mw-md: var(--ads-col-mw-md, var(--_mw-sm));
    --_mw-lg: var(--ads-col-mw-lg, var(--_mw-md));
    --_mw-xl: var(--ads-col-mw-xl, var(--_mw-lg));
    --_mw-xxl: var(--ads-col-mw-xxl, var(--_mw-xl));
    --_mw-xxxl: var(--ads-col-mw-xxxl, var(--_mw-xxl));
    --_d-xs: var(--ads-col-d-xs, block);
    --_d-sm: var(--ads-col-d-sm, var(--_d-xs));
    --_d-md: var(--ads-col-d-md, var(--_d-sm));
    --_d-lg: var(--ads-col-d-lg, var(--_d-md));
    --_d-xl: var(--ads-col-d-xl, var(--_d-lg));
    --_d-xxl: var(--ads-col-d-xxl, var(--_d-xl));
    --_d-xxxl: var(--ads-col-d-xxxl, var(--_d-xxl));

    --_span: var(--_span-xs);
    --_off: var(--_off-xs);
    --_push: var(--_push-xs);
    --_pull: var(--_pull-xs);
    --_order: var(--_order-xs);
    --_flex: var(--_flex-xs);
    --_mw: var(--_mw-xs);
    --_d: var(--_d-xs);

    --_gx: var(--_row-gx, 0px);
    /* The width of `span` columns: the span's share of the 24 columns, counting the gaps between them. */
    --_w: calc((100% + var(--_gx)) * var(--_span) / 24 - var(--_gx));

    position: relative;
    display: var(--_d);
    flex: var(--_flex, 0 0 var(--_w));
    max-width: var(--_mw, var(--_w, 100%));
    order: var(--_order);
    margin-inline-start: calc((100% + var(--_gx)) * var(--_off) / 24);
    inset-inline-start: calc((100% + var(--_gx)) * (var(--_push) - var(--_pull)) / 24);
  }

  @media (min-width: 576px) {
    .ads-col {
      --_span: var(--_span-sm);
      --_off: var(--_off-sm);
      --_push: var(--_push-sm);
      --_pull: var(--_pull-sm);
      --_order: var(--_order-sm);
      --_flex: var(--_flex-sm);
      --_mw: var(--_mw-sm);
      --_d: var(--_d-sm);
    }
  }

  @media (min-width: 768px) {
    .ads-col {
      --_span: var(--_span-md);
      --_off: var(--_off-md);
      --_push: var(--_push-md);
      --_pull: var(--_pull-md);
      --_order: var(--_order-md);
      --_flex: var(--_flex-md);
      --_mw: var(--_mw-md);
      --_d: var(--_d-md);
    }
  }

  @media (min-width: 992px) {
    .ads-col {
      --_span: var(--_span-lg);
      --_off: var(--_off-lg);
      --_push: var(--_push-lg);
      --_pull: var(--_pull-lg);
      --_order: var(--_order-lg);
      --_flex: var(--_flex-lg);
      --_mw: var(--_mw-lg);
      --_d: var(--_d-lg);
    }
  }

  @media (min-width: 1200px) {
    .ads-col {
      --_span: var(--_span-xl);
      --_off: var(--_off-xl);
      --_push: var(--_push-xl);
      --_pull: var(--_pull-xl);
      --_order: var(--_order-xl);
      --_flex: var(--_flex-xl);
      --_mw: var(--_mw-xl);
      --_d: var(--_d-xl);
    }
  }

  @media (min-width: 1600px) {
    .ads-col {
      --_span: var(--_span-xxl);
      --_off: var(--_off-xxl);
      --_push: var(--_push-xxl);
      --_pull: var(--_pull-xxl);
      --_order: var(--_order-xxl);
      --_flex: var(--_flex-xxl);
      --_mw: var(--_mw-xxl);
      --_d: var(--_d-xxl);
    }
  }

  @media (min-width: 1920px) {
    .ads-col {
      --_span: var(--_span-xxxl);
      --_off: var(--_off-xxxl);
      --_push: var(--_push-xxxl);
      --_pull: var(--_pull-xxxl);
      --_order: var(--_order-xxxl);
      --_flex: var(--_flex-xxxl);
      --_mw: var(--_mw-xxxl);
      --_d: var(--_d-xxxl);
    }
  }
</style>
