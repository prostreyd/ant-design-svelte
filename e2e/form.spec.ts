import { expect, test, type Locator, type Page } from '@playwright/test';

// The Form in a real browser (specs/form.md): geometry, focus, generated content. jsdom has no layout, so the rules
// that depend on it are here: tests/Form.test.ts and tests/FormItem.test.ts hold the props, the state and the ARIA wiring.
// Heights, positions and generated content do not animate, so a rect read once is final; the colour of a message does
// (a fade of 0.1 s), so it is read with `toHaveCSS`, which retries.

test.beforeEach(async ({ page }) => {
  await page.goto('/#form');
  await expect(page.getByTestId('lab-basic')).toBeVisible();
});

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('the element has no box');
  return rect;
}

const item = (page: Page, name: string) => page.getByTestId(`item-${name}`);

/** The box of an input (its border), not the native element inside it, which sits inside the padding. */
const field = (page: Page, testId: string) => page.getByTestId(testId).locator('xpath=ancestor::*[contains(@class,"ads-input")][1]');

async function validateCheck(page: Page) {
  await page.getByTestId('validate-check').click();
  await expect(page.getByTestId('item-check').locator('.ads-form-item-help-item')).toBeVisible();
}

test.describe('VAL-9: the layout does not move when a message comes and goes', () => {
  test('one line of message changes neither the item nor the position of the items around it', async ({ page }) => {
    const before = { user: await box(item(page, 'user')), check: await box(item(page, 'check')), last: await box(item(page, 'last')) };
    await validateCheck(page);
    const after = { user: await box(item(page, 'user')), check: await box(item(page, 'check')), last: await box(item(page, 'last')) };
    expect(after.user).toEqual(before.user);
    expect(after.check.height).toBe(before.check.height);
    expect(after.last.y).toBe(before.last.y);
  });

  test('frame by frame, while the message appears, the next item stays where it is', async ({ page }) => {
    const baseline = (await box(item(page, 'last'))).y;
    await page.evaluate(() => {
      const target = document.querySelector('[data-testid="item-last"]')!;
      const samples: number[] = [];
      (window as unknown as { __samples: number[] }).__samples = samples;
      const start = performance.now();
      const tick = () => {
        samples.push(target.getBoundingClientRect().y);
        if (performance.now() - start < 700) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByTestId('validate-check').click();
    await page.waitForTimeout(800);
    const samples = await page.evaluate(() => (window as unknown as { __samples: number[] }).__samples);
    expect(samples.length).toBeGreaterThan(10);
    expect(Math.max(...samples.map((y) => Math.abs(y - baseline)))).toBeLessThanOrEqual(0.5);
    await expect(item(page, 'check').locator('.ads-form-item-help-item')).toBeVisible();
  });

  test('a message of two lines pushes the next item down by the extra line only, and it comes back', async ({ page }) => {
    const baseline = (await box(item(page, 'last'))).y;
    await page.getByTestId('long-message').click();
    await validateCheck(page);
    const lines = await item(page, 'check').locator('.ads-form-item-help-item').evaluate((element) => {
      const line = parseFloat(getComputedStyle(element).lineHeight);
      return Math.round(element.getBoundingClientRect().height / line);
    });
    expect(lines).toBeGreaterThanOrEqual(2);
    const pushed = (await box(item(page, 'last'))).y - baseline;
    // the first line lives in the margin of the item, so the growth is the lines after the first (and the 2px of min-height)
    expect(pushed).toBeGreaterThan(15);
    expect(pushed).toBeLessThan(lines * 22);
    expect((await box(item(page, 'user'))).y).toBeLessThan(baseline);
    await page.getByTestId('reset').click();
    await expect(item(page, 'check').locator('.ads-form-item-help-item')).toHaveCount(0);
    expect((await box(item(page, 'last'))).y).toBe(baseline);
  });

  test('the message sits under the control, in its column', async ({ page }) => {
    await validateCheck(page);
    const input = await box(field(page, 'input-check'));
    const message = await box(item(page, 'check').locator('.ads-form-item-help-item'));
    expect(message.y).toBeGreaterThanOrEqual(input.y + input.height - 1);
    expect(Math.abs(message.x - input.x)).toBeLessThanOrEqual(1);
  });
});

test.describe('layout', () => {
  test('wide screen: the label is left of the control, on one line', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    const label = await box(item(page, 'user').locator('label'));
    const input = await box(field(page, 'input-user'));
    expect(label.x + label.width).toBeLessThanOrEqual(input.x + 1);
    expect(Math.abs(label.y + label.height / 2 - (input.y + input.height / 2))).toBeLessThanOrEqual(2);
  });

  test('up to 575 px the label stacks above the control, from 576 px it does not', async ({ page }) => {
    await page.setViewportSize({ width: 575, height: 800 });
    const narrowLabel = await box(item(page, 'user').locator('label'));
    const narrowInput = await box(field(page, 'input-user'));
    expect(narrowLabel.y + narrowLabel.height).toBeLessThanOrEqual(narrowInput.y + 1);
    expect(Math.abs(narrowLabel.x - narrowInput.x)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 576, height: 800 });
    const label = await box(item(page, 'user').locator('label'));
    const input = await box(field(page, 'input-user'));
    expect(label.x + label.width).toBeLessThanOrEqual(input.x + 1);
  });

  test('on a narrow screen the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('vertical layout: the label is above the control and starts where it starts', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    const label = await box(page.getByTestId('v-item-a').locator('label'));
    const input = await box(field(page, 'v-input-a'));
    expect(label.y + label.height).toBeLessThanOrEqual(input.y);
    expect(Math.abs(label.x - input.x)).toBeLessThanOrEqual(1);
    const a = await box(page.getByTestId('v-item-a'));
    const b = await box(page.getByTestId('v-item-b'));
    expect(b.y).toBeGreaterThan(a.y + a.height);
  });

  test('inline layout: the items stand in one line', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    const a = await box(page.getByTestId('i-item-a'));
    const b = await box(page.getByTestId('i-item-b'));
    expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width);
    const label = page.getByTestId('i-item-a').locator('label');
    const labelBox = await box(label);
    const input = await box(field(page, 'i-input-a'));
    expect(input.x).toBeGreaterThanOrEqual(labelBox.x + labelBox.width - 1);
    // the room after the text (the part of the label a colon would take) is there without a colon
    const room = await label.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return element.getBoundingClientRect().width - range.getBoundingClientRect().width;
    });
    expect(room).toBeGreaterThanOrEqual(8);
  });

  test('right to left: the label is on the right of the control', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    const label = await box(page.getByTestId('r-item-a').locator('label'));
    const input = await box(field(page, 'r-input-a'));
    expect(label.x).toBeGreaterThanOrEqual(input.x + input.width - 1);
  });

  test('the error message of a right-to-left form is under the control and starts at its right edge', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.getByTestId('r-input-a').fill('x');
    await page.getByTestId('r-input-a').fill('');
    const message = page.getByTestId('r-item-a').locator('.ads-form-item-help-item');
    await expect(message).toBeVisible();
    const input = await box(field(page, 'r-input-a'));
    const text = await box(message);
    expect(text.y).toBeGreaterThanOrEqual(input.y + input.height - 1);
    expect(Math.abs(text.x + text.width - (input.x + input.width))).toBeLessThanOrEqual(1);
  });
});

test.describe('a failed submit', () => {
  test('moves focus to the first invalid control far down the page and brings it into view', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    const submit = page.getByTestId('tall-submit');
    await submit.scrollIntoViewIfNeeded();
    await submit.click();
    const target = page.getByTestId('tall-input-38');
    await expect(target).toBeFocused();
    const rect = await box(target);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(700);
    await expect(page.getByTestId('tall-item-38').locator('.ads-form-item-help-item')).toHaveText('Field 38 is required');
  });
});

test.describe('the status icons', () => {
  test('one icon per status, inside the box of the field, with a shape of its own', async ({ page }) => {
    const shapes: string[] = [];
    for (const status of ['success', 'warning', 'error', 'validating']) {
      const icon = page.getByTestId(`f-item-${status}`).locator('.ads-form-feedback');
      await expect(icon).toBeVisible();
      const frame = await box(field(page, `f-input-${status}`));
      const mark = await box(icon);
      expect(mark.x).toBeGreaterThanOrEqual(frame.x);
      expect(mark.x + mark.width).toBeLessThanOrEqual(frame.x + frame.width);
      expect(mark.y).toBeGreaterThanOrEqual(frame.y);
      expect(mark.y + mark.height).toBeLessThanOrEqual(frame.y + frame.height);
      shapes.push(await icon.locator('svg').innerHTML());
    }
    expect(new Set(shapes).size).toBe(4);
  });
});

test.describe('colours and generated content', () => {
  test('the error text is the danger text colour, the warning text the warning one, a neutral hint the secondary one', async ({ page }) => {
    // the accessible tokens are loaded by the lab: the danger text is #cf1322 and the warning text #874d00
    await page.getByTestId('input-user').fill('a');
    await page.getByTestId('input-user').fill('');
    await expect(item(page, 'user').locator('.ads-form-item-help-item')).toHaveCSS('color', 'rgb(207, 19, 34)');
    await expect(page.getByTestId('f-item-warning').locator('.ads-form-item-help-item')).toHaveCSS('color', 'rgb(135, 77, 0)');
    await expect(page.getByTestId('f-item-error').locator('.ads-form-item-help-item')).toHaveCSS('color', 'rgb(207, 19, 34)');
    await expect(page.getByTestId('f-item-success').locator('.ads-form-item-help-item')).toHaveCSS('color', 'rgb(102, 102, 102)');
  });

  test('the star and the colon are aria-hidden elements, so the accessible name of the control is the text only', async ({ page }) => {
    const label = item(page, 'user').locator('label');
    await expect(label.locator('.ads-form-item-mark')).toHaveText('*');
    await expect(label.locator('.ads-form-item-mark')).toHaveAttribute('aria-hidden', 'true');
    await expect(label.locator('.ads-form-item-colon')).toHaveText(':');
    await expect(label.locator('.ads-form-item-colon')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('textbox', { name: 'Username', exact: true })).toBeVisible();
  });

  test('the star is drawn in the danger text colour', async ({ page }) => {
    await expect(item(page, 'user').locator('.ads-form-item-mark')).toHaveCSS('color', 'rgb(207, 19, 34)');
  });
});

test.describe('the tooltip of a label', () => {
  test('is reached with the keyboard and shows its text; the icon has a visible focus ring', async ({ page }) => {
    const icon = item(page, 'pass').getByRole('button', { name: 'More information' });
    await page.getByTestId('input-user').focus();
    await page.keyboard.press('Tab');
    await expect(icon).toBeFocused();
    await expect(page.getByRole('tooltip')).toContainText('Pick a strong password');
    await expect(icon).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('opens on hover', async ({ page }) => {
    await item(page, 'pass').getByRole('button', { name: 'More information' }).hover();
    await expect(page.getByRole('tooltip')).toContainText('Pick a strong password');
  });

  test('a click on the label focuses its control', async ({ page }) => {
    await item(page, 'user').locator('label').click();
    await expect(page.getByTestId('input-user')).toBeFocused();
  });
});
