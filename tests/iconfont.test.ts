// createFromIconfontCN (specs/icon.md, I10): the sprite scripts of an iconfont.cn project and the icon that draws a symbol of
// the sprite. jsdom does not load external scripts, so what is checked is the elements that are added, their order and the markup.
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IconFont from '../src/lib/Icon/IconFont.svelte';
import { createFromIconfontCN, withDefaults } from '../src/lib/Icon/iconfont';

const added = () => [...document.scripts].filter((script) => script.hasAttribute('data-ads-iconfont'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const script of added()) script.remove();
});

describe('createFromIconfontCN', () => {
  it('I10: one script per URL is added, in the page, and it keeps the order of the document', () => {
    createFromIconfontCN({ scriptUrl: '/fonts/first.js' });
    expect(added().map((script) => script.getAttribute('src'))).toEqual(['/fonts/first.js']);
    expect(added()[0].async).toBe(false);
  });

  it('I10: an array is loaded in order (a later URL overrides an earlier one for a name used twice)', () => {
    createFromIconfontCN({ scriptUrl: ['/fonts/a.js', '/fonts/b.js', '/fonts/c.js'] });
    expect(added().map((script) => script.getAttribute('src'))).toEqual(['/fonts/a.js', '/fonts/b.js', '/fonts/c.js']);
    // Scripts added by script run in the order they were added only when none of them is `async`.
    expect(added().every((script) => script.async === false)).toBe(true);
  });

  it('I10: the same URL is loaded once, however many times and by however many fonts it is asked for', () => {
    createFromIconfontCN({ scriptUrl: '/fonts/shared.js' });
    createFromIconfontCN({ scriptUrl: ['/fonts/shared.js', '/fonts/other.js'] });
    createFromIconfontCN({ scriptUrl: '/fonts/shared.js' });
    expect(added().map((script) => script.getAttribute('src'))).toEqual(['/fonts/shared.js', '/fonts/other.js']);
  });

  it('I10: no URL, an empty URL and an empty list add nothing', () => {
    createFromIconfontCN();
    createFromIconfontCN({ scriptUrl: '' });
    createFromIconfontCN({ scriptUrl: [] });
    expect(added()).toHaveLength(0);
  });

  it('I10: the icon draws the symbol with `use`, inside the same wrapper as every icon, and is hidden without a label', () => {
    const IconFont = createFromIconfontCN();
    render(IconFont, { type: 'icon-tuichu' });
    const wrapper = document.querySelector('.ads-icon')!;
    const use = wrapper.querySelector('svg > use')!;
    expect(use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#icon-tuichu');
    // Not `href`: the prerender crawler of SvelteKit takes the href of any tag for a link and fails the build on a symbol that is no id.
    expect(use.hasAttribute('href')).toBe(false);
    expect(wrapper.outerHTML).not.toMatch(/\shref=/);
    expect(wrapper.querySelector('svg')!.getAttribute('width')).toBe('1em');
    expect(wrapper.querySelector('svg')!.getAttribute('fill')).toBe('currentColor');
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('I10: `label` names it, and `spin`, `rotate`, `class` and `style` work as on every icon', () => {
    const IconFont = createFromIconfontCN();
    render(IconFont, { type: 'icon-tuichu', label: 'Log out', spin: true, rotate: 90, class: 'mine', style: 'color: red' });
    const wrapper = screen.getByRole('img', { name: 'Log out' });
    expect([...wrapper.classList].filter((name) => name.startsWith('ads-'))).toEqual(['ads-icon', 'ads-icon-spin', 'ads-icon-rotated']);
    expect(wrapper.classList.contains('mine')).toBe(true);
    expect(wrapper.getAttribute('style')).toBe('--ads-icon-rotate: 90deg; color: red;');
  });

  it('I10: a new `type` changes the symbol', async () => {
    const IconFont = createFromIconfontCN();
    const { rerender } = render(IconFont, { type: 'icon-a' });
    await rerender({ type: 'icon-b' });
    expect(document.querySelector('use')!.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#icon-b');
  });

  it('I10: extraCommonProps are given to every icon of the font, and a prop the icon sets wins', () => {
    const IconFont = createFromIconfontCN({ extraCommonProps: { class: 'shared', 'data-font': 'mine', label: 'Shared name' } });
    render(IconFont, { type: 'icon-a' });
    render(IconFont, { type: 'icon-b', class: 'own' });
    const [first, second] = [...document.querySelectorAll('.ads-icon')];
    expect(first.classList.contains('shared')).toBe(true);
    expect(first.getAttribute('data-font')).toBe('mine');
    expect(first.getAttribute('aria-label')).toBe('Shared name');
    expect(second.classList.contains('shared')).toBe(false);
    expect(second.classList.contains('own')).toBe(true);
    expect(second.getAttribute('data-font')).toBe('mine');
  });

  it('I10: two fonts do not share their props', () => {
    const A = createFromIconfontCN({ extraCommonProps: { class: 'from-a' } });
    const B = createFromIconfontCN({ extraCommonProps: { class: 'from-b' } });
    render(A, { type: 'x' });
    render(B, { type: 'y' });
    const [first, second] = [...document.querySelectorAll('.ads-icon')];
    expect([first.classList.contains('from-a'), first.classList.contains('from-b')]).toEqual([true, false]);
    expect([second.classList.contains('from-a'), second.classList.contains('from-b')]).toEqual([false, true]);
  });
});

describe('createFromIconfontCN: the places where there is no page', () => {
  it('I10: on a server there is no document: nothing is added and nothing throws', () => {
    vi.stubGlobal('document', undefined);
    expect(() => createFromIconfontCN({ scriptUrl: ['/fonts/server.js'] })).not.toThrow();
    vi.unstubAllGlobals();
    expect(added()).toHaveLength(0);
  });

  it('I10: a page with no head gets the script on the root element', () => {
    vi.spyOn(document, 'head', 'get').mockReturnValue(null as unknown as HTMLHeadElement);
    createFromIconfontCN({ scriptUrl: '/fonts/no-head.js' });
    const [script] = added();
    expect(script.parentElement).toBe(document.documentElement);
  });

  it('I10: an icon with no type draws an empty reference, not the word undefined', () => {
    render(IconFont, {} as never);
    expect(document.querySelector('use')!.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#');
  });
});

describe('withDefaults: the props of an icon with the shared ones behind them', () => {
  it('with nothing shared the props themselves come back', () => {
    const props = { a: 1 };
    expect(withDefaults(props, {})).toBe(props);
  });

  it('a prop the icon sets wins; a missing one comes from the shared ones; neither has the key it does not know', () => {
    const merged = withDefaults({ a: 1, b: undefined } as Record<string, unknown>, { a: 'shared', b: 'shared', c: 'shared' });
    expect(merged.a).toBe(1);
    expect(merged.b).toBeUndefined();
    expect(merged.c).toBe('shared');
    expect(merged.d).toBeUndefined();
  });

  it('`in`, the keys and the descriptors cover both, once each, as a spread or a rest of props needs them', () => {
    const merged = withDefaults({ a: 1 } as Record<string, unknown>, { a: 'shared', c: 'shared' });
    expect('a' in merged && 'c' in merged && !('z' in merged)).toBe(true);
    expect(Reflect.ownKeys(merged).sort()).toEqual(['a', 'c']);
    expect(Object.keys(merged).sort()).toEqual(['a', 'c']);
    expect({ ...merged }).toEqual({ a: 1, c: 'shared' });
    expect(Object.getOwnPropertyDescriptor(merged, 'a')!.value).toBe(1);
    expect(Object.getOwnPropertyDescriptor(merged, 'c')!.value).toBe('shared');
    expect(Object.getOwnPropertyDescriptor(merged, 'z')).toBeUndefined();
  });

  it('the props stay live: a change of the target shows through', () => {
    const target: Record<string, unknown> = { a: 1 };
    const merged = withDefaults(target, { c: 'shared' });
    target.a = 2;
    expect(merged.a).toBe(2);
  });
});
