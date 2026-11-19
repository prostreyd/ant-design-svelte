// Popup submenus (specs/menu.md, Behavior): opening, closing, hover timing, touch, focus, the parts of a popup. jsdom has no
// layout, so where the popup stands is in e2e/menu.spec.ts.
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Menu from '../src/lib/Menu/Menu.svelte';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuHarness from './fixtures/MenuHarness.svelte';
import MenuVetoHarness from './fixtures/MenuVetoHarness.svelte';
import { byKey, hoverIn, hoverOut, items, keydown, open, pointerDown, popupLists, rootList, selected, touchDown } from './menuHelpers';

beforeEach(() => {
  // Only the timers: the clock of `performance` is read by the compatibility check of touch.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

/** Where a panel was moved to: the transform may write `translate(4px)` when the second number is 0. */
const placed = (panel: HTMLElement | null) => {
  const match = /translate\((-?[\d.]+)px(?:, (-?[\d.]+)px)?\)/.exec(panel?.style.transform ?? '');
  return { left: Number(match?.[1] ?? 0), top: Number(match?.[2] ?? 0) };
};
const popupOf = (key: string) => document.getElementById(byKey(key).getAttribute('aria-controls') ?? '');
const advance = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  await tick();
};

describe('Menu: opening a popup submenu with the pointer', () => {
  it('the pointer on a title opens the popup at once: aria-expanded, a list named by the title, openKeys, onopenchange', async () => {
    const onopenchange = vi.fn();
    render(MenuHarness, { props: { items, onopenchange } });
    expect(popupLists()).toHaveLength(0);
    hoverIn(byKey('sub'));
    await tick();
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'true');
    expect(open()).toBe('sub');
    expect(onopenchange).toHaveBeenCalledWith(['sub']);
    const list = popupOf('sub')!;
    expect(list).toHaveAttribute('role', 'menu');
    expect(list).toHaveAttribute('aria-labelledby', byKey('sub').id);
    expect(list.closest('.ads-popup')!.parentElement).toBe(document.body);
    expect(Array.from(list.querySelectorAll('[role^=menuitem]')).map((entry) => entry.textContent?.trim())).toEqual(['Sub one', 'Sub two', 'Deep']);
  });

  it('subMenuOpenDelay: the popup opens after the delay, and a pass that is shorter opens nothing', async () => {
    render(MenuHarness, { props: { items, subMenuOpenDelay: 0.5 } });
    hoverIn(byKey('sub'));
    await advance(400);
    expect(open()).toBe('');
    await advance(100);
    expect(open()).toBe('sub');
    hoverOut(byKey('sub'));
    await advance(200);
    expect(open()).toBe('');
    hoverIn(byKey('sub'));
    await advance(300);
    hoverOut(byKey('sub'));
    await advance(1000);
    expect(open()).toBe('');
  });

  it('subMenuCloseDelay: the popup closes 0.1 s after the pointer left, by default', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    hoverOut(byKey('sub'));
    await advance(50);
    expect(open()).toBe('sub');
    await advance(60);
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'false');
  });

  it('a longer subMenuCloseDelay keeps it open longer', async () => {
    render(MenuHarness, { props: { items, subMenuCloseDelay: 1 } });
    hoverIn(byKey('sub'));
    await tick();
    hoverOut(byKey('sub'));
    await advance(900);
    expect(open()).toBe('sub');
    await advance(200);
    expect(open()).toBe('');
  });

  it('the pointer may cross from the title into the popup and rest in it (the popup is kept open)', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    const list = popupOf('sub')!;
    hoverOut(byKey('sub'));
    await advance(50);
    hoverIn(list);
    await advance(2000);
    expect(open()).toBe('sub');
    hoverOut(list);
    await advance(150);
    expect(open()).toBe('');
  });

  it('from a popup into the popup of a submenu in it: both stay open; leaving all closes all', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    hoverOut(byKey('sub'));
    hoverIn(popupOf('sub')!);
    hoverIn(byKey('deep'));
    await tick();
    expect(open()).toBe('sub>deep');
    hoverOut(byKey('deep'));
    hoverOut(popupOf('sub')!);
    hoverIn(popupOf('deep')!);
    await advance(500);
    expect(open()).toBe('sub>deep');
    hoverOut(popupOf('deep')!);
    await advance(150);
    expect(open()).toBe('');
  });

  it('back from the child popup to the parent popup closes only the child', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    hoverOut(byKey('deep'));
    hoverIn(popupOf('sub')!);
    await advance(150);
    expect(open()).toBe('sub');
  });

  it('only one popup is open at a level: another title takes over', async () => {
    const two: MenuItems = [
      { key: 'x', label: 'X', children: [{ key: 'x1', label: 'X1' }] },
      { key: 'y', label: 'Y', children: [{ key: 'y1', label: 'Y1' }] }
    ];
    render(MenuHarness, { props: { items: two } });
    hoverIn(byKey('x'));
    await tick();
    hoverOut(byKey('x'));
    hoverIn(byKey('y'));
    await tick();
    expect(open()).toBe('y');
    expect(byKey('x')).toHaveAttribute('aria-expanded', 'false');
  });

  it('the pointer on an item of the root list closes the open popup after the delay', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    hoverOut(byKey('sub'));
    hoverIn(byKey('z'));
    await advance(150);
    expect(open()).toBe('');
  });

  it('the pointer on an item of a popup closes what is open beside it in the popup', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    expect(open()).toBe('sub>deep');
    hoverOut(byKey('deep'));
    hoverIn(byKey('s1'));
    await advance(150);
    expect(open()).toBe('sub');
  });

  it('a pointer that leaves while the open delay runs cancels it, and one on another item cancels it too', async () => {
    render(MenuHarness, { props: { items, subMenuOpenDelay: 0.3 } });
    hoverIn(byKey('sub'));
    hoverOut(byKey('sub'));
    hoverIn(byKey('z'));
    await advance(1000);
    expect(open()).toBe('');
    hoverIn(byKey('sub'));
    hoverIn(byKey('z'));
    await advance(1000);
    expect(open()).toBe('');
  });

  it('a disabled submenu does not open', async () => {
    render(MenuHarness, { props: { items: [{ key: 'x', label: 'X', disabled: true, children: [{ key: 'x1', label: 'X1' }] }] } });
    hoverIn(byKey('x'));
    await fireEvent.click(byKey('x'));
    await advance(200);
    expect(open()).toBe('');
  });

  it('a title that is open stays open when the pointer enters it again', async () => {
    const onopenchange = vi.fn();
    render(MenuHarness, { props: { items, onopenchange } });
    hoverIn(byKey('sub'));
    await tick();
    hoverOut(byKey('sub'));
    hoverIn(byKey('sub'));
    await advance(300);
    expect(onopenchange).toHaveBeenCalledTimes(1);
    expect(open()).toBe('sub');
  });

  it('the popup of the "…" name is not used for a submenu: `aria-controls` names the list only once it exists', async () => {
    render(MenuHarness, { props: { items } });
    expect(byKey('sub')).not.toHaveAttribute('aria-controls');
    hoverIn(byKey('sub'));
    await tick();
    expect(byKey('sub')).toHaveAttribute('aria-controls');
    expect(popupOf('sub')).not.toBeNull();
  });
});

describe('Menu: clicking a title (triggerSubMenuAction)', () => {
  it('hover: a click on a title that is closed opens it, and a click on one that is open leaves it open', async () => {
    render(MenuHarness, { props: { items, subMenuCloseDelay: 5 } });
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('sub');
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('sub');
  });

  it('click: the pointer opens nothing and closes nothing; a click toggles', async () => {
    render(MenuHarness, { props: { items, triggerSubMenuAction: 'click' } });
    hoverIn(byKey('sub'));
    await advance(300);
    expect(open()).toBe('');
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('sub');
    hoverOut(byKey('sub'));
    hoverIn(byKey('z'));
    await advance(1000);
    expect(open()).toBe('sub');
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('');
  });

  it('click: closing a submenu closes the submenus in it', async () => {
    render(MenuHarness, { props: { items, triggerSubMenuAction: 'click' } });
    await fireEvent.click(byKey('sub'));
    await fireEvent.click(byKey('deep'));
    expect(open()).toBe('sub>deep');
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('');
  });

  it('ontitleclick runs for a title that opens a popup', async () => {
    const ontitleclick = vi.fn();
    render(MenuHarness, { props: { items: [{ key: 'x', label: 'X', ontitleclick, children: [{ key: 'x1', label: 'X1' }] }] } });
    await fireEvent.click(byKey('x'));
    expect(ontitleclick).toHaveBeenCalledTimes(1);
  });

  it('touch: a tap opens the popup (the compatibility events of the tap do not undo it) and a second tap closes it', async () => {
    render(MenuHarness, { props: { items } });
    touchDown(byKey('sub'));
    hoverIn(byKey('sub'));
    hoverOut(byKey('sub'));
    await fireEvent.click(byKey('sub'));
    await advance(300);
    expect(open()).toBe('sub');
    touchDown(byKey('sub'));
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('');
  });

  it('a pen or a mouse pointer press is not a touch', async () => {
    render(MenuHarness, { props: { items, subMenuCloseDelay: 5 } });
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    byKey('sub').dispatchEvent(event);
    await fireEvent.click(byKey('sub'));
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('sub');
  });
});

describe('Menu: closing a popup submenu', () => {
  it('choosing an item closes every popup, calls onclick and selects', async () => {
    const onclick = vi.fn();
    render(MenuHarness, { props: { items, onclick } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    await fireEvent.click(byKey('d1'));
    expect(open()).toBe('');
    expect(selected()).toBe('d1');
    expect(onclick.mock.calls[0][0].keyPath).toEqual(['d1', 'deep', 'sub']);
  });

  it('a press outside closes the popups; a press on the title or inside the popup does not', async () => {
    const onopenchange = vi.fn();
    render(MenuHarness, { props: { items, onopenchange, subMenuCloseDelay: 100 } });
    hoverIn(byKey('sub'));
    await tick();
    pointerDown(byKey('sub'));
    pointerDown(popupOf('sub')!);
    await tick();
    expect(open()).toBe('sub');
    pointerDown(screen.getByTestId('after'));
    await tick();
    expect(open()).toBe('');
    expect(onopenchange).toHaveBeenLastCalledWith([]);
  });

  it('a press outside closes a nested popup and its parent', async () => {
    render(MenuHarness, { props: { items, subMenuCloseDelay: 100 } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    pointerDown(screen.getByTestId('after'));
    await tick();
    expect(open()).toBe('');
  });

  it('Escape closes the popup of an open title that has focus on it (the registry of popups)', async () => {
    render(MenuHarness, { props: { items, subMenuCloseDelay: 100 } });
    hoverIn(byKey('sub'));
    await tick();
    byKey('sub').focus();
    keydown(document.body, 'Escape');
    await tick();
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('the popups are removed from the page when the menu goes', async () => {
    const view = render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    expect(popupLists()).toHaveLength(1);
    view.unmount();
    expect(document.querySelector('.ads-popup')).toBeNull();
  });

  it('timers that are still running when the menu goes do nothing', async () => {
    const onopenchange = vi.fn();
    const view = render(Menu, { props: { items, subMenuOpenDelay: 1, onopenchange } });
    hoverIn(byKey('sub'));
    view.unmount();
    await advance(2000);
    expect(onopenchange).not.toHaveBeenCalled();
  });
});

describe('Menu: where focus goes when an item of a popup is chosen with the pointer', () => {
  it('with focus in the popup, it goes back to the title the popup came from', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    byKey('s1').focus();
    await fireEvent.click(byKey('s1'));
    expect(open()).toBe('');
    expect(byKey('sub')).toHaveFocus();
  });

  it('with focus elsewhere, it stays where it is', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    screen.getByTestId('after').focus();
    await fireEvent.click(byKey('s1'));
    expect(screen.getByTestId('after')).toHaveFocus();
  });

  it('with focus on an item of the root list (not in the popup), it stays on that item', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    byKey('a').focus();
    await fireEvent.click(byKey('s1'));
    expect(byKey('a')).toHaveFocus();
  });
});

describe('Menu: the state of the popups as the parent holds it', () => {
  it('openKeys opens a popup from outside, and closing it from outside closes the popup', async () => {
    const view = render(Menu, { props: { items, openKeys: ['sub'] } });
    await tick();
    expect(popupLists()).toHaveLength(1);
    await view.rerender({ openKeys: [] });
    await tick();
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'false');
  });

  it('forceSubMenuRender builds the popups before they are shown, hidden', async () => {
    render(Menu, { props: { items, forceSubMenuRender: true } });
    await tick();
    expect(document.querySelectorAll('.ads-popup[hidden]').length).toBeGreaterThan(0);
    expect(byKey('s1')).toBeInTheDocument();
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'false');
  });

  it('by default the popups are built when they are first shown', async () => {
    render(Menu, { props: { items } });
    await tick();
    expect(document.querySelector('.ads-popup')).toBeNull();
  });
});

describe('Menu: the parts of a popup', () => {
  const nested: MenuItems = [
    {
      key: 'sub',
      label: 'Sub',
      popupClassName: 'my-popup',
      theme: 'dark',
      children: [{ key: 's1', label: 'S1' }, { key: 'deep', label: 'Deep', children: [{ key: 'd1', label: 'D1' }] }]
    }
  ];

  it('popupClassName, classNames.popup and styles.popup are on the popup; the popup takes the menu theme or its own', async () => {
    render(Menu, { props: { items: nested, classNames: { popup: 'menu-popup' }, styles: { popup: { 'min-width': '9px' } } } });
    hoverIn(byKey('sub'));
    await tick();
    const frame = popupOf('sub')!.closest('.ads-popup-frame')!;
    expect(frame).toHaveClass('ads-menu-popup', 'ads-menu-popup-dark', 'my-popup', 'menu-popup');
    expect(frame).toHaveStyle('min-width: 9px');
    expect(popupOf('sub')).toHaveClass('ads-menu-dark');
  });

  it('a nested popup takes the theme of the popup it is in', async () => {
    render(Menu, { props: { items: nested } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    expect(popupOf('deep')).toHaveClass('ads-menu-dark');
  });

  it('popupOffset moves the popup by [x, y]', async () => {
    render(Menu, { props: { items: [{ key: 'a', label: 'A', children: [{ key: 'a1', label: 'A1' }] }] } });
    hoverIn(byKey('a'));
    await tick();
    const before = placed(popupOf('a')!.closest<HTMLElement>('.ads-popup'));
    document.body.innerHTML = '';
    render(Menu, { props: { items: [{ key: 'a', label: 'A', popupOffset: [7, 5], children: [{ key: 'a1', label: 'A1' }] }] } });
    hoverIn(byKey('a'));
    await tick();
    const after = placed(popupOf('a')!.closest<HTMLElement>('.ads-popup'));
    expect(after.left - before.left).toBe(7);
    expect(after.top - before.top).toBe(5);
  });

  it('the menu-level popupRender wraps the content of every popup, with the item and the keys', async () => {
    render(MenuHarness, { props: { items, variant: 'wrap' } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    const wraps = screen.getAllByTestId('popup-wrap');
    expect(wraps.map((wrap) => [wrap.dataset.item, wrap.dataset.keys])).toEqual([
      ['sub', 'sub'],
      ['deep', 'sub>deep']
    ]);
    expect(popupOf('sub')!.closest('[data-testid=popup-wrap]')).toBe(wraps[0]);
  });

  it('the popupRender of a submenu replaces the menu-level one', async () => {
    const rendered: MenuItems = [{ key: 'x', label: 'X', children: [{ key: 'x1', label: 'X1' }] }];
    render(MenuHarness, { props: { items: rendered, variant: 'wrap' } });
    hoverIn(byKey('x'));
    await tick();
    expect(screen.getAllByTestId('popup-wrap')).toHaveLength(1);
  });

  it('items in a popup are not in the Tab order, and a popup list is named by its title', async () => {
    render(Menu, { props: { items, openKeys: ['sub'] } });
    await tick();
    for (const entry of popupOf('sub')!.querySelectorAll('[role^=menuitem]')) expect(entry).toHaveAttribute('tabindex', '-1');
    expect(popupLists()[0]).toHaveAttribute('aria-labelledby', byKey('sub').id);
  });

  it('the group titles and dividers of a popup are drawn there', async () => {
    render(Menu, {
      props: {
        openKeys: ['g'],
        items: [{ key: 'g', label: 'G', children: [{ type: 'group', label: 'Title', children: [{ key: 'g1', label: 'G1' }] }, { type: 'divider' }] }]
      }
    });
    await tick();
    expect(screen.getByRole('group', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('in a right-to-left menu the popup lists are right-to-left too', async () => {
    render(Menu, { props: { items, style: 'direction: rtl', openKeys: ['sub'] } });
    await tick();
    expect(popupLists()[0]).toHaveAttribute('dir', 'rtl');
    expect(popupLists()[0]).toHaveClass('ads-menu-rtl');
    expect(rootList()).toHaveClass('ads-menu-rtl');
  });

  it('the tab stop stays on the root list when focus is in a popup', async () => {
    render(Menu, { props: { items, openKeys: ['sub'] } });
    await tick();
    byKey('s1').focus();
    await tick();
    expect(rootList().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(byKey('s1')).toHaveAttribute('tabindex', '-1');
  });

  it('what is open inside the "…" key is never exposed in openKeys', async () => {
    render(MenuHarness, { props: { items } });
    hoverIn(byKey('sub'));
    await tick();
    expect(open()).not.toContain('ads-menu-overflow');
  });
});

describe('Menu: a menu that is controlled and says no', () => {
  it('a parent that refuses to open a popup is obeyed: nothing opens, and the keyboard does not fail on it', async () => {
    vi.useRealTimers();
    render(MenuVetoHarness, { props: { items } });
    byKey('sub').focus();
    keydown(byKey('sub'), 'ArrowRight');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'false');
    expect(popupLists()).toHaveLength(0);
    expect(byKey('sub')).toHaveFocus();
  });

  it('gives up when the item cannot take focus, after a few frames', async () => {
    vi.useRealTimers();
    render(MenuHarness, { props: { items } });
    byKey('sub').focus();
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});
    const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});
    keydown(byKey('sub'), 'ArrowRight');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(open()).toBe('sub');
    // Six tries, one on each frame, and no more.
    expect(focus).toHaveBeenCalledTimes(6);
  });

  it('puts focus on the first item once, and does not try again when it has it', async () => {
    vi.useRealTimers();
    render(MenuHarness, { props: { items } });
    byKey('sub').focus();
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    keydown(byKey('sub'), 'ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(focus).toHaveBeenCalledTimes(1);
  });
});

describe('Menu: focus waits for a popup that is not ready', () => {
  it('moves focus into the popup once it exists', async () => {
    vi.useRealTimers();
    render(MenuHarness, { props: { items } });
    byKey('sub').focus();
    keydown(byKey('sub'), 'ArrowRight');
    await waitFor(() => expect(byKey('s1')).toHaveFocus());
  });
});
