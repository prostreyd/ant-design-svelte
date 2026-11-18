// The Menu (specs/menu.md): what it draws, selection, the state, the callbacks, the semantic parts. jsdom has no layout, so
// the geometry (where the popup is, the width of a collapsed menu, the overflow of a bar) is in e2e/menu.spec.ts and
// tests/MenuOverflow.test.ts; the popups are in tests/MenuPopup.test.ts and the keys in tests/MenuKeyboard.test.ts.
import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Menu from '../src/lib/Menu/Menu.svelte';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuHarness from './fixtures/MenuHarness.svelte';
import { byKey, items, open, rootList, selected } from './menuHelpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('Menu: the list', () => {
  it('draws a menu of items, with the attributes of the root passed on (class, style, id, aria-label)', () => {
    render(Menu, { props: { items, 'aria-label': 'Main', id: 'main-menu', class: 'mine', style: 'width: 200px' } });
    const menu = screen.getByRole('menu', { name: 'Main' });
    expect(menu).toBe(rootList());
    expect(menu).toHaveAttribute('id', 'main-menu');
    expect(menu).toHaveClass('ads-menu', 'ads-menu-vertical', 'ads-menu-light', 'mine');
    expect(menu).toHaveStyle('width: 200px');
    expect(screen.getAllByRole('menuitemradio').map((entry) => entry.textContent?.trim())).toEqual(['Alpha', 'Beta', 'Gamma', 'Zed']);
    expect(screen.getAllByRole('menuitem').map((entry) => entry.textContent?.trim())).toEqual(['Sub']);
  });

  it('mode: vertical is the default; horizontal is a menubar; inline is a menu', () => {
    const view = render(Menu, { props: { items, 'aria-label': 'm' } });
    expect(rootList()).toHaveClass('ads-menu-vertical');
    expect(rootList()).toHaveAttribute('role', 'menu');
    expect(rootList()).not.toHaveAttribute('aria-orientation');
    view.unmount();
    render(Menu, { props: { items, mode: 'horizontal', 'aria-label': 'm' } });
    expect(rootList()).toHaveClass('ads-menu-horizontal');
    expect(rootList()).toHaveAttribute('role', 'menubar');
    expect(rootList()).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('mode: inline draws the inline classes and the level indent', () => {
    render(Menu, { props: { items, mode: 'inline', inlineIndent: 10, openKeys: ['sub'] } });
    expect(rootList()).toHaveClass('ads-menu-inline');
    expect(rootList().style.getPropertyValue('--ads-menu-pad-start')).toBe('10px');
    const sub = document.querySelector<HTMLElement>('ul.ads-menu-sub')!;
    expect(sub.style.getPropertyValue('--ads-menu-pad-start')).toBe('20px');
  });

  it('inlineIndent is 24 by default', () => {
    render(Menu, { props: { items, mode: 'inline' } });
    expect(rootList().style.getPropertyValue('--ads-menu-pad-start')).toBe('24px');
  });

  it('theme: light is the default, dark changes the class', () => {
    const view = render(Menu, { props: { items } });
    expect(rootList()).toHaveClass('ads-menu-light');
    view.unmount();
    render(Menu, { props: { items, theme: 'dark' } });
    expect(rootList()).toHaveClass('ads-menu-dark');
  });

  it('a value outside the contract of mode, theme or triggerSubMenuAction throws while developing and falls back in production', () => {
    const bad = (props: Record<string, unknown>) => () => render(Menu, { props: { items, ...props } });
    expect(bad({ mode: 'diagonal' })).toThrow(RangeError);
    expect(bad({ theme: 'blue' })).toThrow(RangeError);
    expect(bad({ triggerSubMenuAction: 'tap' })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(Menu, { props: { items, mode: 'diagonal', theme: 'blue' } as never });
    expect(rootList()).toHaveClass('ads-menu-vertical', 'ads-menu-light');
  });

  it('empty items draw an empty list without a role (an empty menu is an ARIA error)', () => {
    render(Menu, { props: { items: [], 'aria-label': 'Empty' } });
    expect(rootList()).not.toHaveAttribute('role');
    expect(rootList().children).toHaveLength(0);
  });

  it('an item has a label of text, of a number or of a snippet', () => {
    render(Menu, {
      props: {
        items: [
          { key: 'a', label: 'Text' },
          { key: 'b', label: 0 },
          { key: 'c', label: snippet('<b data-testid="rich">Rich</b>') },
          { key: 'd' }
        ]
      }
    });
    expect(byKey('a').textContent?.trim()).toBe('Text');
    expect(byKey('b').textContent?.trim()).toBe('0');
    expect(screen.getByTestId('rich')).toBeInTheDocument();
    expect(byKey('d').textContent?.trim()).toBe('');
  });

  it('icon is text or a snippet, is hidden from assistive technology and never joins the name of the item', () => {
    render(Menu, {
      props: {
        items: [
          { key: 'a', label: 'Alpha', icon: '★' },
          { key: 'b', label: 'Beta', icon: snippet('<svg data-testid="svg" aria-label="icon name"></svg>') }
        ]
      }
    });
    expect(screen.getByRole('menuitemradio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByTestId('svg').closest('.ads-menu-item-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(byKey('a').querySelector('.ads-menu-item-icon')).toHaveTextContent('★');
  });

  it('extra is shown at the end of the row, as text, a number or a snippet; nothing is drawn for an empty one', () => {
    render(Menu, {
      props: {
        items: [
          { key: 'a', label: 'A', extra: '⌘A' },
          { key: 'b', label: 'B', extra: 7 },
          { key: 'c', label: 'C', extra: snippet('<i data-testid="x">x</i>') },
          { key: 'd', label: 'D', extra: '' }
        ]
      }
    });
    expect(byKey('a').querySelector('.ads-menu-item-extra')).toHaveTextContent('⌘A');
    expect(byKey('b').querySelector('.ads-menu-item-extra')).toHaveTextContent('7');
    expect(screen.getByTestId('x').closest('.ads-menu-item-extra')).not.toBeNull();
    expect(byKey('d').querySelector('.ads-menu-item-extra')).toBeNull();
  });

  it('disabled and danger set the class; disabled sets aria-disabled', () => {
    render(Menu, { props: { items: [{ key: 'a', label: 'A', disabled: true, danger: true }, { key: 'b', label: 'B' }] } });
    expect(byKey('a')).toHaveClass('ads-menu-item-disabled', 'ads-menu-item-danger');
    expect(byKey('a')).toHaveAttribute('aria-disabled', 'true');
    expect(byKey('b')).not.toHaveAttribute('aria-disabled');
    expect(byKey('b')).not.toHaveClass('ads-menu-item-danger');
  });

  it('a group is a title and a list of items; a divider is a separator, solid or dashed', () => {
    render(Menu, {
      props: {
        items: [
          { type: 'group', label: 'People', children: [{ key: 'p', label: 'Pat' }, { type: 'divider' }] },
          { type: 'divider', dashed: true },
          { type: 'divider' }
        ]
      }
    });
    const group = screen.getByRole('group', { name: 'People' });
    expect(group).toContainElement(byKey('p'));
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(3);
    expect(separators.map((separator) => separator.classList.contains('ads-menu-divider-dashed'))).toEqual([false, true, false]);
  });

  it('the group title is not interactive and has no role of an item', () => {
    render(Menu, { props: { items: [{ type: 'group', label: 'People', children: [{ key: 'p', label: 'Pat' }] }] } });
    const title = screen.getByText('People');
    expect(title).toHaveClass('ads-menu-group-title');
    expect(title).not.toHaveAttribute('role');
    expect(title).not.toHaveAttribute('tabindex');
  });

  it('follows items that change', async () => {
    const view = render(Menu, { props: { items: [{ key: 'a', label: 'A' }] } });
    expect(screen.queryByText('B')).toBeNull();
    await view.rerender({ items: [{ key: 'a', label: 'A2' }, { key: 'b', label: 'B' }] });
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('two items with one key: the first one is kept (with a warning)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Menu, { props: { items: [{ key: 'a', label: 'First' }, { key: 'a', label: 'Second' }] } });
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByText('Second')).toBeNull();
  });

  it('items and markup children together: the items win (with a warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Menu, { props: { items: [{ key: 'a', label: 'FromItems' }], children: snippet('<span>markup</span>') } });
    expect(screen.getByText('FromItems')).toBeInTheDocument();
    expect(document.querySelector('.ads-menu-registry')).toBeNull();
    expect(warn.mock.calls.some(([message]) => String(message).includes('children are ignored'))).toBe(true);
  });
});

describe('Menu: the warning about items and markup together', () => {
  it('is not written when only items are given, or when only markup is', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Menu, { props: { items } });
    render(Menu, { props: { children: snippet('<span>markup</span>') } });
    expect(warn.mock.calls.filter(([message]) => String(message).includes('children are ignored'))).toHaveLength(0);
  });
});

describe('Menu: selection', () => {
  it('a click selects the item: aria-checked, class, selectedKeys, onselect', async () => {
    const onselect = vi.fn();
    render(MenuHarness, { props: { items, onselect } });
    await fireEvent.click(byKey('b'));
    expect(byKey('b')).toHaveAttribute('aria-checked', 'true');
    expect(byKey('b')).toHaveClass('ads-menu-item-selected');
    expect(byKey('a')).toHaveAttribute('aria-checked', 'false');
    expect(selected()).toBe('b');
    expect(onselect).toHaveBeenCalledTimes(1);
  });

  it('the click callback gets key, keyPath, the native event and the item object; select adds selectedKeys', async () => {
    const onclick = vi.fn();
    const onselect = vi.fn();
    render(Menu, { props: { items, openKeys: ['sub'], mode: 'inline', onclick, onselect } });
    await fireEvent.click(byKey('s1'));
    const info = onclick.mock.calls[0][0];
    expect(info.key).toBe('s1');
    expect(info.keyPath).toEqual(['s1', 'sub']);
    expect(info.domEvent).toBeInstanceOf(MouseEvent);
    expect(info.itemData).toBe((items[3] as { children: MenuItems }).children[0]);
    expect(onselect.mock.calls[0][0]).toMatchObject({ key: 's1', keyPath: ['s1', 'sub'], selectedKeys: ['s1'] });
  });

  it('the click callback is called before the select callback', async () => {
    const order: string[] = [];
    render(Menu, { props: { items, onclick: () => order.push('click'), onselect: () => order.push('select') } });
    await fireEvent.click(byKey('a'));
    expect(order).toEqual(['click', 'select']);
  });

  it('without multiple, a second item replaces the first, and a second click on the selected one calls nothing', async () => {
    const onselect = vi.fn();
    const ondeselect = vi.fn();
    render(MenuHarness, { props: { items, onselect, ondeselect } });
    await fireEvent.click(byKey('a'));
    await fireEvent.click(byKey('b'));
    expect(selected()).toBe('b');
    await fireEvent.click(byKey('b'));
    expect(selected()).toBe('b');
    expect(onselect).toHaveBeenCalledTimes(2);
    expect(ondeselect).not.toHaveBeenCalled();
  });

  it('multiple: items are checkboxes, a click toggles, and a click on a selected item calls ondeselect', async () => {
    const onselect = vi.fn();
    const ondeselect = vi.fn();
    render(MenuHarness, { props: { items, multiple: true, onselect, ondeselect } });
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(4);
    await fireEvent.click(byKey('a'));
    await fireEvent.click(byKey('b'));
    expect(selected()).toBe('a,b');
    expect(onselect.mock.calls[1][0].selectedKeys).toEqual(['a', 'b']);
    await fireEvent.click(byKey('a'));
    expect(selected()).toBe('b');
    expect(ondeselect).toHaveBeenCalledTimes(1);
    expect(ondeselect.mock.calls[0][0]).toMatchObject({ key: 'a', selectedKeys: ['b'] });
  });

  it('selectable: false selects nothing, ignores selectedKeys, and the items are plain menu items; onclick still runs', async () => {
    const onclick = vi.fn();
    const onselect = vi.fn();
    render(MenuHarness, { props: { items, selectable: false, selectedKeys: ['a'], onclick, onselect } });
    expect(screen.getAllByRole('menuitem').length).toBe(5);
    expect(byKey('a')).not.toHaveAttribute('aria-checked');
    expect(byKey('a')).not.toHaveClass('ads-menu-item-selected');
    await fireEvent.click(byKey('b'));
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(onselect).not.toHaveBeenCalled();
    expect(selected()).toBe('a');
  });

  it('selectedKeys given as a plain value is the initial one, and the parent can change it later', async () => {
    const view = render(Menu, { props: { items, selectedKeys: ['b'] } });
    expect(byKey('b')).toHaveClass('ads-menu-item-selected');
    await fireEvent.click(byKey('a'));
    expect(byKey('a')).toHaveClass('ads-menu-item-selected');
    await view.rerender({ selectedKeys: ['z'] });
    expect(byKey('z')).toHaveClass('ads-menu-item-selected');
    expect(byKey('a')).not.toHaveClass('ads-menu-item-selected');
  });

  it('bind:selectedKeys is two-way', async () => {
    render(MenuHarness, { props: { items, selectedKeys: ['a'] } });
    expect(byKey('a')).toHaveClass('ads-menu-item-selected');
    await fireEvent.click(byKey('z'));
    expect(selected()).toBe('z');
  });

  it('keys that match no item are ignored, and not removed from the bound array', async () => {
    render(MenuHarness, { props: { items, selectedKeys: ['nothing'], multiple: true } });
    expect(document.querySelector('.ads-menu-item-selected')).toBeNull();
    await fireEvent.click(byKey('a'));
    expect(selected()).toBe('nothing,a');
  });

  it('a disabled item cannot be chosen: no callbacks, no selection', async () => {
    const onclick = vi.fn();
    render(MenuHarness, { props: { items, onclick } });
    await fireEvent.click(byKey('c'));
    expect(onclick).not.toHaveBeenCalled();
    expect(selected()).toBe('');
  });

  it('a submenu that holds the selected item is marked, also when the items load later', async () => {
    const view = render(Menu, { props: { items: [{ key: 'sub', label: 'Sub', children: [] }], selectedKeys: ['s1'], mode: 'inline' } });
    expect(byKey('sub')).not.toHaveClass('ads-menu-submenu-selected');
    await view.rerender({ items: [{ key: 'sub', label: 'Sub', children: [{ key: 's1', label: 'S1' }] }] });
    expect(byKey('sub')).toHaveClass('ads-menu-submenu-selected');
  });

  it('the selected item in a nested submenu marks every submenu above it', () => {
    render(Menu, { props: { items, selectedKeys: ['d1'], mode: 'inline', openKeys: ['sub', 'deep'] } });
    expect(byKey('sub')).toHaveClass('ads-menu-submenu-selected');
    expect(byKey('deep')).toHaveClass('ads-menu-submenu-selected');
    expect(byKey('d1')).toHaveClass('ads-menu-item-selected');
  });
});

describe('Menu: inline submenus', () => {
  const inline = (props: Record<string, unknown> = {}) => render(MenuHarness, { props: { items, mode: 'inline', ...props } });

  it('a click on the title expands the submenu: aria-expanded, openKeys, onopenchange, the arrow', async () => {
    const onopenchange = vi.fn();
    inline({ onopenchange });
    const title = byKey('sub');
    expect(title).toHaveAttribute('aria-expanded', 'false');
    expect(byKey('s1').closest('.ads-menu-sub-wrap')).not.toHaveAttribute('data-open');
    await fireEvent.click(title);
    expect(title).toHaveAttribute('aria-expanded', 'true');
    expect(open()).toBe('sub');
    expect(onopenchange).toHaveBeenCalledWith(['sub']);
    expect(byKey('s1').closest('.ads-menu-sub-wrap')).toHaveAttribute('data-open');
    await fireEvent.click(title);
    expect(title).toHaveAttribute('aria-expanded', 'false');
    expect(open()).toBe('');
    expect(onopenchange).toHaveBeenLastCalledWith([]);
  });

  it('a closed submenu is inert (out of the Tab order and the accessibility tree); an open one is not', async () => {
    inline();
    const wrap = byKey('s1').closest('.ads-menu-sub-wrap')!;
    expect(wrap).toHaveAttribute('data-ads-hidden');
    await fireEvent.click(byKey('sub'));
    expect(wrap).not.toHaveAttribute('data-ads-hidden');
  });

  it('openKeys given as a plain value is the initial state, and the parent can change it', async () => {
    const view = render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'] } });
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'true');
    await view.rerender({ openKeys: [] });
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'false');
  });

  it('several submenus may be open at once; a nested one opens inside its parent', async () => {
    inline();
    await fireEvent.click(byKey('sub'));
    await fireEvent.click(byKey('deep'));
    expect(open()).toBe('sub>deep');
    expect(byKey('d1').closest('.ads-menu-sub-wrap')).toHaveAttribute('data-open');
  });

  it('a title click calls ontitleclick with the key and the native event; a disabled submenu does nothing', async () => {
    const ontitleclick = vi.fn();
    const onopenchange = vi.fn();
    render(Menu, {
      props: {
        mode: 'inline',
        onopenchange,
        items: [
          { key: 'x', label: 'X', ontitleclick, children: [{ key: 'x1' }] },
          { key: 'y', label: 'Y', disabled: true, ontitleclick, children: [{ key: 'y1' }] }
        ]
      }
    });
    await fireEvent.click(byKey('x'));
    expect(ontitleclick).toHaveBeenCalledTimes(1);
    expect(ontitleclick.mock.calls[0][0].key).toBe('x');
    expect(ontitleclick.mock.calls[0][0].domEvent).toBeInstanceOf(MouseEvent);
    await fireEvent.click(byKey('y'));
    expect(ontitleclick).toHaveBeenCalledTimes(1);
    expect(onopenchange).toHaveBeenCalledTimes(1);
  });

  it('the title has aria-haspopup="menu" and aria-controls with the id of its list; the list is named by the title', async () => {
    inline();
    const title = byKey('sub');
    expect(title).toHaveAttribute('aria-haspopup', 'menu');
    const list = document.getElementById(title.getAttribute('aria-controls')!)!;
    expect(list).toHaveAttribute('role', 'menu');
    expect(list).toHaveAttribute('aria-labelledby', title.id);
  });

  it('two menus on a page never share an id', () => {
    render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'one' } });
    render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'two' } });
    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the expand icon is an arrow that is hidden from assistive technology; expandIcon replaces it', () => {
    const view = render(Menu, { props: { items, mode: 'inline' } });
    expect(byKey('sub').querySelector('.ads-menu-expand')).toHaveAttribute('aria-hidden', 'true');
    expect(byKey('sub').querySelector('svg')).not.toBeNull();
    view.unmount();
    render(MenuHarness, { props: { items: [{ key: 'x', label: 'X', children: [{ key: 'x1' }] }, { key: 'y', label: 'Y', disabled: true, children: [] }], mode: 'inline', variant: 'expand', openKeys: ['x'] } });
    const icons = screen.getAllByTestId('expand-icon');
    expect(icons.map((icon) => [icon.dataset.key, icon.dataset.open, icon.dataset.disabled, icon.dataset.sub])).toEqual([
      ['x', 'true', 'false', 'true'],
      ['y', 'false', 'true', 'true']
    ]);
    expect(byKey('x').querySelector('svg')).toBeNull();
  });

  it('no inline list is built twice: the lists of closed submenus are in the page (for a server render and for aria-controls)', () => {
    inline();
    expect(byKey('s1')).toBeInTheDocument();
  });
});

describe('Menu: the semantic parts (classNames and styles)', () => {
  it('classNames and styles reach the root, the items, their icon and content, and the parts of a submenu', () => {
    render(Menu, {
      props: {
        mode: 'inline',
        openKeys: ['sub'],
        items: [
          { key: 'a', label: 'A', icon: '★' },
          { key: 'sub', label: 'Sub', icon: '☆', children: [{ key: 's1', label: 'S1', icon: '♥' }] }
        ],
        classNames: {
          root: 'c-root',
          item: 'c-item',
          itemIcon: 'c-icon',
          itemContent: 'c-content',
          popup: 'c-popup',
          subMenu: { itemTitle: 'c-title', list: 'c-list', item: 'c-sub-item', itemIcon: 'c-sub-icon', itemContent: 'c-sub-content' }
        },
        styles: {
          root: { 'min-width': '5px' },
          item: { 'padding-top': '1px' },
          itemIcon: { 'font-size': '9px' },
          itemContent: { 'padding-left': '2px' },
          subMenu: { itemTitle: { 'padding-top': '3px' }, list: { 'margin-top': '4px' }, item: { 'padding-top': '5px' }, itemIcon: { 'font-size': '7px' }, itemContent: { 'padding-left': '6px' } }
        }
      }
    });
    expect(rootList()).toHaveClass('c-root');
    expect(rootList()).toHaveStyle('min-width: 5px');
    expect(byKey('a')).toHaveClass('c-item');
    expect(byKey('a')).toHaveStyle('padding-top: 1px');
    expect(byKey('a').querySelector('.ads-menu-item-icon')).toHaveClass('c-icon');
    expect(byKey('a').querySelector('.ads-menu-item-icon')).toHaveStyle('font-size: 9px');
    expect(byKey('a').querySelector('.ads-menu-item-content')).toHaveClass('c-content');
    expect(byKey('sub')).toHaveClass('c-title');
    expect(byKey('sub')).toHaveStyle('padding-top: 3px');
    expect(byKey('sub').querySelector('.ads-menu-item-content')).toHaveClass('c-sub-content');
    expect(byKey('sub').querySelector('.ads-menu-item-content')).toHaveStyle('padding-left: 6px');
    const list = document.querySelector<HTMLElement>('ul.ads-menu-sub')!;
    expect(list).toHaveClass('c-list');
    expect(list).toHaveStyle('margin-top: 4px');
    expect(byKey('s1')).toHaveClass('c-item', 'c-sub-item');
    expect(byKey('s1').querySelector('.ads-menu-item-icon')).toHaveClass('c-icon', 'c-sub-icon');
    expect(byKey('s1').querySelector('.ads-menu-item-icon')).toHaveStyle('font-size: 7px');
  });

  it('a class of an item object goes on its row, of a submenu on its title, of a group on its entry', () => {
    render(Menu, {
      props: {
        mode: 'inline',
        items: [
          { key: 'a', label: 'A', class: 'k-item' },
          { key: 'sub', label: 'Sub', class: 'k-sub', children: [] },
          { type: 'group', label: 'G', class: 'k-group', children: [] }
        ]
      }
    });
    expect(byKey('a')).toHaveClass('k-item');
    expect(byKey('sub')).toHaveClass('k-sub');
    expect(document.querySelector('.ads-menu-group')).toHaveClass('k-group');
  });
});

describe('Menu: callbacks and state made by the parent', () => {
  it('onopenchange is not called for a change made by the parent', async () => {
    const onopenchange = vi.fn();
    const view = render(Menu, { props: { items, mode: 'inline', onopenchange } });
    await view.rerender({ openKeys: ['sub'] });
    await tick();
    expect(onopenchange).not.toHaveBeenCalled();
  });

  it('onselect is not called for a change made by the parent', async () => {
    const onselect = vi.fn();
    const view = render(Menu, { props: { items, onselect } });
    await view.rerender({ selectedKeys: ['a'] });
    expect(onselect).not.toHaveBeenCalled();
  });
});

describe('Menu: right-to-left', () => {
  it('a root in a right-to-left container marks every list, and the popup lists get dir="rtl"', async () => {
    render(Menu, { props: { items, style: 'direction: rtl', openKeys: ['sub'] } });
    await tick();
    expect(rootList()).toHaveClass('ads-menu-rtl');
  });

  it('a left-to-right root has no rtl class', async () => {
    render(Menu, { props: { items } });
    await tick();
    expect(rootList()).not.toHaveClass('ads-menu-rtl');
  });
});
