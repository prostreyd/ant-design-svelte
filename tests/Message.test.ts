// Message (specs/message.md). jsdom has no layout and no Web Animations, so the geometry and the motion are in
// e2e/message.spec.ts; here are the calls, the list, the timers, the keys, the ARIA wiring and the host.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureLayer, removeLayer } from '../src/lib/Message/layer';
import { message } from '../src/lib/Message/message';
import { getSnapshot, resetMessages } from '../src/lib/Message/store';
import { MESSAGE_TYPES } from '../src/lib/Message/types';
import MessageContextHarness from './fixtures/MessageContextHarness.svelte';
import MessageHostHarness from './fixtures/MessageHostHarness.svelte';
import { boxes, pointer, settle, slots, texts } from './helpers/message';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  removeLayer();
  resetMessages();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete (document as unknown as Record<string, unknown>).hidden;
  delete (Element.prototype as unknown as Record<string, unknown>).animate;
});

const rich = createRawSnippet(() => ({ render: () => '<b data-testid="rich">Rich</b>' }));

describe('the calls', () => {
  it('open: the type is info by default, and each of the five types is honored', async () => {
    message.open({ content: 'Plain' });
    for (const type of MESSAGE_TYPES) message.open({ type, content: type });
    await tick();
    expect(boxes().map((box) => MESSAGE_TYPES.find((type) => box.classList.contains(`ads-message-${type}`)))).toEqual([
      'info',
      ...MESSAGE_TYPES
    ]);
  });

  it('open: an unknown type throws in development', () => {
    expect(() => message.open({ type: 'fatal' as never, content: 'x' })).toThrow(RangeError);
  });

  it('typed methods: (content), (content, duration), (content, duration, onclose) and (options)', async () => {
    const onclose = vi.fn();
    message.success('A');
    message.error('B', 1, onclose);
    message.warning({ content: 'C', duration: 5 });
    message.loading({ content: 'D', key: 'd' });
    message.info(7, 0);
    await tick();
    expect(texts()).toEqual(['Success: A', 'Error: B', 'Warning: C', 'Loading: D', 'Info: 7']);
    await settle(1000);
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(texts()).toEqual(['Success: A', 'Warning: C', 'Loading: D', 'Info: 7']);
  });

  it('typed methods: the method fixes the type, whatever the options say', async () => {
    message.success({ content: 'x', type: 'error' } as never);
    await tick();
    expect(boxes()[0]).toHaveClass('ads-message-success');
  });

  it('destroy(key) closes that message and destroy() every message', async () => {
    message.info({ content: 'one', key: 'one', duration: 0 });
    message.info({ content: 'two', key: 'two', duration: 0 });
    message.info({ content: 'three', duration: 0 });
    await tick();
    message.destroy('two');
    await settle();
    expect(texts()).toEqual(['Info: one', 'Info: three']);
    message.destroy('nothing');
    await settle();
    expect(boxes()).toHaveLength(2);
    message.destroy();
    await settle();
    expect(boxes()).toHaveLength(0);
  });

  it('config: sets defaults for the next messages and merges the objects; undefined takes a setting back', async () => {
    message.config({ duration: 1, labels: { error: 'Oops' } });
    message.config({ labels: { close: 'Dismiss' }, closable: true });
    message.error('first');
    await tick();
    expect(texts()).toEqual(['Oops: first']);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    await settle(1000);
    expect(boxes()).toHaveLength(0);
    message.config({ duration: undefined, closable: undefined });
    message.info('second');
    await tick();
    expect(screen.queryByRole('button')).toBeNull();
    await settle(2999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });
});

describe('content', () => {
  it('shows a string, a number, 0 and a snippet', async () => {
    message.info('Text', 0);
    message.info(42, 0);
    message.info(0, 0);
    message.info(rich, 0);
    await tick();
    expect(texts()).toEqual(['Info: Text', 'Info: 42', 'Info: 0', 'Info: Rich']);
    expect(screen.getByTestId('rich')).toBeInTheDocument();
  });

  it('a snippet reads the context from where the host is, not from where it was written', async () => {
    render(MessageContextHarness);
    await tick();
    screen.getByTestId('open').click();
    await tick();
    expect(screen.getByTestId('context')).toHaveTextContent('host');
  });
});

describe('duration', () => {
  it('lasts 3 seconds by default, then goes', async () => {
    message.info('x');
    await tick();
    await settle(2999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('a number is seconds', async () => {
    message.info('x', 0.5);
    await tick();
    await settle(499);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('0 keeps the message until it is closed', async () => {
    const hide = message.info('x', 0);
    await tick();
    await settle(60_000);
    expect(boxes()).toHaveLength(1);
    hide();
    await settle();
    expect(boxes()).toHaveLength(0);
  });

  it('a negative or infinite duration falls back to the default, with a warning in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    message.info('a', -1);
    message.info('b', Infinity);
    message.info('c', Number.NaN);
    await tick();
    expect(warn).toHaveBeenCalledTimes(3);
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });

  it('config: an invalid default duration falls back to 3 seconds', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    message.config({ duration: -5 });
    message.info('x');
    await tick();
    await settle(2999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });
});

describe('key', () => {
  it('the same key updates the message in place: one row, the new type, text and options', async () => {
    message.loading({ content: 'Loading', key: 'job', duration: 0 });
    await tick();
    const row = slots()[0];
    message.success({ content: 'Done', key: 'job', duration: 2 });
    await tick();
    expect(slots()).toHaveLength(1);
    expect(slots()[0]).toBe(row);
    expect(texts()).toEqual(['Success: Done']);
    expect(boxes()[0]).toHaveClass('ads-message-success');
  });

  it('an update restarts the timer with the new duration', async () => {
    message.info({ content: 'a', key: 'k', duration: 2 });
    await tick();
    await settle(1500);
    message.info({ content: 'b', key: 'k', duration: 2 });
    await tick();
    await settle(1999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('an update makes the box again, so a screen reader reads it as new', async () => {
    message.info({ content: 'a', key: 'k', duration: 0 });
    await tick();
    const before = boxes()[0];
    message.info({ content: 'b', key: 'k', duration: 0 });
    await tick();
    expect(boxes()[0]).not.toBe(before);
    expect(before.isConnected).toBe(false);
  });

  it('a key that has closed opens a new message, a number key works, and the old one may still be leaving', async () => {
    const hide = message.info({ content: 'a', key: 1, duration: 0 });
    await tick();
    hide();
    message.info({ content: 'b', key: 1, duration: 0 });
    await settle();
    expect(texts()).toEqual(['Info: b']);
  });

  it('a generated key is different for every message', () => {
    message.info('a', 0);
    message.info('b', 0);
    const [first, second] = getSnapshot().records;
    expect(first.key).not.toBe(second.key);
  });

  it('keeps the update when it passes no onclose: the previous one is replaced', async () => {
    const first = vi.fn();
    const second = vi.fn();
    message.info({ content: 'a', key: 'k', duration: 0, onclose: first });
    message.info({ content: 'b', key: 'k', duration: 0, onclose: second });
    message.destroy('k');
    await settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('icon', () => {
  it('shows the icon of the type, decorative, and never a role="img" with a file name', async () => {
    for (const type of MESSAGE_TYPES) message.open({ type, content: type, duration: 0 });
    await tick();
    for (const box of boxes()) {
      const icon = box.querySelector('.ads-message-icon')!;
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon.querySelector('svg')).not.toBeNull();
      expect(box.querySelector('[role="img"]')).toBeNull();
    }
  });

  it('a string, a snippet, and false', async () => {
    message.info({ content: 'a', icon: '🎉', duration: 0 });
    message.info({ content: 'b', icon: rich, duration: 0 });
    message.info({ content: 'c', icon: false, duration: 0 });
    await tick();
    const [a, b, c] = boxes();
    expect(a.querySelector('.ads-message-icon')).toHaveTextContent('🎉');
    expect(a.querySelector('svg')).toBeNull();
    expect(b.querySelector('.ads-message-icon [data-testid="rich"]')).not.toBeNull();
    expect(c.querySelector('.ads-message-icon')).toBeNull();
  });
});

describe('class, style, classNames, styles', () => {
  it('class and style go on the box: a string and an object', async () => {
    message.info({ content: 'a', class: 'mine', style: 'color: red', duration: 0 });
    message.info({ content: 'b', style: { color: 'blue', '--x': 1 }, duration: 0 });
    await tick();
    const [a, b] = boxes();
    expect(a).toHaveClass('mine');
    expect(a.style.color).toBe('red');
    expect(b.style.color).toBe('blue');
    expect(b.style.getPropertyValue('--x')).toBe('1');
  });

  it('classNames and styles reach every part, the close button included', async () => {
    message.info({
      content: 'a',
      closable: true,
      duration: 0,
      classNames: { root: 'c-root', wrapper: 'c-wrapper', icon: 'c-icon', title: 'c-title', close: 'c-close' },
      styles: { root: { color: 'red' }, wrapper: { gap: '1px' }, icon: { opacity: 0.5 }, title: { 'font-weight': 700 }, close: { margin: 0 } }
    });
    await tick();
    const box = boxes()[0];
    for (const name of ['root', 'wrapper', 'icon', 'title', 'close']) {
      const element = name === 'root' ? box : box.querySelector(`.c-${name}`)!;
      expect(element, name).toHaveClass(`c-${name}`);
    }
    expect(box.style.color).toBe('red');
    expect(box.querySelector<HTMLElement>('.c-wrapper')!.style.gap).toBe('1px');
    expect(box.querySelector<HTMLElement>('.c-icon')!.style.opacity).toBe('0.5');
    expect(box.querySelector<HTMLElement>('.c-title')!.style.fontWeight).toBe('700');
    expect(box.querySelector<HTMLElement>('.c-close')!.style.margin).toBe('0px');
  });

  it('the message wins over the host, which wins over config()', async () => {
    message.config({ classNames: { root: 'from-config', title: 'title-config' }, styles: { root: { color: 'red' } } });
    render(MessageHostHarness, { props: { classNames: { root: 'from-host' }, styles: { root: { color: 'green' } } } });
    await tick();
    message.info({ content: 'a', duration: 0 });
    message.info({ content: 'b', duration: 0, classNames: { root: 'own' }, styles: { root: { color: 'blue' } } });
    await tick();
    const [a, b] = boxes();
    expect(a).toHaveClass('from-host');
    expect(a).not.toHaveClass('from-config');
    expect(a.style.color).toBe('green');
    expect(a.querySelector('.title-config')).not.toBeNull();
    expect(b).toHaveClass('own');
    expect(b).not.toHaveClass('from-host');
    expect(b.style.color).toBe('blue');
  });

  it('list and listContent take their own class and style from the host and config', async () => {
    message.config({ classNames: { list: 'l1' }, styles: { listContent: { gap: '2px' } } });
    message.info('x', 0);
    await tick();
    expect(document.querySelector('.ads-message-list')).toHaveClass('l1');
    expect(document.querySelector<HTMLElement>('.ads-message-list-content')!.style.gap).toBe('2px');
  });
});

describe('the pause', () => {
  it('the pointer over the message holds the timer, and leaving resumes with the time that was left', async () => {
    message.info('x');
    await tick();
    const item = document.querySelector('.ads-message-item')!;
    await settle(1000);
    pointer(item, 'pointerenter');
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
    pointer(item, 'pointerleave');
    await settle(1999);
    expect(boxes()).toHaveLength(1);
    await settle(1);
    expect(boxes()).toHaveLength(0);
  });

  it('pauseOnHover: false does not pause', async () => {
    message.info({ content: 'x', pauseOnHover: false });
    await tick();
    pointer(document.querySelector('.ads-message-item')!, 'pointerenter');
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });

  it('a touch does not pause (a tap leaves a hover behind that would never end)', async () => {
    message.info('x');
    await tick();
    pointer(document.querySelector('.ads-message-item')!, 'pointerenter', 'touch');
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });

  it('a pen pauses like a mouse', async () => {
    message.info('x');
    await tick();
    pointer(document.querySelector('.ads-message-item')!, 'pointerenter', 'pen');
    await settle(5000);
    expect(boxes()).toHaveLength(1);
  });

  it('focus inside the message holds the timer, and moving it away releases it', async () => {
    message.info({ content: 'x', closable: true });
    message.info({ content: 'y', duration: 0 });
    await tick();
    const button = screen.getByRole('button');
    button.focus();
    await settle(10_000);
    expect(boxes()).toHaveLength(2);
    (document.body as HTMLElement).focus();
    button.blur();
    await settle(3000);
    expect(boxes()).toHaveLength(1);
  });

  it('focus moving between two controls inside the same message keeps it held', async () => {
    const link = createRawSnippet(() => ({ render: () => '<a href="#x" data-testid="link">link</a>' }));
    message.info({ content: link, closable: true });
    await tick();
    screen.getByTestId('link').focus();
    screen.getByRole('button').focus();
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
  });

  it('a hidden page holds the timer, and coming back releases it', async () => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    message.info('x');
    await tick();
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });

  it('a message opened while the page is hidden waits until it is shown', async () => {
    let hidden = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    message.info('x');
    await tick();
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });

  it('an update while the pointer is over the message keeps it held', async () => {
    message.info({ content: 'a', key: 'k', duration: 1 });
    await tick();
    pointer(document.querySelector('.ads-message-item')!, 'pointerenter');
    message.info({ content: 'b', key: 'k', duration: 1 });
    await settle(10_000);
    expect(boxes()).toHaveLength(1);
  });

  it('an update that removes a focused control releases the focus hold', async () => {
    message.info({ content: 'a', key: 'k', closable: true });
    await tick();
    screen.getByRole('button').focus();
    message.info({ content: 'b', key: 'k' });
    await settle(3000);
    expect(boxes()).toHaveLength(0);
  });
});

describe('closing', () => {
  it('the handle closes the message, and closing twice is harmless', async () => {
    const onclose = vi.fn();
    const hide = message.info({ content: 'x', duration: 0, onclose });
    await tick();
    hide();
    hide();
    await settle();
    expect(boxes()).toHaveLength(0);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('the handle is thenable: then resolves when the message starts to close, and await waits for it', async () => {
    const hide = message.info('x', 1);
    await tick();
    const done = vi.fn();
    hide.then(done);
    await settle(999);
    expect(done).not.toHaveBeenCalled();
    await settle(1);
    expect(done).toHaveBeenCalledTimes(1);
    const second = message.info('y', 0);
    const awaited = vi.fn();
    void (async () => {
      await second;
      awaited();
    })();
    await settle(100);
    expect(awaited).not.toHaveBeenCalled();
    second();
    await settle();
    expect(awaited).toHaveBeenCalledTimes(1);
  });

  it('then passes a rejection handler through and chains', async () => {
    const hide = message.info('x', 0);
    const value = hide.then(() => 'after');
    hide();
    await expect(value).resolves.toBe('after');
    await expect(hide.then(undefined, () => 'never')).resolves.toBeUndefined();
  });

  it('onclose runs once, for the timer, the handle, destroy(key), destroy() and maxCount', async () => {
    const calls = { timer: vi.fn(), handle: vi.fn(), key: vi.fn(), all: vi.fn(), count: vi.fn() };
    message.config({ maxCount: 5 });
    message.info('t', 1, calls.timer);
    const hide = message.info({ content: 'h', duration: 0, onclose: calls.handle });
    message.info({ content: 'k', key: 'k', duration: 0, onclose: calls.key });
    message.info({ content: 'a', duration: 0, onclose: calls.all });
    await settle(1000);
    expect(calls.timer).toHaveBeenCalledTimes(1);
    hide();
    message.destroy('k');
    message.destroy();
    message.destroy();
    await settle(5000);
    for (const name of ['timer', 'handle', 'key', 'all'] as const) expect(calls[name], name).toHaveBeenCalledTimes(1);
    message.config({ maxCount: 1 });
    message.info({ content: 'one', duration: 0, onclose: calls.count });
    message.info({ content: 'two', duration: 0 });
    await settle();
    expect(calls.count).toHaveBeenCalledTimes(1);
  });

  it('a message that is still leaving is not closed again and does not catch destroy(key)', async () => {
    const onclose = vi.fn();
    const hide = message.info({ content: 'x', key: 'k', duration: 0, onclose });
    await tick();
    hide();
    message.destroy('k');
    await settle();
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});

describe('onclick', () => {
  it('is called with the event when the box is clicked, and a click does not close the message', async () => {
    const onclick = vi.fn();
    message.info({ content: 'x', duration: 0, onclick });
    await tick();
    boxes()[0].click();
    await settle();
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(boxes()).toHaveLength(1);
  });

  it('a box without onclick can be clicked', async () => {
    message.info('x', 0);
    await tick();
    boxes()[0].click();
    expect(boxes()).toHaveLength(1);
  });

  it('the close button does not call it', async () => {
    const onclick = vi.fn();
    message.info({ content: 'x', duration: 0, closable: true, onclick });
    await tick();
    screen.getByRole('button').click();
    await settle();
    expect(onclick).not.toHaveBeenCalled();
    expect(boxes()).toHaveLength(0);
  });
});

describe('closable', () => {
  it('the button exists only with closable, and the name is "Close"', async () => {
    message.info({ content: 'a', duration: 0 });
    message.info({ content: 'b', duration: 0, closable: true });
    await tick();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });

  it('the name can be translated, per host and per config', async () => {
    render(MessageHostHarness, { props: { labels: { close: 'Закрыть' }, closable: true } });
    await tick();
    message.info('x', 0);
    await tick();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('a click, Enter and Space close the message', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    message.info({ content: 'a', duration: 0, closable: true });
    await tick();
    await user.click(screen.getByRole('button'));
    await settle();
    expect(boxes()).toHaveLength(0);
    for (const key of ['{Enter}', ' ']) {
      message.info({ content: 'b', duration: 0, closable: true });
      await tick();
      screen.getByRole('button').focus();
      await user.keyboard(key);
      await settle();
      expect(boxes()).toHaveLength(0);
    }
  });

  it('Escape inside the message closes it; Escape elsewhere does not', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    message.info({ content: 'a', duration: 0, closable: true });
    await tick();
    await user.keyboard('{Escape}');
    await settle();
    expect(boxes()).toHaveLength(1);
    screen.getByRole('button').focus();
    await user.keyboard('{Escape}');
    await settle();
    expect(boxes()).toHaveLength(0);
  });

  it('Escape during an IME composition is ignored', async () => {
    message.info({ content: 'a', duration: 0, closable: true });
    await tick();
    screen.getByRole('button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }));
    await settle();
    expect(boxes()).toHaveLength(1);
  });

  it('closable on the host or config is the default, and the message may say otherwise', async () => {
    message.config({ closable: true });
    message.info({ content: 'a', duration: 0 });
    message.info({ content: 'b', duration: 0, closable: false });
    await tick();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('maxCount', () => {
  it('closes the oldest message to make room', async () => {
    message.config({ maxCount: 2 });
    message.info('a', 0);
    message.info('b', 0);
    message.info('c', 0);
    await settle();
    expect(texts()).toEqual(['Info: b', 'Info: c']);
  });

  it('applies when the limit is lowered while messages are open', async () => {
    message.info('a', 0);
    message.info('b', 0);
    message.info('c', 0);
    await tick();
    message.config({ maxCount: 1 });
    await settle();
    expect(texts()).toEqual(['Info: c']);
  });

  it('ignores a value below 1 or not finite, and floors a fraction', async () => {
    message.config({ maxCount: 0 });
    message.info('a', 0);
    message.info('b', 0);
    await tick();
    expect(boxes()).toHaveLength(2);
    message.config({ maxCount: 1.9 });
    await settle();
    expect(boxes()).toHaveLength(1);
  });
});

describe('the layer: top, container and the host', () => {
  it('top: a number is pixels, a string is as given, and the token applies without it', async () => {
    message.info('x', 0);
    await tick();
    const list = () => document.querySelector<HTMLElement>('.ads-message-list')!;
    expect(list().getAttribute('style')).toBeNull();
    message.config({ top: 40 });
    await tick();
    expect(list().style.top).toBe('40px');
    message.config({ top: '5vh' });
    await tick();
    expect(list().style.top).toBe('5vh');
  });

  it('container: an element and a function; the layer is moved there and leaves nothing behind', async () => {
    const box = document.body.appendChild(document.createElement('section'));
    message.config({ container: box });
    message.info('x', 1);
    await tick();
    expect(box.querySelector('.ads-message-list')).not.toBeNull();
    await settle(1000);
    expect(document.querySelector('.ads-message-list')).toBeNull();
    const other = document.body.appendChild(document.createElement('aside'));
    message.config({ container: () => other });
    message.info('y', 0);
    await tick();
    expect(other.querySelector('.ads-message-list')).not.toBeNull();
    expect(box.querySelector('.ads-message-list')).toBeNull();
  });

  it('with no host the library makes a layer on the body, and removes it when the last message has left', async () => {
    expect(document.querySelector('.ads-message-list')).toBeNull();
    message.info('x', 1);
    await tick();
    expect(document.body.querySelector(':scope > .ads-message-list')).not.toBeNull();
    await settle(1000);
    expect(document.querySelector('.ads-message-list')).toBeNull();
    expect(document.body.innerHTML.replace(/<!---->/g, '')).toBe('');
    message.info('y', 0);
    await tick();
    expect(document.querySelectorAll('.ads-message-list')).toHaveLength(1);
  });

  it('a MessageHost draws the messages, and its props are the settings', async () => {
    render(MessageHostHarness, { props: { top: 20, duration: 1, maxCount: 2 } });
    await tick();
    message.info('a');
    message.info('b');
    message.info('c');
    await settle();
    expect(texts()).toEqual(['Info: b', 'Info: c']);
    expect(document.querySelector<HTMLElement>('.ads-message-list')!.style.top).toBe('20px');
    await settle(1000);
    expect(boxes()).toHaveLength(0);
  });

  it('a host that is mounted takes the messages over from the library layer, and gives them back when it goes', async () => {
    message.info('x', 0);
    await tick();
    expect(document.querySelectorAll('.ads-message-list')).toHaveLength(1);
    const view = render(MessageHostHarness);
    await tick();
    await tick();
    expect(document.querySelectorAll('.ads-message-list')).toHaveLength(1);
    expect(texts()).toEqual(['Info: x']);
    view.unmount();
    await tick();
    await tick();
    expect(texts()).toEqual(['Info: x']);
    expect(document.querySelectorAll('.ads-message-list')).toHaveLength(1);
  });

  it('a host in the tree moves its layer to the container and removes it when it is destroyed', async () => {
    const view = render(MessageHostHarness);
    await tick();
    message.info('x', 0);
    await tick();
    expect(view.container.querySelector('.ads-message-list')).toBeNull();
    expect(document.body.querySelector(':scope > .ads-message-list')).not.toBeNull();
    view.unmount();
    await tick();
    expect(document.querySelector('.ads-message-list')).not.toBeNull(); // the library layer took over
    message.destroy();
    await settle();
    expect(document.querySelector('.ads-message-list')).toBeNull();
  });

  it('a second host draws nothing and warns in development; the first goes on drawing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(MessageHostHarness, { props: { second: true } });
    await tick();
    await tick();
    message.info('x', 0);
    await tick();
    expect(document.querySelectorAll('.ads-message-list')).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('another MessageHost');
    message.info('y', 0);
    await tick();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('props of the host that change apply at once', async () => {
    const view = render(MessageHostHarness, { props: { top: 10 } });
    await tick();
    message.info('x', 0);
    await tick();
    await view.rerender({ top: 30 });
    await tick();
    expect(document.querySelector<HTMLElement>('.ads-message-list')!.style.top).toBe('30px');
  });

  it('config() changes apply to the next message and to the layer of open ones', async () => {
    message.info('a', 0);
    await tick();
    message.config({ labels: { info: 'Note' } });
    message.info('b', 0);
    await tick();
    expect(texts()).toEqual(['Note: a', 'Note: b']);
  });
});

describe('the list', () => {
  it('new messages come below the older ones', async () => {
    message.info('a', 0);
    message.info('b', 0);
    message.info('c', 0);
    await tick();
    expect(texts()).toEqual(['Info: a', 'Info: b', 'Info: c']);
  });
});

describe('stack', () => {
  const open = async (count: number, options: Record<string, unknown> = {}) => {
    for (let index = 1; index <= count; index++) message.info({ content: `m${index}`, duration: 0, ...options });
    await tick();
  };

  it('off by default: no pile classes', async () => {
    await open(5);
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    expect(document.querySelector('.ads-message-stack')).toBeNull();
  });

  it('on: the newest message is the first row, even for two', async () => {
    message.config({ stack: true });
    await open(2);
    expect(texts()).toEqual(['Info: m2', 'Info: m1']);
    expect(document.querySelector('.ads-message-piled')).toBeNull();
  });

  it('up to the threshold the list is plain; above it, a pile', async () => {
    message.config({ stack: true });
    await open(3);
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    message.info({ content: 'm4', duration: 0 });
    await tick();
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
    expect(slots().map((slot) => slot.dataset.depth)).toEqual(['0', '1', '2', '2']);
  });

  it('a custom threshold, and an object without one means 3', async () => {
    message.config({ stack: { threshold: 1 } });
    await open(2);
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
    message.destroy();
    await settle();
    message.config({ stack: {} });
    await open(3);
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    message.destroy();
    await settle();
    message.config({ stack: { threshold: 0 } });
    await open(3);
    expect(document.querySelector('.ads-message-piled')).toBeNull();
  });

  it('the older messages of a pile are inert, hidden from a screen reader and out of the Tab order', async () => {
    message.config({ stack: true });
    await open(4, { closable: true });
    const items = [...document.querySelectorAll<HTMLElement>('.ads-message-item')];
    expect(items[0]).not.toHaveAttribute('inert');
    for (const item of items.slice(1)) {
      expect(item).toHaveAttribute('inert');
      expect(item).toHaveAttribute('aria-hidden', 'true');
      expect(item.querySelector('button')).toHaveAttribute('tabindex', '-1');
    }
    expect(items[0].querySelector('button')).not.toHaveAttribute('tabindex');
  });

  it('the pointer over the pile opens it, and leaving closes it again', async () => {
    message.config({ stack: true });
    await open(4);
    const content = document.querySelector('.ads-message-list-content')!;
    pointer(content, 'pointerenter');
    await tick();
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    for (const item of document.querySelectorAll('.ads-message-item')) expect(item).not.toHaveAttribute('inert');
    pointer(content, 'pointerleave');
    await tick();
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('a touch does not open the pile', async () => {
    message.config({ stack: true });
    await open(4);
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerenter', 'touch');
    await tick();
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('focus in the pile opens it, and moving focus out closes it', async () => {
    message.config({ stack: true });
    await open(4, { closable: true });
    const first = document.querySelector<HTMLButtonElement>('.ads-message-item:not([inert]) button')!;
    first.focus();
    await tick();
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    first.blur();
    await tick();
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('the pile does not stay open when the list went away under the pointer (a removed element sends no pointerleave)', async () => {
    // The fault of a public issue of the React package: a row closed under the pointer left "the pointer is over the list" set.
    // With a `MessageHost` the layer stays mounted when the list is empty, so what it remembers outlives the list.
    render(MessageHostHarness, { props: { stack: true } });
    await tick();
    await open(4);
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerenter');
    await tick();
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    message.destroy();
    await settle(1000);
    expect(document.querySelector('.ads-message-list-content')).toBeNull();
    await open(4);
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('the pile does not stay open when the list went away with focus in it', async () => {
    render(MessageHostHarness, { props: { stack: true } });
    await tick();
    await open(4, { closable: true });
    document.querySelector<HTMLButtonElement>('.ads-message-item:not([inert]) button')!.focus();
    await tick();
    expect(document.querySelector('.ads-message-piled')).toBeNull();
    message.destroy();
    await settle(1000);
    expect(document.querySelector('.ads-message-list-content')).toBeNull();
    await open(4);
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });

  it('every timer in an open pile stands still, and goes on when it closes', async () => {
    message.config({ stack: true });
    for (const name of ['a', 'b', 'c', 'd']) message.info({ content: name, duration: 2 });
    await tick();
    const content = document.querySelector('.ads-message-list-content')!;
    pointer(content, 'pointerenter');
    await settle(10_000);
    expect(boxes()).toHaveLength(4);
    pointer(content, 'pointerleave');
    await settle(2000);
    expect(boxes()).toHaveLength(0);
  });

  it('pauseOnHover: false lets the timer of such a message run while the pile is open by the pointer, but not by focus', async () => {
    message.config({ stack: true });
    for (const name of ['a', 'b', 'c']) message.info({ content: name, duration: 2 });
    message.info({ content: 'd', duration: 2, pauseOnHover: false, closable: true });
    await tick();
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerenter');
    await settle(2000);
    expect(texts()).toEqual(['Info: c', 'Info: b', 'Info: a']);
    pointer(document.querySelector('.ads-message-list-content')!, 'pointerleave');
    await settle(2000);
    expect(boxes()).toHaveLength(0);
  });

  it('a message leaving the pile lets it open into a plain list', async () => {
    message.config({ stack: true });
    await open(4);
    message.destroy('nothing');
    const hide = message.info({ content: 'm5', duration: 0 });
    await tick();
    hide();
    await settle();
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
    message.destroy();
    await settle();
    expect(document.querySelector('.ads-message-list')).toBeNull();
  });

  it('the stack option on a host: a plain host with stack true', async () => {
    render(MessageHostHarness, { props: { stack: { threshold: 2 } } });
    await tick();
    await open(3);
    expect(document.querySelector('.ads-message-piled')).not.toBeNull();
  });
});

describe('ARIA', () => {
  it('error and warning are alerts, the rest are status messages', async () => {
    for (const type of MESSAGE_TYPES) message.open({ type, content: type, duration: 0 });
    await tick();
    expect(boxes().map((box) => box.getAttribute('role'))).toEqual(['status', 'status', 'alert', 'alert', 'status']);
  });

  it('a hidden word before the text names the type, and it can be translated or removed', async () => {
    message.config({ labels: { success: 'Готово', warning: '' } });
    message.success('Сохранено', 0);
    message.warning('Осторожно', 0);
    await tick();
    expect(texts()).toEqual(['Готово: Сохранено', 'Осторожно']);
  });

  it('opening a message never moves focus', async () => {
    const button = document.body.appendChild(document.createElement('button'));
    button.focus();
    message.error({ content: 'x', duration: 0, closable: true });
    await tick();
    expect(document.activeElement).toBe(button);
  });

  it('without closable nothing in the message can take focus', async () => {
    message.info('x', 0);
    await tick();
    expect(document.querySelector('.ads-message')!.querySelector('button, a, [tabindex]')).toBeNull();
  });

  it('has no serious accessibility violations with every type and a close button', async () => {
    for (const type of MESSAGE_TYPES) message.open({ type, content: `${type} text`, duration: 0, closable: true });
    await tick();
    vi.useRealTimers();
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')).toEqual([]);
  });
});

describe('reactivity', () => {
  it('a new message opened after config() gets the new settings; an open one keeps its own', async () => {
    message.info({ content: 'a', duration: 1 });
    message.config({ duration: 10 });
    message.info('b');
    await tick();
    await settle(1000);
    expect(texts()).toEqual(['Info: b']);
  });
});

describe('on a server', () => {
  it('every call is a no-op that returns an inert handle, and nothing is stored', async () => {
    vi.stubGlobal('document', undefined);
    const handle = message.success('Saved');
    message.open({ content: 'x', key: 'k' });
    message.destroy('k');
    ensureLayer();
    const done = vi.fn();
    await handle.then(done);
    expect(() => handle()).not.toThrow();
    vi.unstubAllGlobals();
    expect(done).toHaveBeenCalledTimes(1);
    expect(getSnapshot().records).toHaveLength(0);
    expect(document.querySelector('.ads-message-list')).toBeNull();
  });

  it('a page rendered on a server stores nothing, registers no host, and the MessageHost renders nothing', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/MessageServerHarness.svelte', props: {} }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('function|0|no-host');
    expect(html).not.toContain('ads-message');
  });
});

describe('a message above a Modal (specs/modal.md, D4)', () => {
  it('the layer carries data-ads-overlay-keep, the attribute that keeps a layer out of what an open Modal puts out of reach', async () => {
    message.info('Saved', 0);
    await tick();
    expect(document.querySelector('.ads-message-list')).toHaveAttribute('data-ads-overlay-keep');
  });
});
