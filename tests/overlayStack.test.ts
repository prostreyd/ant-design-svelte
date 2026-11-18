// The stack of open layers (specs/overlay.md, O4): Escape and Tab go to the topmost one.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openOverlays, registerOverlay, type OverlayLayer } from '../src/lib/internal/overlay/stack';

const removers: (() => void)[] = [];

afterEach(() => {
  while (removers.length) removers.pop()?.();
  document.body.innerHTML = '';
});

function open(options: Partial<OverlayLayer> = {}): { layer: OverlayLayer; close: () => void; root: HTMLElement } {
  const root = document.createElement('div');
  root.tabIndex = -1;
  root.innerHTML = '<button class="a">a</button><button class="b">b</button>';
  document.body.append(root);
  const layer: OverlayLayer = {
    root: () => root,
    escape: () => true,
    trap: () => true,
    dismiss: vi.fn(),
    ...options
  };
  const close = registerOverlay(layer);
  removers.push(close);
  return { layer, close, root };
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('the stack (O4)', () => {
  it('lists the open layers, the oldest first, and forgets one that closed', () => {
    const one = open();
    const two = open();
    expect(openOverlays()).toEqual([one.layer, two.layer]);
    one.close();
    expect(openOverlays()).toEqual([two.layer]);
  });

  it('closing twice removes nothing more', () => {
    const one = open();
    const two = open();
    one.close();
    one.close();
    expect(openOverlays()).toEqual([two.layer]);
  });

  it('Escape closes the topmost layer only, and the key is cancelled', () => {
    const lower = open();
    const upper = open();
    const event = press('Escape');
    expect(upper.layer.dismiss).toHaveBeenCalledExactlyOnceWith('escape');
    expect(lower.layer.dismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('the layer below takes Escape back when the one over it has closed', () => {
    const lower = open();
    const upper = open();
    upper.close();
    press('Escape');
    expect(lower.layer.dismiss).toHaveBeenCalledTimes(1);
  });

  it('a layer that does not close on Escape lets the key pass, and does not hand it to the layer below', () => {
    const lower = open();
    const upper = open({ escape: () => false });
    const event = press('Escape');
    expect(upper.layer.dismiss).not.toHaveBeenCalled();
    expect(lower.layer.dismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('a key that was already handled is not for the layer: a popup that used Escape says so with preventDefault', () => {
    const { layer } = open();
    // A listener on the document runs before the one on the window, as the listener of the popups does.
    const popup = (event: Event) => event.preventDefault();
    document.addEventListener('keydown', popup);
    press('Escape');
    document.removeEventListener('keydown', popup);
    expect(layer.dismiss).not.toHaveBeenCalled();
  });

  it('a key that ends an IME composition is not for the layer', () => {
    const { layer } = open();
    press('Escape', { isComposing: true });
    expect(layer.dismiss).not.toHaveBeenCalled();
  });

  it('other keys do nothing', () => {
    const { layer } = open();
    const event = press('a');
    expect(layer.dismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('Tab on the last element of the topmost layer goes to its first', () => {
    open();
    const upper = open();
    (upper.root.querySelector('.b') as HTMLElement).focus();
    const event = press('Tab', {}, document.activeElement as HTMLElement);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(upper.root.querySelector('.a'));
  });

  it('Tab is not kept in a layer that does not trap, and is not handed to the layer below', () => {
    const lower = open();
    const upper = open({ trap: () => false });
    (upper.root.querySelector('.b') as HTMLElement).focus();
    const event = press('Tab', {}, document.activeElement as HTMLElement);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(upper.root.querySelector('.b'));
    expect(lower.root.contains(document.activeElement)).toBe(false);
  });

  it('a layer whose box is gone does not take Tab', () => {
    const { layer } = open({ root: () => null });
    const event = press('Tab');
    expect(event.defaultPrevented).toBe(false);
    expect(layer.dismiss).not.toHaveBeenCalled();
  });

  it('with no layer open nothing listens: the listener is added with the first layer and removed with the last', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const one = open();
    const two = open();
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    one.close();
    expect(remove.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);
    two.close();
    expect(remove.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    expect(openOverlays()).toHaveLength(0);
    add.mockRestore();
    remove.mockRestore();
  });
});
