import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Resolves a CSS custom property to the browser's computed value for `property`,
 * so assertions compare against the design tokens rather than hard-coded colors.
 */
async function resolveToken(page: Page, property: string, token: string): Promise<string> {
  return page.evaluate(
    ({ property, token }) => {
      const probe = document.createElement('div');
      document.body.append(probe);
      (probe.style as unknown as Record<string, string>)[property] = `var(${token})`;
      const value = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return value;
    },
    { property, token }
  );
}

async function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (element, prop) => getComputedStyle(element).getPropertyValue(prop),
    property
  );
}

const TRANSPARENT = ['rgba(0, 0, 0, 0)', 'transparent'];

test.describe('Button visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('default: hover changes the border to the primary color', async ({ page }) => {
    const button = page.getByTestId('default');
    const primary = await resolveToken(page, 'border-top-color', '--ads-color-primary');

    await expect.poll(() => computed(button, 'border-top-color')).not.toBe(primary);
    await button.hover();
    await expect.poll(() => computed(button, 'border-top-color')).toBe(primary);
  });

  test('primary: base, hover, and active backgrounds use the primary tokens', async ({
    page
  }) => {
    const button = page.getByTestId('primary');
    const base = await resolveToken(page, 'background-color', '--ads-color-primary');
    const hover = await resolveToken(page, 'background-color', '--ads-color-primary-hover');
    const active = await resolveToken(page, 'background-color', '--ads-color-primary-active');

    expect(await computed(button, 'background-color')).toBe(base);

    await button.hover();
    await expect.poll(() => computed(button, 'background-color')).toBe(hover);

    await page.mouse.down();
    await expect.poll(() => computed(button, 'background-color')).toBe(active);
    await page.mouse.up();
  });

  test('primary keeps the inverse text color in every state', async ({ page }) => {
    const button = page.getByTestId('primary');
    const inverse = await resolveToken(page, 'color', '--ads-color-text-inverse');

    expect(await computed(button, 'color')).toBe(inverse);
    await button.hover();
    expect(await computed(button, 'color')).toBe(inverse);
  });

  test('text: transparent at rest and tinted on hover', async ({ page }) => {
    const button = page.getByTestId('text');
    const hover = await resolveToken(page, 'background-color', '--ads-color-bg-text-hover');

    expect(TRANSPARENT).toContain(await computed(button, 'background-color'));
    await button.hover();
    await expect.poll(() => computed(button, 'background-color')).toBe(hover);
  });

  test('link: text color changes to the primary hover color on hover', async ({ page }) => {
    const button = page.getByTestId('link');
    const primary = await resolveToken(page, 'color', '--ads-color-primary');
    const primaryHover = await resolveToken(page, 'color', '--ads-color-primary-hover');

    expect(await computed(button, 'color')).toBe(primary);
    await button.hover();
    await expect.poll(() => computed(button, 'color')).toBe(primaryHover);
  });

  test('danger primary: danger, hover, and active backgrounds', async ({ page }) => {
    const button = page.getByTestId('danger-primary');
    const base = await resolveToken(page, 'background-color', '--ads-color-danger');
    const hover = await resolveToken(page, 'background-color', '--ads-color-danger-hover');
    const active = await resolveToken(page, 'background-color', '--ads-color-danger-active');

    expect(await computed(button, 'background-color')).toBe(base);
    await button.hover();
    await expect.poll(() => computed(button, 'background-color')).toBe(hover);
    await page.mouse.down();
    await expect.poll(() => computed(button, 'background-color')).toBe(active);
    await page.mouse.up();
  });

  test('ghost primary: transparent background with a primary border', async ({ page }) => {
    const button = page.getByTestId('ghost-primary');
    const primary = await resolveToken(page, 'border-top-color', '--ads-color-primary');

    expect(TRANSPARENT).toContain(await computed(button, 'background-color'));
    expect(await computed(button, 'border-top-color')).toBe(primary);
  });

  test('disabled: token colors, not-allowed cursor, and no hover change', async ({ page }) => {
    const button = page.getByTestId('disabled');
    const background = await resolveToken(page, 'background-color', '--ads-color-bg-container-disabled');
    const color = await resolveToken(page, 'color', '--ads-color-text-disabled');

    expect(await computed(button, 'background-color')).toBe(background);
    expect(await computed(button, 'color')).toBe(color);
    expect(await computed(button, 'cursor')).toBe('not-allowed');

    await button.hover();
    expect(await computed(button, 'background-color')).toBe(background);
  });

  test('loading: spinner is animated and the button shows the not-allowed cursor', async ({
    page
  }) => {
    const button = page.getByTestId('loading');
    const spinner = button.locator('.ads-btn-loading-icon');

    await expect(spinner).toBeVisible();
    // Svelte scopes keyframe names with a hash, so match the suffix.
    expect(await computed(spinner, 'animation-name')).toMatch(/ads-btn-spin$/);
    expect(await computed(button, 'cursor')).toBe('not-allowed');

    const first = await computed(spinner, 'transform');
    await expect.poll(() => computed(spinner, 'transform')).not.toBe(first);
  });

  test('focus ring appears for keyboard focus and not for mouse focus', async ({ page }) => {
    const outlineColor = await resolveToken(page, 'outline-color', '--ads-color-focus-outline');

    // Keyboard focus: the first Tab stop is the default button.
    const keyboardTarget = page.getByTestId('default');
    await page.keyboard.press('Tab');
    await expect(keyboardTarget).toBeFocused();
    expect(await computed(keyboardTarget, 'outline-style')).toBe('solid');
    expect(await computed(keyboardTarget, 'outline-color')).toBe(outlineColor);

    // Mouse focus: clicking a different button must not show the focus ring.
    const mouseTarget = page.getByTestId('primary');
    await mouseTarget.click();
    await expect(mouseTarget).toBeFocused();
    expect(await computed(mouseTarget, 'outline-style')).toBe('none');
  });

  test('size tokens set the heights of small, default, and large buttons', async ({ page }) => {
    const small = await resolveToken(page, 'height', '--ads-control-height-sm');
    const medium = await resolveToken(page, 'height', '--ads-control-height');
    const large = await resolveToken(page, 'height', '--ads-control-height-lg');

    expect(await computed(page.getByTestId('small'), 'height')).toBe(small);
    expect(await computed(page.getByTestId('default'), 'height')).toBe(medium);
    expect(await computed(page.getByTestId('large'), 'height')).toBe(large);
  });

  test('block stretches to the full width of its container', async ({ page }) => {
    const block = page.getByTestId('block');
    // Content width of the parent: its clientWidth minus horizontal padding.
    const contentWidth = await block.evaluate((element) => {
      const parent = element.parentElement;
      if (!parent) return 0;
      const style = getComputedStyle(parent);
      return (
        parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      );
    });
    const width = await block.evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBe(contentWidth);
  });

  test('circle is square and fully rounded; round uses a pill radius', async ({ page }) => {
    const circle = page.getByTestId('circle');
    const circleBox = await circle.boundingBox();
    expect(circleBox?.width).toBe(circleBox?.height);
    expect(await computed(circle, 'border-radius')).toBe('50%');

    const round = page.getByTestId('round');
    const roundBox = await round.boundingBox();
    expect(parseFloat(await computed(round, 'border-radius'))).toBe(roundBox?.height);
  });

  test('labels do not wrap', async ({ page }) => {
    expect(await computed(page.getByTestId('primary'), 'white-space')).toBe('nowrap');
  });
});

test.describe('Button interaction in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('an enabled button counts clicks, mouse and keyboard', async ({ page }) => {
    const count = page.getByTestId('clicks');
    await expect(count).toHaveText('0');

    await page.getByTestId('primary').click();
    await expect(count).toHaveText('1');

    await page.getByTestId('primary').focus();
    await page.keyboard.press('Enter');
    await expect(count).toHaveText('2');

    await page.keyboard.press('Space');
    await expect(count).toHaveText('3');
  });

  test('a disabled button does not count clicks', async ({ page }) => {
    await page.getByTestId('disabled').click({ force: true });
    await expect(page.getByTestId('clicks')).toHaveText('0');
  });

  test('a loading button does not count clicks', async ({ page }) => {
    await page.getByTestId('loading').click({ force: true });
    await expect(page.getByTestId('clicks')).toHaveText('0');
  });

  test('an enabled anchor navigates; a disabled anchor does not', async ({ page }) => {
    await page.getByTestId('anchor-disabled').click({ force: true });
    expect(new URL(page.url()).hash).toBe('');

    await page.getByTestId('anchor').click();
    expect(new URL(page.url()).hash).toBe('#anchor-target');
  });
});
