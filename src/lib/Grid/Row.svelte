<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { classList, styleText } from '../internal/semantic.js';
  import { rowVars } from './layout.js';
  import type { Gutter, Responsive, RowAlign, RowJustify } from './types.js';

  type RowProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'> & {
    /** Vertical alignment of the columns of a line, or one value per breakpoint. Default `'top'`. */
    align?: RowAlign | Responsive<RowAlign>;
    /** Horizontal arrangement of the columns of a line, or one value per breakpoint. Default `'start'`. */
    justify?: RowJustify | Responsive<RowJustify>;
    /**
     * Space between the columns: pixels, a CSS length string, or one of them per breakpoint. A pair is
     * `[horizontal, vertical]`. Default `0`.
     */
    gutter?: Gutter | [Gutter, Gutter];
    /** Whether columns that do not fit move to the next line (`false`: they stay on one line and shrink). */
    wrap?: boolean;
    /** Additional CSS class appended to the component classes. */
    class?: string;
    /** Inline style of the root; it is written after the component's own, so it wins on the same property. */
    style?: string;
    /** The columns (`Col`). */
    children?: Snippet;
  };

  // `align` (`top`), `justify` (`start`) and `gutter` (`0`) have no default here: a value that is not given is not written,
  // and the stylesheet supplies the default, so a plain Row carries no inline style.
  let {
    align,
    justify,
    gutter,
    wrap = true,
    class: customClass,
    style,
    children,
    ...rest
  }: RowProps = $props();

  // Each given value is checked here (outside its contract it throws in development and is ignored in production)
  // and written as a custom property; the `@media` rules below pick the one that fits the screen.
  const vars = $derived(rowVars({ align, justify, gutter }));
  const classes = $derived(classList('ads-row', !wrap && 'ads-row-nowrap', customClass));
  const inlineStyle = $derived(styleText(vars, style));
</script>

<div {...rest} class={classes} style={inlineStyle}>
  {@render children?.()}
</div>

<style>
  /*
   * The component writes the values it was given as `--ads-row-<name>-<breakpoint>` (see layout.ts). The chains below
   * give every breakpoint the value of the next smaller one when it has none of its own, and the `@media` rules at
   * the end switch the resolved variables (`--_row-gx` is read by the columns). Nothing is measured in JavaScript.
   *
   * Custom properties inherit, so the public ones are reset here: a Row inside a Row (or a Col) must not take the
   * gutter of the outer one. An inline value, which the component writes, wins over this reset.
   */
  .ads-row {
    --ads-row-gx-xs: initial;
    --ads-row-gx-sm: initial;
    --ads-row-gx-md: initial;
    --ads-row-gx-lg: initial;
    --ads-row-gx-xl: initial;
    --ads-row-gx-xxl: initial;
    --ads-row-gx-xxxl: initial;
    --ads-row-gy-xs: initial;
    --ads-row-gy-sm: initial;
    --ads-row-gy-md: initial;
    --ads-row-gy-lg: initial;
    --ads-row-gy-xl: initial;
    --ads-row-gy-xxl: initial;
    --ads-row-gy-xxxl: initial;
    --ads-row-align-xs: initial;
    --ads-row-align-sm: initial;
    --ads-row-align-md: initial;
    --ads-row-align-lg: initial;
    --ads-row-align-xl: initial;
    --ads-row-align-xxl: initial;
    --ads-row-align-xxxl: initial;
    --ads-row-justify-xs: initial;
    --ads-row-justify-sm: initial;
    --ads-row-justify-md: initial;
    --ads-row-justify-lg: initial;
    --ads-row-justify-xl: initial;
    --ads-row-justify-xxl: initial;
    --ads-row-justify-xxxl: initial;

    --_gx-xs: var(--ads-row-gx-xs, 0px);
    --_gx-sm: var(--ads-row-gx-sm, var(--_gx-xs));
    --_gx-md: var(--ads-row-gx-md, var(--_gx-sm));
    --_gx-lg: var(--ads-row-gx-lg, var(--_gx-md));
    --_gx-xl: var(--ads-row-gx-xl, var(--_gx-lg));
    --_gx-xxl: var(--ads-row-gx-xxl, var(--_gx-xl));
    --_gx-xxxl: var(--ads-row-gx-xxxl, var(--_gx-xxl));
    --_gy-xs: var(--ads-row-gy-xs, 0px);
    --_gy-sm: var(--ads-row-gy-sm, var(--_gy-xs));
    --_gy-md: var(--ads-row-gy-md, var(--_gy-sm));
    --_gy-lg: var(--ads-row-gy-lg, var(--_gy-md));
    --_gy-xl: var(--ads-row-gy-xl, var(--_gy-lg));
    --_gy-xxl: var(--ads-row-gy-xxl, var(--_gy-xl));
    --_gy-xxxl: var(--ads-row-gy-xxxl, var(--_gy-xxl));
    --_al-xs: var(--ads-row-align-xs, flex-start);
    --_al-sm: var(--ads-row-align-sm, var(--_al-xs));
    --_al-md: var(--ads-row-align-md, var(--_al-sm));
    --_al-lg: var(--ads-row-align-lg, var(--_al-md));
    --_al-xl: var(--ads-row-align-xl, var(--_al-lg));
    --_al-xxl: var(--ads-row-align-xxl, var(--_al-xl));
    --_al-xxxl: var(--ads-row-align-xxxl, var(--_al-xxl));
    --_ju-xs: var(--ads-row-justify-xs, flex-start);
    --_ju-sm: var(--ads-row-justify-sm, var(--_ju-xs));
    --_ju-md: var(--ads-row-justify-md, var(--_ju-sm));
    --_ju-lg: var(--ads-row-justify-lg, var(--_ju-md));
    --_ju-xl: var(--ads-row-justify-xl, var(--_ju-lg));
    --_ju-xxl: var(--ads-row-justify-xxl, var(--_ju-xl));
    --_ju-xxxl: var(--ads-row-justify-xxxl, var(--_ju-xxl));

    --_row-gx: var(--_gx-xs);
    --_gy: var(--_gy-xs);
    --_al: var(--_al-xs);
    --_ju: var(--_ju-xs);

    display: flex;
    flex-flow: row wrap;
    column-gap: var(--_row-gx);
    row-gap: var(--_gy);
    align-items: var(--_al);
    justify-content: var(--_ju);
    min-width: 0;
  }

  .ads-row-nowrap {
    flex-wrap: nowrap;
  }

  @media (min-width: 576px) {
    .ads-row {
      --_row-gx: var(--_gx-sm);
      --_gy: var(--_gy-sm);
      --_al: var(--_al-sm);
      --_ju: var(--_ju-sm);
    }
  }

  @media (min-width: 768px) {
    .ads-row {
      --_row-gx: var(--_gx-md);
      --_gy: var(--_gy-md);
      --_al: var(--_al-md);
      --_ju: var(--_ju-md);
    }
  }

  @media (min-width: 992px) {
    .ads-row {
      --_row-gx: var(--_gx-lg);
      --_gy: var(--_gy-lg);
      --_al: var(--_al-lg);
      --_ju: var(--_ju-lg);
    }
  }

  @media (min-width: 1200px) {
    .ads-row {
      --_row-gx: var(--_gx-xl);
      --_gy: var(--_gy-xl);
      --_al: var(--_al-xl);
      --_ju: var(--_ju-xl);
    }
  }

  @media (min-width: 1600px) {
    .ads-row {
      --_row-gx: var(--_gx-xxl);
      --_gy: var(--_gy-xxl);
      --_al: var(--_al-xxl);
      --_ju: var(--_ju-xxl);
    }
  }

  @media (min-width: 1920px) {
    .ads-row {
      --_row-gx: var(--_gx-xxxl);
      --_gy: var(--_gy-xxxl);
      --_al: var(--_al-xxxl);
      --_ju: var(--_ju-xxxl);
    }
  }
</style>
