import { expect, test, type Locator, type Page } from '@playwright/test';

// The public Icon in a real browser (specs/icon.md): the layout measured on the Ant Design demo, the spin and the rotation that
// really turn, the colors of two-tone drawings as the browser paints them, drawings that use `g` and `defs` (they only show up when
// every node is in the SVG namespace), the accessible name as the engine exposes it, and an iconfont.cn font whose scripts the page
// loads. The `IconLab` page (e2e/fixtures/IconLab.svelte) draws what a test asks.

type Lab = {
  set(next: Partial<{ name: string; props: Record<string, unknown>; fontSize: number; color: string }>): void;
  setGlobalColor(color: string | [string, string]): void;
  globalColor(): [string, string];
  font(options: { scriptUrl?: string | string[]; extraCommonProps?: Record<string, unknown> }, type: string): void;
};
declare global {
  interface Window {
    __iconLab: Lab;
  }
}

const set = (page: Page, next: Parameters<Lab['set']>[0]) => page.evaluate((args) => window.__iconLab.set(args), next);
const icon = (page: Page) => page.getByTestId('icon');
const computed = (locator: Locator, property: string) => locator.evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop), property);

/** The numbers of a computed `matrix(...)`, or the identity for `none`. */
async function matrixOf(locator: Locator): Promise<number[]> {
  const text = await computed(locator, 'transform');
  if (text === 'none') return [1, 0, 0, 1, 0, 0];
  return text.replace(/^matrix\(|\)$/g, '').split(',').map(Number);
}
const expectMatrix = (actual: number[], expected: number[]) => {
  expect(actual).toHaveLength(6);
  actual.forEach((value, index) => expect(value, `matrix[${index}]`).toBeCloseTo(expected[index], 3));
};

/** Whether an element is really being animated: a running animation with the name, whose clock moves. */
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

const rgb = (r: number, g: number, b: number) => `rgb(${r}, ${g}, ${b})`;
const fillsOf = (page: Page) => page.getByTestId('icon').locator('path').evaluateAll((paths) => paths.map((path) => getComputedStyle(path).fill));

test.beforeEach(async ({ page }) => {
  await page.goto('/#icon');
  await page.waitForFunction(() => Boolean(window.__iconLab));
});

test.describe('Icon: layout (the Ant Design demo, 2026-11-20)', () => {
  for (const size of [14, 24]) {
    test(`I2: at ${size}px the icon is a ${size} x ${size} inline-flex box and the drawing fills it`, async ({ page }) => {
      await set(page, { fontSize: size });
      const box = await icon(page).evaluate((element) => {
        const r = element.getBoundingClientRect();
        const s = element.querySelector('svg')!.getBoundingClientRect();
        const cs = getComputedStyle(element);
        return { w: r.width, h: r.height, sw: s.width, sh: s.height, display: cs.display, lineHeight: cs.lineHeight, align: cs.verticalAlign, svgDisplay: getComputedStyle(element.querySelector('svg')!).display };
      });
      expect(box.w).toBeCloseTo(size, 1);
      expect(box.h).toBeCloseTo(size, 1);
      expect(box.sw).toBeCloseTo(size, 1);
      expect(box.sh).toBeCloseTo(size, 1);
      expect(box.display).toBe('inline-flex');
      expect(parseFloat(box.lineHeight)).toBe(0);
      // vertical-align: -0.125em, as measured on the demo (-1.75px at 14px, -3px at 24px).
      expect(parseFloat(box.align)).toBeCloseTo(-0.125 * size, 1);
      expect(box.svgDisplay).toBe('block');
    });
  }

  test('I2: the drawing takes the color of the text and the size of the text', async ({ page }) => {
    await set(page, { color: 'rgb(255, 0, 0)', fontSize: 20 });
    expect(await fillsOf(page)).toEqual([rgb(255, 0, 0)]);
    await set(page, { color: 'rgb(0, 128, 0)' });
    expect(await fillsOf(page)).toEqual([rgb(0, 128, 0)]);
    expect((await icon(page).boundingBox())!.width).toBeCloseTo(20, 1);
  });

  test('I2: the box does not change, and the neighbours do not move, when the drawing, the theme, spin, rotate or the name change', async ({ page }) => {
    // The icon is measured by its layout box (`offset*`): a turning icon changes its `getBoundingClientRect` with the angle, while the
    // space it takes in the layout is what must not change. The neighbours are measured by their rectangles.
    const snapshot = () =>
      page.evaluate(() => {
        const box = (selector: string) => {
          const r = document.querySelector(selector)!.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        const icon = document.querySelector('[data-testid="icon"]') as HTMLElement;
        return {
          before: box('[data-testid="before"]'),
          icon: { x: icon.offsetLeft, y: icon.offsetTop, w: icon.offsetWidth, h: icon.offsetHeight },
          after: box('[data-testid="after"]')
        };
      });
    await set(page, { name: 'StarOutlined' });
    const first = await snapshot();
    // Drawings of different shape and of different viewBox (loading uses the whole 1024 square), in the three themes.
    for (const name of ['StarFilled', 'StarTwoTone', 'LoadingOutlined', 'DotNetOutlined', 'SmileTwoTone', 'ShareAltOutlined']) {
      await set(page, { name });
      expect(await snapshot(), name).toEqual(first);
    }
    for (const props of [{ spin: true }, { rotate: 45 }, { spin: true, rotate: 180 }, { label: 'A much longer accessible name of the icon' }, { label: '' }]) {
      await set(page, { name: 'StarOutlined', props });
      const now = await snapshot();
      // A turning wrapper keeps the box it occupies in the layout: only `transform` changes, never the space it takes.
      expect({ before: now.before, after: now.after }, JSON.stringify(props)).toEqual({ before: first.before, after: first.after });
      expect(now.icon, JSON.stringify(props)).toEqual(first.icon);
    }
  });

  test('I2: while the icon spins, frame after frame, the neighbours and the space it takes stay where they are', async ({ page }) => {
    await set(page, { name: 'LoadingOutlined', props: { spin: true, rotate: 30 } });
    const frames: unknown[] = [];
    for (let frame = 0; frame < 8; frame += 1) {
      frames.push(
        await page.evaluate(() => {
          const rect = (selector: string) => {
            const r = document.querySelector(selector)!.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          };
          const icon = document.querySelector('[data-testid="icon"]') as HTMLElement;
          return { before: rect('[data-testid="before"]'), after: rect('[data-testid="after"]'), icon: [icon.offsetLeft, icon.offsetTop, icon.offsetWidth, icon.offsetHeight] };
        })
      );
      await page.waitForTimeout(90);
    }
    expect(new Set(frames.map((frame) => JSON.stringify(frame))).size).toBe(1);
  });
});

test.describe('Icon: spin and rotate really turn', () => {
  test('I3: `spin` turns the wrapper once a second, endlessly, and stops when it is off', async ({ page }) => {
    await set(page, { props: { spin: true } });
    expect(await isTurning(icon(page), 'ads-icon-turn')).toBe(true);
    expect(await computed(icon(page), 'animation-duration')).toBe('1s');
    expect(await computed(icon(page), 'animation-iteration-count')).toBe('infinite');
    expect(await computed(icon(page), 'animation-timing-function')).toBe('linear');
    await set(page, { props: { spin: false } });
    expect(await computed(icon(page), 'animation-name')).toBe('none');
  });

  test('P1: the loading drawing turns by itself and spin={false} stops it', async ({ page }) => {
    await set(page, { name: 'LoadingOutlined' });
    expect(await isTurning(icon(page), 'ads-icon-turn')).toBe(true);
    await set(page, { name: 'LoadingOutlined', props: { spin: false } });
    expect(await computed(icon(page), 'animation-name')).toBe('none');
  });

  test('P7: under reduced motion the spin is slower (2.5 s), and it still turns', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await set(page, { props: { spin: true } });
    expect(await computed(icon(page), 'animation-duration')).toBe('2.5s');
    expect(await isTurning(icon(page), 'ads-icon-turn')).toBe(true);
  });

  test('I4: `rotate` turns the drawing and not the wrapper, and the two work together', async ({ page }) => {
    await set(page, { props: { rotate: 90 } });
    expectMatrix(await matrixOf(icon(page).locator('svg')), [0, 1, -1, 0, 0, 0]);
    expect(await computed(icon(page), 'transform')).toBe('none');
    await set(page, { props: { rotate: 180 } });
    expectMatrix(await matrixOf(icon(page).locator('svg')), [-1, 0, 0, -1, 0, 0]);
    await set(page, { props: { rotate: -90 } });
    expectMatrix(await matrixOf(icon(page).locator('svg')), [0, -1, 1, 0, 0, 0]);
    await set(page, { props: { rotate: 90, spin: true } });
    expect(await isTurning(icon(page), 'ads-icon-turn')).toBe(true);
    expectMatrix(await matrixOf(icon(page).locator('svg')), [0, 1, -1, 0, 0, 0]);
  });

  test('I4: a rotated drawing keeps its center (it turns around itself)', async ({ page }) => {
    await set(page, { name: 'ShareAltOutlined', fontSize: 32 });
    const center = () => icon(page).locator('svg').evaluate((svg) => {
      const r = svg.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    const before = await center();
    await set(page, { props: { rotate: 90 } });
    const after = await center();
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
  });
});

test.describe('Icon: colors of two-tone drawings (the Ant Design demo, 2026-11-20)', () => {
  test('I5: with no color the theme draws it: the blue and its lightest shade', async ({ page }) => {
    await set(page, { name: 'SmileTwoTone' });
    expect(await fillsOf(page)).toEqual([rgb(22, 119, 255), rgb(230, 244, 255), rgb(22, 119, 255)]);
  });

  test('I5: one color derives the second as Ant Design does (#eb2f96 with #fff0f6, #52c41a with #f6ffed)', async ({ page }) => {
    await set(page, { name: 'HeartTwoTone', props: { twoToneColor: '#eb2f96' } });
    expect(await fillsOf(page)).toEqual([rgb(235, 47, 150), rgb(255, 240, 246)]);
    await set(page, { name: 'CheckCircleTwoTone', props: { twoToneColor: '#52c41a' } });
    expect(await fillsOf(page)).toEqual([rgb(82, 196, 26), rgb(246, 255, 237), rgb(82, 196, 26)]);
  });

  test('I5: a pair is painted as given', async ({ page }) => {
    await set(page, { name: 'SmileTwoTone', props: { twoToneColor: ['#1677ff', '#ffe58f'] } });
    expect(await fillsOf(page)).toEqual([rgb(22, 119, 255), rgb(255, 229, 143), rgb(22, 119, 255)]);
  });

  test('P3: setTwoToneColor repaints a drawing with no color of its own', async ({ page }) => {
    await set(page, { name: 'SmileTwoTone' });
    await page.evaluate(() => window.__iconLab.setGlobalColor('#eb2f96'));
    expect(await fillsOf(page)).toEqual([rgb(235, 47, 150), rgb(255, 240, 246), rgb(235, 47, 150)]);
    expect(await page.evaluate(() => window.__iconLab.globalColor())).toEqual(['#eb2f96', '#fff0f6']);
  });

  test('I5: in the dark theme the light shade is the dark one and the primary follows the theme', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await set(page, { name: 'SmileTwoTone' });
    const fills = await fillsOf(page);
    expect(fills[1]).toBe(rgb(17, 26, 44));
    const primary = await page.evaluate(() => {
      const probe = document.createElement('i');
      probe.style.color = 'var(--ads-color-primary)';
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(fills[0]).toBe(primary);
    expect(fills[2]).toBe(primary);
  });

  test('I5: an outlined drawing paints in the text color whatever twoToneColor says', async ({ page }) => {
    await set(page, { name: 'StarOutlined', color: 'rgb(0, 0, 255)', props: { twoToneColor: '#eb2f96' } });
    expect(await fillsOf(page)).toEqual([rgb(0, 0, 255)]);
  });
});

test.describe('Icon: drawings with g, defs and style', () => {
  for (const testid of ['dot-net', 'login', 'rest']) {
    test(`I1: ${testid}: every node is in the SVG namespace and the drawing has a size (it would have none in the HTML namespace)`, async ({ page }) => {
      const result = await page.getByTestId(testid).evaluate((wrapper) => {
        const nodes = [...wrapper.querySelectorAll('svg *')];
        const shapes = nodes.filter((node) => node.tagName.toLowerCase() === 'path');
        return {
          namespaces: [...new Set(nodes.map((node) => node.namespaceURI))],
          tags: [...new Set(nodes.map((node) => node.tagName.toLowerCase()))],
          painted: shapes.some((node) => {
            const box = (node as SVGGraphicsElement).getBBox();
            return box.width > 1 && box.height > 1;
          })
        };
      });
      expect(result.namespaces).toEqual(['http://www.w3.org/2000/svg']);
      expect(result.painted).toBe(true);
      expect(result.tags).toContain('path');
    });
  }

  test('I1: a nested group is drawn (a rectangle of the drawing has a size on the page)', async ({ page }) => {
    const group = page.getByTestId('dot-net').locator('svg g').first();
    const box = await group.boundingBox();
    expect(box!.width).toBeGreaterThan(5);
    expect(box!.height).toBeGreaterThan(5);
  });
});

test.describe('Icon: the accessible name in the engine', () => {
  test('A1: the icon is an image named by the drawing, and `label` replaces the name', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'star', exact: true })).toHaveCount(1);
    await set(page, { props: { label: 'Favourite' } });
    await expect(page.getByRole('img', { name: 'Favourite' })).toHaveCount(1);
    await expect(page.getByRole('img', { name: 'star', exact: true })).toHaveCount(0);
  });

  test('A1: `label=""` takes the icon out of the accessibility tree', async ({ page }) => {
    await set(page, { props: { label: '' } });
    // The lab keeps three other, named icons elsewhere on the page; this one is the only image in the `host` row.
    await expect(page.getByTestId('host').getByRole('img')).toHaveCount(0);
    await expect(page.getByTestId('fixed').getByRole('img')).toHaveCount(3);
  });

  test('A2: an icon is not a tab stop', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.closest('.ads-icon') !== null && document.activeElement !== document.body);
    expect(focused).toBe(false);
  });
});

test.describe('Icon: an iconfont.cn font (I10)', () => {
  /** A sprite script as iconfont.cn writes it: it puts an `<svg>` with symbols at the start of the body. */
  const sprite = (id: string, radius: number) =>
    `(function(){var d=document.createElement('div');d.innerHTML='<svg><symbol id="${id}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="${radius}"/></symbol></svg>';var s=d.firstChild;s.style.position='absolute';s.style.width=0;s.style.height=0;document.body.insertBefore(s,document.body.firstChild);})();`;

  test('I10: the symbol of a loaded sprite is drawn, and the script is requested once however often it is asked for', async ({ page }) => {
    let requests = 0;
    await page.route('**/fonts/one.js', async (route) => {
      requests += 1;
      await route.fulfill({ contentType: 'application/javascript', body: sprite('icon-one', 4) });
    });
    await page.evaluate(() => {
      window.__iconLab.font({ scriptUrl: '/fonts/one.js' }, 'icon-one');
      window.__iconLab.font({ scriptUrl: '/fonts/one.js' }, 'icon-one');
    });
    await page.waitForFunction(() => Boolean(document.querySelector('symbol#icon-one')));
    const wrapper = page.getByTestId('font-0');
    const box = await wrapper.locator('use').evaluate((use) => (use as SVGGraphicsElement).getBBox().width);
    expect(box).toBeGreaterThan(5);
    expect((await wrapper.boundingBox())!.width).toBeCloseTo(14, 1);
    expect(requests).toBe(1);
    expect(await page.locator('script[data-ads-iconfont]').count()).toBe(1);
  });

  test('I10: a later URL overrides an earlier one for a name used twice, even when the earlier arrives last', async ({ page }) => {
    await page.route('**/fonts/early.js', async (route) => {
      // The first in the list arrives last: the page must still run it first, so that the later one stays on top.
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({ contentType: 'application/javascript', body: sprite('icon-dup', 2) });
    });
    await page.route('**/fonts/late.js', (route) => route.fulfill({ contentType: 'application/javascript', body: sprite('icon-dup', 4) }));
    await page.evaluate(() => window.__iconLab.font({ scriptUrl: ['/fonts/early.js', '/fonts/late.js'] }, 'icon-dup'));
    await page.waitForFunction(() => document.querySelectorAll('symbol#icon-dup').length === 2);
    const width = await page.getByTestId('font-0').locator('use').evaluate((use) => (use as SVGGraphicsElement).getBBox().width);
    // The circle of the later script has a radius of 4 of 10 (at 14px: 11.2); the earlier one has 2 (5.6).
    expect(width).toBeGreaterThan(9);
  });

  test('I10: the font icon is hidden from assistive technology, and a label makes it an image', async ({ page }) => {
    await page.route('**/fonts/named.js', (route) => route.fulfill({ contentType: 'application/javascript', body: sprite('icon-named', 3) }));
    await page.evaluate(() => {
      window.__iconLab.font({ scriptUrl: '/fonts/named.js', extraCommonProps: { label: 'Log out' } }, 'icon-named');
    });
    await expect(page.getByRole('img', { name: 'Log out' })).toHaveCount(1);
  });
});
