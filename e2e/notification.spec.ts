// The Notification in a real browser, in the three engines (specs/notification.md): the geometry of the six places and the order
// of the rows, the clicks that pass through the layer, the layout rules, the pile at a top and at a bottom place, the strip, the
// motion of each place, the scroll of a tall list, the keyboard. It runs against the lab at `/#notification`
// (e2e/fixtures/NotificationLab.svelte). What jsdom cannot show is here; the calls and the timers are in tests/Notification.test.ts.
import { expect, test, type Locator, type Page } from '@playwright/test';

type Rect = { x: number; y: number; width: number; height: number };
type Lab = {
  notification: Record<string, (...args: unknown[]) => unknown>;
  mountHost(props?: unknown, containerId?: string): void;
  unmountHost(): void;
  setRtl(value: boolean): void;
  underClicks(): number;
  snippets: Record<string, unknown>;
};
declare global {
  interface Window {
    __notificationLab: Lab;
  }
}

/** Calls `notification[method](...args)` in the page. */
function call(page: Page, method: string, ...args: unknown[]): Promise<void> {
  return page.evaluate(([name, list]) => void window.__notificationLab.notification[name as string](...(list as unknown[])), [method, args]);
}

/** Opens `{ title, duration: 0, ...extra }` with the snippet of the lab named `actions` as its actions (a function cannot cross into the page). */
const openWithActions = (page: Page, title: string, extra: Record<string, unknown> = {}) =>
  page.evaluate(
    ([name, more]) => void window.__notificationLab.notification.info({ title: name as string, duration: 0, actions: window.__notificationLab.snippets.action, ...(more as object) }),
    [title, extra]
  );

/** Opens `{ title, duration: 0, ...extra }` with `method`. */
const open = (page: Page, title: string, extra: Record<string, unknown> = {}, method = 'info') => call(page, method, { title, duration: 0, ...extra });

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

const boxes = (page: Page) => page.locator('.ads-notification');
const place = (page: Page, placement: string) => page.locator(`.ads-notification-list[data-placement="${placement}"]`);
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(tolerance);

test.beforeEach(async ({ page }) => {
  await page.goto('/#notification');
  await page.waitForFunction(() => Boolean(window.__notificationLab));
  // No motion: a rectangle is final right after a change. The motion has its own tests below.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('placement', () => {
  test('at topRight the box is 24 px from the top and the right, 384 px wide; the next one stands 16 px below it, and is the older one', async ({ page }) => {
    await open(page, 'First', { description: 'text' });
    await open(page, 'Second', { description: 'text' });
    await settle(page);
    const viewport = page.viewportSize()!;
    const [second, first] = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    await expect(boxes(page).nth(0)).toContainText('Second');
    near(second.y, 24);
    near(second.x + second.width, viewport.width - 24);
    near(second.width, 384);
    near(first.y, second.y + second.height + 16);
    near(first.x, second.x);
  });

  test('at bottomRight the newest stands 24 px from the bottom and the older ones are above it, 16 px apart', async ({ page }) => {
    await open(page, 'First', { placement: 'bottomRight', description: 'text' });
    await open(page, 'Second', { placement: 'bottomRight', description: 'text' });
    await settle(page);
    const viewport = page.viewportSize()!;
    const [first, second] = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    await expect(boxes(page).nth(1)).toContainText('Second');
    near(second.y + second.height, viewport.height - 24);
    near(first.y + first.height + 16, second.y);
    near(second.x + second.width, viewport.width - 24);
  });

  test('the six places: the left ones 24 px from the left edge, the right ones from the right, top and bottom centred; the top ones 24 px down and the bottom ones 24 px up', async ({ page }) => {
    const names = ['topLeft', 'top', 'topRight', 'bottomLeft', 'bottom', 'bottomRight'];
    for (const placement of names) await open(page, placement, { placement });
    await settle(page);
    const { width, height } = page.viewportSize()!;
    for (const placement of names) {
      const box = await rect(place(page, placement).locator('.ads-notification'));
      if (placement.endsWith('Left')) near(box.x, 24);
      else if (placement.endsWith('Right')) near(box.x + box.width, width - 24);
      else near(box.x + box.width / 2, width / 2);
      if (placement.startsWith('top')) near(box.y, 24);
      else near(box.y + box.height, height - 24);
    }
  });

  test('a title alone makes a box 64 px high, and a title with two lines of text 116 px (20 + 24 + 8 + 44 + 20)', async ({ page }) => {
    await open(page, 'Only a title');
    await open(page, 'Title', { description: 'This is the description of the notification. It is two lines long at least, and breaks.' });
    await settle(page);
    near((await rect(boxes(page).nth(1))).height, 64, 1);
    near((await rect(boxes(page).nth(0))).height, 116, 1);
  });

  test('the layer is at z-index 2050 on the body, above the Message (2010)', async ({ page }) => {
    await open(page, 'x');
    const layer = page.locator('.ads-notification-layer');
    expect(await layer.evaluate((element) => getComputedStyle(element).zIndex)).toBe('2050');
    expect(await layer.evaluate((element) => element.parentElement === document.body)).toBe(true);
  });

  test('a click next to a notification reaches the page under the layer; a click on the box does not', async ({ page }) => {
    await open(page, 'x', { placement: 'topLeft', stack: undefined });
    await settle(page);
    // The button is under the top left place, on its 24 px margin, where there is no box.
    await page.getByTestId('under').click({ position: { x: 4, y: 4 } });
    expect(await page.evaluate(() => window.__notificationLab.underClicks())).toBe(1);
    await page.getByTestId('under').click({ position: { x: 4, y: 4 } });
    const box = await rect(boxes(page));
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    expect(await page.evaluate(() => window.__notificationLab.underClicks())).toBe(2);
  });

  test('on a phone the box is never wider than the window, the text wraps, and the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await open(page, 'A_very_long_word_without_any_space_in_it_that_would_run_out_of_the_box_if_it_could', {
      description: 'And a long text that needs to wrap inside the box.'
    });
    await open(page, 'x', { placement: 'bottomLeft' });
    await settle(page);
    for (let index = 0; index < 2; index++) {
      const box = await rect(boxes(page).nth(index));
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('top and bottom: a number, and a string', async ({ page }) => {
    await call(page, 'config', { top: 40, bottom: '3rem' });
    await open(page, 'a');
    await open(page, 'b', { placement: 'bottomRight' });
    await settle(page);
    const { height } = page.viewportSize()!;
    near((await rect(place(page, 'topRight').locator('.ads-notification'))).y, 40);
    const bottomBox = await rect(place(page, 'bottomRight').locator('.ads-notification'));
    near(bottomBox.y + bottomBox.height, height - 48);
  });

  test('container: the layer goes to the element, and is still fixed to the window', async ({ page }) => {
    await page.evaluate(() => window.__notificationLab.mountHost({}, 'container'));
    await open(page, 'x');
    await settle(page);
    expect(await page.locator('.ads-notification-layer').evaluate((element) => element.parentElement?.id)).toBe('container');
    near((await rect(boxes(page))).y, 24);
  });

  test('right to left: the icon is on the right of the title', async ({ page }) => {
    await page.evaluate(() => window.__notificationLab.setRtl(true));
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    await open(page, 'Title', {}, 'success');
    await settle(page);
    const icon = await rect(page.locator('.ads-notification-icon'));
    const title = await rect(page.locator('.ads-notification-title'));
    expect(icon.x).toBeGreaterThan(title.x);
  });
});

test.describe('layout rules', () => {
  test('a notification that changes type by key keeps its width and height and place, and the one behind does not move', async ({ page }) => {
    await open(page, 'behind', { key: 'b', description: 'text' });
    await open(page, 'Title', { key: 'k', description: 'text' });
    await settle(page);
    const before = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    await call(page, 'error', { title: 'Title', key: 'k', description: 'text', duration: 0 });
    await settle(page);
    const after = [await rect(boxes(page).nth(0)), await rect(boxes(page).nth(1))];
    expect(after).toEqual(before);
  });

  test('a close button with a wide content (a word) grows to hold it, so that its hover background covers all of it, and the title keeps out from under it', async ({ page }) => {
    // A long title that wraps: its first line must stop before the button, which is wider than the cross.
    await open(page, 'A long title that goes over a few lines of the box and must not run under the close button', { closeIcon: 'Close all' });
    await settle(page);
    const button = page.locator('.ads-notification-close');
    const sizes = await button.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      const title = element.closest('.ads-notification')!.querySelector('.ads-notification-title')!;
      const style = getComputedStyle(title);
      // The right edge of the room of the text of the title (the content box), and the left edge of the button.
      const contentRight = title.getBoundingClientRect().right - parseFloat(style.paddingRight);
      return { boxLeft: box.left, boxRight: box.right, boxHeight: box.height, textLeft: text.left, textRight: text.right, contentRight };
    });
    // The background of the button is its box: the whole word is inside it, with some air.
    expect(sizes.textLeft).toBeGreaterThanOrEqual(sizes.boxLeft + 1);
    expect(sizes.textRight).toBeLessThanOrEqual(sizes.boxRight - 1);
    near(sizes.boxHeight, 24, 0.5);
    // The text of the title stops before the button.
    expect(sizes.contentRight).toBeLessThanOrEqual(sizes.boxLeft);
    // The cross is still a 24 px square.
    await call(page, 'destroy');
    await open(page, 'Plain');
    await settle(page);
    const cross = await rect(page.locator('.ads-notification-close'));
    near(cross.width, 24, 0.5);
    near(cross.height, 24, 0.5);
  });

  test('adding the actions, the close button or the strip by an update changes the height only, never the width', async ({ page }) => {
    await open(page, 'T', { key: 'k', closable: false });
    await settle(page);
    const base = await rect(boxes(page));
    await call(page, 'info', { title: 'T', key: 'k', duration: 5, closable: true, showProgress: true });
    await settle(page);
    const withButton = await rect(boxes(page));
    near(withButton.width, base.width, 0.5);
    near(withButton.height, base.height, 0.5);
    await openWithActions(page, 'T', { key: 'k' });
    await settle(page);
    const withActions = await rect(boxes(page));
    near(withActions.width, base.width, 0.5);
    expect(withActions.height).toBeGreaterThan(base.height + 20);
  });

  test('the icon does not change the height: with it, without it, and a custom one', async ({ page }) => {
    await call(page, 'config', { stack: false });
    await open(page, 'a', { icon: false }, 'success');
    await open(page, 'b', {}, 'success');
    await open(page, 'c', { icon: '★' }, 'success');
    await open(page, 'd', {}, 'open');
    await settle(page);
    const heights = [];
    for (let index = 0; index < 4; index++) heights.push((await rect(boxes(page).nth(index))).height);
    for (const height of heights) near(height, 64, 1);
  });

  test('the text does not shift when the box has finished coming in', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page, 'x', {}, 'success');
    await page.waitForTimeout(500);
    const title = page.locator('.ads-notification-title');
    const first = await rect(title);
    await page.waitForTimeout(200);
    expect(await rect(title)).toEqual(first);
  });
});

test.describe('colors', () => {
  test('the box is white with the text of the light theme, the type tints only the icon; dark theme: #1f1f1f', async ({ page }) => {
    await open(page, 'x', { description: 'y' }, 'success');
    const paint = () =>
      boxes(page).evaluate((element) => ({
        bg: getComputedStyle(element).backgroundColor,
        color: getComputedStyle(element).color,
        radius: getComputedStyle(element).borderRadius,
        padding: getComputedStyle(element).padding
      }));
    expect(await paint()).toEqual({ bg: 'rgb(255, 255, 255)', color: 'rgba(0, 0, 0, 0.88)', radius: '8px', padding: '20px 24px' });
    await expect(page.locator('.ads-notification-icon')).toHaveCSS('color', 'rgb(56, 158, 13)');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect.poll(async () => (await paint()).bg).toBe('rgb(31, 31, 31)');
    expect((await paint()).color).toBe('rgba(255, 255, 255, 0.85)');
  });

  test('the title is 16 px on 24 px, the description 14 px on 22 px, 8 px apart', async ({ page }) => {
    await open(page, 'T', { description: 'D' });
    await settle(page);
    await expect(page.locator('.ads-notification-title')).toHaveCSS('font-size', '16px');
    await expect(page.locator('.ads-notification-description')).toHaveCSS('font-size', '14px');
    const title = await rect(page.locator('.ads-notification-title'));
    const description = await rect(page.locator('.ads-notification-description'));
    near(title.height, 24);
    near(description.height, 22);
    near(description.y - (title.y + title.height), 8);
  });

  test('forced colors: the box gets a border, because the shadow is gone, and the strip is drawn', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    await open(page, 'x', { duration: 60, showProgress: true });
    await expect(boxes(page)).toHaveCSS('border-top-width', '1px');
    await expect(boxes(page)).not.toHaveCSS('border-top-style', 'none');
    const bar = page.locator('.ads-notification-progress-bar');
    await expect(bar).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect((await rect(bar)).width).toBeGreaterThan(100);
  });
});

test.describe('the timer and the strip, with the real pointer and focus', () => {
  test('the pointer over the box holds the strip and the timer, and leaving lets them go', async ({ page }) => {
    await call(page, 'info', { title: 'x', duration: 3, showProgress: true });
    const bar = page.locator('.ads-notification-progress-bar');
    const box = await rect(boxes(page));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    const held = (await rect(bar)).width;
    await page.waitForTimeout(1500);
    near((await rect(bar)).width, held, 1);
    await expect(boxes(page)).toHaveCount(1);
    await page.mouse.move(5, 5);
    await expect.poll(async () => (await rect(bar)).width).toBeLessThan(held - 20);
    await expect(boxes(page)).toHaveCount(0, { timeout: 4500 });
  });

  test('the strip starts full and runs down with the time: its width is what is left of the 2 s, whenever the engine got to draw it', async ({ page }) => {
    // Read in the page against its own clock: how late an engine starts does not matter, only that the width matches the time.
    const samples = await page.evaluate(
      () =>
        new Promise<number[][]>((resolve) => {
          const start = performance.now();
          window.__notificationLab.notification.info({ title: 'x', duration: 2, showProgress: true });
          const out: number[][] = [];
          const tick = () => {
            const t = performance.now() - start;
            const bar = document.querySelector('.ads-notification-progress-bar');
            const track = document.querySelector('.ads-notification-progress');
            if (bar && track) out.push([t, bar.getBoundingClientRect().width / track.getBoundingClientRect().width]);
            if (t < 1400) requestAnimationFrame(tick);
            else resolve(out);
          };
          requestAnimationFrame(tick);
        })
    );
    expect(samples.length).toBeGreaterThan(5);
    for (const [t, fraction] of samples) near(fraction, 1 - t / 2000, 0.15);
    for (let index = 1; index < samples.length; index++) expect(samples[index][1]).toBeLessThanOrEqual(samples[index - 1][1] + 0.001);
    expect(samples[0][1]).toBeGreaterThan(0.8);
    expect(samples[samples.length - 1][1]).toBeLessThan(0.5);
  });

  test('focus on the close button holds the timer', async ({ page }) => {
    await call(page, 'info', { title: 'x', duration: 1 });
    await page.locator('.ads-notification-close').focus();
    await page.waitForTimeout(1600);
    await expect(boxes(page)).toHaveCount(1);
    await page.locator('.ads-notification-close').blur();
    await expect(boxes(page)).toHaveCount(0, { timeout: 2500 });
  });
});

test.describe('the close button and the keyboard', () => {
  test('a click, Enter and Space close it; Escape inside it closes it', async ({ page }) => {
    await open(page, 'a');
    await page.locator('.ads-notification-close').click();
    await expect(boxes(page)).toHaveCount(0);
    for (const key of ['Enter', 'Space']) {
      await open(page, 'b');
      await page.locator('.ads-notification-close').focus();
      await page.keyboard.press(key);
      await expect(boxes(page)).toHaveCount(0);
    }
    await open(page, 'c');
    await page.locator('.ads-notification-close').focus();
    await page.keyboard.press('Escape');
    await expect(boxes(page)).toHaveCount(0);
  });

  test('the button is 24 px square and shows where it is: nothing at rest, a faint background on hover, a ring on the keyboard focus', async ({ page }) => {
    await open(page, 'a', { description: 'b' });
    const button = page.locator('.ads-notification-close');
    const size = await rect(button);
    near(size.width, 24, 0.5);
    near(size.height, 24, 0.5);
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await button.hover();
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.06)');
    await page.mouse.move(5, 5);
    await page.getByTestId('after').focus();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect(button).not.toHaveCSS('outline-style', 'none');
  });

  test('the layer is the last thing in the Tab order: the page comes first; the actions come before the close button', async ({ page }) => {
    await openWithActions(page, 'a');
    await page.getByTestId('after').focus();
    const order: (string | null)[] = [];
    for (let index = 0; index < 3; index++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName ?? null));
    }
    expect(order).toEqual(['note-action', 'note-link', 'Close']);
  });

  test('opening a notification does not take focus from the page', async ({ page }) => {
    await page.getByTestId('before').focus();
    await open(page, 'x');
    await settle(page);
    await expect(page.getByTestId('before')).toBeFocused();
  });
});

test.describe('the pile (stack)', () => {
  const pile = async (page: Page, count: number, extra: Record<string, unknown> = {}) => {
    for (let index = 1; index <= count; index++) await open(page, `m${index}`, { description: 'text', ...extra });
    await settle(page);
  };
  const rows = (page: Page, placement: string) =>
    place(page, placement)
      .locator('.ads-notification-item')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.querySelector('.ads-notification')!;
          const r = box.getBoundingClientRect();
          return { text: box.querySelector('.ads-notification-title')!.textContent!.replace(/\s+/g, ' ').trim(), y: r.y, height: r.height, bottom: r.bottom, width: r.width, opacity: Number(getComputedStyle(element).opacity) };
        })
      );

  test('at a top place the newest is the first row; the older ones lie behind it, each 8 px lower and smaller, and the ones past the third are not seen', async ({ page }) => {
    await pile(page, 5);
    const list = await rows(page, 'topRight');
    expect(list.map((row) => row.text)).toEqual(['Info: m5', 'Info: m4', 'Info: m3', 'Info: m2', 'Info: m1']);
    near(list[0].y, 24);
    near(list[0].height, 94, 1);
    near(list[1].bottom - list[0].bottom, 8, 1);
    near(list[2].bottom - list[1].bottom, 8, 1);
    near(list[1].width / list[0].width, 0.94, 0.01);
    near(list[2].width / list[0].width, 0.88, 0.01);
    expect(list[1].opacity).toBe(1);
    expect(list[2].opacity).toBe(1);
    for (const row of list.slice(3)) expect(row.opacity).toBe(0);
  });

  test('at a bottom place the same, mirrored: the newest is the last row, nearest the edge; the older ones lie behind it, 8 px higher', async ({ page }) => {
    await pile(page, 5, { placement: 'bottomRight' });
    const list = await rows(page, 'bottomRight');
    expect(list.map((row) => row.text)).toEqual(['Info: m1', 'Info: m2', 'Info: m3', 'Info: m4', 'Info: m5']);
    const newest = list[4];
    near(newest.bottom, page.viewportSize()!.height - 24);
    near(list[3].y - newest.y, -8, 1);
    near(list[2].y - list[3].y, -8, 1);
    near(list[3].width / newest.width, 0.94, 0.01);
    expect(list[3].opacity).toBe(1);
    expect(list[2].opacity).toBe(1);
    for (const row of list.slice(0, 2)) expect(row.opacity).toBe(0);
  });

  test('a collapsed pile does not scroll, however many rows lie behind the newest: the hidden ones do not add to the scroll area', async ({ page }) => {
    for (const placement of ['topRight', 'bottomRight', 'top', 'bottom']) await pile(page, 12, { placement });
    for (const placement of ['topRight', 'bottomRight', 'top', 'bottom']) {
      const list = place(page, placement);
      await expect(list.locator('.ads-notification-piled')).toHaveCount(1);
      const sizes = await list.evaluate((element) => ({ scroll: element.scrollHeight, client: element.clientHeight }));
      expect(sizes.scroll, placement).toBeLessThanOrEqual(sizes.client);
      // The place is as tall as the newest box and its margins: the pile adds nothing to it.
      expect(sizes.client, placement).toBeLessThan(200);
    }
  });

  test('the pointer opens it into a plain list, newest first, 110 px apart; leaving closes it, and the gap between two rows keeps it open', async ({ page }) => {
    await pile(page, 5);
    const first = await rect(boxes(page).first());
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await expect.poll(async () => (await rect(boxes(page).nth(4))).y).toBeGreaterThan(300);
    for (let index = 0; index < 5; index++) near((await rect(boxes(page).nth(index))).y, 24 + index * 110, 1.5);
    await page.mouse.move(first.x + first.width / 2, first.y + first.height + 8);
    await page.waitForTimeout(300);
    near((await rect(boxes(page).nth(4))).y, 24 + 4 * 110, 1.5);
    await page.mouse.move(5, 700);
    await expect.poll(async () => (await rect(boxes(page).nth(4))).y).toBeLessThan(120);
  });

  test('each place is a pile of its own', async ({ page }) => {
    await pile(page, 4);
    await pile(page, 4, { placement: 'bottomRight' });
    const first = await rect(place(page, 'topRight').locator('.ads-notification').first());
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await expect(place(page, 'topRight').locator('.ads-notification-piled')).toHaveCount(0);
    await expect(place(page, 'bottomRight').locator('.ads-notification-piled')).toHaveCount(1);
  });

  test('focus on the close button of the newest opens the pile; the others are inert while it is closed', async ({ page }) => {
    await pile(page, 4);
    const inert = await page.locator('.ads-notification-item[inert]').count();
    expect(inert).toBe(3);
    await page.locator('.ads-notification-item:not([inert]) .ads-notification-close').focus();
    await expect(place(page, 'topRight').locator('.ads-notification-piled')).toHaveCount(0);
    await expect(page.locator('.ads-notification-item[inert]')).toHaveCount(0);
  });

  test('no layout jump of the newest box when the pile opens', async ({ page }) => {
    await pile(page, 5);
    const before = await rect(boxes(page).first());
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await expect.poll(async () => (await rect(boxes(page).nth(4))).y).toBeGreaterThan(300);
    expect(await rect(boxes(page).first())).toEqual(before);
  });

  test('stack: false keeps a plain list however many there are', async ({ page }) => {
    await call(page, 'config', { stack: false });
    await pile(page, 6);
    await expect(page.locator('.ads-notification-piled')).toHaveCount(0);
    const ys = [];
    for (let index = 0; index < 3; index++) ys.push((await rect(boxes(page).nth(index))).y);
    near(ys[1] - ys[0], 110, 1.5);
  });
});

test.describe('a tall list', () => {
  test('a place taller than the window scrolls, and its last row can be reached', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 400 });
    await call(page, 'config', { stack: false });
    for (let index = 1; index <= 6; index++) await open(page, `m${index}`, { description: 'text' });
    await settle(page);
    const list = place(page, 'topRight');
    const sizes = await list.evaluate((element) => ({ scroll: element.scrollHeight, client: element.clientHeight, overflow: getComputedStyle(element).overflowY }));
    expect(sizes.overflow).toBe('auto');
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    near(sizes.client, 400, 1);
    await list.evaluate((element) => (element.scrollTop = element.scrollHeight));
    const last = await rect(boxes(page).nth(5));
    expect(last.y + last.height).toBeLessThanOrEqual(400);
  });

  test('at a bottom place the newest row stays in view while rows come in', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 400 });
    await call(page, 'config', { stack: false });
    for (let index = 1; index <= 6; index++) await open(page, `m${index}`, { description: 'text', placement: 'bottomRight' });
    await page.waitForTimeout(600);
    const newest = await rect(boxes(page).nth(5));
    await expect(boxes(page).nth(5)).toContainText('m6');
    expect(newest.y + newest.height).toBeLessThanOrEqual(400 + 1);
    expect(newest.y).toBeGreaterThanOrEqual(0);
  });
});

test.describe('motion', () => {
  interface Asked {
    target: string;
    keyframes: Keyframe[];
    duration: number;
  }

  /**
   * What the component hands to the engine when `action` runs: the target, the keyframes and the duration of every animation it
   * starts. The frames that an engine draws depend on how busy the machine is, so a motion is read where it is defined, and where it
   * ends up is read once it has finished.
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
          new Function('lab', code)(window.__notificationLab);
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

  // The slot of a row that comes in grows from nothing and the box stands out of it until it has grown; a leaving row shrinks its slot
  // the same way. Out of a place at the end of its list (every bottom place) that hangs below the list, and it is scrollable overflow
  // unless the content clips it: the place showed a scrollbar for the length of the motion (the owner, 2026-11-19, bottomRight).
  for (const placement of ['topRight', 'bottomRight', 'topLeft', 'bottomLeft', 'top', 'bottom']) {
    test(`${placement}: no scrollbar while rows come in, fold into a pile and leave`, async ({ page }) => {
      const worst = await page.evaluate(
        async ([where]) => {
          const lab = window.__notificationLab;
          let worst = 0;
          let running = true;
          const watch = () => {
            const list = document.querySelector(`.ads-notification-list[data-placement="${where}"]`);
            if (list) worst = Math.max(worst, list.scrollHeight - list.clientHeight);
            if (running) requestAnimationFrame(watch);
          };
          watch();
          // Five rows: the first three stand in a plain list, the fourth folds them into a pile, the fifth comes into the pile.
          for (let index = 1; index <= 5; index++) {
            lab.notification.info({ title: `m${index}`, description: 'text', duration: 0, placement: where });
            await new Promise((done) => setTimeout(done, 330));
          }
          lab.notification.destroy();
          await new Promise((done) => setTimeout(done, 500));
          running = false;
          return worst;
        },
        [placement]
      );
      expect(worst).toBeLessThanOrEqual(1);
    });
  }

  const sides: [string, RegExp][] = [
    ['topRight', /^translateX\([1-9][0-9.]*px\)$/],
    ['bottomRight', /^translateX\([1-9][0-9.]*px\)$/],
    ['topLeft', /^translateX\(-[1-9][0-9.]*px\)$/],
    ['bottomLeft', /^translateX\(-[1-9][0-9.]*px\)$/],
    ['top', /^translateY\(-[1-9][0-9.]*px\)$/],
    ['bottom', /^translateY\([1-9][0-9.]*px\)$/]
  ];

  for (const [placement, pattern] of sides) {
    test(`${placement}: the box comes in from its side and fades in over about 0.2 s, and ends in its place`, async ({ page }) => {
      const asked = await animationsOf(page, `lab.notification.info({ title: 'x', duration: 0, placement: '${placement}' })`);
      const entering = asked.filter((one) => one.target.includes('ads-notification-item'));
      expect(entering).toHaveLength(1);
      const [from, to] = entering[0].keyframes;
      expect(Number(from.opacity)).toBe(0);
      expect(Number(to.opacity)).toBe(1);
      expect(String(from.transform)).toMatch(pattern);
      expect(String(to.transform)).toMatch(/^translate[XY]\(0(px)?\)$/);
      expect(entering[0].duration).toBeGreaterThan(120);
      expect(entering[0].duration).toBeLessThan(450);
      await expect(page.locator('.ads-notification-item')).toHaveCSS('opacity', '1');
      await expect(page.locator('.ads-notification-item')).toHaveCSS('transform', 'none');
    });
  }

  test('the distance of the slide is 64 px, the token of the notification', async ({ page }) => {
    const asked = await animationsOf(page, "lab.notification.info({ title: 'x', duration: 0 })");
    expect(String(asked.find((one) => one.target.includes('ads-notification-item'))!.keyframes[0].transform)).toBe('translateX(64px)');
  });

  test('a notification that leaves goes back to its side and shrinks its row to nothing, so the others slide instead of jumping', async ({ page }) => {
    await open(page, 'a', { key: 'a', description: 'text' });
    await open(page, 'b', { description: 'text' });
    await page.waitForTimeout(400);
    const asked = await animationsOf(page, "lab.notification.destroy('a')");
    const leaving = asked.filter((one) => one.target.includes('ads-notification-item'));
    const shrinking = asked.filter((one) => one.target.includes('ads-notification-slot'));
    expect(leaving).toHaveLength(1);
    expect(shrinking).toHaveLength(1);
    expect(Number(leaving[0].keyframes[1].opacity)).toBe(0);
    expect(String(leaving[0].keyframes[1].transform)).toMatch(/^translateX\(/);
    expect(String(shrinking[0].keyframes[1].height)).toBe('0px');
    await expect(boxes(page)).toHaveCount(1);
  });

  test('a notification that is leaving takes no pointer: a click on it goes to what is under it', async ({ page }) => {
    await open(page, 'x', { placement: 'topLeft' });
    await page.waitForTimeout(400);
    const box = await rect(boxes(page));
    await page.evaluate(() => {
      // Hold the exit still: the box stays on the page, leaving.
      Element.prototype.animate = new Proxy(Element.prototype.animate, {
        apply(target, element: Element, args: [Keyframe[], KeyframeAnimationOptions]) {
          const animation = Reflect.apply(target, element, args) as Animation;
          animation.pause();
          return animation;
        }
      });
      window.__notificationLab.notification.destroy();
    });
    await page.waitForTimeout(100);
    await expect(page.locator('.ads-notification-leaving')).toHaveCount(1);
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className ?? '', [box.x + 30, box.y + 10]);
    expect(String(hit)).not.toContain('ads-notification');
  });

  test('prefers-reduced-motion: the box is there at full opacity in its first frame, and gone in the next', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const asked = await animationsOf(page, "lab.notification.info({ title: 'x', duration: 0 })");
    expect(asked).toEqual([]);
    await expect(boxes(page)).toHaveCSS('opacity', '1');
  });

  test('the newest row of a place that has others grows from nothing, so the older ones slide away from the edge instead of jumping', async ({ page }) => {
    await open(page, 'a', { description: 'text' });
    await page.waitForTimeout(400);
    const asked = await animationsOf(page, "lab.notification.info({ title: 'b', duration: 0, description: 'text' })");
    const growing = asked.filter((one) => one.target.includes('ads-notification-slot'));
    expect(growing).toHaveLength(1);
    expect(String(growing[0].keyframes[0].height)).toBe('0px');
    expect(String(growing[0].keyframes[1].height)).not.toBe('0px');
    expect(growing[0].keyframes[0]).toHaveProperty('paddingBlockEnd');
  });

  test('at a bottom place the gap that grows is the one at the start of the row', async ({ page }) => {
    await open(page, 'a', { description: 'text', placement: 'bottomRight' });
    await page.waitForTimeout(400);
    const asked = await animationsOf(page, "lab.notification.info({ title: 'b', duration: 0, description: 'text', placement: 'bottomRight' })");
    const growing = asked.filter((one) => one.target.includes('ads-notification-slot'));
    expect(growing[0].keyframes[0]).toHaveProperty('paddingBlockStart');
  });
});

test.describe('the library layer and the host', () => {
  test('with no host the layer is on the body and is gone when the last notification has left; a host takes over', async ({ page }) => {
    await call(page, 'info', { title: 'x', duration: 1 });
    await expect(page.locator('.ads-notification-layer')).toHaveCount(1);
    await expect(page.locator('.ads-notification-layer')).toHaveCount(0, { timeout: 3000 });
    await open(page, 'y');
    await page.evaluate(() => window.__notificationLab.mountHost({ placement: 'bottomLeft' }));
    await settle(page);
    await expect(place(page, 'bottomLeft').locator('.ads-notification')).toHaveCount(1);
    await expect(page.locator('.ads-notification-layer')).toHaveCount(1);
  });
});
