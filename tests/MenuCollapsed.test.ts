// The collapsed inline menu and the tips of its items (specs/menu.md, Behavior and P9). The width and the frames of the
// collapse are measured in the browser (e2e/menu.spec.ts).
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItems } from '../src/lib/Menu/types';
import MenuCollapseHarness from './fixtures/MenuCollapseHarness.svelte';
import MenuHarness from './fixtures/MenuHarness.svelte';
import { byKey, hoverIn, hoverOut, items, open, rootList } from './menuHelpers';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const advance = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  await tick();
};
const toggle = () => fireEvent.click(screen.getByTestId('toggle'));
const tips = () => Array.from(document.querySelectorAll<HTMLElement>('.ads-menu-tip'));
const withIcons: MenuItems = [
  { key: 'a', label: 'Alpha', icon: '★' },
  { key: 'plain', label: 'Plain' },
  { key: 'sub', label: 'Sub', icon: '◆', children: [{ key: 's1', label: 'Sub one' }] },
  { type: 'group', label: 'Group', children: [{ key: 'g1', label: 'Group one', icon: '☺' }] }
];

describe('Menu: a collapsed inline menu', () => {
  it('inlineCollapsed acts in inline mode only', () => {
    const view = render(MenuHarness, { props: { items, inlineCollapsed: true } });
    expect(rootList()).not.toHaveClass('ads-menu-inline-collapsed');
    view.unmount();
    render(MenuHarness, { props: { items, mode: 'horizontal', inlineCollapsed: true } });
    expect(rootList()).not.toHaveClass('ads-menu-inline-collapsed');
    document.body.innerHTML = '';
    render(MenuHarness, { props: { items, mode: 'inline', inlineCollapsed: true } });
    expect(rootList()).toHaveClass('ads-menu-inline-collapsed');
  });

  it('the labels stay in the accessibility tree: the names of the items do not change', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true } });
    await tick();
    expect(screen.getByRole('menuitemradio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Group one' })).toBeInTheDocument();
  });

  it('a submenu opens as a popup (no inline list), by hover', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true } });
    await tick();
    expect(document.querySelector('.ads-menu-sub-wrap')).toBeNull();
    hoverIn(byKey('sub'));
    await tick();
    expect(open()).toBe('sub');
    expect(byKey('s1').closest('ul')).toHaveClass('ads-menu-popup-list');
  });

  it('the group title is not shown; the arrow of a submenu is not shown', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true } });
    await tick();
    expect(byKey('sub').querySelector('.ads-menu-expand')).toBeNull();
  });

  it('an item without an icon shows the first character of its label; one with an icon does not; the label stays in the page', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true } });
    await tick();
    expect(byKey('plain').querySelector('.ads-menu-item-letter')).toHaveTextContent('P');
    expect(byKey('plain').querySelector('.ads-menu-item-letter')).toHaveAttribute('aria-hidden', 'true');
    expect(byKey('plain').querySelector('.ads-menu-item-content')).toHaveTextContent('Plain');
    expect(byKey('a').querySelector('.ads-menu-item-letter')).toBeNull();
  });

  it('an expanded menu shows no first character, and an item whose label is not text has none', async () => {
    const view = render(MenuHarness, { props: { items: withIcons, mode: 'inline' } });
    await tick();
    expect(document.querySelector('.ads-menu-item-letter')).toBeNull();
    await view.rerender({ inlineCollapsed: true, items: [{ key: 'x' }] });
    await tick();
    expect(document.querySelector('.ads-menu-item-letter')).toBeNull();
  });

  it('collapsing closes the expanded submenus and expanding opens them again', async () => {
    render(MenuCollapseHarness, { props: { items: withIcons, openKeys: ['sub'] } });
    await tick();
    expect(open()).toBe('sub');
    await toggle();
    expect(open()).toBe('');
    await toggle();
    expect(open()).toBe('sub');
    expect(byKey('sub')).toHaveAttribute('aria-expanded', 'true');
  });

  it('a menu that starts collapsed remembers the open keys it was given', async () => {
    render(MenuCollapseHarness, { props: { items: withIcons, startCollapsed: true, openKeys: ['sub'] } });
    await tick();
    expect(open()).toBe('');
    await toggle();
    expect(open()).toBe('sub');
  });

  it('the popups opened while collapsed are not kept when the menu expands', async () => {
    render(MenuCollapseHarness, { props: { items: withIcons } });
    await tick();
    await toggle();
    hoverIn(byKey('sub'));
    await tick();
    expect(open()).toBe('sub');
    await toggle();
    expect(open()).toBe('');
  });

  it('keys that were closed before collapsing stay closed after expanding, and a second collapse remembers the new state', async () => {
    render(MenuCollapseHarness, { props: { items: withIcons, openKeys: ['sub'] } });
    await tick();
    await fireEvent.click(byKey('sub'));
    expect(open()).toBe('');
    await toggle();
    await toggle();
    expect(open()).toBe('');
    await fireEvent.click(byKey('sub'));
    await toggle();
    expect(open()).toBe('');
    await toggle();
    expect(open()).toBe('sub');
  });
});

describe('Menu: the tip of a collapsed item', () => {
  async function collapsed(props: Record<string, unknown> = {}) {
    const view = render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true, ...props } });
    await tick();
    await advance(10);
    return view;
  }

  it('the pointer on an item shows its label, after the delay; the tip is out of the accessibility tree and not a description', async () => {
    await collapsed();
    hoverIn(byKey('a'));
    await advance(50);
    expect(tips()).toHaveLength(0);
    await advance(100);
    expect(tips().map((tip) => tip.textContent?.trim())).toEqual(['Alpha']);
    expect(tips()[0].closest('.ads-popup-frame')).toHaveAttribute('aria-hidden', 'true');
    expect(byKey('a')).not.toHaveAttribute('aria-describedby');
  });

  it('focus shows the tip too, and leaving hides it', async () => {
    await collapsed();
    byKey('a').focus();
    await tick();
    expect(tips().map((tip) => tip.textContent?.trim())).toEqual(['Alpha']);
    byKey('a').blur();
    await tick();
    expect(tips()[0]?.closest('.ads-popup')).toHaveAttribute('hidden');
  });

  it('title replaces the label as the text of the tip', async () => {
    await collapsed({ items: [{ key: 'a', label: 'Alpha', icon: '★', title: 'Short' }] });
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips().map((tip) => tip.textContent?.trim())).toEqual(['Short']);
  });

  it('an item that has no text to show has no tip', async () => {
    await collapsed({ items: [{ key: 'a', icon: '★' }] });
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(0);
  });

  it('tooltip: false turns the tips off', async () => {
    await collapsed({ tooltip: false });
    hoverIn(byKey('a'));
    await advance(300);
    expect(tips()).toHaveLength(0);
  });

  it('tooltip takes the delays, the parts and the arrow of the Tooltip', async () => {
    await collapsed({
      tooltip: { mouseEnterDelay: 1, classNames: { container: 'tip-box', root: 'tip-root', arrow: 'tip-arrow' }, styles: { container: { 'max-width': '77px' } }, arrow: true, zIndex: 9 }
    });
    hoverIn(byKey('a'));
    await advance(500);
    expect(tips()).toHaveLength(0);
    await advance(600);
    expect(tips()[0]).toHaveClass('tip-box');
    expect(tips()[0]).toHaveStyle('max-width: 77px');
    expect(tips()[0].closest('.ads-popup')).toHaveClass('tip-root');
    expect(tips()[0].closest('.ads-popup')).toHaveStyle('z-index: 9');
    expect(document.querySelector('.ads-popup-arrow span')).toHaveClass('tip-arrow');
  });

  it('items of a group get a tip too; items in a popup do not', async () => {
    await collapsed();
    hoverIn(byKey('g1'));
    await advance(200);
    expect(tips().map((tip) => tip.textContent?.trim())).toEqual(['Group one']);
    hoverIn(byKey('sub'));
    await tick();
    hoverIn(byKey('s1'));
    await advance(300);
    expect(tips().filter((tip) => tip.textContent?.trim() === 'Sub one')).toHaveLength(0);
  });

  it('tips wait until the width has settled after a change of inlineCollapsed', async () => {
    const view = render(MenuHarness, { props: { items: withIcons, mode: 'inline' } });
    await tick();
    await view.rerender({ inlineCollapsed: true });
    await tick();
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(0);
    await advance(300);
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(1);
  });

  it('a change that comes while the tips wait starts the wait again: the first timer does not run on', async () => {
    render(MenuCollapseHarness, { props: { items: withIcons } });
    await tick();
    await toggle();
    await advance(200);
    await toggle();
    await advance(50);
    await toggle();
    await advance(120);
    // 370 ms after the first change: the first timer has run out, the third change is 170 ms old.
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(0);
    hoverOut(byKey('a'));
    await advance(400);
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(1);
  });

  it('a tip that is shown goes away when the menu starts to change its width', async () => {
    const view = await collapsed();
    hoverIn(byKey('a'));
    await advance(200);
    expect(tips()).toHaveLength(1);
    await view.rerender({ inlineCollapsed: false });
    await tick();
    expect(document.querySelector('.ads-menu-tip')).toBeNull();
  });

  it('a menu that is not collapsed has no tips', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline' } });
    await tick();
    hoverIn(byKey('a'));
    await advance(300);
    expect(tips()).toHaveLength(0);
  });

  it('a click on an item of a collapsed menu still chooses it', async () => {
    render(MenuHarness, { props: { items: withIcons, mode: 'inline', inlineCollapsed: true } });
    await tick();
    await fireEvent.click(byKey('a'));
    expect(byKey('a')).toHaveAttribute('aria-checked', 'true');
  });
});
