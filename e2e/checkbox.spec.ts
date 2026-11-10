import { expect, test, type Locator, type Page } from '@playwright/test';

/** Resolves a design token to the browser's computed value of `property`. */
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

async function computed(locator: Locator, property: string, pseudo?: string): Promise<string> {
  return locator.evaluate(
    (element, args) => getComputedStyle(element, args.pseudo).getPropertyValue(args.property),
    { property, pseudo }
  );
}

/** The checkbox is the input; the label is its root, the box is the span after it. */
const rootOf = (input: Locator) => input.locator('xpath=ancestor::label');
const boxOf = (input: Locator) => input.locator('xpath=following-sibling::span[contains(@class, "ads-checkbox-icon")]');

type Rgba = { r: number; g: number; b: number; a: number };
type CheckboxContrast = { border: number; mark: number | null; bar: number | null };

/** Contrast helpers run in the page, so they use the colours the browser really paints. */
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
    /** Background actually seen behind the element. */
    const backdrop = (element: Element): Rgba => {
      const layers: Rgba[] = [];
      for (let node: Element | null = element.parentElement; node; node = node.parentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        layers.push(c);
        if (c.a === 1) break;
      }
      return layers.reduceRight<Rgba>((below, layer) => over(layer, below), { r: 255, g: 255, b: 255, a: 1 });
    };
    const w = window as unknown as Record<string, unknown>;
    // The input is the checkbox; its box is the next element. The check mark is the border of ::after, the bar its background.
    w.__checkboxContrast = (input: Element): CheckboxContrast => {
      const box = input.nextElementSibling as Element;
      const page = backdrop(box);
      const style = getComputedStyle(box);
      const fill = over(parse(style.backgroundColor), page);
      const border = over(parse(style.borderTopColor), page);
      const after = getComputedStyle(box, '::after');
      const checked = (input as HTMLInputElement).checked;
      const indeterminate = (input as HTMLInputElement).indeterminate;
      return {
        border: ratio(border, page),
        mark: checked && !indeterminate ? ratio(over(parse(after.borderRightColor), fill), fill) : null,
        bar: indeterminate ? ratio(over(parse(after.backgroundColor), fill), fill) : null
      };
    };
    w.__ringContrast = (box: Element) => {
      const page = backdrop(box);
      const ring = over(parse(getComputedStyle(box).outlineColor), page);
      return ratio(ring, page);
    };
  });
}

const contrastOf = (locator: Locator) =>
  locator.evaluate(
    (element) => (window as unknown as { __checkboxContrast(e: Element): CheckboxContrast }).__checkboxContrast(element)
  );

const MATRIX_IDS = ['cb-off', 'cb-on', 'cb-indeterminate', 'cb-indeterminate-on', 'cb-bare'];

test.describe('Checkbox visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // No transitions: computed colours are final right after a state change.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('rest: the box uses the unchecked and checked tokens', async ({ page }) => {
    const off = page.getByTestId('cb-off');
    const on = page.getByTestId('cb-on');
    expect(await computed(boxOf(off), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-checkbox-border'));
    expect(await computed(boxOf(off), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-bg'));
    expect(await computed(boxOf(on), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-checked-bg'));
    expect(await computed(boxOf(on), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-checkbox-checked-bg'));
  });

  test('size: the box is 16 by 16 with a 1px border and a 4px radius', async ({ page }) => {
    const box = boxOf(page.getByTestId('cb-off'));
    const rect = await box.boundingBox();
    expect([rect?.width, rect?.height]).toEqual([16, 16]);
    expect(await computed(box, 'border-top-width')).toBe('1px');
    expect(await computed(box, 'border-top-left-radius')).toBe('4px');
  });

  test('hover: the unchecked box takes the hover border from the box and from the text', async ({ page }) => {
    const off = page.getByTestId('cb-off');
    const hover = await resolveToken(page, 'border-top-color', '--ads-checkbox-border-hover');
    await rootOf(off).locator('.ads-checkbox-label').hover();
    expect(await computed(boxOf(off), 'border-top-color')).toBe(hover);
    await page.mouse.move(0, 0);
    await off.hover({ force: true });
    expect(await computed(boxOf(off), 'border-top-color')).toBe(hover);
  });

  test('hover: the checked box takes the hover fill', async ({ page }) => {
    const on = page.getByTestId('cb-on');
    const fill = await resolveToken(page, 'background-color', '--ads-checkbox-checked-bg-hover');
    await rootOf(on).hover();
    expect(await computed(boxOf(on), 'background-color')).toBe(fill);
    expect(await computed(boxOf(on), 'border-top-color')).toBe(fill);
  });

  test('hover: an indeterminate box keeps its fill and takes the hover border', async ({ page }) => {
    const target = page.getByTestId('cb-indeterminate-on');
    const rest = await computed(boxOf(target), 'background-color');
    await rootOf(target).hover();
    expect(await computed(boxOf(target), 'background-color')).toBe(rest);
    expect(await computed(boxOf(target), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-checkbox-border-hover'));
  });

  test('focus-visible: keyboard focus draws the outline from the tokens around the box', async ({ page }) => {
    const color = await resolveToken(page, 'outline-color', '--ads-color-focus-outline');
    const input = page.getByTestId('cb-off');
    await page.keyboard.press('Tab');
    await input.focus();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    const box = boxOf(input);
    expect(await computed(box, 'outline-color')).toBe(color);
    expect(await computed(box, 'outline-style')).toBe('solid');
    expect(await computed(box, 'outline-width')).toBe('2px');
  });

  test('a mouse click does not show the focus outline', async ({ page }) => {
    const input = page.getByTestId('cb-off');
    await input.click();
    await expect(input).toBeChecked();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
    expect(await computed(boxOf(input), 'outline-style')).not.toBe('solid');
  });

  test('check mark: shown when checked, absent when unchecked', async ({ page }) => {
    expect(await computed(boxOf(page.getByTestId('cb-on')), 'opacity', '::after')).toBe('1');
    expect(await computed(boxOf(page.getByTestId('cb-off')), 'opacity', '::after')).toBe('0');
  });

  test('check mark: a click shows and hides it', async ({ page }) => {
    const input = page.getByTestId('cb-off');
    await input.click();
    await expect(input).toBeChecked();
    expect(await computed(boxOf(input), 'opacity', '::after')).toBe('1');
    await input.click();
    expect(await computed(boxOf(input), 'opacity', '::after')).toBe('0');
  });

  test('indeterminate: the bar is a square of half the box, centered, on the unfilled box', async ({ page }) => {
    for (const id of ['cb-indeterminate', 'cb-indeterminate-on']) {
      const box = boxOf(page.getByTestId(id));
      expect(await computed(box, 'opacity', '::after'), id).toBe('1');
      expect(await computed(box, 'width', '::after'), id).toBe('8px');
      expect(await computed(box, 'height', '::after'), id).toBe('8px');
      expect(await computed(box, 'background-color'), id).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-bg'));
    }
  });

  test('indeterminate: the accessibility tree reports mixed', async ({ page }) => {
    await expect(page.getByTestId('cb-indeterminate')).toHaveAccessibleName('Indeterminate');
    expect(await page.getByTestId('cb-indeterminate').ariaSnapshot()).toContain('[checked=mixed]');
    expect(await page.getByTestId('cb-on').ariaSnapshot()).toContain('[checked]');
    expect(await page.getByTestId('cb-off').ariaSnapshot()).not.toContain('checked');
  });

  test('indeterminate: a click checks the box and the bar stays, since the parent owns the flag', async ({ page }) => {
    const input = page.getByTestId('cb-indeterminate');
    await input.click();
    await expect(input).toBeChecked();
    expect(await input.evaluate((element) => (element as HTMLInputElement).indeterminate)).toBe(true);
  });

  test('disabled: dimmed colours, not-allowed cursor, no hover colour and a click does nothing', async ({ page }) => {
    const input = page.getByTestId('cb-disabled');
    const rest = await computed(boxOf(input), 'border-top-color');
    expect(rest).toBe(await resolveToken(page, 'border-top-color', '--ads-checkbox-disabled-border'));
    expect(await computed(boxOf(input), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-disabled-bg'));
    expect(await computed(rootOf(input), 'cursor')).toBe('not-allowed');
    expect(await computed(rootOf(input), 'color')).toBe(await resolveToken(page, 'color', '--ads-color-text-disabled'));
    await rootOf(input).hover();
    expect(await computed(boxOf(input), 'border-top-color')).toBe(rest);
    await rootOf(input).click({ force: true });
    await expect(input).not.toBeChecked();
  });

  test('disabled and checked: the check mark takes the disabled colour', async ({ page }) => {
    const box = boxOf(page.getByTestId('cb-disabled-on'));
    expect(await computed(box, 'border-right-color', '::after')).toBe(await resolveToken(page, 'border-right-color', '--ads-checkbox-disabled-check-color'));
    expect(await computed(box, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-disabled-bg'));
  });

  test('disabled and indeterminate: the bar takes the disabled colour', async ({ page }) => {
    const box = boxOf(page.getByTestId('cb-disabled-indeterminate'));
    expect(await computed(box, 'background-color', '::after')).toBe(await resolveToken(page, 'background-color', '--ads-checkbox-disabled-check-color'));
  });

  test('keyboard: Space toggles the checkbox in a real browser, Enter and arrows do not', async ({ page }) => {
    const input = page.getByTestId('cb-counted');
    await page.keyboard.press('Tab');
    await input.focus();
    await page.keyboard.press('Space');
    await expect(input).toBeChecked();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await expect(input).toBeChecked();
    await expect(page.getByTestId('checkbox-changes')).toHaveText('1');
    await page.keyboard.press('Space');
    await expect(input).not.toBeChecked();
    await expect(page.getByTestId('checkbox-changes')).toHaveText('2');
  });

  test('a click on the label text toggles the checkbox once', async ({ page }) => {
    const input = page.getByTestId('cb-counted');
    await rootOf(input).locator('.ads-checkbox-label').click();
    await expect(input).toBeChecked();
    await expect(page.getByTestId('checkbox-changes')).toHaveText('1');
  });

  test('right-to-left: the box is at the inline start and the text after it', async ({ page }) => {
    const input = page.getByTestId('cb-off');
    const order = async () => {
      const box = (await boxOf(input).boundingBox())!;
      const label = (await rootOf(input).locator('.ads-checkbox-label').boundingBox())!;
      return box.x < label.x ? 'box-first' : 'text-first';
    };
    expect(await order()).toBe('box-first');
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    expect(await order()).toBe('text-first');
  });

  test('prefers-reduced-motion: transitions are off', async ({ page }) => {
    const box = boxOf(page.getByTestId('cb-off'));
    expect(await computed(box, 'transition-duration')).toBe('0s');
    expect(await computed(box, 'transition-duration', '::after')).toBe('0s');
  });

  test('without the reduced-motion setting the transitions run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const box = boxOf(page.getByTestId('cb-off'));
    const fast = await resolveToken(page, 'transition-duration', '--ads-motion-duration-fast');
    expect(await computed(box, 'transition-duration')).toBe(`${fast}, ${fast}`);
  });

  const LAYOUT_IDS = ['lay-short', 'lay-long', 'lay-bare'];

  /** The boxes of everything in the layout demo, so a changed size or a moved neighbour shows. */
  const layoutOf = (page: Page) =>
    page.locator('[data-testid=checkbox-layout] > *').evaluateAll((elements) =>
      elements.map((element) => {
        // Page coordinates: clicking scrolls the page, which moves every viewport coordinate.
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
      })
    );

  test('layout: toggling checked does not change a size or move a neighbour', async ({ page }) => {
    for (const id of LAYOUT_IDS) {
      const target = page.getByTestId(id);
      const before = await layoutOf(page);
      await target.click();
      await expect(target).toBeChecked();
      expect(await layoutOf(page), `${id} on`).toEqual(before);
      await target.click();
      await expect(target).not.toBeChecked();
      expect(await layoutOf(page), `${id} off`).toEqual(before);
    }
  });

  test('layout: toggling indeterminate and disabled does not change a size or move a neighbour', async ({ page }) => {
    const before = await layoutOf(page);
    for (const button of ['lay-toggle-indeterminate', 'lay-toggle-disabled']) {
      await page.getByTestId(button).click();
      for (const id of LAYOUT_IDS) {
        const state = button === 'lay-toggle-disabled' ? await page.getByTestId(id).isDisabled() : await page.getByTestId(id).evaluate((e) => (e as HTMLInputElement).indeterminate);
        expect(state, `${id} ${button}`).toBe(true);
      }
      expect(await layoutOf(page), button).toEqual(before);
      await page.getByTestId(button).click();
      expect(await layoutOf(page), `${button} back`).toEqual(before);
    }
  });

  test('layout: no frame of the animation changes the size of the control', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const sizes = await page.getByTestId('lay-long').evaluate(async (element) => {
      const root = element.closest('label') as HTMLElement;
      const read = () => {
        const { width, height } = root.getBoundingClientRect();
        return `${Math.round(width * 100) / 100}x${Math.round(height * 100) / 100}`;
      };
      const seen = new Set<string>([read()]);
      const start = performance.now();
      (element as HTMLElement).click();
      await new Promise<void>((resolve) => {
        const tick = () => {
          seen.add(read());
          if (performance.now() - start < 500) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return [...seen];
    });
    expect(sizes).toHaveLength(1);
  });

  test('layout: a multi-line label keeps the box at the top', async ({ page }) => {
    const input = page.getByTestId('lay-long');
    await page.evaluate(() => {
      (document.querySelector('[data-testid=lay-long]')!.closest('label') as HTMLElement).style.width = '120px';
    });
    const root = (await rootOf(input).boundingBox())!;
    const box = (await boxOf(input).boundingBox())!;
    expect(root.height).toBeGreaterThan(40);
    // Centered on the first line (about 22px high), not on the whole label.
    expect(box.y - root.y).toBeLessThan(5);
  });

  test('group: a click toggles an option and the value follows the order of the options', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Letters' });
    await expect(page.getByTestId('group-value')).toHaveText('b');
    await group.getByRole('checkbox', { name: 'A much longer option' }).click();
    await group.getByRole('checkbox', { name: 'a', exact: true }).click();
    await expect(page.getByTestId('group-value')).toHaveText('a,b,c');
    await group.getByRole('checkbox', { name: 'b', exact: true }).click();
    await expect(page.getByTestId('group-value')).toHaveText('a,c');
  });

  test('group: toggling an option does not move the other options', async ({ page }) => {
    const items = page.getByTestId('group').locator('label');
    const boxes = () =>
      items.evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
        })
      );
    const before = await boxes();
    expect(before).toHaveLength(3);
    await page.getByRole('checkbox', { name: 'a', exact: true }).click();
    expect(await boxes()).toEqual(before);
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Checkbox contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await installContrastHelpers(page);
    });

    /** Checks the three contrast rules of the spec for every checkbox in the matrix. */
    async function expectContrast(page: Page, prepare: (target: Locator) => Promise<void>, after?: () => Promise<void>) {
      const failures: string[] = [];
      for (const id of MATRIX_IDS) {
        const target = page.getByTestId(id);
        await prepare(target);
        const { border, mark, bar } = await contrastOf(target);
        if (after) await after();
        if (border < 3) failures.push(`${id} border/page ${border.toFixed(2)}`);
        if (mark !== null && mark < 3) failures.push(`${id} mark/fill ${mark.toFixed(2)}`);
        if (bar !== null && bar < 3) failures.push(`${id} bar/box ${bar.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    }

    test('rest: the border reaches 3:1, the check mark and the bar 3:1', async ({ page }) => {
      await expectContrast(page, async () => {});
    });

    test('hover: the same ratios hold', async ({ page }) => {
      await expectContrast(page, (target) => rootOf(target).hover());
    });

    test('pressed: the same ratios hold', async ({ page }) => {
      await expectContrast(
        page,
        async (target) => {
          await rootOf(target).hover();
          await page.mouse.down();
        },
        () => page.mouse.up()
      );
    });

    test('keyboard focus: the same ratios hold and the ring reaches 3:1', async ({ page }) => {
      const failures: string[] = [];
      await page.keyboard.press('Tab');
      for (const id of MATRIX_IDS) {
        const target = page.getByTestId(id);
        await target.focus();
        const { border, mark, bar } = await contrastOf(target);
        const ring = await boxOf(target).evaluate((element) =>
          (window as unknown as { __ringContrast(e: Element): number }).__ringContrast(element)
        );
        if (!(await target.evaluate((element) => element.matches(':focus-visible')))) failures.push(`${id} not focus-visible`);
        if (border < 3 || (mark !== null && mark < 3) || (bar !== null && bar < 3)) failures.push(`${id} ${border} ${mark} ${bar}`);
        if (ring < 3) failures.push(`${id} ring ${ring.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('the label text keeps 4.5:1 against the page', async ({ page }) => {
      const ratio = await page.getByTestId('cb-off').evaluate((element) => {
        const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const label = element.closest('label') as HTMLElement;
        const [r, g, b, a = 1] = parse(getComputedStyle(label).color);
        const page = parse(getComputedStyle(document.body).backgroundColor);
        const blend = (t: number, p: number) => t * a + p * (1 - a);
        const text = lum([blend(r, page[0]), blend(g, page[1]), blend(b, page[2])]);
        const back = lum(page.slice(0, 3));
        const [hi, lo] = [text, back].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
}

// The default colors are Ant Design's own. The fixture loads tokens-accessible.css for the contrast tests above,
// so these tests take it out of the page and look at what a consumer gets with tokens.css alone.
test.describe('Checkbox default colors (tokens.css alone)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const removed = await page.evaluate(() => {
      const style = document.querySelector('style[data-vite-dev-id$="tokens-accessible.css"]');
      style?.remove();
      return Boolean(style);
    });
    expect(removed, 'the accessible stylesheet was not found in the page').toBe(true);
  });

  test('unchecked: the border is #d9d9d9 and #1677ff on hover', async ({ page }) => {
    const input = page.getByTestId('cb-off');
    expect(await computed(boxOf(input), 'border-top-color')).toBe('rgb(217, 217, 217)');
    await rootOf(input).hover();
    await expect.poll(() => computed(boxOf(input), 'border-top-color')).toBe('rgb(22, 119, 255)');
  });

  test('checked: the fill is #1677ff and #4096ff on hover, with a white check mark', async ({ page }) => {
    const input = page.getByTestId('cb-on');
    expect(await computed(boxOf(input), 'background-color')).toBe('rgb(22, 119, 255)');
    expect(await computed(boxOf(input), 'border-right-color', '::after')).toBe('rgb(255, 255, 255)');
    await rootOf(input).hover();
    await expect.poll(() => computed(boxOf(input), 'background-color')).toBe('rgb(64, 150, 255)');
  });

  test('disabled: the box is rgba(0, 0, 0, 0.04) with a #d9d9d9 border', async ({ page }) => {
    const box = boxOf(page.getByTestId('cb-disabled'));
    expect(await computed(box, 'background-color')).toBe('rgba(0, 0, 0, 0.04)');
    expect(await computed(box, 'border-top-color')).toBe('rgb(217, 217, 217)');
  });
});
