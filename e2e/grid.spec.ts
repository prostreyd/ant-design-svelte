import { expect, test, type Page } from '@playwright/test';

// Geometry of Row and Col in a real browser (specs/grid.md). Layout has no transitions, so a rect read right after the
// page is drawn is final (the "read style with a wait" rule of the project concerns colors and sizes that animate).

type Size = { span?: number; offset?: number; push?: number; pull?: number; order?: number; flex?: string | number };
type Col = Size & {
  xs?: number | Size;
  sm?: number | Size;
  md?: number | Size;
  lg?: number | Size;
  xl?: number | Size;
  xxl?: number | Size;
  xxxl?: number | Size;
  height?: number;
  text?: string;
  rows?: Scene[];
};
type Scene = {
  id: string;
  gutter?: number | string | Record<string, number | string> | [unknown, unknown];
  align?: string | Record<string, string>;
  justify?: string | Record<string, string>;
  wrap?: boolean;
  cols: Col[];
};
type Rect = { x: number; y: number; w: number; h: number };

async function draw(page: Page, scenes: Scene[], hostWidth?: number): Promise<void> {
  await page.evaluate(([next, width]) => (window as unknown as { __gridLab: { set(a: unknown, b: unknown): void } }).__gridLab.set(next, width), [
    scenes,
    hostWidth
  ] as const);
}

/** The visible boxes of a row, with x relative to the left edge of the host. */
async function boxes(page: Page, id: string): Promise<Rect[]> {
  return page.evaluate((rowId) => {
    const host = document.querySelector('[data-testid="host"]')!.getBoundingClientRect();
    const row = document.querySelector(`[data-testid="${rowId}"]`)!;
    return [...row.querySelectorAll(':scope > .ads-col > .box')].map((box) => {
      const r = box.getBoundingClientRect();
      return { x: r.left - host.left, y: r.top - host.top, w: r.width, h: r.height };
    });
  }, id);
}

async function rowRect(page: Page, id: string): Promise<Rect> {
  return page.evaluate((rowId) => {
    const host = document.querySelector('[data-testid="host"]')!.getBoundingClientRect();
    const r = document.querySelector(`[data-testid="${rowId}"]`)!.getBoundingClientRect();
    return { x: r.left - host.left, y: r.top - host.top, w: r.width, h: r.height };
  }, id);
}

/** The width of `span` of the 24 columns, in a parent `width` wide with a gutter `gap`: the formula of the spec. */
const spanWidth = (width: number, gap: number, span: number) => ((width + gap) * span) / 24 - gap;
const startOf = (width: number, gap: number, column: number) => ((width + gap) * column) / 24;

const equal = (count: number, extra: Partial<Col> = {}): Col[] => Array.from({ length: count }, () => ({ span: 24 / count, ...extra }));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/#grid');
  await page.waitForFunction(() => '__gridLab' in window);
});

test.describe('COL-1: the width of a column follows the formula', () => {
  // The numbers are measurements of the public demos of Ant Design 6.7 (2026-11-16, specs/grid.md finding 2): the same
  // boxes have to come out of the same parent width and gutter, here without a negative margin.
  const reference: { width: number; gap: number; spans: number[]; widths: number[]; starts: number[] }[] = [
    { width: 488, gap: 32, spans: [6, 6, 6, 6], widths: [98, 98, 98, 98], starts: [0, 130, 260, 390] },
    { width: 488, gap: 16, spans: [6, 6, 6, 6], widths: [110, 110, 110, 110], starts: [0, 126, 252, 378] },
    { width: 138, gap: 16, spans: [6, 6, 6, 6], widths: [22.5, 22.5, 22.5, 22.5], starts: [0, 38.5, 77, 115.5] },
    { width: 338, gap: 24, spans: [6, 6, 6, 6], widths: [66.5, 66.5, 66.5, 66.5], starts: [0, 90.5, 181, 271.5] }
  ];
  for (const { width, gap, spans, widths, starts } of reference) {
    test(`${width} px wide, gutter ${gap}: ${widths[0]} px boxes`, async ({ page }) => {
      await draw(page, [{ id: 'row', gutter: gap, cols: spans.map((span) => ({ span })) }], width);
      const found = await boxes(page, 'row');
      found.forEach((box, index) => {
        expect(box.w).toBeCloseTo(widths[index], 1);
        expect(box.x).toBeCloseTo(starts[index], 1);
      });
    });
  }

  test('unequal spans: 5, 7 and 12 columns at gutter 16', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: 16, cols: [{ span: 5 }, { span: 7 }, { span: 12 }] }], 600);
    const found = await boxes(page, 'row');
    [5, 7, 12].forEach((span, index) => {
      expect(found[index].w).toBeCloseTo(spanWidth(600, 16, span), 1);
    });
    expect(found[1].x).toBeCloseTo(startOf(600, 16, 5), 1);
    expect(found[2].x).toBeCloseTo(startOf(600, 16, 12), 1);
  });
});

test.describe('ROW-1: a Row is as wide as its parent', () => {
  for (const gutter of [0, 8, 16, 32, '2rem', '5%']) {
    test(`gutter ${gutter}: the Row fills the host, with no overflow`, async ({ page }) => {
      await draw(page, [{ id: 'row', gutter, cols: equal(4) }], 500);
      const row = await rowRect(page, 'row');
      expect(row.x).toBeCloseTo(0, 1);
      expect(row.w).toBeCloseTo(500, 1);
      // The page itself does not scroll sideways (Ant Design's Row does here: its margin is negative).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBe(0);
    });
  }

  test('vertical gutter: the second line starts one gap below the first', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: [16, 24], cols: [...equal(4, { height: 30 }), ...equal(4, { height: 30 })] }], 800);
    const found = await boxes(page, 'row');
    expect(found[4].y - (found[0].y + found[0].h)).toBeCloseTo(24, 1);
    expect(found[4].x).toBeCloseTo(0, 1);
  });

  test('a string gutter in rem is used as written', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: '2rem', cols: equal(2) }], 600);
    const [first, second] = await boxes(page, 'row');
    expect(second.x - (first.x + first.w)).toBeCloseTo(32, 1);
  });

  test('an invalid string gutter is dropped: the columns keep their widths', async ({ page }) => {
    // 'wide' and an unitless '16' are not lengths; one of them in a width formula would make every column lose its width.
    await draw(page, [{ id: 'row', gutter: '16', cols: equal(3) }], 600);
    const found = await boxes(page, 'row');
    for (const box of found) expect(box.w).toBeCloseTo(200, 1);
  });
});

test.describe('COL-7: columns that add up to 24 never wrap by rounding', () => {
  // N equal columns (and mixed ones) of 24, at every parent width from 280 to 2000 px, at six gutters. All the layouts are
  // drawn at once and the host is resized in a loop inside the page, so the check is fast and exhaustive. A layout is only
  // checked where it fits: when the formula gives the narrowest column less than a pixel (24 columns of span 1 with a
  // gutter of 16 px need 368 px), the line has to wrap, in this grid as in Ant Design's, and that is not a rounding error.
  const partitions: number[][] = [
    [24],
    [12, 12],
    [8, 8, 8],
    [6, 6, 6, 6],
    [4, 4, 4, 4, 4, 4],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    Array.from({ length: 24 }, () => 1),
    [5, 7, 12],
    [7, 17],
    [9, 5, 10],
    [1, 23],
    [23, 1]
  ];
  const gutters: [number | string, number][] = [[0, 0], [8, 8], [16, 16], [24, 24], [32, 32], ['2rem', 32]];

  test('no column drops to a second line, 280 to 2000 px', async ({ page }) => {
    const scenes: Scene[] = [];
    const smallest: Record<string, number> = {};
    const gaps: Record<string, number> = {};
    for (const [gutter, gap] of gutters) {
      partitions.forEach((spans, index) => {
        const id = `p-${gutter}-${index}`;
        scenes.push({ id, gutter, cols: spans.map((span) => ({ span, height: 4 })) });
        smallest[id] = Math.min(...spans);
        gaps[id] = gap;
      });
    }
    await draw(page, scenes, 1000);
    const result = await page.evaluate(
      ({ from, smallest, gaps }) => {
        const host = document.querySelector<HTMLElement>('[data-testid="host"]')!;
        const rows = [...host.querySelectorAll<HTMLElement>(':scope > .ads-row')];
        const wrapped: string[] = [];
        let checked = 0;
        for (let width = from; width <= 2000; width += 1) {
          host.style.width = `${width}px`;
          for (const row of rows) {
            const id = row.dataset.testid!;
            const narrowest = ((width + gaps[id]) * smallest[id]) / 24 - gaps[id];
            if (narrowest < 1) continue;
            checked += 1;
            const tops = new Set([...row.querySelectorAll(':scope > .ads-col')].map((col) => Math.round(col.getBoundingClientRect().top)));
            if (tops.size > 1) wrapped.push(`${id} at ${width}px`);
          }
        }
        return { wrapped, checked };
      },
      { from: 280, smallest, gaps }
    );
    expect(result.checked).toBeGreaterThan(10000);
    expect(result.wrapped.slice(0, 20)).toEqual([]);
  });
});

test.describe('COL-2: offset, push and pull', () => {
  test('offset skips that many columns', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: 16, cols: [{ span: 8 }, { span: 8, offset: 8 }] }], 488);
    const [first, second] = await boxes(page, 'row');
    expect(first.x).toBeCloseTo(0, 1);
    expect(second.x).toBeCloseTo(startOf(488, 16, 16), 1);
    expect(second.w).toBeCloseTo(spanWidth(488, 16, 8), 1);
  });

  test('push and pull swap two columns visually and do not move the neighbour', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: 0, cols: [{ span: 18, push: 6 }, { span: 6, pull: 18 }] }], 480);
    const [wide, narrow] = await boxes(page, 'row');
    expect(wide.x).toBeCloseTo(120, 1);
    expect(narrow.x).toBeCloseTo(0, 1);
  });

  test('push and pull together are the net shift', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ span: 6, push: 6, pull: 2 }] }], 480);
    const [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(80, 1);
  });

  test('right to left: offset and push mirror', async ({ page }) => {
    await page.evaluate(() => (document.documentElement.dir = 'rtl'));
    await draw(page, [{ id: 'row', gutter: 0, cols: [{ span: 6, offset: 6 }, { span: 6, push: 6 }] }], 480);
    const [offset, pushed] = await boxes(page, 'row');
    // In rtl the line starts at the right edge: the offset leaves 120 px empty there; the second column sits next to the
    // first one and is pushed 120 px towards the left.
    expect(offset.x + offset.w).toBeCloseTo(480 - 120, 1);
    expect(pushed.x + pushed.w).toBeCloseTo(480 - 240 - 120, 1);
  });
});

test.describe('COL-3: span 0 hides', () => {
  test('a span of 0 is display: none and the neighbours close the gap', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ span: 12, text: 'a' }, { span: 0, text: 'hidden' }, { span: 12, text: 'b' }] }], 600);
    const cols = page.getByTestId('row').locator(':scope > .ads-col');
    await expect(cols.nth(1)).toHaveCSS('display', 'none');
    const found = await boxes(page, 'row');
    expect(found).toHaveLength(3);
    expect(found[2].x).toBeCloseTo(300, 1);
  });

  test('hide on a small screen: xs 0, md 8', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ xs: 0, md: 8, text: 'only from md' }, { span: 8 }] }], 600);
    const hidden = page.getByTestId('row').locator(':scope > .ads-col').first();
    await page.setViewportSize({ width: 700, height: 800 });
    await expect(hidden).toHaveCSS('display', 'none');
    await page.setViewportSize({ width: 768, height: 800 });
    await expect(hidden).toHaveCSS('display', 'block');
    await page.setViewportSize({ width: 767, height: 800 });
    await expect(hidden).toHaveCSS('display', 'none');
  });
});

test.describe('RES: responsive values', () => {
  // Every boundary, one pixel on each side (RES-2), and the cascade upward (RES-1).
  const cols: Col[] = [{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10, xxl: 12, xxxl: 14 }];
  const steps: [number, number][] = [
    [400, 2],
    [575, 2],
    [576, 4],
    [767, 4],
    [768, 6],
    [991, 6],
    [992, 8],
    [1199, 8],
    [1200, 10],
    [1599, 10],
    [1600, 12],
    [1919, 12],
    [1920, 14],
    [2400, 14]
  ];
  for (const [viewport, span] of steps) {
    test(`at ${viewport} px the span is ${span}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 800 });
      await draw(page, [{ id: 'row', cols }], 960);
      const [box] = await boxes(page, 'row');
      expect(box.w).toBeCloseTo((960 * span) / 24, 1);
    });
  }

  test('a breakpoint that was not given keeps the value of the next smaller one (xl 10 holds at 1700 and 2000)', async ({ page }) => {
    for (const viewport of [1700, 2000]) {
      await page.setViewportSize({ width: viewport, height: 800 });
      await draw(page, [{ id: 'row', cols: [{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }] }], 960);
      const [box] = await boxes(page, 'row');
      expect(box.w).toBeCloseTo(400, 1);
    }
  });

  test('keys cascade on their own: a breakpoint that gives only span keeps the offset of the smaller one', async ({ page }) => {
    // The "More responsive" demo of Ant Design: xs {span 5, offset 1}, lg {span 6, offset 2}; at md the xs values still apply.
    await page.setViewportSize({ width: 800, height: 800 });
    await draw(page, [{ id: 'row', cols: [{ xs: { span: 5, offset: 1 }, lg: { span: 6, offset: 2 } }] }], 480);
    let [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(20, 1);
    expect(box.w).toBeCloseTo(100, 1);
    await page.setViewportSize({ width: 1000, height: 800 });
    [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(40, 1);
    expect(box.w).toBeCloseTo(120, 1);
    await draw(page, [{ id: 'row', cols: [{ xs: { span: 5, offset: 1 }, lg: { span: 6 } }] }], 480);
    [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(20, 1);
    expect(box.w).toBeCloseTo(120, 1);
  });

  test('the plain prop is the base and an xs value of the same name wins', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await draw(page, [{ id: 'row', cols: [{ span: 12, xs: 6 }, { span: 12, md: 6 }] }], 480);
    const found = await boxes(page, 'row');
    expect(found[0].w).toBeCloseTo(120, 1);
    expect(found[1].w).toBeCloseTo(240, 1);
  });

  test('the gutter object cascades: below the smallest key 0, between keys the smaller one', async ({ page }) => {
    const scene: Scene = { id: 'row', gutter: { sm: 16, lg: 32 }, cols: equal(2) };
    const gap = async () => {
      const [first, second] = await boxes(page, 'row');
      return second.x - (first.x + first.w);
    };
    for (const [viewport, expected] of [[500, 0], [576, 16], [991, 16], [992, 32], [1920, 32]] as const) {
      await page.setViewportSize({ width: viewport, height: 800 });
      await draw(page, [scene], 600);
      expect(await gap(), `at ${viewport}px`).toBeCloseTo(expected, 1);
    }
  });

  test('responsive align and justify switch at their breakpoint', async ({ page }) => {
    await draw(page, [{ id: 'row', justify: { xs: 'start', md: 'end' }, cols: [{ span: 6 }] }], 480);
    await page.setViewportSize({ width: 700, height: 800 });
    let [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(0, 1);
    await page.setViewportSize({ width: 768, height: 800 });
    [box] = await boxes(page, 'row');
    expect(box.x).toBeCloseTo(360, 1);
  });
});

test.describe('ROW-2 and ROW-3: align, justify, wrap', () => {
  test('justify: start, center, end, space-between, space-around, space-evenly', async ({ page }) => {
    const free = 480 - 4 * 60;
    const expected: Record<string, number[]> = {
      start: [0, 60, 120, 180],
      center: [free / 2, free / 2 + 60, free / 2 + 120, free / 2 + 180],
      end: [free, free + 60, free + 120, free + 180],
      'space-between': [0, 60 + free / 3, 120 + (2 * free) / 3, 180 + free],
      'space-around': [free / 8, free / 8 + 60 + free / 4, free / 8 + 120 + free / 2, free / 8 + 180 + (3 * free) / 4],
      'space-evenly': [free / 5, (2 * free) / 5 + 60, (3 * free) / 5 + 120, (4 * free) / 5 + 180]
    };
    for (const [justify, starts] of Object.entries(expected)) {
      await draw(page, [{ id: 'row', justify, cols: equal(4).map((c) => ({ ...c, span: 3 })) }], 480);
      const found = await boxes(page, 'row');
      found.forEach((box, index) => expect(box.x, `${justify} #${index}`).toBeCloseTo(starts[index], 0));
    }
  });

  test('align: top, middle, bottom, stretch', async ({ page }) => {
    const heights = [100, 50, 120, 80];
    const cols = heights.map((height) => ({ span: 6, height }));
    const top = async (align: string) => {
      await draw(page, [{ id: 'row', align, cols }], 480);
      return boxes(page, 'row');
    };
    let found = await top('top');
    expect(found.map((b) => b.y)).toEqual([0, 0, 0, 0]);
    found = await top('middle');
    found.forEach((box, i) => expect(box.y).toBeCloseTo((120 - heights[i]) / 2, 1));
    found = await top('bottom');
    found.forEach((box, i) => expect(box.y).toBeCloseTo(120 - heights[i], 1));
    // `stretch` stretches the column, not the box inside it (which has its own height): the column is as tall as the line.
    await draw(page, [{ id: 'row', align: 'stretch', cols }], 480);
    const columns = await page.evaluate(() => [...document.querySelectorAll('[data-testid="row"] > .ads-col')].map((c) => c.getBoundingClientRect().height));
    expect(columns).toEqual([120, 120, 120, 120]);
  });

  test('wrap: columns that do not fit move to the next line as a whole', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ span: 12, height: 20 }, { span: 12, height: 20 }, { span: 12, height: 20 }] }], 480);
    const found = await boxes(page, 'row');
    expect(found[1].y).toBeCloseTo(0, 1);
    expect(found[2].y).toBeCloseTo(20, 1);
    expect(found[2].x).toBeCloseTo(0, 1);
  });

  test('wrap false: one line; the columns keep their widths and run past the end of the Row', async ({ page }) => {
    await draw(page, [{ id: 'row', wrap: false, cols: [{ span: 12, height: 20 }, { span: 12, height: 20 }, { span: 12, height: 20 }] }], 480);
    const found = await boxes(page, 'row');
    expect(new Set(found.map((b) => b.y)).size).toBe(1);
    expect(found.map((b) => b.w)).toEqual([240, 240, 240]);
    expect(found[2].x + found[2].w).toBeCloseTo(720, 1);
  });
});

test.describe('COL-4: flex', () => {
  test('a number n is n n auto: two flexible columns share the line by their number', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ flex: 2 }, { flex: 3 }] }], 500);
    const [a, b] = await boxes(page, 'row');
    expect(a.w).toBeCloseTo(200, 0);
    expect(b.w).toBeCloseTo(300, 0);
  });

  test('flex 0 is a value, not "unset" (public bug 58719)', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ flex: 0, text: 'fixed' }, { flex: 1 }] }], 500);
    const cols = page.getByTestId('row').locator(':scope > .ads-col');
    await expect(cols.first()).toHaveCSS('flex-grow', '0');
    await expect(cols.first()).toHaveCSS('flex-shrink', '0');
  });

  test('a single length is a fixed width (0 0 100px); a string of digits is n 1 0', async ({ page }) => {
    // Observed on the public demo of Ant Design: flex="100px" computes to `0 0 100px`, not to `1 1 100px`.
    await draw(page, [{ id: 'row', cols: [{ flex: '100px' }, { flex: '2' }, { flex: '1' }] }], 500);
    const [fixed, two, one] = await boxes(page, 'row');
    expect(fixed.w).toBeCloseTo(100, 0);
    expect(two.w).toBeCloseTo(((500 - 100) * 2) / 3, 0);
    expect(one.w).toBeCloseTo((500 - 100) / 3, 0);
  });

  test('other strings are used as written: auto, none and a full flex value', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ flex: 'none', text: 'none' }, { flex: 'auto', text: 'auto' }, { flex: '0 1 100px' }] }], 600);
    const cols = page.getByTestId('row').locator(':scope > .ads-col');
    await expect(cols.nth(0)).toHaveCSS('flex-grow', '0');
    await expect(cols.nth(0)).toHaveCSS('flex-shrink', '0');
    await expect(cols.nth(1)).toHaveCSS('flex-grow', '1');
    await expect(cols.nth(1)).toHaveCSS('flex-basis', 'auto');
    await expect(cols.nth(2)).toHaveCSS('flex-grow', '0');
    await expect(cols.nth(2)).toHaveCSS('flex-basis', '100px');
  });

  test('flex wins over the width of span', async ({ page }) => {
    await draw(page, [{ id: 'row', cols: [{ span: 6, flex: '1 1 300px' }] }], 480);
    const [box] = await boxes(page, 'row');
    expect(box.w).toBeCloseTo(480, 0);
  });

  test('a column with only flex shares a Row with span columns', async ({ page }) => {
    await draw(page, [{ id: 'row', gutter: 16, cols: [{ span: 6 }, { flex: 1 }] }], 488);
    const [fixed, rest] = await boxes(page, 'row');
    expect(fixed.w).toBeCloseTo(spanWidth(488, 16, 6), 1);
    expect(rest.x).toBeCloseTo(fixed.w + 16, 1);
    expect(rest.x + rest.w).toBeCloseTo(488, 1);
  });
});

test.describe('COL-5 and COL-6: outside a Row, and nesting', () => {
  test('an inner Row without a gutter does not take the gutter of the outer one', async ({ page }) => {
    // Custom properties inherit; the component resets them, so the inner Row must lay out as if it stood alone.
    await draw(
      page,
      [{ id: 'outer', gutter: 32, cols: [{ span: 12, rows: [{ id: 'inner', cols: [{ span: 12 }, { span: 12 }] }] }, { span: 12 }] }],
      632
    );
    const inner = await boxes(page, 'inner');
    expect(inner[0].x).toBeCloseTo(0, 1);
    expect(inner[1].x).toBeCloseTo(inner[0].w, 1);
    expect(inner[0].w + inner[1].w).toBeCloseTo(spanWidth(632, 32, 12), 1);
  });

  test('a nested Row with its own gutter fills the content box of the column', async ({ page }) => {
    await draw(
      page,
      [{ id: 'outer', gutter: 32, cols: [{ span: 12, rows: [{ id: 'inner', gutter: 8, cols: [{ span: 12 }, { span: 12 }] }] }, { span: 12 }] }],
      632
    );
    const inner = await boxes(page, 'inner');
    const column = spanWidth(632, 32, 12);
    expect(inner[0].w + 8 + inner[1].w).toBeCloseTo(column, 1);
  });

  test('a Col without a span, nested in a Col with a span, keeps its content width', async ({ page }) => {
    await draw(page, [{ id: 'outer', cols: [{ span: 12, rows: [{ id: 'inner', cols: [{ text: 'x' }] }] }] }], 600);
    const [inner] = await boxes(page, 'inner');
    expect(inner.w).toBeLessThan(100);
  });
});

test.describe('Breakpoints in the browser', () => {
  const widths: [number, string, string][] = [
    [400, 'xs', 'xs'],
    [575, 'xs', 'xs'],
    [576, 'sm', 'sm'],
    [800, 'md', 'sm md'],
    [1000, 'lg', 'sm md lg'],
    [1300, 'xl', 'sm md lg xl'],
    [1700, 'xxl', 'sm md lg xl xxl'],
    [2000, 'xxxl', 'sm md lg xl xxl xxxl']
  ];
  for (const [viewport, current, flags] of widths) {
    test(`at ${viewport} px: current ${current}, flags ${flags}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 800 });
      await expect(page.getByTestId('current')).toHaveText(current);
      await expect(page.getByTestId('flags')).toHaveText(flags);
    });
  }

  test('the values are right on the first render and follow a resize', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('/#grid');
    await page.reload();
    await expect(page.getByTestId('current')).toHaveText('md');
    await page.setViewportSize({ width: 1300, height: 800 });
    await expect(page.getByTestId('current')).toHaveText('xl');
    await page.setViewportSize({ width: 500, height: 800 });
    await expect(page.getByTestId('current')).toHaveText('xs');
  });

  test('the flags of the helper and the layout of the columns agree at every boundary', async ({ page }) => {
    for (const viewport of [575, 576, 767, 768, 991, 992, 1199, 1200, 1599, 1600, 1919, 1920]) {
      await page.setViewportSize({ width: viewport, height: 800 });
      await draw(page, [{ id: 'row', cols: [{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10, xxl: 12, xxxl: 14 }] }], 960);
      const [box] = await boxes(page, 'row');
      const span = Math.round((box.w / 960) * 24);
      const byName = { 2: 'xs', 4: 'sm', 6: 'md', 8: 'lg', 10: 'xl', 12: 'xxl', 14: 'xxxl' } as Record<number, string>;
      // The helper updates on the change event of its media queries, a moment after the layout.
      await expect(page.getByTestId('current'), `at ${viewport}px the columns are ${span} wide`).toHaveText(byName[span]);
    }
  });
});
