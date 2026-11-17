// The Message in a real browser, in the three engines (specs/message.md): the geometry of the layer, the clicks that
// pass through it, the layout rules, the motion frame by frame, the pile, and the keyboard. It runs against the lab at
// `/#message` (e2e/fixtures/MessageLab.svelte). What jsdom cannot show is here; the calls and the timers are in
// tests/Message.test.ts.
import { expect, test, type Locator, type Page } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };
type Lab = {
  message: Record<string, (...args: unknown[]) => unknown>;
  mountHost(props?: unknown, containerId?: string): void;
  unmountHost(): void;
  setRtl(value: boolean): void;
  underClicks(): number;
  snippets: Record<string, unknown>;
};
declare global {
  interface Window {
    __messageLab: Lab;
  }
}

/** Calls `message[method](...args)` in the page. */
function call(page: Page, method: string, ...args: unknown[]): Promise<void> {
  return page.evaluate(([name, list]) => void window.__messageLab.message[name as string](...(list as unknown[])), [method, args]);
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

const boxes = (page: Page) => page.locator('.ads-message');
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(tolerance);

test.beforeEach(async ({ page }) => {
  await page.goto('/#message');
  await page.waitForFunction(() => Boolean(window.__messageLab));
  // No motion: a rectangle is final right after a change. The motion has its own tests below.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('placement', () => {
  test('the box is 8 px from the top and centred, 40 px high; the next one is 16 px below it', async ({ page }) => {
    await call(page, 'info', 'First', 0);
    await call(page, 'success', 'Second message, longer', 0);
    await settle(page);
    const [first, second] = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    const viewport = page.viewportSize()!;
    near(first.y, 8);
    near(first.height, 40, 1.5);
    near(first.x + first.width / 2, viewport.width / 2, 1);
    near(second.y, first.y + first.height + 16, 1);
    near(second.x + second.width / 2, viewport.width / 2, 1);
  });

  test('the layer is above the page and below nothing of ours: it sits at z-index 2010 on the body', async ({ page }) => {
    await call(page, 'info', 'x', 0);
    const layer = page.locator('.ads-message-list');
    expect(await layer.evaluate((element) => getComputedStyle(element).zIndex)).toBe('2010');
    expect(await layer.evaluate((element) => element.parentElement === document.body)).toBe(true);
  });

  test('a click next to a message reaches the page under the layer; a click on the box does not', async ({ page }) => {
    await call(page, 'info', 'x', 0);
    await settle(page);
    await page.getByTestId('under').click();
    expect(await page.evaluate(() => window.__messageLab.underClicks())).toBe(1);
    await boxes(page).click();
    expect(await page.evaluate(() => window.__messageLab.underClicks())).toBe(1);
  });

  test('a long text wraps inside the window on a phone, and the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await call(page, 'info', 'A very long message that has to wrap because it is wider than a phone, ' + 'x'.repeat(60), 0);
    await settle(page);
    const box = await rect(boxes(page));
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeGreaterThan(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('top: a number, and a string', async ({ page }) => {
    await call(page, 'config', { top: 40 });
    await call(page, 'info', 'x', 0);
    await settle(page);
    near((await rect(boxes(page))).y, 40);
    await call(page, 'config', { top: '10vh' });
    await settle(page);
    near((await rect(boxes(page))).y, page.viewportSize()!.height * 0.1, 1.5);
  });

  test('container: the layer goes to the element, and is still fixed to the window', async ({ page }) => {
    await page.evaluate(() => window.__messageLab.mountHost({}, 'container'));
    await call(page, 'info', 'x', 0);
    await settle(page);
    expect(await page.locator('#container .ads-message-list').count()).toBe(1);
    near((await rect(boxes(page))).y, 8);
  });

  test('right to left: the icon is on the right of the text, and the box is still centred', async ({ page }) => {
    await page.evaluate(() => window.__messageLab.setRtl(true));
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    await call(page, 'success', 'Done', 0);
    await settle(page);
    const icon = await rect(page.locator('.ads-message-icon'));
    const title = await rect(page.locator('.ads-message-title'));
    expect(icon.x).toBeGreaterThan(title.x);
    const box = await rect(boxes(page));
    near(box.x + box.width / 2, page.viewportSize()!.width / 2, 1);
  });
});

test.describe('layout rules', () => {
  test('a message that changes type by key keeps its height and place, and the one below does not move', async ({ page }) => {
    await call(page, 'loading', { content: 'Loading', key: 'job', duration: 0 });
    await call(page, 'info', 'Below', 0);
    await settle(page);
    const before = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    await call(page, 'success', { content: 'Done!', key: 'job', duration: 0 });
    await settle(page);
    const after = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    near(after[0].height, before[0].height, 0.01);
    near(after[0].y, before[0].y, 0.01);
    near(after[1].y, before[1].y, 0.01);
    expect(Math.abs(after[0].width - before[0].width)).toBeGreaterThan(5);
  });

  test('every type has the same height, with and without the close button', async ({ page }) => {
    for (const type of ['info', 'success', 'error', 'warning', 'loading']) await call(page, type, { content: 'Same', duration: 0 });
    await call(page, 'info', { content: 'Closable', duration: 0, closable: true });
    await settle(page);
    const heights = await boxes(page).evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    for (const height of heights) near(height, heights[0], 0.5);
  });

  test('the text does not shift when the box has finished coming in', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await call(page, 'info', 'Steady', 0);
    await page.waitForTimeout(400);
    const rest = await rect(page.locator('.ads-message-title'));
    await settle(page);
    const later = await rect(page.locator('.ads-message-title'));
    near(later.x, rest.x, 0.01);
    near(later.y, rest.y, 0.01);
  });
});

test.describe('colors', () => {
  test('the box is white with the text of the light theme; dark theme: #1f1f1f', async ({ page }) => {
    await call(page, 'info', 'x', 0);
    const paint = () => boxes(page).evaluate((element) => ({ bg: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
    expect(await paint()).toEqual({ bg: 'rgb(255, 255, 255)', color: 'rgba(0, 0, 0, 0.88)' });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect.poll(paint).toEqual({ bg: 'rgb(31, 31, 31)', color: 'rgba(255, 255, 255, 0.85)' });
  });

  test('forced colors: the box gets a border, because the shadow is gone', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    await call(page, 'info', 'x', 0);
    await expect(boxes(page)).toHaveCSS('border-top-width', '1px');
    await expect(boxes(page)).not.toHaveCSS('border-top-style', 'none');
  });
});

test.describe('the timer, with the real pointer and focus', () => {
  test('the pointer over the box holds it, and leaving lets it go', async ({ page }) => {
    await call(page, 'info', 'x', 1);
    await settle(page);
    const box = await rect(boxes(page));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1600);
    await expect(boxes(page)).toHaveCount(1);
    await page.mouse.move(5, 500);
    await expect(boxes(page)).toHaveCount(0, { timeout: 3000 });
  });

  test('focus on the close button holds it', async ({ page }) => {
    await call(page, 'info', { content: 'x', duration: 1, closable: true });
    await page.locator('.ads-message-close').focus();
    await page.waitForTimeout(1600);
    await expect(boxes(page)).toHaveCount(1);
    await page.locator('[data-testid="before"]').focus();
    await expect(boxes(page)).toHaveCount(0, { timeout: 3000 });
  });
});

test.describe('the close button and the keyboard', () => {
  test('a click, Enter and Space close it; Escape inside it closes it', async ({ page }) => {
    for (const how of ['click', 'Enter', ' ', 'Escape']) {
      await call(page, 'info', { content: 'x', duration: 0, closable: true });
      await settle(page);
      const button = page.locator('.ads-message-close');
      if (how === 'click') await button.click();
      else {
        await button.focus();
        await page.keyboard.press(how);
      }
      await expect(boxes(page)).toHaveCount(0);
    }
  });

  test('the layer is the last thing in the Tab order: the page comes first', async ({ page }) => {
    await call(page, 'info', { content: 'x', duration: 0, closable: true });
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('under')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('before')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('after')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.ads-message-close')).toBeFocused();
    // Reached by the keyboard, so it has a visible focus ring.
    expect(await page.locator('.ads-message-close').evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  });

  test('opening a message does not take focus from the page', async ({ page }) => {
    await page.getByTestId('before').focus();
    await call(page, 'error', { content: 'x', duration: 0, closable: true });
    await settle(page);
    await expect(page.getByTestId('before')).toBeFocused();
  });

  test('a link in the content can be reached and pressed', async ({ page }) => {
    await page.evaluate(() => window.__messageLab.message.info(window.__messageLab.snippets.link, 0));
    await page.getByTestId('msg-link').focus();
    await expect(page.getByTestId('msg-link')).toBeFocused();
  });
});

test.describe('the pile (stack)', () => {
  const open = async (page: Page, count: number) => {
    await call(page, 'config', { stack: true });
    for (let index = 1; index <= count; index++) await call(page, 'info', { content: `m${index}`, duration: 0, closable: true });
    await settle(page);
  };

  test('the newest message is the top row, the older ones lie behind it and only the first of them peeks out', async ({ page }) => {
    await open(page, 5);
    const rows = await page.locator('.ads-message-item').evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.querySelector('.ads-message')!;
        const r = box.getBoundingClientRect();
        return { text: box.textContent!.replace(/\s+/g, ' ').trim(), y: r.y, height: r.height, bottom: r.bottom, opacity: Number(getComputedStyle(element).opacity) };
      })
    );
    expect(rows.map((row) => row.text)).toEqual(['Info: m5', 'Info: m4', 'Info: m3', 'Info: m2', 'Info: m1']);
    near(rows[0].y, 8);
    near(rows[0].height, 40, 1.5);
    expect(rows[1].opacity).toBe(1);
    near(rows[1].bottom - rows[0].bottom, 8, 1);
    expect(rows[1].height).toBeLessThan(rows[0].height);
    for (const row of rows.slice(2)) expect(row.opacity).toBe(0);
  });

  test('the pointer opens it into a plain list, newest on top, 56 px apart; leaving closes it', async ({ page }) => {
    await open(page, 5);
    const first = await rect(boxes(page).first());
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await expect.poll(async () => (await rect(boxes(page).nth(4))).y).toBeGreaterThan(200);
    const ys = [];
    for (let index = 0; index < 5; index++) ys.push((await rect(boxes(page).nth(index))).y);
    ys.forEach((y, index) => near(y, 8 + index * 56, 1.5));
    // The gap between two rows is still the pile: the pointer there does not close it.
    await page.mouse.move(first.x + first.width / 2, first.y + first.height + 8);
    await page.waitForTimeout(300);
    near((await rect(boxes(page).nth(4))).y, 8 + 4 * 56, 1.5);
    await page.mouse.move(5, 700);
    await expect.poll(async () => (await rect(boxes(page).nth(4))).y).toBeLessThan(80);
  });

  test('focus on the close button of the newest message opens the pile; the others are inert while it is closed', async ({ page }) => {
    await open(page, 4);
    expect(await page.locator('.ads-message-item[inert]').count()).toBe(3);
    await page.locator('.ads-message-item').first().locator('.ads-message-close').focus();
    await expect.poll(async () => (await rect(boxes(page).nth(3))).y).toBeGreaterThan(150);
    expect(await page.locator('.ads-message-item[inert]').count()).toBe(0);
  });
});

test.describe('motion', () => {
  /** Samples `selector` every frame for `ms` after `action` ran: [time, y, opacity] of each match. */
  async function frames(page: Page, action: string, selector: string, ms: number): Promise<number[][][]> {
    return page.evaluate(
      ([code, sel, duration]) =>
        new Promise<number[][][]>((resolve) => {
          const out: number[][][] = [];
          const start = performance.now();
          new Function('lab', code as string)(window.__messageLab);
          const tick = () => {
            const t = performance.now() - start;
            out.push(
              [...document.querySelectorAll(sel as string)].map((element) => {
                const r = element.getBoundingClientRect();
                // The motion is on the row, not on the box: the opacity that is seen is the product of all of them.
                let opacity = 1;
                for (let node: Element | null = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
                return [Math.round(t), r.y, opacity];
              })
            );
            if (t < (duration as number)) requestAnimationFrame(tick);
            else resolve(out);
          };
          requestAnimationFrame(tick);
        }),
      [action, selector, ms]
    );
  }

  interface Asked {
    target: string;
    keyframes: Keyframe[];
    duration: number;
  }

  /**
   * What the component hands to the engine when `action` runs: the target, the keyframes and the duration of every animation it
   * starts. The frames that an engine draws depend on how busy the machine is (with six browsers on a loaded machine WebKit drew a
   * frame of the middle of a motion after the animation had reported that it was finished, and the first frame that a test could
   * sample came 100 to 250 ms late), so a motion is read where it is defined, and where it ends up is read once it has finished.
   */
  async function animationsOf(page: Page, action: string): Promise<Asked[]> {
    return page.evaluate(
      (code) =>
        new Promise<Asked[]>((resolve) => {
          const seen: Asked[] = [];
          const original = Element.prototype.animate;
          Element.prototype.animate = function (this: Element, keyframes, options) {
            const animation = original.call(this, keyframes, options);
            const effect = animation.effect as KeyframeEffect;
            seen.push({ target: this.className, keyframes: effect.getKeyframes() as Keyframe[], duration: Number(effect.getTiming().duration) });
            return animation;
          };
          new Function('lab', code)(window.__messageLab);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              Element.prototype.animate = original;
              resolve(seen);
            })
          );
        }),
      action
    );
  }

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('a message comes in from above and fades in over about 0.2 s, and ends 8 px from the top', async ({ page }) => {
    const asked = await animationsOf(page, "lab.message.info('x', 0)");
    const entering = asked.filter((one) => one.target.includes('ads-message-item'));
    expect(entering).toHaveLength(1);
    const [from, to] = entering[0].keyframes;
    expect(Number(from.opacity)).toBe(0);
    expect(Number(to.opacity)).toBe(1);
    expect(String(from.transform)).toMatch(/^translateY\(-[1-9][0-9.]*px\)$/);
    expect(String(to.transform)).toMatch(/^translateY\(0(px)?\)$/);
    expect(entering[0].duration).toBeGreaterThan(120);
    expect(entering[0].duration).toBeLessThan(450);

    const box = page.locator('.ads-message');
    await expect.poll(async () => (await box.boundingBox())!.y).toBeCloseTo(8, 0);
    await expect(page.locator('.ads-message-item')).toHaveCSS('opacity', '1');
    await expect(page.locator('.ads-message-item')).toHaveCSS('transform', 'none');
  });

  test('when a message leaves, the one below slides up into its place without a jump, and the leaving one fades', async ({ page }) => {
    await call(page, 'info', { content: 'a', key: 'a', duration: 0 });
    await call(page, 'info', { content: 'b', duration: 0 });
    await page.waitForTimeout(400);
    const out = await frames(page, "lab.message.destroy('a')", '.ads-message', 600);
    const second = out.filter((frame) => frame.length === 2).map((frame) => frame[1][1]);
    expect(second.length, "frames sampled while the row leaves").toBeGreaterThanOrEqual(2);
    // The first frame that is sampled may come late on a busy machine, so it is anywhere on the way from 64 to 8, not above 64.
    expect(second[0]).toBeLessThanOrEqual(72);
    expect(second[0]).toBeGreaterThanOrEqual(8);
    for (let index = 1; index < second.length; index++) {
      expect(second[index]).toBeLessThanOrEqual(second[index - 1] + 0.01);
    }
    const leaving = out.filter((frame) => frame.length === 2).map((frame) => frame[0][2]);
    // It fades: the opacity only goes down, and a busy machine may not let a test sample the last frames, so it need not reach 0.
    expect(Math.min(...leaving)).toBeLessThan(0.8);
    for (let index = 1; index < leaving.length; index++) expect(leaving[index]).toBeLessThanOrEqual(leaving[index - 1] + 0.01);
    await expect(boxes(page)).toHaveCount(1);
    // Where it ends up is read once the row has gone: the last frame that a busy machine lets a test sample can be far from it.
    await expect.poll(async () => (await rect(boxes(page).first())).y).toBeCloseTo(8, 0);
  });

  test('a message that leaves shrinks its row to nothing and fades its box in about 0.2 s, so the ones below slide instead of jumping', async ({ page }) => {
    await call(page, 'info', { content: 'a', key: 'a', duration: 0 });
    await call(page, 'info', { content: 'b', duration: 0 });
    await page.waitForTimeout(400);
    const asked = await animationsOf(page, "lab.message.destroy('a')");
    const shrink = asked.find((one) => one.target.includes('ads-message-slot'))!;
    expect(shrink, 'the row is animated').toBeDefined();
    expect(parseFloat(String(shrink.keyframes[0].height))).toBeGreaterThan(20);
    expect(String(shrink.keyframes[shrink.keyframes.length - 1].height)).toMatch(/^0(px)?$/);
    expect(String(shrink.keyframes[shrink.keyframes.length - 1].paddingBlockEnd)).toMatch(/^0(px)?$/);
    expect(shrink.duration).toBeGreaterThan(120);
    expect(shrink.duration).toBeLessThan(450);
    const fade = asked.find((one) => one.target.includes('ads-message-item'))!;
    expect(fade, 'the box is animated').toBeDefined();
    expect(Number(fade.keyframes[0].opacity)).toBe(1);
    expect(Number(fade.keyframes[fade.keyframes.length - 1].opacity)).toBe(0);
    expect(fade.duration).toBe(shrink.duration);
  });

  test('prefers-reduced-motion: the box is there at full opacity in its first frame, and gone in the next', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const out = await frames(page, "lab.message.info('x', 0)", '.ads-message', 100);
    const first = out.find((frame) => frame.length > 0)![0];
    near(first[1], 8, 0.01);
    expect(first[2]).toBe(1);
    const gone = await frames(page, "lab.message.destroy()", '.ads-message', 200);
    expect(gone.some((frame) => frame.length === 0)).toBe(true);
    await expect(boxes(page)).toHaveCount(0);
  });

  test('a message that is the newest of a pile grows from nothing, so the ones behind it slide down instead of jumping', async ({ page }) => {
    await call(page, 'config', { stack: true });
    await call(page, 'info', { content: 'a', duration: 0 });
    await call(page, 'info', { content: 'b', duration: 0 });
    await page.waitForTimeout(400);
    const out = await frames(page, "lab.message.info({ content: 'c', duration: 0 })", '.ads-message', 500);
    const older = out.filter((frame) => frame.length === 3).map((frame) => frame[2][1]);
    expect(older.length, "frames sampled while the row grows").toBeGreaterThanOrEqual(2);
    near(older[older.length - 1], 8 + 2 * 56, 1);
  });

  test('a message that is the newest of a pile: its row grows from nothing to its height in about 0.2 s', async ({ page }) => {
    await call(page, 'config', { stack: true });
    await call(page, 'info', { content: 'a', duration: 0 });
    await call(page, 'info', { content: 'b', duration: 0 });
    await page.waitForTimeout(400);
    const asked = await animationsOf(page, "lab.message.info({ content: 'c', duration: 0 })");
    const grow = asked.find((one) => one.target.includes('ads-message-slot'))!;
    expect(grow, 'the row is animated').toBeDefined();
    expect(String(grow.keyframes[0].height)).toMatch(/^0(px)?$/);
    expect(parseFloat(String(grow.keyframes[grow.keyframes.length - 1].height))).toBeGreaterThan(20);
    expect(grow.duration).toBeGreaterThan(120);
    expect(grow.duration).toBeLessThan(450);
  });
});

test.describe('the library layer and the host', () => {
  test('with no host the layer is on the body and is gone when the last message has left; a host takes over', async ({ page }) => {
    await call(page, 'info', 'x', 0);
    await settle(page);
    expect(await page.locator('body > .ads-message-list').count()).toBe(1);
    await page.evaluate(() => window.__messageLab.mountHost({ top: 30 }));
    await settle(page);
    near((await rect(boxes(page))).y, 30);
    expect(await boxes(page).count()).toBe(1);
    await call(page, 'destroy');
    await settle(page);
    expect(await page.locator('.ads-message-list').count()).toBe(0);
  });
});
