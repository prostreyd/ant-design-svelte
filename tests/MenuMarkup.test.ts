// Menu items written as markup (specs/menu.md, decision D1): MenuItem, MenuSubMenu, MenuItemGroup and MenuDivider register with
// the Menu, which draws them in the order of the markup, the same way as `items`.
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Menu from '../src/lib/Menu/Menu.svelte';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuMarkupHarness from './fixtures/MenuMarkupHarness.svelte';
import MenuMarkupWrapHarness from './fixtures/MenuMarkupWrapHarness.svelte';
import MenuOutside from './fixtures/MenuOutside.svelte';
import { byKey, hoverIn, keydown, open, popupLists, rootList, selected } from './menuHelpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  document.body.innerHTML = '';
});

const keys = () => Array.from(rootList().querySelectorAll<HTMLElement>('[data-ads-key]')).map((element) => element.dataset.adsKey);
const mount = async (props: Record<string, unknown> = {}) => {
  const view = render(MenuMarkupHarness, { props });
  await tick();
  return view;
};

describe('Menu markup: the same tree as items', () => {
  it('draws the components in the order of the markup, with their roles', async () => {
    await mount({ mode: 'inline', openKeys: ['sub', 'deep'] });
    expect(keys()).toEqual(['first', 'a', 'b', 'sub', 's1', 'sg1', 'deep', 'd1', 'g1', 'last']);
    expect(screen.getByRole('group', { name: 'Group' })).toContainElement(byKey('g1'));
    expect(screen.getByRole('group', { name: 'Group in sub' })).toContainElement(byKey('sg1'));
    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getAllByRole('separator').map((separator) => separator.classList.contains('ads-menu-divider-dashed'))).toEqual([true, false]);
  });

  it('gives the same markup of the list as the same menu written as items', async () => {
    const asItems: MenuItems = [
      { key: 'first', label: 'First', icon: '★' },
      { key: 'a', label: 'Item a' },
      { key: 'b', label: 'Item b' },
      {
        key: 'sub',
        label: 'Sub',
        icon: '◆',
        class: 'sub-class',
        children: [
          { key: 's1', label: 'Sub one' },
          { type: 'group', label: 'Group in sub', class: 'gs', children: [{ key: 'sg1', label: 'SG1' }] },
          { type: 'divider', dashed: true },
          { key: 'deep', label: 'Deep', children: [{ key: 'd1', label: 'D1' }] }
        ]
      },
      { type: 'group', label: 'Group', children: [{ key: 'g1', label: 'G1', danger: true, disabled: true }] },
      { type: 'divider' },
      { key: 'last', label: 'Last', extra: '⌘L', class: 'mine' }
    ];
    const text = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('[role]')).map((element) => `${element.getAttribute('role')}:${element.getAttribute('data-ads-key') ?? ''}:${element.textContent?.replace(/\s+/g, ' ').trim()}`);
    const markup = await mount({ mode: 'inline', openKeys: ['sub', 'deep'] });
    const fromMarkup = text(rootList());
    markup.unmount();
    render(Menu, { props: { items: asItems, mode: 'inline', openKeys: ['sub', 'deep'], 'aria-label': 'Markup' } });
    await tick();
    expect(text(rootList())).toEqual(fromMarkup);
  });

  it('the props of an item: icon, the content as the label, extra, class, danger, disabled', async () => {
    await mount();
    expect(byKey('first').querySelector('.ads-menu-item-icon')).toHaveTextContent('★');
    expect(byKey('first')).toHaveAccessibleName('First');
    expect(byKey('g1')).toHaveClass('ads-menu-item-danger', 'ads-menu-item-disabled');
    expect(byKey('last')).toHaveClass('mine');
    expect(byKey('last').querySelector('.ads-menu-item-extra')).toHaveTextContent('⌘L');
    expect(screen.getByTestId('rich-label')).toBeInTheDocument();
  });

  it('an item written with the label prop and no content shows the label', async () => {
    await mount({ showMiddle: true });
    expect(byKey('middle')).toHaveTextContent('Middle');
  });

  it('the click callbacks get an item object made from the props of the component', async () => {
    const onclick = vi.fn();
    await mount({ onclick });
    await fireEvent.click(byKey('a'));
    const data = onclick.mock.calls[0][0].itemData;
    expect(data.key).toBe('a');
    expect(data.disabled).toBeUndefined();
    expect(selected()).toBe('a');
  });

  it('a submenu written as markup opens a popup with its items, nested ones included; its props are used', async () => {
    await mount({ subTheme: 'dark' });
    hoverIn(byKey('sub'));
    await tick();
    expect(open()).toBe('sub');
    expect(byKey('sub')).toHaveClass('sub-class');
    const frame = popupLists()[0].closest('.ads-popup-frame')!;
    expect(frame).toHaveClass('pc', 'ads-menu-popup-dark');
    hoverIn(byKey('deep'));
    await tick();
    expect(open()).toBe('sub>deep');
    expect(byKey('d1')).toBeInTheDocument();
  });

  it('ontitleclick of a submenu written as markup is called', async () => {
    await mount();
    await fireEvent.click(byKey('sub'));
    expect(screen.getByTestId('ontitle').textContent).toBe('sub');
  });

  it('a disabled submenu written as markup does not open', async () => {
    await mount({ subDisabled: true });
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('');
  });

  it('the keyboard goes through the items in the order of the markup', async () => {
    await mount();
    byKey('first').focus();
    await keydown(byKey('first'), 'ArrowDown');
    expect(byKey('a')).toHaveFocus();
    await keydown(byKey('a'), 'End');
    expect(byKey('last')).toHaveFocus();
  });
});

describe('Menu markup: the markup changes', () => {
  it('an item inserted by {#if} in the middle of the markup appears in its place', async () => {
    const view = await mount();
    expect(keys().slice(0, 3)).toEqual(['first', 'a', 'b']);
    await view.rerender({ showMiddle: true });
    await waitFor(() => expect(keys().slice(0, 4)).toEqual(['first', 'middle', 'a', 'b']));
    await view.rerender({ showMiddle: false });
    await waitFor(() => expect(keys().slice(0, 3)).toEqual(['first', 'a', 'b']));
  });

  it('items of an {#each} that is reordered, grown and shrunk follow it', async () => {
    const view = await mount({ order: ['a', 'b', 'c'] });
    expect(keys().slice(0, 4)).toEqual(['first', 'a', 'b', 'c']);
    await view.rerender({ order: ['c', 'a'] });
    await waitFor(() => expect(keys().slice(0, 3)).toEqual(['first', 'c', 'a']));
    await view.rerender({ order: ['x', 'c', 'a', 'y'] });
    await waitFor(() => expect(keys().slice(0, 5)).toEqual(['first', 'x', 'c', 'a', 'y']));
  });

  it('a submenu and the items inside it that are removed leave the menu', async () => {
    const view = await mount();
    expect(keys()).toContain('sub');
    await view.rerender({ withSub: false });
    await waitFor(() => expect(keys()).not.toContain('sub'));
    expect(keys()).toContain('last');
    await view.rerender({ withTail: false });
    await waitFor(() => expect(keys()).toEqual(['first', 'a', 'b']));
  });

  it('a prop that changes on a component reaches the menu', async () => {
    const view = await mount({ subDisabled: false });
    await view.rerender({ subDisabled: true });
    await tick();
    expect(byKey('sub')).toHaveAttribute('aria-disabled', 'true');
  });

  it('two components with one key: the first is kept (with a warning)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount({ order: ['first'] });
    expect(keys().filter((key) => key === 'first')).toHaveLength(1);
  });

  it('the markup is in the page before the lists (a server render has it), in a hidden area', async () => {
    await mount();
    const registry = document.querySelector('.ads-menu-registry')!;
    expect(registry).toHaveAttribute('hidden');
    expect(registry.compareDocumentPosition(rootList()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Menu markup: components inside an element', () => {
  it('an item inserted by {#if} inside a plain element appears in its place', async () => {
    const view = render(MenuMarkupWrapHarness);
    await tick();
    expect(keys()).toEqual(['first', 'inside', 'last']);
    await view.rerender({ showMiddle: true });
    await waitFor(() => expect(keys()).toEqual(['first', 'middle', 'inside', 'last']));
  });
});

describe('Menu markup: items win, and misuse', () => {
  it('a non-empty items wins: the markup is ignored (with a warning)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount({ items: [{ key: 'only', label: 'Only' }] });
    expect(keys()).toEqual(['only']);
    expect(warn.mock.calls.some(([message]) => String(message).includes('children are ignored'))).toBe(true);
  });

  it('an empty items is no items: the markup is drawn', async () => {
    await mount({ items: [] });
    expect(keys()).toContain('first');
  });

  it.each(['item', 'submenu', 'group', 'divider'] as const)('a %s written outside a Menu throws while developing', (component) => {
    expect(() => render(MenuOutside, { props: { component } })).toThrow(/must be written inside a Menu/);
  });

  it.each(['item', 'submenu', 'group', 'divider'] as const)('a %s written outside a Menu is left alone in production', (component) => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => render(MenuOutside, { props: { component } })).not.toThrow();
  });

  it('a Menu whose markup holds no components is an empty list', async () => {
    render(Menu, { props: { children: createRawSnippet(() => ({ render: () => '<i></i>' })) } });
    await tick();
    expect(rootList().children).toHaveLength(0);
  });
});
