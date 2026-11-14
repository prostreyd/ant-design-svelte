// Tooltip (specs/tooltip.md). jsdom has no layout, so the geometry (where the panel is, what the pointer crosses, the
// real colors, touch) is in e2e/tooltip.spec.ts; here are the props, the events, the state and the ARIA wiring.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOOLTIP_PRESET_COLORS } from '../src/lib/Tooltip/types';
import TooltipHarness from './fixtures/TooltipHarness.svelte';
import TooltipNestedHarness from './fixtures/TooltipNestedHarness.svelte';
import { panelRect, type Place } from './popupHelpers';

// The trigger gets a rectangle and the panel a size, so that the placement has numbers to work with.
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const origin: Place = { left: 0, top: 0 };
const realComputedStyle = window.getComputedStyle.bind(window);

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const isTrigger = ['trigger', 'trigger2', 'outside'].includes(this.getAttribute('data-testid') ?? '');
    const r = isTrigger
      ? { left: 400, top: 300, width: 100, height: 40 }
      : this.classList.contains('ads-popup')
        ? panelRect(this as HTMLElement, origin)
        : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
  });
  const isPanel = (element: HTMLElement) => element.classList.contains('ads-popup');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return isPanel(this) ? 120 : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return isPanel(this) ? 32 : 0; } });
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 800 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalWidth);
  if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalHeight);
  delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
  document.body.innerHTML = '';
});

const wrapper = () => document.querySelector<HTMLElement>('.ads-tooltip-trigger')!;
const panelOf = () => document.querySelector<HTMLElement>('.ads-popup');
const frameOf = () => document.querySelector<HTMLElement>('.ads-popup-frame');
const boxOf = () => document.querySelector<HTMLElement>('.ads-tooltip');
const trigger = () => screen.getByTestId('trigger');
const parentOpen = () => screen.getByTestId('parent-open').textContent;
const fire = (target: Element, type: string, init: MouseEventInit = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: type !== 'mouseenter' && type !== 'mouseleave', cancelable: true, ...init }));
const keydown = (key: string) =>
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const press = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }));

async function mount(props: Record<string, unknown> = {}) {
  const view = render(TooltipHarness, { props: { title: 'Tip', ...props } });
  await tick();
  return view;
}

async function mountOpen(props: Record<string, unknown> = {}) {
  const view = await mount({ open: true, ...props });
  await tick();
  return view;
}

describe('Tooltip: title (P1)', () => {
  it('title: a string is the text of the tip', async () => {
    await mountOpen({ title: 'Prompt text' });
    expect(boxOf()!.textContent?.trim()).toBe('Prompt text');
  });

  it('title: HTML in a string is text, never markup', async () => {
    await mountOpen({ title: '<b>bold</b>' });
    expect(boxOf()!.querySelector('b')).toBeNull();
    expect(boxOf()!.textContent).toContain('<b>bold</b>');
  });

  it('title: a number is shown, and 0 too', async () => {
    await mountOpen({ title: 0 });
    expect(boxOf()!.textContent?.trim()).toBe('0');
  });

  it('title: a snippet is rendered', async () => {
    await mountOpen({ mode: 'snippet', title: undefined });
    expect(screen.getByTestId('rich')).toBeInTheDocument();
    expect(boxOf()!.textContent).toContain('Rich tip');
  });

  it('title: an empty one (undefined, null, empty string) never opens, even with open', async () => {
    for (const title of [undefined, null, '']) {
      const { unmount } = await mountOpen({ title });
      expect(panelOf(), String(title)).toBeNull();
      expect(trigger().hasAttribute('aria-describedby')).toBe(false);
      unmount();
    }
  });

  it('title: becoming empty while open removes the panel and keeps `open` as the parent set it', async () => {
    const { rerender } = await mountOpen({ title: 'Tip' });
    expect(panelOf()).not.toBeNull();
    await rerender({ title: '' });
    await waitFor(() => expect(panelOf()).toBeNull());
    expect(parentOpen()).toBe('true');
    expect(trigger().hasAttribute('aria-describedby')).toBe(false);
  });

  it('title: an empty one leaves the triggers inert', async () => {
    vi.useFakeTimers();
    await mount({ title: '' });
    fire(wrapper(), 'mouseenter');
    await fireEvent.focusIn(trigger());
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
  });

  it('title: changing the text while open updates the panel', async () => {
    const { rerender } = await mountOpen({ title: 'First' });
    await rerender({ title: 'Second' });
    expect(boxOf()!.textContent?.trim()).toBe('Second');
  });
});

describe('Tooltip: the child and the wrapper (decision 1)', () => {
  it('the wrapper has no box of its own: it is the element the CSS gives `display: contents`', async () => {
    await mount();
    expect(wrapper().className).toBe('ads-tooltip-trigger svelte-' + wrapper().className.split('svelte-')[1]);
    expect(wrapper().contains(trigger())).toBe(true);
  });

  it('the first element of the child is the anchor: it gets aria-describedby, not the wrapper', async () => {
    await mountOpen();
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
    expect(wrapper().hasAttribute('aria-describedby')).toBe(false);
  });

  it('the anchor follows the child when it is replaced while the tooltip is open', async () => {
    await mountOpen();
    await fireEvent.click(screen.getByTestId('swap'));
    const link = await screen.findByTestId('trigger2');
    await waitFor(() => expect(link.getAttribute('aria-describedby')).toBe(frameOf()!.id));
  });

  it('no element left: the panel is removed', async () => {
    await mountOpen();
    expect(panelOf()).not.toBeNull();
    await fireEvent.click(screen.getByTestId('remove'));
    await waitFor(() => expect(panelOf()).toBeNull());
  });

  it('a text-only child cannot be a trigger: nothing opens, and development warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mountOpen({ mode: 'text' });
    expect(panelOf()).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('one element'));
  });

  it('a text-only child is silent in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount({ mode: 'text' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('no child and no anchor: nothing is rendered, and no warning for an empty wrapper', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mountOpen({ mode: 'none' });
    expect(panelOf()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('anchor: the tooltip is placed at the given element', async () => {
    await mountOpen({ mode: 'anchor' });
    await waitFor(() => expect(panelOf()).not.toBeNull());
    expect(screen.getByTestId('outside').getAttribute('aria-describedby')).toBe(frameOf()!.id);
  });
});

describe('Tooltip: open and onopenchange (P3)', () => {
  it('open: false renders no panel before the first opening', async () => {
    await mount();
    expect(panelOf()).toBeNull();
  });

  it('open: true shows the tip, and the parent can toggle it', async () => {
    await mountOpen();
    expect(panelOf()!.hidden).toBe(false);
    await fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(panelOf()!.hidden).toBe(true));
    await fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(panelOf()!.hidden).toBe(false));
  });

  it('onopenchange: called once per change made by the user, not for a change made by the parent', async () => {
    vi.useFakeTimers();
    const onopenchange = vi.fn();
    await mount({ onopenchange });
    await fireEvent.click(screen.getByTestId('toggle'));
    await tick();
    expect(onopenchange).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByTestId('toggle'));
    await tick();
    expect(onopenchange).not.toHaveBeenCalled();
    await fireEvent.focusIn(trigger());
    await tick();
    expect(onopenchange.mock.calls).toEqual([[true]]);
    await fireEvent.focusOut(trigger());
    await tick();
    expect(onopenchange.mock.calls).toEqual([[true], [false]]);
  });

  it('open: the user opening it writes to a bound `open`', async () => {
    await mount();
    await fireEvent.focusIn(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
  });

  it('open: a function binding can refuse a change', async () => {
    const onopenchange = vi.fn();
    await mount({ mode: 'veto', onopenchange });
    await fireEvent.focusIn(trigger());
    await tick();
    expect(onopenchange).toHaveBeenCalledWith(true);
    expect(parentOpen()).toBe('false');
    expect(panelOf()).toBeNull();
  });
});

describe('Tooltip: trigger (decision 2, P9)', () => {
  it('trigger: hover and focus by default; hover opens after 0.1 s and not before', async () => {
    vi.useFakeTimers();
    await mount();
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(99);
    expect(parentOpen()).toBe('false');
    await vi.advanceTimersByTimeAsync(1);
    await tick();
    expect(parentOpen()).toBe('true');
    expect(panelOf()).not.toBeNull();
  });

  it('trigger: a pass over the element shorter than the delay opens nothing', async () => {
    vi.useFakeTimers();
    await mount();
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(50);
    fire(wrapper(), 'mouseleave');
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
    expect(panelOf()).toBeNull();
  });

  it('mouseEnterDelay and mouseLeaveDelay are in seconds', async () => {
    vi.useFakeTimers();
    await mount({ mouseEnterDelay: 0.5, mouseLeaveDelay: 0.3 });
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(499);
    expect(parentOpen()).toBe('false');
    await vi.advanceTimersByTimeAsync(1);
    expect(parentOpen()).toBe('true');
    fire(wrapper(), 'mouseleave');
    await vi.advanceTimersByTimeAsync(299);
    expect(parentOpen()).toBe('true');
    await vi.advanceTimersByTimeAsync(1);
    expect(parentOpen()).toBe('false');
  });

  it('trigger: the pointer can rest in the panel, and leaving the panel closes it after the delay', async () => {
    vi.useFakeTimers();
    await mount();
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(100);
    await tick();
    fire(wrapper(), 'mouseleave');
    fire(panelOf()!, 'mouseenter');
    await vi.advanceTimersByTimeAsync(1000);
    expect(parentOpen()).toBe('true');
    fire(panelOf()!, 'mouseleave');
    await vi.advanceTimersByTimeAsync(99);
    expect(parentOpen()).toBe('true');
    await vi.advanceTimersByTimeAsync(1);
    expect(parentOpen()).toBe('false');
  });

  it('trigger: keyboard focus opens at once, and focus leaving closes it', async () => {
    vi.useFakeTimers();
    await mount();
    await fireEvent.focusIn(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
    expect(panelOf()).not.toBeNull();
    await fireEvent.focusOut(trigger());
    await tick();
    expect(parentOpen()).toBe('false');
  });

  it('trigger: "click" toggles and ignores hover and focus', async () => {
    vi.useFakeTimers();
    await mount({ trigger: 'click' });
    fire(wrapper(), 'mouseenter');
    await fireEvent.focusIn(trigger());
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
    await fireEvent.click(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
    await fireEvent.click(trigger());
    await tick();
    expect(parentOpen()).toBe('false');
  });

  it('trigger: a press outside closes a tooltip opened by click, and a press on the trigger does not', async () => {
    await mount({ trigger: ['click'] });
    await fireEvent.click(trigger());
    await tick();
    press(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
    press(screen.getByTestId('outside'));
    await tick();
    expect(parentOpen()).toBe('false');
  });

  it('trigger: "contextMenu" opens and blocks the browser menu', async () => {
    await mount({ trigger: 'contextMenu' });
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    trigger().dispatchEvent(event);
    await tick();
    expect(event.defaultPrevented).toBe(true);
    expect(parentOpen()).toBe('true');
  });

  it('trigger: an array combines the triggers', async () => {
    vi.useFakeTimers();
    await mount({ trigger: ['click', 'focus'] });
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
    await fireEvent.focusIn(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
  });

  it('trigger: an empty array means controlled only', async () => {
    vi.useFakeTimers();
    await mount({ trigger: [] });
    fire(wrapper(), 'mouseenter');
    await fireEvent.focusIn(trigger());
    await fireEvent.click(trigger());
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
    await fireEvent.click(screen.getByTestId('toggle'));
    await tick();
    expect(panelOf()).not.toBeNull();
  });

  it('trigger: changing it while mounted re-binds the listeners', async () => {
    vi.useFakeTimers();
    const { rerender } = await mount({ trigger: 'hover' });
    await rerender({ trigger: 'click' });
    await tick();
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('false');
    await fireEvent.click(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
  });

  it('trigger: a value outside the contract throws in development and falls back to hover in production', async () => {
    expect(() => render(TooltipHarness, { props: { title: 'Tip', trigger: 'drag' as never } })).toThrow(RangeError);
    document.body.innerHTML = '';
    vi.stubEnv('NODE_ENV', 'production');
    vi.useFakeTimers();
    render(TooltipHarness, { props: { title: 'Tip', trigger: 'drag' as never } });
    await tick();
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(100);
    expect(parentOpen()).toBe('true');
  });
});

describe('Tooltip: dismissal', () => {
  it('Escape closes the tooltip, reports it, and focus stays on the trigger', async () => {
    const onopenchange = vi.fn();
    await mount({ onopenchange });
    trigger().focus();
    await fireEvent.focusIn(trigger());
    await tick();
    expect(parentOpen()).toBe('true');
    keydown('Escape');
    await tick();
    expect(parentOpen()).toBe('false');
    expect(onopenchange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger());
  });
});

describe('Tooltip: quick repeats', () => {
  it('Escape twice before the layer is gone reports one change', async () => {
    const onopenchange = vi.fn();
    await mount({ onopenchange });
    await fireEvent.focusIn(trigger());
    await tick();
    keydown('Escape');
    keydown('Escape');
    await tick();
    expect(onopenchange.mock.calls).toEqual([[true], [false]]);
  });
});

describe('Tooltip: placement, arrow, overflow, layer, container (core and cheap items)', () => {
  it('placement: the placement is on the frame as data-placement, and `top` is the default', async () => {
    await mountOpen();
    expect(frameOf()!.dataset.placement).toBe('top');
    expect(frameOf()!.dataset.side).toBe('top');
  });

  it('placement: another placement is used, and a change while open moves the tip', async () => {
    const { rerender } = await mountOpen({ placement: 'bottomLeft' });
    expect(frameOf()!.dataset.placement).toBe('bottomLeft');
    await rerender({ placement: 'rightTop' });
    await waitFor(() => expect(frameOf()!.dataset.placement).toBe('rightTop'));
  });

  it('placement: a value outside the contract throws in development and falls back to top in production', async () => {
    expect(() => render(TooltipHarness, { props: { title: 'Tip', open: true, placement: 'middle' as never } })).toThrow(RangeError);
    document.body.innerHTML = '';
    vi.stubEnv('NODE_ENV', 'production');
    render(TooltipHarness, { props: { title: 'Tip', open: true, placement: 'middle' as never } });
    await tick();
    await tick();
    expect(frameOf()!.dataset.placement).toBe('top');
  });

  it('arrow: shown by default, hidden with false, and the object form is accepted', async () => {
    const { rerender } = await mountOpen();
    expect(frameOf()!.querySelector('.ads-popup-arrow')).not.toBeNull();
    await rerender({ arrow: false });
    expect(frameOf()!.querySelector('.ads-popup-arrow')).toBeNull();
    await rerender({ arrow: { pointAtCenter: true } });
    expect(frameOf()!.querySelector('.ads-popup-arrow')).not.toBeNull();
  });

  it('autoAdjustOverflow: on by default (a tip at the top edge flips), off keeps the side', async () => {
    // The trigger is high up: no room above it for a 32 px tip plus the arrow gap.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const trig = this.getAttribute('data-testid') === 'trigger';
      const r = trig ? { left: 400, top: 10, width: 100, height: 40 } : this.classList.contains('ads-popup') ? panelRect(this as HTMLElement, origin) : { left: 0, top: 0, width: 0, height: 0 };
      return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
    });
    await mountOpen();
    expect(frameOf()!.dataset.side).toBe('bottom');
    document.body.innerHTML = '';
    await mountOpen({ autoAdjustOverflow: false });
    expect(frameOf()!.dataset.side).toBe('top');
  });

  it('zIndex: overrides the layer token', async () => {
    await mountOpen({ zIndex: 2000 });
    expect(panelOf()!.style.zIndex).toBe('2000');
  });

  it('the panel is in the tooltip layer', async () => {
    await mountOpen();
    expect(panelOf()!.classList.contains('ads-popup-tooltip')).toBe(true);
  });

  it('container: an element and a function that returns one', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    await mountOpen({ container: host });
    expect(panelOf()!.parentElement).toBe(host);
    document.body.innerHTML = '';
    const other = document.createElement('section');
    document.body.append(other);
    await mountOpen({ container: () => other });
    expect(panelOf()!.parentElement).toBe(other);
  });

  it('destroyOnHidden: the content is removed on close; without it the content stays mounted', async () => {
    await mountOpen();
    await fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(panelOf()!.hidden).toBe(true));
    expect(boxOf()).not.toBeNull();
    document.body.innerHTML = '';
    await mountOpen({ destroyOnHidden: true });
    await fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(panelOf()).toBeNull());
  });
});

describe('Tooltip: classNames and styles (P2)', () => {
  it('classNames: the root, the container and the arrow each get their class', async () => {
    await mountOpen({ classNames: { root: 'my-root', container: 'my-box', arrow: 'my-arrow' } });
    expect(panelOf()!.classList.contains('my-root')).toBe(true);
    expect(boxOf()!.classList.contains('my-box')).toBe(true);
    expect(frameOf()!.querySelector('.ads-popup-arrow > span')!.classList.contains('my-arrow')).toBe(true);
  });

  it('styles: the root, the container and the arrow each get their style', async () => {
    await mountOpen({ styles: { root: { '--r': '1', 'margin-top': '3px' }, container: { 'font-weight': 700 }, arrow: { opacity: 0.5 } } });
    expect(panelOf()!.style.getPropertyValue('--r')).toBe('1');
    expect(panelOf()!.style.marginTop).toBe('3px');
    expect(boxOf()!.style.fontWeight).toBe('700');
    expect((frameOf()!.querySelector('.ads-popup-arrow > span') as HTMLElement).style.opacity).toBe('0.5');
  });

  it('styles.root: keeps the placement, and a property that left the object is removed', async () => {
    const { rerender } = await mountOpen({ styles: { root: { '--a': '1' } } });
    expect(panelOf()!.style.transform).toContain('translate(');
    await rerender({ styles: { root: { '--b': '2' } } });
    await waitFor(() => expect(panelOf()!.style.getPropertyValue('--a')).toBe(''));
    expect(panelOf()!.style.getPropertyValue('--b')).toBe('2');
    expect(panelOf()!.style.transform).toContain('translate(');
  });
});

describe('Tooltip: styles.root changing', () => {
  it('a property that stays is kept, and one that left the object is removed', async () => {
    const { rerender } = await mountOpen({ styles: { root: { '--keep': '1', '--drop': '2' } } });
    await rerender({ styles: { root: { '--keep': '3' } } });
    await waitFor(() => expect(panelOf()!.style.getPropertyValue('--drop')).toBe(''));
    expect(panelOf()!.style.getPropertyValue('--keep')).toBe('3');
  });
});

describe('Tooltip: styles.root with empty values', () => {
  it('an empty string, undefined and null are skipped, the rest is written', async () => {
    await mountOpen({ styles: { root: { '--empty': '', '--none': undefined as never, '--null': null as never, '--set': '1' } } });
    expect(panelOf()!.style.getPropertyValue('--set')).toBe('1');
    for (const name of ['--empty', '--none', '--null']) expect(panelOf()!.style.getPropertyValue(name), name).toBe('');
  });
});

describe('Tooltip: color (decision 3, 3b, P7)', () => {
  const stubColors = (resolved: string) => {
    vi.stubGlobal('CSS', { supports: (_: string, value: string) => value !== 'not-a-color' });
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
      const style = realComputedStyle(element, pseudo);
      if (element.classList?.contains('ads-tooltip')) Object.defineProperty(style, 'backgroundColor', { value: resolved });
      return style;
    });
  };

  it('color: each of the 13 presets sets its background and text tokens and a class', async () => {
    expect(TOOLTIP_PRESET_COLORS).toHaveLength(13);
    for (const name of TOOLTIP_PRESET_COLORS) {
      const { unmount } = await mountOpen({ color: name });
      expect(boxOf()!.classList.contains(`ads-tooltip-preset-${name}`), name).toBe(true);
      const style = frameOf()!.getAttribute('style') ?? '';
      expect(style, name).toContain(`--ads-tooltip-bg: var(--ads-tooltip-preset-${name})`);
      expect(style, name).toContain(`--ads-tooltip-color: var(--ads-tooltip-preset-${name}-text)`);
      unmount();
    }
  });

  it('color: the arrow takes the background of the box', async () => {
    await mountOpen({ color: 'blue' });
    expect(frameOf()!.getAttribute('style')).toContain('--ads-popup-arrow-bg: var(--ads-tooltip-bg)');
  });

  it('color: a name from the list is a preset, any other string is a CSS color', async () => {
    stubColors('rgb(135, 208, 104)');
    await mountOpen({ color: '#87d068' });
    expect(boxOf()!.className).not.toContain('preset');
    expect(frameOf()!.getAttribute('style')).toContain('--ads-tooltip-bg: #87d068');
  });

  it('color: a custom color gets black or white text, whichever contrasts more', async () => {
    stubColors('rgb(135, 208, 104)');
    await mountOpen({ color: '#87d068' });
    await waitFor(() => expect(frameOf()!.getAttribute('style')).toContain('--ads-tooltip-color: #000000'));
    document.body.innerHTML = '';
    stubColors('rgb(10, 20, 80)');
    await mountOpen({ color: '#0a1450' });
    await waitFor(() => expect(frameOf()!.getAttribute('style')).toContain('--ads-tooltip-color: #ffffff'));
  });

  it('color: a color the browser resolves to a form it cannot read keeps the default text color', async () => {
    stubColors('oklch(0.5 0.1 200)');
    await mountOpen({ color: 'oklch(0.5 0.1 200)' });
    expect(frameOf()!.getAttribute('style')).toContain('--ads-tooltip-bg: oklch(0.5 0.1 200)');
    expect(frameOf()!.getAttribute('style')).not.toMatch(/--ads-tooltip-color:/);
  });

  it('color: a color the browser cannot parse leaves the default box', async () => {
    stubColors('rgb(0, 0, 0)');
    await mountOpen({ color: 'not-a-color' });
    expect(frameOf()!.getAttribute('style')).not.toMatch(/--ads-tooltip-bg:/);
  });

  it('color: where there is no CSS global (an old engine) a custom color is left out', async () => {
    vi.stubGlobal('CSS', undefined);
    await mountOpen({ color: '#87d068' });
    expect(frameOf()!.getAttribute('style')).not.toMatch(/--ads-tooltip-bg:/);
  });

  it('color: removing it while open restores the default', async () => {
    stubColors('rgb(135, 208, 104)');
    const { rerender } = await mountOpen({ color: '#87d068' });
    await rerender({ color: undefined });
    await waitFor(() => expect(frameOf()!.getAttribute('style')).not.toMatch(/--ads-tooltip-bg:/));
    expect(frameOf()!.getAttribute('style')).not.toMatch(/--ads-tooltip-color:/);
  });
});

describe('Tooltip: focus and ARIA (P5)', () => {
  it('opening never moves focus, and the panel has nothing to focus', async () => {
    await mount();
    trigger().focus();
    await fireEvent.focusIn(trigger());
    await tick();
    expect(document.activeElement).toBe(trigger());
    expect(panelOf()!.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
  });

  it('role="tooltip" and an id are on the frame, the one that contains the visible box', async () => {
    await mountOpen();
    expect(frameOf()!.getAttribute('role')).toBe('tooltip');
    expect(frameOf()!.id).not.toBe('');
    expect(frameOf()!.contains(boxOf())).toBe(true);
  });

  it('aria-describedby: set while the tip is shown, removed when it closes and when it is not there', async () => {
    await mount();
    expect(trigger().hasAttribute('aria-describedby')).toBe(false);
    await fireEvent.focusIn(trigger());
    await tick();
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
    await fireEvent.focusOut(trigger());
    await tick();
    expect(trigger().hasAttribute('aria-describedby')).toBe(false);
  });

  it('aria-describedby: a value the consumer set is kept, and restored when the tip closes', async () => {
    await mountOpen({ describedBy: 'hint' });
    await waitFor(() => expect(trigger().getAttribute('aria-describedby')).toBe(`hint ${frameOf()!.id}`));
    await fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(trigger().getAttribute('aria-describedby')).toBe('hint'));
  });

  it('aria-describedby: a rewrite of the attribute by the consumer does not drop the tooltip', async () => {
    await mountOpen({ describedBy: 'hint' });
    await waitFor(() => expect(trigger().getAttribute('aria-describedby')).toContain(frameOf()!.id));
    await fireEvent.click(screen.getByTestId('rewrite'));
    await waitFor(() => expect(trigger().getAttribute('aria-describedby')).toBe(`other ${frameOf()!.id}`));
  });

  it('has no axe violations when open and when closed', async () => {
    const { rerender } = await mountOpen({ 'aria-label': 'x' });
    for (const state of [true, false]) {
      await rerender({ open: state });
      await tick();
      const result = await axe.run(document.body, { rules: { region: { enabled: false } } });
      expect(result.violations.map((v) => v.id)).toEqual([]);
    }
  });
});

describe('Tooltip: around the child', () => {
  it('a tooltip around a label with a checkbox opens on the wrapper, whichever part is entered', async () => {
    vi.useFakeTimers();
    await mount({ mode: 'checkbox' });
    fire(wrapper(), 'mouseenter');
    await vi.advanceTimersByTimeAsync(100);
    await tick();
    expect(parentOpen()).toBe('true');
    // moving from the box to its text sends no event to the wrapper
    fire(screen.getByTestId('box'), 'mouseout');
    fire(screen.getByTestId('label-text'), 'mouseover');
    await vi.advanceTimersByTimeAsync(500);
    expect(parentOpen()).toBe('true');
  });
});

describe('Tooltip: where aria-describedby goes', () => {
  it('a focusable trigger gets it itself', async () => {
    await mountOpen();
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
  });

  it('a label with an input: the input gets it, because that is the element a screen reader reads', async () => {
    await mountOpen({ mode: 'checkbox' });
    expect(screen.getByTestId('box').getAttribute('aria-describedby')).toBe(frameOf()!.id);
    expect(trigger().hasAttribute('aria-describedby')).toBe(false);
  });

  it('a Select: the field gets it, not the box around it', async () => {
    await mountOpen({ mode: 'select' });
    expect(screen.getByRole('combobox').getAttribute('aria-describedby')).toBe(frameOf()!.id);
  });

  it('a trigger with nothing to focus (a span, a disabled button) gets it itself', async () => {
    await mountOpen({ mode: 'span' });
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
    document.body.innerHTML = '';
    await mountOpen({ mode: 'disabled' });
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
  });

  it('a loading Button stays focusable, so the tip opens on focus and describes it', async () => {
    await mount({ mode: 'loading' });
    await fireEvent.focusIn(trigger());
    await tick();
    expect(trigger().getAttribute('aria-describedby')).toBe(frameOf()!.id);
  });
});

describe('Tooltip: inside another popup (R13)', () => {
  const outerOpen = () => screen.getByTestId('outer-open').textContent;
  const tipOpen = () => screen.getByTestId('tip-open').textContent;

  it('a press in the tip belongs to the popup it was opened from, which stays open', async () => {
    render(TooltipNestedHarness);
    await tick();
    await fireEvent.click(screen.getByTestId('inner'));
    await tick();
    expect(tipOpen()).toBe('true');
    press(document.querySelector('[role="tooltip"]')!);
    await tick();
    expect(tipOpen()).toBe('true');
    expect(outerOpen()).toBe('true');
  });

  it('Escape closes the tip first, and the popup it was opened from on the next one', async () => {
    render(TooltipNestedHarness);
    await tick();
    await fireEvent.click(screen.getByTestId('inner'));
    await tick();
    keydown('Escape');
    await tick();
    expect(tipOpen()).toBe('false');
    expect(outerOpen()).toBe('true');
    keydown('Escape');
    await tick();
    expect(outerOpen()).toBe('false');
  });

  it('a press outside closes both', async () => {
    render(TooltipNestedHarness);
    await tick();
    await fireEvent.click(screen.getByTestId('inner'));
    await tick();
    press(screen.getByTestId('outside'));
    await tick();
    expect(tipOpen()).toBe('false');
    expect(outerOpen()).toBe('false');
  });
});

describe('Tooltip on the server (R16)', () => {
  it('renders the wrapper and the child, and no panel', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/TooltipHarness.svelte', props: { title: 'Tip', open: true } }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('ads-tooltip-trigger');
    expect(html).toContain('Trigger');
    expect(html).not.toContain('role="tooltip"');
    expect(html).not.toContain('aria-describedby');
  });
});
