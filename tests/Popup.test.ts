import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openLayers } from '../src/lib/internal/popup/layers';
import PopupHarness from './fixtures/PopupHarness.svelte';
import PopupNestedHarness from './fixtures/PopupNestedHarness.svelte';

// jsdom has no layout: every rectangle is empty. The tests give the anchor a rectangle and the panel a
// size, so the placement can be checked with numbers (the math itself is in popupPlacement.test.ts).
let anchorRect = { left: 400, top: 300, width: 100, height: 40 };
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

beforeEach(() => {
  anchorRect = { left: 400, top: 300, width: 100, height: 40 };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const r = this.getAttribute('data-testid') === 'anchor' ? anchorRect : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
  });
  const isPanel = (element: HTMLElement) => element.classList.contains('ads-popup');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return isPanel(this) ? 200 : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return isPanel(this) ? 100 : 0; } });
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 800 });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete (window as unknown as Record<string, unknown>).visualViewport;
  vi.useRealTimers();
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalWidth);
  if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalHeight);
  delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
  document.body.innerHTML = '';
});

const panelOf = () => document.querySelector<HTMLElement>('.ads-popup');
const frameOf = () => document.querySelector<HTMLElement>('.ads-popup-frame');
const press = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
const toggle = () => fireEvent.click(screen.getByTestId('toggle'));
const parentOpen = () => screen.getByTestId('parent-open').textContent;
const keydown = (key: string) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

async function mountOpen(props: Record<string, unknown> = {}) {
  const view = render(PopupHarness, { props: { open: true, placement: 'bottomLeft', ...props } });
  await tick();
  return view;
}

describe('Popup: rendering and lifecycle (R10, R11, R16)', () => {
  it('renders no panel before the first opening', async () => {
    render(PopupHarness, { props: { open: false } });
    await tick();
    expect(panelOf()).toBeNull();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('open: the panel is moved to document.body, out of the place where it is written', async () => {
    const { container } = await mountOpen();
    const panel = panelOf()!;
    expect(panel.parentElement).toBe(document.body);
    expect(container.contains(panel)).toBe(false);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('container as an element moves the panel into it', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    await mountOpen({ container: target });
    expect(panelOf()!.parentElement).toBe(target);
  });

  it('container as a function receives the anchor element', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    const container = vi.fn(() => target);
    await mountOpen({ container });
    expect(container).toHaveBeenCalledWith(screen.getByTestId('anchor'));
    expect(panelOf()!.parentElement).toBe(target);
  });

  it('unmounting the component removes the panel from its container, wherever it was moved to', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    const view = await mountOpen({ container: target });
    expect(target.querySelector('.ads-popup')).not.toBeNull();
    view.unmount();
    expect(document.querySelector('.ads-popup')).toBeNull();
  });

  it('a popup without children is an empty frame', async () => {
    await mountOpen({ mode: 'empty' });
    expect(frameOf()).not.toBeNull();
    expect(frameOf()!.textContent?.trim()).toBe('');
  });

  it('a null anchor renders nothing, even when open', async () => {
    await mountOpen({ withAnchor: false });
    expect(panelOf()).toBeNull();
  });

  it('closing hides the panel and keeps the content mounted', async () => {
    await mountOpen();
    await toggle();
    expect(parentOpen()).toBe('false');
    expect(panelOf()!.hidden).toBe(true);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    await toggle();
    expect(panelOf()!.hidden).toBe(false);
  });

  it('destroyOnHidden removes the content on every close and brings it back', async () => {
    await mountOpen({ destroyOnHidden: true });
    await toggle();
    await waitFor(() => expect(panelOf()).toBeNull());
    expect(screen.queryByTestId('content')).toBeNull();
    await toggle();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('the panel is exposed through bind:panel', async () => {
    render(PopupHarness, { props: { open: false } });
    expect(screen.getByTestId('has-panel').textContent).toBe('no');
    await toggle();
    await tick();
    expect(screen.getByTestId('has-panel').textContent).toBe('yes');
  });

  it('opening does not move focus (R12)', async () => {
    render(PopupHarness, { props: { open: false } });
    const anchor = screen.getByTestId('anchor');
    anchor.focus();
    await toggle();
    await tick();
    expect(panelOf()).not.toBeNull();
    expect(document.activeElement).toBe(anchor);
  });

  it('popups of equal z-index stack in the order of opening (R10)', async () => {
    render(PopupNestedHarness);
    await fireEvent.click(screen.getByTestId('open-outer'));
    await fireEvent.click(screen.getByTestId('open-second'));
    await tick();
    const order = () => [...document.querySelectorAll('.ads-popup-frame')].map((node) => node.getAttribute('data-testid'));
    expect(order().slice(-2)).toEqual(['outer-frame', 'second-frame']);
    press(document.body);
    await tick();
    await fireEvent.click(screen.getByTestId('open-outer'));
    await tick();
    expect(order().slice(-1)).toEqual(['outer-frame']);
  });
});

describe('Popup: placement (R1, R2, R4, R5, R6, R15)', () => {
  it('places the panel next to the anchor', async () => {
    await mountOpen();
    const panel = panelOf()!;
    expect(panel.style.left).toBe('400px');
    expect(panel.style.top).toBe('344px');
    expect(panel).toHaveAttribute('data-positioned');
  });

  it('puts the final placement and side on the frame, and reports a change of it once', async () => {
    const onplacement = vi.fn();
    await mountOpen({ onplacement });
    expect(frameOf()).toHaveAttribute('data-placement', 'bottomLeft');
    expect(frameOf()).toHaveAttribute('data-side', 'bottom');
    expect(onplacement).toHaveBeenCalledTimes(1);
    expect(onplacement).toHaveBeenCalledWith('bottomLeft');
  });

  it('flips at the edge and says so', async () => {
    anchorRect = { left: 400, top: 740, width: 100, height: 40 };
    const onplacement = vi.fn();
    await mountOpen({ placement: 'bottomLeft', onplacement });
    expect(frameOf()).toHaveAttribute('data-placement', 'topLeft');
    expect(panelOf()!.style.top).toBe('636px');
    expect(onplacement).toHaveBeenCalledWith('topLeft');
  });

  it('autoAdjustOverflow false does not flip', async () => {
    anchorRect = { left: 400, top: 740, width: 100, height: 40 };
    await mountOpen({ placement: 'bottomLeft', autoAdjustOverflow: false });
    expect(frameOf()).toHaveAttribute('data-placement', 'bottomLeft');
    expect(panelOf()!.style.top).toBe('784px');
  });

  it('a point anchor places the panel at the point', async () => {
    await mountOpen({ point: { x: 120, y: 80 } });
    expect(panelOf()!.style.left).toBe('120px');
    expect(panelOf()!.style.top).toBe('84px');
  });

  it('offset is the gap to the anchor', async () => {
    await mountOpen({ offset: 10 });
    expect(panelOf()!.style.top).toBe('350px');
  });

  it('matchWidth: true is the anchor width, a number is a minimum, false is none', async () => {
    const view = await mountOpen({ matchWidth: true });
    expect(panelOf()!.style.minWidth).toBe('100px');
    view.unmount();
    await mountOpen({ matchWidth: 150 });
    expect(panelOf()!.style.minWidth).toBe('150px');
    document.body.innerHTML = '';
    await mountOpen({ matchWidth: 60 });
    expect(panelOf()!.style.minWidth).toBe('100px');
    document.body.innerHTML = '';
    await mountOpen({ matchWidth: false });
    expect(panelOf()!.style.minWidth).toBe('');
  });

  it('an arrow is drawn, hidden from assistive technology, and placed along the panel', async () => {
    await mountOpen({ arrow: true, placement: 'bottom' });
    const arrow = frameOf()!.querySelector('.ads-popup-arrow');
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-offset')).toBe('100px');
  });

  it('pointAtCenter points an aligned arrow at the middle of the anchor', async () => {
    await mountOpen({ arrow: { pointAtCenter: true }, placement: 'bottomLeft' });
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-offset')).toBe('50px');
  });

  it('no arrow by default', async () => {
    await mountOpen();
    expect(frameOf()!.querySelector('.ads-popup-arrow')).toBeNull();
  });

  it('mirrors the placement in a right-to-left layout', async () => {
    await mountOpen({ rtl: true });
    expect(frameOf()).toHaveAttribute('data-placement', 'bottomRight');
    expect(panelOf()!.style.left).toBe('300px');
  });
});

describe('Popup: layers, ids and attributes (R10, R14)', () => {
  it('the dropdown layer by default, and the other two by name', async () => {
    await mountOpen();
    expect(panelOf()).toHaveClass('ads-popup-dropdown');
    document.body.innerHTML = '';
    await mountOpen({ layer: 'tooltip' });
    expect(panelOf()).toHaveClass('ads-popup-tooltip');
    document.body.innerHTML = '';
    await mountOpen({ layer: 'popover' });
    expect(panelOf()).toHaveClass('ads-popup-popover');
  });

  it('zIndex overrides the layer, and removing it brings the layer back', async () => {
    await mountOpen({ zIndex: 1200 });
    expect(panelOf()!.style.zIndex).toBe('1200');
  });

  it('an id is generated, differs between popups, and the id prop overrides it', async () => {
    await mountOpen();
    const first = frameOf()!.id;
    expect(first).toMatch(/^ads-popup-/);
    document.body.innerHTML = '';
    await mountOpen();
    expect(frameOf()!.id).not.toBe('');
    document.body.innerHTML = '';
    await mountOpen({ id: 'my-panel' });
    expect(frameOf()!.id).toBe('my-panel');
  });

  it('the id stays the same after a close and a reopening', async () => {
    await mountOpen();
    const id = frameOf()!.id;
    await toggle();
    await toggle();
    expect(frameOf()!.id).toBe(id);
  });

  it('forwards native attributes, class and style to the frame', async () => {
    await mountOpen({ role: 'region', 'aria-label': 'Panel', 'data-extra': '1', class: 'mine', style: 'color: red' });
    const frame = frameOf()!;
    expect(frame).toHaveAttribute('role', 'region');
    expect(frame).toHaveAttribute('aria-label', 'Panel');
    expect(frame).toHaveAttribute('data-extra', '1');
    expect(frame).toHaveClass('ads-popup-frame', 'mine');
    expect(frame.style.color).toBe('red');
  });

  it('taking a forwarded attribute, the class or the style away takes it off the frame', async () => {
    const view = await mountOpen({ 'aria-label': 'Panel', class: 'mine', style: 'color: red' });
    await view.rerender({ 'aria-label': undefined, class: undefined, style: undefined });
    await tick();
    const frame = frameOf()!;
    expect(frame).not.toHaveAttribute('aria-label');
    expect(frame).not.toHaveClass('mine');
    expect(frame.style.color).toBe('');
  });

  it('an invalid placement or layer throws a RangeError in development', () => {
    expect(() => render(PopupHarness, { props: { open: true, placement: 'middle' as never } })).toThrow(RangeError);
    expect(() => render(PopupHarness, { props: { open: true, layer: 'modal' as never } })).toThrow(RangeError);
  });

  it('and falls back to the defaults in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await mountOpen({ placement: 'middle', layer: 'modal' });
    expect(frameOf()).toHaveAttribute('data-placement', 'top');
    expect(panelOf()).toHaveClass('ads-popup-dropdown');
  });
});

describe('Popup: open state and dismissal (R7, R9, R13)', () => {
  it('an outside press closes it and reports it once, with the source', async () => {
    const onopenchange = vi.fn();
    await mountOpen({ onopenchange });
    press(document.body);
    await tick();
    expect(parentOpen()).toBe('false');
    expect(onopenchange).toHaveBeenCalledTimes(1);
    expect(onopenchange).toHaveBeenCalledWith(false, { source: 'dismiss' });
  });

  it('Escape closes it', async () => {
    const onopenchange = vi.fn();
    await mountOpen({ onopenchange });
    keydown('Escape');
    await tick();
    expect(parentOpen()).toBe('false');
    expect(onopenchange).toHaveBeenCalledWith(false, { source: 'dismiss' });
  });

  it('a press on the anchor or inside the panel does not close it', async () => {
    const onopenchange = vi.fn();
    await mountOpen({ onopenchange });
    press(screen.getByTestId('anchor'));
    press(screen.getByTestId('content'));
    await tick();
    expect(parentOpen()).toBe('true');
    expect(onopenchange).not.toHaveBeenCalled();
  });

  it('dismiss can turn either way off', async () => {
    await mountOpen({ dismiss: { outsidePress: false } });
    press(document.body);
    await tick();
    expect(parentOpen()).toBe('true');
    keydown('Escape');
    await tick();
    expect(parentOpen()).toBe('false');
    document.body.innerHTML = '';
    await mountOpen({ dismiss: { escape: false } });
    keydown('Escape');
    await tick();
    expect(parentOpen()).toBe('true');
    press(document.body);
    await tick();
    expect(parentOpen()).toBe('false');
  });

  it('a change made by the parent does not call onopenchange', async () => {
    const onopenchange = vi.fn();
    await mountOpen({ onopenchange });
    await toggle();
    await toggle();
    expect(onopenchange).not.toHaveBeenCalled();
  });

  it('a controlled popup can refuse: the panel stays, and the callback was still told', async () => {
    const onopenchange = vi.fn();
    await mountOpen({ mode: 'veto', onopenchange });
    keydown('Escape');
    await tick();
    expect(onopenchange).toHaveBeenCalledWith(false, { source: 'dismiss' });
    expect(panelOf()!.hidden).toBe(false);
  });

  it('a closed popup is not in the registry any more', async () => {
    await mountOpen();
    expect(openLayers()).toHaveLength(1);
    await toggle();
    await tick();
    expect(openLayers()).toHaveLength(0);
  });

  it('a popup removed from the page while open is forgotten too', async () => {
    const view = await mountOpen();
    view.unmount();
    expect(openLayers()).toHaveLength(0);
  });

  describe('nested popups', () => {
    async function openBoth() {
      render(PopupNestedHarness);
      await fireEvent.click(screen.getByTestId('open-outer'));
      await tick();
      await fireEvent.click(screen.getByTestId('open-inner'));
      await tick();
    }
    const state = () => screen.getByTestId('state').textContent;

    it('a popup opened from inside another one is nested', async () => {
      await openBoth();
      expect(state()).toBe('true/true/false');
      expect(openLayers().map((layer) => layer.id)).toHaveLength(2);
    });

    it('Escape closes the inner popup first, then the outer one', async () => {
      await openBoth();
      keydown('Escape');
      await tick();
      expect(state()).toBe('true/false/false');
      keydown('Escape');
      await tick();
      expect(state()).toBe('false/false/false');
    });

    it('a press in the inner panel keeps both open', async () => {
      await openBoth();
      press(screen.getByTestId('inner-content'));
      await tick();
      expect(state()).toBe('true/true/false');
    });

    it('a press in the outer panel closes only the inner one', async () => {
      await openBoth();
      press(screen.getByTestId('outer-content'));
      await tick();
      expect(state()).toBe('true/false/false');
    });

    it('a press outside closes both', async () => {
      await openBoth();
      press(document.body);
      await tick();
      expect(state()).toBe('false/false/false');
    });
  });
});

describe('Popup: focus stays where it is (R12)', () => {
  it('preventBlur stops a press in the panel from taking focus', async () => {
    const onmousedown = vi.fn();
    await mountOpen({ preventBlur: true, onmousedown });
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    screen.getByTestId('content').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onmousedown).toHaveBeenCalledTimes(1);
  });

  it('but an input inside the panel still takes focus', async () => {
    await mountOpen({ preventBlur: true });
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    screen.getByTestId('field').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('without preventBlur a press is left alone', async () => {
    await mountOpen();
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    screen.getByTestId('content').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('a press the consumer already handled is not touched again', async () => {
    await mountOpen({ preventBlur: true, onmousedown: (event: MouseEvent) => event.preventDefault() });
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    screen.getByTestId('field').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('Popup: follows the layout (R3)', () => {
  it('moves with the anchor after a resize of the window', async () => {
    await mountOpen();
    anchorRect = { left: 100, top: 100, width: 100, height: 40 };
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(panelOf()!.style.left).toBe('100px'));
    expect(panelOf()!.style.top).toBe('144px');
  });

  it('moves with the anchor after the scroll of any scroll parent, which does not bubble', async () => {
    await mountOpen();
    const scroller = document.createElement('div');
    document.body.append(scroller);
    anchorRect = { left: 400, top: 200, width: 100, height: 40 };
    scroller.dispatchEvent(new Event('scroll', { bubbles: false }));
    await waitFor(() => expect(panelOf()!.style.top).toBe('244px'));
  });

  it('places again when a prop that decides the place changes', async () => {
    await mountOpen();
    // The harness passes `offset` through; a new value is read on the next placement.
    anchorRect = { left: 10, top: 10, width: 10, height: 10 };
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(panelOf()!.style.left).toBe('10px'));
  });

  it('stops listening when closed or removed', async () => {
    const removed = vi.spyOn(document, 'removeEventListener');
    const view = await mountOpen();
    view.unmount();
    expect(removed.mock.calls.some((call) => call[0] === 'scroll')).toBe(true);
  });
});

describe('Popup: the leave animation (R11)', () => {
  /** Reports an animation on every element, so a close has to wait for it. */
  function withAnimation(name = 'ads-popup-out') {
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
      const style = real(element, pseudo);
      return new Proxy(style, {
        get(target, property) {
          if (property === 'animationName') return name;
          const value = Reflect.get(target, property);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });
    });
  }

  it('waits for the animation of the frame, then hides the panel', async () => {
    await mountOpen();
    withAnimation();
    await toggle();
    await tick();
    expect(frameOf()).toHaveAttribute('data-state', 'closed');
    expect(panelOf()!.hidden).toBe(false);
    screen.getByTestId('content').dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(panelOf()!.hidden).toBe(false);
    frameOf()!.dispatchEvent(new Event('animationend'));
    await tick();
    expect(panelOf()!.hidden).toBe(true);
  });

  it('hides the panel anyway after a second, if the animation never ends', async () => {
    await mountOpen();
    withAnimation();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await toggle();
    await tick();
    expect(panelOf()!.hidden).toBe(false);
    vi.advanceTimersByTime(1000);
    await tick();
    expect(panelOf()!.hidden).toBe(true);
  });

  it('opening again during the animation cancels the hiding', async () => {
    await mountOpen();
    withAnimation();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await toggle();
    await tick();
    await toggle();
    await tick();
    expect(frameOf()).toHaveAttribute('data-state', 'open');
    frameOf()!.dispatchEvent(new Event('animationend'));
    vi.advanceTimersByTime(2000);
    await tick();
    expect(panelOf()!.hidden).toBe(false);
  });

  it('an animation named none is no animation: it hides at once', async () => {
    await mountOpen();
    withAnimation('none');
    await toggle();
    await tick();
    expect(panelOf()!.hidden).toBe(true);
  });

  it('hides at once when there is no animation (reduced motion)', async () => {
    await mountOpen();
    await toggle();
    await tick();
    expect(panelOf()!.hidden).toBe(true);
  });
});

describe('Popup: accessibility', () => {
  it('has no axe violations when open, with a named panel', async () => {
    await mountOpen({ role: 'region', 'aria-label': 'Details' });
    const result = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(result.violations).toEqual([]);
  });

  it('has none when closed', async () => {
    render(PopupHarness, { props: { open: false } });
    await tick();
    const result = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});

describe('Popup: when the anchor or the container changes under it', () => {
  it('an anchor that goes away while open takes the panel with it and the popup leaves the registry', async () => {
    await mountOpen();
    await fireEvent.click(screen.getByTestId('remove-anchor'));
    await tick();
    expect(panelOf()).toBeNull();
    expect(openLayers()).toHaveLength(0);
  });

  it('the container can change while it is open: the panel follows', async () => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    document.body.append(first, second);
    await mountOpen({ container: first, swapTo: second });
    expect(panelOf()!.parentElement).toBe(first);
    await fireEvent.click(screen.getByTestId('swap-container'));
    await tick();
    expect(panelOf()!.parentElement).toBe(second);
  });
});

describe('Popup: the container function is asked again when the anchor changes', () => {
  it('a new anchor asks for the container again, and a panel that is already there stays', async () => {
    const section = document.createElement('section');
    document.body.append(section);
    const container = vi.fn(() => section);
    await mountOpen({ container });
    const panel = panelOf()!;
    await fireEvent.click(screen.getByTestId('to-point'));
    await tick();
    expect(container).toHaveBeenLastCalledWith(null);
    expect(panelOf()).toBe(panel);
    expect(panel.parentElement).toBe(section);
  });
});

describe('Popup: the arrow on each side, and a frame with a border (R6)', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)('%s: the frame is on that side and the arrow has an offset', async (placement) => {
    await mountOpen({ arrow: true, placement });
    expect(frameOf()).toHaveAttribute('data-side', placement);
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-offset')).not.toBe('');
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-shift')).toBe('0px');
  });

  /** A frame with a 2px border on all four sides: 100 x 100 outside, 96 x 96 inside. */
  function borderedFrame() {
    const isFrame = (element: Element) => element.classList.contains('ads-popup-frame');
    vi.spyOn(Element.prototype, 'clientLeft', 'get').mockImplementation(function (this: Element) { return isFrame(this) ? 2 : 0; });
    vi.spyOn(Element.prototype, 'clientTop', 'get').mockImplementation(function (this: Element) { return isFrame(this) ? 2 : 0; });
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) { return isFrame(this) ? 196 : 0; });
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) { return isFrame(this) ? 96 : 0; });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.classList.contains('ads-popup') || isFrame(this) ? 200 : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.classList.contains('ads-popup') || isFrame(this) ? 100 : 0; } });
  }

  it.each([
    ['bottom', '98px', '2px'],
    ['top', '98px', '2px'],
    ['left', '48px', '2px'],
    ['right', '48px', '2px']
  ] as const)('%s: the border is taken off the offset (%s) and the arrow sits on the outer edge (%s)', async (placement, offset, shift) => {
    borderedFrame();
    await mountOpen({ arrow: true, placement });
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-offset')).toBe(offset);
    expect(panelOf()!.style.getPropertyValue('--ads-popup-arrow-shift')).toBe(shift);
  });
});

describe('Popup: how it listens to the layout (R3)', () => {
  it('follows an anchor that moves with no event at all, once per frame', async () => {
    await mountOpen();
    anchorRect = { left: 10, top: 20, width: 100, height: 40 };
    await waitFor(() => expect(panelOf()!.style.left).toBe('10px'));
    expect(panelOf()!.style.top).toBe('64px');
  });

  it('several events in one frame ask for one placement', async () => {
    await mountOpen();
    const frames = vi.spyOn(window, 'requestAnimationFrame');
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveBeenCalledTimes(1);
  });

  it('a placement that was asked for is cancelled when the popup goes away', async () => {
    const view = await mountOpen();
    window.dispatchEvent(new Event('resize'));
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    view.unmount();
    expect(cancel.mock.calls.some(([id]) => typeof id === 'number' && id !== 0)).toBe(true);
  });

  it('uses ResizeObserver when there is one: it watches the panel and the anchor, and its callback places the panel', async () => {
    const created: Array<{ callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    class FakeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(public callback: () => void) {
        created.push(this);
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const view = await mountOpen();
    const observer = created[created.length - 1];
    expect(observer.observe).toHaveBeenCalledWith(panelOf());
    expect(observer.observe).toHaveBeenCalledWith(screen.getByTestId('anchor'));
    anchorRect = { left: 77, top: 300, width: 100, height: 40 };
    observer.callback();
    await waitFor(() => expect(panelOf()!.style.left).toBe('77px'));
    view.unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('a point anchor has no element to watch: only the panel is observed', async () => {
    const observed: unknown[] = [];
    class FakeObserver {
      observe = (target: unknown) => void observed.push(target);
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeObserver);
    await mountOpen({ point: { x: 10, y: 10 } });
    expect(observed).toEqual([panelOf()]);
  });

  it('listens to the visual viewport too (the on-screen keyboard), and lets go of it', async () => {
    const viewport = new EventTarget();
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const removed = vi.spyOn(viewport, 'removeEventListener');
    const view = await mountOpen();
    anchorRect = { left: 5, top: 300, width: 100, height: 40 };
    viewport.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(panelOf()!.style.left).toBe('5px'));
    view.unmount();
    expect(removed.mock.calls.map((call) => call[0]).sort()).toEqual(['resize', 'scroll']);
  });
});
