import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { popupTriggers, type PopupTriggerOptions } from '../src/lib/internal/popup/triggers';

let cleanup: (() => void) | undefined;
let anchor: HTMLElement;
let panel: HTMLElement;
let isOpen: boolean;
let setOpen: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  anchor = document.createElement('button');
  panel = document.createElement('div');
  document.body.append(anchor, panel);
  isOpen = false;
  setOpen = vi.fn((open: boolean) => {
    isOpen = open;
  });
});

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function attach(options: Partial<PopupTriggerOptions> = {}): void {
  cleanup = popupTriggers({
    trigger: ['hover'],
    open: () => isOpen,
    setOpen: setOpen as PopupTriggerOptions['setOpen'],
    panel: () => panel,
    ...options
  })(anchor) as (() => void) | undefined;
}

const fire = (target: Element, type: string, init: MouseEventInit | FocusEventInit = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: type !== 'mouseenter' && type !== 'mouseleave', cancelable: true, ...init }));

describe('popupTriggers: hover (R8)', () => {
  it('opens after the enter delay, 0.1 seconds by default', () => {
    attach();
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(99);
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true, { source: 'trigger' });
  });

  it('closes after the leave delay', () => {
    attach();
    isOpen = true;
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(99);
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setOpen).toHaveBeenCalledWith(false, { source: 'trigger' });
  });

  it('the delays are in seconds and can differ', () => {
    attach({ mouseEnterDelay: 0.5, mouseLeaveDelay: 0.25 });
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(499);
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setOpen).toHaveBeenCalledTimes(1);
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(250);
    expect(setOpen).toHaveBeenCalledTimes(2);
  });

  it('a delay of 0 acts at once', () => {
    attach({ mouseEnterDelay: 0, mouseLeaveDelay: 0 });
    fire(anchor, 'mouseenter');
    expect(setOpen).toHaveBeenCalledWith(true, { source: 'trigger' });
    fire(anchor, 'mouseleave');
    expect(setOpen).toHaveBeenCalledWith(false, { source: 'trigger' });
  });

  it('leaving before the enter delay passed cancels the opening', () => {
    attach();
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(50);
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(500);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('coming back before the leave delay passed keeps it open', () => {
    attach();
    isOpen = true;
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(50);
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(500);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('the pointer can cross the gap to the panel: it stays open while the pointer is on the panel', () => {
    attach();
    isOpen = true;
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(50);
    fire(panel, 'mouseenter');
    vi.advanceTimersByTime(1000);
    expect(setOpen).not.toHaveBeenCalled();
    fire(panel, 'mouseleave');
    vi.advanceTimersByTime(100);
    expect(setOpen).toHaveBeenCalledWith(false, { source: 'trigger' });
  });

  it('does not ask for a state it already has', () => {
    attach();
    isOpen = true;
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(500);
    expect(setOpen).not.toHaveBeenCalled();
  });
});

describe('popupTriggers: the compatibility mouse events of a tap', () => {
  const press = (pointerType: string) => {
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    anchor.dispatchEvent(event);
  };

  it('a mouseleave right after a touch does not close what the tap opened', () => {
    attach({ trigger: ['hover'] });
    press('touch');
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(100);
    expect(setOpen).toHaveBeenCalledTimes(1);
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(1000);
    expect(setOpen).toHaveBeenCalledTimes(1);
  });

  it('a mouseleave a while after the touch is a real one and closes it', () => {
    attach({ trigger: ['hover'] });
    press('touch');
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(900);
    fire(anchor, 'mouseleave');
    vi.advanceTimersByTime(100);
    expect(setOpen).toHaveBeenLastCalledWith(false, { source: 'trigger' });
  });

  it('a mouse or a pen press does not hold the tip open', () => {
    for (const pointerType of ['mouse', 'pen']) {
      setOpen.mockClear();
      isOpen = false;
      attach({ trigger: ['hover'] });
      press(pointerType);
      fire(anchor, 'mouseenter');
      vi.advanceTimersByTime(100);
      fire(anchor, 'mouseleave');
      vi.advanceTimersByTime(100);
      expect(setOpen.mock.calls.map((call) => call[0]), pointerType).toEqual([true, false]);
      cleanup?.();
    }
  });
});

describe('popupTriggers: focus', () => {
  it('opens on focus and closes on blur, with no delay', () => {
    attach({ trigger: ['focus'] });
    fire(anchor, 'focusin');
    expect(setOpen).toHaveBeenCalledWith(true, { source: 'trigger' });
    fire(anchor, 'focusout');
    expect(setOpen).toHaveBeenLastCalledWith(false, { source: 'trigger' });
  });

  it('focus moving into the panel keeps it open', () => {
    attach({ trigger: ['focus'] });
    isOpen = true;
    const link = document.createElement('a');
    panel.append(link);
    anchor.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: link }));
    expect(setOpen).not.toHaveBeenCalled();
    anchor.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(setOpen).toHaveBeenCalledWith(false, { source: 'trigger' });
  });

  it('hover does not react to focus', () => {
    attach({ trigger: ['hover'] });
    fire(anchor, 'focusin');
    expect(setOpen).not.toHaveBeenCalled();
  });
});

describe('popupTriggers: click and context menu', () => {
  it('click toggles', () => {
    attach({ trigger: ['click'] });
    fire(anchor, 'click');
    expect(setOpen).toHaveBeenLastCalledWith(true, { source: 'trigger' });
    fire(anchor, 'click');
    expect(setOpen).toHaveBeenLastCalledWith(false, { source: 'trigger' });
    expect(setOpen).toHaveBeenCalledTimes(2);
  });

  it('the context menu opens at the pointer and cancels the browser menu', () => {
    const onpoint = vi.fn();
    attach({ trigger: ['contextMenu'], onpoint });
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 33, clientY: 44 });
    anchor.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onpoint).toHaveBeenCalledWith({ x: 33, y: 44 });
    expect(setOpen).toHaveBeenCalledWith(true, { source: 'trigger' });
  });

  it('a second right click while open asks to place the popup again but keeps it open', () => {
    const onpoint = vi.fn();
    attach({ trigger: ['contextMenu'], onpoint });
    isOpen = true;
    anchor.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 6 }));
    expect(onpoint).toHaveBeenCalledWith({ x: 5, y: 6 });
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('triggers combine: hover and click', () => {
    attach({ trigger: ['hover', 'click'], mouseEnterDelay: 0 });
    fire(anchor, 'mouseenter');
    expect(setOpen).toHaveBeenCalledWith(true, { source: 'trigger' });
    fire(anchor, 'click');
    expect(setOpen).toHaveBeenLastCalledWith(false, { source: 'trigger' });
  });
});

describe('popupTriggers: no triggers, disabled and cleanup', () => {
  it('an empty list means the popup is only controlled', () => {
    attach({ trigger: [] });
    for (const type of ['mouseenter', 'focusin', 'click', 'contextmenu']) fire(anchor, type);
    vi.advanceTimersByTime(1000);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('disabled does nothing', () => {
    attach({ trigger: ['hover', 'click', 'focus', 'contextMenu'], disabled: true });
    for (const type of ['mouseenter', 'focusin', 'click', 'contextmenu']) fire(anchor, type);
    vi.advanceTimersByTime(1000);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('cleanup removes the listeners and cancels a pending delay', () => {
    attach({ trigger: ['hover', 'click'] });
    fire(anchor, 'mouseenter');
    cleanup?.();
    cleanup = undefined;
    vi.advanceTimersByTime(1000);
    fire(anchor, 'click');
    fire(anchor, 'mouseenter');
    vi.advanceTimersByTime(1000);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('cleanup also removes the listeners it added to the panel', () => {
    attach();
    isOpen = true;
    fire(anchor, 'mouseleave');
    cleanup?.();
    cleanup = undefined;
    fire(panel, 'mouseleave');
    vi.advanceTimersByTime(1000);
    expect(setOpen).not.toHaveBeenCalled();
  });
});
