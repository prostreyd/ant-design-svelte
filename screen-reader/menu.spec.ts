// Menu with a real screen reader (Orca with Firefox through Guidepup), on the Menu lab of the e2e fixtures (`/#menu`). What is
// asserted is what Orca says, in the form of Orca 51 with Firefox 159 (specs/menu.md, A11y): the name of the menu and the role
// "menu" where the focus comes into it; a selectable item said as a "radio menu item" with "selected" or "not selected" (the
// `menuitemradio` and `aria-checked` of the contract); a disabled item and a divider skipped by the arrow keys; the title of a
// group said with its first item; a submenu said as "collapsed" or "expanded" and "opens menu"; the popup of a submenu in the
// vertical and the horizontal mode and the inline list that Enter expands; Escape and ArrowLeft taking the focus back to the
// title; and a bar that is a `menubar` for the browser.
//
// One test, one walk: Orca keeps its state (the caret, the mode) from a test to the next, and a series of short tests on one
// page reads the wrong control.
//
// What this does NOT show: whether Orca says "menu bar" for the horizontal mode (it did not say the role of the container
// where the focus came into the bar, so the role is asserted on the element), the collapsed menu with the tip of an item, and
// how NVDA, JAWS or VoiceOver read a menu.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, joined, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(480_000);

type Orca = {
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  press(key: string): Promise<void>;
};

test('Menu: Orca says the name and the role of a menu, the radio items with their state, the submenus and their popups, and skips a disabled item and a divider', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#menu`);
  await page.waitForSelector('ul#menu');
  await settle(page, 800);
  await toWebContent(page, orca);

  const lab = (patch: Record<string, unknown>) =>
    page.evaluate((next) => (window as unknown as { __menuLab: { set(patch: unknown): void } }).__menuLab.set(next), patch);
  const item = (key: string) => page.locator(`[data-ads-key="${key}"]`);
  const activeKey = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('data-ads-key') ?? '');
  /** One key, then what Orca said for it. */
  const press = async (key: string, wait = 1000): Promise<string> => {
    await o.clearSpokenPhraseLog();
    await o.press(key);
    await settle(page, wait);
    return (await o.spokenPhraseLog()).map(cleanSpoken).join(' | ');
  };
  /** The focus comes into the menu from the element after it, the way Shift+Tab does. */
  const enter = async (): Promise<string> => {
    await page.locator('#before').focus();
    await settle(page);
    return press('Shift+Tab', 1200);
  };

  // ---- vertical: the items, the group, the submenu with its popup -------------------------------------------------------
  await lab({ mode: 'vertical', boxWidth: 300, selectedKeys: ['home'], openKeys: [] });
  await settle(page, 800);
  // The name of the menu, the role of the menu, then the item the focus came to, said as a radio item that is selected.
  expect(await enter()).toMatch(/Lab menu\. menu\. Home\. radio menu item selected/);
  // The disabled item "Documentation" is skipped: the next one is the submenu, said as collapsed and that it opens a menu.
  const next = await press('ArrowDown');
  expect(next).toMatch(/Products\. collapsed\. opens menu/);
  expect(next).not.toMatch(/Documentation/);
  await expect(item('docs')).toHaveAttribute('aria-disabled', 'true');
  // The title of a group is said with its first item.
  expect(await press('ArrowDown')).toMatch(/Account\. Profile\. radio menu item not selected/);
  expect(await press('ArrowUp')).toMatch(/Products\. collapsed\. opens menu/);
  // ArrowRight opens the popup of the submenu and the focus goes to its first item.
  expect(await press('ArrowRight', 1800)).toMatch(/expanded\..*Product one\. radio menu item not selected/);
  expect(await activeKey()).toBe('p1');
  expect(await press('ArrowDown')).toMatch(/Product two\. radio menu item not selected/);
  // The divider is skipped, and the extra text of an item is part of what is said.
  expect(await press('ArrowDown')).toMatch(/Product three ⌘3\. radio menu item not selected/);
  // A submenu inside the popup is said as collapsed too.
  expect(await press('ArrowDown')).toMatch(/More\. collapsed\. opens menu/);
  // Escape closes the popup and gives the focus back to the title that opened it.
  expect(await press('Escape', 1500)).toMatch(/Products\. collapsed\. opens menu/);
  expect(await activeKey()).toBe('products');
  await expect(item('products')).toHaveAttribute('aria-expanded', 'false');

  // ---- inline: Enter expands the list in place ----------------------------------------------------------------------------
  await lab({ mode: 'inline', boxWidth: 300, selectedKeys: ['home'], openKeys: [] });
  await settle(page, 1200);
  await item('home').focus();
  await settle(page);
  expect(await press('ArrowDown')).toMatch(/Products\. collapsed\. opens menu/);
  // Enter expands the submenu and Orca says the new state.
  expect(await press('Enter', 1800)).toMatch(/expanded/);
  await expect(item('products')).toHaveAttribute('aria-expanded', 'true');
  expect(await press('ArrowDown')).toMatch(/Product one\. radio menu item not selected/);
  expect(await press('ArrowDown')).toMatch(/Product two\. radio menu item not selected/);
  // ArrowLeft inside the list goes to the title, which says that it is expanded.
  expect(await press('ArrowLeft', 1500)).toMatch(/Products\. expanded\. opens menu/);
  // Enter on an item chooses it: Orca says "selected" and the one that was selected is not any more.
  await item('p1').focus();
  expect(await press('Enter', 1500)).toMatch(/selected/);
  await expect(item('p1')).toHaveAttribute('aria-checked', 'true');
  await expect(item('home')).toHaveAttribute('aria-checked', 'false');

  // ---- horizontal: a bar with the popup below an item ---------------------------------------------------------------------
  await lab({ mode: 'horizontal', boxWidth: 700, selectedKeys: ['home'], openKeys: [] });
  await settle(page, 1200);
  await expect(page.locator('ul#menu')).toHaveAttribute('role', 'menubar');
  await expect(page.locator('ul#menu')).toHaveAttribute('aria-orientation', 'horizontal');
  await enter();
  await item('home').focus();
  expect(await press('ArrowRight')).toMatch(/Products\. collapsed\. opens menu/);
  // ArrowDown opens the popup of the item below it, on its first item.
  expect(await press('ArrowDown', 1800)).toMatch(/Product one\. radio menu item not selected/);
  expect(await activeKey()).toBe('p1');
  expect(joined(await o.spokenPhraseLog())).not.toMatch(/Documentation/);
});
