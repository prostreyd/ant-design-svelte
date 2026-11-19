// The shared icons in a real browser (specs/icons.md, I4): the spinner turns, and turns slower for a user who asks for less
// motion. It runs against the Select lab (`/#select`), whose field can be put into the loading state.
import { expect, test, type Page } from '@playwright/test';

const setLoading = (page: Page) =>
  page.evaluate(() => (window as unknown as { __selectLab: { set(patch: object): void } }).__selectLab.set({ loading: true }));

test.beforeEach(async ({ page }) => {
  await page.goto('/#select');
  await page.waitForFunction(() => Boolean((window as unknown as { __selectLab?: unknown }).__selectLab));
});

test('loading: the spinner is the shared icon and turns endlessly, once a second', async ({ page }) => {
  await setLoading(page);
  const icon = page.locator('.ads-icon-loading').first();
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/ads-select-icon-loading/);
  await expect(icon).toHaveCSS('animation-duration', '1s');
  await expect(icon).toHaveCSS('animation-iteration-count', 'infinite');
  expect(await icon.evaluate((element) => getComputedStyle(element).animationName)).toContain('ads-icon-spin');
});

test('loading: it turns slower under prefers-reduced-motion (2.5 s), and still turns', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setLoading(page);
  const icon = page.locator('.ads-icon-loading').first();
  await expect(icon).toHaveCSS('animation-duration', '2.5s');
  expect(await icon.evaluate((element) => getComputedStyle(element).animationName)).not.toBe('none');
});

test('the track is faint and the arc is a thicker line, as the three old spinners drew them', async ({ page }) => {
  await setLoading(page);
  const icon = page.locator('.ads-icon-loading').first();
  await expect(icon.locator('.track')).toHaveCSS('opacity', '0.25');
  await expect(icon.locator('.arc')).toHaveCSS('stroke-width', '2px');
});
