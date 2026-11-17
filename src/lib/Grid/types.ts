/** The screen-width steps of the grid, from the smallest. */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

/** A value per breakpoint. A value at a breakpoint applies from that width up (until the next given one). */
export type Responsive<T> = Partial<Record<Breakpoint, T>>;

/** Vertical alignment of the columns of a line. */
export type RowAlign = 'top' | 'middle' | 'bottom' | 'stretch';

/** Horizontal arrangement of the columns of a line. */
export type RowJustify = 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';

/** One gutter: pixels (a number) or a CSS length (a string such as `'2rem'`). */
export type GutterValue = number | string;

/** A gutter, fixed or per breakpoint. */
export type Gutter = GutterValue | Responsive<GutterValue>;

/** What a column can take at one breakpoint. */
export type ColSize = {
  /** Columns of the 24 to take; `0` hides the column. */
  span?: number;
  /** Empty columns before this one. */
  offset?: number;
  /** Columns to shift it towards the inline end, visually only. */
  push?: number;
  /** Columns to shift it towards the inline start, visually only. */
  pull?: number;
  /** The flex `order`. */
  order?: number;
  /** A raw flex value: a number `n` is `n n auto`, a string is used as written. */
  flex?: string | number;
};
