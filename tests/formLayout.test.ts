import { describe, expect, it } from 'vitest';
import { itemColumns } from '../src/lib/Form/layout.js';

describe('ITEM-1: the columns of an item', () => {
  it('horizontal with no labelCol and no wrapperCol: the label takes its content, the control the room that is left, and they stack below 576 px', () => {
    const { label, control } = itemColumns('horizontal', undefined, undefined);
    expect(label.xs).toEqual({ offset: 0, push: 0, pull: 0, flex: '0 0 100%' });
    expect(label.sm).toEqual({ flex: '0 1 auto', offset: 0, push: 0, pull: 0 });
    expect(control.xs).toEqual({ offset: 0, push: 0, pull: 0, flex: '0 0 100%' });
    expect(control.sm).toEqual({ flex: '1 1 0%', offset: 0, push: 0, pull: 0 });
  });

  it('a span is stacked to the whole row below 576 px and restored from there', () => {
    const { label } = itemColumns('horizontal', { span: 6, offset: 2, order: 3 }, undefined);
    expect(label.xs).toEqual({ span: 24, offset: 0, push: 0, pull: 0, order: 3 });
    expect(label.sm).toEqual({ span: 6, offset: 2, order: 3, push: 0, pull: 0 });
  });

  it('a number for sm is a span, and the keys of md and up are kept', () => {
    const { label } = itemColumns('horizontal', { span: 4, sm: 8, md: 6 }, undefined);
    expect(label.sm).toEqual({ span: 8, offset: 0, push: 0, pull: 0 });
    expect(label.md).toBe(6);
    expect(label.span).toBeUndefined();
  });

  it('a flex is stacked with the whole row and restored', () => {
    const { control } = itemColumns('horizontal', undefined, { flex: 'auto' });
    expect(control.xs).toMatchObject({ flex: '0 0 100%' });
    expect(control.sm).toMatchObject({ flex: 'auto' });
  });

  it('a user who gives xs to either column takes the narrow layout over: nothing is stacked for either', () => {
    const { label, control } = itemColumns('horizontal', { xs: 24, sm: 6 }, { span: 18 });
    expect(label.xs).toBe(24);
    expect(label.sm).toBe(6);
    expect(label.flex).toBeUndefined();
    expect(control.span).toBe(18);
    expect(control.xs).toBeUndefined();
  });

  it('with xs given, a column that already has a span or an xs span keeps its props as they are', () => {
    const own = itemColumns('horizontal', { xs: { span: 24 } }, { xs: 24, span: 12 });
    expect(own.label).toEqual({ xs: { span: 24 } });
    expect(own.control).toEqual({ xs: 24, span: 12 });
  });

  it('with xs given, a control with neither a span nor a flex takes the room that is left', () => {
    const { control } = itemColumns('horizontal', { xs: 24 }, { offset: 3 });
    expect(control).toEqual({ offset: 3, flex: '1 1 0%' });
  });

  it('with xs given to one column only, the other column that was not given at all takes the room that is left', () => {
    const { control } = itemColumns('horizontal', { xs: 24 }, undefined);
    expect(control).toEqual({ flex: '1 1 0%' });
    const { label } = itemColumns('horizontal', undefined, { xs: 24 });
    expect(label).toEqual({ flex: '0 1 auto' });
  });

  it('vertical: the columns do not share a line, only the offsets are kept', () => {
    expect(itemColumns('vertical', { span: 4, offset: 2 }, { span: 8 })).toEqual({
      label: { flex: '0 0 auto', offset: 2 },
      control: { flex: '0 0 auto', offset: 0 }
    });
  });

  it('inline: each column is as wide as its content', () => {
    expect(itemColumns('inline', { span: 4 }, { span: 8 })).toEqual({ label: { flex: 'none' }, control: { flex: 'none' } });
  });
});
