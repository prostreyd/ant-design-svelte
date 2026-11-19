import type { ColSize } from '../Grid/types.js';
import type { FormColProps, FormLayout } from './types.js';

/** The props of the two columns of an item. */
export interface ItemColumns {
  label: FormColProps;
  control: FormColProps;
}

const BASE_KEYS = ['span', 'offset', 'push', 'pull', 'order', 'flex'] as const;

/** A column size given as a number is a span. */
function sizeOf(size: number | ColSize | undefined): ColSize {
  if (size === undefined) return {};
  return typeof size === 'number' ? { span: size } : size;
}

function baseOf(col: FormColProps | undefined): ColSize {
  const base: ColSize = {};
  for (const key of BASE_KEYS) {
    const value = col?.[key];
    if (value !== undefined) (base as Record<string, unknown>)[key] = value;
  }
  return base;
}

/** The props of a column without its base keys and without `xs` / `sm`, which the callers rebuild. */
function withoutBase(col: FormColProps | undefined): FormColProps {
  const rebuilt: readonly string[] = [...BASE_KEYS, 'xs', 'sm'];
  return Object.fromEntries(Object.entries(col ?? {}).filter(([key]) => !rebuilt.includes(key))) as FormColProps;
}

/** A column with neither a span nor a flex takes what the other column leaves (the control) or its content (the label). */
function withDefaultFlex(base: ColSize, role: 'label' | 'control'): ColSize {
  if (base.span !== undefined || base.flex !== undefined) return base;
  return { ...base, flex: role === 'control' ? '1 1 0%' : '0 1 auto' };
}

/**
 * Horizontal layout below 576 px: the label sits above the control, each takes the whole row (the behavior of Ant
 * Design, measured on its demo). The `xs` step is the full row; the `sm` step goes back to what was asked for, with
 * the user's own `sm` laid over it. A user who gives an `xs` value to either column takes this over, as in Ant Design.
 */
function stacked(col: FormColProps | undefined, role: 'label' | 'control'): FormColProps {
  const base = withDefaultFlex(baseOf(col), role);
  const xs: ColSize = { offset: 0, push: 0, pull: 0 };
  if (base.span !== undefined) xs.span = 24;
  if (base.flex !== undefined) xs.flex = '0 0 100%';
  if (base.order !== undefined) xs.order = base.order;
  const sm: ColSize = { ...base, offset: base.offset ?? 0, push: base.push ?? 0, pull: base.pull ?? 0, ...sizeOf(col?.sm) };
  return { ...withoutBase(col), xs, sm };
}

function plain(col: FormColProps | undefined, role: 'label' | 'control'): FormColProps {
  if (!col) return withDefaultFlex({}, role);
  const base = baseOf(col);
  const given = (size: ColSize) => size.span !== undefined || size.flex !== undefined;
  if (given(base) || given(sizeOf(col.xs))) return { ...col };
  return { ...col, ...withDefaultFlex(base, role) };
}

/**
 * The props of the label column and the control column of an item. Horizontal: `labelCol` and `wrapperCol`, stacked on a
 * narrow screen. Vertical: the columns do not share a line, so only the `offset` of each is kept. Inline: each column
 * is as wide as its content.
 */
export function itemColumns(
  layout: FormLayout,
  labelCol: FormColProps | undefined,
  wrapperCol: FormColProps | undefined
): ItemColumns {
  if (layout === 'inline') return { label: { flex: 'none' }, control: { flex: 'none' } };
  if (layout === 'vertical') {
    return {
      label: { flex: '0 0 auto', offset: baseOf(labelCol).offset ?? 0 },
      control: { flex: '0 0 auto', offset: baseOf(wrapperCol).offset ?? 0 }
    };
  }
  const narrow = labelCol?.xs === undefined && wrapperCol?.xs === undefined;
  return narrow
    ? { label: stacked(labelCol, 'label'), control: stacked(wrapperCol, 'control') }
    : { label: plain(labelCol, 'label'), control: plain(wrapperCol, 'control') };
}
