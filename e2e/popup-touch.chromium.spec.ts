// A real swipe of a finger, which only Chromium can drive (the DevTools protocol): the browser takes the touch for
// scrolling and cancels the pointer, an open popup must stay open and go with the page (specs/popup.md, R9 and
// decision 14). The finger is a sequence of touch events: the ready-made scroll gesture of the protocol does not
// scroll the page in this setup, and a sequence of touch events does.
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

test('a swipe of the page with a popup open: the popup stays open, the page scrolls, the popup goes with it', async ({ page }) => {
  await page.goto('/#popup');
  await page.waitForFunction(() => Boolean((window as unknown as { __popupLab?: unknown }).__popupLab));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    window.scrollTo(0, 800);
    (window as unknown as { __popupLab: { set(p: unknown): void } }).__popupLab.set({ flowOpen: true });
    const seen: string[] = [];
    (window as unknown as { __seen: string[] }).__seen = seen;
    for (const type of ['pointerdown', 'pointercancel', 'pointerup']) addEventListener(type, () => seen.push(type), { capture: true, passive: true });
  });
  await page.waitForTimeout(300);
  const frame = page.getByTestId('flow-frame');
  const gap = () => page.evaluate(() => document.querySelector('[data-testid="flow-frame"]')!.getBoundingClientRect().y - document.querySelector('[data-testid="flow-anchor"]')!.getBoundingClientRect().y);
  const before = { scroll: await page.evaluate(() => window.scrollY), gap: await gap() };

  await swipe(await page.context().newCDPSession(page), page, 900, 600, 200);

  // The browser took the touch for scrolling: it cancelled the pointer, which is what keeps the popup open.
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(['pointerdown', 'pointercancel']);
  expect(await frame.getAttribute('data-state')).toBe('open');
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before.scroll + 100);
  expect(Math.abs((await gap()) - before.gap)).toBeLessThan(1);
});

test('a Select: a swipe of the page leaves its list open and the list goes with the field', async ({ page }) => {
  await page.goto('/#select');
  await expect(page.getByTestId('single')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = page.getByTestId('single').locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ads-select ")][1]');
  await root.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 300));
  await page.touchscreen.tap(...(await root.evaluate((element) => { const r = element.getBoundingClientRect(); return [r.x + 20, r.y + r.height / 2] as [number, number]; })));
  const panel = page.locator('.ads-popup:not([hidden])');
  await expect(panel).toHaveCount(1);
  const gap = () => page.evaluate(() => {
    const list = document.querySelector('.ads-popup:not([hidden]) [role="listbox"]')!.getBoundingClientRect();
    const field = document.querySelector('[data-testid="single"]')!.closest('.ads-select')!.getBoundingClientRect();
    return list.y - (field.y + field.height);
  });
  const before = { scroll: await page.evaluate(() => window.scrollY), gap: await gap() };

  await swipe(await page.context().newCDPSession(page), page, 900, 600, 160);

  await expect(panel).toHaveCount(1);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before.scroll + 60);
  expect(Math.abs((await gap()) - before.gap)).toBeLessThan(1);
});
