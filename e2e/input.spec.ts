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

const hasClass = (name: string) => `contains(concat(" ", normalize-space(@class), " "), " ${name} ")`;
/**
 * `data-testid` goes to the native field. Its parent is the box (with the border). The root is the outermost
 * element around the field: the box, or the group that joins the box to its addons.
 */
const rootOf = (field: Locator) =>
  field.locator(
    `xpath=ancestor::span[${hasClass('ads-input-group')} or (${hasClass('ads-input')} and not(parent::span[${hasClass('ads-input-group')}]))][1]`
  );
const boxOf = (field: Locator) => field.locator('xpath=..');
const part = (field: Locator, name: string) => rootOf(field).locator(`.ads-input-${name}`);

type Rgba = { r: number; g: number; b: number; a: number };

/** Contrast helpers run in the page, so they use the colours the browser really paints. */
async function installContrastHelpers(page: Page): Promise<void> {
  await page.evaluate(() => {
    const parse = (value: string): Rgba => {
      if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) throw new Error(`Unsupported colour: ${value}`);
      const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/).filter(Boolean);
      return { r: +r, g: +g, b: +b, a: +a };
    };
    const over = (top: Rgba, bottom: Rgba): Rgba => {
      const a = top.a + bottom.a * (1 - top.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
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
    /** Background actually seen behind the element, from its ancestors. */
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
    w.__fieldContrast = (field: Element) => {
      const box = field.parentElement as HTMLElement;
      const page = backdrop(box);
      const style = getComputedStyle(box);
      const fill = over(parse(style.backgroundColor), page);
      const borderTop = over(parse(style.borderTopColor), page);
      const borderBottom = over(parse(style.borderBottomColor), page);
      const placeholder = over(parse(getComputedStyle(field, '::placeholder').color), fill);
      const count = box.querySelector('.ads-input-count');
      const clear = box.querySelector('.ads-input-clear');
      const toggle = box.querySelector('.ads-input-password-toggle');
      const icon = (clear ?? toggle) as Element | null;
      const outline = parse(style.outlineColor);
      return {
        // The boundary: the border (the bottom one for an underlined field), against the page.
        border: ratio(style.borderTopWidth === '0px' ? borderBottom : borderTop, page),
        placeholder: ratio(placeholder, fill),
        count: count ? ratio(over(parse(getComputedStyle(count).color), fill), fill) : null,
        icon: icon ? ratio(over(parse(getComputedStyle(icon).color), fill), fill) : null,
        outline: style.outlineStyle === 'solid' ? ratio(over(outline, page), page) : null
      };
    };
  });
}

type FieldContrast = { border: number; placeholder: number; count: number | null; icon: number | null; outline: number | null };
const contrastOf = (field: Locator) =>
  field.evaluate((element) => (window as unknown as { __fieldContrast(e: Element): FieldContrast }).__fieldContrast(element));

test.describe('Input visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // No transitions: computed colours are final right after a state change.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('rest: the box uses the tokens, a 1px border and the 6px radius', async ({ page }) => {
    const box = boxOf(page.getByTestId('in-rest'));
    expect(await computed(box, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border'));
    expect(await computed(box, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-bg'));
    expect(await computed(box, 'border-top-width')).toBe('1px');
    expect(await computed(box, 'border-top-left-radius')).toBe('6px');
  });

  test('sizes: the field is 40, 32 and 24px high, with the radius and the font of its size', async ({ page }) => {
    const expected = [
      ['in-large', 40, '8px', '16px'],
      ['in-rest', 32, '6px', '14px'],
      ['in-small', 24, '4px', '14px']
    ] as const;
    for (const [id, height, radius, font] of expected) {
      const field = page.getByTestId(id);
      const rect = (await rootOf(field).boundingBox())!;
      expect(rect.height, id).toBe(height);
      expect(await computed(boxOf(field), 'border-top-left-radius'), id).toBe(radius);
      expect(await computed(field, 'font-size'), id).toBe(font);
    }
  });

  test('hover: the border takes the hover colour; a filled field takes the hover background', async ({ page }) => {
    const rest = page.getByTestId('in-rest');
    await boxOf(rest).hover();
    expect(await computed(boxOf(rest), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-hover'));
    const filled = page.getByTestId('in-filled');
    await boxOf(filled).hover();
    expect(await computed(boxOf(filled), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-filled-bg-hover'));
  });

  test('focus: the border takes the active colour and the shadow ring; a mouse click shows it too', async ({ page }) => {
    const field = page.getByTestId('in-rest');
    await field.click();
    expect(await computed(boxOf(field), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-active'));
    expect(await computed(boxOf(field), 'box-shadow')).toBe(await resolveToken(page, 'box-shadow', '--ads-input-shadow-active'));
    expect(await computed(boxOf(field), 'outline-style')).toBe('none');
  });

  test('focus: the borderless field, which has no border to change, draws the focus outline', async ({ page }) => {
    const field = page.getByTestId('in-borderless');
    expect(await computed(boxOf(field), 'outline-style')).toBe('none');
    await field.focus();
    const box = boxOf(field);
    expect(await computed(box, 'outline-style')).toBe('solid');
    expect(await computed(box, 'outline-width')).toBe('2px');
    expect(await computed(box, 'outline-color')).toBe(await resolveToken(page, 'outline-color', '--ads-color-focus-outline'));
  });

  test('variants: filled has a background and no border colour, underlined only a bottom border and no radius', async ({ page }) => {
    const filled = boxOf(page.getByTestId('in-filled'));
    expect(await computed(filled, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-filled-bg'));
    expect(await computed(filled, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
    const underlined = boxOf(page.getByTestId('in-underlined'));
    expect(await computed(underlined, 'border-top-width')).toBe('0px');
    expect(await computed(underlined, 'border-bottom-width')).toBe('1px');
    expect(await computed(underlined, 'border-bottom-color')).toBe(await resolveToken(page, 'border-bottom-color', '--ads-input-border'));
    expect(await computed(underlined, 'border-top-left-radius')).toBe('0px');
    expect(await computed(underlined, 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test('status: error and warning take their border colours; a filled field takes the status background', async ({ page }) => {
    expect(await computed(boxOf(page.getByTestId('in-error')), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-error'));
    expect(await computed(boxOf(page.getByTestId('in-warning')), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-warning'));
    const filledError = boxOf(page.getByTestId('in-error-filled'));
    expect(await computed(filledError, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-error-bg'));
    expect(await computed(filledError, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await computed(boxOf(page.getByTestId('in-warning-underlined')), 'border-bottom-color')).toBe(await resolveToken(page, 'border-bottom-color', '--ads-input-warning'));
  });

  test('status: error takes its hover colour and its shadow ring when focused', async ({ page }) => {
    const field = page.getByTestId('in-error');
    await boxOf(field).hover();
    expect(await computed(boxOf(field), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-error-hover'));
    await field.click();
    expect(await computed(boxOf(field), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-error'));
    expect(await computed(boxOf(field), 'box-shadow')).toBe(await resolveToken(page, 'box-shadow', '--ads-input-error-shadow'));
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('in-warning')).not.toHaveAttribute('aria-invalid', /.*/);
  });

  test('disabled: dimmed colours, not-allowed cursor, no hover colour and no focus', async ({ page }) => {
    const field = page.getByTestId('in-disabled');
    const box = boxOf(field);
    expect(await computed(box, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-disabled-bg'));
    expect(await computed(box, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-disabled-border'));
    expect(await computed(field, 'color')).toBe(await resolveToken(page, 'color', '--ads-color-text-disabled'));
    expect(await computed(field, 'cursor')).toBe('not-allowed');
    await box.hover();
    expect(await computed(box, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-disabled-border'));
    await expect(field).toBeDisabled();
  });

  test('read only: focusable, with the colours of a normal field', async ({ page }) => {
    const field = page.getByTestId('in-readonly');
    await field.focus();
    await expect(field).toBeFocused();
    expect(await computed(boxOf(field), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-active'));
  });

  test('placeholder and count: colours come from the tokens; past a soft limit the count is the danger text colour', async ({ page }) => {
    const rest = page.getByTestId('in-rest');
    expect(await computed(rest, 'color', '::placeholder')).toBe(await resolveToken(page, 'color', '--ads-input-placeholder'));
    const counted = page.getByTestId('in-count');
    expect(await computed(part(counted, 'count'), 'color')).toBe(await resolveToken(page, 'color', '--ads-input-count-color'));
    const soft = page.getByTestId('in-soft');
    await soft.fill('abcdef');
    expect(await computed(part(soft, 'count'), 'color')).toBe(await resolveToken(page, 'color', '--ads-color-danger-text'));
    await expect(soft).toHaveAttribute('aria-invalid', 'true');
    await soft.fill('abc');
    expect(await computed(part(soft, 'count'), 'color')).toBe(await resolveToken(page, 'color', '--ads-input-count-color'));
  });

  test('addons: a cell outside the border with the addon background, rounded only on the outer side', async ({ page }) => {
    const field = page.getByTestId('in-affixes');
    const before = rootOf(field).locator('.ads-input-addon-before');
    const after = rootOf(field).locator('.ads-input-addon-after');
    expect(await computed(before, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-addon-bg'));
    expect(await computed(before, 'border-top-left-radius')).toBe('6px');
    expect(await computed(before, 'border-top-right-radius')).toBe('0px');
    expect(await computed(after, 'border-top-right-radius')).toBe('6px');
    expect(await computed(after, 'border-top-left-radius')).toBe('0px');
    expect(await computed(boxOf(field), 'border-top-left-radius')).toBe('0px');
    expect(await computed(boxOf(field), 'border-top-right-radius')).toBe('0px');
  });

  test('prefers-reduced-motion: transitions are off; without it they run', async ({ page }) => {
    const box = boxOf(page.getByTestId('in-rest'));
    expect(await computed(box, 'transition-duration')).toBe('0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const duration = await resolveToken(page, 'transition-duration', '--ads-motion-duration');
    expect(await computed(box, 'transition-duration')).toBe(`${duration}, ${duration}, ${duration}`);
  });

  test('right-to-left: the prefix and the before addon are at the inline start, the suffix and the after addon at the end', async ({ page }) => {
    const field = page.getByTestId('in-affixes');
    const xs = async () => ({
      before: (await rootOf(field).locator('.ads-input-addon-before').boundingBox())!.x,
      prefix: (await part(field, 'prefix').boundingBox())!.x,
      input: (await field.boundingBox())!.x,
      suffix: (await part(field, 'suffix').boundingBox())!.x,
      after: (await rootOf(field).locator('.ads-input-addon-after').boundingBox())!.x
    });
    const ltr = await xs();
    expect(ltr.before).toBeLessThan(ltr.prefix);
    expect(ltr.prefix).toBeLessThan(ltr.input);
    expect(ltr.input).toBeLessThan(ltr.suffix);
    expect(ltr.suffix).toBeLessThan(ltr.after);
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    const rtl = await xs();
    expect(rtl.before).toBeGreaterThan(rtl.prefix);
    expect(rtl.prefix).toBeGreaterThan(rtl.input);
    expect(rtl.input).toBeGreaterThan(rtl.suffix);
    expect(rtl.suffix).toBeGreaterThan(rtl.after);
  });
});

test.describe('Input behavior in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('clear: hidden (but in place) while empty; a mouse click clears and keeps focus in the field', async ({ page }) => {
    const field = page.getByTestId('in-clear');
    const clear = part(field, 'clear');
    await expect(clear).toBeVisible();
    // Page coordinates: clicking scrolls the page, which moves every viewport coordinate.
    const pageRect = () =>
      rootOf(field).evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
      });
    const before = await pageRect();
    await clear.click();
    await expect(field).toHaveValue('');
    await expect(field).toBeFocused();
    expect(await computed(clear, 'visibility')).toBe('hidden');
    expect(await pageRect()).toEqual(before);
    await expect(clear).toBeHidden();
    await field.pressSequentially('x');
    await expect(clear).toBeVisible();
  });

  test('clear: from the keyboard the button follows the field in the Tab order and Enter clears', async ({ page }) => {
    const field = page.getByTestId('in-clear');
    await field.fill('abc');
    await field.focus();
    await page.keyboard.press('Tab');
    const clear = part(field, 'clear');
    await expect(clear).toBeFocused();
    expect(await clear.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    expect(await computed(clear, 'outline-style')).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(field).toHaveValue('');
    await expect(field).toBeFocused();
    await expect(page.getByRole('button', { name: 'Clear' }).first()).toBeAttached();
  });

  test('clear: while the text is empty the hidden button is not in the Tab order and not in the accessibility tree', async ({ page }) => {
    const field = page.getByTestId('in-clear');
    await field.fill('');
    await field.focus();
    await expect(rootOf(field).getByRole('button', { name: 'Clear' })).toHaveCount(0);
    await page.keyboard.press('Tab');
    expect(await field.evaluate((element) => element.closest('.ads-input')!.contains(document.activeElement))).toBe(false);
    await field.fill('abc');
    await expect(rootOf(field).getByRole('button', { name: 'Clear' })).toHaveCount(1);
  });

  test('type=number: the native steppers stay (they appear under the pointer) and the arrow keys step the value', async ({ page }) => {
    const field = page.getByTestId('in-number');
    await field.scrollIntoViewIfNeeded();
    const box = (await field.boundingBox())!;
    // The end of the field, inside the border: the steppers are drawn there while the pointer is over it.
    const clip = { x: box.x + box.width - 24, y: box.y + 2, width: 20, height: box.height - 4 };
    const rest = await page.screenshot({ clip });
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await page.waitForTimeout(400);
    expect((await page.screenshot({ clip })).equals(rest)).toBe(false);
    await page.mouse.move(0, 0);
    await field.focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(field).toHaveValue('2');
    await page.keyboard.press('ArrowDown');
    await expect(field).toHaveValue('1');
  });

  test('password: the toggle shows and hides the text; a press keeps focus in the field; Space works', async ({ page }) => {
    const field = page.getByTestId('in-password');
    const toggle = rootOf(field).getByRole('button', { name: 'Show password' });
    await expect(field).toHaveAttribute('type', 'password');
    await field.focus();
    await toggle.click();
    await expect(field).toHaveAttribute('type', 'text');
    await expect(field).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(field).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('search: Enter, the icon and the clear button call onsearch with the source', async ({ page }) => {
    const field = page.getByTestId('in-search');
    await field.fill('cats');
    await field.press('Enter');
    await expect(page.getByTestId('search-log')).toHaveText('input:cats');
    await rootOf(field).getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('search-log')).toHaveText('input:cats');
    await field.fill('dogs');
    await rootOf(field).getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('search-log')).toHaveText('input:dogs');
    await part(field, 'clear').click();
    await expect(page.getByTestId('search-log')).toHaveText('clear:');
    await expect(field).toBeFocused();
  });

  test('search: the enterButton is a primary button as high as the field, joined to it', async ({ page }) => {
    const field = page.getByTestId('in-search-button');
    const button = page.getByRole('button', { name: 'Search with a button' }).or(rootOf(field).locator('xpath=following-sibling::button'));
    const box = (await rootOf(field).boundingBox())!;
    const target = (await rootOf(field).locator('xpath=following-sibling::button').boundingBox())!;
    expect(target.height).toBe(box.height);
    expect(Math.abs(target.x - (box.x + box.width))).toBeLessThanOrEqual(1);
    expect(await computed(rootOf(field).locator('xpath=following-sibling::button'), 'background-color')).toBe(
      await resolveToken(page, 'background-color', '--ads-color-primary-solid')
    );
    await expect(button.first()).toBeVisible();
  });

  test('one-time code: typing fills the cells and moves focus; Backspace and the arrows move back; the value follows', async ({ page }) => {
    const group = page.getByTestId('otp');
    const cells = group.getByRole('textbox');
    await cells.first().click();
    await page.keyboard.type('12');
    await expect(page.getByTestId('otp-value')).toHaveText('12');
    await expect(cells.nth(2)).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('otp-value')).toHaveText('1');
    await expect(cells.nth(1)).toBeFocused();
    await page.keyboard.type('234');
    await expect(page.getByTestId('otp-value')).toHaveText('1234');
    await expect(cells.nth(3)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(cells.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(3)).toBeFocused();
    await expect(cells).toHaveCount(4);
    await expect(cells.nth(0)).toHaveValue('1');
    await expect(cells.nth(3)).toHaveValue('4');
  });

  test('one-time code: a cell past the first empty one hands focus to the first empty cell', async ({ page }) => {
    const group = page.getByTestId('otp');
    const cells = group.getByRole('textbox');
    await cells.first().click();
    await page.keyboard.type('1');
    await cells.nth(3).click();
    await expect(cells.nth(1)).toBeFocused();
  });

  test('one-time code: the cells are as wide as the field is high and the arrows are mirrored in right-to-left', async ({ page }) => {
    const group = page.getByTestId('otp-separated');
    const cells = group.getByRole('textbox');
    const rect = (await rootOf(cells.first()).boundingBox())!;
    expect([rect.width, rect.height]).toEqual([40, 40]);
    await expect(group.locator('.ads-input-otp-separator')).toHaveCount(3);
    await cells.first().click();
    await page.keyboard.type('1234');
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    await cells.nth(1).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(cells.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(1)).toBeFocused();
  });

  test('IME: the text is cut at the end of a composition, not in the middle of it', async ({ page, context }) => {
    const field = page.getByTestId('in-ime');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'abcdef', selectionStart: 6, selectionEnd: 6 });
    await expect(field).toHaveValue('abcdef');
    await session.send('Input.insertText', { text: 'abcdef' });
    await expect(field).toHaveValue('abc');
  });

  test('a mouse selection of the text and a copy keep working in a read-only field', async ({ page }) => {
    const field = page.getByTestId('in-readonly');
    await field.click();
    await page.keyboard.press('Control+A');
    expect(await field.evaluate((element) => (element as HTMLInputElement).selectionEnd)).toBe('Read only'.length);
  });
});

test.describe('InputTextArea autoSize in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const height = async (locator: Locator) => Math.round(((await locator.boundingBox())!.height) * 100) / 100;

  test('the height follows the lines of the text and shrinks back', async ({ page }) => {
    const area = page.getByTestId('ta-auto');
    const one = await height(area);
    expect(one).toBeGreaterThanOrEqual(30);
    await area.fill('1\n2\n3');
    await expect.poll(() => height(area)).toBeGreaterThan(one + 40);
    const three = await height(area);
    await area.fill('1\n2\n3\n4\n5');
    await expect.poll(() => height(area)).toBeGreaterThan(three + 30);
    await area.fill('');
    await expect.poll(() => height(area)).toBe(one);
    expect(await computed(area, 'overflow-y')).toBe('hidden');
  });

  test('minRows is the least and maxRows the most; past the most the field scrolls', async ({ page }) => {
    const area = page.getByTestId('ta-limits');
    // Two rows of the 22px line and 4px of padding above and below.
    expect(await height(area)).toBe(2 * 22 + 8);
    await area.fill('1\n2\n3\n4\n5\n6\n7\n8');
    await expect.poll(() => height(area)).toBe(4 * 22 + 8);
    expect(await computed(area, 'overflow-y')).toBe('auto');
    expect(await area.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await area.fill('1\n2\n3');
    await expect.poll(() => height(area)).toBe(3 * 22 + 8);
    expect(await computed(area, 'overflow-y')).toBe('hidden');
  });

  test('a narrower field wraps the text into more lines and the height follows, without an error of the page', async ({ page }) => {
    // Changing the height inside a ResizeObserver callback would be reported as an error of the page.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.evaluate(() => {
      window.addEventListener('error', (event) => ((window as unknown as { __errors: string[] }).__errors ??= []).push(event.message));
    });
    const area = page.getByTestId('ta-auto');
    await area.fill('word '.repeat(30));
    const wide = await height(area);
    await page.evaluate(() => {
      (document.querySelector('[data-testid=ta-auto]')!.closest('.field') as HTMLElement).style.width = '140px';
    });
    await expect.poll(() => height(area)).toBeGreaterThan(wide);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __errors?: string[] }).__errors ?? [])).toEqual([]);
  });

  test('autoSize replaces manual resizing: the handle is off with it and stays vertical without it', async ({ page }) => {
    expect(await computed(page.getByTestId('ta-auto'), 'resize')).toBe('none');
    expect(await computed(page.getByTestId('ta-limits'), 'resize')).toBe('none');
    expect(await computed(page.getByTestId('ta-plain'), 'resize')).toBe('vertical');
  });

  test('without autoSize the height does not change with the text', async ({ page }) => {
    const area = page.getByTestId('ta-plain');
    const before = await height(area);
    await area.fill('1\n2\n3\n4\n5\n6\n7\n8');
    expect(await height(area)).toBe(before);
  });

  test('the count has its own row and the clear button sits at the top corner without covering the text', async ({ page }) => {
    const area = page.getByTestId('ta-counted');
    const count = (await part(area, 'count').boundingBox())!;
    const text = (await area.boundingBox())!;
    expect(count.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
    const clear = (await part(area, 'clear').boundingBox())!;
    expect(clear.y).toBeLessThan(text.y + 16);
    expect(clear.x + clear.width).toBeLessThanOrEqual(text.x + text.width + 1);
    // Room is kept at the end of the text for the clear button.
    expect(parseFloat(await computed(area, 'padding-inline-end'))).toBeGreaterThan(20);
  });
});

/** The boxes of everything in the layout section, so a changed size or a moved neighbour shows. */
const layoutOf = (page: Page) =>
  page.locator('[data-testid=input-layout] > *').evaluateAll((elements) =>
    elements.map((element) => {
      // Page coordinates: clicking scrolls the page, which moves every viewport coordinate.
      const { x, y, width, height } = element.getBoundingClientRect();
      return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
    })
  );

test.describe('Input layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const FIELDS = ['lay-input', 'lay-password', 'lay-search', 'lay-search-button', 'lay-search-text', 'lay-area'];
  // Texts of different widths: a narrow one, a wide one, and a long one that has no room in the field.
  const TEXTS = ['I', 'WWWWWWWWWWWWWWWWWWWW', 'W'.repeat(55)];

  test('the text changing (empty, narrow, wide, long) does not change a size or move a neighbour; the clear button and the count come and go in place', async ({ page }) => {
    const before = await layoutOf(page);
    for (const id of ['lay-input', 'lay-password', 'lay-search', 'lay-area']) {
      for (const text of TEXTS) {
        await page.getByTestId(id).fill(text);
        expect(await layoutOf(page), `${id} with ${text.length} characters`).toEqual(before);
      }
      await page.getByTestId(id).fill('');
      expect(await layoutOf(page), `${id} emptied`).toEqual(before);
    }
  });

  test('status, disabled, visibility and loading do not change a size or move a neighbour', async ({ page }) => {
    for (const id of FIELDS.slice(0, 3)) await page.getByTestId(id).fill('Happy');
    const before = await layoutOf(page);
    for (const button of ['lay-status', 'lay-warning', 'lay-disabled', 'lay-visible', 'lay-loading']) {
      await page.getByTestId(button).click();
      expect(await layoutOf(page), button).toEqual(before);
      await page.getByTestId(button).click();
      expect(await layoutOf(page), `${button} back`).toEqual(before);
    }
  });

  test('loading: no frame of the spinner changes the size of the search field or its button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByTestId('lay-search-text').fill('Happy');
    const before = await layoutOf(page);
    const sizes = await page.locator('[data-testid=input-layout]').evaluate(async (section) => {
      const read = () => [...section.children].map((child) => {
        const { width, height } = child.getBoundingClientRect();
        return `${Math.round(width * 100) / 100}x${Math.round(height * 100) / 100}`;
      }).join('|');
      const seen = new Set<string>([read()]);
      const start = performance.now();
      (section.querySelector('[data-testid=lay-loading]') as HTMLElement).click();
      await new Promise<void>((resolve) => {
        const tick = () => {
          seen.add(read());
          if (performance.now() - start < 600) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return [...seen];
    });
    expect(sizes).toHaveLength(1);
    expect(await layoutOf(page)).toEqual(before);
  });

  test('the search buttons keep their width when the spinner replaces the icon or covers the text', async ({ page }) => {
    const button = (id: string) => rootOf(page.getByTestId(id)).locator('xpath=following-sibling::button');
    const widths = async () => [(await button('lay-search-button').boundingBox())!.width, (await button('lay-search-text').boundingBox())!.width];
    const rest = await widths();
    await page.getByTestId('lay-loading').click();
    expect(await widths()).toEqual(rest);
    await expect(button('lay-search-button')).toHaveAttribute('aria-busy', 'true');
    await expect(button('lay-search-text')).toHaveAccessibleName('Search');
    expect(await button('lay-search-text').locator('.ads-input-icon-loading').count()).toBe(1);
  });

  test('typing in a field keeps the field and its caret in place when a prefix and a suffix are on', async ({ page }) => {
    const field = page.getByTestId('lay-input');
    const before = (await field.boundingBox())!;
    await field.pressSequentially('Happy');
    const after = (await field.boundingBox())!;
    expect(after.x).toBe(before.x);
    expect(after.width).toBe(before.width);
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Input contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await installContrastHelpers(page);
    });

    // The boundary needs 3:1 where there is one: an outlined or underlined field. `filled` and `borderless` have none by design.
    const BOUNDARY = ['in-rest', 'in-underlined', 'in-error', 'in-warning', 'in-warning-underlined', 'in-large', 'in-small', 'in-affixes'];
    const PLACEHOLDER = ['in-rest', 'in-filled', 'in-error-filled', 'in-underlined', 'in-borderless', 'ta-plain'];

    test('rest: the boundary reaches 3:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of BOUNDARY) {
        const { border } = await contrastOf(page.getByTestId(id));
        if (border < 3) failures.push(`${id} ${border.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('hover: the boundary reaches 3:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of BOUNDARY) {
        await boxOf(page.getByTestId(id)).hover();
        const { border } = await contrastOf(page.getByTestId(id));
        if (border < 3) failures.push(`${id} ${border.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('focus: the boundary reaches 3:1, and the borderless outline reaches 3:1', async ({ page }) => {
      const failures: string[] = [];
      for (const id of BOUNDARY) {
        await page.getByTestId(id).focus();
        const { border } = await contrastOf(page.getByTestId(id));
        if (border < 3) failures.push(`${id} ${border.toFixed(2)}`);
      }
      await page.getByTestId('in-borderless').focus();
      const { outline } = await contrastOf(page.getByTestId('in-borderless'));
      if (outline === null || outline < 3) failures.push(`borderless outline ${outline}`);
      expect(failures).toEqual([]);
    });

    test('the placeholder reaches 4.5:1 on every variant, at rest and on hover', async ({ page }) => {
      const failures: string[] = [];
      for (const hovered of [false, true]) {
        for (const id of PLACEHOLDER) {
          if (hovered) await boxOf(page.getByTestId(id)).hover();
          const { placeholder } = await contrastOf(page.getByTestId(id));
          if (placeholder < 4.5) failures.push(`${id}${hovered ? ' hovered' : ''} ${placeholder.toFixed(2)}`);
        }
      }
      expect(failures).toEqual([]);
    });

    test('the count, the over-limit count and the icons reach their ratios', async ({ page }) => {
      const failures: string[] = [];
      const counted = await contrastOf(page.getByTestId('in-count'));
      if (counted.count === null || counted.count < 4.5) failures.push(`count ${counted.count}`);
      await page.getByTestId('in-soft').fill('abcdef');
      const soft = await contrastOf(page.getByTestId('in-soft'));
      if (soft.count === null || soft.count < 4.5) failures.push(`count over the limit ${soft.count}`);
      for (const id of ['in-clear', 'in-password', 'ta-counted']) {
        const { icon } = await contrastOf(page.getByTestId(id));
        if (icon === null || icon < 3) failures.push(`${id} icon ${icon}`);
      }
      expect(failures).toEqual([]);
    });

    test('the text keeps 4.5:1 against the field', async ({ page }) => {
      const ratio = await page.getByTestId('in-error').evaluate((element) => {
        const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const [r, g, b, a = 1] = parse(getComputedStyle(element).color);
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
test.describe('Input default colors (tokens.css alone)', () => {
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

  test('outlined: the border is #d9d9d9, #4096ff on hover and #1677ff when focused', async ({ page }) => {
    const field = page.getByTestId('in-rest');
    expect(await computed(boxOf(field), 'border-top-color')).toBe('rgb(217, 217, 217)');
    await boxOf(field).hover();
    await expect.poll(() => computed(boxOf(field), 'border-top-color')).toBe('rgb(64, 150, 255)');
    await field.click();
    await expect.poll(() => computed(boxOf(field), 'border-top-color')).toBe('rgb(22, 119, 255)');
  });

  test('filled, addon and placeholder: rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.02) and rgba(0, 0, 0, 0.25)', async ({ page }) => {
    expect(await computed(boxOf(page.getByTestId('in-filled')), 'background-color')).toBe('rgba(0, 0, 0, 0.04)');
    expect(await computed(rootOf(page.getByTestId('in-affixes')).locator('.ads-input-addon-before'), 'background-color')).toBe('rgba(0, 0, 0, 0.02)');
    expect(await computed(page.getByTestId('in-rest'), 'color', '::placeholder')).toBe('rgba(0, 0, 0, 0.25)');
  });

  test('status: error is #ff4d4f and warning #faad14', async ({ page }) => {
    expect(await computed(boxOf(page.getByTestId('in-error')), 'border-top-color')).toBe('rgb(255, 77, 79)');
    expect(await computed(boxOf(page.getByTestId('in-warning')), 'border-top-color')).toBe('rgb(250, 173, 20)');
  });

  test('disabled: rgba(0, 0, 0, 0.04) with a #d9d9d9 border', async ({ page }) => {
    const box = boxOf(page.getByTestId('in-disabled'));
    expect(await computed(box, 'background-color')).toBe('rgba(0, 0, 0, 0.04)');
    expect(await computed(box, 'border-top-color')).toBe('rgb(217, 217, 217)');
  });
});
