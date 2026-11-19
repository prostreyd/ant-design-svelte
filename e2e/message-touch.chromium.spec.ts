// A finger on a page with messages, which only Chromium can drive as a real touch (specs/message.md, A11y and P5): a tap
// on the box is a click, a tap does not hold the timer (the hover a tap leaves behind would never end) and does not open a
// pile, and a tap on the close button closes the message.
import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 700, height: 700 } });

type Lab = { message: Record<string, (...args: unknown[]) => unknown> };

const call = (page: Page, method: string, ...args: unknown[]) =>
  page.evaluate(([name, list]) => void (window as unknown as { __messageLab: Lab }).__messageLab.message[name as string](...(list as unknown[])), [method, args]);

test.beforeEach(async ({ page }) => {
  await page.goto('/#message');
  await page.waitForFunction(() => Boolean((window as unknown as { __messageLab?: unknown }).__messageLab));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const boxes = (page: Page) => page.locator('.ads-message');

test('a tap on the box calls onclick and does not hold the timer: the message still goes after its time', async ({ page }) => {
  await page.evaluate(() => {
    const lab = (window as unknown as { __messageLab: Lab }).__messageLab;
    (window as unknown as { tapped: number }).tapped = 0;
    lab.message.info({ content: 'x', duration: 1, onclick: () => ((window as unknown as { tapped: number }).tapped += 1) });
  });
  const box = (await boxes(page).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  expect(await page.evaluate(() => (window as unknown as { tapped: number }).tapped)).toBe(1);
  await expect(boxes(page)).toHaveCount(0, { timeout: 3500 });
});

test('a tap on the close button closes the message', async ({ page }) => {
  await call(page, 'info', { content: 'x', duration: 0, closable: true });
  const button = (await page.locator('.ads-message-close').boundingBox())!;
  await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
  await expect(boxes(page)).toHaveCount(0);
});

test('a tap on a pile does not open it', async ({ page }) => {
  await call(page, 'config', { stack: true });
  for (let index = 1; index <= 5; index++) await call(page, 'info', { content: `m${index}`, duration: 0 });
  const box = (await boxes(page).first().boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await expect(page.locator('.ads-message-piled')).toHaveCount(1);
});

test('the close button is at least 24 px square (WCAG 2.5.8): a thumb can hit it (the target is the button, not the cross)', async ({ page }) => {
  await call(page, 'info', { content: 'x', duration: 0, closable: true });
  const button = (await page.locator('.ads-message-close').boundingBox())!;
  expect(button.width).toBeGreaterThanOrEqual(24);
  expect(button.height).toBeGreaterThanOrEqual(24);
});
