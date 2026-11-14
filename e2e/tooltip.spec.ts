// The Tooltip in a real browser, in the three engines (specs/tooltip.md): the geometry, the real colors, the pointer
// and the keyboard, touch, and the layout rule that jsdom cannot show. It runs against the lab at `/#tooltip`
// (e2e/fixtures/TooltipLab.svelte).
import { expect, test, type Locator, type Page } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };

/** Applies a patch to the lab and waits two frames, so the placement that follows it has run. */
async function lab(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate((p) => (window as unknown as { __tooltipLab: { set(p: unknown): void } }).__tooltipLab.set(p), patch);
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

const tip = (page: Page) => page.locator('[role="tooltip"]:visible');
const box = (page: Page) => page.locator('.ads-tooltip:visible');
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

test.beforeEach(async ({ page }) => {
  await page.goto('/#tooltip');
  await page.waitForFunction(() => Boolean((window as unknown as { __tooltipLab?: unknown }).__tooltipLab));
  // No animation: a rectangle is final right after a change. The animation has its own tests below.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('pointer and keyboard', () => {
  test('hover opens it, the pointer can cross the gap into the panel and rest there, and leaving closes it', async ({ page }) => {
    await page.getByTestId('main').hover();
    await expect(tip(page)).toBeVisible();
    await expect(box(page)).toHaveText('Prompt text');
    const panel = await rect(tip(page));
    await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height / 2, { steps: 6 });
    await page.waitForTimeout(400);
    await expect(tip(page)).toBeVisible();
    await page.mouse.move(700, 600, { steps: 6 });
    await expect(tip(page)).toBeHidden();
  });

  test('a pass over the trigger shorter than the delay opens nothing', async ({ page }) => {
    const main = await rect(page.getByTestId('main'));
    await page.mouse.move(main.x + 5, main.y + 5);
    await page.mouse.move(700, 600);
    await page.waitForTimeout(300);
    await expect(tip(page)).toBeHidden();
  });

  test('keyboard: Tab to the trigger shows the tip, Escape hides it and focus stays, Tab away closes a shown one', async ({ page }) => {
    await page.keyboard.press('Tab');
    const main = page.getByTestId('main');
    await expect(main).toBeFocused();
    await expect(tip(page)).toBeVisible();
    const id = await tip(page).getAttribute('id');
    expect(await main.getAttribute('aria-describedby')).toBe(id);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
    await expect(main).toBeFocused();
    expect(await main.getAttribute('aria-describedby')).toBeNull();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('neighbor')).toBeFocused();
    await expect(tip(page)).toBeHidden();
  });

  test('the tip never takes focus and is not reachable with Tab', async ({ page }) => {
    await page.getByTestId('main').focus();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('[role="tooltip"]'))).toBeNull();
  });

  test('a click trigger toggles it, and a press elsewhere closes it', async ({ page }) => {
    await page.getByTestId('click').click();
    await expect(tip(page)).toHaveText('Click tip');
    await page.getByTestId('click').click();
    await expect(tip(page)).toBeHidden();
    await page.getByTestId('click').click();
    await expect(tip(page)).toBeVisible();
    await page.mouse.click(700, 600);
    await expect(tip(page)).toBeHidden();
  });

  test('a tooltip on a disabled button opens: the events of a disabled control reach the wrapper (current engines)', async ({ page }) => {
    await page.getByTestId('disabled').hover({ force: true });
    await expect(tip(page)).toHaveText('Disabled tip');
  });

  test('a tooltip around a Checkbox stays open when the pointer goes from the box to its text (React #59701)', async ({ page }) => {
    // The input is laid over the box, invisible: it is what the pointer meets.
    await page.getByTestId('box').hover();
    await expect(tip(page)).toHaveText('Checkbox tip');
    const text = await rect(page.getByText('Agree with the terms'));
    await page.mouse.move(text.x + text.width / 2, text.y + text.height / 2, { steps: 8 });
    await page.waitForTimeout(400);
    await expect(tip(page)).toBeVisible();
  });

  test('a tooltip around a Checkbox describes its input, the element that has the focus, not the label around it', async ({ page }) => {
    await page.getByTestId('box').focus();
    await expect(tip(page)).toHaveText('Checkbox tip');
    const id = await tip(page).getAttribute('id');
    expect(await page.getByTestId('box').getAttribute('aria-describedby')).toBe(id);
    expect(await page.getByTestId('box').evaluate((input) => input.closest('label')!.hasAttribute('aria-describedby'))).toBe(false);
  });

  test('a tooltip around a Switch opens on keyboard focus', async ({ page }) => {
    await page.getByTestId('switch').focus();
    await expect(tip(page)).toHaveText('Switch tip');
  });

  test('aria-describedby keeps a description the page set, and gets it back when the tip closes', async ({ page }) => {
    const described = page.getByTestId('described');
    await described.focus();
    await expect(tip(page)).toBeVisible();
    const id = await tip(page).getAttribute('id');
    expect(await described.getAttribute('aria-describedby')).toBe(`note ${id}`);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
    expect(await described.getAttribute('aria-describedby')).toBe('note');
  });

  test('anchor: the tip is placed at the given element', async ({ page }) => {
    await lab(page, { anchorOpen: true });
    const target = await rect(page.getByTestId('anchor-target'));
    const panel = await rect(tip(page));
    near(panel.x + panel.width / 2, target.x + target.width / 2);
    expect(panel.y + panel.height).toBeLessThan(target.y);
  });
});

test.describe('placement', () => {
  test('top: above the trigger, centered, with the arrow pointing at its middle', async ({ page }) => {
    await lab(page, { open: true });
    const trigger = await rect(page.getByTestId('main'));
    const panel = await rect(tip(page));
    near(panel.x + panel.width / 2, trigger.x + trigger.width / 2);
    expect(panel.y + panel.height).toBeLessThanOrEqual(trigger.y);
    near(panel.y + panel.height, trigger.y - 10, 2);
    const arrow = await rect(tip(page).locator('.ads-popup-arrow'));
    near(arrow.x, trigger.x + trigger.width / 2);
  });

  test('the 12 placements put the tip on the right side of the trigger', async ({ page }) => {
    const names = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight', 'left', 'leftTop', 'leftBottom', 'right', 'rightTop', 'rightBottom'];
    for (const placement of names) {
      await lab(page, { open: true, placement });
      const trigger = await rect(page.getByTestId('main'));
      const panel = await rect(tip(page));
      const side = ['top', 'bottom', 'left', 'right'].find((name) => placement.startsWith(name))!;
      if (side === 'top') expect(panel.y + panel.height, placement).toBeLessThanOrEqual(trigger.y);
      if (side === 'bottom') expect(panel.y, placement).toBeGreaterThanOrEqual(trigger.y + trigger.height);
      if (side === 'left') expect(panel.x + panel.width, placement).toBeLessThanOrEqual(trigger.x);
      if (side === 'right') expect(panel.x, placement).toBeGreaterThanOrEqual(trigger.x + trigger.width);
    }
  });

  test('the arrow of an aligned tip stands further from the edge when the corner is rounder: radius + 8 above or below the trigger, radius + 7 beside it', async ({ page }) => {
    const cases = [
      ['topLeft', 'x', 'start'], ['topRight', 'x', 'end'], ['bottomLeft', 'x', 'start'], ['bottomRight', 'x', 'end'],
      ['leftTop', 'y', 'start'], ['leftBottom', 'y', 'end'], ['rightTop', 'y', 'start'], ['rightBottom', 'y', 'end']
    ] as const;
    for (const radius of [4, 6, 8]) {
      for (const [placement, axis, end] of cases) {
        await lab(page, { open: true, placement, styles: { root: { '--ads-tooltip-radius': `${radius}px` } } });
        const tipBox = await rect(box(page));
        const arrow = await rect(tip(page).locator('.ads-popup-arrow'));
        const fromStart = axis === 'x' ? arrow.x - tipBox.x : arrow.y - tipBox.y;
        const length = axis === 'x' ? tipBox.width : tipBox.height;
        const distance = end === 'start' ? fromStart : length - fromStart;
        near(distance, radius + (axis === 'x' ? 8 : 7), 1.5);
      }
    }
  });

  test('the corners keep their radius in every placement, and the radius is the one of the token', async ({ page }) => {
    const radii = () =>
      tip(page).evaluate((frame) => {
        const style = getComputedStyle(frame.querySelector('.ads-tooltip')!);
        return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
      });
    for (const radius of [4, 6, 8]) {
      for (const placement of ['top', 'topLeft', 'bottomRight', 'left', 'leftTop', 'leftBottom', 'rightTop', 'rightBottom']) {
        await lab(page, { open: true, placement, styles: { root: { '--ads-tooltip-radius': `${radius}px` } } });
        expect(await radii(), `${placement} at ${radius}px`).toEqual(Array(4).fill(`${radius}px`));
      }
    }
  });

  test('the arrow sticks out of the box, with only its base one pixel inside, and has the color of the box', async ({ page }) => {
    for (const placement of ['top', 'bottomRight', 'left', 'rightTop']) {
      await lab(page, { open: true, placement });
      const tipBox = await rect(box(page));
      const shape = await rect(tip(page).locator('.ads-popup-arrow > span'));
      const overlapX = Math.min(tipBox.x + tipBox.width, shape.x + shape.width) - Math.max(tipBox.x, shape.x);
      const overlapY = Math.min(tipBox.y + tipBox.height, shape.y + shape.height) - Math.max(tipBox.y, shape.y);
      // The base goes a pixel into the box, so the overlap is a pixel and no more.
      expect(Math.max(0, Math.min(overlapX, overlapY)), placement).toBeLessThanOrEqual(1.25);
      const colors = await tip(page).evaluate((frame) => [getComputedStyle(frame.querySelector('.ads-tooltip')!).backgroundColor, getComputedStyle(frame.querySelector('.ads-popup-arrow > span')!).backgroundColor]);
      expect(colors[1], placement).toBe(colors[0]);
    }
  });

  test('pointAtCenter: an aligned placement points the arrow at the middle of the trigger', async ({ page }) => {
    await lab(page, { open: true, placement: 'topLeft', arrow: { pointAtCenter: true } });
    const trigger = await rect(page.getByTestId('main'));
    const arrow = await rect(tip(page).locator('.ads-popup-arrow'));
    near(arrow.x, trigger.x + trigger.width / 2, 1.5);
  });

  test('arrow: false removes it', async ({ page }) => {
    await lab(page, { open: true, arrow: false });
    await expect(tip(page).locator('.ads-popup-arrow')).toHaveCount(0);
  });

  test('at the top edge of the screen the tip flips below its trigger', async ({ page }) => {
    await lab(page, { edgeOpen: true });
    const trigger = await rect(page.getByTestId('edge'));
    const panel = await rect(tip(page));
    expect(panel.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
  });

  test('dir="rtl" mirrors the sides: left becomes right', async ({ page }) => {
    await lab(page, { rtl: true, open: true, placement: 'left' });
    const trigger = await rect(page.getByTestId('main'));
    const panel = await rect(tip(page));
    expect(panel.x).toBeGreaterThanOrEqual(trigger.x + trigger.width);
  });

  test('a long tip wraps at 250 px and a long word breaks', async ({ page }) => {
    await page.getByTestId('long').hover();
    await expect(tip(page)).toBeVisible();
    const size = await rect(box(page));
    expect(size.width).toBeLessThanOrEqual(250.5);
    expect(size.height).toBeGreaterThan(60);
    expect(await box(page).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });

  test('a change of the text while open is placed again', async ({ page }) => {
    await lab(page, { open: true });
    const before = await rect(tip(page));
    await lab(page, { title: 'A considerably longer prompt text than before' });
    const after = await rect(tip(page));
    expect(after.width).toBeGreaterThan(before.width + 20);
    const trigger = await rect(page.getByTestId('main'));
    near(after.x + after.width / 2, trigger.x + trigger.width / 2);
  });
});

/**
 * The pixels of the screenshot of a region, as the browser painted them. The picture is decoded in the page, so no image
 * library is needed. Returns the device pixel ratio and a function that reads one pixel.
 */
async function paintedPixels(page: Page, clip: { x: number; y: number; width: number; height: number }) {
  const png = (await page.screenshot({ clip })).toString('base64');
  return page.evaluate(async ({ data }) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    return { width: bitmap.width, height: bitmap.height, pixels: Array.from(context.getImageData(0, 0, bitmap.width, bitmap.height).data), ratio: window.devicePixelRatio };
  }, { data: png });
}

test.describe('the arrow and the box are one piece (no seam, no notch in the corner)', () => {
  for (const ratio of [1, 1.25, 1.5, 2, 3]) {
    test.describe(`device pixel ratio ${ratio}`, () => {
      test.use({ deviceScaleFactor: ratio });

      test('every pixel of the base of the arrow, on both sides of the edge, has the color of the box', async ({ page }) => {
        // The color of the box: 38 in each channel. A seam would show the page (255), an overlap that is not hidden a darker line.
        const boxColor = 38;
        const tolerance = 8;
        for (const placement of ['top', 'bottomRight', 'left', 'leftBottom', 'right', 'rightTop', 'rightBottom', 'leftTop']) {
          await lab(page, { open: true, placement, title: 'A tip of some width' });
          const arrow = await rect(tip(page).locator('.ads-popup-arrow'));
          const side = await tip(page).getAttribute('data-side');
          const picture = await paintedPixels(page, { x: arrow.x - 12, y: arrow.y - 12, width: 24, height: 24 });
          const at = (column: number, row: number) => picture.pixels[(row * picture.width + column) * 4];
          const edge = Math.round(12 * picture.ratio);
          // The middle of the base: the base is 16 px long and the corners of the box may take its ends.
          const from = Math.round((12 - 4) * picture.ratio);
          const to = Math.round((12 + 4) * picture.ratio);
          const pixels: number[] = [];
          for (let along = from; along < to; along++) {
            if (side === 'right') pixels.push(at(edge - 1, along), at(edge, along));
            if (side === 'left') pixels.push(at(edge - 1, along), at(edge, along));
            if (side === 'bottom') pixels.push(at(along, edge - 1), at(along, edge));
            if (side === 'top') pixels.push(at(along, edge - 1), at(along, edge));
          }
          const worst = Math.max(...pixels.map((value) => Math.abs(value - boxColor)));
          expect(worst, `${placement}: the lightest pixel at the base of the arrow is ${Math.max(...pixels)}, the box is ${boxColor}`).toBeLessThanOrEqual(tolerance);
        }
      });
    });
  }
});

test.describe('layout (CLAUDE.md section 7)', () => {
  /** Rectangles of the trigger and the elements next to it, every frame, while `action` runs. */
  async function watch(page: Page, ids: string[], action: () => Promise<void>): Promise<number> {
    await page.evaluate((list) => {
      const read = () => list.map((id) => {
        const r = document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height];
      });
      const state = { base: read(), worst: 0, run: true };
      (window as unknown as { __watch: typeof state }).__watch = state;
      const frame = () => {
        const now = read();
        for (let i = 0; i < now.length; i++) for (let j = 0; j < 4; j++) state.worst = Math.max(state.worst, Math.abs(now[i][j] - state.base[i][j]));
        if (state.run) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, ids);
    await action();
    return page.evaluate(() => {
      const state = (window as unknown as { __watch: { worst: number; run: boolean } }).__watch;
      state.run = false;
      return state.worst;
    });
  }

  test('opening and closing a tip moves neither a short trigger nor its neighbours, during the animation too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const worst = await watch(page, ['main', 'neighbor', 'wide', 'neighbor2'], async () => {
      await lab(page, { open: true });
      await page.waitForTimeout(450);
      await lab(page, { open: false });
      await page.waitForTimeout(450);
    });
    expect(worst).toBeLessThanOrEqual(0.01);
  });

  test('the same for a wide trigger, opened by the pointer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const worst = await watch(page, ['main', 'neighbor', 'wide', 'neighbor2'], async () => {
      await page.getByTestId('wide').hover();
      await expect(tip(page)).toBeVisible();
      await page.waitForTimeout(450);
      await page.mouse.move(700, 600, { steps: 4 });
      await expect(tip(page)).toBeHidden();
    });
    expect(worst).toBeLessThanOrEqual(0.01);
  });

  test('the text of the tip does not shift after the opening motion (React #59729)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await lab(page, { open: true });
    await page.waitForTimeout(400);
    const textRect = () =>
      box(page).evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const r = range.getBoundingClientRect();
        return [r.x, r.y];
      });
    const settled = await textRect();
    await page.waitForTimeout(500);
    const later = await textRect();
    near(later[0], settled[0], 0.01);
    near(later[1], settled[1], 0.01);
  });

  test('prefers-reduced-motion removes the animation', async ({ page }) => {
    await lab(page, { open: true });
    expect(await tip(page).evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  });
});

const PRESETS: Record<string, [string, string]> = {
  pink: ['#eb2f96', '#cb2b83'],
  red: ['#f5222d', '#d32029'],
  yellow: ['#fadb14', '#d8bd14'],
  orange: ['#fa8c16', '#d87a16'],
  cyan: ['#13c2c2', '#13a8a8'],
  green: ['#52c41a', '#49aa19'],
  blue: ['#1677ff', '#1668dc'],
  purple: ['#722ed1', '#642ab5'],
  geekblue: ['#2f54eb', '#2b4acb'],
  magenta: ['#eb2f96', '#cb2b83'],
  volcano: ['#fa541c', '#d84a1b'],
  gold: ['#faad14', '#d89614'],
  lime: ['#a0d911', '#8bbb11']
};
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

/** The colors the browser painted: the box, its text and the arrow, and the contrast of the text. */
async function painted(page: Page) {
  return box(page).evaluate((element) => {
    const read = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const style = getComputedStyle(element);
    const arrow = getComputedStyle(element.closest('.ads-popup-frame')!.querySelector('.ads-popup-arrow > span')!);
    const [a, b] = [lum(read(style.color)), lum(read(style.backgroundColor))].sort((x, y) => y - x);
    return { background: style.backgroundColor, color: style.color, arrow: arrow.backgroundColor, ratio: (a + 0.05) / (b + 0.05) };
  });
}

test.describe('color (decision 3, 3b, P7)', () => {
  test('the default box: white on #262626 (the 85% black of Ant Design over a white page), radius 6, padding 6 8, minimum height 32', async ({ page }) => {
    await lab(page, { open: true });
    const style = await box(page).evaluate((element) => {
      const s = getComputedStyle(element);
      return { bg: s.backgroundColor, color: s.color, radius: s.borderTopLeftRadius, padding: s.padding, minHeight: s.minHeight, maxWidth: s.maxWidth };
    });
    expect(style).toEqual({ bg: 'rgb(38, 38, 38)', color: 'rgb(255, 255, 255)', radius: '6px', padding: '6px 8px', minHeight: '32px', maxWidth: '250px' });
    expect(await tip(page).evaluate((element) => getComputedStyle(element.closest('.ads-popup')!).zIndex)).toBe('1070');
  });

  for (const theme of ['light', 'dark']) {
    test(`the 13 presets in the ${theme} theme: the measured background, the arrow the same, and the text reaches 4.5:1`, async ({ page }) => {
      await page.evaluate((name) => {
        if (name === 'dark') document.documentElement.dataset.theme = 'dark';
      }, theme);
      for (const [name, [light, dark]] of Object.entries(PRESETS)) {
        await lab(page, { open: true, color: name });
        const result = await painted(page);
        expect(result.background, name).toBe(rgb(theme === 'dark' ? dark : light));
        expect(result.arrow, `${name} arrow`).toBe(result.background);
        expect(result.ratio, `${name} contrast`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test('a custom color gets black or white text, whichever contrasts more, and the arrow follows', async ({ page }) => {
    await lab(page, { open: true, color: '#87d068' });
    let result = await painted(page);
    expect(result.background).toBe('rgb(135, 208, 104)');
    expect(result.color).toBe('rgb(0, 0, 0)');
    expect(result.arrow).toBe(result.background);
    await lab(page, { color: '#0a1450' });
    result = await painted(page);
    expect(result.color).toBe('rgb(255, 255, 255)');
    await lab(page, { color: '#f50' });
    result = await painted(page);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('a custom color can be hsl() or a variable', async ({ page }) => {
    await page.evaluate(() => document.documentElement.style.setProperty('--brand', '#ffe58f'));
    await lab(page, { open: true, color: 'var(--brand)' });
    let result = await painted(page);
    expect(result.background).toBe('rgb(255, 229, 143)');
    expect(result.color).toBe('rgb(0, 0, 0)');
    await lab(page, { color: 'hsl(220 60% 20%)' });
    result = await painted(page);
    expect(result.color).toBe('rgb(255, 255, 255)');
  });

  test('a color the browser cannot parse leaves the default box', async ({ page }) => {
    await lab(page, { open: true, color: 'not-a-color' });
    expect((await painted(page)).background).toBe('rgb(38, 38, 38)');
  });

  test('overriding a preset token changes the tooltip', async ({ page }) => {
    await page.evaluate(() => document.documentElement.style.setProperty('--ads-tooltip-preset-blue', '#003a8c'));
    await lab(page, { open: true, color: 'blue' });
    expect((await painted(page)).background).toBe('rgb(0, 58, 140)');
  });
});

test.describe('customization', () => {
  test('classNames and styles reach the root, the container and the arrow, and the placement survives', async ({ page }) => {
    await lab(page, {
      open: true,
      classNames: { root: 'my-root', container: 'my-box', arrow: 'my-arrow' },
      styles: { root: { '--probe': '1' }, container: { 'font-weight': '700' }, arrow: { opacity: '0.5' } }
    });
    const root = page.locator('.ads-popup.my-root');
    await expect(root).toHaveCount(1);
    expect(await root.evaluate((element) => element.style.getPropertyValue('--probe'))).toBe('1');
    expect(await box(page).evaluate((element) => element.classList.contains('my-box') && getComputedStyle(element).fontWeight)).toBe('700');
    expect(await tip(page).locator('.ads-popup-arrow > span.my-arrow').evaluate((element) => getComputedStyle(element).opacity)).toBe('0.5');
    const trigger = await rect(page.getByTestId('main'));
    const panel = await rect(tip(page));
    near(panel.x + panel.width / 2, trigger.x + trigger.width / 2);
  });

  test('container: the tip is inside the given element; zIndex overrides the layer', async ({ page }) => {
    await page.evaluate(() => (window as unknown as { __tooltipLab: { setContainer(id: string): void } }).__tooltipLab.setContainer('host'));
    await lab(page, { open: true, zIndex: 3000 });
    expect(await page.getByTestId('host').locator('.ads-popup').count()).toBe(1);
    expect(await tip(page).evaluate((element) => getComputedStyle(element.closest('.ads-popup')!).zIndex)).toBe('3000');
  });

  test('destroyOnHidden removes the content on close', async ({ page }) => {
    await lab(page, { open: true, destroyOnHidden: true });
    await lab(page, { open: false });
    await expect(page.locator('.ads-tooltip')).toHaveCount(0);
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a tap on the trigger opens it and a tap elsewhere closes it (decision 4)', async ({ page }) => {
    const main = await rect(page.getByTestId('main'));
    await page.touchscreen.tap(main.x + main.width / 2, main.y + main.height / 2);
    await expect(tip(page)).toBeVisible();
    // The browser sends a compatibility mouseleave right after a tap, and the tip must not go with it.
    await page.waitForTimeout(600);
    await expect(tip(page)).toBeVisible();
    await page.touchscreen.tap(700, 600);
    await expect(tip(page)).toBeHidden();
  });

  test('a tap on the tip itself keeps it open', async ({ page }) => {
    await lab(page, { open: true });
    const panel = await rect(tip(page));
    await page.touchscreen.tap(panel.x + panel.width / 2, panel.y + panel.height / 2);
    await page.waitForTimeout(300);
    await expect(tip(page)).toBeVisible();
  });
});
