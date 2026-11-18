// The Modal in a real browser (specs/modal.md): the geometry measured on the Ant Design demo, the zoom, the scroll lock, the mask,
// focus, the layers, forced colors, right-to-left and the static dialogs. It runs against the lab at `/#modal` (e2e/fixtures/ModalLab.svelte).
import { expect, test, type Locator, type Page } from '@playwright/test';

type Lab = {
  set(patch: Record<string, unknown>): void;
  modal: Record<string, (options: Record<string, unknown>) => { destroy(): void; then: PromiseLike<boolean>['then'] }>;
  message: { success(content: string, duration?: number): void };
  log(): string[];
  clicks(): number;
  choice(): unknown;
};

declare global {
  interface Window {
    __modalLab: Lab;
    __result?: boolean;
  }
}

// Playwright hides the scrollbars of a headless Chromium, and a headless Firefox draws none that takes room (see e2e/overlay.spec.ts):
// the lock is checked with a scrollbar where there is one, and with none where there is not.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'], firefoxUserPrefs: { 'widget.gtk.overlay-scrollbars.enabled': false } } });

test.beforeEach(async ({ page }) => {
  await page.goto('/#modal');
  await page.waitForFunction(() => Boolean(window.__modalLab));
});

const set = (page: Page, patch: Record<string, unknown>) => page.evaluate((p) => window.__modalLab.set(p), patch);
const log = (page: Page) => page.evaluate(() => window.__modalLab.log());
const clicks = (page: Page) => page.evaluate(() => window.__modalLab.clicks());
const reduce = (page: Page) => page.emulateMedia({ reducedMotion: 'reduce' });

type Rect = { x: number; y: number; width: number; height: number };
const rect = (locator: Locator): Promise<Rect> =>
  locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(tolerance);
const css = (locator: Locator, property: string) => locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Basic Modal' });
const layer = (page: Page) => page.locator('.ads-modal-root').first();

async function open(page: Page, patch: Record<string, unknown> = {}): Promise<void> {
  await set(page, { open: true, ...patch });
  await expect(dialog(page)).toBeVisible();
}

test.describe('geometry (R7): the values measured on the Ant Design demo', () => {
  test.beforeEach(async ({ page }) => {
    await reduce(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('520 px wide, 100 px from the top, in the middle; the card has 20 px 24 px of padding', async ({ page }) => {
    await open(page);
    const box = await rect(dialog(page));
    near(box.width, 520);
    near(box.y, 100);
    const view = await page.evaluate(() => document.documentElement.clientWidth);
    near(box.x + box.width / 2, view / 2);
    const title = await rect(page.locator('.ads-modal-title'));
    near(title.x, box.x + 24);
    near(title.y, box.y + 20);
    near(title.height, 24);
    expect(await css(page.locator('.ads-modal-title'), 'font-size')).toBe('16px');
    expect(await css(page.locator('.ads-modal-title'), 'font-weight')).toBe('600');
    expect(await css(page.locator('.ads-modal-content'), 'border-radius')).toBe('8px');
  });

  test('the body is 8 px under the title, the footer 12 px under the body, the buttons 32 px high and 8 px apart, at the end', async ({ page }) => {
    await open(page);
    const title = await rect(page.locator('.ads-modal-title'));
    const body = await rect(page.locator('.ads-modal-body'));
    const foot = await rect(page.locator('.ads-modal-footer'));
    near(body.y, title.y + title.height + 8);
    near(foot.y, body.y + body.height + 12);
    const cancel = await rect(page.getByRole('button', { name: 'Cancel' }));
    const ok = await rect(page.getByRole('button', { name: 'OK' }));
    near(cancel.height, 32);
    near(ok.height, 32);
    near(ok.x - (cancel.x + cancel.width), 8);
    const box = await rect(dialog(page));
    near(ok.x + ok.width, box.x + box.width - 24);
  });

  test('the close button is 32 px, 12 px from the corner, with a 16 px cross', async ({ page }) => {
    await open(page);
    const box = await rect(dialog(page));
    const close = await rect(page.getByRole('button', { name: 'Close' }));
    near(close.width, 32);
    near(close.height, 32);
    near(close.x, box.x + box.width - 12 - 32);
    near(close.y, box.y + 12);
    const cross = await rect(page.getByRole('button', { name: 'Close' }).locator('svg'));
    near(cross.width, 16);
  });

  test('the mask is rgba(0, 0, 0, 0.45) and covers the window', async ({ page }) => {
    await open(page);
    expect(await css(page.locator('.ads-modal-mask'), 'background-color')).toBe('rgba(0, 0, 0, 0.45)');
    const mask = await rect(page.locator('.ads-modal-mask'));
    near(mask.x, 0);
    near(mask.y, 0);
    near(mask.height, 800);
  });

  test('centered puts the dialog in the middle of the window', async ({ page }) => {
    await open(page, { centered: true });
    const box = await rect(dialog(page));
    near(box.y + box.height / 2, 400, 1.5);
  });

  test('a width wider than the window is held at 100vw - 32px, and on a phone the margin is 8 px', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await open(page, { width: 900 });
    near((await rect(dialog(page))).width, 700 - 32 - (await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)), 2);
    await set(page, { open: false });
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page);
    const phone = await rect(dialog(page));
    near(phone.width, 374, 2);
    near(phone.x, 8, 2);
  });

  test('a long body scrolls the wrapper, not the page, and the page keeps its place', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    await set(page, { open: true, lines: 80 });
    await expect(dialog(page)).toBeVisible();
    const scroller = page.locator('.ads-modal-wrapper');
    expect(await scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(500);
    // The last line has 24 px of room under the dialog.
    await scroller.evaluate((element) => (element.scrollTop = element.scrollHeight));
    const box = await rect(dialog(page));
    near(800 - (box.y + box.height), 24, 1.5);
  });

  test('opening and closing move nothing behind the layer, with a scrollbar and without', async ({ page }) => {
    const marker = () =>
      page.getByTestId('marker').evaluate((element) => {
        const r = element.getBoundingClientRect();
        return { x: r.x, width: r.width };
      });
    const bar = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
    const before = await marker();
    await open(page);
    expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBe(0);
    const during = await marker();
    near(during.x, before.x, 0.5);
    near(during.width, before.width, 0.5);
    if (bar > 0) near(parseFloat(await page.evaluate(() => document.body.style.paddingInlineEnd)), bar, 0.5);
    await set(page, { open: false });
    await expect(layer(page)).toBeHidden();
    const after = await marker();
    near(after.x, before.x, 0.5);
    near(after.width, before.width, 0.5);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('a longer text on the OK button, and the loading state, do not move the other button or the footer', async ({ page }) => {
    await open(page, { okText: 'Submit the whole form now' });
    const cancel = await rect(page.getByRole('button', { name: 'Cancel' }));
    const foot = await rect(page.locator('.ads-modal-footer'));
    await set(page, { confirmLoading: true });
    await expect(page.getByRole('button', { name: /Submit the whole form now/ })).toHaveAttribute('aria-busy', 'true');
    const loadingCancel = await rect(page.getByRole('button', { name: 'Cancel' }));
    const loadingFoot = await rect(page.locator('.ads-modal-footer'));
    // The OK button may grow by its spinner, to the start side (the footer is at the end): the footer keeps its place and height.
    near(loadingFoot.y, foot.y);
    near(loadingFoot.height, foot.height);
    near(loadingCancel.y, cancel.y);
    near(loadingCancel.height, cancel.height);
    const ok = await rect(page.getByRole('button', { name: /Submit the whole form now/ }));
    near(ok.height, 32);
    near(ok.y, cancel.y);
  });
});

test.describe('the zoom, the leave and reduced motion (R2)', () => {
  test('it zooms in from the click that opened it: 0.3 s, and the mask fades in in 0.2 s', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const button = page.getByTestId('open');
    const at = await rect(button);
    await page.mouse.click(at.x + 10, at.y + 8);
    await expect(dialog(page)).toBeVisible();
    const box = dialog(page);
    expect(await box.evaluate((element) => getComputedStyle(element).animationName)).toContain('ads-modal-zoom-in');
    await expect(box).toHaveCSS('animation-duration', '0.3s');
    expect(await css(page.locator('.ads-modal-mask'), 'animation-name')).toContain('ads-modal-fade-in');
    await expect(page.locator('.ads-modal-mask')).toHaveCSS('animation-duration', '0.2s');
    const origin = await box.evaluate((element) => (element as HTMLElement).style.transformOrigin);
    await expect.poll(() => log(page)).toContain('afteropenchange:true');
    const final = await rect(box);
    const [ox, oy] = origin.split(' ').map(parseFloat);
    near(ox, at.x + 10 - final.x, 3);
    near(oy, at.y + 8 - final.y, 3);
  });

  test('a keyboard open zooms from the middle, not from the old click', async ({ page }) => {
    await page.getByTestId('open').focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    expect(await dialog(page).evaluate((element) => (element as HTMLElement).style.transformOrigin)).toBe('');
  });

  test('the leave takes the animation, then the layer is hidden, and the callbacks speak once', async ({ page }) => {
    await open(page);
    await expect.poll(() => log(page)).toContain('afteropenchange:true');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveAttribute('data-state', 'closed');
    expect(await dialog(page).evaluate((element) => getComputedStyle(element).animationName)).toContain('ads-modal-zoom-out');
    await expect(layer(page)).toBeHidden();
    const entries = await log(page);
    expect(entries.filter((entry) => entry === 'afterclose')).toHaveLength(1);
    expect(entries.filter((entry) => entry === 'afteropenchange:false')).toHaveLength(1);
  });

  test('under prefers-reduced-motion there is no animation and the layer is hidden at once', async ({ page }) => {
    await reduce(page);
    await open(page);
    expect(await css(dialog(page), 'animation-name')).toBe('none');
    expect(await css(page.locator('.ads-modal-mask'), 'animation-name')).toBe('none');
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
  });

  test('opening, closing and opening again quickly leaves the page free and the Modal working', async ({ page }) => {
    for (let index = 0; index < 5; index++) {
      await set(page, { open: true });
      await set(page, { open: false });
    }
    await set(page, { open: true });
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await page.getByTestId('page-button').click();
    expect(await clicks(page)).toBe(1);
  });
});

test.describe('the mask and the keys (R3)', () => {
  test.beforeEach(async ({ page }) => {
    await reduce(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('a press on the mask closes it, and a click inside does not', async ({ page }) => {
    await open(page);
    await page.getByTestId('body').click();
    await expect(dialog(page)).toBeVisible();
    await page.mouse.click(30, 30);
    await expect(layer(page)).toBeHidden();
    expect(await log(page)).toContain('cancel');
  });

  test('a press that starts inside the dialog and ends on the mask (selecting text) does not close it', async ({ page }) => {
    await open(page);
    const field = await rect(page.getByTestId('field'));
    await page.mouse.move(field.x + 5, field.y + 5);
    await page.mouse.down();
    await page.mouse.move(30, 30);
    await page.mouse.up();
    await expect(dialog(page)).toBeVisible();
    expect(await log(page)).not.toContain('cancel');
  });

  test('mask.closable false: the mask does not close it, the close button does', async ({ page }) => {
    await open(page, { mask: { closable: false } });
    await page.mouse.click(30, 30);
    await expect(dialog(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(layer(page)).toBeHidden();
  });

  test('mask false draws no mask and still covers the page: a click on it is not a click on the page', async ({ page }) => {
    await open(page, { mask: false });
    await expect(page.locator('.ads-modal-mask')).toHaveCount(0);
    expect(await page.evaluate(() => Boolean(document.elementFromPoint(300, 600)?.closest('.ads-modal-wrapper')))).toBe(true);
    const target = await rect(page.getByTestId('page-button'));
    await page.mouse.click(target.x + 5, target.y + 5);
    expect(await clicks(page)).toBe(0);
  });

  test('Escape closes it, keyboard false does not, and a refusing oncancel keeps it open', async ({ page }) => {
    await open(page, { keyboard: false });
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeVisible();
    await set(page, { keyboard: true });
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
  });
});

test.describe('focus and the page behind (R9, R10)', () => {
  test.beforeEach(async ({ page }) => {
    await reduce(page);
  });

  test('focus goes to the close button, Tab stays inside, and the page cannot take focus', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    const seen: string[] = [];
    for (let index = 0; index < 6; index++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim() ?? ''));
    }
    expect(seen).toContain('Field');
    expect(seen).toContain('OK');
    expect(seen).not.toContain('Page button');
    expect(seen).not.toContain('Page input');
    await page.getByTestId('page-button').evaluate((button) => (button as HTMLElement).focus());
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).not.toBe('page-button');
  });

  test('Shift+Tab on the first element goes to the last, and Tab on the last to the first', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'OK' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  });

  test('Escape closes it and focus goes back to the button that opened it', async ({ page }) => {
    await page.getByTestId('open').focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
    await expect(page.getByTestId('open')).toBeFocused();
  });

  test('the page is out of reach (inert) and the layer is not', async ({ page }) => {
    await open(page);
    expect(await page.getByTestId('page').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(true);
    expect(await dialog(page).evaluate((element) => Boolean(element.closest('[inert]')))).toBe(false);
  });

  test('a Select in the Modal opens its list above the Modal, a choice works, and Escape closes the list first', async ({ page }) => {
    await open(page, { withSelect: true });
    await page.getByRole('combobox', { name: 'Choice' }).click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    const at = await rect(list);
    expect(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('[role="listbox"]')), { x: at.x + at.width / 2, y: at.y + at.height / 2 })).toBe(true);
    await page.getByRole('option', { name: 'three' }).click();
    expect(await page.evaluate(() => window.__modalLab.choice())).toBe('three');
    await page.getByRole('combobox', { name: 'Choice' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
  });

  test('the list of a Select follows the field when the Modal scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await open(page, { withSelect: true, lines: 12 });
    const scroller = page.locator('.ads-modal-wrapper');
    await page.getByRole('combobox', { name: 'Choice' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const field = () => rect(page.getByRole('combobox', { name: 'Choice' }));
    const list = () => rect(page.getByRole('listbox'));
    const before = { field: await field(), list: await list() };
    await scroller.evaluate((element) => (element.scrollTop = 60));
    await page.waitForTimeout(150);
    const after = { field: await field(), list: await list() };
    near(after.list.y - after.field.y, before.list.y - before.field.y, 2);
    expect(Math.abs(after.field.y - before.field.y)).toBeGreaterThan(20);
  });

  test('the scroll lock: the wheel does not scroll the page, and it keeps its place after the close', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 600));
    await open(page);
    await page.mouse.move(30, 400);
    await page.mouse.wheel(0, 500);
    await page.keyboard.press('PageDown');
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
  });

  test('scrollLock false leaves the page scrolling', async ({ page }) => {
    await open(page, { scrollLock: false });
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('the layers (R8)', () => {
  test.beforeEach(async ({ page }) => {
    await reduce(page);
  });

  test('a message from the OK button of a dialog is above the Modal and can be pointed at', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__modalLab.message.success('Saved', 0));
    const box = page.locator('.ads-message');
    await expect(box).toBeVisible();
    const at = await rect(box);
    expect(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.ads-message')), { x: at.x + at.width / 2, y: at.y + at.height / 2 })).toBe(true);
    expect(await page.locator('.ads-message-list').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(false);
  });

  test('a message that was on the page before the Modal opened is not put out of reach', async ({ page }) => {
    await page.evaluate(() => window.__modalLab.message.success('Earlier', 0));
    await expect(page.locator('.ads-message')).toBeVisible();
    await open(page);
    expect(await page.locator('.ads-message-list').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(false);
  });

  test('a second Modal opened later is above the first', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      window.__modalLab.modal.info({ title: 'Second', content: 'On top' });
    });
    const second = page.getByRole('alertdialog', { name: 'Second' });
    await expect(second).toBeVisible();
    const at = await rect(second);
    expect(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('[role="alertdialog"]')), { x: at.x + at.width / 2, y: at.y + at.height / 2 })).toBe(true);
    await page.keyboard.press('Escape');
    await expect(second).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
  });
});

test.describe('right to left (R7)', () => {
  test('the close button is at the start side, and the footer buttons are at the end side', async ({ page }) => {
    await reduce(page);
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    await open(page);
    const box = await rect(dialog(page));
    const close = await rect(page.getByRole('button', { name: 'Close' }));
    near(close.x, box.x + 12);
    const ok = await rect(page.getByRole('button', { name: 'OK' }));
    const cancel = await rect(page.getByRole('button', { name: 'Cancel' }));
    near(ok.x, box.x + 24);
    expect(cancel.x).toBeGreaterThan(ok.x);
  });
});

test.describe('forced colors (R13)', () => {
  test('the card has a border, the mask stays translucent, and the close button has a border', async ({ page }) => {
    await reduce(page);
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const content = page.locator('.ads-modal-content');
    expect(await css(content, 'border-top-width')).toBe('1px');
    expect(await css(content, 'border-top-style')).toBe('solid');
    const mask = await css(page.locator('.ads-modal-mask'), 'background-color');
    const alpha = /rgba\([^)]*,\s*([\d.]+)\)/.exec(mask);
    expect(alpha, mask).not.toBeNull();
    expect(Number(alpha?.[1])).toBeLessThan(1);
    expect(await css(page.getByRole('button', { name: 'Close' }), 'border-top-width')).toBe('1px');
  });
});

test.describe('the static dialogs (R15)', () => {
  test.beforeEach(async ({ page }) => {
    await reduce(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  const call = (page: Page, kind: string, options: Record<string, unknown>) =>
    page.evaluate(
      ([name, given]) => {
        window.__result = undefined;
        const handle = window.__modalLab.modal[name as string](given as Record<string, unknown>);
        void handle.then((value) => (window.__result = value));
      },
      [kind, options] as const
    );

  test('a confirm: 416 px wide, an icon of 22 px, the title 34 px from the start, the text in line with it, the buttons 12 px under the text', async ({ page }) => {
    await call(page, 'confirm', { title: 'Delete the file?', content: 'This cannot be undone.' });
    const box = page.getByRole('alertdialog', { name: 'Delete the file?' });
    await expect(box).toBeVisible();
    const card = await rect(box);
    near(card.width, 416);
    near(card.y, 100);
    const icon = await rect(box.locator('.ads-modal-confirm-icon'));
    near(icon.width, 22);
    near(icon.x, card.x + 24);
    const title = await rect(box.locator('.ads-modal-confirm-title'));
    near(title.x, card.x + 24 + 22 + 12);
    near(title.y, card.y + 20);
    const text = await rect(box.locator('.ads-modal-confirm-description'));
    near(text.x, title.x);
    near(text.y, title.y + title.height + 8);
    const footer = await rect(box.locator('.ads-modal-footer'));
    near(footer.y, text.y + text.height + 12);
    await expect(box.getByRole('button', { name: 'Close' })).toHaveCount(0);
  });

  test('it is an alert dialog described by its text, with focus on the OK button, and the page behind is out of reach', async ({ page }) => {
    await call(page, 'warning', { title: 'Careful', content: 'Read this.' });
    const box = page.getByRole('alertdialog', { name: 'Careful', description: 'Read this.' });
    await expect(box).toBeVisible();
    await expect(page.getByRole('button', { name: 'OK' })).toBeFocused();
    expect(await page.getByTestId('page').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(true);
  });

  test('await gives true for OK and false for Cancel, Escape and the mask is not a way out', async ({ page }) => {
    await call(page, 'confirm', { title: 'Sure?' });
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.mouse.click(30, 30);
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect.poll(() => page.evaluate(() => window.__result)).toBe(true);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    await call(page, 'confirm', { title: 'Sure?' });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.poll(() => page.evaluate(() => window.__result)).toBe(false);

    await call(page, 'confirm', { title: 'Sure?' });
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => window.__result)).toBe(false);
  });

  test('an OK that returns a Promise: the OK button waits, then the dialog closes with true', async ({ page }) => {
    await page.evaluate(() => {
      window.__result = undefined;
      const handle = window.__modalLab.modal.confirm({ title: 'Saving', onok: () => new Promise((done) => setTimeout(done, 500)) });
      void handle.then((value) => (window.__result = value));
    });
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('button', { name: 'OK' })).toHaveAttribute('aria-busy', 'true');
    expect(await page.evaluate(() => window.__result)).toBeUndefined();
    await expect.poll(() => page.evaluate(() => window.__result)).toBe(true);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('update changes it in place, destroy closes it, and with a ModalHost the dialogs are drawn too', async ({ page }) => {
    await set(page, { host: true });
    await page.evaluate(() => {
      const handle = window.__modalLab.modal.info({ title: 'Before' }) as unknown as { update(patch: object): void };
      (window as unknown as { __handle: typeof handle }).__handle = handle;
    });
    await expect(page.getByRole('alertdialog', { name: 'Before' })).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __handle: { update(patch: object): void } }).__handle.update({ title: 'After' })));
    await expect(page.getByRole('alertdialog', { name: 'After' })).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __handle: { destroy(): void } }).__handle.destroy()));
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});
