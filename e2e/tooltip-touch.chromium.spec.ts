// A real swipe of a finger on a page with a tooltip, which only Chromium can drive (the DevTools protocol): the browser
// takes the touch for scrolling and cancels the pointer. A tip that a tap opened stays open and goes with the page, and
// a swipe that starts on the trigger shows nothing (specs/tooltip.md, decision 4 and the popup rule of decision 14).
import { expect, test, type CDPSession, type Page } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 1000, height: 700 } });

async function swipe(cdp: CDPSession, page: Page, x: number, from: number, distance: number): Promise<void> {
  const at = (y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(from) });
  for (let step = 1; step <= 10; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(from - (distance / 10) * step) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#tooltip');
  await page.waitForFunction(() => Boolean((window as unknown as { __tooltipLab?: unknown }).__tooltipLab));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const tip = (page: Page) => page.locator('[role="tooltip"]:visible');
const gap = (page: Page) =>
  page.evaluate(() => document.querySelector('[role="tooltip"]:not([hidden])')!.getBoundingClientRect().y - document.querySelector('[data-testid="main"]')!.getBoundingClientRect().y);

test('a tip opened by a tap stays open while a swipe scrolls the page, and goes with the page', async ({ page }) => {
  const main = await page.getByTestId('main').boundingBox();
  await page.touchscreen.tap(main!.x + main!.width / 2, main!.y + main!.height / 2);
  await expect(tip(page)).toBeVisible();
  const before = { scroll: await page.evaluate(() => window.scrollY), gap: await gap(page) };

  // A short swipe: the trigger stays on the screen with room above it, so the tip does not flip to the other side.
  await swipe(await page.context().newCDPSession(page), page, 900, 600, 60);

  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before.scroll + 30);
  await expect(tip(page)).toBeVisible();
  expect(Math.abs((await gap(page)) - before.gap)).toBeLessThan(1);
});

test('a swipe that starts on the trigger scrolls the page and shows no tip', async ({ page }) => {
  const main = await page.getByTestId('main').boundingBox();
  await swipe(await page.context().newCDPSession(page), page, main!.x + main!.width / 2, main!.y + main!.height / 2, 80);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(20);
  await expect(tip(page)).toHaveCount(0);
});
