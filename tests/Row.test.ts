import { render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Row from '../src/lib/Grid/Row.svelte';
import GridHarness from './fixtures/GridHarness.svelte';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const row = () => screen.getByTestId('row');
/** The custom properties the Row wrote, by name. */
function vars(element: Element): Record<string, string> {
  const found: Record<string, string> = {};
  for (const declaration of (element.getAttribute('style') ?? '').split(';')) {
    const [name, ...value] = declaration.split(':');
    if (name?.trim().startsWith('--')) found[name.trim()] = value.join(':').trim();
  }
  return found;
}
const renderRow = (rowProps: Record<string, unknown> = {}, cols: Record<string, unknown>[] = [{ span: 24 }]) =>
  render(GridHarness, { props: { rowProps, cols } });

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Row: the element', () => {
  it('renders a div with the class ads-row, no role and no inline style by default', () => {
    renderRow();
    expect(row().tagName).toBe('DIV');
    expect(row()).toHaveClass('ads-row');
    expect(row()).not.toHaveAttribute('role');
    expect(row()).not.toHaveAttribute('style');
  });

  it('children: renders its content', () => {
    renderRow({}, [{ span: 12 }, { span: 12 }]);
    expect(row()).toHaveTextContent('column 0');
    expect(row()).toHaveTextContent('column 1');
  });

  it('class: is appended to the component classes', () => {
    renderRow({ class: 'mine' });
    expect(row()).toHaveClass('ads-row', 'mine');
  });

  it('style: is written after the component values, so it wins on the same property', () => {
    renderRow({ gutter: 16, style: '--ads-row-gx-xs: 99px; color: red' });
    const style = row().getAttribute('style')!;
    expect(style.indexOf('--ads-row-gx-xs: 16px')).toBeLessThan(style.indexOf('--ads-row-gx-xs: 99px'));
    expect(style).toContain('color: red');
  });

  it('native attributes: id, data-*, aria-* and role are forwarded', () => {
    renderRow({ id: 'main-row', 'data-x': '1', 'aria-label': 'Prices', role: 'list' });
    expect(row()).toHaveAttribute('id', 'main-row');
    expect(row()).toHaveAttribute('data-x', '1');
    expect(row()).toHaveAttribute('aria-label', 'Prices');
    expect(row()).toHaveAttribute('role', 'list');
  });

  it('wrap: true by default, false adds the nowrap class', async () => {
    const { rerender } = renderRow();
    expect(row()).not.toHaveClass('ads-row-nowrap');
    await rerender({ rowProps: { wrap: false }, cols: [{ span: 24 }] });
    expect(row()).toHaveClass('ads-row-nowrap');
    await rerender({ rowProps: { wrap: true }, cols: [{ span: 24 }] });
    expect(row()).not.toHaveClass('ads-row-nowrap');
  });
});

describe('Row: align and justify', () => {
  it.each([
    ['top', 'flex-start'],
    ['middle', 'center'],
    ['bottom', 'flex-end'],
    ['stretch', 'stretch']
  ])('align %s is align-items %s', (align, css) => {
    renderRow({ align });
    expect(vars(row())).toEqual({ '--ads-row-align-xs': css });
  });

  it.each([
    ['start', 'flex-start'],
    ['end', 'flex-end'],
    ['center', 'center'],
    ['space-around', 'space-around'],
    ['space-between', 'space-between'],
    ['space-evenly', 'space-evenly']
  ])('justify %s is justify-content %s', (justify, css) => {
    renderRow({ justify });
    expect(vars(row())).toEqual({ '--ads-row-justify-xs': css });
  });

  it('the object form gives a value per breakpoint, each key on its own', () => {
    renderRow({ align: { xs: 'top', lg: 'bottom' }, justify: { sm: 'center', xxxl: 'space-between' } });
    expect(vars(row())).toEqual({
      '--ads-row-align-xs': 'flex-start',
      '--ads-row-align-lg': 'flex-end',
      '--ads-row-justify-sm': 'center',
      '--ads-row-justify-xxxl': 'space-between'
    });
  });

  it('a value outside the list throws in development, for the plain and the object form', () => {
    expect(() => renderRow({ align: 'baseline' })).toThrow(RangeError);
    expect(() => renderRow({ justify: { md: 'left' } })).toThrow(/justify/);
  });

  it('a value outside the list falls back to the default in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    renderRow({ align: 'baseline', justify: { md: 'left' } });
    expect(vars(row())).toEqual({ '--ads-row-align-xs': 'flex-start', '--ads-row-justify-md': 'flex-start' });
  });

  it('an unknown key in the object throws in development and is ignored in production', () => {
    expect(() => renderRow({ align: { mdd: 'top' } })).toThrow(/not a breakpoint/);
    vi.stubEnv('NODE_ENV', 'production');
    renderRow({ align: { mdd: 'top', md: 'middle' } });
    expect(vars(row())).toEqual({ '--ads-row-align-md': 'center' });
  });

  it('a breakpoint whose value is undefined counts as not given', () => {
    renderRow({ align: { xs: undefined, md: 'middle' } });
    expect(vars(row())).toEqual({ '--ads-row-align-md': 'center' });
  });
});

describe('Row: gutter', () => {
  it('no gutter writes nothing; an explicit 0 is written as 0px (it can be the base of an object)', () => {
    renderRow();
    expect(vars(row())).toEqual({});
    renderRow({ gutter: 0 });
    expect(vars(screen.getAllByTestId('row')[1])).toEqual({ '--ads-row-gx-xs': '0px' });
  });

  it('a number is pixels', () => {
    renderRow({ gutter: 16 });
    expect(vars(row())).toEqual({ '--ads-row-gx-xs': '16px' });
  });

  it('a pair is [horizontal, vertical]', () => {
    renderRow({ gutter: [16, 24] });
    expect(vars(row())).toEqual({ '--ads-row-gx-xs': '16px', '--ads-row-gy-xs': '24px' });
  });

  it('a single value is horizontal only: no vertical variable', () => {
    renderRow({ gutter: 16 });
    expect(vars(row())).not.toHaveProperty('--ads-row-gy-xs');
  });

  it('an invalid string inside an object is dropped at that breakpoint only', () => {
    renderRow({ gutter: { xs: 8, md: 'wide', lg: 24 } });
    expect(vars(row())).toEqual({ '--ads-row-gx-xs': '8px', '--ads-row-gx-lg': '24px' });
  });

  it('an object is a value per breakpoint', () => {
    renderRow({ gutter: { xs: 8, sm: 16, md: 24, lg: 32 } });
    expect(vars(row())).toEqual({
      '--ads-row-gx-xs': '8px',
      '--ads-row-gx-sm': '16px',
      '--ads-row-gx-md': '24px',
      '--ads-row-gx-lg': '32px'
    });
  });

  it('a pair takes a number, a string and an object in each place', () => {
    renderRow({ gutter: ['2rem', { xs: 8, xxxl: '1vw' }] });
    expect(vars(row())).toEqual({ '--ads-row-gx-xs': '2rem', '--ads-row-gy-xs': '8px', '--ads-row-gy-xxxl': '1vw' });
  });

  it.each(['2rem', '5vw', '10%', '1.5em', '0', 'calc(1rem + 4px)', 'min(2rem, 5%)', 'var(--gap)', 'clamp(8px, 2vw, 24px)'])(
    'a CSS length string is used as written: %s',
    (gutter) => {
      renderRow({ gutter });
      expect(vars(row())['--ads-row-gx-xs']).toBe(gutter === '0' ? '0px' : gutter);
    }
  );

  it.each(['16', 'wide', '', '   ', 'calc(1rem', 'calc(1rem))', '10 px'])(
    'a string that is not a length is dropped, not thrown: %j',
    (gutter) => {
      renderRow({ gutter });
      expect(vars(row())).toEqual({});
    }
  );

  it.each([[-1], [Number.NaN], [Number.POSITIVE_INFINITY]])('a bad number throws in development: %s', (gutter) => {
    expect(() => renderRow({ gutter })).toThrow(RangeError);
  });

  it('a value that is neither a number nor a string throws in development', () => {
    expect(() => renderRow({ gutter: true })).toThrow(/number or a CSS length/);
  });

  it('a bad number is ignored in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    renderRow({ gutter: [-8, Number.NaN] });
    expect(vars(row())).toEqual({});
  });

  it('an unknown breakpoint key throws in development', () => {
    expect(() => renderRow({ gutter: { huge: 8 } })).toThrow(/not a breakpoint/);
  });
});

describe('Row: reactivity', () => {
  it('a prop that changes rewrites the variables, and one that is removed leaves nothing behind', async () => {
    // Public bug 59066 of Ant Design: stale align and justify classes after the props were removed.
    const { rerender } = renderRow({ align: 'middle', justify: 'center', gutter: 16 });
    expect(Object.keys(vars(row())).sort()).toEqual(['--ads-row-align-xs', '--ads-row-gx-xs', '--ads-row-justify-xs']);
    await rerender({ rowProps: { align: 'bottom', gutter: [8, 8] }, cols: [{ span: 24 }] });
    expect(vars(row())).toEqual({
      '--ads-row-align-xs': 'flex-end',
      '--ads-row-gx-xs': '8px',
      '--ads-row-gy-xs': '8px'
    });
    await rerender({ rowProps: {}, cols: [{ span: 24 }] });
    expect(row()).not.toHaveAttribute('style');
  });

  it('the Row does not look at the screen: no matchMedia, no listener', () => {
    const matchMedia = vi.fn();
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
    renderRow({ gutter: { xs: 8, md: 24 }, align: { lg: 'middle' } }, [{ xs: 24, md: 12 }]);
    expect(matchMedia).not.toHaveBeenCalled();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});

describe('Row: a11y', () => {
  it('has no role, name or state of its own', () => {
    render(Row, { props: {} });
    expect(screen.queryByRole('row')).toBeNull();
    expect(screen.queryByRole('grid')).toBeNull();
    expect(document.body.querySelector('[role]')).toBeNull();
    expect(document.body.querySelector('[aria-label], [aria-hidden]')).toBeNull();
  });

  it('has no axe violations for rows with every kind of prop', async () => {
    const { container } = renderRow(
      { gutter: [16, { xs: 8, lg: 24 }], align: { xs: 'top', md: 'middle' }, justify: 'space-between', wrap: false },
      [{ span: 6, push: 2 }, { xs: 12, md: { span: 6, offset: 2, order: 3 } }, { span: 0 }, { flex: 1 }]
    );
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
