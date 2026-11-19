// The wait for a leave animation (specs/overlay.md, A1). jsdom has no animations, so the style that says "there is an animation"
// is a stub; the real thing is measured in a browser (e2e/popup.spec.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForLeave } from '../src/lib/internal/anim/leave';

const real = window.getComputedStyle.bind(window);

/** Every element reports the given values for the named properties of its computed style. */
function stubStyle(values: Record<string, string>): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
    const style = real(element, pseudo);
    return new Proxy(style, {
      get: (target, key) => {
        if (key === 'getPropertyValue') return (name: string) => values[name] ?? target.getPropertyValue(name);
        return typeof key === 'string' && key in values ? values[key] : Reflect.get(target, key);
      }
    });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('waitForLeave (A1)', () => {
  function animated() {
    stubStyle({ animationName: 'ads-popup-out' });
    const element = document.createElement('div');
    const child = document.createElement('span');
    element.append(child);
    document.body.append(element);
    return { element, child, done: vi.fn() };
  }

  it('waits for the end of the animation of the element, then calls done once', () => {
    const { element, done } = animated();
    waitForLeave(element, done);
    expect(done).not.toHaveBeenCalled();
    element.dispatchEvent(new Event('animationend'));
    expect(done).toHaveBeenCalledTimes(1);
    element.dispatchEvent(new Event('animationend'));
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('a cancelled animation ends the wait too', () => {
    const { element, done } = animated();
    waitForLeave(element, done);
    element.dispatchEvent(new Event('animationcancel'));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('the cancel of another animation of the element (the enter one, interrupted by the change of style) is not the end of the leave', () => {
    const { element, done } = animated();
    waitForLeave(element, done);
    element.dispatchEvent(Object.assign(new Event('animationcancel'), { animationName: 'ads-popup-in' }));
    expect(done).not.toHaveBeenCalled();
    element.dispatchEvent(Object.assign(new Event('animationend'), { animationName: 'ads-popup-out' }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('an element with several animations ends its leave with any of them', () => {
    stubStyle({ animationName: 'fade, ads-popup-out' });
    const element = document.createElement('div');
    document.body.append(element);
    const done = vi.fn();
    waitForLeave(element, done);
    element.dispatchEvent(Object.assign(new Event('animationend'), { animationName: 'ads-popup-out' }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('the end of an animation of something inside the element is not the end of this one', () => {
    const { element, child, done } = animated();
    waitForLeave(element, done);
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(done).not.toHaveBeenCalled();
  });

  it('calls done after a second if the animation never ends', () => {
    const { element, done } = animated();
    waitForLeave(element, done);
    vi.advanceTimersByTime(999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('the wait can be given another length', () => {
    const { element, done } = animated();
    waitForLeave(element, done, 50);
    vi.advanceTimersByTime(50);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('calls done at once, and returns a function that does nothing, when the animation is none', () => {
    stubStyle({ animationName: 'none' });
    const element = document.createElement('div');
    const done = vi.fn();
    const cancel = waitForLeave(element, done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(() => cancel()).not.toThrow();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('calls done at once when there is no element at all', () => {
    const done = vi.fn();
    const cancel = waitForLeave(null, done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(() => cancel()).not.toThrow();
  });

  it('calls done at once when the style names no animation at all', () => {
    stubStyle({ animationName: '' });
    const done = vi.fn();
    waitForLeave(document.createElement('div'), done);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('the cancel function stops every way of being called, and may be called twice', () => {
    const { element, done } = animated();
    const cancel = waitForLeave(element, done);
    cancel();
    cancel();
    element.dispatchEvent(new Event('animationend'));
    element.dispatchEvent(new Event('animationcancel'));
    vi.advanceTimersByTime(5000);
    expect(done).not.toHaveBeenCalled();
  });
});
