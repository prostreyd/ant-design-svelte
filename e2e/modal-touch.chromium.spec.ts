// A finger on a Modal, which only Chromium can drive as a real touch (specs/modal.md, Quality matrix and R3, R10): a tap on the mask
// closes it, a tap inside and a swipe that ends on the mask do not, the close button is a target a finger can hit, and the page behind
// does not scroll under a swipe on the layer.
import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 700, height: 700 } });

type Lab = { set(patch: Record<string, unknown>): void; log(): string[] };
const lab = (page: Page) => ({
  set: (patch: Record<string, unknown>) => page.evaluate((p) => (window as unknown as { __modalLab: Lab }).__modalLab.set(p), patch),
  log: () => page.evaluate(() => (window as unknown as { __modalLab: Lab }).__modalLab.log())
});

test.beforeEach(async ({ page }) => {
  await page.goto('/#modal');
  await page.waitForFunction(() => Boolean((window as unknown as { __modalLab?: unknown }).__modalLab));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Basic Modal' });
const layer = (page: Page) => page.locator('.ads-modal-root').first();
const tap = async (page: Page, x: number, y: number) => page.touchscreen.tap(x, y);

test('a tap on the mask closes it, and a tap inside the dialog does not', async ({ page }) => {
  await lab(page).set({ open: true });
  await expect(dialog(page)).toBeVisible();
  const body = (await page.getByTestId('body').boundingBox())!;
  await tap(page, body.x + 10, body.y + 10);
  await expect(dialog(page)).toBeVisible();
  await tap(page, 20, 20);
  await expect(layer(page)).toBeHidden();
  expect(await lab(page).log()).toContain('cancel');
});

test('a tap on the close button closes it, and the button is a target of at least 32 px', async ({ page }) => {
  await lab(page).set({ open: true });
  const close = page.getByRole('button', { name: 'Close' });
  const box = (await close.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(32);
  expect(box.height).toBeGreaterThanOrEqual(32);
  await tap(page, box.x + box.width / 2, box.y + box.height / 2);
  await expect(layer(page)).toBeHidden();
});

test('the footer buttons are targets of at least 32 px high', async ({ page }) => {
  await lab(page).set({ open: true });
  for (const name of ['Cancel', 'OK']) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.height, name).toBeGreaterThanOrEqual(32);
  }
});

test('a swipe on the layer does not scroll the page behind it, and a swipe that ends on the mask does not close it', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 400));
  await lab(page).set({ open: true, lines: 3 });
  await expect(dialog(page)).toBeVisible();
  const client = await page.context().newCDPSession(page);
  const swipe = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let step = 1; step <= 6; step++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 6, y: from.y + ((to.y - from.y) * step) / 6 }] });
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe({ x: 60, y: 500 }, { x: 60, y: 200 });
  expect(await page.evaluate(() => window.scrollY)).toBe(400);
  const body = (await page.getByTestId('body').boundingBox())!;
  await swipe({ x: body.x + 10, y: body.y + 10 }, { x: 30, y: 30 });
  await expect(dialog(page)).toBeVisible();
  expect(await lab(page).log()).not.toContain('cancel');
});
