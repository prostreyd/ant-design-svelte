import { render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GridHarness from './fixtures/GridHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
});

const col = (index = 0) => screen.getByTestId(`col-${index}`);
/** The custom properties the Col wrote, by name. */
function vars(element: Element): Record<string, string> {
  const found: Record<string, string> = {};
  for (const declaration of (element.getAttribute('style') ?? '').split(';')) {
    const [name, ...value] = declaration.split(':');
    if (name?.trim().startsWith('--')) found[name.trim()] = value.join(':').trim();
  }
  return found;
}
const renderCols = (cols: Record<string, unknown>[], rowProps: Record<string, unknown> = {}) =>
  render(GridHarness, { props: { rowProps, cols } });
const renderCol = (props: Record<string, unknown>) => renderCols([props]);

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Col: the element', () => {
  it('renders a div with the class ads-col, no role and no inline style by default', () => {
    renderCol({});
    expect(col().tagName).toBe('DIV');
    expect(col()).toHaveClass('ads-col');
    expect(col()).not.toHaveAttribute('role');
    expect(col()).not.toHaveAttribute('style');
  });

  it('children: renders its content', () => {
    renderCol({ span: 6 });
    expect(col()).toHaveTextContent('column 0');
  });

  it('class and style: appended, and the style comes after the component values', () => {
    renderCol({ span: 6, class: 'mine', style: '--ads-col-span-xs: 99; color: red' });
    expect(col()).toHaveClass('ads-col', 'mine');
    const style = col().getAttribute('style')!;
    expect(style.indexOf('--ads-col-span-xs: 6')).toBeLessThan(style.indexOf('--ads-col-span-xs: 99'));
    expect(style).toContain('color: red');
  });

  it('native attributes: id, data-*, aria-* and role are forwarded', () => {
    renderCol({ id: 'side', 'data-x': '1', 'aria-label': 'Sidebar', role: 'complementary' });
    expect(col()).toHaveAttribute('id', 'side');
    expect(col()).toHaveAttribute('data-x', '1');
    expect(col()).toHaveAttribute('aria-label', 'Sidebar');
    expect(col()).toHaveAttribute('role', 'complementary');
  });

  it('a column outside a Row renders by itself', async () => {
    const { default: Col } = await import('../src/lib/Grid/Col.svelte');
    render(Col, { props: { span: 6, 'data-testid': 'alone' } });
    expect(screen.getByTestId('alone')).toHaveClass('ads-col');
    expect(vars(screen.getByTestId('alone'))['--ads-col-span-xs']).toBe('6');
  });
});

describe('Col: span, offset, push, pull, order', () => {
  it('span: writes the span and shows the column', () => {
    renderCol({ span: 8 });
    expect(vars(col())).toEqual({ '--ads-col-span-xs': '8', '--ads-col-d-xs': 'block' });
  });

  it('span 0: hides the column (display none)', () => {
    renderCol({ span: 0 });
    expect(vars(col())).toEqual({ '--ads-col-span-xs': '0', '--ads-col-d-xs': 'none' });
  });

  it('a fractional span is written as it is', () => {
    renderCol({ span: 2.5 });
    expect(vars(col())['--ads-col-span-xs']).toBe('2.5');
  });

  it('a span above 24 is not clamped', () => {
    renderCol({ span: 30 });
    expect(vars(col())['--ads-col-span-xs']).toBe('30');
  });

  it.each([['offset'], ['push'], ['pull']])('%s: a number is written', (name) => {
    renderCol({ [name]: 4 });
    expect(vars(col())).toEqual({ [`--ads-col-${name}-xs`]: '4' });
  });

  it.each([['offset'], ['push'], ['pull']])('%s: 0 is a value, not "unset"', (name) => {
    renderCol({ [name]: 0 });
    expect(vars(col())).toEqual({ [`--ads-col-${name}-xs`]: '0' });
  });

  it('order: an integer, negative allowed', () => {
    renderCol({ order: -1 });
    expect(vars(col())).toEqual({ '--ads-col-order-xs': '-1' });
  });

  it('a prop that is not given writes nothing', () => {
    renderCol({ span: undefined, offset: undefined, flex: undefined, md: undefined });
    expect(col()).not.toHaveAttribute('style');
  });

  it.each([
    ['span', -1],
    ['offset', -2],
    ['push', Number.NaN],
    ['pull', Number.POSITIVE_INFINITY],
    ['order', 1.5],
    ['order', Number.NaN],
    ['span', '8' as unknown as number]
  ])('%s = %s throws in development', (name, value) => {
    expect(() => renderCol({ [name]: value })).toThrow(RangeError);
  });

  it('values outside the contract are treated as not given in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    renderCol({ span: -1, offset: Number.NaN, order: 1.5, push: 3 });
    expect(vars(col())).toEqual({ '--ads-col-push-xs': '3' });
  });
});

describe('Col: flex', () => {
  const flexOf = () => vars(col())['--ads-col-flex-xs'];

  it('a number n is n n auto', () => {
    renderCol({ flex: 2 });
    expect(flexOf()).toBe('2 2 auto');
  });

  it('flex 0 is a value, not "unset" (public bug 58719 of Ant Design)', () => {
    renderCol({ flex: 0 });
    expect(flexOf()).toBe('0 0 auto');
  });

  it('flex 0 also works inside a breakpoint object', () => {
    renderCol({ md: { flex: 0 } });
    expect(vars(col())['--ads-col-flex-md']).toBe('0 0 auto');
  });

  it('a string of digits is n 1 0px', () => {
    renderCol({ flex: '3' });
    expect(flexOf()).toBe('3 1 0px');
  });

  it.each([['100px'], ['30%'], ['12.5rem']])('a single length %s is a fixed width: 0 0 <length>', (flex) => {
    renderCol({ flex });
    expect(flexOf()).toBe(`0 0 ${flex}`);
  });

  it.each([['auto'], ['none'], ['1 1 200px'], ['0 1 300px']])('any other string is used as written: %s', (flex) => {
    renderCol({ flex });
    expect(flexOf()).toBe(flex);
  });

  it('an empty string is not a value', () => {
    renderCol({ flex: '   ' });
    expect(col()).not.toHaveAttribute('style');
  });

  it('a flex value lifts the cap of span: max-width stays 100%', () => {
    renderCol({ span: 6, flex: '1 1 300px' });
    expect(vars(col())['--ads-col-mw-xs']).toBe('100%');
  });

  it('a negative number and a non-number throw in development', () => {
    expect(() => renderCol({ flex: -1 })).toThrow(/flex/);
    expect(() => renderCol({ flex: true })).toThrow(/number or a string/);
  });

  it('a bad flex is ignored in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    renderCol({ flex: -1 });
    expect(col()).not.toHaveAttribute('style');
  });
});

describe('Col: breakpoints', () => {
  it.each(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'])('%s: a number is a span', (breakpoint) => {
    renderCol({ [breakpoint]: 12 });
    expect(vars(col())).toEqual({ [`--ads-col-span-${breakpoint}`]: '12', [`--ads-col-d-${breakpoint}`]: 'block' });
  });

  it('an object takes span, offset, push, pull, order and flex', () => {
    renderCol({ lg: { span: 6, offset: 2, push: 1, pull: 3, order: 4, flex: 1 } });
    expect(vars(col())).toEqual({
      '--ads-col-span-lg': '6',
      '--ads-col-d-lg': 'block',
      '--ads-col-offset-lg': '2',
      '--ads-col-push-lg': '1',
      '--ads-col-pull-lg': '3',
      '--ads-col-order-lg': '4',
      '--ads-col-flex-lg': '1 1 auto',
      '--ads-col-mw-lg': '100%'
    });
  });

  it('a span of 0 at one breakpoint hides it there only (hide on mobile)', () => {
    renderCol({ xs: 0, md: 8 });
    expect(vars(col())).toMatchObject({
      '--ads-col-d-xs': 'none',
      '--ads-col-d-md': 'block'
    });
  });

  it('the plain props are the base: they are written at xs', () => {
    renderCol({ span: 12, offset: 2 });
    expect(vars(col())).toMatchObject({ '--ads-col-span-xs': '12', '--ads-col-offset-xs': '2' });
  });

  it('an xs value of the same name wins over the plain prop, each key on its own', () => {
    renderCol({ span: 12, offset: 2, xs: { span: 6 } });
    expect(vars(col())).toMatchObject({ '--ads-col-span-xs': '6', '--ads-col-offset-xs': '2' });
  });

  it('a breakpoint with undefined keys leaves them out', () => {
    renderCol({ md: { span: 6, offset: undefined } });
    expect(vars(col())).toEqual({ '--ads-col-span-md': '6', '--ads-col-d-md': 'block' });
  });

  it('a value that is neither a number nor an object throws in development and is ignored in production', () => {
    expect(() => renderCol({ md: '6' })).toThrow(/number or an object/);
    vi.stubEnv('NODE_ENV', 'production');
    renderCol({ md: '6', lg: 3 });
    expect(vars(screen.getAllByTestId('col-0').at(-1)!)).toEqual({ '--ads-col-span-lg': '3', '--ads-col-d-lg': 'block' });
  });

  it('an invalid number inside an object throws in development', () => {
    expect(() => renderCol({ md: { span: -3 } })).toThrow(/span/);
  });

  it('the Col does not look at the screen: no matchMedia', () => {
    const matchMedia = vi.fn();
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
    renderCol({ xs: 24, md: 12, xxxl: { span: 6, flex: 1 } });
    expect(matchMedia).not.toHaveBeenCalled();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});

describe('Col: reactivity', () => {
  it('a prop that changes is rewritten and one that is removed leaves nothing behind', async () => {
    const { rerender } = renderCols([{ span: 6, offset: 2, md: { span: 4 } }]);
    expect(Object.keys(vars(col())).sort()).toEqual([
      '--ads-col-d-md',
      '--ads-col-d-xs',
      '--ads-col-offset-xs',
      '--ads-col-span-md',
      '--ads-col-span-xs'
    ]);
    await rerender({ rowProps: {}, cols: [{ span: 8, push: 1 }] });
    expect(vars(col())).toEqual({ '--ads-col-span-xs': '8', '--ads-col-d-xs': 'block', '--ads-col-push-xs': '1' });
    await rerender({ rowProps: {}, cols: [{}] });
    expect(col()).not.toHaveAttribute('style');
  });
});

describe('Col: a11y', () => {
  it('order, push and pull change the look only: the DOM order stays as written', () => {
    renderCols([{ order: 3 }, { order: 1, push: 2 }, { order: 2, pull: 1 }]);
    expect([...screen.getByTestId('row').children].map((element) => element.textContent)).toEqual([
      'column 0',
      'column 1',
      'column 2'
    ]);
  });

  it('a column hidden with span 0 stays in the DOM and is hidden by the stylesheet only (its content is not removed)', () => {
    renderCols([{ span: 0 }, { span: 12 }]);
    expect(screen.getByTestId('col-0')).toHaveTextContent('column 0');
  });

  it('has no role of its own', () => {
    renderCols([{ span: 6 }]);
    expect(screen.queryByRole('cell')).toBeNull();
    expect(screen.queryByRole('gridcell')).toBeNull();
  });

  it('has no axe violations in a Row with every kind of column', async () => {
    const { container } = renderCols([
      { span: 6, push: 2 },
      { xs: 12, md: { span: 6, offset: 2, order: 3 } },
      { span: 0 },
      { flex: 1 },
      { xxxl: 4 }
    ]);
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
