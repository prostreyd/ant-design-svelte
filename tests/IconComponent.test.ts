// The public Icon (specs/icon.md; not the private shared icons of specs/icons.md, which tests/Icon.test.ts covers).
import { fireEvent, render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CheckCircleTwoTone,
  DotNetOutlined,
  HeartTwoTone,
  LoadingOutlined,
  LoginOutlined,
  RestOutlined,
  SmileFilled,
  SmileTwoTone,
  StarOutlined
} from '../src/lib/Icon/data';
import Icon from '../src/lib/Icon/Icon.svelte';
import { getTwoToneColor, setTwoToneColor, toPair } from '../src/lib/Icon/twoTone.svelte';
import type { AbstractNode, IconDefinition } from '../src/lib/Icon/types';
import CustomSvg from './fixtures/IconCustomSvg.svelte';

const SVG_NS = 'http://www.w3.org/2000/svg';
const wrapper = () => document.querySelector('.ads-icon') as HTMLElement;
const svg = () => document.querySelector('.ads-icon > svg') as SVGSVGElement;
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
const drawing = (definition: IconDefinition, primary = 'P', secondary = 'S'): AbstractNode =>
  typeof definition.icon === 'function' ? definition.icon(primary, secondary) : definition.icon;
const countNodes = (node: AbstractNode): number => 1 + (node.children ?? []).reduce((sum, child) => sum + countNodes(child), 0);
const raw = (html: string) => createRawSnippet(() => ({ render: () => html }));

const DEFAULT_PAIR = [...getTwoToneColor()] as [string, string];
afterEach(() => setTwoToneColor(DEFAULT_PAIR));

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Icon: the markup (I1)', () => {
  it('I1: one wrapper span holds one svg built from the definition', () => {
    render(Icon, { icon: StarOutlined });
    expect(wrapper().tagName).toBe('SPAN');
    expect(appClasses(wrapper())).toEqual(['ads-icon', 'ads-icon-star']);
    const element = svg();
    expect(element.namespaceURI).toBe(SVG_NS);
    expect(element.getAttribute('viewBox')).toBe('64 64 896 896');
    expect(element.getAttribute('width')).toBe('1em');
    expect(element.getAttribute('height')).toBe('1em');
    expect(element.getAttribute('fill')).toBe('currentColor');
    expect(element.getAttribute('focusable')).toBe('false');
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('data-icon')).toBe('star');
    const path = element.querySelector('path')!;
    expect(path.namespaceURI).toBe(SVG_NS);
    expect(path.getAttribute('d')).toBe((drawing(StarOutlined).children![0].attrs.d));
    expect(document.querySelectorAll('.ads-icon')).toHaveLength(1);
  });

  it('I1: the drawings that use `g`, `defs` and `style` are drawn whole, every node in the SVG namespace', () => {
    for (const definition of [DotNetOutlined, LoginOutlined, RestOutlined]) {
      const { unmount } = render(Icon, { icon: definition });
      const root = svg();
      const expected = countNodes(drawing(definition)) - 1;
      const drawn = [...root.querySelectorAll('*')];
      expect(drawn, definition.name).toHaveLength(expected);
      for (const element of drawn) expect(element.namespaceURI, `${definition.name} ${element.tagName}`).toBe(SVG_NS);
      unmount();
    }
    const { unmount } = render(Icon, { icon: DotNetOutlined });
    expect(svg().querySelector('g')?.getAttribute('fill-opacity')).toBe('.88');
    expect(svg().getAttribute('fill-rule')).toBe('evenodd');
    unmount();
  });

  it('I1: the viewBox of the definition is kept (a few drawings use the whole 1024 square)', () => {
    render(Icon, { icon: LoadingOutlined });
    expect(svg().getAttribute('viewBox')).toBe('0 0 1024 1024');
  });

  it('I1: a definition whose svg has no children is drawn as an empty svg, with its wrapper and name', () => {
    render(Icon, { icon: { name: 'blank', theme: 'outlined', icon: { tag: 'svg', attrs: { viewBox: '0 0 10 10' } } } });
    expect(svg().querySelectorAll('*')).toHaveLength(0);
    expect(svg().getAttribute('viewBox')).toBe('0 0 10 10');
    expect(screen.getByRole('img', { name: 'blank' })).toBe(wrapper());
  });

  it('I1: with no drawing, no component and no content, nothing is rendered', () => {
    const { container } = render(Icon, {});
    expect(container.querySelector('.ads-icon')).toBeNull();
  });
});

describe('Icon: the wrapper and the element attributes (I2, P4)', () => {
  it('I2/P4: `class` is added to the classes of the icon and `style` is the wrapper style', () => {
    render(Icon, { icon: StarOutlined, class: 'mine', style: 'color: red' });
    expect(appClasses(wrapper())).toEqual(['ads-icon', 'ads-icon-star']);
    expect(wrapper().classList.contains('mine')).toBe(true);
    expect(wrapper().getAttribute('style')).toBe('color: red;');
  });

  it('P4: the other element attributes pass through to the wrapper and a click handler runs', async () => {
    const onclick = vi.fn();
    render(Icon, { icon: StarOutlined, onclick, tabindex: 0, 'data-testid': 'star', title: 'A star' });
    await fireEvent.click(screen.getByTestId('star'));
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(wrapper().getAttribute('tabindex')).toBe('0');
    expect(wrapper().getAttribute('title')).toBe('A star');
  });

  it('I2: the name of the drawing is in the class, kebab-case as the data has it', () => {
    render(Icon, { icon: DotNetOutlined });
    expect(appClasses(wrapper())).toContain('ads-icon-dot-net');
  });
});

describe('Icon: spin (I3, P1)', () => {
  it('I3: `spin` adds the spinning class to the wrapper, and turns off again', async () => {
    const { rerender } = render(Icon, { icon: StarOutlined });
    expect(appClasses(wrapper())).not.toContain('ads-icon-spin');
    await rerender({ spin: true });
    expect(appClasses(wrapper())).toContain('ads-icon-spin');
    await rerender({ spin: false });
    expect(appClasses(wrapper())).not.toContain('ads-icon-spin');
  });

  it('P1: the loading drawing turns without the prop, and `spin={false}` stops it', async () => {
    const { rerender } = render(Icon, { icon: LoadingOutlined });
    expect(appClasses(wrapper())).toContain('ads-icon-spin');
    await rerender({ spin: false });
    expect(appClasses(wrapper())).not.toContain('ads-icon-spin');
  });

  it('I3: the spin is on the wrapper, not on the svg', () => {
    render(Icon, { icon: StarOutlined, spin: true });
    expect(svg().classList.contains('ads-icon-spin')).toBe(false);
  });
});

describe('Icon: rotate (I4, P2)', () => {
  it('I4: `rotate` sets the angle on the wrapper for the svg to use, and marks the wrapper', async () => {
    const { rerender } = render(Icon, { icon: StarOutlined, rotate: 180 });
    expect(wrapper().style.getPropertyValue('--ads-icon-rotate')).toBe('180deg');
    expect(appClasses(wrapper())).toContain('ads-icon-rotated');
    await rerender({ rotate: -45 });
    expect(wrapper().style.getPropertyValue('--ads-icon-rotate')).toBe('-45deg');
    await rerender({ rotate: undefined });
    expect(appClasses(wrapper())).not.toContain('ads-icon-rotated');
    expect(wrapper().getAttribute('style')).toBeNull();
  });

  it('I4: 0 degrees is still a rotation; NaN and Infinity are ignored', async () => {
    const { rerender } = render(Icon, { icon: StarOutlined, rotate: 0 });
    expect(appClasses(wrapper())).toContain('ads-icon-rotated');
    await rerender({ rotate: Number.NaN });
    expect(appClasses(wrapper())).not.toContain('ads-icon-rotated');
    await rerender({ rotate: Infinity });
    expect(appClasses(wrapper())).not.toContain('ads-icon-rotated');
  });

  it('I4: rotate and spin are both applied, and the custom style comes after the angle', () => {
    render(Icon, { icon: StarOutlined, rotate: 90, spin: true, style: 'color: red' });
    expect(appClasses(wrapper())).toEqual(['ads-icon', 'ads-icon-star', 'ads-icon-spin', 'ads-icon-rotated']);
    expect(wrapper().getAttribute('style')).toBe('--ads-icon-rotate: 90deg; color: red;');
  });
});

describe('Icon: two-tone colors (I5, P3)', () => {
  const fills = () => [...document.querySelectorAll('.ads-icon svg path')].map((path) => path.getAttribute('fill') ?? path.getAttribute('style'));

  it('I5: with no color the theme tokens draw it (a var() is a style declaration, not a fill attribute)', () => {
    render(Icon, { icon: SmileTwoTone });
    expect(fills()).toEqual([
      'fill: var(--ads-icon-twotone-primary);',
      'fill: var(--ads-icon-twotone-secondary);',
      'fill: var(--ads-icon-twotone-primary);'
    ]);
    expect(document.querySelectorAll('.ads-icon svg path[fill]')).toHaveLength(0);
  });

  it.each([
    ['#1677ff', '#e6f4ff', SmileTwoTone, ['#1677ff', '#e6f4ff', '#1677ff']],
    ['#eb2f96', '#fff0f6', HeartTwoTone, ['#eb2f96', '#fff0f6']],
    ['#52c41a', '#f6ffed', CheckCircleTwoTone, ['#52c41a', '#f6ffed', '#52c41a']]
  ])('I5: one color %s derives the second %s, as Ant Design draws it', (color, second, definition, expected) => {
    render(Icon, { icon: definition, twoToneColor: color });
    expect(fills()).toEqual(expected);
    expect(toPair(color)).toEqual([color, second]);
  });

  it('I5: a pair is used as given, nothing is derived', () => {
    render(Icon, { icon: SmileTwoTone, twoToneColor: ['#1677ff', '#ffe58f'] });
    expect(fills()).toEqual(['#1677ff', '#ffe58f', '#1677ff']);
  });

  it('I5: a color that is not a literal (a CSS variable) keeps the default second color', () => {
    expect(toPair('var(--brand)')).toEqual(['var(--brand)', 'var(--ads-icon-twotone-secondary)']);
    expect(toPair('currentColor')[1]).toBe('var(--ads-icon-twotone-secondary)');
    render(Icon, { icon: SmileTwoTone, twoToneColor: 'var(--brand)' });
    expect(fills()).toEqual(['fill: var(--brand);', 'fill: var(--ads-icon-twotone-secondary);', 'fill: var(--brand);']);
  });

  it('I5: an outlined and a filled drawing ignore the color (their paths have no fill of their own)', () => {
    render(Icon, { icon: StarOutlined, twoToneColor: '#eb2f96' });
    render(Icon, { icon: SmileFilled, twoToneColor: '#eb2f96' });
    expect(fills().filter((fill) => fill?.includes('eb2f96'))).toEqual([]);
  });

  it('P3: setTwoToneColor changes the icons that have no color of their own, at once, and getTwoToneColor returns it', () => {
    render(Icon, { icon: SmileTwoTone });
    render(Icon, { icon: HeartTwoTone, twoToneColor: '#52c41a' });
    expect(getTwoToneColor()).toEqual(['var(--ads-icon-twotone-primary)', 'var(--ads-icon-twotone-secondary)']);
    setTwoToneColor('#eb2f96');
    flushSync();
    expect(getTwoToneColor()).toEqual(['#eb2f96', '#fff0f6']);
    const first = document.querySelectorAll('.ads-icon')[0];
    expect([...first.querySelectorAll('path')].map((path) => path.getAttribute('fill'))).toEqual(['#eb2f96', '#fff0f6', '#eb2f96']);
    const second = document.querySelectorAll('.ads-icon')[1];
    expect([...second.querySelectorAll('path')].map((path) => path.getAttribute('fill'))).toEqual(['#52c41a', '#f6ffed']);
  });

  it('P3: the global value can be a pair too, and is a copy (changing the returned array changes nothing)', () => {
    setTwoToneColor(['#1677ff', '#ffe58f']);
    const pair = getTwoToneColor();
    pair[0] = '#000000';
    expect(getTwoToneColor()).toEqual(['#1677ff', '#ffe58f']);
  });

  it('I5: a new color on the icon reaches the drawing', async () => {
    const { rerender } = render(Icon, { icon: SmileTwoTone, twoToneColor: '#1677ff' });
    await rerender({ twoToneColor: '#eb2f96' });
    expect(fills()).toEqual(['#eb2f96', '#fff0f6', '#eb2f96']);
  });
});

describe('Icon: a custom drawing (I6, P5)', () => {
  it('I6: `component` is rendered with width, height and fill, inside the wrapper', () => {
    render(Icon, { component: CustomSvg, label: 'Custom' });
    const drawn = screen.getByTestId('custom-svg');
    expect(drawn.getAttribute('width')).toBe('1em');
    expect(drawn.getAttribute('height')).toBe('1em');
    expect(drawn.getAttribute('fill')).toBe('currentColor');
    expect(drawn.parentElement).toBe(wrapper());
    expect(appClasses(wrapper())).toEqual(['ads-icon']);
  });

  it('I6: `children` is drawn inside the wrapper, which spins and rotates it like a drawing', () => {
    render(Icon, { children: raw('<svg data-testid="mine" width="1em" height="1em"></svg>'), spin: true, rotate: 90 });
    expect(screen.getByTestId('mine').parentElement).toBe(wrapper());
    expect(appClasses(wrapper())).toEqual(['ads-icon', 'ads-icon-spin', 'ads-icon-rotated']);
  });

  it('P5: children wins over component, and component over icon', () => {
    const { unmount } = render(Icon, { icon: StarOutlined, component: CustomSvg, children: raw('<i data-testid="child"></i>') });
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-svg')).toBeNull();
    expect(document.querySelector('svg[data-icon]')).toBeNull();
    unmount();
    render(Icon, { icon: StarOutlined, component: CustomSvg });
    expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
    expect(document.querySelector('svg[data-icon]')).toBeNull();
  });
});

describe('Icon: the accessible name (A1 to A4)', () => {
  it('A1: the wrapper is an image named by the drawing, and the svg is hidden', () => {
    render(Icon, { icon: StarOutlined });
    expect(screen.getByRole('img', { name: 'star' })).toBe(wrapper());
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('focusable')).toBe('false');
    expect(wrapper().hasAttribute('aria-hidden')).toBe(false);
  });

  it('A1: `label` replaces the name, and changing it updates it', async () => {
    const { rerender } = render(Icon, { icon: StarOutlined, label: 'Favourite' });
    expect(screen.getByRole('img', { name: 'Favourite' })).toBe(wrapper());
    await rerender({ label: 'Избранное' });
    expect(screen.getByRole('img', { name: 'Избранное' })).toBe(wrapper());
  });

  it('A1: `label=""` removes the role and the name and hides the icon', () => {
    render(Icon, { icon: StarOutlined, label: '' });
    expect(screen.queryByRole('img')).toBeNull();
    expect(wrapper().getAttribute('aria-hidden')).toBe('true');
    expect(wrapper().hasAttribute('role')).toBe(false);
    expect(wrapper().hasAttribute('aria-label')).toBe(false);
  });

  it('A1: an `aria-label` the owner passes is the name too, and `aria-hidden` is the owner\'s to set', () => {
    render(Icon, { icon: StarOutlined, 'aria-label': 'Rate' });
    expect(screen.getByRole('img', { name: 'Rate' })).toBe(wrapper());
    document.body.innerHTML = '';
    render(Icon, { icon: StarOutlined, 'aria-hidden': 'true' });
    expect(wrapper().getAttribute('aria-hidden')).toBe('true');
    expect(wrapper().getAttribute('role')).toBe('img');
  });

  it('A1: a custom drawing has no name, so it is hidden unless `label` is set', () => {
    render(Icon, { component: CustomSvg });
    expect(screen.queryByRole('img')).toBeNull();
    expect(wrapper().getAttribute('aria-hidden')).toBe('true');
    document.body.innerHTML = '';
    render(Icon, { component: CustomSvg, label: 'Logo' });
    expect(screen.getByRole('img', { name: 'Logo' })).toBe(wrapper());
  });

  it('A2: an icon is not a tab stop by itself, and nothing is added silently to one with a click handler', () => {
    render(Icon, { icon: StarOutlined, onclick: () => {} });
    expect(wrapper().hasAttribute('tabindex')).toBe(false);
    expect(wrapper().hasAttribute('role') && wrapper().getAttribute('role')).toBe('img');
  });

  it('A3: spinning announces nothing: no live region, no status', () => {
    render(Icon, { icon: LoadingOutlined });
    expect(document.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull();
  });

  it.each([
    ['named', { icon: StarOutlined }],
    ['two-tone', { icon: SmileTwoTone }],
    ['decorative', { icon: StarOutlined, label: '' }],
    ['custom with a label', { component: CustomSvg, label: 'Logo' }],
    ['spinning', { icon: LoadingOutlined }]
  ])('A4: %s: axe finds no violation of WCAG 2 A and AA', async (_name, props) => {
    const { container } = render(Icon, props as never);
    const result = await axe.run(container, AXE_OPTIONS);
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe('Icon: the styles (I8)', () => {
  it('I8: every selector of the style block starts at the icon, the one keyframes name is ours, nothing is global', () => {
    const source = readFileSync(join(import.meta.dirname, '../src/lib/Icon/Icon.svelte'), 'utf8');
    const css = /<style>([\s\S]*?)<\/style>/.exec(source)![1].replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...css.matchAll(/(^|\})\s*([^{}@]+)\{/g)].map((match) => match[2].trim()).filter((selector) => !/^(to|from|\d+%)$/.test(selector));
    expect(selectors.length).toBeGreaterThan(3);
    for (const selector of selectors) expect(selector.startsWith('.ads-icon'), selector).toBe(true);
    expect(css.match(/@keyframes\s+([\w-]+)/g)).toEqual(['@keyframes ads-icon-turn']);
    expect(css).not.toMatch(/(^|\n)\s*(:global\(|html|body|\*)/);
  });

  it('I2: the wrapper and the drawing take their size and color from the text', () => {
    render(Icon, { icon: StarOutlined });
    expect(svg().getAttribute('width')).toBe('1em');
    expect(svg().getAttribute('fill')).toBe('currentColor');
  });
});

describe('Icon: reactivity', () => {
  it('a new `icon` replaces the drawing without a new wrapper', async () => {
    const { rerender } = render(Icon, { icon: StarOutlined });
    const first = wrapper();
    await rerender({ icon: SmileFilled });
    expect(wrapper()).toBe(first);
    expect(svg().getAttribute('data-icon')).toBe('smile');
    expect(appClasses(wrapper())).toEqual(['ads-icon', 'ads-icon-smile']);
    expect(screen.getByRole('img', { name: 'smile' })).toBe(first);
  });
});
