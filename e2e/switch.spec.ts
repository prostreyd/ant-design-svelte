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
  return locator.evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop), property);
}

type Rgba = { r: number; g: number; b: number; a: number };
type SwitchContrast = { track: number; handle: number; text: number };

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
    w.__switchContrast = (element: Element): SwitchContrast => {
      const page = backdrop(element);
      const track = over(parse(getComputedStyle(element).backgroundColor), page);
      const handle = over(
        parse(getComputedStyle(element.querySelector('.ads-switch-indicator')!).backgroundColor),
        track
      );
      const text = over(
        parse(getComputedStyle(element.querySelector('.ads-switch-content')!).color),
        track
      );
      return { track: ratio(track, page), handle: ratio(handle, track), text: ratio(text, track) };
    };
    w.__ringContrast = (element: Element) => {
      const ring = over(parse(getComputedStyle(element).outlineColor), backdrop(element));
      return ratio(ring, backdrop(element));
    };
  });
}

const contrastOf = (locator: Locator) =>
  locator.evaluate(
    (element) =>
      (window as unknown as { __switchContrast(e: Element): SwitchContrast }).__switchContrast(element)
  );

const MATRIX_IDS = ['sw-off', 'sw-on', 'sw-small-off', 'sw-small-on', 'sw-text-off', 'sw-text-on'];

/** The position of the handle relative to the left edge of the switch. */
async function handleOffset(locator: Locator): Promise<{ left: number; right: number; width: number }> {
  return locator.evaluate((element) => {
    const switchBox = element.getBoundingClientRect();
    const handleBox = element.querySelector('.ads-switch-indicator')!.getBoundingClientRect();
    return {
      left: Math.round((handleBox.left - switchBox.left) * 100) / 100,
      right: Math.round((switchBox.right - handleBox.right) * 100) / 100,
      width: Math.round(handleBox.width * 100) / 100
    };
  });
}

test.describe('Switch visual states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // No transitions: computed colours and positions are final right after a state change.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('rest: the track uses the off and on tokens', async ({ page }) => {
    const off = await resolveToken(page, 'background-color', '--ads-switch-track-off');
    const on = await resolveToken(page, 'background-color', '--ads-switch-track-on');
    expect(await computed(page.getByTestId('sw-off'), 'background-color')).toBe(off);
    expect(await computed(page.getByTestId('sw-on'), 'background-color')).toBe(on);
  });

  test('hover: the track uses the hover tokens', async ({ page }) => {
    const offHover = await resolveToken(page, 'background-color', '--ads-switch-track-off-hover');
    const onHover = await resolveToken(page, 'background-color', '--ads-switch-track-on-hover');
    await page.getByTestId('sw-off').hover();
    expect(await computed(page.getByTestId('sw-off'), 'background-color')).toBe(offHover);
    await page.getByTestId('sw-on').hover();
    expect(await computed(page.getByTestId('sw-on'), 'background-color')).toBe(onHover);
  });

  test('active: the track uses the pressed tokens while the button is held', async ({ page }) => {
    const offActive = await resolveToken(page, 'background-color', '--ads-switch-track-off-active');
    const target = page.getByTestId('sw-off');
    await target.hover();
    await page.mouse.down();
    expect(await computed(target, 'background-color')).toBe(offActive);
    await page.mouse.up();
  });

  test('focus-visible: keyboard focus shows the focus outline from the tokens', async ({ page }) => {
    const color = await resolveToken(page, 'outline-color', '--ads-color-focus-outline');
    const target = page.getByTestId('sw-off');
    await page.keyboard.press('Tab');
    await target.focus();
    expect(await target.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    expect(await computed(target, 'outline-color')).toBe(color);
    expect(await computed(target, 'outline-style')).toBe('solid');
    expect(await computed(target, 'outline-width')).toBe('2px');
  });

  test('a mouse click does not show the focus outline', async ({ page }) => {
    const target = page.getByTestId('sw-off');
    await target.click();
    expect(await target.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
    expect(await computed(target, 'outline-style')).not.toBe('solid');
  });

  test('medium and small: the track and the handle have the token sizes', async ({ page }) => {
    const medium = await page.getByTestId('sw-off').boundingBox();
    const small = await page.getByTestId('sw-small-off').boundingBox();
    expect([medium?.width, medium?.height]).toEqual([44, 22]);
    expect([small?.width, small?.height]).toEqual([28, 16]);
    expect((await handleOffset(page.getByTestId('sw-off'))).width).toBe(18);
    expect((await handleOffset(page.getByTestId('sw-small-off'))).width).toBe(12);
  });

  test('the handle sits at the start when off and at the end when on', async ({ page }) => {
    for (const [off, on] of [
      ['sw-off', 'sw-on'],
      ['sw-small-off', 'sw-small-on']
    ]) {
      expect(await handleOffset(page.getByTestId(off))).toMatchObject({ left: 2 });
      expect(await handleOffset(page.getByTestId(on))).toMatchObject({ right: 2 });
    }
  });

  test('a click moves the handle to the other end', async ({ page }) => {
    const target = page.getByTestId('sw-off');
    await target.click();
    await expect(target).toHaveAttribute('aria-checked', 'true');
    expect(await handleOffset(target)).toMatchObject({ right: 2 });
    await target.click();
    expect(await handleOffset(target)).toMatchObject({ left: 2 });
  });

  test('text: the switch grows to fit its text and shows the text of its state', async ({ page }) => {
    const shown = '.ads-switch-content-item:not(.ads-switch-content-hidden)';
    for (const id of ['sw-text-off', 'sw-text-on']) {
      const box = await page.getByTestId(id).boundingBox();
      const content = await page.getByTestId(id).locator('.ads-switch-content').boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(content?.width).toBeGreaterThan(0);
    }
    await expect(page.getByTestId('sw-text-off').locator(shown)).toHaveText('Off');
    await expect(page.getByTestId('sw-text-on').locator(shown)).toHaveText('On');
  });

  const WIDTH_IDS = ['sw-onoff', 'sw-yesno', 'sw-happy', 'sw-happy-small', 'sw-only-on', 'sw-only-off'];

  /** The boxes of everything in the width demo, so a changed width or a moved neighbour shows. */
  const layoutOf = (page: Page) =>
    page.locator('[data-testid=width-demo] > *').evaluateAll((elements) =>
      elements.map((element) => {
        // Page coordinates: clicking scrolls the page, which moves every viewport coordinate.
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
      })
    );

  test('text: toggling does not change the width of the switch or move its neighbours', async ({ page }) => {
    for (const id of WIDTH_IDS) {
      const target = page.getByTestId(id);
      const before = await layoutOf(page);
      await target.click();
      await expect(target).toHaveAttribute('aria-checked', 'true');
      expect(await layoutOf(page), `${id} on`).toEqual(before);
      await target.click();
      await expect(target).toHaveAttribute('aria-checked', 'false');
      expect(await layoutOf(page), `${id} off`).toEqual(before);
    }
  });

  test('text: the width does not change at any frame of the animation either', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const widths = await page.getByTestId('sw-happy').evaluate(async (element) => {
      // The width before the click is part of the set, so a switch that changes width is caught.
      const seen = new Set<number>([Math.round(element.getBoundingClientRect().width * 100) / 100]);
      const start = performance.now();
      (element as HTMLElement).click();
      await new Promise<void>((resolve) => {
        const tick = () => {
          seen.add(Math.round(element.getBoundingClientRect().width * 100) / 100);
          if (performance.now() - start < 500) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return [...seen];
    });
    // The browser lays out in steps of 1/64 px, so the two animated paddings may add up to
    // a hair more or less; a real change of the text width would be a pixel or more.
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.05);
  });

  test('text: the shorter text is centered in the width of the wider one', async ({ page }) => {
    for (const id of ['sw-onoff', 'sw-yesno', 'sw-happy', 'sw-happy-small']) {
      const centers = await page
        .getByTestId(id)
        .locator('.ads-switch-content-item')
        .evaluateAll((items) =>
          items.map((item) => {
            const box = item.getBoundingClientRect();
            return box.left + box.width / 2;
          })
        );
      expect(centers).toHaveLength(2);
      expect(Math.abs(centers[0] - centers[1]), id).toBeLessThan(0.6);
    }
  });

  test('text: the content of the other state is visibility hidden and the shown one is visible', async ({ page }) => {
    const target = page.getByTestId('sw-happy');
    const visibility = () =>
      target
        .locator('.ads-switch-content-item')
        .evaluateAll((items) => items.map((item) => [item.textContent?.trim(), getComputedStyle(item).visibility]));
    expect(await visibility()).toEqual([
      ['Happy', 'hidden'],
      ['Sad', 'visible']
    ]);
    await target.click();
    expect(await visibility()).toEqual([
      ['Happy', 'visible'],
      ['Sad', 'hidden']
    ]);
  });

  test('text: a switch with one content keeps its width in the other state', async ({ page }) => {
    const only = page.getByTestId('sw-only-on');
    const wide = (await only.boundingBox())!.width;
    expect(wide).toBeGreaterThan(44);
    expect(await only.locator('.ads-switch-content-item').evaluate((item) => getComputedStyle(item).visibility)).toBe('hidden');
  });

  test('right-to-left: the handle starts at the right edge and the order mirrors', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    expect(await handleOffset(page.getByTestId('sw-off'))).toMatchObject({ right: 2 });
    expect(await handleOffset(page.getByTestId('sw-on'))).toMatchObject({ left: 2 });
  });

  test('disabled: dimmed, not-allowed cursor, no hover colour and a click does nothing', async ({
    page
  }) => {
    const target = page.getByTestId('sw-disabled');
    const opacity = await resolveToken(page, 'opacity', '--ads-switch-disabled-opacity');
    const rest = await computed(target, 'background-color');
    expect(await computed(target, 'opacity')).toBe(opacity);
    expect(await computed(target, 'cursor')).toBe('not-allowed');
    await target.hover({ force: true });
    expect(await computed(target, 'background-color')).toBe(rest);
    await target.click({ force: true });
    await expect(target).toHaveAttribute('aria-checked', 'false');
  });

  test('loading: the spinner turns, the cursor is not-allowed and the colour does not change on hover', async ({
    page
  }) => {
    const target = page.getByTestId('sw-loading');
    const spinner = target.locator('.ads-switch-spinner');
    await expect(spinner).toBeVisible();
    // Svelte scopes the keyframes name with a hash prefix.
    expect(await computed(spinner, 'animation-name')).toContain('ads-switch-spin');
    expect(await computed(target, 'cursor')).toBe('not-allowed');
    expect(await computed(target, 'opacity')).toBe('1');
    const rest = await computed(target, 'background-color');
    await target.hover();
    expect(await computed(target, 'background-color')).toBe(rest);
  });

  test('loading: keeps keyboard focus when an action starts', async ({ page }) => {
    const target = page.getByTestId('sw-start-loading');
    await page.keyboard.press('Tab');
    await target.focus();
    await page.keyboard.press('Space');
    await expect(target).toHaveAttribute('aria-busy', 'true');
    await expect(target).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('switch-changes')).toHaveText('1');
    await expect(target).toHaveAttribute('aria-checked', 'true');
  });

  test('keyboard: Space and Enter toggle the switch in a real browser', async ({ page }) => {
    const target = page.getByTestId('sw-off');
    await page.keyboard.press('Tab');
    await target.focus();
    await page.keyboard.press('Space');
    await expect(target).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Enter');
    await expect(target).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(target).toHaveAttribute('aria-checked', 'false');
  });

  test('prefers-reduced-motion: transitions are off and the spinner is slower', async ({ page }) => {
    const target = page.getByTestId('sw-loading');
    const reduced = await resolveToken(page, 'animation-duration', '--ads-motion-duration-spinner-reduced');
    expect(await computed(target, 'transition-duration')).toBe('0s');
    expect(await computed(target.locator('.ads-switch-indicator'), 'transition-duration')).toBe('0s');
    expect(await computed(target.locator('.ads-switch-spinner'), 'animation-duration')).toBe(reduced);
  });

  test('without the reduced-motion setting the transitions run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const duration = await resolveToken(page, 'transition-duration', '--ads-motion-duration');
    expect(await computed(page.getByTestId('sw-off'), 'transition-duration')).toBe(duration);
    expect(
      await computed(page.getByTestId('sw-off').locator('.ads-switch-indicator'), 'transition-duration')
    ).toBe(duration);
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Switch contrast, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await installContrastHelpers(page);
    });

    /** Checks the three contrast rules of the spec for every switch in the matrix. */
    async function expectContrast(page: Page, prepare: (target: Locator) => Promise<void>, after?: () => Promise<void>) {
      const failures: string[] = [];
      for (const id of MATRIX_IDS) {
        const target = page.getByTestId(id);
        await prepare(target);
        const { track, handle, text } = await contrastOf(target);
        if (after) await after();
        if (track < 3) failures.push(`${id} track/page ${track.toFixed(2)}`);
        if (handle < 3) failures.push(`${id} handle/track ${handle.toFixed(2)}`);
        if (text < 4.5) failures.push(`${id} text/track ${text.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    }

    test('rest: the track reaches 3:1, the handle 3:1 and the text 4.5:1', async ({ page }) => {
      await expectContrast(page, async () => {});
    });

    test('hover: the same ratios hold', async ({ page }) => {
      await expectContrast(page, (target) => target.hover());
    });

    test('pressed: the same ratios hold', async ({ page }) => {
      await expectContrast(
        page,
        async (target) => {
          await target.hover();
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
        const { track, handle, text } = await contrastOf(target);
        const ring = await target.evaluate((element) =>
          (window as unknown as { __ringContrast(e: Element): number }).__ringContrast(element)
        );
        if (!(await target.evaluate((element) => element.matches(':focus-visible')))) {
          failures.push(`${id} not focus-visible`);
        }
        if (track < 3 || handle < 3 || text < 4.5) failures.push(`${id} ${track} ${handle} ${text}`);
        if (ring < 3) failures.push(`${id} ring ${ring.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    test('loading: the spinner against the handle reaches 3:1', async ({ page }) => {
      const ratio = await page.getByTestId('sw-loading').evaluate((element) => {
        const spinner = element.querySelector('.ads-switch-spinner')!;
        const handle = element.querySelector('.ads-switch-indicator')!;
        const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const a = lum(channels(getComputedStyle(spinner).borderBottomColor));
        const b = lum(channels(getComputedStyle(handle).backgroundColor));
        const [hi, lo] = [a, b].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      });
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
}

// The default colors are Ant Design's own. The fixture loads tokens-accessible.css for the contrast tests above,
// so these tests take it out of the page and look at what a consumer gets with tokens.css alone.
test.describe('Switch default colors (tokens.css alone)', () => {
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

  test('on: #1677ff, #4096ff on hover', async ({ page }) => {
    const target = page.getByTestId('sw-on');
    expect(await computed(target, 'background-color')).toBe('rgb(22, 119, 255)');
    await target.hover();
    await expect.poll(() => computed(target, 'background-color')).toBe('rgb(64, 150, 255)');
  });

  test('off: rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.45) on hover and pressed', async ({ page }) => {
    const target = page.getByTestId('sw-off');
    expect(await computed(target, 'background-color')).toBe('rgba(0, 0, 0, 0.25)');
    await target.hover();
    await expect.poll(() => computed(target, 'background-color')).toBe('rgba(0, 0, 0, 0.45)');
    await page.mouse.down();
    await expect.poll(() => computed(target, 'background-color')).toBe('rgba(0, 0, 0, 0.45)');
    await page.mouse.up();
  });

  test('loading: dimmed to 0.65 and the colors do not react to hover', async ({ page }) => {
    const target = page.getByTestId('sw-loading');
    expect(await computed(target, 'opacity')).toBe('0.65');
    const rest = await computed(target, 'background-color');
    await target.hover();
    expect(await computed(target, 'background-color')).toBe(rest);
  });

  test('disabled: keeps its own opacity, not the loading one', async ({ page }) => {
    const opacity = await resolveToken(page, 'opacity', '--ads-switch-disabled-opacity');
    expect(await computed(page.getByTestId('sw-disabled'), 'opacity')).toBe(opacity);
  });
});
