// Accessibility of the Menu (specs/menu.md, A11y): axe on every mode and on an open popup, and the role of every part. jsdom has no
// layout, so the contrast is in tests/tokens.test.ts and the focus ring in e2e/menu.spec.ts.
import { render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Menu from '../src/lib/Menu/Menu.svelte';
import MenuHarness from './fixtures/MenuHarness.svelte';
import MenuMarkupHarness from './fixtures/MenuMarkupHarness.svelte';
import { byKey, hoverIn, items as sample, rootList } from './menuHelpers';
import type { MenuItems } from '../src/lib/Menu/types';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const items: MenuItems = [
  ...sample,
  { type: 'group', label: 'People', children: [{ key: 'p', label: 'Pat', icon: '☺' }] },
  { type: 'divider' },
  { key: 'x', label: 'Last', danger: true }
];

async function violations() {
  const result = await axe.run(document.body, { rules: { region: { enabled: false } } });
  return result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.html.slice(0, 90)).join(' | ')}`);
}

describe('Menu: axe', () => {
  it.each(['vertical', 'horizontal', 'inline'] as const)('has no violations in %s mode, with a selected item', async (mode) => {
    render(Menu, { props: { items, mode, selectedKeys: ['b'], 'aria-label': 'Main', openKeys: mode === 'inline' ? ['sub'] : [] } });
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('has no violations with several selected items (multiple) and with nothing selectable', async () => {
    const view = render(Menu, { props: { items, multiple: true, selectedKeys: ['a', 'b'], 'aria-label': 'Main' } });
    await tick();
    expect(await violations()).toEqual([]);
    view.unmount();
    render(Menu, { props: { items, selectable: false, 'aria-label': 'Main' } });
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('has no violations with a popup open, nested popups included', async () => {
    render(MenuHarness, { props: { items, 'aria-label': 'Main' } });
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('deep'));
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('has no violations when it is collapsed, with its tips', async () => {
    render(MenuHarness, { props: { items: sample.map((item) => ('icon' in item ? item : { ...item, icon: '★' })), mode: 'inline', inlineCollapsed: true, 'aria-label': 'Main' } });
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('has no violations when written as markup, and when empty', async () => {
    const view = render(MenuMarkupHarness, { props: { mode: 'inline', openKeys: ['sub'] } });
    await tick();
    expect(await violations()).toEqual([]);
    view.unmount();
    render(Menu, { props: { items: [], 'aria-label': 'Empty' } });
    expect(await violations()).toEqual([]);
  });

  it('has no violations with the "…" item shown', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const width = this.matches('li[data-ads-top]') ? 100 : this.matches('li[data-ads-more]') ? 40 : 0;
      return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: 0, width, height: 0, toJSON: () => ({}) } as DOMRect;
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: function (this: HTMLElement) { return this.classList.contains('ads-menu-root') ? 250 : 0; } });
    render(Menu, { props: { items, mode: 'horizontal', 'aria-label': 'Bar' } });
    await tick();
    expect(document.querySelector('[data-ads-more]:not([data-ads-hidden])')).not.toBeNull();
    expect(await violations()).toEqual([]);
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    vi.unstubAllGlobals();
  });
});

describe('Menu: roles and states (the menu and menubar patterns of the WAI-ARIA Authoring Practices)', () => {
  it('every part has the role of the pattern: menu, none, menuitem, group, separator', async () => {
    render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'Main' } });
    await tick();
    expect(rootList()).toHaveAttribute('role', 'menu');
    for (const entry of rootList().querySelectorAll(':scope > li')) {
      expect(['none', 'separator']).toContain(entry.getAttribute('role'));
    }
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0);
    expect(screen.getByRole('group', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('the title of a submenu says it holds a menu and whether it is open; the list it controls is named by it', async () => {
    render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'Main' } });
    await tick();
    const title = byKey('sub');
    expect(title).toHaveAttribute('aria-haspopup', 'menu');
    expect(title).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(title.getAttribute('aria-controls')!)!;
    expect(list).toHaveAccessibleName('Sub');
  });

  it('nothing in the menu has a role of an interactive widget inside another (no nested interactive content)', async () => {
    render(Menu, { props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'Main' } });
    await tick();
    for (const entry of document.querySelectorAll('[role^=menuitem]')) {
      expect(entry.querySelector('button, a[href], input, select, textarea, [tabindex]')).toBeNull();
    }
  });

  it('only one element of the menu is in the Tab order', async () => {
    render(Menu, { props: { items, selectedKeys: ['b'], 'aria-label': 'Main' } });
    await tick();
    expect(rootList().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(rootList().querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])')).toHaveLength(0);
  });

  it('a disabled item says so and is not a tab stop', async () => {
    render(Menu, { props: { items, 'aria-label': 'Main' } });
    expect(byKey('c')).toHaveAttribute('aria-disabled', 'true');
    expect(byKey('c')).toHaveAttribute('tabindex', '-1');
  });
});
