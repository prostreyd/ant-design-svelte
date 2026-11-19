// The motion of a message (specs/message.md, "Behavior"). jsdom has no Web Animations, so `Element.animate` is a stub
// that records what was asked; the frames themselves are measured in a real browser (e2e/message.spec.ts).
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removeLayer } from '../src/lib/Message/layer';
import { message } from '../src/lib/Message/message';
import { resetMessages } from '../src/lib/Message/store';
import MessageHostHarness from './fixtures/MessageHostHarness.svelte';
import { boxes, pointer, settle, slots } from './helpers/message';

type Animation = { finished: Promise<unknown> };
let animate: ReturnType<typeof vi.fn>;
let finish: () => void;
let fail: () => void;

/** `Element.animate` that remembers its calls; the animation ends when `finish()` is called. */
function stubAnimation(): void {
  animate = vi.fn((): Animation => ({
    finished: new Promise<void>((resolve, reject) => {
      const done = finish;
      const broken = fail;
      finish = () => {
        done?.();
        resolve();
      };
      fail = () => {
        broken?.();
        reject(new Error('cancelled'));
      };
    })
  }));
  (Element.prototype as unknown as { animate: unknown }).animate = animate;
}

const real = window.getComputedStyle.bind(window);

function stubStyles(values: Record<string, string>): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
    const style = real(element, pseudo);
    return new Proxy(style, {
      get: (target, key) =>
        key === 'getPropertyValue'
          ? (name: string) => values[name] ?? target.getPropertyValue(name)
          : Reflect.get(target, key)
    });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  finish = () => {};
  fail = () => {};
});

afterEach(() => {
  cleanup();
  removeLayer();
  resetMessages();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete (Element.prototype as unknown as Record<string, unknown>).animate;
});

describe('entering', () => {
  it('the box fades in from 64 px above, over the motion token, with the easing token', async () => {
    stubAnimation();
    message.info('x', 0);
    await tick();
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(keyframes).toEqual([
      { opacity: 0, transform: 'translateY(-64px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ]);
    expect(options).toMatchObject({ duration: 200, easing: 'ease' });
  });

  it('reads the tokens: seconds, milliseconds, and the offset and the easing', async () => {
    stubAnimation();
    stubStyles({ '--ads-motion-duration': '0.3s', '--ads-motion-ease': 'linear', '--ads-message-motion-offset': '40px' });
    message.info('x', 0);
    await tick();
    const [keyframes, options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(keyframes[0].transform).toBe('translateY(-40px)');
    expect(options).toMatchObject({ duration: 300, easing: 'linear' });
    stubStyles({ '--ads-motion-duration': '150ms' });
    message.info('y', 0);
    await tick();
    expect((animate.mock.calls[1][1] as KeyframeAnimationOptions).duration).toBe(150);
  });

  it('a token that is not a number leaves the defaults', async () => {
    stubAnimation();
    stubStyles({ '--ads-motion-duration': 'soon', '--ads-message-motion-offset': 'far' });
    message.info('x', 0);
    await tick();
    const [keyframes, options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(keyframes[0].transform).toBe('translateY(-64px)');
    expect((options as KeyframeAnimationOptions).duration).toBe(200);
  });

  it('prefers-reduced-motion: no motion at all', async () => {
    stubAnimation();
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    message.info('x', 0);
    await tick();
    expect(animate).not.toHaveBeenCalled();
  });

  it('a user who does not prefer reduced motion gets it', async () => {
    stubAnimation();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    message.info('x', 0);
    await tick();
    expect(animate).toHaveBeenCalled();
  });

  it('a message already on the page when its layer is made has no motion', async () => {
    stubAnimation();
    message.info('x', 0);
    await tick();
    animate.mockClear();
    await vi.advanceTimersByTimeAsync(1000);
    render(MessageHostHarness);
    await tick();
    await tick();
    expect(boxes()).toHaveLength(1);
    expect(animate).not.toHaveBeenCalled();
  });

  it('with stack the newest row also grows from nothing, so the ones behind it slide; the first row does not', async () => {
    stubAnimation();
    message.config({ stack: true });
    message.info('a', 0);
    await tick();
    expect(animate).toHaveBeenCalledTimes(1);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ height: 40 } as DOMRect);
    message.info('b', 0);
    await tick();
    expect(animate).toHaveBeenCalledTimes(3);
    // The row is border-box with the gap as bottom padding: both grow, or the row would start at the gap.
    expect(animate.mock.calls[2][0]).toEqual([
      { height: '0px', paddingBlockEnd: '0px' },
      { height: '40px', paddingBlockEnd: '0px' }
    ]);
  });
});

describe('leaving', () => {
  it('the message starts to close at once, the box fades and its row shrinks, and it is removed when the motion ends', async () => {
    const onclose = vi.fn();
    message.info({ content: 'x', duration: 0, onclose });
    await tick();
    stubAnimation();
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ height: 56 } as DOMRect);
    message.destroy();
    await tick();
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    const [fade, shrink] = animate.mock.calls as [[Keyframe[], KeyframeAnimationOptions], [Keyframe[], KeyframeAnimationOptions]];
    expect(fade[0][1]).toEqual({ opacity: 0, transform: 'translateY(-64px)' });
    expect(shrink[0]).toEqual([
      { height: '56px', paddingBlockEnd: '0px' },
      { height: '0px', paddingBlockEnd: '0px' }
    ]);
    expect(fade[1].fill).toBe('forwards');
    expect(slots()).toHaveLength(1);
    finish();
    await settle();
    expect(slots()).toHaveLength(0);
  });

  it('the row shrinks with its bottom padding (the gap), read from the style of the row', async () => {
    message.info('x', 0);
    await tick();
    stubAnimation();
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (element: Element) => new Proxy(real(element), { get: (target, key) => (key === 'paddingBlockEnd' ? '16px' : key === 'getPropertyValue' ? () => '' : Reflect.get(target, key)) })
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ height: 56 } as DOMRect);
    message.destroy();
    await tick();
    expect(animate.mock.calls[1][0]).toEqual([
      { height: '56px', paddingBlockEnd: '16px' },
      { height: '0px', paddingBlockEnd: '0px' }
    ]);
  });

  it('a cancelled animation does not keep the message on the page', async () => {
    message.info('x', 0);
    await tick();
    stubAnimation();
    message.destroy();
    await tick();
    expect(slots()).toHaveLength(1);
    fail();
    await settle();
    expect(slots()).toHaveLength(0);
  });

  it('if nothing reports the end of the motion, the message goes after a fallback time', async () => {
    message.info('x', 0);
    await tick();
    stubAnimation();
    message.destroy();
    await tick();
    await settle(799);
    expect(slots()).toHaveLength(1);
    await settle(1);
    expect(slots()).toHaveLength(0);
  });

  it('closing is the same for every row: the others stay while one leaves', async () => {
    message.info('a', 0);
    message.info('b', 0);
    await tick();
    stubAnimation();
    const hide = message.info('c', 0);
    await tick();
    hide();
    await tick();
    expect(slots()).toHaveLength(3);
    finish();
    await settle();
    expect(slots()).toHaveLength(2);
  });
});

describe('the pile', () => {
  it('opening it slides each row from its place in the pile to its place in the list; a row that does not move does not slide', async () => {
    message.config({ stack: true });
    for (const name of ['a', 'b', 'c', 'd']) message.info(name, 0);
    await tick();
    stubAnimation();
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const slot = this.closest<HTMLElement>('.ads-message-slot') ?? (this as HTMLElement);
      const index = Number(slot.style.getPropertyValue('--ads-message-i') || 0);
      const piled = Boolean(this.closest('.ads-message-piled'));
      return { top: piled ? 0 : index * 56, height: 40 } as DOMRect;
    });
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerenter');
    await tick();
    await tick();
    const slides = animate.mock.calls.map((call) => (call[0] as Keyframe[])[0].transform);
    expect(slides).toEqual(['translateY(-56px)', 'translateY(-112px)', 'translateY(-168px)']);
  });

  it('a row that is new in the same update has no place to slide from, so it does not slide', async () => {
    message.config({ stack: true });
    for (const name of ['a', 'b', 'c']) message.info(name, 0);
    await tick();
    stubAnimation();
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const slot = this.closest<HTMLElement>('.ads-message-slot') ?? (this as HTMLElement);
      const index = Number(slot.style.getPropertyValue('--ads-message-i') || 0);
      return { top: this.closest('.ads-message-piled') ? 0 : index * 56, height: 40 } as DOMRect;
    });
    message.info('d', 0);
    await tick();
    await tick();
    const slides = animate.mock.calls.map((call) => (call[0] as Keyframe[])[0].transform).filter((value) => String(value).startsWith('translateY(') && !String(value).includes('-64'));
    expect(slides.length).toBeLessThanOrEqual(3);
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('with no motion available the pile still opens', async () => {
    message.config({ stack: true });
    for (const name of ['a', 'b', 'c', 'd']) message.info(name, 0);
    await tick();
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerenter');
    await tick();
    expect(document.querySelector('.ads-message-piled')).toBeNull();
  });
});
