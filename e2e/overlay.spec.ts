// The overlay primitives in a real browser (specs/overlay.md): what jsdom cannot show, the scrollbar, the focus ring of the
// page, `inert`, and real key presses. It runs against the lab at `/#overlay` (e2e/fixtures/OverlayLab.svelte).
import { expect, test, type Page } from '@playwright/test';

type Lab = {
  open(id: 'a' | 'b'): void;
  close(id: 'a' | 'b'): void;
  dismissed(): string[];
  clicks(): number;
};


// The lock has a scrollbar to compensate for only where the page has one. Playwright hides the scrollbars of a headless Chromium
// (`--hide-scrollbars`, ignored here), and a headless Firefox draws none that takes room whatever its preferences say, so there
// this test takes the 0 px branch: nothing moves and no padding is added (the report says which branch ran: the `scrollbar`
// annotation). In a headed Firefox the preference below gives a classic scrollbar, and the same test then measures the
// compensation: on 2026-11-18, Firefox 159 under `xvfb-run -a npx playwright test e2e/overlay.spec.ts --project=firefox
// --headed`: 12 px, padding 12 px, no shift (without the padding the page widens by 12 px). Chromium and WebKit measure it in
// the normal run (15 px), and its arithmetic is in tests/overlayScrollLock.test.ts.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'], firefoxUserPrefs: { 'widget.gtk.overlay-scrollbars.enabled': false } } });

test.beforeEach(async ({ page }) => {
  await page.goto('/#overlay');
  await page.waitForFunction(() => Boolean((window as unknown as { __overlayLab?: unknown }).__overlayLab));
  // No animation: the Select list is final right after it opens.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const call = (page: Page, method: 'open' | 'close', id: 'a' | 'b') =>
  page.evaluate(([name, layer]) => (window as unknown as { __overlayLab: Record<string, (id: string) => void> }).__overlayLab[name](layer), [method, id]);
const dismissed = (page: Page) => page.evaluate(() => (window as unknown as { __overlayLab: Lab }).__overlayLab.dismissed());
const clicks = (page: Page) => page.evaluate(() => (window as unknown as { __overlayLab: Lab }).__overlayLab.clicks());
const focusedTestId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? '');
const marker = (page: Page) =>
  page.getByTestId('marker').evaluate((element) => {
    const { x, width } = element.getBoundingClientRect();
    return { x, width };
  });
const bodyStyle = (page: Page) => page.evaluate(() => ({ overflow: document.body.style.overflow, padding: document.body.style.paddingInlineEnd }));

async function openA(page: Page): Promise<void> {
  await page.getByTestId('open-a').click();
  await expect(page.getByTestId('box-a')).toBeVisible();
}

const scrollbar = (page: Page) => page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);

test.describe('scroll lock (O1)', () => {
  test('the page does not move sideways while the layer is open, nor when it closes', async ({ page }) => {
    const bar = await scrollbar(page);
    // Shown in the report: whether this engine had a scrollbar to compensate for, or the 0 px branch ran.
    test.info().annotations.push({ type: 'scrollbar', description: `${bar}px` });
    const before = await marker(page);
    await openA(page);
    const locked = await bodyStyle(page);
    expect(locked.overflow).toBe('hidden');
    // The width of the scrollbar that went away is added as padding; with an overlay scrollbar there was none to add.
    if (bar > 0) expect(Math.abs(parseFloat(locked.padding) - bar)).toBeLessThanOrEqual(0.5);
    else expect(locked.padding).toBe('');
    expect(await scrollbar(page)).toBe(0);
    const during = await marker(page);
    expect(Math.abs(during.x - before.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(during.width - before.width)).toBeLessThanOrEqual(0.5);
    await call(page, 'close', 'a');
    await expect(page.getByTestId('box-a')).toHaveCount(0);
    expect(await bodyStyle(page)).toEqual({ overflow: '', padding: '' });
    expect(await scrollbar(page)).toBe(bar);
    const after = await marker(page);
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(0.5);
  });

  test('the page does not scroll under the layer, and keeps its place', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 600));
    // Not a click on the button: Playwright would scroll the page back up to it.
    await call(page, 'open', 'a');
    await expect(page.getByTestId('box-a')).toBeVisible();
    await page.mouse.move(10, 10);
    await page.mouse.wheel(0, 400);
    await page.keyboard.press('PageDown');
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
    await call(page, 'close', 'a');
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
  });

  test('two layers lock once: the page is let go when the last one closes', async ({ page }) => {
    await openA(page);
    await page.getByTestId('open-b').click();
    await expect(page.getByTestId('box-b')).toBeVisible();
    await call(page, 'close', 'b');
    expect((await bodyStyle(page)).overflow).toBe('hidden');
    await call(page, 'close', 'a');
    expect(await bodyStyle(page)).toEqual({ overflow: '', padding: '' });
  });
});

test.describe('the page behind the layer (O2)', () => {
  test('cannot take focus, and the layer can', async ({ page }) => {
    await openA(page);
    await page.getByTestId('page-button').evaluate((button) => (button as HTMLElement).focus());
    expect(await focusedTestId(page)).not.toBe('page-button');
    await page.getByTestId('first-a').focus();
    expect(await focusedTestId(page)).toBe('first-a');
  });

  test('a press on the mask reaches the mask and not the page', async ({ page }) => {
    await openA(page);
    const point = await page.getByTestId('page-button').evaluate((button) => {
      const { x, y, width, height } = button.getBoundingClientRect();
      return { x: x + width / 2, y: y + height / 2 };
    });
    await page.mouse.click(point.x, point.y);
    expect(await clicks(page)).toBe(0);
    expect(await dismissed(page)).toEqual(['a']);
  });

  test('the layer is not inert, nor is the mask', async ({ page }) => {
    await openA(page);
    for (const id of ['layer-a', 'mask-a', 'box-a']) {
      expect(await page.getByTestId(id).evaluate((element) => Boolean(element.closest('[inert]')))).toBe(false);
    }
    expect(await page.getByTestId('page').evaluate((element) => Boolean(element.closest('[inert]')))).toBe(true);
  });

  test('a list that opens from inside the layer is reachable: an option can be picked', async ({ page }) => {
    await openA(page);
    await page.getByRole('combobox', { name: 'Choice' }).click();
    await page.getByRole('option', { name: 'three' }).click();
    await expect(page.getByTestId('choice')).toHaveText('three');
    await expect(page.getByTestId('box-a')).toBeVisible();
  });

  test('closing the layer gives the page back', async ({ page }) => {
    await openA(page);
    await call(page, 'close', 'a');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    await page.getByTestId('page-button').click();
    expect(await clicks(page)).toBe(1);
  });
});

test.describe('focus (O3)', () => {
  test('moves into the layer when it opens, to the box', async ({ page }) => {
    await openA(page);
    expect(await focusedTestId(page)).toBe('box-a');
  });

  test('Tab on the last element goes to the first, Shift+Tab on the first goes to the last', async ({ page }) => {
    await openA(page);
    await page.getByTestId('last-a').focus();
    await page.keyboard.press('Tab');
    expect(await focusedTestId(page)).toBe('first-a');
    await page.keyboard.press('Shift+Tab');
    expect(await focusedTestId(page)).toBe('last-a');
  });

  test('Tab walks the layer in order and never reaches the page', async ({ page }) => {
    await openA(page);
    const seen: string[] = [];
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName ?? ''));
    }
    expect(seen).toContain('first-a');
    expect(seen).toContain('last-a');
    expect(seen).not.toContain('page-button');
    expect(seen).not.toContain('open-a');
  });

  test('a Tab after a press on the mask goes into the layer', async ({ page }) => {
    await openA(page);
    // A press inside the box on nothing focusable leaves focus on the box or the body; blur makes it the body.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-testid="box-a"]')))).toBe(true);
  });

  test('opened from the keyboard, it gives focus back to the button when it closes', async ({ page }) => {
    await page.getByTestId('open-a').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('box-a')).toBeVisible();
    expect(await focusedTestId(page)).toBe('box-a');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    expect(await focusedTestId(page)).toBe('open-a');
  });
});

test.describe('quick toggling (O5, F2 of the Modal)', () => {
  test('open, close and open again quickly leaves the page free after the last close, and the layer still works', async ({ page }) => {
    await page.evaluate(async () => {
      const lab = (window as unknown as { __overlayLab: Lab }).__overlayLab;
      const tick = () => new Promise((done) => setTimeout(done, 0));
      for (let index = 0; index < 6; index++) {
        lab.open('a');
        await tick();
        lab.close('a');
        await tick();
      }
    });
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    expect(await bodyStyle(page)).toEqual({ overflow: '', padding: '' });
    await page.getByTestId('page-button').click();
    expect(await clicks(page)).toBe(1);
    await openA(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
  });
});

test.describe('Escape and the stack (O4)', () => {
  test('Escape closes the layer', async ({ page }) => {
    await openA(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    expect(await dismissed(page)).toEqual(['a']);
  });

  test('Escape in an open Select closes the list first, and the layer on the second press', async ({ page }) => {
    await openA(page);
    await page.getByRole('combobox', { name: 'Choice' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    expect(await dismissed(page)).toEqual([]);
    await expect(page.getByTestId('box-a')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    expect(await dismissed(page)).toEqual(['a']);
  });

  test('a second layer over the first takes Escape and Tab, and the first takes them back', async ({ page }) => {
    await openA(page);
    await page.getByTestId('open-b').click();
    await expect(page.getByTestId('box-b')).toBeVisible();
    // The first layer is behind the second one now.
    expect(await page.getByTestId('layer-a').evaluate((element) => element.hasAttribute('inert'))).toBe(true);
    expect(await focusedTestId(page)).toBe('box-b');
    await page.getByTestId('last-b').focus();
    await page.keyboard.press('Tab');
    expect(await focusedTestId(page)).toBe('first-b');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-b')).toHaveCount(0);
    expect(await dismissed(page)).toEqual(['b']);
    await expect(page.getByTestId('box-a')).toBeVisible();
    expect(await page.getByTestId('layer-a').evaluate((element) => element.hasAttribute('inert'))).toBe(false);
    // Focus went back to the button of the first layer that opened the second one.
    expect(await focusedTestId(page)).toBe('open-b');
    await page.getByTestId('last-a').focus();
    await page.keyboard.press('Tab');
    expect(await focusedTestId(page)).toBe('first-a');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('layer-a')).toHaveCount(0);
    expect(await dismissed(page)).toEqual(['b', 'a']);
  });
});
