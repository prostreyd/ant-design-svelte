// A finger on a page with notifications, which only Chromium can drive as a real touch (specs/notification.md, A11y and P8): a tap
// on the box is a click, a tap does not hold the timer (the hover a tap leaves behind would never end) and does not open a pile, and
// a tap on the close button closes the notification.
import { expect, test, type Page } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 700, height: 700 } });

type Lab = { notification: Record<string, (...args: unknown[]) => unknown> };

const call = (page: Page, method: string, ...args: unknown[]) =>
  page.evaluate(([name, list]) => void (window as unknown as { __notificationLab: Lab }).__notificationLab.notification[name as string](...(list as unknown[])), [method, args]);

test.beforeEach(async ({ page }) => {
  await page.goto('/#notification');
  await page.waitForFunction(() => Boolean((window as unknown as { __notificationLab?: unknown }).__notificationLab));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const boxes = (page: Page) => page.locator('.ads-notification');

test('a tap on the box calls onclick and does not hold the timer: the notification still goes after its time', async ({ page }) => {
  await page.evaluate(() => {
    const lab = (window as unknown as { __notificationLab: Lab }).__notificationLab;
    (window as unknown as { tapped: number }).tapped = 0;
    lab.notification.info({ title: 'x', duration: 1, onclick: () => ((window as unknown as { tapped: number }).tapped += 1) });
  });
  const box = (await boxes(page).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  expect(await page.evaluate(() => (window as unknown as { tapped: number }).tapped)).toBe(1);
  await expect(boxes(page)).toHaveCount(0, { timeout: 3500 });
});

test('a tap on the close button closes the notification, and the button is at least 24 px square (WCAG 2.5.8)', async ({ page }) => {
  await call(page, 'info', { title: 'x', duration: 0 });
  const button = (await page.locator('.ads-notification-close').boundingBox())!;
  expect(button.width).toBeGreaterThanOrEqual(24);
  expect(button.height).toBeGreaterThanOrEqual(24);
  await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
  await expect(boxes(page)).toHaveCount(0);
});

test('a tap on a pile does not open it', async ({ page }) => {
  for (let index = 1; index <= 5; index++) await call(page, 'info', { title: `m${index}`, duration: 0 });
  const box = (await boxes(page).first().boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await expect(page.locator('.ads-notification-piled')).toHaveCount(1);
});
