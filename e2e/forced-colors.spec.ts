// Windows High Contrast and the other forced-colors modes replace the author's backgrounds and colors with the
// system's. A state that is drawn only with a background (the track and the handle of a Switch, the bar of an
// indeterminate Checkbox) then disappears. These tests switch the mode on and check that the states stay apart.
import { expect, test, type Locator, type Page } from '@playwright/test';

async function computed(locator: Locator, property: string, pseudo?: string): Promise<string> {
  return locator.evaluate((element, args) => getComputedStyle(element, args.pseudo).getPropertyValue(args.property), {
    property,
    pseudo
  });
}

const trackOf = (testId: string, page: Page) => page.getByTestId(testId);
const handleOf = (testId: string, page: Page) => page.getByTestId(testId).locator('.ads-switch-indicator');
/** The box of a checkbox: the span after its input. */
const boxOf = (testId: string, page: Page) =>
  page.getByTestId(testId).locator('xpath=following-sibling::span[contains(@class, "ads-checkbox-icon")]');

test.describe('Forced colors (Windows High Contrast)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    // If an engine ignored the emulation, every test below would pass for the wrong reason.
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  });

  /** The color the page paints behind the component, as the browser computes it in this mode. */
  const pageColor = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  test('switch: an off track is outlined and an on track is filled, so the track is visible in both states', async ({ page }) => {
    const canvas = await pageColor(page);
    const off = trackOf('sw-off', page);
    const on = trackOf('sw-on', page);
    expect(await computed(off, 'border-top-width')).toBe('1px');
    expect(await computed(off, 'border-top-color')).not.toBe(canvas);
    expect(await computed(on, 'background-color')).not.toBe(canvas);
    expect(await computed(off, 'background-color')).toBe(canvas);
  });

  test('switch: the handle differs from the track in both states', async ({ page }) => {
    for (const id of ['sw-off', 'sw-on', 'sw-small-off', 'sw-small-on']) {
      const track = await computed(trackOf(id, page), 'background-color');
      const handle = await computed(handleOf(id, page), 'background-color');
      expect(handle, id).not.toBe(track);
    }
  });

  test('switch: on and off look different', async ({ page }) => {
    const off = await computed(trackOf('sw-off', page), 'background-color');
    const on = await computed(trackOf('sw-on', page), 'background-color');
    expect(on).not.toBe(off);
    const handleOff = await computed(handleOf('sw-off', page), 'background-color');
    const handleOn = await computed(handleOf('sw-on', page), 'background-color');
    expect(handleOn).not.toBe(handleOff);
  });

  test('switch: the handle keeps the same gap to the track on every side, with the border added', async ({ page }) => {
    for (const id of ['sw-off', 'sw-on', 'sw-small-off', 'sw-small-on']) {
      const gaps = await trackOf(id, page).evaluate((track) => {
        const t = track.getBoundingClientRect();
        const h = track.querySelector('.ads-switch-indicator')!.getBoundingClientRect();
        return [h.top - t.top, t.bottom - h.bottom, h.left - t.left, t.right - h.right].map((value) => Math.round(value * 10) / 10);
      });
      // Vertical gaps are equal, and the handle sits 2px from the end it is at.
      expect(gaps[0], `${id} top and bottom`).toBe(gaps[1]);
      expect(Math.min(gaps[2], gaps[3]), `${id} end gap`).toBe(2);
    }
  });

  test('switch: the text of an on switch is opted out of the browser backplate and differs from the track', async ({ page }) => {
    // Chromium paints a page-colored backplate behind forced text; white text on it would be invisible on a filled
    // track. WebKit does not know the property (and has no backplate), so the opt-out is checked where it exists.
    const content = trackOf('sw-text-on', page).locator('.ads-switch-content');
    if (await page.evaluate(() => CSS.supports('forced-color-adjust', 'none'))) {
      expect(await computed(content, 'forced-color-adjust')).toBe('none');
    }
    const item = content.locator('.ads-switch-content-item:not(.ads-switch-content-hidden)');
    expect(await computed(item, 'color')).not.toBe(await computed(trackOf('sw-text-on', page), 'background-color'));
  });

  test('switch: a disabled switch is drawn in the disabled system color, not dimmed', async ({ page }) => {
    const enabled = await computed(trackOf('sw-off', page), 'border-top-color');
    const disabled = trackOf('sw-disabled', page);
    expect(await computed(disabled, 'border-top-color')).not.toBe(enabled);
    expect(await computed(disabled, 'opacity')).toBe('1');
    expect(await computed(trackOf('sw-loading', page), 'opacity')).toBe('1');
  });

  test('checkbox: the bar of an indeterminate box is visible against the box', async ({ page }) => {
    for (const id of ['cb-indeterminate', 'cb-indeterminate-on']) {
      const box = await computed(boxOf(id, page), 'background-color');
      const bar = await computed(boxOf(id, page), 'background-color', '::after');
      expect(bar, id).not.toBe(box);
      expect(bar, id).not.toBe('rgba(0, 0, 0, 0)');
      expect(await computed(boxOf(id, page), 'opacity', '::after'), id).toBe('1');
    }
  });

  test('checkbox: checked, indeterminate and unchecked stay different from each other', async ({ page }) => {
    // The check mark is a border, the bar a background: neither may take the color of the box behind it.
    const box = await computed(boxOf('cb-on', page), 'background-color');
    expect(await computed(boxOf('cb-on', page), 'border-right-color', '::after')).not.toBe(box);
    expect(await computed(boxOf('cb-on', page), 'opacity', '::after')).toBe('1');
    expect(await computed(boxOf('cb-off', page), 'opacity', '::after')).toBe('0');
    expect(await computed(boxOf('cb-indeterminate', page), 'background-color', '::after')).not.toBe(
      await computed(boxOf('cb-off', page), 'background-color', '::after')
    );
  });

  test('checkbox: a disabled box and its label use the disabled system color', async ({ page }) => {
    const enabledBorder = await computed(boxOf('cb-off', page), 'border-top-color');
    const disabledBorder = await computed(boxOf('cb-disabled', page), 'border-top-color');
    expect(disabledBorder).not.toBe(enabledBorder);
    const labelOf = (id: string) => page.getByTestId(id).locator('xpath=ancestor::label');
    expect(await computed(labelOf('cb-disabled'), 'color')).not.toBe(await computed(labelOf('cb-off'), 'color'));
    // A disabled indeterminate bar is still there, and it is not the enabled color.
    const bar = await computed(boxOf('cb-disabled-indeterminate', page), 'background-color', '::after');
    expect(bar).not.toBe(await computed(boxOf('cb-disabled-indeterminate', page), 'background-color'));
    expect(bar).not.toBe(await computed(boxOf('cb-indeterminate', page), 'background-color', '::after'));
  });
});

test.describe('Select in forced colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto('/#select');
    await expect(page.getByTestId('size-medium')).toBeVisible();
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  });

  const rootOf = (field: Locator) =>
    field.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ads-select ")][1]');
  const panelOf = (page: Page) => page.locator('.ads-popup:not([hidden])').last();

  test('the focused field and the open field draw an outline, because the border color is not what the system shows', async ({ page }) => {
    const field = page.getByTestId('size-medium');
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(await computed(rootOf(field), 'outline-style')).toBe('none');
    await field.focus();
    expect(await computed(rootOf(field), 'outline-style')).toBe('solid');
    expect(await computed(rootOf(field), 'outline-width')).toBe('2px');
    expect(await computed(rootOf(field), 'outline-color')).not.toBe(canvas);
  });

  test('the panel has a border; a highlighted option takes the system highlight; the selected option has a bar; a disabled option is gray', async ({ page }) => {
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByTestId('single').click();
    const panel = panelOf(page).locator('.ads-select-popup');
    expect(await computed(panel, 'border-top-width')).toBe('1px');
    expect(await computed(panel, 'border-top-color')).not.toBe(canvas);
    const options = panelOf(page).getByRole('option');
    // The first option is highlighted when the list opens.
    const active = options.nth(0);
    const plain = options.nth(1);
    expect(await computed(active, 'background-color')).not.toBe(canvas);
    expect(await computed(active, 'color')).not.toBe(await computed(plain, 'color'));
    expect(await computed(plain, 'background-color')).not.toBe(await computed(active, 'background-color'));
    expect(await computed(options.nth(3), 'color')).not.toBe(await computed(plain, 'color'));
    await page.keyboard.press('Escape');
    await page.getByTestId('set-sad').click();
    await page.getByTestId('single').click();
    const selected = panelOf(page).getByRole('option').nth(1);
    const unselected = panelOf(page).getByRole('option').nth(2);
    expect(await computed(selected, 'border-inline-start-color')).not.toBe(await computed(unselected, 'border-inline-start-color'));
    expect(await computed(selected, 'border-inline-start-width')).toBe('3px');
  });

  test('a tag is outlined, so it is a visible chip without its background', async ({ page }) => {
    const tag = rootOf(page.getByTestId('multiple')).locator('.ads-select-tag').first();
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(await computed(tag, 'border-top-width')).toBe('1px');
    expect(await computed(tag, 'border-top-color')).not.toBe(canvas);
  });
});
