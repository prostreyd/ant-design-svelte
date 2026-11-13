import { afterEach, describe, expect, it, vi } from 'vitest';
import { isInsideLayer, openLayers, registerLayer, topmostLayer, type Layer } from '../src/lib/internal/popup/layers';

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  document.body.innerHTML = '';
});

function el<T extends HTMLElement>(tag: string, parent: HTMLElement = document.body): T {
  const node = document.createElement(tag) as T;
  parent.append(node);
  return node;
}

function layer(id: string, panel: HTMLElement | null, anchor: HTMLElement | null, extra: Partial<Layer> = {}): Layer & { dismiss: ReturnType<typeof vi.fn> } {
  const entry = {
    id,
    panel: () => panel,
    anchor: () => anchor,
    outsidePress: () => true,
    escape: () => true,
    dismiss: vi.fn(),
    ...extra
  } as Layer & { dismiss: ReturnType<typeof vi.fn> };
  cleanups.push(registerLayer(entry));
  return entry;
}

const press = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
const escape = (init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...init });
  document.body.dispatchEvent(event);
  return event;
};

describe('layer registry: the stack', () => {
  it('lists the open popups in the order of opening and reports the topmost', () => {
    const a = layer('a', el('div'), el('button'));
    const b = layer('b', el('div'), el('button'));
    expect(openLayers().map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(topmostLayer()).toBe(b);
    expect(openLayers()[0]).toBe(a);
  });

  it('forgets a popup that closed, and unregistering twice is harmless', () => {
    layer('a', el('div'), el('button'));
    const remove = registerLayer({ id: 'b', panel: () => null, anchor: () => null, outsidePress: () => true, escape: () => true, dismiss: () => {} });
    expect(topmostLayer()?.id).toBe('b');
    remove();
    remove();
    expect(topmostLayer()?.id).toBe('a');
  });

  it('is empty, and has no listeners, when nothing is open', () => {
    expect(openLayers()).toHaveLength(0);
    expect(topmostLayer()).toBeUndefined();
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    const remove = registerLayer({ id: 'x', panel: () => null, anchor: () => null, outsidePress: () => true, escape: () => true, dismiss: () => {} });
    expect(added.mock.calls.map((call) => call[0]).sort()).toEqual(['keydown', 'pointerdown']);
    remove();
    expect(removed.mock.calls.map((call) => call[0]).sort()).toEqual(['keydown', 'pointerdown']);
    added.mockRestore();
    removed.mockRestore();
  });

  it('adds the two document listeners once, however many popups are open', () => {
    const added = vi.spyOn(document, 'addEventListener');
    layer('a', el('div'), el('button'));
    layer('b', el('div'), el('button'));
    layer('c', el('div'), el('button'));
    expect(added).toHaveBeenCalledTimes(2);
    added.mockRestore();
  });
});

describe('layer registry: outside press (R9)', () => {
  it('a press outside closes the popup', () => {
    const a = layer('a', el('div'), el('button'));
    press(el('p'));
    expect(a.dismiss).toHaveBeenCalledWith('outsidePress');
  });

  it('a press on the panel or on the anchor is not outside', () => {
    const panel = el('div');
    const anchor = el('button');
    const a = layer('a', panel, anchor);
    press(el('span', panel));
    press(anchor);
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a press on something inside the anchor is not outside', () => {
    const anchor = el('button');
    const a = layer('a', el('div'), anchor);
    press(el('span', anchor));
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a point anchor has no element: only the panel counts', () => {
    const panel = el('div');
    const a = layer('a', panel, null);
    press(panel);
    expect(a.dismiss).not.toHaveBeenCalled();
    press(el('p'));
    expect(a.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a popup that turned outside press off is left open', () => {
    const a = layer('a', el('div'), el('button'), { outsidePress: () => false });
    press(el('p'));
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a press outside everything closes every open popup, the topmost first', () => {
    const order: string[] = [];
    layer('a', el('div'), el('button'), { dismiss: () => void order.push('a') });
    layer('b', el('div'), el('button'), { dismiss: () => void order.push('b') });
    press(el('p'));
    expect(order).toEqual(['b', 'a']);
  });
});

describe('layer registry: nesting (R13)', () => {
  /** A popup opened from a button inside the panel of another popup. */
  function nested() {
    const outerPanel = el('div');
    const outerAnchor = el('button');
    const innerAnchor = el('button', outerPanel);
    const innerPanel = el('div');
    const outer = layer('outer', outerPanel, outerAnchor);
    const inner = layer('inner', innerPanel, innerAnchor);
    return { outer, inner, outerPanel, innerPanel, innerAnchor, outerAnchor };
  }

  it('a press in the inner panel does not close the outer popup', () => {
    const { outer, inner, innerPanel } = nested();
    press(innerPanel);
    expect(inner.dismiss).not.toHaveBeenCalled();
    expect(outer.dismiss).not.toHaveBeenCalled();
  });

  it('a press in the outer panel closes the inner popup but not the outer one', () => {
    const { outer, inner, outerPanel } = nested();
    press(outerPanel);
    expect(inner.dismiss).toHaveBeenCalledWith('outsidePress');
    expect(outer.dismiss).not.toHaveBeenCalled();
  });

  it('a press on the button that opened the inner popup does not close it', () => {
    const { outer, inner, innerAnchor } = nested();
    press(innerAnchor);
    expect(inner.dismiss).not.toHaveBeenCalled();
    expect(outer.dismiss).not.toHaveBeenCalled();
  });

  it('a press outside both closes both', () => {
    const { outer, inner } = nested();
    press(el('p'));
    expect(inner.dismiss).toHaveBeenCalled();
    expect(outer.dismiss).toHaveBeenCalled();
  });

  it('three levels: a press in the innermost panel keeps all three', () => {
    const a = el('div');
    const aAnchor = el('button');
    const bAnchor = el('button', a);
    const b = el('div');
    const cAnchor = el('button', b);
    const c = el('div');
    const layers = [layer('a', a, aAnchor), layer('b', b, bAnchor), layer('c', c, cAnchor)];
    press(c);
    for (const entry of layers) expect(entry.dismiss).not.toHaveBeenCalled();
    expect(isInsideLayer(layers[0], c)).toBe(true);
    expect(isInsideLayer(layers[2], a)).toBe(false);
  });

  it('two unrelated popups are not nested', () => {
    const a = layer('a', el('div'), el('button'));
    const b = layer('b', el('div'), el('button'));
    expect(isInsideLayer(a, b.panel()!)).toBe(false);
  });
});

describe('layer registry: a popup anchored to a point', () => {
  it('has no anchor, so it is nobody\'s child, and does not hide a popup beside it from a press', () => {
    const a = layer('a', el('div'), el('button'));
    const point = layer('point', el('div'), null);
    press(el('p'));
    expect(a.dismiss).toHaveBeenCalledWith('outsidePress');
    expect(point.dismiss).toHaveBeenCalledWith('outsidePress');
    expect(isInsideLayer(a, point.panel()!)).toBe(false);
  });
});

describe('layer registry: Escape (R9, R13)', () => {
  it('closes the topmost popup only', () => {
    const a = layer('a', el('div'), el('button'));
    const b = layer('b', el('div'), el('button'));
    const event = escape();
    expect(b.dismiss).toHaveBeenCalledWith('escape');
    expect(a.dismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('after the topmost closed, the next Escape closes the one below', () => {
    const a = layer('a', el('div'), el('button'));
    const remove = registerLayer({ id: 'b', panel: () => null, anchor: () => null, outsidePress: () => true, escape: () => true, dismiss: () => {} });
    remove();
    escape();
    expect(a.dismiss).toHaveBeenCalledWith('escape');
  });

  it('ignores other keys, a handled key and an IME composition', () => {
    const a = layer('a', el('div'), el('button'));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const handled = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    handled.preventDefault();
    document.body.dispatchEvent(handled);
    escape({ isComposing: true });
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('does nothing, and does not reach below, when the topmost popup ignores Escape', () => {
    const a = layer('a', el('div'), el('button'));
    const b = layer('b', el('div'), el('button'), { escape: () => false });
    const event = escape();
    expect(a.dismiss).not.toHaveBeenCalled();
    expect(b.dismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('layer registry: a touch screen (R9, decision 14)', () => {
  type PointerInit = { pointerType?: string; pointerId?: number; x?: number; y?: number };
  /** A pointer event that jsdom does not know: a plain event with the properties of the pointer. */
  function pointer(type: string, target: Element | Document, init: PointerInit = {}): Event {
    const event = Object.assign(new Event(type, { bubbles: true }), {
      pointerType: init.pointerType ?? 'touch',
      pointerId: init.pointerId ?? 1,
      clientX: init.x ?? 100,
      clientY: init.y ?? 100
    });
    target.dispatchEvent(event);
    return event;
  }

  it('a finger that goes down outside does not close the popup: it may be about to scroll', () => {
    const a = layer('a', el('div'), el('button'));
    pointer('pointerdown', el('p'));
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a tap (down and up in place) outside closes the popup, once', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside);
    pointer('pointerup', outside);
    pointer('pointerup', outside);
    expect(a.dismiss).toHaveBeenCalledTimes(1);
    expect(a.dismiss).toHaveBeenCalledWith('outsidePress');
  });

  it('a tap closes every popup it is outside of, the topmost first', () => {
    const order: string[] = [];
    layer('a', el('div'), el('button'), { dismiss: () => void order.push('a') });
    layer('b', el('div'), el('button'), { dismiss: () => void order.push('b') });
    const outside = el('p');
    pointer('pointerdown', outside);
    pointer('pointerup', outside);
    expect(order).toEqual(['b', 'a']);
  });

  it('a finger that moves more than 10px is a scroll, not a press', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside, { x: 100, y: 300 });
    pointer('pointermove', outside, { x: 100, y: 250 });
    pointer('pointerup', outside, { x: 100, y: 250 });
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a movement within 10px is still a tap, and so is a pointer that goes back', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside, { x: 100, y: 300 });
    pointer('pointermove', outside, { x: 106, y: 306 });
    pointer('pointerup', outside, { x: 106, y: 306 });
    expect(a.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a touch the browser takes for scrolling (pointercancel) is not a press, and a later up does nothing', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside);
    pointer('pointercancel', outside);
    pointer('pointerup', outside);
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('a second finger ends the press: a pinch or a scroll with two fingers', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside, { pointerId: 1 });
    pointer('pointerdown', outside, { pointerId: 2 });
    pointer('pointerup', outside, { pointerId: 1 });
    pointer('pointerup', outside, { pointerId: 2 });
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('the move or the lift of another pointer does not decide the press of this finger', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside, { pointerId: 1, x: 100, y: 300 });
    pointer('pointermove', outside, { pointerId: 7, x: 500, y: 500 });
    pointer('pointerup', outside, { pointerId: 7, x: 500, y: 500 });
    expect(a.dismiss).not.toHaveBeenCalled();
    pointer('pointerup', outside, { pointerId: 1, x: 100, y: 300 });
    expect(a.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a touch on the panel or on the anchor is not outside, and is not tracked at all', () => {
    const panel = el('div');
    const anchor = el('button');
    const a = layer('a', panel, anchor);
    const added = vi.spyOn(document, 'addEventListener');
    pointer('pointerdown', panel);
    pointer('pointerup', panel);
    pointer('pointerdown', anchor);
    pointer('pointerup', anchor);
    expect(a.dismiss).not.toHaveBeenCalled();
    expect(added).not.toHaveBeenCalled();
    added.mockRestore();
  });

  it('a popup that turned outside press off is left open by a tap', () => {
    const a = layer('a', el('div'), el('button'), { outsidePress: () => false });
    const outside = el('p');
    pointer('pointerdown', outside);
    pointer('pointerup', outside);
    expect(a.dismiss).not.toHaveBeenCalled();
  });

  it('the popups that count as outside are those at the touch down: one that closed meanwhile is not asked again, one that opened is not asked', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    const removeA = cleanups.pop()!;
    cleanups.push(removeA);
    pointer('pointerdown', outside);
    const late = layer('late', el('div'), el('button'));
    removeA();
    pointer('pointerup', outside);
    expect(a.dismiss).not.toHaveBeenCalled();
    expect(late.dismiss).not.toHaveBeenCalled();
  });

  it('a node that was removed under the finger is still outside: the answer was given at the touch down', () => {
    const a = layer('a', el('div'), el('button'));
    const outside = el('p');
    pointer('pointerdown', outside);
    outside.remove();
    document.dispatchEvent(Object.assign(new Event('pointerup'), { pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 100 }));
    expect(a.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a mouse and a pen are decided on the press, as before', () => {
    const a = layer('a', el('div'), el('button'));
    pointer('pointerdown', el('p'), { pointerType: 'mouse' });
    expect(a.dismiss).toHaveBeenCalledTimes(1);
    pointer('pointerdown', el('p'), { pointerType: 'pen' });
    expect(a.dismiss).toHaveBeenCalledTimes(2);
  });

  it('the touch listeners come with the touch and go with it; they are not there for a mouse', () => {
    layer('a', el('div'), el('button'));
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    pointer('pointerdown', el('p'), { pointerType: 'mouse' });
    expect(added).not.toHaveBeenCalled();
    const outside = el('p');
    pointer('pointerdown', outside);
    expect(added.mock.calls.map((call) => call[0]).sort()).toEqual(['pointercancel', 'pointermove', 'pointerup']);
    pointer('pointerup', outside);
    expect(removed.mock.calls.map((call) => call[0]).sort()).toEqual(['pointercancel', 'pointermove', 'pointerup']);
    added.mockRestore();
    removed.mockRestore();
  });

  it('the touch listeners are removed when the last popup goes away in the middle of a touch', () => {
    const remove = registerLayer({ id: 'x', panel: () => null, anchor: () => null, outsidePress: () => true, escape: () => true, dismiss: () => {} });
    pointer('pointerdown', el('p'));
    const removed = vi.spyOn(document, 'removeEventListener');
    remove();
    expect(removed.mock.calls.map((call) => call[0]).sort()).toEqual(['keydown', 'pointercancel', 'pointerdown', 'pointermove', 'pointerup']);
    removed.mockRestore();
  });
});
