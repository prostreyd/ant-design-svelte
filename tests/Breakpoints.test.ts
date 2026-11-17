import { render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flushSync, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breakpoints } from '../src/lib/Grid/Breakpoints.js';
import { BREAKPOINT_NAMES, BREAKPOINTS } from '../src/lib/Grid/constants.js';
import type { Breakpoint } from '../src/lib/Grid/types.js';
import BreakpointsHarness from './fixtures/BreakpointsHarness.svelte';
import { installMatchMedia } from './helpers/matchMedia.js';

let media: ReturnType<typeof installMatchMedia> | undefined;
afterEach(() => {
  media?.uninstall();
  media = undefined;
  vi.unstubAllEnvs();
});

const flags = (screens: Breakpoints) => BREAKPOINT_NAMES.filter((name) => screens[name]);

describe('BREAKPOINTS', () => {
  it('are the minimum widths of the three libraries, in order', () => {
    expect(BREAKPOINT_NAMES).toEqual(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']);
    expect(BREAKPOINTS).toEqual({ xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600, xxxl: 1920 });
  });

  it('are frozen: a consumer cannot change what the grid uses', () => {
    expect(Object.isFrozen(BREAKPOINTS)).toBe(true);
  });

  it.each(['Row.svelte', 'Col.svelte'])('the @media widths written in %s are the same numbers', (file) => {
    const source = readFileSync(join(import.meta.dirname, '../src/lib/Grid', file), 'utf8');
    const widths = [...source.matchAll(/@media \(min-width: (\d+)px\)/g)].map((match) => Number(match[1]));
    expect(widths).toEqual(BREAKPOINT_NAMES.filter((name) => name !== 'xs').map((name) => BREAKPOINTS[name]));
  });

  it.each(['Row.svelte', 'Col.svelte'])('every breakpoint has a chain in %s, in the order of the table', (file) => {
    const source = readFileSync(join(import.meta.dirname, '../src/lib/Grid', file), 'utf8');
    for (const name of BREAKPOINT_NAMES) expect(source).toContain(`-${name}: `);
  });
});

describe('Breakpoints: the flags', () => {
  // The values of the public demo of Ant Design (specs/grid.md, finding 4): xs below 576, the others from their minimum up.
  it.each<[number, Breakpoint, Breakpoint[]]>([
    [400, 'xs', ['xs']],
    [575, 'xs', ['xs']],
    [575.5, 'xs', ['xs']],
    [576, 'sm', ['sm']],
    [767, 'sm', ['sm']],
    [768, 'md', ['sm', 'md']],
    [991, 'md', ['sm', 'md']],
    [992, 'lg', ['sm', 'md', 'lg']],
    [1199, 'lg', ['sm', 'md', 'lg']],
    [1200, 'xl', ['sm', 'md', 'lg', 'xl']],
    [1600, 'xxl', ['sm', 'md', 'lg', 'xl', 'xxl']],
    [1919, 'xxl', ['sm', 'md', 'lg', 'xl', 'xxl']],
    [1920, 'xxxl', ['sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']],
    [3000, 'xxxl', ['sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']]
  ])('at %s px: current %s, flags %j', (width, current, expected) => {
    media = installMatchMedia(width);
    const screens = new Breakpoints();
    expect(screens.current).toBe(current);
    expect(flags(screens)).toEqual(expected);
  });

  it('at no width are xs and sm both true or both false', () => {
    for (const width of [0, 1, 575, 575.01, 575.99, 576, 576.01, 10000]) {
      media?.uninstall();
      media = installMatchMedia(width);
      const screens = new Breakpoints();
      expect(screens.xs).not.toBe(screens.sm);
    }
  });

  it('the values are right at the moment of creation: no empty first read (public issue 32533)', () => {
    media = installMatchMedia(1000);
    expect(new Breakpoints().lg).toBe(true);
  });

  it('a plain read does not attach a listener', () => {
    media = installMatchMedia(1000);
    const screens = new Breakpoints();
    expect(screens.current).toBe('lg');
    expect(media.listenerCount()).toBe(0);
  });

  it('all seven names are properties, xxxl included (public issue 52075)', () => {
    media = installMatchMedia(2000);
    const screens = new Breakpoints();
    expect(screens.xxxl).toBe(true);
    expect(flags(screens)).toHaveLength(6);
  });
});

describe('Breakpoints: in a component', () => {
  it('follows the screen, and the markup is up to date after the change', async () => {
    media = installMatchMedia(500);
    render(BreakpointsHarness);
    expect(screen.getByTestId('current')).toHaveTextContent('xs');
    media.setWidth(800);
    await tick();
    flushSync();
    expect(screen.getByTestId('current')).toHaveTextContent('md');
    expect(screen.getByTestId('flags')).toHaveTextContent('sm md');
    media.setWidth(2000);
    await tick();
    expect(screen.getByTestId('current')).toHaveTextContent('xxxl');
    media.setWidth(300);
    await tick();
    expect(screen.getByTestId('flags')).toHaveTextContent('xs');
  });

  it('the listeners exist while the component reads the values and are removed when it goes', async () => {
    media = installMatchMedia(500);
    const { unmount } = render(BreakpointsHarness);
    await tick();
    expect(media.listenerCount()).toBeGreaterThan(0);
    unmount();
    await tick();
    expect(media.listenerCount()).toBe(0);
  });
});

describe('Breakpoints: where the screen cannot be asked (the server)', () => {
  it('a component that reads the values shows the fallback and listens to nothing', async () => {
    render(BreakpointsHarness, { props: { fallback: 'lg' } });
    await tick();
    expect(screen.getByTestId('current')).toHaveTextContent('lg');
    expect(screen.getByTestId('flags')).toHaveTextContent('sm md lg');
  });

  // jsdom has no matchMedia, which is the position of a server render: no window to ask.
  it('default fallback is xs', () => {
    const screens = new Breakpoints();
    expect(screens.current).toBe('xs');
    expect(flags(screens)).toEqual(['xs']);
  });

  it.each<[Breakpoint, Breakpoint[]]>([
    ['sm', ['sm']],
    ['lg', ['sm', 'md', 'lg']],
    ['xxxl', ['sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']]
  ])('fallback %s: the flags of a screen as wide as it starts', (fallback, expected) => {
    const screens = new Breakpoints({ fallback });
    expect(screens.current).toBe(fallback);
    expect(flags(screens)).toEqual(expected);
  });

  it('a fallback outside the list throws in development and is xs in production', () => {
    expect(() => new Breakpoints({ fallback: 'huge' as Breakpoint })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    expect(new Breakpoints({ fallback: 'huge' as Breakpoint }).current).toBe('xs');
  });

  it('the screen wins over the fallback when there is one', () => {
    media = installMatchMedia(1000);
    expect(new Breakpoints({ fallback: 'xs' }).current).toBe('lg');
  });
});
