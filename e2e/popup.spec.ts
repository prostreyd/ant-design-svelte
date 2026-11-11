// The popup primitive in a real browser (specs/popup.md): the geometry, the scroll and resize following, the
// layers and the dismissal that jsdom cannot show. It runs against the lab at `/#popup`
// (e2e/fixtures/PopupLab.svelte); every case is a patch of the lab's state.
import { expect, test, type Locator, type Page } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };

/** Applies a patch to the lab and waits two frames, so the placement that follows it has run. */
async function lab(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate((p) => (window as unknown as { __popupLab: { set(p: unknown): void } }).__popupLab.set(p), patch);
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

/** The rectangle in the viewport, also for an element of no size (the arrow). */
async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

const frame = (page: Page, name = 'frame') => page.getByTestId(name);
const near = (actual: number, expected: number, tolerance = 0.75) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const viewportWidth = (page: Page) => page.evaluate(() => document.documentElement.clientWidth);

test.beforeEach(async ({ page }) => {
  await page.goto('/#popup');
  await page.waitForFunction(() => Boolean((window as unknown as { __popupLab?: unknown }).__popupLab));
  // No animation: a rectangle is final right after a change. The animation has its own tests below.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const PLACEMENTS = [
  'top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight',
  'left', 'leftTop', 'leftBottom', 'right', 'rightTop', 'rightBottom'
] as const;

function expectPlaced(placement: string, anchor: Rect, panel: Rect, gap = 4): void {
  const side = ['top', 'bottom', 'left', 'right'].find((name) => placement.startsWith(name))!;
  const rest = placement.slice(side.length);
  const align = rest === '' ? 'center' : rest === 'Left' || rest === 'Top' ? 'start' : 'end';
  if (side === 'top') near(panel.y + panel.height, anchor.y - gap);
  if (side === 'bottom') near(panel.y, anchor.y + anchor.height + gap);
  if (side === 'left') near(panel.x + panel.width, anchor.x - gap);
  if (side === 'right') near(panel.x, anchor.x + anchor.width + gap);
  if (side === 'top' || side === 'bottom') {
    if (align === 'start') near(panel.x, anchor.x);
    if (align === 'end') near(panel.x + panel.width, anchor.x + anchor.width);
    if (align === 'center') near(panel.x + panel.width / 2, anchor.x + anchor.width / 2);
  } else {
    if (align === 'start') near(panel.y, anchor.y);
    if (align === 'end') near(panel.y + panel.height, anchor.y + anchor.height);
    if (align === 'center') near(panel.y + panel.height / 2, anchor.y + anchor.height / 2);
  }
}

test.describe('placement (R1, R2, R4)', () => {
  for (const placement of PLACEMENTS) {
    test(`${placement}: the panel is on the right side and edge of the anchor`, async ({ page }) => {
      await lab(page, { placement, open: true });
      expectPlaced(placement, await rect(page.getByTestId('anchor')), await rect(frame(page)));
      await expect(frame(page)).toHaveAttribute('data-placement', placement);
    });
  }

  test('offset is the gap to the anchor', async ({ page }) => {
    await lab(page, { placement: 'bottom', offset: 20, open: true });
    expectPlaced('bottom', await rect(page.getByTestId('anchor')), await rect(frame(page)), 20);
  });

  test('flips to the opposite side at each edge, and says so', async ({ page }) => {
    await lab(page, { placement: 'top', anchorTop: 10, open: true });
    expectPlaced('bottom', await rect(page.getByTestId('anchor')), await rect(frame(page)));
    await expect(frame(page)).toHaveAttribute('data-placement', 'bottom');
    await lab(page, { placement: 'bottom', anchorTop: 660 });
    expectPlaced('top', await rect(page.getByTestId('anchor')), await rect(frame(page)));
    await lab(page, { placement: 'left', anchorLeft: 10, anchorTop: 300 });
    expectPlaced('right', await rect(page.getByTestId('anchor')), await rect(frame(page)));
    await lab(page, { placement: 'right', anchorLeft: 1150 });
    expectPlaced('left', await rect(page.getByTestId('anchor')), await rect(frame(page)));
  });

  test('an aligned placement keeps its alignment when it flips', async ({ page }) => {
    await lab(page, { placement: 'topLeft', anchorTop: 10, open: true });
    expectPlaced('bottomLeft', await rect(page.getByTestId('anchor')), await rect(frame(page)));
    await expect(frame(page)).toHaveAttribute('data-placement', 'bottomLeft');
  });

  test('autoAdjustOverflow false neither flips nor shifts', async ({ page }) => {
    await lab(page, { placement: 'top', anchorTop: 10, autoAdjustOverflow: false, open: true });
    await expect(frame(page)).toHaveAttribute('data-placement', 'top');
    expect((await rect(frame(page))).y).toBeLessThan(0);
  });

  test('an unaligned placement shifts along the edge', async ({ page }) => {
    await lab(page, { placement: 'top', anchorLeft: 5, anchorWidth: 20, open: true });
    near((await rect(frame(page))).x, 0);
    await lab(page, { anchorLeft: 1250 });
    const panel = await rect(frame(page));
    near(panel.x + panel.width, await viewportWidth(page));
  });

  test('an aligned placement only flips: it is not shifted', async ({ page }) => {
    await lab(page, { placement: 'topLeft', anchorLeft: 1250, anchorWidth: 20, open: true });
    const panel = await rect(frame(page));
    near(panel.x, 1250);
    expect(panel.x + panel.width).toBeGreaterThan(await viewportWidth(page));
  });

  test('mirrors the placement in a right-to-left layout (R15)', async ({ page }) => {
    await lab(page, { rtl: true, placement: 'bottomLeft', open: true });
    await expect(frame(page)).toHaveAttribute('data-placement', 'bottomRight');
    expectPlaced('bottomRight', await rect(page.getByTestId('anchor')), await rect(frame(page)));
    await lab(page, { placement: 'left' });
    await expect(frame(page)).toHaveAttribute('data-placement', 'right');
  });
});

test.describe('width (R5)', () => {
  test('matchWidth: true is at least as wide as the anchor, a number is a minimum, false is the content', async ({ page }) => {
    await lab(page, { anchorWidth: 300, panelWidth: 100, matchWidth: true, open: true });
    near((await rect(frame(page))).width, 300);
    await lab(page, { matchWidth: 400 });
    near((await rect(frame(page))).width, 400);
    await lab(page, { matchWidth: 50 });
    near((await rect(frame(page))).width, 300);
    await lab(page, { matchWidth: false });
    near((await rect(frame(page))).width, 102);
  });

  test('a wide panel is wider than the anchor', async ({ page }) => {
    await lab(page, { anchorWidth: 100, panelWidth: 400, matchWidth: true, open: true });
    near((await rect(frame(page))).width, 402);
  });
});

test.describe('follows the layout (R3)', () => {
  test('the scroll of the page', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 800));
    await lab(page, { flowOpen: true });
    const relation = async () => (await rect(frame(page, 'flow-frame'))).y - (await rect(page.getByTestId('flow-anchor'))).y;
    const before = await relation();
    await page.evaluate(() => window.scrollTo(0, 950));
    await settle(page);
    near(await relation(), before);
    expectPlaced('bottom', await rect(page.getByTestId('flow-anchor')), await rect(frame(page, 'flow-frame')));
  });

  test('the scroll of a scroll parent, which does not bubble', async ({ page }) => {
    await lab(page, { innerOpen: true });
    const scroller = page.getByTestId('scroller');
    await scroller.evaluate((element) => (element.scrollTop = 30));
    await settle(page);
    // Only the main axis: the panel is wider than the space left of the anchor, so it is shifted along the edge.
    const anchor = await rect(page.getByTestId('inner-anchor'));
    near((await rect(frame(page, 'inner-frame'))).y, anchor.y + anchor.height + 4);
  });

  test('the movement of the anchor by a layout change that fires no event', async ({ page }) => {
    await lab(page, { placement: 'bottomLeft', open: true });
    await lab(page, { anchorTop: 450, anchorLeft: 640 });
    expectPlaced('bottomLeft', await rect(page.getByTestId('anchor')), await rect(frame(page)));
  });

  test('the resize of the window, and back', async ({ page }) => {
    await lab(page, { placement: 'bottom', anchorTop: 600, open: true });
    await expect(frame(page)).toHaveAttribute('data-placement', 'top');
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(frame(page)).toHaveAttribute('data-placement', 'bottom');
    expectPlaced('bottom', await rect(page.getByTestId('anchor')), await rect(frame(page)));
  });

  test('a change of the size of the anchor', async ({ page }) => {
    await lab(page, { placement: 'top', open: true });
    await lab(page, { anchorWidth: 300 });
    expectPlaced('top', await rect(page.getByTestId('anchor')), await rect(frame(page)));
  });

  test('a change of the size of the panel', async ({ page }) => {
    await lab(page, { placement: 'top', open: true });
    await lab(page, { panelHeight: 200 });
    expectPlaced('top', await rect(page.getByTestId('anchor')), await rect(frame(page)));
  });

  test('a panel never shows at the origin before it is placed', async ({ page }) => {
    await page.evaluate(() => {
      const samples: Array<{ visible: boolean; positioned: boolean }> = [];
      (window as unknown as { __samples: typeof samples }).__samples = samples;
      const loop = () => {
        const panel = document.querySelector<HTMLElement>('.ads-popup');
        if (panel && !panel.hidden) {
          samples.push({ visible: getComputedStyle(panel).visibility === 'visible', positioned: panel.hasAttribute('data-positioned') });
        }
        requestAnimationFrame(loop);
      };
      loop();
    });
    await lab(page, { open: true });
    await page.waitForTimeout(150);
    const samples = await page.evaluate(() => (window as unknown as { __samples: Array<{ visible: boolean; positioned: boolean }> }).__samples);
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.filter((sample) => sample.visible && !sample.positioned)).toEqual([]);
  });
});

test.describe('layers and container (R10)', () => {
  test('the panel is moved to the body', async ({ page }) => {
    await lab(page, { open: true });
    expect(await page.evaluate(() => document.querySelector('.ads-popup')?.parentElement === document.body)).toBe(true);
  });

  test('an ancestor with overflow does not clip it', async ({ page }) => {
    await lab(page, { innerOpen: true, panelHeight: 150 });
    const scroller = await rect(page.getByTestId('scroller'));
    const panel = await rect(frame(page, 'inner-frame'));
    expect(panel.y + panel.height).toBeGreaterThan(scroller.y + scroller.height);
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-testid="inner-frame"]') !== null,
      { x: panel.x + 10, y: panel.y + panel.height - 5 }
    );
    expect(hit).toBe(true);
  });

  test('container moves the panel into another element', async ({ page }) => {
    await lab(page, { container: 'scroller', open: true });
    await expect(page.getByTestId('scroller').getByTestId('frame')).toHaveCount(1);
  });

  test('the three layers use their tokens, and zIndex overrides', async ({ page }) => {
    const token = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
    const zIndex = () => frame(page).evaluate((element) => getComputedStyle(element.parentElement!).zIndex);
    await lab(page, { open: true, layer: 'dropdown' });
    expect(await zIndex()).toBe(await token('--ads-dropdown-z-index'));
    await lab(page, { layer: 'popover' });
    expect(await zIndex()).toBe(await token('--ads-popover-z-index'));
    await lab(page, { layer: 'tooltip' });
    expect(await zIndex()).toBe(await token('--ads-tooltip-z-index'));
    await lab(page, { zIndex: 2000 });
    expect(await zIndex()).toBe('2000');
  });

  const topAt = async (page: Page) => {
    const panel = await rect(frame(page));
    return page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('data-testid'), { x: panel.x + 30, y: panel.y + 30 });
  };

  test('a tooltip is above a dropdown, and a popover is below it', async ({ page }) => {
    await lab(page, { open: true, secondOpen: true, secondLayer: 'tooltip' });
    expect(await topAt(page)).toBe('second-content');
    await lab(page, { secondLayer: 'popover' });
    expect(await topAt(page)).toBe('content');
  });

  test('popups of equal layer stack in the order of opening', async ({ page }) => {
    await lab(page, { open: true, secondOpen: true, secondLayer: 'dropdown' });
    expect(await topAt(page)).toBe('second-content');
    await lab(page, { open: false });
    await lab(page, { open: true });
    expect(await topAt(page)).toBe('content');
  });
});

test.describe('dismissal and focus (R9, R12)', () => {
  test('an outside press closes it; a press on the panel or the anchor does not', async ({ page }) => {
    await lab(page, { open: true });
    await page.getByTestId('content').click();
    await expect(frame(page)).toBeVisible();
    await page.getByTestId('anchor').click();
    await expect(frame(page)).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(frame(page)).toBeHidden();
  });

  test('Escape closes it', async ({ page }) => {
    await lab(page, { open: true });
    await page.keyboard.press('Escape');
    await expect(frame(page)).toBeHidden();
  });

  test('opening does not take focus from the anchor', async ({ page }) => {
    await page.getByTestId('anchor').focus();
    await lab(page, { open: true });
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('anchor');
  });

  test('preventBlur keeps focus on the anchor when the panel is pressed; without it focus moves away', async ({ page }) => {
    const active = () => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName);
    await lab(page, { open: true, preventBlur: true });
    await page.getByTestId('anchor').focus();
    await page.getByTestId('content').click();
    expect(await active()).toBe('anchor');
    await lab(page, { preventBlur: false });
    await page.getByTestId('content').click();
    expect(await active()).not.toBe('anchor');
  });

  test('a popup opened from inside another keeps it open, and Escape closes the inner one first', async ({ page }) => {
    await lab(page, { outerOpen: true });
    await page.getByTestId('nested-inner-anchor').click();
    await expect(frame(page, 'nested-inner-frame')).toBeVisible();
    await page.getByTestId('nested-inner-content').click();
    await expect(frame(page, 'outer-frame')).toBeVisible();
    await expect(frame(page, 'nested-inner-frame')).toBeVisible();
    // A point near the top edge: the inner panel opens lower down, whatever the width of the button in this engine.
    await page.getByTestId('outer-content').click({ position: { x: 200, y: 10 } });
    await expect(frame(page, 'nested-inner-frame')).toBeHidden();
    await expect(frame(page, 'outer-frame')).toBeVisible();
    await page.getByTestId('nested-inner-anchor').click();
    await page.keyboard.press('Escape');
    await expect(frame(page, 'nested-inner-frame')).toBeHidden();
    await expect(frame(page, 'outer-frame')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(frame(page, 'outer-frame')).toBeHidden();
  });
});

test.describe('arrow (R6)', () => {
  const arrowOf = (page: Page) => frame(page).locator('.ads-popup-arrow');

  test('points at the middle of the anchor, on the edge that faces it', async ({ page }) => {
    await lab(page, { placement: 'bottom', arrow: true, open: true });
    const anchor = await rect(page.getByTestId('anchor'));
    const panel = await rect(frame(page));
    const arrow = await rect(arrowOf(page));
    near(arrow.x, anchor.x + anchor.width / 2);
    near(arrow.y, panel.y);
    await lab(page, { placement: 'top' });
    const above = await rect(arrowOf(page));
    near(above.y, (await rect(frame(page))).y + (await rect(frame(page))).height);
    await lab(page, { placement: 'right' });
    const beside = await rect(arrowOf(page));
    near(beside.y, anchor.y + anchor.height / 2);
    near(beside.x, (await rect(frame(page))).x);
  });

  test('an aligned placement keeps it near the edge; pointAtCenter points at the anchor', async ({ page }) => {
    await lab(page, { placement: 'bottomLeft', arrow: true, open: true });
    near((await rect(arrowOf(page))).x, (await rect(frame(page))).x + 16);
    await lab(page, { arrow: { pointAtCenter: true } });
    const anchor = await rect(page.getByTestId('anchor'));
    near((await rect(arrowOf(page))).x, anchor.x + anchor.width / 2);
  });

  test('stays on the anchor after the panel was shifted', async ({ page }) => {
    await lab(page, { placement: 'bottom', arrow: true, anchorLeft: 5, anchorWidth: 20, open: true });
    near((await rect(frame(page))).x, 0);
    near((await rect(arrowOf(page))).x, 15);
  });

  test('moves to the other edge when the panel flips', async ({ page }) => {
    await lab(page, { placement: 'top', arrow: true, anchorTop: 10, open: true });
    await expect(frame(page)).toHaveAttribute('data-side', 'bottom');
    near((await rect(arrowOf(page))).y, (await rect(frame(page))).y);
  });
});

test.describe('layout (R16 and the project rule)', () => {
  for (const width of [40, 160]) {
    test(`opening and closing does not move the anchor or its neighbours (anchor ${width}px wide)`, async ({ page }) => {
      await lab(page, { flowAnchorWidth: width });
      const names = ['neighbor-before', 'flow-anchor', 'neighbor-after'];
      const measure = async () => Promise.all(names.map((name) => rect(page.getByTestId(name))));
      const before = await measure();
      await lab(page, { flowOpen: true });
      expect(await measure()).toEqual(before);
      await lab(page, { flowOpen: false });
      expect(await measure()).toEqual(before);
    });
  }
});

test.describe('motion (R11)', () => {
  test('without reduced motion the panel plays an animation and hides when it ends', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await lab(page, { open: true });
    expect(await frame(page).evaluate((element) => getComputedStyle(element).animationName)).not.toBe('none');
    await lab(page, { open: false });
    await expect(frame(page)).toHaveAttribute('data-state', 'closed');
    await expect(frame(page)).toBeHidden({ timeout: 1500 });
  });

  test('with reduced motion there is no animation and it hides at once', async ({ page }) => {
    await lab(page, { open: true });
    expect(await frame(page).evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
    await lab(page, { open: false });
    await expect(frame(page)).toBeHidden({ timeout: 300 });
  });

  test('destroyOnHidden removes the panel from the page', async ({ page }) => {
    await lab(page, { open: true, destroyOnHidden: true });
    await lab(page, { open: false });
    await expect(page.locator('[data-testid="frame"]')).toHaveCount(0);
    await lab(page, { open: true });
    await expect(frame(page)).toBeVisible();
  });
});
