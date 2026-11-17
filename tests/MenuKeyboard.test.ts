// The keyboard of the Menu (specs/menu.md, A11y): the tab stop, the arrows in the three modes, Enter, Space, Escape, Tab,
// typeahead, right-to-left.
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuHarness from './fixtures/MenuHarness.svelte';
import { byKey, items, keydown, open, popupLists, rootList, selected } from './menuHelpers';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

/** Focuses an item and presses a key on it, as the browser does. */
async function press(key: string, init: KeyboardEventInit = {}, on?: HTMLElement) {
  const target = on ?? (document.activeElement as HTMLElement);
  await keydown(target, key, init);
}
const mount = async (props: Record<string, unknown> = {}) => {
  const view = render(MenuHarness, { props: { items, ...props } });
  await tick();
  return view;
};
const focusOn = (key: string) => {
  const target = byKey(key);
  target.focus();
  return target;
};
const stops = () => Array.from(rootList().querySelectorAll('[tabindex="0"]')).map((element) => (element as HTMLElement).dataset.adsKey);

describe('Menu keyboard: the tab stop (one for the whole menu, on an item)', () => {
  it('is the first item that is not disabled, and there is only one', async () => {
    await mount({ items: [{ key: 'x', label: 'X', disabled: true }, ...items] });
    expect(stops()).toEqual(['a']);
  });

  it('is the selected item when there is one', async () => {
    await mount({ selectedKeys: ['b'] });
    expect(stops()).toEqual(['b']);
  });

  it('is the submenu that holds the selected item when that item cannot be reached', async () => {
    await mount({ selectedKeys: ['s1'], mode: 'inline' });
    expect(stops()).toEqual(['sub']);
  });

  it('moves to the item that has focus', async () => {
    await mount();
    focusOn('z');
    await tick();
    expect(stops()).toEqual(['z']);
  });

  it('falls back when the item that had it is removed', async () => {
    const view = await mount();
    focusOn('z');
    await tick();
    await view.rerender({ items: items.slice(0, 2) });
    expect(stops()).toEqual(['a']);
  });

  it('a menu with nothing to focus has no tab stop', async () => {
    await mount({ items: [{ key: 'x', label: 'X', disabled: true }] });
    expect(stops()).toEqual([]);
  });

  it('Tab leaves the menu: a following element is the next tab stop', async () => {
    await mount();
    const tabbable = Array.from(document.querySelectorAll<HTMLElement>('button, [tabindex="0"]'));
    expect(tabbable.map((element) => element.dataset.testid ?? element.dataset.adsKey)).toEqual(['before', 'a', 'after']);
  });
});

describe('Menu keyboard: vertical', () => {
  it('ArrowDown and ArrowUp move between items, skip a disabled one and wrap', async () => {
    await mount();
    focusOn('a');
    await press('ArrowDown');
    expect(byKey('b')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('z')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('a')).toHaveFocus();
    await press('ArrowUp');
    expect(byKey('z')).toHaveFocus();
    await press('ArrowUp');
    expect(byKey('sub')).toHaveFocus();
  });

  it('Home and End go to the first and the last item', async () => {
    await mount();
    focusOn('b');
    await press('End');
    expect(byKey('z')).toHaveFocus();
    await press('Home');
    expect(byKey('a')).toHaveFocus();
  });

  it('the arrows are used by the menu: the page does not scroll', async () => {
    await mount();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('Enter and Space choose an item: onclick gets the keyboard event, and the item is selected', async () => {
    const onclick = vi.fn();
    await mount({ onclick });
    focusOn('b');
    await press('Enter');
    expect(selected()).toBe('b');
    expect(onclick.mock.calls[0][0].domEvent).toBeInstanceOf(KeyboardEvent);
    focusOn('z');
    await press(' ');
    expect(selected()).toBe('z');
  });

  it('ArrowRight on a submenu opens the popup and moves focus to its first item; ArrowLeft closes it and returns to the title', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    expect(open()).toBe('sub');
    await press('ArrowLeft');
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('Enter and Space on a submenu open it and focus its first item; Enter calls ontitleclick', async () => {
    const ontitleclick = vi.fn();
    await mount({ items: [{ key: 'x', label: 'X', ontitleclick, children: [{ key: 'x1', label: 'X1' }] }] });
    focusOn('x');
    await press('Enter');
    await waitFor(() => expect(byKey('x1')).toHaveFocus());
    expect(ontitleclick.mock.calls[0][0].domEvent).toBeInstanceOf(KeyboardEvent);
    await press('Escape');
    expect(byKey('x')).toHaveFocus();
    await press(' ');
    await waitFor(() => expect(byKey('x1')).toHaveFocus());
  });

  it('a disabled submenu does not open from the keyboard (it cannot even take focus)', async () => {
    await mount({ items: [{ key: 'x', label: 'X', disabled: true, children: [{ key: 'x1', label: 'X1' }] }, { key: 'y', label: 'Y' }] });
    byKey('x').focus();
    await press('Enter', {}, byKey('x'));
    expect(open()).toBe('');
  });

  it('the keyboard opens a popup whatever triggerSubMenuAction says', async () => {
    await mount({ triggerSubMenuAction: 'click' });
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    expect(open()).toBe('sub');
  });

  it('inside a popup the arrows move between its items and wrap; Home and End jump', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('ArrowDown');
    expect(byKey('s2')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('deep')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('s1')).toHaveFocus();
    await press('ArrowUp');
    expect(byKey('deep')).toHaveFocus();
    await press('Home');
    expect(byKey('s1')).toHaveFocus();
    await press('End');
    expect(byKey('deep')).toHaveFocus();
  });

  it('ArrowRight on a submenu in a popup opens it; Left closes it and returns to its title; Escape closes the topmost only', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    byKey('deep').focus();
    await press('ArrowRight');
    await waitFor(() => expect(byKey('d1')).toHaveFocus());
    expect(open()).toBe('sub>deep');
    await press('Escape');
    expect(open()).toBe('sub');
    expect(byKey('deep')).toHaveFocus();
    await press('ArrowRight');
    await waitFor(() => expect(byKey('d1')).toHaveFocus());
    await press('ArrowLeft');
    expect(byKey('deep')).toHaveFocus();
    expect(open()).toBe('sub');
    await press('Escape');
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('ArrowRight on a plain item of the root list does nothing, and the key is left alone', async () => {
    await mount();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(byKey('a')).toHaveFocus();
  });

  it('Enter on an item in a popup closes the popups, selects it and returns focus to the title it came from', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('Enter');
    expect(selected()).toBe('s1');
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('Tab in a popup closes the popups and leaves from the title (focus is there, and it is the tab stop)', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('Tab');
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
    expect(byKey('sub')).toHaveAttribute('tabindex', '0');
  });

  it('Tab on an item of the root list is left to the browser', async () => {
    await mount();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('keys with Ctrl, Meta or Alt, keys already used, and keys during a composition are not the menu\'s', async () => {
    await mount();
    focusOn('a');
    await press('ArrowDown', { ctrlKey: true });
    await press('ArrowDown', { metaKey: true });
    await press('ArrowDown', { altKey: true });
    expect(byKey('a')).toHaveFocus();
    const used = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    byKey('a').addEventListener('keydown', (event) => event.preventDefault(), { once: true });
    byKey('a').dispatchEvent(used);
    expect(byKey('a')).toHaveFocus();
    await press('ArrowDown', { isComposing: true });
    expect(byKey('a')).toHaveFocus();
  });

  it('Escape on the root list is left to others', async () => {
    await mount();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('Menu keyboard: typeahead', () => {
  it('a typed character moves to the next item that starts with it; after a pause the same one goes on to the next', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const list: MenuItems = [{ key: 'a1', label: 'Apple' }, { key: 'a2', label: 'Avocado' }, { key: 'b1', label: 'Banana' }];
    await mount({ items: list });
    focusOn('a1');
    await press('b');
    expect(byKey('b1')).toHaveFocus();
    vi.advanceTimersByTime(600);
    await press('a');
    expect(byKey('a1')).toHaveFocus();
    vi.advanceTimersByTime(600);
    await press('a');
    expect(byKey('a2')).toHaveFocus();
  });

  it('the same character typed again and again cycles through the items that start with it', async () => {
    const list: MenuItems = [{ key: 'a1', label: 'Apple' }, { key: 'a2', label: 'Avocado' }, { key: 'b1', label: 'Banana' }];
    await mount({ items: list });
    focusOn('b1');
    await press('a');
    expect(byKey('a1')).toHaveFocus();
    await press('a');
    expect(byKey('a2')).toHaveFocus();
    await press('a');
    expect(byKey('a1')).toHaveFocus();
  });

  it('several characters typed quickly are a prefix; the buffer is forgotten after half a second', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const list: MenuItems = [{ key: 'a1', label: 'Apple' }, { key: 'a2', label: 'Avocado' }, { key: 'a3', label: 'Avalanche' }];
    await mount({ items: list });
    focusOn('a1');
    await press('a');
    expect(byKey('a2')).toHaveFocus();
    await press('v');
    expect(byKey('a2')).toHaveFocus();
    await press('a');
    expect(byKey('a3')).toHaveFocus();
    await press('l');
    expect(byKey('a3')).toHaveFocus();
    vi.advanceTimersByTime(600);
    await press('a');
    expect(byKey('a1')).toHaveFocus();
  });

  it('a space inside a word goes on typing; a space alone chooses the item', async () => {
    const list: MenuItems = [{ key: 'x', label: 'Zero' }, { key: 'n', label: 'New file' }, { key: 'm', label: 'New window' }];
    await mount({ items: list });
    focusOn('x');
    await press('n');
    await press('e');
    await press('w');
    await press(' ');
    await press('w');
    expect(byKey('m')).toHaveFocus();
    expect(selected()).toBe('');
  });

  it('a character that starts no item changes nothing and is not used', async () => {
    await mount();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(byKey('a')).toHaveFocus();
    expect(event.defaultPrevented).toBe(false);
  });

  it('a key like Shift or F5 is not a character', async () => {
    await mount();
    focusOn('a');
    await press('Shift');
    await press('F5');
    expect(byKey('a')).toHaveFocus();
  });

  it('typeahead looks at the items of the list that has focus (a popup)', async () => {
    await mount();
    focusOn('sub');
    await press('ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('d');
    expect(byKey('deep')).toHaveFocus();
  });
});

describe('Menu keyboard: horizontal bar (menubar)', () => {
  const bar = (extra: Record<string, unknown> = {}) => mount({ mode: 'horizontal', ...extra });

  it('ArrowRight and ArrowLeft move along the bar, skip a disabled item and wrap; Home and End jump', async () => {
    await bar();
    focusOn('a');
    await press('ArrowRight');
    expect(byKey('b')).toHaveFocus();
    await press('ArrowRight');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowRight');
    await press('ArrowRight');
    expect(byKey('a')).toHaveFocus();
    await press('ArrowLeft');
    expect(byKey('z')).toHaveFocus();
    await press('Home');
    expect(byKey('a')).toHaveFocus();
    await press('End');
    expect(byKey('z')).toHaveFocus();
  });

  it('ArrowDown opens the popup of a submenu and focuses its first item; ArrowUp focuses the last', async () => {
    await bar();
    focusOn('sub');
    await press('ArrowDown');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    expect(open()).toBe('sub');
    await press('Escape');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowUp');
    await waitFor(() => expect(byKey('deep')).toHaveFocus());
  });

  it('ArrowDown and ArrowUp on a plain item do nothing, and are left alone', async () => {
    await bar();
    focusOn('a');
    for (const key of ['ArrowDown', 'ArrowUp']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      byKey('a').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(byKey('a')).toHaveFocus();
  });

  it('Enter on a submenu opens it', async () => {
    await bar();
    focusOn('sub');
    await press('Enter');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
  });

  it('in a top-level popup, ArrowRight on an item goes to the next item of the bar; on a submenu with a popup it opens that', async () => {
    const two: MenuItems = [
      { key: 'x', label: 'X', children: [{ key: 'x1', label: 'X1' }] },
      { key: 'y', label: 'Y', children: [{ key: 'y1', label: 'Y1' }] },
      { key: 'w', label: 'W' }
    ];
    await bar({ items: two });
    focusOn('x');
    await press('ArrowDown');
    await waitFor(() => expect(byKey('x1')).toHaveFocus());
    await press('ArrowRight');
    await waitFor(() => expect(byKey('y1')).toHaveFocus());
    expect(open()).toBe('y');
    await press('ArrowRight');
    expect(byKey('w')).toHaveFocus();
    expect(open()).toBe('');
  });

  it('in a top-level popup, ArrowLeft goes to the previous item of the bar, opening its popup when it has one', async () => {
    const two: MenuItems = [
      { key: 'x', label: 'X', children: [{ key: 'x1', label: 'X1' }] },
      { key: 'y', label: 'Y', children: [{ key: 'y1', label: 'Y1' }] }
    ];
    await bar({ items: two });
    focusOn('y');
    await press('ArrowDown');
    await waitFor(() => expect(byKey('y1')).toHaveFocus());
    await press('ArrowLeft');
    await waitFor(() => expect(byKey('x1')).toHaveFocus());
    expect(open()).toBe('x');
  });

  it('ArrowRight in a popup on a plain item with no neighbor popup moves focus to the next bar item and closes the popup', async () => {
    await bar();
    focusOn('sub');
    await press('ArrowDown');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('ArrowRight');
    expect(byKey('z')).toHaveFocus();
    expect(open()).toBe('');
  });

  it('in a nested popup, ArrowLeft closes it and returns to its title', async () => {
    await bar();
    focusOn('sub');
    await press('ArrowDown');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    byKey('deep').focus();
    await press('ArrowRight');
    await waitFor(() => expect(byKey('d1')).toHaveFocus());
    await press('ArrowLeft');
    expect(byKey('deep')).toHaveFocus();
    expect(open()).toBe('sub');
  });

  it('typeahead works on the bar', async () => {
    await bar();
    focusOn('a');
    await press('z');
    expect(byKey('z')).toHaveFocus();
  });
});

describe('Menu keyboard: inline', () => {
  const inline = (extra: Record<string, unknown> = {}) => mount({ mode: 'inline', ...extra });

  it('the arrows go through the visible items, children of an expanded submenu included; a closed submenu is skipped over', async () => {
    await inline();
    focusOn('b');
    await press('ArrowDown');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('z')).toHaveFocus();
    await fireEvent.click(byKey('sub'));
    byKey('sub').focus();
    await press('ArrowDown');
    expect(byKey('s1')).toHaveFocus();
    await press('ArrowDown');
    await press('ArrowDown');
    expect(byKey('deep')).toHaveFocus();
    await press('ArrowDown');
    expect(byKey('z')).toHaveFocus();
  });

  it('ArrowRight expands a closed submenu and keeps focus on it; on an open one it goes to the first child', async () => {
    await inline();
    focusOn('sub');
    await press('ArrowRight');
    expect(open()).toBe('sub');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowRight');
    expect(byKey('s1')).toHaveFocus();
  });

  it('ArrowLeft collapses an open submenu; on a child, or a closed submenu, it goes to the parent title', async () => {
    await inline({ openKeys: ['sub', 'deep'] });
    focusOn('deep');
    await press('ArrowLeft');
    expect(open()).toBe('sub');
    await press('ArrowLeft');
    expect(byKey('sub')).toHaveFocus();
    focusOn('s1');
    await press('ArrowLeft');
    expect(byKey('sub')).toHaveFocus();
    await press('ArrowLeft');
    expect(open()).toBe('');
  });

  it('ArrowLeft on an item at the top level does nothing, and the key is left alone', async () => {
    await inline();
    focusOn('a');
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    byKey('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('Enter and Space toggle a submenu and call ontitleclick', async () => {
    const ontitleclick = vi.fn();
    await inline({ items: [{ key: 'x', label: 'X', ontitleclick, children: [{ key: 'x1', label: 'X1' }] }] });
    focusOn('x');
    await press('Enter');
    expect(open()).toBe('x');
    await press(' ');
    expect(open()).toBe('');
    expect(ontitleclick).toHaveBeenCalledTimes(2);
  });

  it('Enter on a disabled submenu does nothing', async () => {
    await inline({ items: [{ key: 'x', label: 'X', disabled: true, children: [{ key: 'x1', label: 'X1' }] }] });
    byKey('x').focus();
    await press('Enter', {}, byKey('x'));
    expect(open()).toBe('');
  });
});

describe('Menu keyboard: right-to-left', () => {
  it('the arrows that open and close a popup, and move along a bar, are swapped', async () => {
    await mount({ style: 'direction: rtl' });
    focusOn('sub');
    await press('ArrowRight');
    expect(open()).toBe('');
    await press('ArrowLeft');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await press('ArrowRight');
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('on a bar, ArrowLeft moves to the next item', async () => {
    await mount({ mode: 'horizontal', style: 'direction: rtl' });
    focusOn('a');
    await press('ArrowLeft');
    expect(byKey('b')).toHaveFocus();
  });
});

describe('Menu keyboard: nothing to do', () => {
  it('a menu whose list has gone ignores a key', async () => {
    const view = await mount();
    const target = focusOn('a');
    view.unmount();
    await keydown(target, 'ArrowDown');
    expect(popupLists()).toHaveLength(0);
  });
});

describe('Menu keyboard: the keys the menu uses are claimed, so the page does not scroll or act on them', () => {
  /** Dispatches the key on the focused element as a cancelable event, and says whether the menu claimed it. */
  const claimed = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    (document.activeElement as HTMLElement).dispatchEvent(event);
    return event.defaultPrevented;
  };

  type Case = { name: string; props: Record<string, unknown>; focus: string; enter?: string; keys: string[] };
  const cases: Case[] = [
    { name: 'vertical, on an item', props: {}, focus: 'a', keys: ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '] },
    { name: 'vertical, on a submenu title', props: {}, focus: 'sub', keys: ['ArrowRight', 'Enter', ' '] },
    { name: 'vertical, in a popup', props: {}, focus: 'sub', enter: 'ArrowRight', keys: ['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowLeft', 'Escape', 'Enter'] },
    { name: 'a bar, on an item', props: { mode: 'horizontal' }, focus: 'a', keys: ['ArrowRight', 'ArrowLeft', 'Home', 'End'] },
    { name: 'a bar, on a submenu title', props: { mode: 'horizontal' }, focus: 'sub', keys: ['ArrowDown', 'ArrowUp', 'Enter', ' '] },
    { name: 'a bar, in the popup of a title', props: { mode: 'horizontal' }, focus: 'sub', enter: 'ArrowDown', keys: ['ArrowRight', 'ArrowLeft', 'Escape'] },
    { name: 'inline, on a closed submenu title', props: { mode: 'inline' }, focus: 'sub', keys: ['ArrowRight', 'Enter', ' '] },
    { name: 'inline, on an open submenu title', props: { mode: 'inline', openKeys: ['sub'] }, focus: 'sub', keys: ['ArrowLeft'] },
    { name: 'inline, on a child', props: { mode: 'inline', openKeys: ['sub'] }, focus: 's2', keys: ['ArrowLeft', 'ArrowDown', 'ArrowUp'] }
  ];

  for (const { name, props, focus, enter, keys } of cases) {
    for (const key of keys) {
      it(`${name}: ${key === ' ' ? 'Space' : key} is claimed`, async () => {
        await mount(props);
        focusOn(focus);
        if (enter) {
          await press(enter);
          await waitFor(() => expect(document.activeElement).not.toBe(byKey(focus)));
        }
        expect(claimed(key)).toBe(true);
      });
    }
  }

  it('a typed character that finds an item is claimed', async () => {
    await mount();
    focusOn('a');
    expect(claimed('z')).toBe(true);
  });

  it('inline: the tab stop moves to a child of an open submenu that has focus', async () => {
    await mount({ mode: 'inline', openKeys: ['sub'] });
    focusOn('s1');
    await tick();
    expect(stops()).toEqual(['s1']);
  });

  it('a bar that fits and has nothing to focus has no tab stop (the hidden "…" item is not one)', async () => {
    await mount({ mode: 'horizontal', items: [{ key: 'x', label: 'X', disabled: true }] });
    expect(stops()).toEqual([]);
  });
});
