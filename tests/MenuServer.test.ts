// The server render of a Menu: nothing here has a document, a layout or an effect. The components are rendered in a process
// of their own (tests/helpers/renderOnServer.mjs), so the coverage of the browser build stays what it is.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const menu = 'src/lib/Menu/Menu.svelte';
const markup = 'tests/fixtures/MenuMarkupHarness.svelte';

function renderOnServer(cases: Array<{ file: string; props: Record<string, unknown> }>): string[] {
  const output = execFileSync(process.execPath, [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify(cases)], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output) as string[];
}

const items = [
  { key: 'a', label: 'Alpha', icon: '★' },
  { key: 'sub', label: 'Sub', children: [{ key: 's1', label: 'Sub one' }] },
  { type: 'group', label: 'People', children: [{ key: 'p', label: 'Pat' }] },
  { type: 'divider' }
];

describe('Menu on the server', () => {
  const [vertical, horizontal, inline, collapsed, byMarkup, empty] = renderOnServer([
    { file: menu, props: { items, 'aria-label': 'Main', selectedKeys: ['a'] } },
    { file: menu, props: { items, mode: 'horizontal', 'aria-label': 'Main' } },
    { file: menu, props: { items, mode: 'inline', openKeys: ['sub'], 'aria-label': 'Main' } },
    { file: menu, props: { items, mode: 'inline', inlineCollapsed: true, 'aria-label': 'Main' } },
    { file: markup, props: { mode: 'inline' } },
    { file: menu, props: { items: [] } }
  ]);

  it('the items, their roles and the selected state are in the HTML', () => {
    expect(vertical).toContain('role="menu"');
    expect(vertical).toContain('aria-label="Main"');
    expect(vertical).toContain('Alpha');
    expect(vertical).toContain('role="menuitemradio"');
    expect(vertical).toContain('aria-checked="true"');
    expect(vertical).toContain('role="group"');
    expect(vertical).toContain('role="separator"');
  });

  it('a vertical menu has no popup in the HTML; the arrow and the title of a submenu are', () => {
    expect(vertical).toContain('aria-haspopup="menu"');
    expect(vertical).not.toContain('ads-popup');
    expect(vertical).not.toContain('Sub one');
  });

  it('a bar is a menubar, and has the "…" item in the HTML, hidden: everything is drawn, nothing is measured', () => {
    expect(horizontal).toContain('role="menubar"');
    expect(horizontal).toContain('aria-orientation="horizontal"');
    expect(horizontal).toContain('data-ads-more');
    expect(horizontal).not.toContain('ads-menu-overflowed');
  });

  it('an inline menu has all its submenus in the HTML, the closed ones hidden (search engines and no-script readers see them)', () => {
    expect(inline).toContain('Sub one');
    expect(inline).toContain('data-open');
    expect(inline).toContain('ads-menu-sub-wrap');
  });

  it('a collapsed menu has the labels in the HTML, and the collapsed class', () => {
    expect(collapsed).toContain('ads-menu-inline-collapsed');
    expect(collapsed).toContain('Alpha');
    expect(collapsed).not.toContain('ads-menu-tip');
  });

  it('the markup components are in a hidden area before the list, and the items are in the list', () => {
    expect(byMarkup).toContain('ads-menu-registry');
    expect(byMarkup).toContain('Sub one');
    expect(byMarkup.indexOf('ads-menu-registry')).toBeLessThan(byMarkup.indexOf('ads-menu-root'));
  });

  it('an empty menu has an empty list without a role', () => {
    expect(empty).toContain('ads-menu-root');
    expect(empty).not.toContain('role="menu"');
  });
});
