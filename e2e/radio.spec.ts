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

/** The radio is the input; the label is its root, the mark is the span after it. */
const rootOf = (input: Locator) => input.locator('xpath=ancestor::label');
const markOf = (input: Locator) => input.locator('xpath=following-sibling::span[contains(@class, "ads-radio-icon")]');

/** A radio of a group, by the name of the group and of the radio. */
const inGroup = (page: Page, group: string, name: string) => page.getByRole('radiogroup', { name: group, exact: true }).getByRole('radio', { name, exact: true });

type Rgba = { r: number; g: number; b: number; a: number };

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
    // A plain radio: the input is the radio, its mark is the next element; the dot is the background of ::after.
    w.__radioContrast = (input: Element) => {
      const mark = input.nextElementSibling as Element;
      const page = backdrop(mark);
      const style = getComputedStyle(mark);
      const fill = over(parse(style.backgroundColor), page);
      const border = over(parse(style.borderTopColor), page);
      const dot = over(parse(getComputedStyle(mark, '::after').backgroundColor), fill);
      const checked = (input as HTMLInputElement).checked;
      return {
        border: ratio(border, page),
        fill: checked ? ratio(fill, page) : null,
        dot: checked ? ratio(dot, fill) : null
      };
    };
    // A button: the input is the first child of the button (the label); text, fill and border are the button's own.
    w.__buttonContrast = (input: Element) => {
      const button = input.parentElement as Element;
      const page = backdrop(button);
      const style = getComputedStyle(button);
      const fill = over(parse(style.backgroundColor), page);
      const border = over(parse(style.borderTopColor), page);
      const text = over(parse(style.color), fill);
      return { border: ratio(border, page), text: ratio(text, fill), fill: ratio(fill, page) };
    };
    // The ring is the outline of `element`, painted outside of `outer` (the mark, or the whole button), over the page.
    w.__ringContrast = (element: Element, outer: Element = element) => {
      const page = backdrop(outer);
      const ring = over(parse(getComputedStyle(element).outlineColor), page);
      return ratio(ring, page);
    };
  });
}

test.describe('Radio visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // No transitions: computed colours are final right after a state change.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('rest: the mark uses the unchecked and checked tokens', async ({ page }) => {
    const off = page.getByTestId('rd-off');
    const on = page.getByTestId('rd-on');
    expect(await computed(markOf(off), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-radio-border'));
    expect(await computed(markOf(off), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-bg'));
    expect(await computed(markOf(on), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-checked-bg'));
    expect(await computed(markOf(on), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-radio-checked-bg'));
  });

  test('size: the mark is a 16 by 16 circle with a 1px border', async ({ page }) => {
    const mark = markOf(page.getByTestId('rd-off'));
    const rect = await mark.boundingBox();
    expect([rect?.width, rect?.height]).toEqual([16, 16]);
    expect(await computed(mark, 'border-top-width')).toBe('1px');
    expect(await computed(mark, 'border-top-left-radius')).toBe('50%');
  });

  test('dot: a 6px dot, shown when checked and absent when unchecked', async ({ page }) => {
    expect(await computed(markOf(page.getByTestId('rd-on')), 'opacity', '::after')).toBe('1');
    expect(await computed(markOf(page.getByTestId('rd-on')), 'width', '::after')).toBe('6px');
    expect(await computed(markOf(page.getByTestId('rd-on')), 'background-color', '::after')).toBe(await resolveToken(page, 'background-color', '--ads-radio-dot-color'));
    expect(await computed(markOf(page.getByTestId('rd-off')), 'opacity', '::after')).toBe('0');
  });

  test('dot: a click shows it and a second click keeps it', async ({ page }) => {
    const input = page.getByTestId('rd-off');
    await input.click();
    await expect(input).toBeChecked();
    expect(await computed(markOf(input), 'opacity', '::after')).toBe('1');
    await input.click();
    await expect(input).toBeChecked();
    expect(await computed(markOf(input), 'opacity', '::after')).toBe('1');
  });

  test('hover: the unchecked mark takes the hover border from the mark and from the text', async ({ page }) => {
    const off = page.getByTestId('rd-off');
    const hover = await resolveToken(page, 'border-top-color', '--ads-radio-border-hover');
    await rootOf(off).locator('.ads-radio-label').hover();
    expect(await computed(markOf(off), 'border-top-color')).toBe(hover);
    await page.mouse.move(0, 0);
    await off.hover({ force: true });
    expect(await computed(markOf(off), 'border-top-color')).toBe(hover);
  });

  test('hover: the checked mark takes the hover fill', async ({ page }) => {
    const on = page.getByTestId('rd-on');
    const fill = await resolveToken(page, 'background-color', '--ads-radio-checked-bg-hover');
    await rootOf(on).hover();
    expect(await computed(markOf(on), 'background-color')).toBe(fill);
    expect(await computed(markOf(on), 'border-top-color')).toBe(fill);
  });

  test('focus-visible: keyboard focus draws the outline from the tokens around the mark', async ({ page }) => {
    const color = await resolveToken(page, 'outline-color', '--ads-color-focus-outline');
    const input = page.getByTestId('rd-off');
    await page.keyboard.press('Tab');
    await input.focus();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    const mark = markOf(input);
    expect(await computed(mark, 'outline-color')).toBe(color);
    expect(await computed(mark, 'outline-style')).toBe('solid');
    expect(await computed(mark, 'outline-width')).toBe('2px');
  });

  test('a mouse click does not show the focus outline', async ({ page }) => {
    const input = page.getByTestId('rd-off');
    await input.click();
    await expect(input).toBeChecked();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
    expect(await computed(markOf(input), 'outline-style')).not.toBe('solid');
  });

  test('disabled: dimmed colours, not-allowed cursor, no hover colour and a click does nothing', async ({ page }) => {
    const input = page.getByTestId('rd-disabled');
    const rest = await computed(markOf(input), 'border-top-color');
    expect(rest).toBe(await resolveToken(page, 'border-top-color', '--ads-radio-disabled-border'));
    expect(await computed(markOf(input), 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-disabled-bg'));
    expect(await computed(rootOf(input), 'cursor')).toBe('not-allowed');
    expect(await computed(rootOf(input), 'color')).toBe(await resolveToken(page, 'color', '--ads-color-text-disabled'));
    await rootOf(input).hover();
    expect(await computed(markOf(input), 'border-top-color')).toBe(rest);
    await rootOf(input).click({ force: true });
    await expect(input).not.toBeChecked();
  });

  test('disabled and checked: the dot takes the disabled colour on the disabled background', async ({ page }) => {
    const mark = markOf(page.getByTestId('rd-disabled-on'));
    expect(await computed(mark, 'background-color', '::after')).toBe(await resolveToken(page, 'background-color', '--ads-radio-disabled-dot-color'));
    expect(await computed(mark, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-disabled-bg'));
  });

  test('keyboard: Space selects a radio in a real browser, once', async ({ page }) => {
    const input = page.getByTestId('rd-counted');
    await page.keyboard.press('Tab');
    await input.focus();
    await page.keyboard.press('Space');
    await expect(input).toBeChecked();
    await expect(page.getByTestId('radio-changes')).toHaveText('1');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('radio-changes')).toHaveText('1');
  });

  test('a click on the label text selects the radio once', async ({ page }) => {
    const input = page.getByTestId('rd-counted');
    await rootOf(input).locator('.ads-radio-label').click();
    await expect(input).toBeChecked();
    await expect(page.getByTestId('radio-changes')).toHaveText('1');
  });

  test('right-to-left: the mark is at the inline start and the text after it', async ({ page }) => {
    const input = page.getByTestId('rd-off');
    const order = async () => {
      const mark = (await markOf(input).boundingBox())!;
      const label = (await rootOf(input).locator('.ads-radio-label').boundingBox())!;
      return mark.x < label.x ? 'mark-first' : 'text-first';
    };
    expect(await order()).toBe('mark-first');
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    expect(await order()).toBe('text-first');
  });

  test('prefers-reduced-motion: transitions are off', async ({ page }) => {
    const mark = markOf(page.getByTestId('rd-off'));
    expect(await computed(mark, 'transition-duration')).toBe('0s');
    expect(await computed(mark, 'transition-duration', '::after')).toBe('0s');
  });

  test('without the reduced-motion setting the transitions run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const mark = markOf(page.getByTestId('rd-off'));
    const duration = await resolveToken(page, 'transition-duration', '--ads-motion-duration');
    expect(await computed(mark, 'transition-duration')).toBe(`${duration}, ${duration}`);
  });

  test('the accessibility tree reports a radiogroup with radios and the checked one', async ({ page }) => {
    await expect(page.getByTestId('rd-on')).toHaveAccessibleName('On');
    expect(await page.getByTestId('rd-on').ariaSnapshot()).toContain('[checked]');
    expect(await page.getByTestId('rd-off').ariaSnapshot()).not.toContain('checked');
    const snapshot = await page.getByTestId('keys-1').ariaSnapshot();
    expect(snapshot).toContain('radiogroup "Keys one"');
    expect(snapshot).toMatch(/radio "k1a"/);
    expect(snapshot).toMatch(/radio "k1b" \[checked\]/);
  });

  test('events: a mouseenter listener on the root fires once while the pointer moves from the mark to the text', async ({ page }) => {
    const input = page.getByTestId('rd-off');
    const root = rootOf(input);
    await root.evaluate((element) => {
      const w = window as unknown as { __enter: number; __leave: number };
      w.__enter = 0;
      w.__leave = 0;
      element.addEventListener('mouseenter', () => w.__enter++);
      element.addEventListener('mouseleave', () => w.__leave++);
    });
    await root.scrollIntoViewIfNeeded();
    const mark = (await markOf(input).boundingBox())!;
    const text = (await root.locator('.ads-radio-label').boundingBox())!;
    await page.mouse.move(mark.x + mark.width / 2, mark.y + mark.height / 2);
    await page.mouse.move(text.x + text.width / 2, text.y + text.height / 2, { steps: 8 });
    await page.mouse.move(mark.x + mark.width / 2, mark.y + mark.height / 2, { steps: 8 });
    const counts = await page.evaluate(() => {
      const w = window as unknown as { __enter: number; __leave: number };
      return { enter: w.__enter, leave: w.__leave };
    });
    expect(counts).toEqual({ enter: 1, leave: 0 });
  });

  test('a tooltip around a radio stays open while the pointer moves from the mark to the text', async ({ page }) => {
    const input = page.getByTestId('rt-radio');
    await rootOf(input).scrollIntoViewIfNeeded();
    const mark = (await markOf(input).boundingBox())!;
    const text = (await rootOf(input).locator('.ads-radio-label').boundingBox())!;
    await page.mouse.move(mark.x + mark.width / 2, mark.y + mark.height / 2);
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.mouse.move(text.x + text.width / 2, text.y + text.height / 2, { steps: 8 });
    await page.waitForTimeout(300);
    await expect(page.getByRole('tooltip')).toBeVisible();
  });

  test('target size: the label is at least 22px high and the radios of a vertical group are at least 8px apart', async ({ page }) => {
    const label = (await rootOf(page.getByTestId('rd-off')).boundingBox())!;
    // 22px: the 14px font at a line height of 1.5714 is 21.98px.
    expect(label.height).toBeGreaterThanOrEqual(21.9);
    const items = page.getByTestId('rv-plain').locator('label');
    const [a, b] = [(await items.nth(0).boundingBox())!, (await items.nth(1).boundingBox())!];
    expect(b.y - (a.y + a.height)).toBeGreaterThanOrEqual(8);
  });
});

test.describe('RadioButton visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const buttonOf = (page: Page, group: string, name: string) => rootOf(inGroup(page, group, name));

  test('size: the buttons are 24, 32 and 40px high', async ({ page }) => {
    const height = async (group: string, name: string) => (await buttonOf(page, group, name).boundingBox())!.height;
    expect(await height('Small', 'Small A')).toBe(24);
    expect(await height('Outline', 'Outline A')).toBe(32);
    expect(await height('Large', 'Large A')).toBe(40);
  });

  test('size: the radius is 4, 6 and 8px and the border 1px', async ({ page }) => {
    expect(await computed(buttonOf(page, 'Small', 'Small A'), 'border-top-left-radius')).toBe('4px');
    expect(await computed(buttonOf(page, 'Outline', 'Outline A'), 'border-top-left-radius')).toBe('6px');
    expect(await computed(buttonOf(page, 'Large', 'Large A'), 'border-top-left-radius')).toBe('8px');
    expect(await computed(buttonOf(page, 'Outline', 'Outline A'), 'border-top-width')).toBe('1px');
  });

  test('outline: rest, checked, hover and checked hover use the tokens', async ({ page }) => {
    const rest = buttonOf(page, 'Outline', 'Outline A');
    const checked = buttonOf(page, 'Outline', 'Outline B');
    expect(await computed(rest, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-radio-button-border'));
    expect(await computed(rest, 'color')).toBe(await resolveToken(page, 'color', '--ads-radio-button-color'));
    expect(await computed(rest, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-button-bg'));
    expect(await computed(checked, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-color-primary-text'));
    expect(await computed(checked, 'color')).toBe(await resolveToken(page, 'color', '--ads-color-primary-text'));
    await rest.hover();
    expect(await computed(rest, 'color')).toBe(await resolveToken(page, 'color', '--ads-color-primary-text'));
    expect(await computed(rest, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-radio-button-border'));
    await checked.hover();
    expect(await computed(checked, 'color')).toBe(await resolveToken(page, 'color', '--ads-color-primary-text-hover'));
    expect(await computed(checked, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-color-primary-text-hover'));
  });

  test('solid: the checked button is filled, with hover and pressed fills', async ({ page }) => {
    const checked = buttonOf(page, 'Solid', 'Solid B');
    expect(await computed(checked, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-color-primary-solid'));
    expect(await computed(checked, 'color')).toBe(await resolveToken(page, 'color', '--ads-color-text-inverse'));
    await checked.hover();
    expect(await computed(checked, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-color-primary-solid-hover'));
    await page.mouse.down();
    expect(await computed(checked, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-color-primary-solid-active'));
    await page.mouse.up();
  });

  test('disabled: dimmed colours; a checked disabled button has its own background; a click does nothing', async ({ page }) => {
    const off = buttonOf(page, 'Disabled buttons', 'Disabled B');
    const on = buttonOf(page, 'Disabled buttons', 'Disabled A');
    expect(await computed(off, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-button-disabled-bg'));
    expect(await computed(off, 'color')).toBe(await resolveToken(page, 'color', '--ads-radio-button-disabled-color'));
    expect(await computed(on, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-button-checked-disabled-bg'));
    expect(await computed(off, 'cursor')).toBe('not-allowed');
    await off.click({ force: true });
    await expect(inGroup(page, 'Disabled buttons', 'Disabled B')).not.toBeChecked();
    const solid = buttonOf(page, 'Disabled solid', 'DSolid A');
    expect(await computed(solid, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-radio-button-checked-disabled-bg'));
  });

  test('the buttons of a group share a border and only the outer corners are round', async ({ page }) => {
    const [a, b, c] = ['Outline A', 'Outline B', 'Outline C'].map((name) => buttonOf(page, 'Outline', name));
    const [ra, rb] = [(await a.boundingBox())!, (await b.boundingBox())!];
    expect(Math.abs(rb.x - (ra.x + ra.width) + 1)).toBeLessThan(0.5);
    expect(await computed(a, 'border-top-left-radius')).toBe('6px');
    expect(await computed(a, 'border-top-right-radius')).toBe('0px');
    expect(await computed(b, 'border-top-left-radius')).toBe('0px');
    expect(await computed(b, 'border-top-right-radius')).toBe('0px');
    expect(await computed(c, 'border-top-right-radius')).toBe('6px');
    expect(await computed(c, 'border-bottom-right-radius')).toBe('6px');
  });

  test('a vertical group rounds the top corners of the first button and the bottom corners of the last', async ({ page }) => {
    const [a, b, c] = ['VB A', 'VB B', 'VB C'].map((name) => buttonOf(page, 'Vertical buttons', name));
    expect(await computed(a, 'border-top-left-radius')).toBe('6px');
    expect(await computed(a, 'border-top-right-radius')).toBe('6px');
    expect(await computed(a, 'border-bottom-left-radius')).toBe('0px');
    expect(await computed(b, 'border-top-left-radius')).toBe('0px');
    expect(await computed(c, 'border-bottom-left-radius')).toBe('6px');
    expect(await computed(c, 'border-top-right-radius')).toBe('0px');
    const [ra, rb] = [(await a.boundingBox())!, (await b.boundingBox())!];
    expect(Math.abs(rb.y - (ra.y + ra.height) + 1)).toBeLessThan(0.5);
    expect(Math.abs(rb.x - ra.x)).toBeLessThan(0.5);
  });

  test('focus-visible: keyboard focus draws the ring around the whole button, outside its border', async ({ page }) => {
    const color = await resolveToken(page, 'outline-color', '--ads-color-focus-outline');
    await page.keyboard.press('Tab');
    const input = inGroup(page, 'Outline', 'Outline B');
    await input.focus();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    expect(await computed(input, 'outline-color')).toBe(color);
    expect(await computed(input, 'outline-style')).toBe('solid');
    const [ring, button] = [(await input.boundingBox())!, (await buttonOf(page, 'Outline', 'Outline B').boundingBox())!];
    expect(Math.abs(ring.width - button.width)).toBeLessThan(0.5);
    expect(Math.abs(ring.height - button.height)).toBeLessThan(0.5);
  });

  test('a mouse click does not show the focus ring', async ({ page }) => {
    const input = inGroup(page, 'Outline', 'Outline A');
    await input.click({ force: true });
    await expect(input).toBeChecked();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
  });

  test('right-to-left: a group mirrors its corners', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    const a = buttonOf(page, 'Outline', 'Outline A');
    expect(await computed(a, 'border-top-right-radius')).toBe('6px');
    expect(await computed(a, 'border-top-left-radius')).toBe('0px');
    const [ra, rb] = [(await a.boundingBox())!, (await buttonOf(page, 'Outline', 'Outline B').boundingBox())!];
    expect(ra.x).toBeGreaterThan(rb.x);
  });

  test('prefers-reduced-motion: transitions are off', async ({ page }) => {
    expect(await computed(buttonOf(page, 'Outline', 'Outline A'), 'transition-duration')).toBe('0s');
  });
});

test.describe('Radio keyboard behavior in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const radio = (page: Page, group: string, name: string) => inGroup(page, group, name);

  test('Tab into a group lands on the checked radio, and the group is one Tab stop', async ({ page }) => {
    await page.getByTestId('keys-before').focus();
    await page.keyboard.press('Tab');
    await expect(radio(page, 'Keys one', 'k1b')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('keys-2').getByRole('radio').first()).toBeFocused();
    expect(await page.getByRole('radiogroup', { name: 'Keys one' }).getByRole('radio', { name: 'k1c' }).evaluate((element) => element === document.activeElement)).toBe(false);
  });

  test('Shift+Tab back into the group lands on the checked radio, not on the first', async ({ page }) => {
    await page.getByTestId('keys-after').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(radio(page, 'Keys three', 'k3a')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    // Keys two has nothing checked: the engines differ on which radio the focus enters, and each is a member of the group.
    const inTwo = await page.getByTestId('keys-2').getByRole('radio').evaluateAll((inputs) => inputs.some((input) => input === document.activeElement));
    expect(inTwo).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await expect(radio(page, 'Keys one', 'k1b')).toBeFocused();
  });

  test('with none checked Tab enters at the first radio of the group', async ({ page }) => {
    await radio(page, 'Keys one', 'k1b').focus();
    await page.keyboard.press('Tab');
    await expect(radio(page, 'Keys two', 'k2a')).toBeFocused();
    expect(await radio(page, 'Keys two', 'k2a').isChecked()).toBe(false);
  });

  test('the arrow keys move the focus and select, and stay in their group', async ({ page }) => {
    await radio(page, 'Keys one', 'k1b').focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'Keys one', 'k1c')).toBeChecked();
    await expect(radio(page, 'Keys one', 'k1c')).toBeFocused();
    await expect(page.getByTestId('keys-value')).toHaveText('k1c');
    await page.keyboard.press('ArrowUp');
    await expect(radio(page, 'Keys one', 'k1b')).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(radio(page, 'Keys one', 'k1a')).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(radio(page, 'Keys one', 'k1b')).toBeChecked();
    // Nothing of the neighbouring groups changed, and the focus never left.
    for (const name of ['k2a', 'k2b', 'k2c']) await expect(radio(page, 'Keys two', name)).not.toBeChecked();
    await expect(radio(page, 'Keys three', 'k3a')).toBeChecked();
    await expect(radio(page, 'Keys one', 'k1b')).toBeFocused();
  });

  // The ends of a group are the platform's: Chromium and Firefox wrap around, WebKit stops (measured on plain inputs of one
  // name, 2026-11-15). The group adds nothing, so it has to do exactly what native radios of one name do in this engine.
  test('at the ends of the group the arrow keys do exactly what native radios of one name do in this engine', async ({ page }) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'ArrowUp'];
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.innerHTML = ['a', 'b', 'c'].map((value) => `<input type="radio" name="native-probe" value="${value}" aria-label="probe ${value}" ${value === 'b' ? 'checked' : ''}>`).join('');
      document.body.append(form);
    });
    const checkedIndex = (group: Locator) => group.evaluateAll((inputs) => inputs.findIndex((input) => (input as HTMLInputElement).checked));
    const run = async (group: Locator) => {
      await group.nth(1).focus();
      const seen: number[] = [];
      for (const key of keys) {
        await page.keyboard.press(key);
        seen.push(await checkedIndex(group));
      }
      return seen;
    };
    const native = await run(page.locator('input[name=native-probe]'));
    const ours = await run(page.getByRole('radiogroup', { name: 'Keys one', exact: true }).getByRole('radio'));
    expect(ours).toEqual(native);
    expect(new Set(native).size).toBeGreaterThan(1);
  });

  test('the arrow keys skip a disabled radio', async ({ page }) => {
    await radio(page, 'Keys three', 'k3a').focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'Keys three', 'k3c')).toBeChecked();
    await expect(radio(page, 'Keys three', 'k3b')).not.toBeChecked();
  });

  test('after an arrow key, Tab away and Shift+Tab back: the focus is on the checked radio', async ({ page }) => {
    await radio(page, 'Keys one', 'k1b').focus();
    await page.keyboard.press('ArrowRight');
    await expect(radio(page, 'Keys one', 'k1c')).toBeChecked();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(radio(page, 'Keys one', 'k1c')).toBeFocused();
  });

  test('Space selects the focused radio; Enter does nothing', async ({ page }) => {
    await radio(page, 'Keys two', 'k2b').focus();
    await page.keyboard.press('Enter');
    await expect(radio(page, 'Keys two', 'k2b')).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(radio(page, 'Keys two', 'k2b')).toBeChecked();
  });

  test('a click selects, and the previous radio of the group is unchecked in the view and in the state', async ({ page }) => {
    await radio(page, 'Keys one', 'k1c').click();
    await expect(radio(page, 'Keys one', 'k1c')).toBeChecked();
    await expect(radio(page, 'Keys one', 'k1b')).not.toBeChecked();
    await expect(page.getByTestId('keys-value')).toHaveText('k1c');
  });
});

const LAYOUT_SELECTOR = '[data-testid=radio-layout] > *, [data-testid=radio-layout] label';

test.describe('Radio layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  /** The boxes of everything in the layout demo, so a changed size or a moved neighbour shows. */
  const layoutOf = (page: Page) =>
    page.locator(LAYOUT_SELECTOR).evaluateAll((elements) =>
      elements.map((element) => {
        // Page coordinates: clicking scrolls the page, which moves every viewport coordinate.
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
      })
    );

  test('selecting a radio does not change a size or move a neighbour, with labels of different width', async ({ page }) => {
    const before = await layoutOf(page);
    expect(before.length).toBeGreaterThan(10);
    for (const name of ['Sad', 'A considerably longer label than the others', 'Happy']) {
      await inGroup(page, 'Layout plain', name).click();
      await expect(inGroup(page, 'Layout plain', name)).toBeChecked();
      expect(await layoutOf(page), name).toEqual(before);
    }
  });

  test('selecting a button does not change a size or move a neighbour, in the medium and the small size', async ({ page }) => {
    const before = await layoutOf(page);
    for (const name of ['Sad', 'A considerably longer label than the others', 'Happy']) {
      await inGroup(page, 'Layout buttons', name).click({ force: true });
      await expect(inGroup(page, 'Layout buttons', name)).toBeChecked();
      expect(await layoutOf(page), name).toEqual(before);
    }
    for (const name of ['Happy', 'Sad']) {
      await inGroup(page, 'Layout small', name).click({ force: true });
      expect(await layoutOf(page), `small ${name}`).toEqual(before);
    }
  });

  test('disabling the groups does not change a size or move a neighbour', async ({ page }) => {
    const before = await layoutOf(page);
    await page.getByTestId('rl-toggle-disabled').click();
    await expect(inGroup(page, 'Layout plain', 'Sad')).toBeDisabled();
    expect(await layoutOf(page)).toEqual(before);
    await page.getByTestId('rl-toggle-disabled').click();
    expect(await layoutOf(page)).toEqual(before);
  });

  test('no frame of the animation changes the size of a plain radio or of a button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const [group, name] of [['Layout plain', 'A considerably longer label than the others'], ['Layout buttons', 'Sad']] as const) {
      const sizes = await inGroup(page, group, name).evaluate(async (element) => {
        const items = Array.from((element.closest('[role=radiogroup]') as HTMLElement).querySelectorAll('label'));
        const read = () => items.map((item) => `${Math.round(item.getBoundingClientRect().width * 100) / 100}x${Math.round(item.getBoundingClientRect().height * 100) / 100}`).join('|');
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
      expect(sizes, `${group} ${name}`).toHaveLength(1);
    }
  });

  test('the buttons of one row are as high as the tallest, and the widths follow the texts', async ({ page }) => {
    const rects = await page.getByRole('radiogroup', { name: 'Layout buttons', exact: true }).locator('label').evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect()).map((r) => [r.width, r.height]));
    expect(new Set(rects.map(([, height]) => height)).size).toBe(1);
    expect(rects[2][0]).toBeGreaterThan(rects[0][0] * 3);
  });

  test('a group that does not fit moves its items to the next line, plain radios and buttons alike', async ({ page }) => {
    for (const group of ['Layout plain', 'Layout buttons']) {
      const root = page.getByRole('radiogroup', { name: group, exact: true });
      await root.evaluate((element) => {
        (element as HTMLElement).style.width = '220px';
      });
      const box = (await root.boundingBox())!;
      const rows = await root.locator('label').evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect()).map((r) => ({ y: Math.round(r.y), right: r.right })));
      expect(new Set(rows.map((row) => row.y)).size, `${group}: items on more than one line`).toBeGreaterThan(1);
      for (const row of rows) expect(row.right, `${group}: nothing sticks out of the group`).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
  });

  test('a multi-line label keeps the mark at the top', async ({ page }) => {
    const input = page.getByTestId('rd-long');
    await page.evaluate(() => {
      (document.querySelector('[data-testid=rd-long]')!.closest('label') as HTMLElement).style.width = '120px';
    });
    const root = (await rootOf(input).boundingBox())!;
    const mark = (await markOf(input).boundingBox())!;
    expect(root.height).toBeGreaterThan(30);
    expect(mark.y - root.y).toBeLessThan(5);
  });

  test('a vertical group has no trailing margin: the last item ends where the group ends, and the items share a left edge', async ({ page }) => {
    const group = (await page.getByTestId('rv-plain').boundingBox())!;
    const items = page.getByTestId('rv-plain').locator('label');
    const [first, last] = [(await items.nth(0).boundingBox())!, (await items.nth(2).boundingBox())!];
    expect(Math.abs(last.y + last.height - (group.y + group.height))).toBeLessThan(0.5);
    expect(Math.abs(first.x - last.x)).toBeLessThan(0.5);
    expect(last.y).toBeGreaterThan(first.y + first.height);
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Radio contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await installContrastHelpers(page);
    });

    const PLAIN = ['rd-off', 'rd-on', 'rd-bare'];
    const BUTTONS = [
      ['Outline', 'Outline A'],
      ['Outline', 'Outline B'],
      ['Solid', 'Solid A'],
      ['Solid', 'Solid B'],
      ['Large', 'Large A'],
      ['Small', 'Small A']
    ] as const;

    async function plainFailures(page: Page, prepare: (target: Locator) => Promise<void>, after?: () => Promise<void>) {
      const failures: string[] = [];
      for (const id of PLAIN) {
        const target = page.getByTestId(id);
        await prepare(target);
        const { border, fill, dot } = await target.evaluate((element) => (window as unknown as { __radioContrast(e: Element): { border: number; fill: number | null; dot: number | null } }).__radioContrast(element));
        if (after) await after();
        if (border < 3) failures.push(`${id} border/page ${border.toFixed(2)}`);
        if (fill !== null && fill < 3) failures.push(`${id} fill/page ${fill.toFixed(2)}`);
        if (dot !== null && dot < 3) failures.push(`${id} dot/fill ${dot.toFixed(2)}`);
      }
      return failures;
    }

    async function buttonFailures(page: Page, prepare: (target: Locator) => Promise<void>, after?: () => Promise<void>) {
      const failures: string[] = [];
      for (const [group, name] of BUTTONS) {
        const target = inGroup(page, group, name);
        await prepare(target);
        const { border, text } = await target.evaluate((element) => (window as unknown as { __buttonContrast(e: Element): { border: number; text: number } }).__buttonContrast(element));
        if (after) await after();
        if (border < 3) failures.push(`${name} border/page ${border.toFixed(2)}`);
        if (text < 4.5) failures.push(`${name} text ${text.toFixed(2)}`);
      }
      return failures;
    }

    test('rest: the mark border, the fill and the dot reach 3:1; the button border 3:1 and its text 4.5:1', async ({ page }) => {
      expect(await plainFailures(page, async () => {})).toEqual([]);
      expect(await buttonFailures(page, async () => {})).toEqual([]);
    });

    test('hover: the same ratios hold', async ({ page }) => {
      expect(await plainFailures(page, (target) => rootOf(target).hover())).toEqual([]);
      expect(await buttonFailures(page, (target) => rootOf(target).hover())).toEqual([]);
    });

    test('pressed: the same ratios hold', async ({ page }) => {
      const press = async (target: Locator) => {
        await rootOf(target).hover();
        await page.mouse.down();
      };
      expect(await plainFailures(page, press, () => page.mouse.up())).toEqual([]);
      expect(await buttonFailures(page, press, () => page.mouse.up())).toEqual([]);
    });

    test('keyboard focus: the ring reaches 3:1 around the mark and around a button', async ({ page }) => {
      const failures: string[] = [];
      await page.keyboard.press('Tab');
      for (const id of PLAIN) {
        const target = page.getByTestId(id);
        await target.focus();
        const ring = await markOf(target).evaluate((element) => (window as unknown as { __ringContrast(e: Element): number }).__ringContrast(element));
        if (ring < 3) failures.push(`${id} ring ${ring.toFixed(2)}`);
      }
      for (const [group, name] of BUTTONS) {
        const target = inGroup(page, group, name);
        await target.focus();
        const ring = await target.evaluate((element) => (window as unknown as { __ringContrast(e: Element, outer: Element): number }).__ringContrast(element, element.parentElement!));
        if (ring < 3) failures.push(`${name} ring ${ring.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });
  });
}

// The default colors are Ant Design's own. The fixture loads tokens-accessible.css for the contrast tests above,
// so these tests take it out of the page and look at what a consumer gets with tokens.css alone.
test.describe('Radio default colors (tokens.css alone)', () => {
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
    const input = page.getByTestId('rd-off');
    expect(await computed(markOf(input), 'border-top-color')).toBe('rgb(217, 217, 217)');
    await rootOf(input).hover();
    await expect.poll(() => computed(markOf(input), 'border-top-color')).toBe('rgb(22, 119, 255)');
  });

  test('checked: the fill is #1677ff and #4096ff on hover, with a white 6px dot', async ({ page }) => {
    const input = page.getByTestId('rd-on');
    expect(await computed(markOf(input), 'background-color')).toBe('rgb(22, 119, 255)');
    expect(await computed(markOf(input), 'background-color', '::after')).toBe('rgb(255, 255, 255)');
    await rootOf(input).hover();
    await expect.poll(() => computed(markOf(input), 'background-color')).toBe('rgb(64, 150, 255)');
  });

  test('disabled: the mark is rgba(0, 0, 0, 0.04) with a #d9d9d9 border', async ({ page }) => {
    const mark = markOf(page.getByTestId('rd-disabled'));
    expect(await computed(mark, 'background-color')).toBe('rgba(0, 0, 0, 0.04)');
    expect(await computed(mark, 'border-top-color')).toBe('rgb(217, 217, 217)');
  });

  test('outline button: #d9d9d9 border, #1677ff text and border when checked, #4096ff on hover', async ({ page }) => {
    const rest = rootOf(inGroup(page, 'Outline', 'Outline A'));
    const checked = rootOf(inGroup(page, 'Outline', 'Outline B'));
    expect(await computed(rest, 'border-top-color')).toBe('rgb(217, 217, 217)');
    expect(await computed(checked, 'color')).toBe('rgb(22, 119, 255)');
    expect(await computed(checked, 'border-top-color')).toBe('rgb(22, 119, 255)');
    await checked.hover();
    await expect.poll(() => computed(checked, 'color')).toBe('rgb(64, 150, 255)');
  });

  test('solid button: #1677ff fill with white text, #4096ff on hover and #0958d9 pressed', async ({ page }) => {
    const checked = rootOf(inGroup(page, 'Solid', 'Solid B'));
    expect(await computed(checked, 'background-color')).toBe('rgb(22, 119, 255)');
    expect(await computed(checked, 'color')).toBe('rgb(255, 255, 255)');
    await checked.hover();
    await expect.poll(() => computed(checked, 'background-color')).toBe('rgb(64, 150, 255)');
    await page.mouse.down();
    await expect.poll(() => computed(checked, 'background-color')).toBe('rgb(9, 88, 217)');
    await page.mouse.up();
  });

  test('disabled buttons: rgba(0, 0, 0, 0.04) background; checked and disabled rgba(0, 0, 0, 0.15)', async ({ page }) => {
    expect(await computed(rootOf(inGroup(page, 'Disabled buttons', 'Disabled B')), 'background-color')).toBe('rgba(0, 0, 0, 0.04)');
    expect(await computed(rootOf(inGroup(page, 'Disabled buttons', 'Disabled A')), 'background-color')).toBe('rgba(0, 0, 0, 0.15)');
  });
});

// Touch: a tap is a click.
test.describe('Radio with a touch screen', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('a tap on the mark and a tap on the text select a radio', async ({ page }) => {
    const input = page.getByTestId('rd-counted');
    await input.tap();
    await expect(input).toBeChecked();
    await expect(page.getByTestId('radio-changes')).toHaveText('1');
    const second = page.getByTestId('rd-off');
    await rootOf(second).locator('.ads-radio-label').tap();
    await expect(second).toBeChecked();
  });

  // The hover colour may stay on the tapped control until the next tap elsewhere (a touch screen keeps :hover after a tap, as it
  // does for every component of the library and for Ant Design); that is not asserted either way.
  test('a tap on a button of a group moves the selection', async ({ page }) => {
    await rootOf(inGroup(page, 'Outline', 'Outline A')).tap();
    await expect(inGroup(page, 'Outline', 'Outline A')).toBeChecked();
    await expect(inGroup(page, 'Outline', 'Outline B')).not.toBeChecked();
    await expect(inGroup(page, 'Solid', 'Solid B')).toBeChecked();
  });

  test('a tap on the text of a plain group selects it and the ring stays off', async ({ page }) => {
    const label = rootOf(inGroup(page, 'Keys two', 'k2c'));
    await label.tap();
    await expect(inGroup(page, 'Keys two', 'k2c')).toBeChecked();
    expect(await inGroup(page, 'Keys two', 'k2c').evaluate((element) => element.matches(':focus-visible'))).toBe(false);
  });
});
