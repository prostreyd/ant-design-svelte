// Notification (specs/notification.md). jsdom has no layout and no Web Animations, so the geometry and the motion are in
// e2e/notification.spec.ts; here are the calls, the lists, the timers, the keys, the ARIA wiring and the host.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureLayer, removeLayer } from '../src/lib/Notification/layer';
import { notification } from '../src/lib/Notification/notification';
import { getSnapshot, resetNotifications } from '../src/lib/Notification/store';
import { NOTIFICATION_PLACEMENTS, type NotificationCloseReason, type NotificationOptions } from '../src/lib/Notification/types';
import NotificationContextHarness from './fixtures/NotificationContextHarness.svelte';
import NotificationHostHarness from './fixtures/NotificationHostHarness.svelte';
import { pointer, settle } from './helpers/message';
import { boxes, inPlace, lists, slots, titles, titlesIn } from './helpers/notification';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  removeLayer();
  resetNotifications();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete (document as unknown as Record<string, unknown>).hidden;
  delete (Element.prototype as unknown as Record<string, unknown>).animate;
});

const rich = createRawSnippet(() => ({ render: () => '<b data-testid="rich">Rich</b>' }));
const star = createRawSnippet(() => ({ render: () => '<i data-testid="star">★</i>' }));

/** Opens a notification that never closes by itself, unless the test gives a duration. */
const note = (title: NotificationOptions['title'], extra: Partial<NotificationOptions> = {}) => notification.info({ title, duration: 0, ...extra });

describe('the calls', () => {
  it('open has no type icon and no type word; info, success, error and warning have both', async () => {
    notification.open({ title: 'Plain', duration: 0 });
    for (const type of ['info', 'success', 'error', 'warning'] as const) notification[type]({ title: type, duration: 0 });
    await tick();
    // A top place draws the newest first.
    const drawn = boxes().reverse();
    expect(drawn.map((box) => (box.className.match(/ads-notification-(info|success|error|warning)\b/) ?? [])[1])).toEqual([
      undefined,
      'info',
      'success',
      'error',
      'warning'
    ]);
    expect(drawn.map((box) => Boolean(box.querySelector('.ads-notification-icon')))).toEqual([false, true, true, true, true]);
    expect(titles().reverse()).toEqual(['Plain', 'Info: info', 'Success: success', 'Error: error', 'Warning: warning']);
  });

  it('every call returns a function that closes that notification, and calling it twice is harmless', async () => {
    const close = note('a');
    note('b');
    await tick();
    expect(typeof close).toBe('function');
    close();
    close();
    await settle();
    expect(titles()).toEqual(['Info: b']);
  });

  it('destroy(key) closes that notification and destroy() every notification', async () => {
    note('one', { key: 'one' });
    note('two', { key: 'two' });
    note('three');
    await tick();
    notification.destroy('two');
    await settle();
    expect(titles()).toEqual(['Info: three', 'Info: one']);
    notification.destroy('nothing');
    await settle();
    expect(boxes()).toHaveLength(2);
    notification.destroy();
    await settle();
    expect(boxes()).toHaveLength(0);
  });

  it('config: sets defaults for the next notifications and merges the objects; undefined takes a setting back', async () => {
    notification.config({ duration: 1, labels: { error: 'Oops' } });
    notification.config({ labels: { close: 'Dismiss' }, showProgress: true });
    notification.error({ title: 'first' });
    await tick();
    expect(titles()).toEqual(['Oops: first']);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(document.querySelector('.ads-notification-progress')).not.toBeNull();
    await settle(1000);
    expect(boxes()).toHaveLength(0);
    notification.config({ duration: undefined, showProgress: undefined });
    notification.info({ title: 'second' });
    await tick();
    expect(document.querySelector('.ads-notification-progress')).toBeNull();
    await settle(4499);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });
});

describe('title, description and actions', () => {
  it('show a string, a number, 0 and a snippet', async () => {
    note('Text', { description: 'Body' });
    note(42, { description: 0 });
    note(rich, { description: rich, actions: rich });
    await tick();
    expect(titles()).toEqual(['Info: Rich', 'Info: 42', 'Info: Text']);
    expect(boxes()[1].querySelector('.ads-notification-description')).toHaveTextContent('0');
    expect(screen.getAllByTestId('rich')).toHaveLength(3);
  });

  it('a title alone is a box: there is no description and no actions element', async () => {
    note('Only a title');
    await tick();
    expect(document.querySelector('.ads-notification-description')).toBeNull();
    expect(document.querySelector('.ads-notification-actions')).toBeNull();
  });

  it('actions are the consumer\'s own elements, after the text and before the close button', async () => {
    note('a', { description: 'b', actions: createRawSnippet(() => ({ render: () => '<button type="button">Undo</button>' })) });
    await tick();
    const names = [...boxes()[0].querySelectorAll('button')].map((button) => button.textContent?.trim() || button.getAttribute('aria-label'));
    expect(names).toEqual(['Undo', 'Close']);
  });

  it('a snippet reads the context from where the host is, not from where it was written', async () => {
    render(NotificationContextHarness);
    await tick();
    screen.getByTestId('open').click();
    await tick();
    expect(screen.getByTestId('context')).toHaveTextContent('host');
  });
});

describe('icon', () => {
  it('shows the icon of the type, decorative, and never a role="img" with a file name', async () => {
    notification.success({ title: 'x', duration: 0 });
    await tick();
    const icon = document.querySelector('.ads-notification-icon')!;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon.querySelector('svg')).not.toBeNull();
    expect(document.querySelector('[role="img"]')).toBeNull();
  });

  it('a string, a snippet, and false; open takes a custom icon too', async () => {
    note('a', { icon: '🔥' });
    note('b', { icon: star });
    note('c', { icon: false });
    notification.open({ title: 'd', icon: '🚀', duration: 0 });
    await tick();
    const icons = boxes().map((box) => box.querySelector('.ads-notification-icon')?.textContent?.trim() ?? null);
    expect(icons).toEqual(['🚀', null, '★', '🔥']);
    expect(screen.getByTestId('star')).toBeInTheDocument();
  });
});

describe('duration', () => {
  it('lasts 4.5 seconds by default, then goes', async () => {
    notification.info({ title: 'x' });
    await tick();
    await settle(4499);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('a number is seconds', async () => {
    notification.info({ title: 'x', duration: 2 });
    await tick();
    await settle(1999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('0 and false keep the notification until it is closed', async () => {
    notification.info({ title: 'a', duration: 0 });
    notification.info({ title: 'b', duration: false });
    await tick();
    await settle(600_000);
    expect(boxes()).toHaveLength(2);
  });

  it('a negative or infinite duration falls back to the default, with a warning in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const duration of [-1, Infinity, Number.NaN]) notification.info({ title: 'x', duration });
    await tick();
    expect(warn).toHaveBeenCalledTimes(3);
    await settle(4500);
    expect(boxes()).toHaveLength(0);
  });

  it('config: an invalid default duration falls back to 4.5 seconds, and false never closes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    notification.config({ duration: -2 });
    notification.info({ title: 'a' });
    await tick();
    expect(warn).toHaveBeenCalled();
    await settle(4500);
    expect(boxes()).toHaveLength(0);
    notification.config({ duration: false });
    notification.info({ title: 'b' });
    await tick();
    await settle(600_000);
    expect(boxes()).toHaveLength(1);
  });
});

describe('key', () => {
  it('the same key updates the notification in place: one box, the new type, texts and options, the order kept', async () => {
    note('first', { key: 'a' });
    note('second', { key: 'k', description: 'old' });
    note('third', { key: 'c' });
    await tick();
    notification.success({ title: 'second, new', key: 'k', description: 'new', duration: 0 });
    await tick();
    expect(titles()).toEqual(['Info: third', 'Success: second, new', 'Info: first']);
    expect(boxes()[1]).toHaveClass('ads-notification-success');
    expect(boxes()[1].querySelector('.ads-notification-description')).toHaveTextContent('new');
  });

  it('an update restarts the timer with the new duration', async () => {
    notification.info({ title: 'a', key: 'k', duration: 1 });
    await tick();
    await settle(600);
    notification.info({ title: 'b', key: 'k', duration: 2 });
    await settle(1999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('an update makes the box again, so a screen reader reads it as new', async () => {
    note('a', { key: 'k' });
    await tick();
    const before = boxes()[0];
    note('b', { key: 'k' });
    await tick();
    expect(boxes()[0]).not.toBe(before);
    expect(before.isConnected).toBe(false);
  });

  it('a key that has closed opens a new notification, and a number key works', async () => {
    note('a', { key: 1 });
    await tick();
    notification.destroy(1);
    await settle();
    note('b', { key: 1 });
    await tick();
    expect(titles()).toEqual(['Info: b']);
  });

  it('the update replaces the callbacks: onclose of the update is the one that runs', async () => {
    const first = vi.fn();
    const second = vi.fn();
    note('a', { key: 'k', onclose: first });
    note('b', { key: 'k', onclose: second });
    notification.destroy('k');
    await settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('a generated key is different for every notification', () => {
    note('a');
    note('b');
    const keys = getSnapshot().records.map((record) => record.key);
    expect(new Set(keys).size).toBe(2);
  });
});

describe('placement', () => {
  it('each of the six places is its own list, and a notification stands in the one it names', async () => {
    for (const placement of NOTIFICATION_PLACEMENTS) note(placement, { placement });
    await tick();
    expect(lists().map((list) => list.dataset.placement)).toEqual([...NOTIFICATION_PLACEMENTS]);
    for (const placement of NOTIFICATION_PLACEMENTS) expect(titlesIn(placement)).toEqual([`Info: ${placement}`]);
  });

  it('the default is topRight, and the host and config() change it', async () => {
    note('a');
    await tick();
    expect(titlesIn('topRight')).toEqual(['Info: a']);
    notification.config({ placement: 'bottomLeft' });
    note('b');
    await tick();
    // The one that named no place follows the default, also the one that is open already.
    expect(titlesIn('topRight')).toEqual([]);
    expect(titlesIn('bottomLeft')).toEqual(['Info: a', 'Info: b']);
  });

  it('a notification names its own place over the default', async () => {
    notification.config({ placement: 'bottom' });
    note('a', { placement: 'top' });
    await tick();
    expect(titlesIn('top')).toEqual(['Info: a']);
  });

  it('an unknown place of a notification throws in development, and one in the settings falls back with a warning', async () => {
    expect(() => note('x', { placement: 'middle' as never })).toThrow(RangeError);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    notification.config({ placement: 'middle' as never });
    note('y');
    await tick();
    expect(warn).toHaveBeenCalled();
    expect(titlesIn('topRight')).toEqual(['Info: y']);
  });

  it('top and bottom: a number is pixels, a string is as given, and the token applies without them', async () => {
    const edge = (placement: string) =>
      document.querySelector<HTMLElement>(`.ads-notification-list[data-placement="${placement}"]`)!.style.getPropertyValue('--ads-notification-edge');
    note('a');
    note('b', { placement: 'bottom' });
    await tick();
    expect([edge('topRight'), edge('bottom')]).toEqual(['var(--ads-notification-top)', 'var(--ads-notification-bottom)']);
    notification.config({ top: 10, bottom: '3rem' });
    await tick();
    expect([edge('topRight'), edge('bottom')]).toEqual(['10px', '3rem']);
  });

  it('a place that has no notification any more is gone, and the others stay', async () => {
    const close = note('a', { placement: 'topLeft' });
    note('b', { placement: 'bottomLeft' });
    await tick();
    close();
    await settle();
    expect(lists().map((list) => list.dataset.placement)).toEqual(['bottomLeft']);
  });
});

describe('order', () => {
  it('at a top place the newest is the first row, at a bottom place the last: nearest the window edge, and the DOM is the drawn order', async () => {
    for (const title of ['one', 'two', 'three']) {
      note(title, { placement: 'topRight' });
      note(title, { placement: 'bottomRight' });
    }
    await tick();
    expect(titlesIn('topRight')).toEqual(['Info: three', 'Info: two', 'Info: one']);
    expect(titlesIn('bottomRight')).toEqual(['Info: one', 'Info: two', 'Info: three']);
  });
});

describe('closable and closeIcon', () => {
  it('the button is there by default, and the name is "Close"', async () => {
    note('a');
    await tick();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });

  it('closable: false and closeIcon: false remove the button, per notification, host and config', async () => {
    note('a', { closable: false });
    note('b', { closeIcon: false });
    await tick();
    expect(screen.queryByRole('button')).toBeNull();
    note('c');
    await tick();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    // The default is read when the box is drawn, so it reaches the one that is open already (`c`).
    notification.config({ closable: false });
    note('d');
    note('e', { closable: true });
    await tick();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    notification.destroy();
    await settle();
    notification.config({ closable: undefined, closeIcon: false });
    note('f');
    await tick();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('closeIcon: a string and a snippet replace the cross', async () => {
    note('a', { closeIcon: 'x' });
    note('b', { closeIcon: star });
    await tick();
    // The newest is the first box.
    const [second, first] = screen.getAllByRole('button', { name: 'Close' });
    expect(first).toHaveTextContent('x');
    expect(first.querySelector('svg')).toBeNull();
    expect(second).toContainElement(screen.getByTestId('star'));
  });

  describe('a close button that holds more than the cross', () => {
    // jsdom has no layout: the width of the button is given by the test, and the observer is a stand-in that it can fire.
    let width = 24;
    const observers: { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[] = [];

    class FakeObserver {
      disconnect = vi.fn();
      constructor(callback: () => void) {
        observers.push({ callback, disconnect: this.disconnect });
      }
      observe(): void {}
    }

    beforeEach(() => {
      width = 24;
      observers.length = 0;
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('ads-notification-close') ? width : 0;
      });
    });

    const room = () => (document.querySelector('.ads-notification') as HTMLElement).style.getPropertyValue('--ads-notification-close-width');

    it('its width is handed to the box (the title keeps out of its way) and follows it when it changes', async () => {
      vi.stubGlobal('ResizeObserver', FakeObserver);
      width = 60;
      note('a', { closeIcon: 'Close all' });
      await tick();
      expect(room()).toBe('60px');
      width = 80;
      observers[0].callback();
      await tick();
      expect(room()).toBe('80px');
    });

    it('the observer is let go with the notification', async () => {
      vi.stubGlobal('ResizeObserver', FakeObserver);
      const close = note('a', { closeIcon: 'Close all' });
      await tick();
      close();
      await settle();
      expect(observers[0].disconnect).toHaveBeenCalled();
    });

    it('without a ResizeObserver the first reading stays; a notification with no close button hands over nothing', async () => {
      vi.stubGlobal('ResizeObserver', undefined);
      width = 60;
      note('a', { closeIcon: 'Close all' });
      await tick();
      expect(room()).toBe('60px');
      cleanup();
      resetNotifications();
      note('b', { closable: false });
      await tick();
      expect(room()).toBe('');
    });
  });

  it('the name can be translated, per host and per config', async () => {
    render(NotificationHostHarness, { props: { labels: { close: 'Закрыть' } } });
    await tick();
    note('x');
    await tick();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('a click, Enter and Space close the notification with the reason user', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onclose = vi.fn();
    note('a', { onclose });
    await tick();
    await user.click(screen.getByRole('button'));
    await settle();
    expect(boxes()).toHaveLength(0);
    for (const key of ['{Enter}', ' ']) {
      note('b', { onclose });
      await tick();
      screen.getByRole('button').focus();
      await user.keyboard(key);
      await settle();
      expect(boxes()).toHaveLength(0);
    }
    expect(onclose.mock.calls).toEqual([['user'], ['user'], ['user']]);
  });

  it('Escape inside the notification closes it; Escape elsewhere does not', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onclose = vi.fn();
    note('a', { onclose });
    await tick();
    await user.keyboard('{Escape}');
    await settle();
    expect(boxes()).toHaveLength(1);
    screen.getByRole('button').focus();
    await user.keyboard('{Escape}');
    await settle();
    expect(boxes()).toHaveLength(0);
    expect(onclose).toHaveBeenCalledWith('user');
  });

  it('Escape during an IME composition is ignored', async () => {
    note('a');
    await tick();
    screen.getByRole('button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }));
    await settle();
    expect(boxes()).toHaveLength(1);
  });
});

describe('motion', () => {
  /** What `Element.animate` is called with: the keyframes of every animation, in order. */
  const stubAnimate = () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve() }));
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    return animate;
  };
  const transforms = (animate: ReturnType<typeof stubAnimate>) =>
    (animate.mock.calls as unknown as [Record<string, string>[]][]).map(([keyframes]) => keyframes[0]?.transform).filter(Boolean);

  it('each place enters from its own side', async () => {
    const sides: Record<string, string> = {
      top: 'translateY(-64px)',
      bottom: 'translateY(64px)',
      topLeft: 'translateX(-64px)',
      bottomLeft: 'translateX(-64px)',
      topRight: 'translateX(64px)',
      bottomRight: 'translateX(64px)'
    };
    for (const [placement, expected] of Object.entries(sides)) {
      const animate = stubAnimate();
      note('x', { placement: placement as never });
      await tick();
      expect(transforms(animate), placement).toEqual([expected]);
      notification.destroy();
      await settle();
      removeLayer();
    }
  });

  it('and leaves to the same side, with the slot shrinking over its gap: the gap is at the end at a top place and at the start at a bottom one', async () => {
    const animate = stubAnimate();
    const close = note('x', { placement: 'bottomLeft' });
    await tick();
    animate.mockClear();
    close();
    await settle();
    const calls = animate.mock.calls as unknown as [Record<string, string>[]][];
    expect(calls[0][0].map((frame) => frame.transform)).toEqual(['translateX(0)', 'translateX(-64px)']);
    expect(Object.keys(calls[1][0][0])).toContain('paddingBlockStart');
    animate.mockClear();
    const closeTop = note('y', { placement: 'topLeft' });
    await tick();
    animate.mockClear();
    closeTop();
    await settle();
    expect(Object.keys((animate.mock.calls as unknown as [Record<string, string>[]][])[1][0][0])).toContain('paddingBlockEnd');
  });

  it('the newest row pushes the others away: its slot grows only when another row is there', async () => {
    const animate = stubAnimate();
    note('first');
    await tick();
    expect(animate).toHaveBeenCalledTimes(1);
    note('second');
    await tick();
    // The box of the new row, and its slot that grows.
    expect(animate).toHaveBeenCalledTimes(3);
  });

  it('a notification that was on the page when a host took over does not come in again', async () => {
    const animate = stubAnimate();
    note('x');
    await tick();
    const entered = animate.mock.calls.length;
    expect(entered).toBeGreaterThan(0);
    await settle(1000);
    render(NotificationHostHarness);
    await tick();
    await tick();
    expect(titles()).toEqual(['Info: x']);
    expect(animate.mock.calls.length).toBe(entered);
  });
});

describe('a tall list', () => {
  it('at a bottom place the end is kept in view while a row comes in, and a top place is left alone', async () => {
    const scrolled = new Map<Element, number>();
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 500 });
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get() {
        return scrolled.get(this) ?? 0;
      },
      set(value: number) {
        scrolled.set(this, value);
      }
    });
    try {
      note('a', { placement: 'bottomRight' });
      note('b', { placement: 'topRight' });
      await tick();
      await settle(500);
      const [top, bottom] = [lists().find((l) => l.dataset.placement === 'topRight')!, lists().find((l) => l.dataset.placement === 'bottomRight')!];
      expect(scrolled.get(bottom)).toBe(500);
      expect(scrolled.has(top)).toBe(false);
      scrolled.clear();
      // A row that goes does not scroll it again.
      note('c', { placement: 'bottomRight' });
      await tick();
      await settle(500);
      expect(scrolled.get(bottom)).toBe(500);
      scrolled.clear();
      notification.destroy();
      await settle();
      expect(scrolled.size).toBe(0);
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollTop;
    }
  });
});

describe('showProgress', () => {
  const fill = () => document.querySelector<HTMLElement>('.ads-notification-progress-bar')!;
  const percent = () => parseFloat(fill().style.inlineSize);

  it('there is no strip by default, and none with duration 0', async () => {
    note('a', { duration: 5 });
    note('b', { showProgress: true, duration: 0 });
    note('c', { showProgress: true, duration: false });
    await tick();
    expect(document.querySelector('.ads-notification-progress')).toBeNull();
  });

  it('the strip is not announced: it is hidden from a screen reader and has no role', async () => {
    note('a', { showProgress: true, duration: 5 });
    await tick();
    const strip = document.querySelector('.ads-notification-progress')!;
    expect(strip).toHaveAttribute('aria-hidden', 'true');
    expect(strip.getAttribute('role')).toBeNull();
    expect(document.querySelector('progress, [role="progressbar"]')).toBeNull();
  });

  it('it follows the time left, and stands still while the timer is held', async () => {
    note('a', { showProgress: true, duration: 10 });
    await tick();
    expect(percent()).toBe(100);
    await settle(3000);
    expect(percent()).toBeCloseTo(70, 0);
    const item = document.querySelector('.ads-notification-item')!;
    pointer(item, 'pointerenter');
    await settle(5000);
    expect(percent()).toBeCloseTo(70, 0);
    pointer(item, 'pointerleave');
    await settle(2000);
    expect(percent()).toBeCloseTo(50, 0);
  });

  it('an update by key starts it again, with the new duration', async () => {
    note('a', { key: 'k', showProgress: true, duration: 10 });
    await tick();
    await settle(8000);
    expect(percent()).toBeCloseTo(20, 0);
    note('b', { key: 'k', showProgress: true, duration: 5 });
    await tick();
    expect(percent()).toBe(100);
    await settle(1000);
    expect(percent()).toBeCloseTo(80, 0);
  });

  it('config() and the host turn it on for every notification, and a notification may say otherwise', async () => {
    notification.config({ showProgress: true });
    note('a', { duration: 5 });
    note('b', { duration: 5, showProgress: false });
    await tick();
    expect(document.querySelectorAll('.ads-notification-progress')).toHaveLength(1);
  });

  it('the strip takes its own class and style', async () => {
    note('a', { showProgress: true, duration: 5, classNames: { progress: 'p-own' }, styles: { progress: { opacity: '0.5' } } });
    await tick();
    const strip = document.querySelector<HTMLElement>('.ads-notification-progress')!;
    expect(strip).toHaveClass('p-own');
    expect(strip.style.opacity).toBe('0.5');
  });
});

describe('the pause', () => {
  const item = () => document.querySelector('.ads-notification-item')!;

  it('the pointer over the notification holds the timer, and leaving resumes with the time that was left', async () => {
    notification.info({ title: 'x', duration: 4 });
    await tick();
    await settle(1000);
    pointer(item(), 'pointerenter');
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
    pointer(item(), 'pointerleave');
    await settle(2999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('pauseOnHover: false does not pause, per notification, host and config', async () => {
    notification.info({ title: 'x', duration: 1, pauseOnHover: false });
    await tick();
    pointer(item(), 'pointerenter');
    await settle(1000);
    expect(boxes()).toHaveLength(0);
    notification.config({ pauseOnHover: false });
    notification.info({ title: 'y', duration: 1 });
    await tick();
    pointer(item(), 'pointerenter');
    await settle(1000);
    expect(boxes()).toHaveLength(0);
    notification.info({ title: 'z', duration: 1, pauseOnHover: true });
    await tick();
    pointer(item(), 'pointerenter');
    await settle(5000);
    expect(boxes()).toHaveLength(1);
  });

  it('a touch does not pause (a tap leaves a hover behind that would never end), and a pen pauses like a mouse', async () => {
    notification.info({ title: 'x', duration: 1 });
    await tick();
    pointer(item(), 'pointerenter', 'touch');
    await settle(1000);
    expect(boxes()).toHaveLength(0);
    notification.info({ title: 'y', duration: 1 });
    await tick();
    pointer(item(), 'pointerenter', 'pen');
    await settle(5000);
    expect(boxes()).toHaveLength(1);
  });

  it('focus inside the notification holds the timer, and moving it away releases it', async () => {
    notification.info({ title: 'x', duration: 1 });
    notification.info({ title: 'y', duration: 0 });
    await tick();
    const [y, x] = boxes();
    x.querySelector('button')!.focus();
    await tick();
    await settle(5000);
    expect(boxes()).toHaveLength(2);
    y.querySelector('button')!.focus();
    await settle(1000);
    expect(titles()).toEqual(['Info: y']);
  });

  it('focus moving between two controls inside the same notification keeps it held', async () => {
    notification.info({
      title: 'x',
      duration: 1,
      actions: createRawSnippet(() => ({ render: () => '<button type="button">Undo</button>' }))
    });
    await tick();
    const [undo, close] = screen.getAllByRole('button');
    undo.focus();
    await tick();
    close.focus();
    await tick();
    await settle(5000);
    expect(boxes()).toHaveLength(1);
    document.body.focus();
    close.blur();
    await settle(1000);
    expect(boxes()).toHaveLength(0);
  });

  it('a hidden page holds the timer, and coming back releases it', async () => {
    notification.info({ title: 'x', duration: 1 });
    await tick();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(5000);
    expect(boxes()).toHaveLength(1);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(1000);
    expect(boxes()).toHaveLength(0);
  });
});

describe('role and the type word', () => {
  it('error and warning are alerts, the rest are status messages', async () => {
    notification.open({ title: 'o', duration: 0 });
    for (const type of ['info', 'success', 'error', 'warning'] as const) notification[type]({ title: type, duration: 0 });
    await tick();
    // The newest first: warning, error, success, info, open.
    expect(boxes().map((box) => box.getAttribute('role'))).toEqual(['alert', 'alert', 'status', 'status', 'status']);
  });

  it('the role option overrides the role of the type', async () => {
    notification.error({ title: 'a', role: 'status', duration: 0 });
    notification.info({ title: 'b', role: 'alert', duration: 0 });
    await tick();
    expect(boxes().map((box) => box.getAttribute('role'))).toEqual(['alert', 'status']);
  });

  it('a hidden word before the title names the type, and it can be translated or removed', async () => {
    notification.error({ title: 'Upload failed', duration: 0 });
    await tick();
    expect(titles()).toEqual(['Error: Upload failed']);
    expect(document.querySelector('.ads-notification-word')).not.toBeNull();
    notification.config({ labels: { error: 'Ошибка' } });
    await tick();
    expect(titles()).toEqual(['Ошибка: Upload failed']);
    notification.config({ labels: { error: '' } });
    await tick();
    expect(titles()).toEqual(['Upload failed']);
  });

  it('opening a notification never moves focus', async () => {
    const before = document.createElement('button');
    document.body.append(before);
    before.focus();
    note('x');
    await tick();
    expect(document.activeElement).toBe(before);
  });
});

describe('class, style, classNames, styles, props', () => {
  it('class and style go on the box: a string and an object', async () => {
    note('a', { class: 'mine', style: 'margin: 1px' });
    note('b', { style: { color: 'red' } });
    await tick();
    const [b, a] = boxes();
    expect(a).toHaveClass('mine');
    expect(a.style.margin).toBe('1px');
    expect(b.style.color).toBe('red');
  });

  it('classNames and styles reach every part', async () => {
    const parts = ['root', 'icon', 'section', 'title', 'description', 'actions', 'close', 'progress'] as const;
    note('a', {
      description: 'b',
      actions: rich,
      showProgress: true,
      duration: 5,
      classNames: Object.fromEntries(parts.map((part) => [part, `c-${part}`])),
      styles: Object.fromEntries(parts.map((part) => [part, { '--probe': part }]))
    });
    notification.info({ title: 'x', duration: 5 });
    await tick();
    const box = boxes()[1];
    for (const part of parts) {
      const element = part === 'root' ? box : box.querySelector(`.c-${part}`);
      expect(element, part).not.toBeNull();
      expect(element).toHaveClass(`c-${part}`);
      expect((element as HTMLElement).style.getPropertyValue('--probe'), part).toBe(part);
    }
  });

  it('the notification wins over the host, which wins over config()', async () => {
    notification.config({ classNames: { title: 'from-config', icon: 'from-config' }, styles: { title: { color: 'blue' } } });
    render(NotificationHostHarness, { props: { classNames: { title: 'from-host' } } });
    await tick();
    note('a');
    note('b', { classNames: { title: 'from-note' } });
    await tick();
    const [second, first] = boxes();
    expect(first.querySelector('.ads-notification-title')).toHaveClass('from-host');
    expect(first.querySelector('.ads-notification-title')).not.toHaveClass('from-config');
    expect(first.querySelector('.ads-notification-icon')).toHaveClass('from-config');
    expect(second.querySelector('.ads-notification-title')).toHaveClass('from-note');
    expect((first.querySelector('.ads-notification-title') as HTMLElement).style.color).toBe('blue');
  });

  it('list and listContent take their own class and style from the host and config', async () => {
    render(NotificationHostHarness, {
      props: { classNames: { list: 'my-list', listContent: 'my-content' }, styles: { list: { opacity: '0.9' } } }
    });
    await tick();
    note('x');
    await tick();
    expect(lists()[0]).toHaveClass('my-list');
    expect(lists()[0].style.opacity).toBe('0.9');
    expect(document.querySelector('.ads-notification-list-content')).toHaveClass('my-content');
  });

  it('props puts data-* and aria-* attributes on the box', async () => {
    note('a', { props: { 'data-testid': 'my-note', 'aria-label': 'Custom' } });
    await tick();
    expect(boxes()[0]).toHaveAttribute('data-testid', 'my-note');
    expect(boxes()[0]).toHaveAttribute('aria-label', 'Custom');
  });
});

describe('onclick and onclose', () => {
  it('onclick is called with the event when the box is clicked, and a click does not close it', async () => {
    const onclick = vi.fn();
    note('a', { onclick });
    await tick();
    boxes()[0].click();
    await settle();
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(boxes()).toHaveLength(1);
  });

  it('the close button does not call onclick', async () => {
    const onclick = vi.fn();
    note('a', { onclick });
    await tick();
    screen.getByRole('button').click();
    await settle();
    expect(onclick).not.toHaveBeenCalled();
  });

  it('a box without onclick can be clicked', async () => {
    note('a');
    await tick();
    expect(() => boxes()[0].click()).not.toThrow();
  });

  it('onclose runs once, with its reason: timeout, user, replaced, destroy', async () => {
    const reasons: NotificationCloseReason[] = [];
    const onclose = (reason: NotificationCloseReason) => reasons.push(reason);
    notification.info({ title: 'timer', duration: 1, onclose });
    note('handle', { onclose });
    note('key', { key: 'k', onclose });
    note('all-1', { onclose });
    await tick();
    await settle(1000);
    expect(reasons).toEqual(['timeout']);
    boxes()[0].querySelector<HTMLButtonElement>('button')!.click();
    await settle();
    expect(reasons).toEqual(['timeout', 'user']);
    notification.destroy('k');
    await settle();
    expect(reasons).toEqual(['timeout', 'user', 'destroy']);
    notification.destroy();
    await settle();
    expect(reasons).toEqual(['timeout', 'user', 'destroy', 'destroy']);
    expect(reasons.filter((reason) => reason === 'timeout')).toHaveLength(1);
  });

  it('the function a call returns closes with the reason destroy, and the limit with replaced', async () => {
    const reasons: NotificationCloseReason[] = [];
    const onclose = (reason: NotificationCloseReason) => reasons.push(reason);
    notification.config({ maxCount: 1 });
    const close = note('a', { onclose });
    note('b', { onclose });
    await settle();
    expect(reasons).toEqual(['replaced']);
    close();
    await settle();
    expect(reasons).toEqual(['replaced']);
    notification.config({ maxCount: undefined });
    const closeB = note('c', { onclose });
    closeB();
    await settle();
    expect(reasons).toEqual(['replaced', 'destroy']);
  });
});

describe('maxCount', () => {
  it('counts the notifications of all places together and closes the oldest first', async () => {
    notification.config({ maxCount: 3 });
    note('1', { placement: 'topRight' });
    note('2', { placement: 'bottomRight' });
    note('3', { placement: 'topRight' });
    note('4', { placement: 'bottomLeft' });
    await settle();
    expect(titles().sort()).toEqual(['Info: 2', 'Info: 3', 'Info: 4']);
  });

  it('applies when the limit is lowered while notifications are open, and ignores a value below 1 or not finite', async () => {
    note('1');
    note('2');
    note('3');
    await tick();
    notification.config({ maxCount: 1 });
    await settle();
    expect(titles()).toEqual(['Info: 3']);
    for (const bad of [0, -1, Number.NaN, Infinity]) {
      notification.config({ maxCount: bad });
      note('x');
      note('y');
      await settle();
      expect(boxes().length).toBeGreaterThanOrEqual(2);
      notification.destroy();
      await settle();
    }
  });

  it('with the stack on, the notifications that went are not part of the pile', async () => {
    notification.config({ maxCount: 3 });
    for (const index of [1, 2, 3, 4, 5]) note(`m${index}`);
    await settle();
    expect(boxes()).toHaveLength(3);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
  });
});

describe('the layer and the host', () => {
  it('with no host the library makes a layer on the body, and removes it when the last notification has left', async () => {
    expect(document.querySelector('.ads-notification-layer')).toBeNull();
    notification.info({ title: 'x', duration: 1 });
    await tick();
    expect(document.body.querySelector(':scope > .ads-notification-layer')).not.toBeNull();
    await settle(1000);
    expect(document.querySelector('.ads-notification-layer')).toBeNull();
    expect(document.body.innerHTML.replace(/<!---->/g, '')).toBe('');
    note('y');
    await tick();
    expect(document.querySelectorAll('.ads-notification-layer')).toHaveLength(1);
  });

  it('one layer holds all the places', async () => {
    note('a', { placement: 'topLeft' });
    note('b', { placement: 'bottomRight' });
    await tick();
    expect(document.querySelectorAll('.ads-notification-layer')).toHaveLength(1);
    expect(document.querySelectorAll('.ads-notification-layer > .ads-notification-list')).toHaveLength(2);
  });

  it('the layer carries data-ads-overlay-keep, the attribute that keeps it out of what an open Modal puts out of reach', async () => {
    note('a');
    await tick();
    expect(document.querySelector('.ads-notification-layer')).toHaveAttribute('data-ads-overlay-keep');
  });

  it('a NotificationHost draws the notifications, and its props are the settings', async () => {
    render(NotificationHostHarness, { props: { top: 20, bottom: 30, placement: 'bottomLeft', duration: 1, maxCount: 2 } });
    await tick();
    note('a', { duration: undefined });
    note('b', { duration: undefined });
    note('c', { duration: undefined });
    await settle();
    expect(titlesIn('bottomLeft')).toEqual(['Info: b', 'Info: c']);
    expect(lists()[0].style.getPropertyValue('--ads-notification-edge')).toBe('30px');
    await settle(1000);
    expect(boxes()).toHaveLength(0);
  });

  it('a host that is mounted takes the notifications over from the library layer, and gives them back when it goes', async () => {
    note('x');
    await tick();
    expect(document.querySelectorAll('.ads-notification-layer')).toHaveLength(1);
    const view = render(NotificationHostHarness);
    await tick();
    await tick();
    expect(document.querySelectorAll('.ads-notification-layer')).toHaveLength(1);
    expect(titles()).toEqual(['Info: x']);
    view.unmount();
    await tick();
    notification.info({ title: 'again', duration: 0 });
    await tick();
    expect(titles()).toContain('Info: again');
  });

  it('container: an element and a function; the layer is moved there and leaves nothing behind', async () => {
    const box = document.createElement('div');
    document.body.append(box);
    notification.config({ container: box });
    note('a');
    await tick();
    expect(box.querySelector(':scope > .ads-notification-layer')).not.toBeNull();
    notification.destroy();
    await settle();
    expect(box.querySelector('.ads-notification-layer')).toBeNull();
    notification.config({ container: () => box });
    note('b');
    await tick();
    expect(box.querySelector(':scope > .ads-notification-layer')).not.toBeNull();
  });

  it('a second host draws nothing and warns in development; the first goes on drawing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(NotificationHostHarness, { props: { second: true } });
    await tick();
    await tick();
    note('x');
    await tick();
    expect(document.querySelectorAll('.ads-notification-layer')).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('another NotificationHost');
  });

  it('props of the host that change apply at once', async () => {
    const view = render(NotificationHostHarness, { props: { top: 10 } });
    await tick();
    note('x');
    await tick();
    await view.rerender({ top: 30 });
    await tick();
    expect(lists()[0].style.getPropertyValue('--ads-notification-edge')).toBe('30px');
  });

  it('config() changes apply to the next notification and to the layer of open ones', async () => {
    note('a');
    await tick();
    notification.config({ labels: { info: 'Note' } });
    note('b');
    await tick();
    expect(titles()).toEqual(['Note: b', 'Note: a']);
  });
});

describe('stack', () => {
  const open = async (count: number, options: Partial<NotificationOptions> = {}) => {
    for (let index = 1; index <= count; index++) note(`m${index}`, options);
    await tick();
  };
  const content = (placement = 'topRight') => document.querySelector<HTMLElement>(`.ads-notification-list[data-placement="${placement}"] .ads-notification-list-content`)!;

  it('is on by default: up to the threshold a plain list, past it a pile', async () => {
    await open(3);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    expect(content()).toHaveClass('ads-notification-stack');
    note('m4');
    await tick();
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
    expect(slots().map((slot) => slot.dataset.depth)).toEqual(['0', '1', '2', '3']);
  });

  it('stack: false turns it off: no pile however many there are', async () => {
    notification.config({ stack: false });
    await open(6);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    expect(document.querySelector('.ads-notification-stack')).toBeNull();
  });

  it('stack: true is the default, a custom threshold, and an object without one means 3', async () => {
    notification.config({ stack: { threshold: 1 } });
    await open(2);
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
    notification.destroy();
    await settle();
    notification.config({ stack: {} });
    await open(3);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    notification.destroy();
    await settle();
    notification.config({ stack: { threshold: 0 } });
    await open(3);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    notification.destroy();
    await settle();
    notification.config({ stack: true });
    await open(4);
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
  });

  it('the older notifications of a pile are inert, hidden from a screen reader and out of the Tab order', async () => {
    await open(4);
    const items = [...document.querySelectorAll<HTMLElement>('.ads-notification-item')];
    expect(items[0]).not.toHaveAttribute('inert');
    for (const item of items.slice(1)) {
      expect(item).toHaveAttribute('inert');
      expect(item).toHaveAttribute('aria-hidden', 'true');
      expect(item.querySelector('button')).toHaveAttribute('tabindex', '-1');
    }
    expect(items[0].querySelector('button')).not.toHaveAttribute('tabindex');
  });

  it('at a bottom place the newest is the last row and the one in front of the pile', async () => {
    await open(4, { placement: 'bottomLeft' });
    const items = [...document.querySelectorAll<HTMLElement>('.ads-notification-item')];
    expect(items.map((item) => item.hasAttribute('inert'))).toEqual([true, true, true, false]);
    expect(slots().map((slot) => slot.dataset.depth)).toEqual(['3', '2', '1', '0']);
    expect(slots()[3].style.zIndex).toBe('100');
    expect(slots()[0].style.zIndex).toBe('97');
  });

  it('the pointer over the pile opens it, and leaving closes it again', async () => {
    await open(4);
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
    pointer(content(), 'pointerenter');
    await tick();
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    pointer(content(), 'pointerleave');
    await tick();
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
  });

  it('a touch does not open the pile', async () => {
    await open(4);
    pointer(content(), 'pointerenter', 'touch');
    await tick();
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
  });

  it('focus in the pile opens it, and moving focus out closes it', async () => {
    await open(4);
    document.querySelector<HTMLButtonElement>('.ads-notification-item:not([inert]) button')!.focus();
    await tick();
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await tick();
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
  });

  it('each place is a pile of its own: the pointer in one opens that place only', async () => {
    await open(4, { placement: 'topRight' });
    await open(4, { placement: 'bottomRight' });
    expect(document.querySelectorAll('.ads-notification-piled')).toHaveLength(2);
    pointer(content('topRight'), 'pointerenter');
    await tick();
    expect(content('topRight')).not.toHaveClass('ads-notification-piled');
    expect(content('bottomRight')).toHaveClass('ads-notification-piled');
  });

  it('every timer in an open pile stands still, and goes on when it closes', async () => {
    for (const title of ['a', 'b', 'c', 'd']) notification.info({ title, duration: 2 });
    await tick();
    pointer(content(), 'pointerenter');
    await settle(10_000);
    expect(boxes()).toHaveLength(4);
    pointer(content(), 'pointerleave');
    await settle(2000);
    expect(boxes()).toHaveLength(0);
  });

  it('the pile does not stay open when the list went away under the pointer (a removed element sends no pointerleave)', async () => {
    // The fault of a public issue of the React package, tested for the Message and here for the notification.
    render(NotificationHostHarness);
    await tick();
    await open(4);
    pointer(content(), 'pointerenter');
    await tick();
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
    notification.destroy();
    await settle(1000);
    expect(document.querySelector('.ads-notification-list-content')).toBeNull();
    await open(4);
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
  });

  it('a notification leaving the pile lets it open into a plain list', async () => {
    notification.config({ maxCount: undefined });
    await open(4);
    expect(document.querySelector('.ads-notification-piled')).not.toBeNull();
    notification.destroy('nothing');
    const first = getSnapshot().records[0];
    notification.destroy(first.key);
    await settle();
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
  });

  it('the stack option on a host', async () => {
    render(NotificationHostHarness, { props: { stack: false } });
    await tick();
    await open(5);
    expect(document.querySelector('.ads-notification-piled')).toBeNull();
  });
});

describe('ARIA', () => {
  it('without actions and the close button nothing in the notification can take focus', async () => {
    note('x', { closable: false });
    await tick();
    expect(document.querySelector('.ads-notification')!.querySelector('button, a, [tabindex]')).toBeNull();
  });

  it('has no serious accessibility violations with every type, actions and a close button', async () => {
    notification.open({ title: 'open', duration: 0, description: 'text' });
    for (const type of ['info', 'success', 'error', 'warning'] as const) {
      notification[type]({ title: `${type} title`, description: `${type} text`, duration: 0, showProgress: true });
    }
    await tick();
    vi.useRealTimers();
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([]);
  });
});

describe('reactivity', () => {
  it('a new notification opened after config() gets the new settings; an open one keeps its own', async () => {
    notification.info({ title: 'a', duration: 1 });
    notification.config({ duration: 10 });
    notification.info({ title: 'b' });
    await tick();
    await settle(1000);
    expect(titles()).toEqual(['Info: b']);
  });
});

describe('on a server', () => {
  it('every call is a no-op that returns an inert function, and nothing is stored', () => {
    vi.stubGlobal('document', undefined);
    const close = notification.success({ title: 'Saved' });
    notification.open({ title: 'x', key: 'k' });
    notification.destroy('k');
    ensureLayer();
    expect(() => close()).not.toThrow();
    vi.unstubAllGlobals();
    expect(getSnapshot().records).toHaveLength(0);
    expect(document.querySelector('.ads-notification-layer')).toBeNull();
  });

  it('a page rendered on a server stores nothing, registers no host, and the NotificationHost renders nothing', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/NotificationServerHarness.svelte', props: {} }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('function|0|no-host');
    expect(html).not.toContain('ads-notification');
  });
});

describe('a notification above a Modal (specs/modal.md)', () => {
  it('stays reachable: the layer is outside what a Modal puts out of reach', async () => {
    note('a');
    await tick();
    const layer = document.querySelector('.ads-notification-layer')!;
    expect(layer.hasAttribute('data-ads-overlay-keep')).toBe(true);
    expect(inPlace('topRight')).toHaveLength(1);
  });
});
