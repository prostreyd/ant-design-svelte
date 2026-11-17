/**
 * Turns the props of `Row` and `Col` into CSS custom properties.
 *
 * The components do not look at the screen. They write the values they were given, one custom property per breakpoint,
 * and the static `@media (min-width: ...)` rules of the component pick the one that applies (the cascade is written in
 * CSS: a breakpoint with no value takes the one of the next smaller). So the server and the client render the same
 * markup, and nothing is measured or listened to in JavaScript.
 */
import { isProduction } from '../internal/env.js';
import { resolveOption } from '../internal/options.js';
import { BREAKPOINT_NAMES } from './constants.js';
import type { Breakpoint, ColSize, Gutter, GutterValue, Responsive, RowAlign, RowJustify } from './types.js';

/** Custom properties by name, as `styleText` takes them. */
export type CssVars = Record<string, string>;

export const ROW_ALIGNS = ['top', 'middle', 'bottom', 'stretch'] as const satisfies readonly RowAlign[];
export const ROW_JUSTIFIES = [
  'start',
  'end',
  'center',
  'space-around',
  'space-between',
  'space-evenly'
] as const satisfies readonly RowJustify[];

// `start` and `end` are written as `flex-start` and `flex-end`: the plain keywords came to flex containers later
// than the oldest browsers the library supports.
const ALIGN_CSS: Record<RowAlign, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch'
};
const JUSTIFY_CSS: Record<RowJustify, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  'space-around': 'space-around',
  'space-between': 'space-between',
  'space-evenly': 'space-evenly'
};

/** A value outside the contract throws while developing and is ignored in a production build. */
function outsideContract(message: string): undefined {
  if (!isProduction()) throw new RangeError(message);
  return undefined;
}

function isBreakpoint(key: string): key is Breakpoint {
  return (BREAKPOINT_NAMES as readonly string[]).includes(key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The given breakpoints of an object, in order. An unknown key is outside the contract (it is almost always a typo).
 * A key whose value is `undefined` counts as not given.
 */
function givenBreakpoints<T>(component: string, prop: string, value: Record<string, T | undefined>): [Breakpoint, T][] {
  const given: [Breakpoint, T][] = [];
  for (const key of Object.keys(value)) {
    if (!isBreakpoint(key)) {
      outsideContract(`${component} ${prop}: "${key}" is not a breakpoint; use ${BREAKPOINT_NAMES.join(', ')}.`);
      continue;
    }
    const entry = value[key];
    if (entry !== undefined) given.push([key, entry]);
  }
  return given;
}

/** A finite number, optionally not below `min` and optionally an integer; `undefined` (and a message) otherwise. */
export function checkNumber(
  component: string,
  prop: string,
  value: unknown,
  { min = Number.NEGATIVE_INFINITY, integer = false }: { min?: number; integer?: boolean } = {}
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= min && (!integer || Number.isInteger(value))) {
    return value;
  }
  const rule = [integer ? 'an integer' : 'a finite number', min > Number.NEGATIVE_INFINITY ? `not below ${min}` : '']
    .filter(Boolean)
    .join(' ');
  return outsideContract(`${component} ${prop} must be ${rule}.`);
}

const LENGTH = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[a-z]+|%)$/i;
const FUNCTION = /^(?:calc|min|max|clamp|var)\(.+\)$/i;

/**
 * A CSS length that is safe to put into the width formulas of the columns. A number is pixels. A string must be a
 * length (`2rem`, `5vw`, `10%`, `0`) or a `calc()`, `min()`, `max()`, `clamp()` or `var()` expression with balanced
 * parentheses; anything else (an unitless `'16'`, a word) is dropped, because one invalid value would make every column
 * of the Row lose its width. A dropped string is not an error: the gutter is `0`.
 */
export function gutterLength(component: string, value: unknown): string | undefined {
  if (typeof value === 'number') {
    const pixels = checkNumber(component, 'gutter', value, { min: 0 });
    return pixels === undefined ? undefined : `${pixels}px`;
  }
  if (typeof value !== 'string') return outsideContract(`${component} gutter must be a number or a CSS length string.`);
  const text = value.trim();
  if (text === '0') return '0px';
  if (LENGTH.test(text)) return text;
  if (FUNCTION.test(text) && balanced(text)) return text;
  return undefined;
}

function balanced(text: string): boolean {
  let depth = 0;
  for (const char of text) {
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/** One gutter as a length per breakpoint: a plain value is the base (`xs`), an object has its own keys. */
function gutterByBreakpoint(component: string, value: Gutter | undefined): [Breakpoint, string][] {
  if (value === undefined) return [];
  if (isRecord(value)) {
    const lengths: [Breakpoint, string][] = [];
    for (const [breakpoint, entry] of givenBreakpoints(component, 'gutter', value as Responsive<GutterValue>)) {
      const length = gutterLength(component, entry);
      if (length !== undefined) lengths.push([breakpoint, length]);
    }
    return lengths;
  }
  const length = gutterLength(component, value);
  return length === undefined ? [] : [['xs', length]];
}

/** A value of an enum prop as one per breakpoint, each checked and turned into its CSS keyword. */
function enumByBreakpoint<T extends string>(
  component: string,
  prop: string,
  value: T | Responsive<T> | undefined,
  allowed: readonly T[],
  fallback: T,
  css: Record<T, string>
): [Breakpoint, string][] {
  if (value === undefined) return [];
  if (isRecord(value)) {
    return givenBreakpoints(component, prop, value as Responsive<T>).map(([breakpoint, entry]) => [
      breakpoint,
      css[resolveOption(component, prop, entry, allowed, fallback)]
    ]);
  }
  return [['xs', css[resolveOption(component, prop, value, allowed, fallback)]]];
}

/** The custom properties of a Row: `--ads-row-{gx,gy,align,justify}-<breakpoint>` for each value given. */
export function rowVars(options: {
  align?: RowAlign | Responsive<RowAlign>;
  justify?: RowJustify | Responsive<RowJustify>;
  gutter?: Gutter | [Gutter, Gutter];
}): CssVars {
  const vars: CssVars = {};
  const write = (name: string, entries: [Breakpoint, string][]) => {
    for (const [breakpoint, value] of entries) vars[`--ads-row-${name}-${breakpoint}`] = value;
  };
  const [horizontal, vertical] = Array.isArray(options.gutter) ? options.gutter : [options.gutter, undefined];
  write('gx', gutterByBreakpoint('Row', horizontal));
  write('gy', gutterByBreakpoint('Row', vertical));
  write('align', enumByBreakpoint('Row', 'align', options.align, ROW_ALIGNS, 'top', ALIGN_CSS));
  write('justify', enumByBreakpoint('Row', 'justify', options.justify, ROW_JUSTIFIES, 'start', JUSTIFY_CSS));
  return vars;
}

const DIGITS = /^\d+$/;

/**
 * The CSS `flex` value of the `flex` prop. A number `n` is `n n auto`; a string of digits is `n 1 0px`; a single length
 * or percentage (`100px`, `30%`) is a fixed width, `0 0 <length>` (the public demos of Ant Design show this, although
 * their table says "applied as written"); any other string (`auto`, `none`, `1 1 200px`) is used as written.
 * `undefined` (and a message) for what is neither a number nor a string.
 */
export function flexValue(component: string, value: unknown): string | undefined {
  if (typeof value === 'number') {
    const grow = checkNumber(component, 'flex', value, { min: 0 });
    return grow === undefined ? undefined : `${grow} ${grow} auto`;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') return undefined;
    if (DIGITS.test(text)) return `${text} 1 0px`;
    if (LENGTH.test(text)) return `0 0 ${text}`;
    return text;
  }
  return outsideContract(`${component} flex must be a number or a string.`);
}

/** What a breakpoint prop (`xs`, ..., `xxxl`) is: a `span`, or an object of the same props as the plain ones. */
function sizeOf(component: string, prop: string, value: number | ColSize): ColSize | undefined {
  if (typeof value === 'number') return { span: value };
  if (isRecord(value)) return value as ColSize;
  return outsideContract(`${component} ${prop} must be a number or an object of Col props.`);
}

/** The numeric props of a column, with the least value each accepts. */
const NUMERIC: readonly { key: 'span' | 'offset' | 'push' | 'pull' | 'order'; name: string; min?: number; integer?: boolean }[] = [
  { key: 'span', name: 'span', min: 0 },
  { key: 'offset', name: 'offset', min: 0 },
  { key: 'push', name: 'push', min: 0 },
  { key: 'pull', name: 'pull', min: 0 },
  { key: 'order', name: 'order', integer: true }
];

/**
 * The custom properties of a Col: `--ads-col-{span,offset,push,pull,order,flex}-<breakpoint>` for each value given, plus
 * `--ads-col-d-<breakpoint>` (`none` for a span of `0`, `block` otherwise) and `--ads-col-mw-<breakpoint>` (`100%` where
 * a `flex` is given, so that the flex value is not capped by the width of a `span`).
 *
 * The plain props are the base, the same as `xs`; an `xs` value of the same name wins over the plain one.
 */
export function colVars(
  base: ColSize,
  sizes: Partial<Record<Breakpoint, number | ColSize | undefined>>
): CssVars {
  const vars: CssVars = {};
  const layers: [Breakpoint, ColSize][] = [];
  if (Object.values(base).some((value) => value !== undefined)) layers.push(['xs', base]);
  for (const [breakpoint, entry] of givenBreakpoints('Col', 'sizes', sizes as Record<string, number | ColSize | undefined>)) {
    const size = sizeOf('Col', breakpoint, entry);
    if (size) layers.push([breakpoint, size]);
  }

  // Two layers can address the same breakpoint (the plain props and `xs`): later keys win, each key on its own.
  const merged = new Map<Breakpoint, ColSize>();
  for (const [breakpoint, size] of layers) {
    const kept = merged.get(breakpoint) ?? {};
    for (const [key, value] of Object.entries(size) as [keyof ColSize, unknown][]) {
      if (value !== undefined) (kept as Record<string, unknown>)[key] = value;
    }
    merged.set(breakpoint, kept);
  }

  for (const [breakpoint, size] of merged) {
    for (const { key, name, min, integer } of NUMERIC) {
      if (size[key] === undefined) continue;
      const value = checkNumber('Col', name, size[key], { min, integer });
      if (value === undefined) continue;
      vars[`--ads-col-${name}-${breakpoint}`] = String(value);
      if (key === 'span') vars[`--ads-col-d-${breakpoint}`] = value === 0 ? 'none' : 'block';
    }
    if (size.flex !== undefined) {
      const flex = flexValue('Col', size.flex);
      if (flex !== undefined) {
        vars[`--ads-col-flex-${breakpoint}`] = flex;
        vars[`--ads-col-mw-${breakpoint}`] = '100%';
      }
    }
  }
  return vars;
}
