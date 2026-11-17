// The overflow of a horizontal bar (specs/menu.md, Behavior): items that do not fit move into a "…" item. jsdom has no layout,
// so the widths are given to the entries and to the bar; the real measuring is in e2e/menu.spec.ts.
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuHarness from './fixtures/MenuHarness.svelte';
import { byKey, hoverIn, hoverOut, items, keydown, open, popupLists, rootList, selected, touchDown } from './menuHelpers';

let widths: number[] = [];
let moreWidth = 40;
let containerWidth = 1000;

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;
  constructor(public callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

/** The observer the menu made for its bar: the one that watches the root list. */
const barObserver = () => FakeResizeObserver.instances.find((observer) => observer.observed.has(rootList()))!;
const refresh = async () => {
  barObserver().callback();
  await tick();
};

beforeEach(() => {
  widths = [100, 100, 100, 100, 100];
  moreWidth = 40;
  containerWidth = 1000;
  FakeResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    let width = 0;
    if (this.matches('li[data-ads-top]')) width = widths[Number(this.getAttribute('data-ads-top'))] ?? 100;
    else if (this.matches('li[data-ads-more]')) width = moreWidth;
    return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: 0, width, height: 0, toJSON: () => ({}) } as DOMRect;
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('ads-menu-root') ? containerWidth : 0;
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
  document.body.innerHTML = '';
});

const entries = () => Array.from(rootList().querySelectorAll<HTMLElement>(':scope > li[data-ads-top]'));
const hiddenEntries = () => entries().filter((entry) => entry.hasAttribute('data-ads-hidden')).map((entry) => entry.querySelector<HTMLElement>('[data-ads-key]')?.dataset.adsKey);
const more = () => rootList().querySelector<HTMLElement>(':scope > li[data-ads-more]')!;
const moreTitle = () => more().querySelector<HTMLElement>('[role=menuitem]')!;
const bar = async (props: Record<string, unknown> = {}) => {
  const view = render(MenuHarness, { props: { items, mode: 'horizontal', 'aria-label': 'Bar', ...props } });
  await tick();
  return view;
};

describe('Menu: the overflow of a horizontal bar', () => {
  it('everything fits: no entry is hidden, and the "…" item is not shown (and not reachable)', async () => {
    await bar();
    expect(hiddenEntries()).toEqual([]);
    expect(more()).toHaveClass('ads-menu-more-hidden');
    expect(more()).toHaveAttribute('data-ads-hidden');
  });

  it('too narrow: the entries that fit stay, the others are hidden, and the "…" item is shown', async () => {
    containerWidth = 300;
    await bar();
    expect(hiddenEntries()).toEqual(['c', 'sub', 'z']);
    expect(entries().filter((entry) => entry.classList.contains('ads-menu-overflowed'))).toHaveLength(3);
    expect(more()).not.toHaveClass('ads-menu-more-hidden');
    expect(more()).not.toHaveAttribute('data-ads-hidden');
  });

  it('the room of the "…" item is kept: two entries and the item fit 240, three do not', async () => {
    containerWidth = 240;
    await bar();
    expect(hiddenEntries()).toEqual(['c', 'sub', 'z']);
    containerWidth = 239;
    await refresh();
    expect(hiddenEntries()).toEqual(['b', 'c', 'sub', 'z']);
  });

  it('the "…" item has the name of overflowLabel, and says it opens a menu', async () => {
    containerWidth = 300;
    await bar();
    expect(screen.getByRole('menuitem', { name: 'More' })).toBe(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    document.body.innerHTML = '';
    await bar({ overflowLabel: 'Ещё' });
    expect(screen.getByRole('menuitem', { name: 'Ещё' })).toBeInTheDocument();
  });

  it('overflowedIndicator is text or a snippet, in place of the dots', async () => {
    containerWidth = 300;
    const view = await bar({ overflowedIndicator: 'more' });
    expect(moreTitle()).toHaveTextContent('more');
    expect(moreTitle().querySelector('svg')).toBeNull();
    view.unmount();
    await bar({ variant: 'dots' });
    expect(screen.getByTestId('dots')).toBeInTheDocument();
    document.body.innerHTML = '';
    await bar();
    expect(moreTitle().querySelector('svg')).not.toBeNull();
  });

  it('the pointer on the "…" item opens a popup with the hidden items, in their order, with their roles and states', async () => {
    containerWidth = 300;
    await bar({ selectedKeys: ['z'] });
    hoverIn(moreTitle());
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    const list = popupLists()[0];
    expect(list).toHaveAttribute('aria-labelledby', moreTitle().id);
    expect(Array.from(list.querySelectorAll('[role^=menuitem]')).map((entry) => entry.textContent?.trim())).toEqual(['Gamma', 'Sub', 'Zed']);
    expect(list.querySelector('[data-ads-key=c]')).toHaveAttribute('aria-disabled', 'true');
    expect(list.querySelector('[data-ads-key=z]')).toHaveAttribute('aria-checked', 'true');
    expect(open()).toBe('');
  });

  it('a click on the "…" item opens the popup; choosing an item in it selects it and closes the popup', async () => {
    containerWidth = 300;
    const onclick = vi.fn();
    await bar({ onclick });
    await fireEvent.click(moreTitle());
    expect(popupLists()).toHaveLength(1);
    await fireEvent.click(popupLists()[0].querySelector('[data-ads-key=z]')!);
    expect(selected()).toBe('z');
    expect(onclick.mock.calls[0][0].keyPath).toEqual(['z']);
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a submenu in the "…" popup opens beside it, and the chain stays open while the pointer is in it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    containerWidth = 300;
    await bar();
    hoverIn(moreTitle());
    await tick();
    hoverOut(moreTitle());
    hoverIn(popupLists()[0]);
    hoverIn(popupLists()[0].querySelector<HTMLElement>('[data-ads-key=sub]')!);
    await tick();
    expect(open()).toBe('sub');
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    hoverOut(popupLists()[0].querySelector<HTMLElement>('[data-ads-key=sub]')!);
    hoverOut(popupLists()[0]);
    hoverIn(popupLists()[1]);
    await vi.advanceTimersByTimeAsync(500);
    expect(open()).toBe('sub');
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    hoverOut(popupLists()[1]);
    await vi.advanceTimersByTimeAsync(200);
    await tick();
    expect(open()).toBe('');
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    vi.useRealTimers();
  });

  it('a submenu in the "…" popup opens one popup, not two: its hidden twin in the bar stays closed', async () => {
    containerWidth = 300;
    await bar();
    hoverIn(moreTitle());
    await tick();
    const lists = popupLists();
    expect(lists).toHaveLength(1);
    const title = lists[0].querySelector<HTMLElement>('[data-ads-key=sub]')!;
    hoverIn(title);
    await tick();
    expect(open()).toBe('sub');
    // The "…" popup and the popup of the submenu; the entry of the bar that is hidden has no popup of its own.
    expect(popupLists()).toHaveLength(2);
    const twins = Array.from(rootList().querySelectorAll<HTMLElement>(':scope > li[data-ads-hidden] [data-ads-key=sub]'));
    expect(twins).toHaveLength(1);
    expect(twins[0]).toHaveAttribute('aria-expanded', 'false');
    expect(twins[0].closest('li')!.querySelector('.ads-popup:not([hidden])')).toBeNull();
    // The twin must not make an id of the page appear twice (aria-labelledby and aria-controls point at ids).
    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('a group that did not fit is in the "…" popup, and the hidden one takes no id: the ids of the page stay unique', async () => {
    containerWidth = 150;
    const list: MenuItems = [
      { key: 'a', label: 'A' },
      { type: 'group', label: 'G', children: [{ key: 'g1', label: 'G1' }] }
    ];
    await bar({ items: list });
    hoverIn(moreTitle());
    await tick();
    expect(popupLists()[0].querySelector('[role=group]')).not.toBeNull();
    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    const twin = rootList().querySelector<HTMLElement>(':scope > li[data-ads-hidden] [role=group]')!;
    expect(twin).not.toHaveAttribute('aria-labelledby');
  });

  it('the pointer leaving the "…" popup closes it after the delay; the pointer back on the item reopens it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    containerWidth = 300;
    await bar();
    hoverIn(moreTitle());
    await tick();
    hoverOut(moreTitle());
    await vi.advanceTimersByTimeAsync(150);
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    hoverIn(moreTitle());
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    hoverIn(moreTitle());
    await vi.advanceTimersByTimeAsync(300);
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    vi.useRealTimers();
  });

  it('the "…" item opens by hover after subMenuOpenDelay, like a submenu', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    containerWidth = 300;
    await bar({ subMenuOpenDelay: 0.4 });
    hoverIn(moreTitle());
    await vi.advanceTimersByTimeAsync(300);
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    await vi.advanceTimersByTimeAsync(200);
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    vi.useRealTimers();
  });

  it('a click on the "…" item that is open leaves it open when the pointer opens popups, as a click on a submenu title does', async () => {
    containerWidth = 300;
    await bar({ subMenuCloseDelay: 5 });
    await fireEvent.click(moreTitle());
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('the pointer on a title that is disabled, with the "…" popup open, closes the popup after the delay', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    containerWidth = 300;
    const list: MenuItems = [
      { key: 'a', label: 'A' },
      { key: 'd', label: 'D', disabled: true, children: [{ key: 'd1', label: 'D1' }] },
      { key: 'h1', label: 'H1' },
      { key: 'h2', label: 'H2' }
    ];
    await bar({ items: list });
    hoverIn(moreTitle());
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    hoverOut(moreTitle());
    hoverIn(byKey('d'));
    await vi.advanceTimersByTimeAsync(200);
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    vi.useRealTimers();
  });

  it('a press outside closes the popup of the "…" item, and Escape closes it with focus on the item', async () => {
    containerWidth = 300;
    await bar({ triggerSubMenuAction: 'click' });
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(moreTitle());
    moreTitle().focus();
    await keydown(document.body, 'Escape');
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    expect(moreTitle()).toHaveFocus();
  });

  it('touch: a tap on the "…" item opens the popup, and a second tap closes it', async () => {
    containerWidth = 300;
    await bar();
    touchDown(moreTitle());
    hoverIn(moreTitle());
    hoverOut(moreTitle());
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    touchDown(moreTitle());
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closing the "…" popup closes the submenus that are open in it, and only those', async () => {
    containerWidth = 250;
    const list: MenuItems = [
      { key: 'v', label: 'Visible', children: [{ key: 'v1', label: 'V1' }] },
      { key: 'h0', label: 'H0' },
      { key: 'h', label: 'Hidden', children: [{ key: 'h1', label: 'H1' }] }
    ];
    await bar({ items: list, triggerSubMenuAction: 'click', openKeys: ['v'] });
    await fireEvent.click(moreTitle());
    expect(open()).toBe('');
    await fireEvent.click(popupLists().map((list) => list.querySelector<HTMLElement>('[data-ads-key=h]')).find(Boolean)!);
    expect(open()).toBe('h');
    await fireEvent.click(moreTitle());
    expect(open()).toBe('');
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('with the click trigger, a click toggles the popup of the "…" item', async () => {
    containerWidth = 300;
    await bar({ triggerSubMenuAction: 'click' });
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a hidden item that is selected marks the "…" item, as a submenu with a selected item is marked', async () => {
    containerWidth = 300;
    await bar({ selectedKeys: ['z'] });
    expect(moreTitle()).toHaveClass('ads-menu-submenu-selected');
    document.body.innerHTML = '';
    await bar({ selectedKeys: ['a'] });
    expect(moreTitle()).not.toHaveClass('ads-menu-submenu-selected');
  });

  it('a selected item inside a hidden submenu marks it too', async () => {
    containerWidth = 300;
    await bar({ selectedKeys: ['d1'] });
    expect(moreTitle()).toHaveClass('ads-menu-submenu-selected');
  });

  it('a group counts as one entry, and a hidden group marks the "…" item when it holds the selected item', async () => {
    containerWidth = 150;
    const list: MenuItems = [
      { key: 'a', label: 'A' },
      { type: 'group', label: 'G', children: [{ key: 'g1', label: 'G1' }] },
      { type: 'divider' }
    ];
    await bar({ items: list, selectedKeys: ['g1'] });
    expect(moreTitle()).toHaveClass('ads-menu-submenu-selected');
    expect(rootList().querySelectorAll(':scope > li[data-ads-top][data-ads-hidden]')).toHaveLength(2);
  });

  it('follows the width of the bar when it changes (the observer of the bar)', async () => {
    containerWidth = 300;
    await bar();
    expect(hiddenEntries()).toEqual(['c', 'sub', 'z']);
    containerWidth = 1000;
    await refresh();
    expect(hiddenEntries()).toEqual([]);
    expect(more()).toHaveClass('ads-menu-more-hidden');
    containerWidth = 150;
    await refresh();
    expect(hiddenEntries()).toEqual(['b', 'c', 'sub', 'z']);
  });

  it('watches the bar and each of its entries, the hidden ones too, and stops when the menu goes', async () => {
    containerWidth = 300;
    const view = await bar();
    const observer = barObserver();
    expect(observer.observed.has(rootList())).toBe(true);
    for (const entry of rootList().querySelectorAll(':scope > li')) expect(observer.observed.has(entry)).toBe(true);
    view.unmount();
    expect(observer.disconnected).toBe(true);
  });

  it('the margins of the entries are part of their width', async () => {
    const style = document.createElement('style');
    style.textContent = 'ul.ads-menu-root > li[data-ads-top] { margin-left: 10px; margin-right: 5px; }';
    document.head.append(style);
    containerWidth = 250;
    await bar();
    // 40 for the "…" item and 115 for each entry: one fits. Without the margins two would.
    expect(hiddenEntries()).toEqual(['b', 'c', 'sub', 'z']);
    style.remove();
  });

  it('the popup of the "…" item is closed when the mode changes: a bar that comes back starts with it closed', async () => {
    containerWidth = 300;
    const view = await bar();
    await fireEvent.click(moreTitle());
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'true');
    await view.rerender({ mode: 'vertical' });
    await tick();
    await view.rerender({ mode: 'horizontal' });
    await tick();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('measures again when the items change', async () => {
    containerWidth = 250;
    const view = await bar();
    expect(hiddenEntries()).toEqual(['c', 'sub', 'z']);
    await view.rerender({ items: items.slice(0, 3) });
    await tick();
    expect(hiddenEntries()).toEqual(['c']);
  });

  it('a bar that cannot observe (no ResizeObserver) is measured once', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    containerWidth = 300;
    await bar();
    expect(hiddenEntries()).toEqual(['c', 'sub', 'z']);
  });

  it('a menu that is not a bar has no "…" item, and one that stops being a bar loses it', async () => {
    containerWidth = 300;
    const view = await bar();
    expect(more()).toBeTruthy();
    await view.rerender({ mode: 'vertical' });
    await tick();
    expect(rootList().querySelector('[data-ads-more]')).toBeNull();
    expect(rootList().querySelector('[data-ads-hidden]')).toBeNull();
  });

  it('the popup of the "…" item takes the theme of the menu, and popupRender wraps it with the item `null`', async () => {
    containerWidth = 300;
    await bar({ theme: 'dark', variant: 'wrap' });
    hoverIn(moreTitle());
    await tick();
    expect(popupLists()[0]).toHaveClass('ads-menu-dark');
    expect(screen.getByTestId('popup-wrap').dataset.item).toBe('overflow');
    expect(screen.getByTestId('popup-wrap').dataset.keys).toBe('');
  });

  it('classNames.popup and styles.popup are on the popup of the "…" item', async () => {
    containerWidth = 300;
    await bar({ classNames: { popup: 'p' }, styles: { popup: { 'min-width': '8px' } } });
    hoverIn(moreTitle());
    await tick();
    const frame = popupLists()[0].closest('.ads-popup-frame')!;
    expect(frame).toHaveClass('p', 'ads-menu-popup');
    expect(frame).toHaveStyle('min-width: 8px');
  });
});

describe('Menu: the keyboard on a bar that overflows', () => {
  it('the arrows skip the hidden entries; the "…" item is the last stop', async () => {
    containerWidth = 300;
    await bar();
    byKey('a').focus();
    await keydown(byKey('a'), 'ArrowRight');
    expect(byKey('b')).toHaveFocus();
    await keydown(byKey('b'), 'ArrowRight');
    expect(moreTitle()).toHaveFocus();
    await keydown(moreTitle(), 'ArrowRight');
    expect(byKey('a')).toHaveFocus();
    await keydown(byKey('a'), 'End');
    expect(moreTitle()).toHaveFocus();
  });

  it('ArrowDown, Enter and Space on the "…" item open the popup and focus the first hidden item', async () => {
    containerWidth = 300;
    await bar();
    moreTitle().focus();
    await keydown(moreTitle(), 'ArrowDown');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
    await keydown(document.activeElement!, 'Escape');
    expect(moreTitle()).toHaveFocus();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    await keydown(moreTitle(), 'Enter');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
    await keydown(document.activeElement!, 'Escape');
    await keydown(moreTitle(), ' ');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
  });

  it('Enter on an item of the "…" popup chooses it, closes the popup and returns focus to the "…" item; Tab does the same, and goes on', async () => {
    containerWidth = 300;
    await bar();
    moreTitle().focus();
    await keydown(moreTitle(), 'ArrowDown');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
    popupLists()[0].querySelector<HTMLElement>('[data-ads-key=z]')!.focus();
    await keydown(document.activeElement!, 'Enter');
    expect(selected()).toBe('z');
    expect(moreTitle()).toHaveFocus();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    await keydown(moreTitle(), 'ArrowDown');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
    await keydown(document.activeElement!, 'Tab');
    expect(moreTitle()).toHaveFocus();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowUp on the "…" item focuses the last hidden item', async () => {
    containerWidth = 300;
    await bar();
    moreTitle().focus();
    await keydown(moreTitle(), 'ArrowUp');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=z]')).toHaveFocus());
  });

  it('in the "…" popup, ArrowLeft goes to the last item of the bar, and ArrowRight to the first (the bar wraps)', async () => {
    containerWidth = 300;
    await bar();
    moreTitle().focus();
    await keydown(moreTitle(), 'ArrowDown');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=sub]')).toHaveFocus());
    await keydown(document.activeElement!, 'ArrowLeft');
    expect(byKey('b')).toHaveFocus();
    expect(moreTitle()).toHaveAttribute('aria-expanded', 'false');
    moreTitle().focus();
    await keydown(moreTitle(), 'ArrowDown');
    await waitFor(() => expect(popupLists()[0].querySelector('[data-ads-key=z]') ?? popupLists()[0]).toBeTruthy());
    popupLists()[0].querySelector<HTMLElement>('[data-ads-key=z]')!.focus();
    await keydown(document.activeElement!, 'ArrowRight');
    expect(byKey('a')).toHaveFocus();
  });

  it('the tab stop falls back to a visible item when the selected one is hidden', async () => {
    containerWidth = 300;
    await bar({ selectedKeys: ['z'] });
    expect(Array.from(rootList().querySelectorAll('[tabindex="0"]')).map((element) => (element as HTMLElement).dataset.adsKey)).toEqual(['a']);
  });

  it('the "…" item can be the tab stop: the last item that had focus', async () => {
    containerWidth = 300;
    await bar();
    moreTitle().focus();
    await tick();
    expect(moreTitle()).toHaveAttribute('tabindex', '0');
    expect(byKey('a')).toHaveAttribute('tabindex', '-1');
  });

  it('typeahead on the bar does not find a hidden item', async () => {
    containerWidth = 300;
    await bar();
    byKey('a').focus();
    await keydown(byKey('a'), 'z');
    expect(byKey('a')).toHaveFocus();
  });
});
