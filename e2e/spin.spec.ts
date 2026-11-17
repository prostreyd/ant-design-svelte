import { expect, test, type Locator, type Page } from '@playwright/test';

// Spin in a real browser (specs/spin.md): the geometry measured on the Ant Design demos (the dot box, the 12 px gap, the
// centering), the embedded blocking, the delay in real time, the fullscreen backdrop, right-to-left, reduced motion and the
// contrast of the colors the browser really paints. The `SpinLab` page (e2e/fixtures/SpinLab.svelte) mounts what a test asks.

type Content = 'none' | 'text' | 'button' | 'wide' | 'nested';
type Lab = {
  clicks(): number;
  mountedAt: number;
  appearedAt: number;
  set(next: { props: Record<string, unknown>; content: Content; dir?: 'ltr' | 'rtl'; custom?: boolean }): void;
  update(patch: Record<string, unknown>): void;
};
declare global {
  interface Window {
    __spinLab: Lab;
  }
}

async function mount(
  page: Page,
  props: Record<string, unknown> = {},
  content: Content = 'none',
  options: { dir?: 'ltr' | 'rtl'; custom?: boolean } = {}
): Promise<void> {
  await page.evaluate((args) => window.__spinLab.set(args), { props, content, ...options });
}
const update = (page: Page, patch: Record<string, unknown>) => page.evaluate((args) => window.__spinLab.update(args), patch);

type Rect = { x: number; y: number; w: number; h: number };
async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
}
const centerX = (r: Rect) => r.x + r.w / 2;
const centerY = (r: Rect) => r.y + r.h / 2;
const near = (a: number, b: number, tolerance = 1) => Math.abs(a - b) <= tolerance;

async function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop), property);
}

/**
 * Whether an element is really being animated: a running animation with the name, whose clock moves. The computed
 * `transform` is not used, because WebKit does not report the value of an accelerated animation there.
 */
async function isTurning(locator: Locator, name: string): Promise<boolean> {
  const sample = () =>
    locator.evaluate((element, needle) => {
      const found = element.getAnimations().find((animation) => (animation as CSSAnimation).animationName.endsWith(needle));
      return found ? { state: found.playState, time: Number(found.currentTime) } : null;
    }, name);
  const first = await sample();
  await locator.page().waitForTimeout(250);
  const second = await sample();
  return Boolean(first && second && second.state === 'running' && second.time > first.time);
}

const spin = (page: Page) => page.getByTestId('spin');
const indicator = (page: Page) => page.locator('.ads-spin-indicator').first();
const dots = (page: Page) => page.locator('.ads-spin-dots > span');
const container = (page: Page) => page.locator('.ads-spin-container');

test.beforeEach(async ({ page }) => {
  await page.goto('/#spin');
  await page.waitForFunction(() => Boolean(window.__spinLab));
});

test.describe('Spin: geometry (the Ant Design demos, 2026-11-17)', () => {
  for (const [size, box] of [
    ['small', 14],
    ['medium', 20],
    ['large', 32]
  ] as const) {
    test(`SPN-1, SPN-13: a standalone ${size} Spin is exactly the dot box (${box}px), with no padding`, async ({ page }) => {
      await mount(page, { size, 'aria-label': 'Loading' });
      const root = await rect(spin(page));
      expect(root.w).toBeCloseTo(box, 0);
      expect(root.h).toBeCloseTo(box, 0);
      const part = await rect(indicator(page));
      expect(part.w).toBeCloseTo(box, 0);
      expect(part.h).toBeCloseTo(box, 0);
    });
  }

  test('SPN-1: with a description the indicator is centered over it, 12px apart; the size is the same at every size', async ({ page }) => {
    for (const [size, box] of [
      ['small', 14],
      ['medium', 20],
      ['large', 32]
    ] as const) {
      await mount(page, { size, description: 'Loading' });
      const root = await rect(spin(page));
      const part = await rect(indicator(page));
      const text = await rect(page.locator('.ads-spin-description'));
      expect(near(centerX(part), centerX(root)), `${size} indicator is centered`).toBe(true);
      expect(near(centerX(text), centerX(root)), `${size} text is centered`).toBe(true);
      expect(near(text.y - (part.y + part.h), 12, 0.6), `${size} gap`).toBe(true);
      expect(part.w).toBeCloseTo(box, 0);
      // The description keeps the body font size at every size.
      expect(await computed(page.locator('.ads-spin-description'), 'font-size')).toBe('14px');
      // The root is as tall as the indicator, the gap and one line.
      expect(near(root.h, box + 12 + text.h, 0.6)).toBe(true);
    }
  });

  test('SPN-3: embedded: the indicator is centered in the covered content, horizontally and vertically', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'text');
    const covered = await rect(container(page));
    const part = await rect(indicator(page));
    expect(near(centerX(part), centerX(covered), 1)).toBe(true);
    expect(near(centerY(part), centerY(covered), 1)).toBe(true);
  });

  test('SPN-3: embedded with a description: indicator and text are centered as one group', async ({ page }) => {
    await mount(page, { description: 'Loading' }, 'text');
    const covered = await rect(container(page));
    const section = await rect(page.locator('.ads-spin-section'));
    expect(near(centerX(section), centerX(covered))).toBe(true);
    expect(near(centerY(section), centerY(covered))).toBe(true);
    const part = await rect(indicator(page));
    const text = await rect(page.locator('.ads-spin-description'));
    expect(near(text.y - (part.y + part.h), 12, 0.6)).toBe(true);
  });

  test('SPN-14: a custom indicator sits centered in the dot box, whose size is also its font size', async ({ page }) => {
    await mount(page, { size: 'large', description: 'x' }, 'none', { custom: true });
    await expect(dots(page)).toHaveCount(0);
    expect(await computed(indicator(page), 'font-size')).toBe('32px');
    const box = await rect(indicator(page));
    expect(box.w).toBeCloseTo(32, 0);
    expect(box.h).toBeCloseTo(32, 0);
    // The icon is 1em, so it fills the box, and the box is centered over the description.
    const icon = await rect(page.getByTestId('custom-indicator'));
    expect(icon.w).toBeCloseTo(32, 0);
    expect(near(centerX(icon), centerX(box))).toBe(true);
    expect(near(centerY(icon), centerY(box))).toBe(true);
    expect(await computed(page.getByTestId('custom-indicator'), 'color')).toBe(await computed(spin(page), 'color'));
  });
});

test.describe('Spin: the default indicator', () => {
  test('four dots in the corners of the box, scaled and rounded', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' });
    await expect(dots(page)).toHaveCount(4);
    const box = await rect(indicator(page));
    // offsetLeft and offsetTop are layout positions, which the turning of the group does not change.
    const corners = await dots(page).evaluateAll((items) =>
      items.map((item) => ({ left: (item as HTMLElement).offsetLeft, top: (item as HTMLElement).offsetTop, width: (item as HTMLElement).offsetWidth }))
    );
    expect(corners[0]).toMatchObject({ left: 0, top: 0 });
    expect(corners[1].top).toBe(0);
    expect(corners[1].left).toBeGreaterThan(box.w / 2 - 1);
    expect(corners[2].top).toBeGreaterThan(box.h / 2 - 1);
    expect(corners[3].left).toBe(0);
    // About 45% of the box: 9px of 20.
    expect(corners[0].width).toBeCloseTo(9, 0);
    expect(await computed(dots(page).first(), 'border-radius')).not.toBe('0px');
  });

  test('the group turns and the dots pulse out of step', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' });
    const group = page.locator('.ads-spin-dots');
    expect(await isTurning(group, 'ads-spin-rotate')).toBe(true);
    const opacities = await dots(page).evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity));
    expect(new Set(opacities).size).toBeGreaterThan(1);
    expect(await computed(group, 'animation-duration')).toBe('1.2s');
    expect(await computed(dots(page).first(), 'animation-duration')).toBe('1s');
  });

  test('SPN-14: the dots use the Spin color', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' });
    expect(await computed(dots(page).first(), 'background-color')).toBe(await computed(spin(page), 'color'));
  });
});

test.describe('Spin: embedded blocking (SPN-3, SPN-5, SPN-6)', () => {
  test('SPN-3: while spinning the content is at half opacity, takes no pointer and no selection', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'text');
    const content = container(page);
    await expect(content).toHaveCSS('opacity', '0.5');
    expect(await computed(content, 'pointer-events')).toBe('none');
    expect(['none']).toContain(await computed(content, 'user-select'));
    expect(await computed(content, 'filter')).toBe('none');
  });

  test('SPN-3: a click on the covered button does not reach it; the indicator is hit instead', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'button');
    const button = await rect(page.getByTestId('inner-button'));
    await page.mouse.click(centerX(button), centerY(button));
    expect(await page.evaluate(() => window.__spinLab.clicks())).toBe(0);
    const hit = await page.evaluate(([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('.ads-spin-section')), [centerX(button), centerY(button)]);
    expect(hit).toBe(true);
  });

  test('SPN-6: the keyboard still reaches the covered content: Tab focuses the button and Enter presses it', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'button');
    await page.getByTestId('before').evaluate((el) => {
      el.setAttribute('tabindex', '0');
      (el as HTMLElement).focus();
    });
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('inner-button')).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.__spinLab.clicks())).toBe(1);
  });

  test('SPN-4: when it stops, the content is back at full opacity and takes the pointer', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'button');
    await update(page, { spinning: false });
    await expect(container(page)).toHaveCSS('opacity', '1');
    const button = await rect(page.getByTestId('inner-button'));
    await page.mouse.click(centerX(button), centerY(button));
    expect(await page.evaluate(() => window.__spinLab.clicks())).toBe(1);
    await expect(page.locator('.ads-spin-section')).toHaveCount(0);
  });

  test('SPN-5: spinning at mount is already at half opacity on the first style, with no fade from 1', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'text');
    // Read at once: a transition that ran from 1 would still be near 1 here.
    const first = await page.evaluate(() => {
      window.__spinLab.set({ props: { 'aria-label': 'Loading' }, content: 'text' });
      return getComputedStyle(document.querySelector('.ads-spin-container')!).opacity;
    });
    expect(first).toBe('0.5');
  });

  test('SPN-5: a later change does fade (the transition is only off for the first paint)', async ({ page }) => {
    await mount(page, { spinning: false, 'aria-label': 'Loading' }, 'text');
    const right = await page.evaluate(() => {
      window.__spinLab.update({ spinning: true });
      return Number(getComputedStyle(document.querySelector('.ads-spin-container')!).opacity);
    });
    expect(right).toBeGreaterThan(0.5);
    await expect(container(page)).toHaveCSS('opacity', '0.5');
  });

  for (const content of ['text', 'wide'] as const) {
    for (const description of [undefined, 'Loading', 'A much longer description than the content is wide, which wraps']) {
      test(`layout: toggling spinning does not move or resize the content or its neighbours (${content}, ${description ?? 'no description'})`, async ({
        page
      }) => {
        await mount(page, { spinning: false, description, 'aria-label': 'Loading' }, content);
        const before = [await rect(container(page)), await rect(page.getByTestId('after')), await rect(page.getByTestId('before'))];
        await update(page, { spinning: true });
        await expect(container(page)).toHaveCSS('opacity', '0.5');
        const during = [await rect(container(page)), await rect(page.getByTestId('after')), await rect(page.getByTestId('before'))];
        expect(during).toEqual(before);
        await update(page, { spinning: false });
        await expect(container(page)).toHaveCSS('opacity', '1');
        expect([await rect(container(page)), await rect(page.getByTestId('after'))]).toEqual(before.slice(0, 2));
      });
    }
  }

  test('SPN-7: a Spin inside the covered content has its own box and does not cover the outer one', async ({ page }) => {
    await mount(page, { description: 'Outer' }, 'nested');
    const covered = await rect(container(page));
    const inner = await rect(page.getByTestId('inner'));
    const outerSection = await rect(page.locator('.ads-spin-embedded > .ads-spin-section'));
    // The inner Spin is where its content is (the top of the covered block), not centered over the outer one.
    expect(inner.y).toBeLessThan(centerY(covered) - 20);
    expect(inner.w).toBeLessThan(covered.w / 2);
    // The outer indicator is centered in the covered block as before.
    expect(near(centerX(outerSection), centerX(covered))).toBe(true);
    expect(near(centerY(outerSection), centerY(covered))).toBe(true);
    // Both indicators exist and the outer content is still in the page.
    await expect(page.getByRole('status')).toHaveCount(2);
    await expect(page.getByText('Outer rows')).toBeVisible();
  });
});

test.describe('Spin: delay in real time (SPN-8 to SPN-10)', () => {
  // The delays are long on purpose: a loaded machine can take hundreds of milliseconds between two commands of a test, and
  // a "not there yet" check must not land after the delay. The authoritative number is the page's own clock: the lab notes
  // when the mount happened and when the status element was first inserted.
  test('SPN-8: the indicator appears after the delay, not before (measured by the page clock)', async ({ page }) => {
    await mount(page, { delay: 400, description: 'Loading' }, 'text');
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });
    const waited = await page.evaluate(() => window.__spinLab.appearedAt - window.__spinLab.mountedAt);
    expect(waited).toBeGreaterThanOrEqual(390);
    expect(waited).toBeLessThan(3000);
  });

  test('SPN-8: nothing is shown while the delay runs', async ({ page }) => {
    await mount(page, { delay: 1500, description: 'Loading' }, 'text');
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.waitForTimeout(500);
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(container(page)).toHaveCSS('opacity', '1');
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });
  });

  test('SPN-8, SPN-10: off inside the delay: nothing is ever shown, and the content stays live', async ({ page }) => {
    await mount(page, { delay: 1500, 'aria-label': 'Loading' }, 'button');
    await page.waitForTimeout(200);
    await update(page, { spinning: false });
    await page.waitForTimeout(1800);
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(await page.evaluate(() => window.__spinLab.appearedAt)).toBe(0);
    await expect(container(page)).toHaveCSS('opacity', '1');
  });

  test('SPN-8: off and on again waits for a whole new delay', async ({ page }) => {
    await mount(page, { delay: 1200, 'aria-label': 'Loading' });
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });
    await update(page, { spinning: false });
    await expect(page.getByRole('status')).toHaveCount(0);
    const restartedAt = await page.evaluate(() => {
      window.__spinLab.appearedAt = 0;
      const started = performance.now();
      window.__spinLab.update({ spinning: true });
      return started;
    });
    await expect(page.getByRole('status')).toBeVisible({ timeout: 5000 });
    // The lab clock was reset, and the observer of the first mount is gone, so the second wait is read from a fresh probe.
    const waited = await page.evaluate((from) => performance.now() - from, restartedAt);
    expect(waited).toBeGreaterThanOrEqual(1190);
  });
});

test.describe('Spin: fullscreen (SPN-17 to SPN-20)', () => {
  test('SPN-17: a fixed backdrop over the whole viewport with the mask color, above the page', async ({ page }) => {
    await mount(page, { fullscreen: true, description: 'Loading' }, 'none');
    const backdrop = page.locator('.ads-spin-fullscreen');
    const viewport = page.viewportSize()!;
    const box = await rect(backdrop);
    expect(box).toMatchObject({ x: 0, y: 0, w: viewport.width, h: viewport.height });
    expect(await computed(backdrop, 'position')).toBe('fixed');
    expect(await computed(backdrop, 'z-index')).toBe('1000');
    // With tokens-accessible.css (the lab loads it) the mask is 60% black.
    expect(await computed(backdrop, 'background-color')).toBe('rgba(0, 0, 0, 0.6)');
    expect(await computed(backdrop, 'pointer-events')).toBe('auto');
  });

  test('SPN-17: the indicator and the description are centered in the viewport, in white', async ({ page }) => {
    await mount(page, { fullscreen: true, description: 'Loading' }, 'none');
    const viewport = page.viewportSize()!;
    const section = await rect(page.locator('.ads-spin-section'));
    expect(near(centerX(section), viewport.width / 2, 1.5)).toBe(true);
    expect(near(centerY(section), viewport.height / 2, 1.5)).toBe(true);
    expect(await computed(dots(page).first(), 'background-color')).toBe('rgb(255, 255, 255)');
    expect(await computed(page.locator('.ads-spin-description'), 'color')).toBe('rgb(255, 255, 255)');
  });

  test('SPN-17: a click on the page behind the backdrop does not reach it', async ({ page }) => {
    await mount(page, { fullscreen: true, 'aria-label': 'Loading' }, 'none');
    await page.evaluate(() => {
      (window as unknown as { hits: number }).hits = 0;
      document.querySelector('[data-testid="outside"]')!.addEventListener('click', () => ((window as unknown as { hits: number }).hits += 1));
    });
    const outside = await rect(page.getByTestId('outside'));
    await page.mouse.click(centerX(outside), centerY(outside));
    expect(await page.evaluate(() => (window as unknown as { hits: number }).hits)).toBe(0);
    expect(await page.evaluate(([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('.ads-spin-fullscreen')), [centerX(outside), centerY(outside)])).toBe(true);
  });

  test('SPN-17: it fades in over the first 0.2s', async ({ page }) => {
    await mount(page, { fullscreen: true, 'aria-label': 'Loading' }, 'none');
    await expect(page.locator('.ads-spin-fullscreen')).toHaveCSS('opacity', '1');
    expect(await computed(page.locator('.ads-spin-fullscreen'), 'animation-name')).not.toBe('none');
  });

  test('SPN-18: when it stops the backdrop is gone at once and the page takes clicks again', async ({ page }) => {
    await mount(page, { fullscreen: true, 'aria-label': 'Loading' }, 'none');
    await update(page, { spinning: false });
    await expect(page.locator('.ads-spin-fullscreen')).toHaveCount(0);
    const outside = await rect(page.getByTestId('outside'));
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.getAttribute('data-testid'), [centerX(outside), centerY(outside)])).toBe('outside');
  });

  test('SPN-19: there is no focus trap and no scroll lock: Tab still reaches the page behind', async ({ page }) => {
    await mount(page, { fullscreen: true, 'aria-label': 'Loading' }, 'none');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('outside')).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });
});

test.describe('Spin: percent ring (SPN-15, SPN-16)', () => {
  test('SPN-15: the ring replaces the dots and fills the dot box, thickness 20% of it, starting at 12 o\'clock', async ({ page }) => {
    await mount(page, { percent: 25, 'aria-label': 'Upload', size: 'large' });
    await expect(dots(page)).toHaveCount(0);
    const svg = page.locator('svg.ads-spin-ring');
    const box = await rect(svg);
    expect(box.w).toBeCloseTo(32, 0);
    expect(box.h).toBeCloseTo(32, 0);
    const arc = page.locator('.ads-spin-ring-arc');
    expect(await computed(arc, 'stroke-width')).toBe('20px');
    expect(await arc.getAttribute('transform')).toBe('rotate(-90 50 50)');
    expect(await arc.getAttribute('stroke-dashoffset')).toBe('75');
    expect(await computed(arc, 'stroke')).toBe(await computed(spin(page), 'color'));
  });

  test('SPN-15: the arc follows the number, and a change is animated (the offset is a transition)', async ({ page }) => {
    await mount(page, { percent: 0, 'aria-label': 'Upload' });
    const arc = page.locator('.ads-spin-ring-arc');
    expect(await arc.getAttribute('stroke-dashoffset')).toBe('100');
    await update(page, { percent: 100 });
    expect(await arc.getAttribute('stroke-dashoffset')).toBe('0');
    expect(await computed(arc, 'transition-property')).toContain('stroke-dashoffset');
  });

  test("SPN-15: 'auto' turns a fixed arc: the ring rotates and there is no value", async ({ page }) => {
    await mount(page, { percent: 'auto', 'aria-label': 'Upload' });
    expect(await isTurning(page.locator('svg.ads-spin-ring'), 'ads-spin-turn')).toBe(true);
    expect(await page.getByRole('progressbar').getAttribute('aria-valuenow')).toBeNull();
  });
});

test.describe('Spin: right to left (SPN-21)', () => {
  test('the dots mirror and the indicator and description stay centered', async ({ page }) => {
    await mount(page, { description: 'Loading' }, 'none', { dir: 'rtl' });
    const root = await rect(spin(page));
    expect(near(centerX(await rect(indicator(page))), centerX(root))).toBe(true);
    expect(near(centerX(await rect(page.locator('.ads-spin-description'))), centerX(root))).toBe(true);
    const corners = await dots(page).evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetLeft));
    const box = await rect(indicator(page));
    // The first dot is at the start of the line, which is the right edge in right-to-left.
    expect(corners[0]).toBeGreaterThan(box.w / 2 - 1);
    expect(corners[1]).toBe(0);
  });

  test('embedded: the indicator is centered in the covered content', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'text', { dir: 'rtl' });
    const covered = await rect(container(page));
    const part = await rect(indicator(page));
    expect(near(centerX(part), centerX(covered))).toBe(true);
    expect(near(centerY(part), centerY(covered))).toBe(true);
  });
});

test.describe('Spin: reduced motion (SPN-22)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the turn and the pulse are slowed 2.5 times, and the indicator stays visible', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' });
    expect(await computed(page.locator('.ads-spin-dots'), 'animation-duration')).toBe('3s');
    expect(await computed(dots(page).first(), 'animation-duration')).toBe('2.5s');
    expect(await computed(dots(page).nth(1), 'animation-delay')).toBe('1s');
    await expect(indicator(page)).toBeVisible();
    const box = await rect(indicator(page));
    expect(box.w).toBeGreaterThan(0);
  });

  test('the indeterminate ring turns slowly too', async ({ page }) => {
    await mount(page, { percent: 'auto', 'aria-label': 'Upload' });
    expect(await computed(page.locator('svg.ads-spin-ring'), 'animation-duration')).toBe('3s');
  });

  test('the content fade and the backdrop fade are off', async ({ page }) => {
    await mount(page, { 'aria-label': 'Loading' }, 'text');
    expect(await computed(container(page), 'transition-duration')).toBe('0s');
    await mount(page, { fullscreen: true, 'aria-label': 'Loading' });
    expect(await computed(page.locator('.ads-spin-fullscreen'), 'animation-name')).toBe('none');
  });
});

// The contrast of what the browser really paints, with tokens-accessible.css (the lab loads it) in the light theme and
// without it in the dark theme: 3:1 for the dots (a graphic), 4.5:1 for the description and for white text on the mask.
type Rgb = [number, number, number, number];
const parseColor = (value: string): Rgb => {
  const m = /rgba?\(([^)]+)\)/.exec(value);
  if (!m) throw new Error(`Unsupported color: ${value}`);
  const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean);
  return [Number(r), Number(g), Number(b), Number(a)];
};
const over = (top: Rgb, bottom: Rgb): Rgb => {
  const a = top[3] + bottom[3] * (1 - top[3]);
  const mix = (t: number, b: number) => (t * top[3] + b * bottom[3] * (1 - top[3])) / a;
  return [mix(top[0], bottom[0]), mix(top[1], bottom[1]), mix(top[2], bottom[2]), a];
};
const luminance = ([r, g, b]: Rgb) => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Spin contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      if (theme === 'dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    });

    const pageColor = async (page: Page): Promise<Rgb> => over(parseColor(await computed(page.locator('body'), 'background-color')), [255, 255, 255, 1]);

    test('the dots reach 3:1 against the page', async ({ page }) => {
      await mount(page, { 'aria-label': 'Loading' });
      const dot = over(parseColor(await computed(dots(page).first(), 'background-color')), await pageColor(page));
      expect(contrast(dot, await pageColor(page))).toBeGreaterThanOrEqual(3);
    });

    test('the description reaches 4.5:1 against the page', async ({ page }) => {
      await mount(page, { description: 'Loading' });
      const text = parseColor(await computed(page.locator('.ads-spin-description'), 'color'));
      expect(contrast(over(text, await pageColor(page)), await pageColor(page))).toBeGreaterThanOrEqual(4.5);
    });

    test('the ring arc reaches 3:1 against the page', async ({ page }) => {
      await mount(page, { percent: 60, 'aria-label': 'Upload' });
      const stroke = over(parseColor(await computed(page.locator('.ads-spin-ring-arc'), 'stroke')), await pageColor(page));
      expect(contrast(stroke, await pageColor(page))).toBeGreaterThanOrEqual(3);
    });

    test('fullscreen: the white text on the mask over the page reaches 4.5:1 and the white dots 3:1', async ({ page }) => {
      await mount(page, { fullscreen: true, description: 'Loading' });
      const masked = over(parseColor(await computed(page.locator('.ads-spin-fullscreen'), 'background-color')), await pageColor(page));
      const text = parseColor(await computed(page.locator('.ads-spin-description'), 'color'));
      expect(contrast(text, masked)).toBeGreaterThanOrEqual(4.5);
      const dot = parseColor(await computed(dots(page).first(), 'background-color'));
      expect(contrast(dot, masked)).toBeGreaterThanOrEqual(3);
    });
  });
}
