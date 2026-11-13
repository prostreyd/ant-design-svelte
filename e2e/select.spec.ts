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

async function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
}

type Box = { x: number; y: number; width: number; height: number };
const box = (locator: Locator): Promise<Box> =>
  locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100 };
  });

const hasClass = (name: string) => `contains(concat(" ", normalize-space(@class), " "), " ${name} ")`;
/** `data-testid` goes to the focused element; the root is the field around it. */
const rootOf = (field: Locator) => field.locator(`xpath=ancestor::div[${hasClass('ads-select')}][1]`);
/** The open panel (the one that is shown). */
const panelOf = (page: Page) => page.locator('.ads-popup:not([hidden])').last();
const optionsOf = (page: Page) => panelOf(page).getByRole('option');

test.beforeEach(async ({ page }) => {
  // Colors are read after the transition and sizes without the scaling of the panel's enter animation, which would
  // be the value of one frame of it. The test of the motion itself turns the preference off.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#select');
  await expect(page.getByTestId('single')).toBeVisible();
});

test.describe('Select visual states', () => {
  test('sizes: the field is 40, 32 and 24px high, single and with a tag, with the radius of its size', async ({ page }) => {
    for (const [size, height, radius] of [['large', 40, '8px'], ['medium', 32, '6px'], ['small', 24, '4px']] as const) {
      const single = rootOf(page.getByTestId(`size-${size}`));
      const multi = rootOf(page.getByTestId(`size-${size}-multi`));
      const empty = rootOf(page.getByTestId(`size-${size}-empty`));
      expect((await box(single)).height, `${size} single`).toBe(height);
      expect((await box(multi)).height, `${size} with a tag`).toBe(height);
      expect((await box(empty)).height, `${size} with the placeholder`).toBe(height);
      expect(await computed(single, 'border-top-left-radius')).toBe(radius);
    }
  });

  test('rest: a 1px border from the token, the font of the page and the text color of the tokens', async ({ page }) => {
    const root = rootOf(page.getByTestId('size-medium'));
    expect(await computed(root, 'border-top-width')).toBe('1px');
    expect(await computed(root, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border'));
    expect(await computed(root, 'cursor')).toBe('pointer');
    expect(await computed(page.getByTestId('size-medium'), 'font-size')).toBe('14px');
  });

  test('hover: the border takes the hover color', async ({ page }) => {
    const root = rootOf(page.getByTestId('size-medium'));
    await root.hover();
    expect(await computed(root, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-hover'));
  });

  test('focus: the border takes the active color and the ring; a mouse press shows it too; so does the open list', async ({ page }) => {
    const field = page.getByTestId('size-medium');
    const root = rootOf(field);
    await field.focus();
    expect(await computed(root, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-active'));
    expect(await computed(root, 'box-shadow')).not.toBe('none');
    await page.getByTestId('before').focus();
    await root.click();
    expect(await computed(root, 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-border-active'));
    await expect(panelOf(page)).toBeVisible();
  });

  test('focus: the borderless field draws the focus outline', async ({ page }) => {
    const field = page.getByTestId('variant-borderless');
    await field.focus();
    expect(await computed(rootOf(field), 'outline-style')).toBe('solid');
  });

  test('variants: filled has a background, underlined only a bottom border, borderless nothing', async ({ page }) => {
    const filled = rootOf(page.getByTestId('variant-filled'));
    expect(await computed(filled, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-filled-bg'));
    const underlined = rootOf(page.getByTestId('variant-underlined'));
    expect(await computed(underlined, 'border-top-width')).toBe('0px');
    expect(await computed(underlined, 'border-bottom-width')).toBe('1px');
    const borderless = rootOf(page.getByTestId('variant-borderless'));
    expect(await computed(borderless, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test('status: error and warning take their border colors', async ({ page }) => {
    expect(await computed(rootOf(page.getByTestId('status-error')), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-error'));
    expect(await computed(rootOf(page.getByTestId('status-warning')), 'border-top-color')).toBe(await resolveToken(page, 'border-top-color', '--ads-input-warning'));
  });

  test('disabled: dimmed colors, the not-allowed cursor, no hover color, no focus, does not open', async ({ page }) => {
    const field = page.getByTestId('disabled-select');
    const root = rootOf(field);
    const rest = await computed(root, 'border-top-color');
    expect(await computed(root, 'cursor')).toBe('not-allowed');
    expect(await computed(root, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-input-disabled-bg'));
    await root.hover();
    expect(await computed(root, 'border-top-color')).toBe(rest);
    await root.click({ force: true });
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    expect(await field.evaluate((element) => element === document.activeElement)).toBe(false);
  });

  test('the panel: the surface, the radius, the shadow, and the highlighted and selected rows of the tokens', async ({ page }) => {
    await page.getByTestId('size-medium').click();
    const panel = panelOf(page).locator('.ads-select-popup');
    expect(await computed(panel, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-select-popup-bg'));
    expect(await computed(panel, 'border-top-left-radius')).toBe('8px');
    expect(await computed(panel, 'box-shadow')).not.toBe('none');
    const selected = optionsOf(page).first();
    expect(await selected.getAttribute('aria-selected')).toBe('true');
    expect(await computed(selected, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-select-option-selected-bg'));
    expect(await computed(selected, 'font-weight')).toBe('600');
    const other = optionsOf(page).nth(1);
    await other.hover();
    expect(await computed(other, 'background-color')).toBe(await resolveToken(page, 'background-color', '--ads-select-option-active-bg'));
    expect(await computed(optionsOf(page).nth(3), 'color')).toBe(await resolveToken(page, 'color', '--ads-color-text-disabled'));
    expect(await computed(optionsOf(page).first(), 'min-height')).toBe('32px');
  });

  test('prefers-reduced-motion: no transition on the field; without it the transition runs', async ({ page }) => {
    const root = rootOf(page.getByTestId('size-medium'));
    expect(await computed(root, 'transition-property')).toBe('none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await computed(root, 'transition-duration')).not.toBe('0s');
    await page.getByTestId('size-medium').click();
    const animation = await panelOf(page).locator('.ads-popup-frame').evaluate((element) => getComputedStyle(element).animationName);
    expect(animation).toMatch(/ads-popup-in$/);
  });
});

test.describe('Select layout', () => {
  /** The field and its two neighbours, as boxes. */
  async function measure(page: Page) {
    return {
      root: await box(page.getByTestId('single-slot')),
      field: await box(rootOf(page.getByTestId('single'))),
      before: await box(page.getByTestId('before')),
      after: await box(page.getByTestId('after'))
    };
  }

  test('choosing labels of very different width ("Happy", "Sad", a long one) changes no size and moves no neighbour', async ({ page }) => {
    const empty = await measure(page);
    const seen = [empty];
    for (const name of ['Happy', 'Sad', 'A very long label that does not fit into a narrow field at all']) {
      await page.getByTestId('single').click();
      await optionsOf(page).filter({ hasText: name }).first().click();
      await expect(page.getByTestId('single')).toContainText(name.slice(0, 5));
      seen.push(await measure(page));
    }
    for (const state of seen) expect(state).toEqual(empty);
  });

  test('a long label is cut with an ellipsis and never widens the field', async ({ page }) => {
    await page.getByTestId('single').click();
    await optionsOf(page).filter({ hasText: 'A very long' }).click();
    const item = rootOf(page.getByTestId('single')).locator('.ads-select-item');
    const overflow = await item.evaluate((element) => ({ cut: element.scrollWidth > element.clientWidth, ellipsis: getComputedStyle(element).textOverflow }));
    expect(overflow).toEqual({ cut: true, ellipsis: 'ellipsis' });
    expect((await box(rootOf(page.getByTestId('single')))).width).toBe(240);
  });

  test('opening, closing, loading, the clear button and disabled change no size and move no neighbour', async ({ page }) => {
    await page.getByTestId('set-happy').click();
    const rest = await measure(page);
    await page.getByTestId('single').click();
    await expect(panelOf(page)).toBeVisible();
    expect(await measure(page), 'open').toEqual(rest);
    await page.keyboard.press('Escape');
    expect(await measure(page), 'closed').toEqual(rest);
    await page.getByTestId('toggle-loading').click();
    expect(await measure(page), 'loading').toEqual(rest);
    await page.getByTestId('toggle-loading').click();
    await page.getByTestId('set-none').click();
    expect(await measure(page), 'cleared').toEqual(rest);
    await page.getByTestId('toggle-disabled').click();
    expect(await measure(page), 'disabled').toEqual(rest);
  });

  test('loading: no frame of the spinner animation changes the size of the field', async ({ page }) => {
    await page.evaluate(() => (window as unknown as { __selectLab: { set(patch: object): void } }).__selectLab.set({ loading: true }));
    const sizes = await rootOf(page.getByTestId('single')).evaluate(
      (root) =>
        new Promise<string[]>((resolve) => {
          const seen = new Set<string>();
          const start = performance.now();
          const tick = () => {
            const r = root.getBoundingClientRect();
            seen.add(`${r.width}x${r.height}`);
            if (performance.now() - start < 600) requestAnimationFrame(tick);
            else resolve([...seen]);
          };
          tick();
        })
    );
    expect(sizes).toHaveLength(1);
  });

  test('no frame of the opening, closing and selecting animations changes the field or moves a neighbour', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByTestId('set-happy').click();
    // One sample per animation frame of the field and its neighbours while the script runs the actions.
    const frames = await page.evaluate(async () => {
      const lab = document.querySelector('[data-testid=single]') as HTMLElement;
      const root = lab.closest('.ads-select') as HTMLElement;
      const before = document.querySelector('[data-testid=before]') as HTMLElement;
      const after = document.querySelector('[data-testid=after]') as HTMLElement;
      const key = () =>
        [root, before, after]
          .map((element) => {
            const r = element.getBoundingClientRect();
            return `${r.x},${r.y},${r.width},${r.height}`;
          })
          .join('|');
      const seen = new Set<string>();
      let running = true;
      const sample = () => {
        seen.add(key());
        if (running) requestAnimationFrame(sample);
      };
      sample();
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const press = (target: Element, type: string, init: object = {}) => target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }));
      press(root, 'mousedown');
      await wait(350);
      document.querySelector<HTMLElement>('.ads-popup:not([hidden]) [role=option]:nth-child(2)')!.click();
      await wait(350);
      press(root, 'mousedown');
      await wait(350);
      lab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await wait(350);
      running = false;
      return [...seen];
    });
    expect(frames).toHaveLength(1);
  });

  test('with tags the field grows only by wrapped rows, never when the list opens or text is typed', async ({ page }) => {
    const field = page.getByTestId('multiple');
    const root = rootOf(field);
    const one = (await box(root)).height;
    expect(one).toBe(32);
    await field.click();
    const open = (await box(root)).height;
    expect(open).toBe(one);
    await field.fill('a');
    expect((await box(root)).height).toBe(one);
    await field.fill('');
    for (const name of ['Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken']) await optionsOf(page).filter({ hasText: name }).click();
    const grown = (await box(root)).height;
    expect(grown).toBeGreaterThan(one);
    // Rows of 24px tags with 4px between them, in the padding of 3px: 6 + 2 (borders) + rows * 24 + (rows - 1) * 4.
    expect((grown - 8 + 4) % 28).toBe(0);
    await field.fill('xyz');
    expect((await box(root)).height).toBe(grown);
  });

  test('the placeholder of a field with tags does not make the tags wrap, and the field keeps its height', async ({ page }) => {
    const root = rootOf(page.getByTestId('size-medium-empty'));
    expect((await box(root)).height).toBe(32);
    const placeholder = await root.locator('.ads-select-placeholder').evaluate((element) => getComputedStyle(element).position);
    expect(placeholder).toBe('absolute');
  });
});

test.describe('Select panel', () => {
  test('the panel is at least as wide as the field, and a number sets a width beyond that', async ({ page }) => {
    await page.getByTestId('size-medium').click();
    const field = await box(rootOf(page.getByTestId('size-medium')));
    expect((await box(panelOf(page))).width).toBeGreaterThanOrEqual(field.width);
    await page.keyboard.press('Escape');
    await page.getByTestId('wide-panel').click();
    expect((await box(panelOf(page))).width).toBeGreaterThanOrEqual(360);
  });

  test('the panel opens under the field with the left edges aligned and a small gap', async ({ page }) => {
    await page.getByTestId('single').click();
    const field = await box(rootOf(page.getByTestId('single')));
    const panel = await box(panelOf(page));
    expect(Math.abs(panel.x - field.x)).toBeLessThanOrEqual(1);
    expect(panel.y - (field.y + field.height)).toBeGreaterThanOrEqual(3);
    expect(panel.y - (field.y + field.height)).toBeLessThanOrEqual(5);
  });

  test('a field at the bottom of the page opens its panel upwards', async ({ page }) => {
    await page.getByTestId('bottom').scrollIntoViewIfNeeded();
    await page.getByTestId('bottom').click();
    const field = await box(rootOf(page.getByTestId('bottom')));
    const panel = await box(panelOf(page));
    expect(panel.y + panel.height).toBeLessThanOrEqual(field.y + 1);
  });

  test('the panel follows the field when the page scrolls', async ({ page }) => {
    await page.getByTestId('single').click();
    const before = await box(panelOf(page));
    await page.evaluate(() => window.scrollBy(0, 40));
    await expect.poll(async () => (await box(panelOf(page))).y).toBeCloseTo(before.y - 40, 0);
  });

  test('the wheel over an open list that fits moves the page, over a list that scrolls it stays in the list at its end', async ({ page, browserName }) => {
    const wheelOver = async (list: Locator, dy: number) => {
      const at = await box(list);
      await page.mouse.move(at.x + at.width / 2, at.y + Math.min(at.height, 60) / 2);
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, dy);
      await page.waitForTimeout(300);
      return (await page.evaluate(() => window.scrollY)) - before;
    };
    // Four short rows: nothing to scroll in the list, so it does not keep the wheel, and the page moves under the cursor.
    await page.getByTestId('single').click();
    const short = panelOf(page).getByRole('listbox');
    expect(await computed(short, 'overscroll-behavior-y')).toBe('auto');
    expect(await wheelOver(short, 120)).toBeGreaterThan(60);
    await page.keyboard.press('Escape');
    // A list of 60 rows keeps it.
    await page.getByTestId('long').click();
    const long = panelOf(page).getByRole('listbox');
    await expect(long).toHaveAttribute('data-scrollable', '');
    expect(await computed(long, 'overscroll-behavior-y')).toBe('contain');
    // Firefox 159 under automation lets the wheel through at the end of a box with `overscroll-behavior: contain`, on
    // a plain page with none of our code as well (checked), so the wheel itself is asserted in the other two engines.
    if (browserName !== 'firefox') {
      await long.evaluate((element) => (element.scrollTop = element.scrollHeight));
      expect(await wheelOver(long, 200)).toBe(0);
    }
  });

  test('listHeight: a long list is as high as the limit and scrolls', async ({ page }) => {
    await page.getByTestId('long').click();
    const list = panelOf(page).getByRole('listbox');
    expect((await box(list)).height).toBe(160);
    expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  });

  test('a press on an option keeps the focus in the field, and the field takes focus when the arrow is pressed', async ({ page }) => {
    await page.getByTestId('single').click();
    await optionsOf(page).first().hover();
    await page.mouse.down();
    expect(await page.getByTestId('single').evaluate((element) => element === document.activeElement)).toBe(true);
    await page.mouse.up();
    await page.keyboard.press('Escape');
    await page.getByTestId('before').focus();
    await rootOf(page.getByTestId('single')).locator('.ads-select-suffix').click();
    expect(await page.getByTestId('single').evaluate((element) => element === document.activeElement)).toBe(true);
    await expect(panelOf(page)).toBeVisible();
  });

  test('the panel keeps the highlighted option in view when the arrow keys go down a long list', async ({ page }) => {
    await page.getByTestId('long').focus();
    await page.keyboard.press('ArrowDown');
    for (let index = 0; index < 11; index++) await page.keyboard.press('ArrowDown');
    const inView = await page.evaluate(() => {
      const active = document.querySelector('.ads-popup:not([hidden]) .ads-select-option-active') as HTMLElement;
      const list = active.closest('[role=listbox]') as HTMLElement;
      const a = active.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      return a.top >= l.top - 1 && a.bottom <= l.bottom + 1;
    });
    expect(inView).toBe(true);
  });

  test('right-to-left: the prefix is at the inline start, and the panel opens aligned to the inline start edge of the field', async ({ page }) => {
    const root = rootOf(page.getByTestId('rtl'));
    const prefix = await box(root.locator('.ads-select-prefix'));
    const rootBox = await box(root);
    expect(prefix.x + prefix.width).toBeGreaterThan(rootBox.x + rootBox.width / 2);
    await page.getByTestId('rtl').click();
    const panel = await box(panelOf(page));
    // bottomLeft is mirrored: with the inline start on the right, the panel lines up with the right edge of the field.
    expect(Math.abs(panel.x + panel.width - (rootBox.x + rootBox.width))).toBeLessThanOrEqual(1);
  });
});

test.describe('Select keyboard in a real browser', () => {
  test('Tab reaches the field, ArrowDown opens, the arrows move, Enter selects, the focus stays; Escape closes without selecting', async ({ page }) => {
    await page.getByTestId('before').focus();
    await page.keyboard.press('Tab');
    expect(await page.getByTestId('single').evaluate((element) => element === document.activeElement)).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(panelOf(page)).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('single-value')).toHaveText('sad');
    expect(await page.getByTestId('single').evaluate((element) => element === document.activeElement)).toBe(true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    await expect(page.getByTestId('single-value')).toHaveText('sad');
  });

  test('Tab with the list open closes it, leaves the value and moves the focus on', async ({ page }) => {
    await page.getByTestId('single').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    await expect(page.getByTestId('single-value')).toHaveText('undefined');
    expect(await page.getByTestId('single').evaluate((element) => element === document.activeElement)).toBe(false);
  });

  test('typing characters on a field that cannot search goes to the option that starts with them', async ({ page }) => {
    await page.getByTestId('single').focus();
    await page.keyboard.press('s');
    await expect(optionsOf(page).nth(1)).toHaveClass(/ads-select-option-active/);
  });

  test('a field that searches: typing filters the list, Enter selects the first match, the text is cleared and the label shows', async ({ page }) => {
    const field = page.getByTestId('search');
    await field.click();
    await page.keyboard.type('sa');
    await expect(optionsOf(page)).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(rootOf(field).locator('.ads-select-item')).toHaveText('Sad');
    await expect(field).toHaveValue('');
    expect(await rootOf(field).locator('.ads-select-item').evaluate((element) => getComputedStyle(element).visibility)).toBe('visible');
  });

  test('tags: Enter adds the typed text, a separator ends a token, the Backspace key removes the last tag', async ({ page }) => {
    const field = page.getByTestId('tags');
    await field.click();
    await page.keyboard.type('zed');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('tags-value')).toHaveText('["zed"]');
    await field.fill('Ada,Grace,');
    await expect(page.getByTestId('tags-value')).toHaveText('["zed","Ada","Grace"]');
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('tags-value')).toHaveText('["zed","Ada"]');
  });

  test('multiple: choosing keeps the list open; a press on a remove button removes the tag and does not open the list', async ({ page }) => {
    const field = page.getByTestId('multiple');
    await field.click();
    await optionsOf(page).filter({ hasText: 'Linus' }).click();
    await expect(page.getByTestId('multi-value')).toHaveText('["Ada","Grace","Linus"]');
    await expect(panelOf(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    await rootOf(field).getByLabel('Remove Ada').click();
    await expect(page.getByTestId('multi-value')).toHaveText('["Grace","Linus"]');
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    expect(await field.evaluate((element) => element === document.activeElement)).toBe(true);
  });

  test('the clear button empties the value, keeps the focus in the field and does not open the list', async ({ page }) => {
    await page.getByTestId('set-happy').click();
    const field = page.getByTestId('single');
    await rootOf(field).getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('single-value')).toHaveText('undefined');
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
    expect(await field.evaluate((element) => element === document.activeElement)).toBe(true);
  });

  test('a press outside closes the list', async ({ page }) => {
    await page.getByTestId('single').click();
    await expect(panelOf(page)).toBeVisible();
    await page.getByTestId('after').click();
    await expect(page.locator('.ads-popup:not([hidden])')).toHaveCount(0);
  });

  test('bind:open and onopenchange: the parent opens the list, and a user closing it is reported once', async ({ page }) => {
    await page.getByTestId('controlled-open').click();
    await expect(page.getByTestId('open-value')).toHaveText('true');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('open-value')).toHaveText('false');
    await expect(page.getByTestId('log')).toHaveText('openchange,openchange');
  });
});

test.describe('Select options written as markup in a real browser', () => {
  const texts = (page: Page) => optionsOf(page).allTextContents().then((all) => all.map((text) => text.trim()));

  test('the order of the options is the order of the markup, also for an option inserted in the middle and for a moved one', async ({ page }) => {
    await page.getByTestId('markup').click();
    expect(await texts(page)).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
    await page.keyboard.press('Escape');
    await page.getByTestId('markup-insert').click();
    await page.getByTestId('markup-reverse').click();
    await page.getByTestId('markup').click();
    expect(await texts(page)).toEqual(['Option A', 'Middle', 'Option D', 'Option C', 'Option B']);
  });

  test('the label of the initial value shows while the list is closed', async ({ page }) => {
    await expect(rootOf(page.getByTestId('markup')).locator('.ads-select-item')).toHaveText('Option B');
  });
});


test.describe('Select on a touch screen', () => {
  test.use({ hasTouch: true });

  test('the list stays open while a finger scrolls the page, and closes on a tap outside, or on choosing an option', async ({ page }) => {
    const open = () => page.locator('.ads-popup:not([hidden])').count();
    const field = await box(rootOf(page.getByTestId('single')));
    await page.touchscreen.tap(field.x + 20, field.y + field.height / 2);
    await expect.poll(open).toBe(1);

    // A finger goes down outside and the browser takes it for scrolling: it cancels the pointer.
    const outside = { x: 5, y: 5 };
    await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y) ?? document.body;
      const init = { bubbles: true, cancelable: true, composed: true, pointerType: 'touch', pointerId: 1, clientX: x, clientY: y };
      target.dispatchEvent(new PointerEvent('pointerdown', init));
      target.dispatchEvent(new PointerEvent('pointercancel', init));
    }, outside);
    await page.waitForTimeout(200);
    expect(await open()).toBe(1);

    // A tap outside, with the finger coming up in place, closes it.
    await page.touchscreen.tap(outside.x, outside.y);
    await expect.poll(open).toBe(0);

    // A tap on an option chooses it and closes the list.
    await page.touchscreen.tap(field.x + 20, field.y + field.height / 2);
    await expect.poll(open).toBe(1);
    await optionsOf(page).filter({ hasText: 'Sad' }).tap();
    await expect(page.getByTestId('single-value')).toHaveText('sad');
    await expect.poll(open).toBe(0);
  });
});
