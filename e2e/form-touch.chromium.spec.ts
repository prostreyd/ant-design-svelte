// A finger on a form: the help icon of a label opens its tooltip with a tap, and a tap on a label focuses the control.
// Only Chromium can drive a real touch (the DevTools protocol); the mouse and keyboard paths are in form.spec.ts.
import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 1000, height: 700 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/#form');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('a tap on the help icon of a label opens its tooltip', async ({ page }) => {
  const icon = page.getByTestId('item-pass').getByRole('button', { name: 'More information' });
  const rect = (await icon.boundingBox())!;
  await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await expect(page.locator('[role="tooltip"]:visible')).toContainText('Pick a strong password');
});

test('a tap on a label focuses its control', async ({ page }) => {
  const label = page.getByTestId('item-user').locator('label');
  const rect = (await label.boundingBox())!;
  await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await expect(page.getByTestId('input-user')).toBeFocused();
});

test('the help icon and the controls are big enough to touch, or have room around them', async ({ page }) => {
  const input = await page.getByTestId('input-user').locator('xpath=ancestor::*[contains(@class,"ads-input")][1]').boundingBox();
  expect(input!.height).toBeGreaterThanOrEqual(32);
  const icon = await page.getByTestId('item-pass').getByRole('button', { name: 'More information' }).boundingBox();
  // the icon is 14px; the row it sits in is 32px high, so a finger has the whole row to land on
  const row = await page.getByTestId('item-pass').locator('.ads-form-item-label-box').boundingBox();
  expect(row!.height).toBeGreaterThanOrEqual(32);
  expect(icon!.width).toBeGreaterThan(0);
});
