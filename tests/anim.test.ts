// The two ways a panel comes and goes (specs/overlay.md, A1 and A2). jsdom has no animations and no layout, so the style that
// says "there is an animation" and `Element.animate` are stubs; the real thing is measured in a browser (e2e/popup.spec.ts,
// e2e/message.spec.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForLeave } from '../src/lib/internal/anim/leave';
import { motionAllowed, playEnter, playFlip, playLeave, readTops } from '../src/lib/internal/anim/motion';

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

describe('motion (A2)', () => {
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    animate = vi.fn(() => ({ finished: Promise.resolve() }));
    (Element.prototype as unknown as { animate: unknown }).animate = animate;
  });

  afterEach(() => {
    delete (Element.prototype as unknown as { animate?: unknown }).animate;
  });

  const rows = () => {
    const slot = document.createElement('div');
    const item = document.createElement('div');
    slot.append(item);
    document.body.append(slot);
    return { slot, item };
  };

  /** The keyframes of a call to `animate`. */
  const frames = (call: number) => animate.mock.calls[call][0] as { transform?: string }[];

  it('the distance is the value of the token it is given', () => {
    stubStyle({ '--ads-test-offset': '24px', '--ads-motion-duration': '0.2s' });
    const { slot, item } = rows();
    playEnter(slot, item, false, { offsetToken: '--ads-test-offset' });
    expect(frames(0)[0].transform).toBe('translateY(-24px)');
  });

  it('the distance is 64 px when no token is given, or the one given has no value', async () => {
    const { slot, item } = rows();
    playEnter(slot, item, false);
    expect(frames(0)[0].transform).toBe('translateY(-64px)');
    playEnter(slot, item, false, { offsetToken: '--ads-missing' });
    expect(frames(1)[0].transform).toBe('translateY(-64px)');
    await playLeave(slot, item);
    expect(frames(2)[0].transform).toBe('translateY(0)');
    expect(frames(2)[1].transform).toBe('translateY(-64px)');
  });

  it('a closing row slides by the token it is given and resolves when both animations end', async () => {
    stubStyle({ '--ads-test-offset': '10px' });
    const { slot, item } = rows();
    await playLeave(slot, item, { offsetToken: '--ads-test-offset' });
    expect(frames(0)[1].transform).toBe('translateY(-10px)');
  });

  it('a closing row resolves even when an animation is cancelled', async () => {
    animate.mockImplementation(() => ({ finished: Promise.reject(new Error('cancelled')) }));
    const { slot, item } = rows();
    await expect(playLeave(slot, item)).resolves.toBeUndefined();
  });

  it('the motion token may be in seconds or in milliseconds, and falls back to 200 ms when it has no value', () => {
    const { slot, item } = rows();
    stubStyle({ '--ads-motion-duration': '300ms' });
    playEnter(slot, item, false);
    expect((animate.mock.calls[0][1] as { duration: number }).duration).toBe(300);
    vi.restoreAllMocks();
    stubStyle({ '--ads-motion-duration': '0.5s' });
    playEnter(slot, item, false);
    expect((animate.mock.calls[1][1] as { duration: number }).duration).toBe(500);
    vi.restoreAllMocks();
    stubStyle({ '--ads-motion-duration': '' });
    playEnter(slot, item, false);
    expect((animate.mock.calls[2][1] as { duration: number }).duration).toBe(200);
  });

  it('with shift the slot grows from nothing, and without it only the box moves', () => {
    stubStyle({ paddingBlockEnd: '16px' });
    const { slot, item } = rows();
    slot.getBoundingClientRect = () => ({ height: 40 }) as DOMRect;
    playEnter(slot, item, false);
    expect(animate).toHaveBeenCalledTimes(1);
    playEnter(slot, item, true);
    expect(animate).toHaveBeenCalledTimes(3);
    // The slot grows to its measured height and its gap, the gap being part of the row.
    expect(animate.mock.calls[2][0]).toEqual([
      { height: '0px', paddingBlockEnd: '0px' },
      { height: '40px', paddingBlockEnd: '16px' }
    ]);
  });

  it('A3: each side gives its slide, in and out', async () => {
    const { slot, item } = rows();
    const cases = [
      ['top', 'translateY(-64px)', 'translateY(0)'],
      ['bottom', 'translateY(64px)', 'translateY(0)'],
      ['left', 'translateX(-64px)', 'translateX(0)'],
      ['right', 'translateX(64px)', 'translateX(0)']
    ] as const;
    let call = 0;
    for (const [from, away, home] of cases) {
      playEnter(slot, item, false, { from });
      expect(frames(call).map((frame) => frame.transform)).toEqual([away, home]);
      call += 1;
      await playLeave(slot, item, { from });
      expect(frames(call).map((frame) => frame.transform)).toEqual([home, away]);
      call += 2; // the box and the slot
    }
  });

  it('A3: gap start animates the padding at the start of the slot and not the one at the end', async () => {
    stubStyle({ paddingBlockStart: '16px', paddingBlockEnd: '0px' });
    const { slot, item } = rows();
    slot.getBoundingClientRect = () => ({ height: 40 }) as DOMRect;
    playEnter(slot, item, true, { gap: 'start' });
    expect(animate.mock.calls[1][0]).toEqual([
      { height: '0px', paddingBlockStart: '0px' },
      { height: '40px', paddingBlockStart: '16px' }
    ]);
    await playLeave(slot, item, { gap: 'start' });
    expect(animate.mock.calls[3][0]).toEqual([
      { height: '40px', paddingBlockStart: '16px' },
      { height: '0px', paddingBlockStart: '0px' }
    ]);
  });

  it('readTops reads the top of each row by its id, and playFlip slides the rows that moved from there', () => {
    const list = document.createElement('div');
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.dataset.rowId = 'a';
    second.dataset.rowId = 'b';
    list.append(first, second);
    document.body.append(list);
    let top = 100;
    first.getBoundingClientRect = () => ({ top }) as DOMRect;
    second.getBoundingClientRect = () => ({ top: 200 }) as DOMRect;
    const before = readTops(list);
    expect([...before.entries()]).toEqual([
      ['a', 100],
      ['b', 200]
    ]);
    top = 60;
    playFlip(list, before);
    // Only the row that moved slides, from where it was to where it is.
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0]).toEqual([{ transform: 'translateY(40px)' }, { transform: 'translateY(0)' }]);
  });

  it('playFlip leaves a row that is new, and a row that moved less than half a pixel', () => {
    const list = document.createElement('div');
    const old = document.createElement('div');
    const added = document.createElement('div');
    old.dataset.rowId = 'old';
    added.dataset.rowId = 'new';
    list.append(old, added);
    document.body.append(list);
    old.getBoundingClientRect = () => ({ top: 10.3 }) as DOMRect;
    added.getBoundingClientRect = () => ({ top: 50 }) as DOMRect;
    playFlip(list, new Map([['old', 10]]));
    expect(animate).not.toHaveBeenCalled();
  });

  it('no motion without Element.animate, and none for a user who prefers reduced motion', async () => {
    delete (Element.prototype as unknown as { animate?: unknown }).animate;
    expect(motionAllowed()).toBe(false);
    const { slot, item } = rows();
    playEnter(slot, item, false);
    await expect(playLeave(slot, item)).resolves.toBeUndefined();

    (Element.prototype as unknown as { animate: unknown }).animate = animate;
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    expect(motionAllowed()).toBe(false);
    playEnter(slot, item, false);
    playFlip(slot, new Map());
    expect(animate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
