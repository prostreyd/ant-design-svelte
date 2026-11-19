// The Menu in a real browser, in the three engines (specs/menu.md): the geometry, the popups and the pointer, the keyboard, the
// layout rule, the motion, touch. It runs against the lab at `/#menu` (e2e/fixtures/MenuLab.svelte); the logic is in tests/Menu*.test.ts.
import { expect, test, type Locator, type Page } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };

/** Applies a patch to the lab and waits two frames. */
async function lab(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate((p) => (window as unknown as { __menuLab: { set(p: unknown): void } }).__menuLab.set(p), patch);
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

const key = (page: Page, name: string) => page.locator(`[data-ads-key="${name}"]`).first();
/** The row of an item inside an open popup (a hidden entry of a bar shares its key). */
const inPopup = (page: Page, name: string) => page.locator(`.ads-popup:visible [data-ads-key="${name}"]`).first();
const popups = (page: Page) => page.locator('.ads-popup:visible ul.ads-menu-popup-list');
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const state = (page: Page) => page.getByTestId('state').or(page.locator('#state'));
const rootOf = (page: Page) => page.locator('ul#menu');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 760 });
  await page.goto('/#menu');
  await page.waitForFunction(() => Boolean((window as unknown as { __menuLab?: unknown }).__menuLab));
  // No animation: a rectangle is final right after a change. The motion has its own tests below.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('geometry (the sizes of the Ant Design token table)', () => {
  test('a vertical item is 40px high with 4px margins, and its row fills the list', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const list = await rect(rootOf(page));
    const home = await rect(key(page, 'home'));
    near(home.height, 40);
    near(home.x - list.x, 4);
    near(list.x + list.width - (home.x + home.width), 4 + 1, 1.5);
    // The margins of two items that follow each other are one: the gap is 4px, as in Ant Design.
    const next = await rect(key(page, 'docs'));
    near(next.y - (home.y + home.height), 4);
  });

  test('the selected item is painted with the selected colors, hover and pressed have colors of their own', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await expect(key(page, 'home')).toHaveCSS('background-color', 'rgb(230, 244, 255)');
    await expect(key(page, 'home')).toHaveCSS('color', 'rgb(22, 104, 220)');
    await key(page, 'plain').hover();
    await expect(key(page, 'plain')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.06)');
  });

  test('a disabled item is dimmed, and a danger item is red', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await expect(key(page, 'docs')).toHaveCSS('cursor', 'not-allowed');
    await key(page, 'products').hover();
    await expect(inPopup(page, 'p2')).toHaveCSS('color', 'rgb(207, 19, 34)');
  });

  test('a vertical popup opens to the right of its title, with its top at the top of the title', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await settle(page);
    const title = await rect(key(page, 'products'));
    const list = await rect(popups(page).first());
    expect(list.x).toBeGreaterThanOrEqual(title.x + title.width - 1);
    expect(list.x - (title.x + title.width)).toBeLessThanOrEqual(12);
    near(list.y, title.y, 2);
    expect(list.width).toBeGreaterThanOrEqual(160);
  });

  test('a nested popup opens to the right of its parent popup', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await inPopup(page, 'more').hover();
    await expect(popups(page)).toHaveCount(2);
    await settle(page);
    const parent = await rect(popups(page).nth(0));
    const child = await rect(popups(page).nth(1));
    expect(child.x).toBeGreaterThanOrEqual(parent.x + parent.width - 1);
  });

  test('a popup that would leave the screen opens on the other side', async ({ page }) => {
    await page.setViewportSize({ width: 520, height: 760 });
    await lab(page, { mode: 'vertical', boxWidth: 200, boxLeft: 300 });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await settle(page);
    const title = await rect(key(page, 'products'));
    const list = await rect(popups(page).first());
    expect(list.x + list.width).toBeLessThanOrEqual(title.x + 1);
  });

  test('a bar: items are 46px high, a popup opens below its title with the left edges aligned', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 900 });
    const home = await rect(key(page, 'home'));
    near(home.height, 46);
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await settle(page);
    const title = await rect(key(page, 'products'));
    const list = await rect(popups(page).first());
    expect(list.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
    near(list.x, title.x, 1.5);
  });

  test('an inline submenu is indented by inlineIndent for each level', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 300, openKeys: ['products'], inlineIndent: 10 });
    await expect(key(page, 'p1')).toHaveCSS('padding-left', '20px');
    await expect(key(page, 'home')).toHaveCSS('padding-left', '10px');
    await lab(page, { inlineIndent: 24 });
    await expect(key(page, 'home')).toHaveCSS('padding-left', '24px');
  });

  test('a collapsed menu is 80px wide with its icons in the middle, and the labels are not drawn', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 256 });
    near((await rect(rootOf(page))).width, 256);
    await lab(page, { collapsed: true });
    await expect.poll(async () => (await rect(rootOf(page))).width).toBeCloseTo(80, 0);
    const list = await rect(rootOf(page));
    const icon = await rect(key(page, 'home').locator('.ads-menu-item-icon'));
    near(icon.x + icon.width / 2 - list.x, 40, 1.5);
    const label = await rect(key(page, 'home').locator('.ads-menu-item-content'));
    expect(label.width).toBeLessThanOrEqual(1);
  });

  test('a collapsed menu shows the label of an item as a tip on its right, and the first letter of an item without an icon', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 256, collapsed: true });
    await page.waitForTimeout(500);
    await key(page, 'home').hover();
    const tip = page.locator('.ads-menu-tip:visible');
    await expect(tip).toHaveText('Home');
    const row = await rect(key(page, 'home'));
    const box = await rect(tip);
    expect(box.x).toBeGreaterThanOrEqual(row.x + row.width - 1);
    await expect(key(page, 'plain').locator('.ads-menu-item-letter')).toHaveText('N');
  });
});

// The title of a group and its items (measured on the React demos, 2026-11-17): inline, they start at the same place (the indent of
// their level); in a vertical list or a popup the items start 16px after the title (the title 16px, the items 32px from the edge).
test.describe('groups: where the title and the items start', () => {
  /** The left edge of the text of an element: a title has no box around its text. */
  const textLeft = (locator: Locator) =>
    locator.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().left;
    });
  /** Where the content of an item starts: its edge, its border and its padding (an icon or the label comes right there). */
  const contentLeft = (locator: Locator) =>
    locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return element.getBoundingClientRect().left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    });
  const titleIn = (scope: Locator, text: string) => scope.locator('.ads-menu-group-title', { hasText: text }).first();

  test('inline: the title and the items of a group start at the same place, in the root and in a submenu', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 300, groupInSub: true, openKeys: ['products'] });
    const root = rootOf(page);
    near(await textLeft(titleIn(root, 'Account')), await contentLeft(key(page, 'profile')), 0.5);
    near(await textLeft(titleIn(root, 'Reports')), await contentLeft(key(page, 'r1')), 0.5);
    // The submenu is one level deeper: its group starts one indent (24px) further in than the group of the root.
    near((await textLeft(titleIn(root, 'Reports'))) - (await textLeft(titleIn(root, 'Account'))), 24, 0.5);
    await lab(page, { inlineIndent: 12 });
    near(await textLeft(titleIn(root, 'Reports')), await contentLeft(key(page, 'r1')), 0.5);
    near((await textLeft(titleIn(root, 'Reports'))) - (await textLeft(titleIn(root, 'Account'))), 12, 0.5);
  });

  test('a vertical list: the title is 16px from the edge, the items of its group 32px', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const list = await rect(rootOf(page));
    const title = await textLeft(titleIn(rootOf(page), 'Account'));
    near(title - list.x, 16, 0.5);
    near((await contentLeft(key(page, 'profile'))) - list.x, 32, 0.5);
    // An item that is not in a group keeps the margin and the padding of any item.
    near((await contentLeft(key(page, 'plain'))) - list.x, 4 + 16, 0.5);
  });

  test('a popup: the title is 16px from the edge, the items of its group 32px', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300, groupInSub: true });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    const popup = page.locator('.ads-popup:visible ul.ads-menu-popup-list').first();
    const list = await rect(popup);
    near((await textLeft(titleIn(popup, 'Reports'))) - list.x, 16, 0.5);
    near((await contentLeft(inPopup(page, 'r1'))) - list.x, 32, 0.5);
    // An item of the same popup outside the group: the margin 4 and the padding 16.
    near((await contentLeft(inPopup(page, 'p1'))) - list.x, 4 + 16, 0.5);
  });

  test('a popup of a bar has the same offsets', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 900, groupInSub: true });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    const barPopup = page.locator('.ads-popup:visible ul.ads-menu-popup-list').first();
    const barList = await rect(barPopup);
    near((await contentLeft(inPopup(page, 'r1'))) - barList.x, 32, 0.5);
    near((await textLeft(titleIn(barPopup, 'Reports'))) - barList.x, 16, 0.5);
  });
});

test.describe('overflow of a bar', () => {
  test('the entries that fit are shown and the rest wait in the "…" popup, at every width; nothing is cut', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 900, extraItems: 4 });
    for (const width of [900, 700, 560, 420, 300]) {
      await lab(page, { boxWidth: width });
      await expect.poll(() => page.evaluate(() => {
        const root = document.querySelector('ul#menu') as HTMLElement;
        const limit = root.getBoundingClientRect().right;
        return Array.from(root.querySelectorAll<HTMLElement>(':scope > li:not([data-ads-hidden])')).every((entry) => entry.getBoundingClientRect().right <= limit + 0.5);
      })).toBe(true);
    }
    const more = page.locator('ul#menu > li[data-ads-more]');
    await expect(more).not.toHaveAttribute('data-ads-hidden', '');
    await lab(page, { boxWidth: 1800 });
    await expect(more).toHaveAttribute('data-ads-hidden', '');
    await expect(page.locator('ul#menu > li[data-ads-hidden]:not([data-ads-more])')).toHaveCount(0);
  });

  test('the "…" item opens a popup with the hidden entries; choosing one selects it', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 300 });
    const more = page.locator('ul#menu > li[data-ads-more] [role=menuitem]');
    await expect(more).toBeVisible();
    await more.hover();
    await expect(popups(page)).toHaveCount(1);
    await inPopup(page, 'plain').click();
    await expect(state(page)).toContainText('selected=plain');
    await expect(popups(page)).toHaveCount(0);
  });

  test('a submenu in the "…" popup opens one popup, beside the "…" popup (not a second one at the place of its hidden twin in the bar)', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 300 });
    await page.locator('ul#menu > li[data-ads-more] [role=menuitem]').hover();
    await expect(popups(page)).toHaveCount(1);
    await inPopup(page, 'products').hover();
    await expect(popups(page)).toHaveCount(2);
    // Give the pointer time to do what a second popup would do (open, place itself); the count must not change.
    await settle(page);
    await expect(popups(page)).toHaveCount(2);
    const first = await rect(popups(page).nth(0));
    const second = await rect(popups(page).nth(1));
    expect(second.x, 'the submenu is beside the "…" popup, on its right').toBeGreaterThanOrEqual(first.x + first.width - 1);
    const duplicates = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(duplicates).toEqual([]);
  });

  test('the hidden entries are out of the Tab order and the accessibility tree, and the "…" item is named', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 300 });
    const hidden = page.locator('ul#menu > li[data-ads-hidden]:not([data-ads-more])').first();
    await expect(hidden).toBeHidden();
    await expect(page.locator('ul#menu').getByRole('menuitem', { name: 'More' })).toBeVisible();
  });
});

test.describe('the pointer', () => {
  test('the pointer can cross the gap from the title into the popup and rest there; leaving closes it', async ({ page }) => {
    // A long close delay: what is tested is that the pointer may rest in the popup, not how fast it crosses (an engine under load
    // can wait longer than 0.1 s between two mouse events; the delays have their own test).
    await lab(page, { mode: 'vertical', boxWidth: 300, subMenuCloseDelay: 0.5 });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    const popup = await rect(popups(page).first());
    const title = await rect(key(page, 'products'));
    await page.mouse.move(title.x + title.width - 4, title.y + title.height / 2);
    await page.mouse.move(popup.x + 30, popup.y + 30, { steps: 8 });
    await page.waitForTimeout(500);
    await expect(popups(page)).toHaveCount(1);
    await page.mouse.move(700, 700, { steps: 6 });
    await expect(popups(page)).toHaveCount(0, { timeout: 3000 });
  });

  test('from the popup into the popup of a submenu in it, and back: only the child closes', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await inPopup(page, 'more').hover();
    await expect(popups(page)).toHaveCount(2);
    const child = await rect(popups(page).nth(1));
    await page.mouse.move(child.x + 30, child.y + 30, { steps: 6 });
    await page.waitForTimeout(500);
    await expect(popups(page)).toHaveCount(2);
    await inPopup(page, 'p1').hover();
    await expect(popups(page)).toHaveCount(1);
  });

  test('a click on an item of a popup selects it and closes the popups', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await inPopup(page, 'p1').click();
    await expect(state(page)).toContainText('selected=p1');
    await expect(popups(page)).toHaveCount(0);
    await expect(key(page, 'products')).toHaveClass(/ads-menu-submenu-selected/);
  });

  test('a press outside closes the popup', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await page.mouse.click(900, 700);
    await expect(popups(page)).toHaveCount(0);
  });

  test('triggerSubMenuAction="click": a click opens and closes; the pointer alone does nothing', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300, triggerSubMenuAction: 'click' });
    await key(page, 'products').hover();
    await page.waitForTimeout(300);
    await expect(popups(page)).toHaveCount(0);
    await key(page, 'products').click();
    await expect(popups(page)).toHaveCount(1);
    await page.mouse.move(700, 700, { steps: 4 });
    await page.waitForTimeout(400);
    await expect(popups(page)).toHaveCount(1);
    await key(page, 'products').click();
    await expect(popups(page)).toHaveCount(0);
  });

  test('subMenuOpenDelay and subMenuCloseDelay', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300, subMenuOpenDelay: 0.6, subMenuCloseDelay: 0.6 });
    // The clock of the page is held, so the two delays are exact, whatever the speed of the engine: with real timers a slow
    // run (WebKit on a loaded machine) let more than the 0.6 s pass between the pointer leaving and the check, and the
    // popup that had to be still open was gone.
    await page.clock.install({ time: new Date('2026-01-01T00:00:00') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01'));
    await key(page, 'products').hover();
    await page.clock.runFor(500);
    await expect(popups(page)).toHaveCount(0);
    await page.clock.runFor(150);
    await expect(popups(page)).toHaveCount(1);
    await page.mouse.move(700, 700, { steps: 2 });
    await page.clock.runFor(500);
    await expect(popups(page)).toHaveCount(1);
    await page.clock.runFor(150);
    await expect(popups(page)).toHaveCount(0);
  });

  test('a click on an item of the inline menu expands the submenu with the height of its content', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 300 });
    await key(page, 'products').click();
    await expect(key(page, 'products')).toHaveAttribute('aria-expanded', 'true');
    await expect(key(page, 'p1')).toBeVisible();
    await key(page, 'products').click();
    await expect(key(page, 'p1')).toBeHidden();
  });
});

test.describe('the keyboard', () => {
  test('Tab enters the menu on the selected item, the focus ring is drawn, the arrows move, Tab leaves', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    // Tab from the start of the page: a click would move the starting point of the sequential focus, and the engines differ there.
    await page.keyboard.press('Tab');
    await expect(key(page, 'home')).toBeFocused();
    const outline = await key(page, 'home').evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThan(0);
    await page.keyboard.press('ArrowDown');
    await expect(key(page, 'products')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#before')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(key(page, 'products')).toBeFocused();
  });

  test('ArrowRight opens a popup and focuses its first item; Escape closes it and focus returns to the title', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').focus();
    await page.keyboard.press('ArrowRight');
    await expect(inPopup(page, 'p1')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(inPopup(page, 'p2')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popups(page)).toHaveCount(0);
    await expect(key(page, 'products')).toBeFocused();
  });

  test('on a bar, ArrowDown opens the popup and Left and Right move along the bar', async ({ page }) => {
    await lab(page, { mode: 'horizontal', boxWidth: 900 });
    await key(page, 'home').focus();
    await page.keyboard.press('ArrowRight');
    await expect(key(page, 'products')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(inPopup(page, 'p1')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(state(page)).toContainText('selected=p1');
    await expect(key(page, 'products')).toBeFocused();
  });

  test('an item that is hidden by a closed inline submenu cannot take focus, and an open one can', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 300 });
    await key(page, 'home').focus();
    await page.keyboard.press('ArrowDown');
    await expect(key(page, 'products')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(key(page, 'profile')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await expect(key(page, 'products')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(key(page, 'p1')).toBeFocused();
  });

  test('typeahead moves to the item that starts with the typed letter', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'home').focus();
    await page.keyboard.press('s');
    await expect(key(page, 'settings')).toBeFocused();
  });
});

test.describe('the layout rule: a change of state never moves the items', () => {
  const rows = (page: Page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('ul#menu [data-ads-key]'))
        .filter((element) => !element.closest('[data-ads-hidden]'))
        .map((element) => {
          const r = element.getBoundingClientRect();
          return [element.getAttribute('data-ads-key'), Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
        })
    );
  const listBox = async (page: Page) => rect(rootOf(page));

  for (const mode of ['vertical', 'horizontal', 'inline'] as const) {
    test(`${mode}: selecting an item, hovering and focusing move nothing (labels of different width)`, async ({ page }) => {
      await lab(page, { mode, boxWidth: mode === 'horizontal' ? 1100 : 300 });
      const before = await rows(page);
      const box = await listBox(page);
      await key(page, 'plain').click();
      await expect(key(page, 'plain')).toHaveAttribute('aria-checked', 'true');
      await settle(page);
      expect(await rows(page)).toEqual(before);
      await key(page, 'home').click();
      await key(page, 'home').hover();
      await key(page, 'home').focus();
      await settle(page);
      expect(await rows(page)).toEqual(before);
      expect(await listBox(page)).toEqual(box);
    });
  }

  test('opening a popup moves nothing in the page', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const before = await rows(page);
    const button = await rect(page.locator('#before'));
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await settle(page);
    expect((await rows(page)).filter(([name]) => name !== 'p1')).toEqual(before.filter(([name]) => !['p1', 'p2', 'p3', 'more', 'm1', 'm2'].includes(name as string)));
    expect(await rect(page.locator('#before'))).toEqual(button);
  });

  test('the theme and the page theme change colors only: the rows stay where they are', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const before = await rows(page);
    await lab(page, { theme: 'dark' });
    expect(await rows(page)).toEqual(before);
  });
});

test.describe('motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('an inline submenu grows from 0 to the height of its list, frame by frame, and is out of reach when closed', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 300 });
    const heights = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const title = document.querySelector<HTMLElement>('[data-ads-key=products]')!;
          const wrap = title.parentElement!.querySelector<HTMLElement>('.ads-menu-sub-wrap')!;
          const seen: number[] = [wrap.getBoundingClientRect().height];
          title.click();
          const start = performance.now();
          const tick = () => {
            seen.push(wrap.getBoundingClientRect().height);
            if (performance.now() - start < 700) requestAnimationFrame(tick);
            else resolve(seen);
          };
          requestAnimationFrame(tick);
        })
    );
    expect(heights[0]).toBe(0);
    const final = heights.at(-1)!;
    expect(final).toBeGreaterThan(100);
    expect(heights.some((height) => height > 0 && height < final - 1)).toBe(true);
    for (let at = 1; at < heights.length; at++) expect(heights[at]).toBeGreaterThanOrEqual(heights[at - 1] - 0.5);
    await key(page, 'products').click();
    await expect(key(page, 'p1')).toBeHidden();
    await key(page, 'p1').evaluate((element) => (element as HTMLElement).focus());
    await expect(key(page, 'p1')).not.toBeFocused();
  });

  test('collapsing: the icons never jump back, the width reaches 80, and no tip shows until it has settled', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 256 });
    const frames = await page.evaluate(
      () =>
        new Promise<Array<{ width: number; icon: number }>>((resolve) => {
          const lab = (window as unknown as { __menuLab: { set(p: unknown): void } }).__menuLab;
          const list = document.querySelector<HTMLElement>('ul#menu')!;
          const icon = document.querySelector<HTMLElement>('[data-ads-key=home] .ads-menu-item-icon')!;
          // The first sample is taken before the change, so it is the width the transition starts from.
          const seen: Array<{ width: number; icon: number }> = [{ width: list.getBoundingClientRect().width, icon: icon.getBoundingClientRect().x }];
          const start = performance.now();
          lab.set({ collapsed: true });
          const tick = () => {
            seen.push({ width: list.getBoundingClientRect().width, icon: icon.getBoundingClientRect().x });
            if (performance.now() - start < 900) requestAnimationFrame(tick);
            else resolve(seen);
          };
          requestAnimationFrame(tick);
        })
    );
    expect(frames[0].width).toBeGreaterThan(200);
    near(frames.at(-1)!.width, 80, 0.5);
    for (let at = 1; at < frames.length; at++) expect(frames[at].width).toBeLessThanOrEqual(frames[at - 1].width + 0.5);
    const settled = frames.at(-1)!.icon;
    let reached = false;
    for (const frame of frames) {
      if (Math.abs(frame.icon - settled) < 0.5) reached = true;
      else expect(reached, 'the icon went back after reaching its place').toBe(false);
    }
    await page.waitForTimeout(500);
    await key(page, 'home').hover();
    await expect(page.locator('.ads-menu-tip:visible')).toHaveText('Home');
  });

  test('a tip that has not settled is not shown: the pointer on an item while the menu collapses shows nothing, and the tip comes back when it has settled', async ({ page }) => {
    await lab(page, { mode: 'inline', boxWidth: 256 });
    // The clock of the page is held, so the time the tips wait is exact, whatever the speed of the engine.
    await page.clock.install({ time: new Date('2026-01-01T00:00:00') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01'));
    await page.evaluate(() => (window as unknown as { __menuLab: { set(p: unknown): void } }).__menuLab.set({ collapsed: true }));
    await page.mouse.move(30, 60);
    await page.clock.runFor(200);
    await expect(page.locator('.ads-menu-tip:visible')).toHaveCount(0);
    await page.clock.runFor(300);
    await page.mouse.move(400, 400);
    await page.mouse.move(30, 60);
    await page.clock.runFor(150);
    await expect(page.locator('.ads-menu-tip:visible')).toHaveText('Home');
  });
});

test.describe('right-to-left', () => {
  test('a popup opens to the left of its title, and the arrow keys are swapped', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300, rtl: true });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    await settle(page);
    const title = await rect(key(page, 'products'));
    const list = await rect(popups(page).first());
    expect(list.x + list.width).toBeLessThanOrEqual(title.x + 1);
    await page.mouse.move(900, 700, { steps: 4 });
    await expect(popups(page)).toHaveCount(0);
    await key(page, 'products').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(inPopup(page, 'p1')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(popups(page)).toHaveCount(0);
  });
});

test.describe('a touch screen', () => {
  test.use({ hasTouch: true });

  test('a tap on a title opens its popup, a tap on an item selects it and closes the popup, a tap outside closes a popup', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const title = await rect(key(page, 'products'));
    await page.touchscreen.tap(title.x + title.width / 2, title.y + title.height / 2);
    await expect(popups(page)).toHaveCount(1);
    await page.waitForTimeout(400);
    await expect(popups(page)).toHaveCount(1);
    const item = await rect(inPopup(page, 'p1'));
    await page.touchscreen.tap(item.x + item.width / 2, item.y + item.height / 2);
    await expect(state(page)).toContainText('selected=p1');
    await expect(popups(page)).toHaveCount(0);
    await page.touchscreen.tap(title.x + title.width / 2, title.y + title.height / 2);
    await expect(popups(page)).toHaveCount(1);
    await page.touchscreen.tap(900, 700);
    await expect(popups(page)).toHaveCount(0);
  });
});

test.describe('forced colors (Windows High Contrast)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    // If an engine ignored the emulation, every test below would pass for the wrong reason.
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  });

  const computed = (locator: Locator, property: string) => locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

  test('the selected item has a bar at its start in a system color, the others have none, and choosing an item moves no text', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(await computed(key(page, 'home'), 'border-inline-start-width')).toBe('3px');
    expect(await computed(key(page, 'home'), 'border-inline-start-color')).not.toBe(canvas);
    expect(await computed(key(page, 'plain'), 'border-inline-start-width')).toBe('3px');
    expect(await computed(key(page, 'plain'), 'border-inline-start-color')).not.toBe(await computed(key(page, 'home'), 'border-inline-start-color'));
    const before = await rect(key(page, 'plain').locator('.ads-menu-item-content'));
    const unselected = await computed(key(page, 'plain'), 'border-inline-start-color');
    await key(page, 'plain').click();
    await expect(key(page, 'plain')).toHaveAttribute('aria-checked', 'true');
    expect(await computed(key(page, 'plain'), 'border-inline-start-color')).not.toBe(unselected);
    expect(await rect(key(page, 'plain').locator('.ads-menu-item-content'))).toEqual(before);
  });

  test('an item of a group has the same start as without the forced colors, and choosing it moves no text', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    const list = await rect(rootOf(page));
    const start = (locator: Locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return element.getBoundingClientRect().left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
      });
    near((await start(key(page, 'profile'))) - list.x, 32, 0.5);
    const before = await rect(key(page, 'profile').locator('.ads-menu-item-content'));
    await key(page, 'profile').click();
    await expect(key(page, 'profile')).toHaveAttribute('aria-checked', 'true');
    expect(await rect(key(page, 'profile').locator('.ads-menu-item-content'))).toEqual(before);
    near((await start(key(page, 'profile'))) - list.x, 32, 0.5);
  });

  test('a popup has a border, and the selected item of a bar has its line in a system color', async ({ page }) => {
    await lab(page, { mode: 'vertical', boxWidth: 300 });
    await key(page, 'products').hover();
    await expect(popups(page)).toHaveCount(1);
    expect(await computed(popups(page).first(), 'border-top-width')).toBe('1px');
    await lab(page, { mode: 'horizontal', boxWidth: 900 });
    const line = await key(page, 'home').evaluate((element) => getComputedStyle(element, '::after').backgroundColor);
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(line).not.toBe(canvas);
  });
});
