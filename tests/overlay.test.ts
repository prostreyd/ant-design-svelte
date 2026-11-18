// A layer made modal (specs/overlay.md, O5): the steps, their order, and their undoing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as inert from '../src/lib/internal/overlay/inertOutside';
import { openOverlay } from '../src/lib/internal/overlay/overlay';
import * as lock from '../src/lib/internal/overlay/scrollLock';
import * as stack from '../src/lib/internal/overlay/stack';

const proto = HTMLElement.prototype as unknown as { inert?: boolean };
const closers: (() => void)[] = [];

beforeEach(() => {
  Object.defineProperty(proto, 'inert', { value: false, configurable: true, writable: true });
  document.body.innerHTML =
    '<main id="app"><button id="trigger">open</button></main>' +
    '<div id="wrap"><div id="box" tabindex="-1"><button id="ok">ok</button><button id="cancel">cancel</button></div></div>';
});

afterEach(() => {
  while (closers.length) closers.pop()?.();
  vi.restoreAllMocks();
  delete proto.inert;
  document.body.removeAttribute('style');
  document.body.innerHTML = '';
});

const get = (id: string) => document.getElementById(id) as HTMLElement;

function open(options: Partial<Parameters<typeof openOverlay>[0]> = {}) {
  const close = openOverlay({ root: get('box'), scope: get('wrap'), ...options });
  closers.push(close);
  return close;
}

describe('openOverlay (O5)', () => {
  it('moves focus into the layer, to the box itself by default', () => {
    get('trigger').focus();
    open();
    expect(document.activeElement).toBe(get('box'));
  });

  it('moves focus to the element it is given, or to the one a function returns', () => {
    open({ initialFocus: get('cancel') });
    expect(document.activeElement).toBe(get('cancel'));
    closers.pop()?.();
    open({ initialFocus: () => get('ok') });
    expect(document.activeElement).toBe(get('ok'));
  });

  it('falls back to the box when the function returns nothing', () => {
    open({ initialFocus: () => null });
    expect(document.activeElement).toBe(get('box'));
  });

  it('puts the page behind the layer out of reach, and the mask and the box stay reachable', () => {
    open();
    expect(get('app').hasAttribute('inert')).toBe(true);
    expect(get('wrap').hasAttribute('inert')).toBe(false);
    expect(get('box').hasAttribute('inert')).toBe(false);
  });

  it('the scope is what the layer is made of: with no scope the box alone is it', () => {
    document.body.innerHTML = '<main id="app"></main><div id="wrap"><div id="mask"></div><div id="box" tabindex="-1"></div></div>';
    open({ scope: undefined });
    expect(get('mask').hasAttribute('inert')).toBe(true);
  });

  it('locks the scroll of the body, or of the element it is given, or of nothing', () => {
    const close = open();
    expect(document.body.style.overflow).toBe('hidden');
    close();
    expect(document.body.style.overflow).toBe('');

    const area = get('app');
    open({ lockScroll: area });
    expect(area.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('');
    closers.pop()?.();

    open({ lockScroll: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('can leave the page reachable', () => {
    open({ inertOutside: false });
    expect(get('app').hasAttribute('inert')).toBe(false);
  });

  it('gives Escape to the layer, and asks it first', () => {
    const dismiss = vi.fn();
    let allowed = false;
    open({ dismiss, escape: () => allowed });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(dismiss).not.toHaveBeenCalled();
    allowed = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(dismiss).toHaveBeenCalledExactlyOnceWith('escape');
  });

  it('closes on Escape with no handler without failing, and always by default', () => {
    open();
    expect(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))).not.toThrow();
  });

  it('keeps Tab inside the layer, unless it was told not to', () => {
    open({ initialFocus: get('cancel') });
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    get('cancel').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(get('ok'));
    closers.pop()?.();

    open({ initialFocus: get('cancel'), trapFocus: false });
    const free = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    get('cancel').dispatchEvent(free);
    expect(free.defaultPrevented).toBe(false);
  });

  it('undoes everything on close, and gives focus back to what had it', () => {
    get('trigger').focus();
    const close = open();
    close();
    expect(get('app').hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(stack.openOverlays()).toHaveLength(0);
    expect(document.activeElement).toBe(get('trigger'));
  });

  it('gives focus back after the page is reachable again, because an inert element cannot take it', () => {
    get('trigger').focus();
    const order: string[] = [];
    const trigger = get('trigger');
    const focus = trigger.focus.bind(trigger);
    trigger.focus = (options?: FocusOptions) => {
      order.push(get('app').hasAttribute('inert') ? 'focus while inert' : 'focus after inert');
      focus(options);
    };
    const close = open();
    close();
    expect(order).toEqual(['focus after inert']);
  });

  it('closing twice does nothing the second time', () => {
    get('trigger').focus();
    const close = open();
    close();
    get('cancel').focus();
    close();
    expect(document.activeElement).toBe(get('cancel'));
  });

  it('does not give focus back when it is turned off', () => {
    get('trigger').focus();
    const close = open({ restoreFocus: false });
    close();
    expect(document.activeElement).not.toBe(get('trigger'));
  });

  it('does not give focus back when there was nothing focused before, or what had it is gone', () => {
    (document.activeElement as HTMLElement | null)?.blur();
    open()();
    // Nothing to go back to: focus stays where it is, and the browser takes it off an element that is hidden.
    expect(document.activeElement).toBe(get('box'));

    get('trigger').focus();
    const close = open();
    get('trigger').remove();
    expect(() => close()).not.toThrow();
  });

  it('gives focus back when it was lost to the body, and leaves it where somebody put it elsewhere', () => {
    get('trigger').focus();
    let close = open();
    get('box').blur();
    close();
    expect(document.activeElement).toBe(get('trigger'));

    const elsewhere = document.createElement('input');
    document.body.append(elsewhere);
    close = open();
    elsewhere.focus();
    close();
    expect(document.activeElement).toBe(elsewhere);
  });

  it('opens a second layer over the first, and the first takes Escape back when it closes', () => {
    const lowerDismiss = vi.fn();
    const upperDismiss = vi.fn();
    open({ dismiss: lowerDismiss });
    document.body.insertAdjacentHTML('beforeend', '<div id="wrap2"><div id="box2" tabindex="-1"></div></div>');
    const closeUpper = openOverlay({ root: get('box2'), scope: get('wrap2'), dismiss: upperDismiss });
    closers.push(closeUpper);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(upperDismiss).toHaveBeenCalledTimes(1);
    expect(lowerDismiss).not.toHaveBeenCalled();
    // The lower layer is behind the upper one: out of reach until the upper one closes.
    expect(get('wrap').hasAttribute('inert')).toBe(true);
    closeUpper();
    expect(get('wrap').hasAttribute('inert')).toBe(false);
    expect(get('app').hasAttribute('inert')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(lowerDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('openOverlay when a step throws (O5)', () => {
  it('undoes the steps before it and throws the same error', () => {
    const error = new Error('no stack');
    vi.spyOn(stack, 'registerOverlay').mockImplementation(() => {
      throw error;
    });
    get('trigger').focus();
    expect(() => openOverlay({ root: get('box'), scope: get('wrap') })).toThrow(error);
    expect(get('app').hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(get('trigger'));
  });

  it('runs every undoing even when one throws, then throws the first error', () => {
    const release = vi.fn();
    const first = new Error('first');
    vi.spyOn(inert, 'hideOutside').mockImplementation(() => () => {
      throw first;
    });
    vi.spyOn(lock, 'lockScroll').mockImplementation(() => release);
    const close = openOverlay({ root: get('box'), scope: get('wrap') });
    expect(() => close()).toThrow(first);
    expect(release).toHaveBeenCalledTimes(1);
    expect(stack.openOverlays()).toHaveLength(0);
    expect(() => close()).not.toThrow();
  });
});
