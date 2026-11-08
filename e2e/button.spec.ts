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
    const primary = await resolveToken(page, 'border-top-color', '--ads-color-primary-text-hover');

    await expect.poll(() => computed(button, 'border-top-color')).not.toBe(primary);
    await button.hover();
    await expect.poll(() => computed(button, 'border-top-color')).toBe(primary);
  });

  test('primary: base, hover, and active backgrounds use the primary tokens', async ({
    page
  }) => {
    const button = page.getByTestId('primary');
    const base = await resolveToken(page, 'background-color', '--ads-color-primary-solid');
    const hover = await resolveToken(page, 'background-color', '--ads-color-primary-solid-hover');
    const active = await resolveToken(page, 'background-color', '--ads-color-primary-solid-active');

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
    const primary = await resolveToken(page, 'color', '--ads-color-primary-text');
    const primaryHover = await resolveToken(page, 'color', '--ads-color-primary-text-hover');

    expect(await computed(button, 'color')).toBe(primary);
    await button.hover();
    await expect.poll(() => computed(button, 'color')).toBe(primaryHover);
  });

  test('danger primary: danger, hover, and active backgrounds', async ({ page }) => {
    const button = page.getByTestId('danger-primary');
    const base = await resolveToken(page, 'background-color', '--ads-color-danger-solid');
    const hover = await resolveToken(page, 'background-color', '--ads-color-danger-solid-hover');
    const active = await resolveToken(page, 'background-color', '--ads-color-danger-solid-active');

    expect(await computed(button, 'background-color')).toBe(base);
    await button.hover();
    await expect.poll(() => computed(button, 'background-color')).toBe(hover);
    await page.mouse.down();
    await expect.poll(() => computed(button, 'background-color')).toBe(active);
    await page.mouse.up();
  });

  test('ghost primary: transparent background with a primary border', async ({ page }) => {
    const button = page.getByTestId('ghost-primary');
    const primary = await resolveToken(page, 'border-top-color', '--ads-color-primary-text');

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

// ---------------------------------------------------------------------------
// Regression tests for the bugs found in review. Each one failed before the fix.
// ---------------------------------------------------------------------------

type Rgba = { r: number; g: number; b: number; a: number };

/** Contrast helpers run in the page so they use the browser's computed colours. */
async function installContrastHelpers(page: Page): Promise<void> {
  await page.evaluate(() => {
    const parse = (value: string): Rgba => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) throw new Error(`Unsupported colour: ${value}`);
      const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
      return { r: +r, g: +g, b: +b, a: +a };
    };
    const over = (top: Rgba, bottom: Rgba): Rgba => {
      const a = top.a + bottom.a * (1 - top.a);
      const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a;
      return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
    };
    const luminance = (c: Rgba) => {
      const f = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (a: Rgba, b: Rgba) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    /** Background actually seen behind the element's own surface. */
    const backdrop = (element: Element): Rgba => {
      const layers: Rgba[] = [];
      for (let node: Element | null = element.parentElement; node; node = node.parentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        layers.push(c);
        if (c.a === 1) break;
      }
      return layers.reduceRight<Rgba>((below, layer) => over(layer, below), {
        r: 255,
        g: 255,
        b: 255,
        a: 1
      });
    };
    (window as unknown as Record<string, unknown>).__contrast = (element: Element) => {
      const style = getComputedStyle(element);
      const surface = over(parse(style.backgroundColor), backdrop(element));
      const text = over(parse(style.color), surface);
      return ratio(text, surface);
    };
    (window as unknown as Record<string, unknown>).__ringContrast = (element: Element) => {
      const style = getComputedStyle(element);
      const ring = over(parse(style.outlineColor), backdrop(element));
      return ratio(ring, backdrop(element));
    };
  });
}

const MATRIX_TYPES = ['default', 'primary', 'dashed', 'text', 'link'] as const;
const MATRIX_IDS = MATRIX_TYPES.flatMap((type) =>
  ['plain', 'danger'].flatMap((danger) =>
    ['solid', 'ghost'].map((ghost) => `m-${type}-${danger}-${ghost}`)
  )
);

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Button text contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await installContrastHelpers(page);
    });

    const contrastOf = (page: Page, id: string) =>
      page
        .getByTestId(id)
        .evaluate((element) => (window as unknown as { __contrast(e: Element): number }).__contrast(element));

    test('rest: every type, danger, and ghost combination reaches 4.5:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of MATRIX_IDS) {
        const ratio = await contrastOf(page, id);
        if (ratio < 4.5) failures.push(`${id} ${ratio.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('hover: every combination reaches 4.5:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of MATRIX_IDS) {
        await page.getByTestId(id).hover();
        const ratio = await contrastOf(page, id);
        if (ratio < 4.5) failures.push(`${id} ${ratio.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('keyboard focus: every combination reaches 4.5:1 and the ring is visible', async ({
      page
    }) => {
      const failures: string[] = [];
      await page.keyboard.press('Tab');
      for (const id of MATRIX_IDS) {
        const button = page.getByTestId(id);
        await button.focus();
        const focusVisible = await button.evaluate((element) => element.matches(':focus-visible'));
        const ratio = await contrastOf(page, id);
        const ring = await button.evaluate((element) =>
          (window as unknown as { __ringContrast(e: Element): number }).__ringContrast(element)
        );
        if (!focusVisible) failures.push(`${id} not focus-visible`);
        if (ratio < 4.5) failures.push(`${id} text ${ratio.toFixed(2)}`);
        if (ring < 3) failures.push(`${id} ring ${ring.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('pressed: every combination reaches 4.5:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of MATRIX_IDS) {
        await page.getByTestId(id).hover();
        await page.mouse.down();
        const ratio = await contrastOf(page, id);
        await page.mouse.up();
        if (ratio < 4.5) failures.push(`${id} ${ratio.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });
  });
}

test.describe('Button state colours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('primary: keyboard focus keeps the inverse text on the solid fill', async ({ page }) => {
    const inverse = await resolveToken(page, 'color', '--ads-color-text-inverse');
    const fill = await resolveToken(page, 'background-color', '--ads-color-primary-solid-hover');
    const button = page.getByTestId('m-primary-plain-solid');

    await page.keyboard.press('Tab');
    await button.focus();
    expect(await computed(button, 'color')).toBe(inverse);
    expect(await computed(button, 'background-color')).toBe(fill);
  });

  test('danger default and text: hover uses the danger palette, not the primary one', async ({
    page
  }) => {
    const hover = await resolveToken(page, 'color', '--ads-color-danger-text-hover');
    const borderHover = await resolveToken(page, 'border-top-color', '--ads-color-danger-text-hover');

    for (const id of ['m-default-danger-solid', 'm-text-danger-solid', 'm-link-danger-solid']) {
      await page.getByTestId(id).hover();
      expect(await computed(page.getByTestId(id), 'color'), id).toBe(hover);
    }
    await page.getByTestId('m-default-danger-solid').hover();
    expect(await computed(page.getByTestId('m-default-danger-solid'), 'border-top-color')).toBe(
      borderHover
    );
  });

  test('ghost primary: stays transparent on hover and uses the hover foreground', async ({
    page
  }) => {
    const hoverColor = await resolveToken(page, 'color', '--ads-color-primary-text-hover');
    const button = page.getByTestId('m-primary-plain-ghost');

    await button.hover();
    expect(TRANSPARENT).toContain(await computed(button, 'background-color'));
    expect(await computed(button, 'color')).toBe(hoverColor);
    expect(await computed(button, 'border-top-color')).toBe(hoverColor);
  });

  test('ghost danger primary: uses the danger palette', async ({ page }) => {
    const danger = await resolveToken(page, 'color', '--ads-color-danger-text');
    const button = page.getByTestId('m-primary-danger-ghost');

    expect(TRANSPARENT).toContain(await computed(button, 'background-color'));
    expect(await computed(button, 'color')).toBe(danger);
    expect(await computed(button, 'border-top-color')).toBe(danger);
  });

  test('ghost default and dashed: transparent background at rest and on hover', async ({
    page
  }) => {
    for (const id of ['m-default-plain-ghost', 'm-dashed-plain-ghost']) {
      const button = page.getByTestId(id);
      expect(TRANSPARENT, id).toContain(await computed(button, 'background-color'));
      await button.hover();
      expect(TRANSPARENT, id).toContain(await computed(button, 'background-color'));
    }
  });

  test('a non-ghost default button keeps its container background', async ({ page }) => {
    const container = await resolveToken(page, 'background-color', '--ads-color-bg-container');
    expect(await computed(page.getByTestId('m-default-plain-solid'), 'background-color')).toBe(
      container
    );
  });
});

test.describe('Button focus, links, and motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loading: a focused button keeps keyboard focus when loading starts', async ({ page }) => {
    const button = page.getByTestId('load-toggle');

    await page.keyboard.press('Tab');
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BUTTON');
  });

  test('a loading button ignores repeated Enter and Space presses', async ({ page }) => {
    const button = page.getByTestId('loading');
    await button.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('clicks')).toHaveText('0');
  });

  test('disabled anchor: has no href and does not open on a middle click', async ({
    page,
    context
  }) => {
    const link = page.getByTestId('anchor-disabled');
    await expect(link).not.toHaveAttribute('href');
    await expect(link).toHaveAttribute('aria-disabled', 'true');

    const opened: string[] = [];
    context.on('page', (created) => opened.push(created.url()));
    await link.click({ button: 'middle', force: true });
    await page.waitForTimeout(300);
    expect(opened).toEqual([]);
    expect(new URL(page.url()).hash).toBe('');
  });

  test('reduced motion: colour transitions are off and the spinner is slower', async ({ page }) => {
    const button = page.getByTestId('primary');
    const spinner = page.getByTestId('loading').locator('.ads-btn-loading-icon');
    const normal = await computed(spinner, 'animation-duration');
    expect(await computed(button, 'transition-duration')).not.toBe('0s');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const slow = await resolveToken(page, 'animation-duration', '--ads-motion-duration-spinner-reduced');
    expect(await computed(button, 'transition-property')).toBe('none');
    expect(await computed(spinner, 'animation-duration')).toBe(slow);
    expect(slow).not.toBe(normal);
  });
});
