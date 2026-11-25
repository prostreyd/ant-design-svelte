import { expect, test, type Locator, type Page } from '@playwright/test';

// Typography in a real browser (specs/typography.md): the geometry measured on the Ant Design demos, the edit field that moves
// nothing, the cut of long text against the rows it was given (CSS and script), the tip, the copy state, right-to-left, reduced
// motion and the contrast of the colors the browser really paints. The `TypographyLab` page (e2e/fixtures/TypographyLab.svelte)
// mounts what a test asks.

type Kind = 'title' | 'paragraph' | 'text' | 'link' | 'article';
type Config = { kind: Kind; props: Record<string, unknown>; text: string; asContent?: boolean; article?: boolean; width?: number; dir?: 'ltr' | 'rtl' };
declare global {
  interface Window {
    __typographyLab: {
      set(config: Config): void;
      update(patch: Record<string, unknown>): void;
      setText(text: string): void;
      log(): string[];
      clear(): void;
      state(): { editing: boolean; expanded: boolean; content: string };
      answer(): void;
    };
  }
}

const SENTENCE = 'Ant Design, a design language for background applications, is refined by Ant UED Team. ';
const LONG = SENTENCE.repeat(8);

async function mount(page: Page, config: Partial<Config> & { kind: Kind }): Promise<void> {
  await page.evaluate((c) => window.__typographyLab.set({ props: {}, text: 'Hello', ...c }), config);
}
const field = (page: Page) => page.locator('.ads-typography-edit-content .ads-input');
const log = (page: Page) => page.evaluate(() => window.__typographyLab.log());
const part = (page: Page) => page.locator('#host > .ads-typography');
const box = (locator: Locator) => locator.evaluate((element) => { const r = element.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; });
const css = (locator: Locator, ...names: string[]) =>
  locator.evaluate((element, list) => { const style = getComputedStyle(element); return Object.fromEntries(list.map((name) => [name, style.getPropertyValue(name)])); }, names);
const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
function contrast(a: number[], b: number[]): number {
  const luminance = ([r, g, bl]: number[]) => {
    const channel = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl);
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Nothing on these pages may raise an error: a tip whose focused trigger is taken out of the page once did.
let errors: string[] = [];
test.afterEach(() => {
  expect(errors).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#typography');
  await page.waitForFunction(() => Boolean(window.__typographyLab));
});

test.describe('geometry measured on the Ant Design demos', () => {
  test('titles: size, line height, weight and margins', async ({ page }) => {
    const expected: Record<number, [string, string, string, string]> = {
      1: ['38px', '46px', '0px', '19px'],
      2: ['30px', '38px', '36px', '15px'],
      3: ['24px', '32px', '28.8px', '12px'],
      4: ['20px', '28px', '24px', '10px'],
      5: ['16px', '24px', '19.2px', '8px']
    };
    for (const level of [1, 2, 3, 4, 5]) {
      await mount(page, { kind: 'title', text: 'Heading', props: { level } });
      const style = await css(page.locator('#host > .ads-typography'), 'font-size', 'line-height', 'font-weight', 'margin-top', 'margin-bottom');
      // The lab puts a paragraph before the title, so the margin of a title that is not the first child is the full 1.2em.
      const [size, line, , bottom] = expected[level];
      expect(style['font-size']).toBe(size);
      expect(style['line-height']).toBe(line);
      expect(style['font-weight']).toBe('600');
      expect(style['margin-bottom']).toBe(bottom);
      expect(parseFloat(style['margin-top'])).toBeCloseTo(parseFloat(size) * 1.2, 1);
    }
  });

  test('a first title has no top margin', async ({ page }) => {
    await mount(page, { kind: 'title', text: 'Heading', article: true });
    await page.evaluate(() => document.getElementById('before')?.remove());
    const style = await css(page.locator('#host > article > h1'), 'margin-top');
    expect(style['margin-top']).toBe('0px');
  });

  test('TYP-5: the plain tags inside the article are styled, the same tags outside are left to the browser', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const inside = (selector: string, ...names: string[]) => css(page.locator(`#in > ${selector}`).first(), ...names);
    const outside = (selector: string, ...names: string[]) => css(page.locator(`#out > ${selector}`).first(), ...names);
    const sizes = [['h1', '38px', '46px'], ['h2', '30px', '38px'], ['h3', '24px', '32px'], ['h4', '20px', '28px'], ['h5', '16px', '24px']];
    for (const [tag, size, line] of sizes) {
      expect(await inside(tag, 'font-size', 'line-height', 'font-weight')).toEqual({ 'font-size': size, 'line-height': line, 'font-weight': '600' });
      expect((await outside(tag, 'font-weight'))['font-weight']).toBe('700');
    }
    expect(await inside('h4', 'margin-top', 'margin-bottom')).toEqual({ 'margin-top': '24px', 'margin-bottom': '10px' });
    expect(await inside('ul > li', 'list-style-type', 'margin-left', 'padding-left')).toEqual({ 'list-style-type': 'circle', 'margin-left': '20px', 'padding-left': '4px' });
    expect((await inside('ul > li > ul > li', 'list-style-type'))['list-style-type']).toBe('square');
    expect((await inside('ol > li', 'margin-left'))['margin-left']).toBe('20px');
    expect(await outside('ul > li', 'list-style-type', 'margin-left')).toEqual({ 'list-style-type': 'disc', 'margin-left': '0px' });
    expect(await inside('blockquote', 'border-left-width', 'border-left-style', 'margin-left')).toEqual({ 'border-left-width': '4px', 'border-left-style': 'solid', 'margin-left': '0px' });
    expect((await outside('blockquote', 'border-left-width'))['border-left-width']).toBe('0px');
    expect(await inside('pre', 'border-top-width', 'margin-top', 'margin-bottom')).toEqual({ 'border-top-width': '1px', 'margin-top': '0px', 'margin-bottom': '14px' });
    expect(await inside('pre > code', 'border-top-width', 'background-color')).toEqual({ 'border-top-width': '0px', 'background-color': 'rgba(0, 0, 0, 0)' });
    expect((await inside('p > code', 'border-top-width'))['border-top-width']).toBe('1px');
    expect((await inside('p > kbd', 'border-bottom-width'))['border-bottom-width']).toBe('2px');
    expect((await inside('p > mark', 'background-color'))['background-color']).toBe('rgb(255, 229, 143)');
    expect((await inside('p > strong', 'font-weight'))['font-weight']).toBe('600');
    expect((await outside('p > code', 'border-top-width'))['border-top-width']).toBe('0px');
    expect((await outside('p > mark', 'background-color'))['background-color']).not.toBe('rgb(255, 229, 143)');
  });

  test('TYP-5: our own components inside the article look exactly as they do outside', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const looks = (host: string) =>
      page.evaluate((id) => {
        const names = ['color', 'font-size', 'line-height', 'font-weight', 'margin-top', 'margin-bottom', 'margin-left', 'padding-left', 'list-style-type', 'text-decoration-line', 'transition-duration'];
        return [...document.querySelectorAll(`${id} [class^="ads-"], ${id} [class*=" ads-"]`)].map((element) => {
          const style = getComputedStyle(element);
          return `${element.tagName} ${element.textContent?.trim().slice(0, 20)}: ${names.map((name) => `${name} ${style.getPropertyValue(name)}`).join('; ')}`;
        });
      }, host);
    const outside = await looks('#out');
    expect(outside.length).toBeGreaterThan(10);
    expect(await looks('#in')).toEqual(outside);
  });

  test('TYP-5: a plain paragraph of the article keeps 1em under it, also where the application resets paragraphs', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const margins = (selector: string) => css(page.locator(selector), 'margin-top', 'margin-bottom');
    // A first paragraph does not push its box down; the next ones keep the space of the browser above them.
    expect(await margins('#in p.first')).toEqual({ 'margin-top': '0px', 'margin-bottom': '14px' });
    expect(await margins('#in p.second')).toEqual({ 'margin-top': '14px', 'margin-bottom': '14px' });
    expect(await margins('#out p.first')).toEqual({ 'margin-top': '14px', 'margin-bottom': '14px' });
    await page.addStyleTag({ content: 'p { margin: 0 }' });
    expect(await margins('#in p.second')).toEqual({ 'margin-top': '0px', 'margin-bottom': '14px' });
    expect(await margins('#out p.second')).toEqual({ 'margin-top': '0px', 'margin-bottom': '0px' });
  });

  test('TYP-5: a plain link of the article looks like a TypographyLink; an anchor without href stays text', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const link = page.locator('#in .links a[href]');
    // The lab loads `tokens-accessible.css`: #1668dc, on hover #0958d9, pressed #003eb3.
    const looks = { color: 'rgb(22, 104, 220)', 'text-decoration-line': 'none', 'transition-duration': '0.3s' };
    expect(await css(link, 'color', 'text-decoration-line', 'transition-duration')).toEqual(looks);
    expect(await css(page.locator('#in a.ads-typography-link[href]'), 'color', 'text-decoration-line', 'transition-duration')).toEqual(looks);
    expect((await css(page.locator('#out .links a[href]'), 'text-decoration-line'))['text-decoration-line']).toBe('underline');
    expect(await css(page.locator('#in a.named'), 'color', 'text-decoration-line')).toEqual({ color: 'rgba(0, 0, 0, 0.88)', 'text-decoration-line': 'none' });
    // A click would change the address, and with it the page of the lab.
    await link.evaluate((a) => a.addEventListener('click', (event) => event.preventDefault()));
    await link.hover();
    await expect(link).toHaveCSS('color', 'rgb(9, 88, 217)');
    await page.mouse.down();
    await expect(link).toHaveCSS('color', 'rgb(0, 62, 179)');
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await expect(link).toHaveCSS('color', 'rgb(22, 104, 220)');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(link).toHaveCSS('transition-duration', '0s');
  });

  test('TYP-5: a plain link of the article gets the focus ring of the library from the keyboard', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const link = page.locator('#in .links a[href]');
    // From the keyboard: forth and back, so that the ring is the one of `:focus-visible` in every engine.
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await link.focus();
    const ring = ['outline-style', 'outline-width', 'outline-color', 'outline-offset'];
    await expect(link).toHaveCSS('outline-style', 'solid');
    const plain = await css(link, ...ring);
    const own = page.locator('#in a.ads-typography-link[href]');
    await own.focus();
    await expect(own).toHaveCSS('outline-style', 'solid');
    expect(plain).toEqual(await css(own, ...ring));
  });

  test('TYP-5a: a plain link inside a part, outside the article, looks like a TypographyLink', async ({ page }) => {
    await mount(page, { kind: 'article' });
    // The lab loads `tokens-accessible.css`: #1668dc, on hover #0958d9.
    for (const name of ['in-part', 'in-title', 'in-text', 'in-disabled']) {
      expect(await css(page.locator(`#out a.${name}`), 'color', 'text-decoration-line'), name).toEqual({ color: 'rgb(22, 104, 220)', 'text-decoration-line': 'none' });
    }
    expect((await css(page.locator('#out a.in-part-named'), 'color')).color).toBe('rgba(0, 0, 0, 0.88)');
    // A link outside every part and the article keeps the look of the browser.
    expect((await css(page.locator('#out .links a[href]'), 'text-decoration-line'))['text-decoration-line']).toBe('underline');
    const link = page.locator('#out a.in-part');
    await link.hover();
    await expect(link).toHaveCSS('color', 'rgb(9, 88, 217)');
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await link.focus();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await expect(link).toHaveCSS('outline-width', '2px');
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await page.evaluate(() => delete document.documentElement.dataset.theme);
  });

  test('TYP-5: in the dark theme the links are underlined, so color is not their only sign; a disabled one is not', async ({ page }) => {
    await mount(page, { kind: 'article' });
    const plain = page.locator('#in .links a[href]');
    const own = page.locator('#in a.ads-typography-link[href]');
    const disabled = page.locator('#in a.ads-typography-link.ads-typography-disabled');
    for (const link of [plain, own, disabled]) await expect(link).toHaveCSS('text-decoration-line', 'none');
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await expect(plain).toHaveCSS('text-decoration-line', 'underline');
    await expect(own).toHaveCSS('text-decoration-line', 'underline');
    await expect(disabled).toHaveCSS('text-decoration-line', 'none');
    await expect(page.locator('#in .ads-btn')).toHaveCSS('text-decoration-line', 'none');
    await page.evaluate(() => delete document.documentElement.dataset.theme);
  });

  test('a paragraph is 14 px with a line of 22 px and a bottom margin of 1em', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello' });
    const style = await css(part(page), 'font-size', 'line-height', 'margin-bottom');
    expect(style).toEqual({ 'font-size': '14px', 'line-height': '22px', 'margin-bottom': '14px' });
  });

  test('the decorations: strong, mark, code, kbd, underline, delete', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'x', props: { strong: true, mark: true, code: true, keyboard: true, underline: true, delete: true } });
    const get = (tag: string) => css(page.locator(`#host ${tag}`).first(), 'font-weight', 'background-color', 'border-top-width', 'border-bottom-width', 'border-top-left-radius', 'font-size', 'text-decoration-line', 'padding-left', 'margin-left');
    expect((await get('strong'))['font-weight']).toBe('600');
    expect((await get('mark'))['background-color']).toBe('rgb(255, 229, 143)');
    const code = await get('code');
    expect(code['border-top-width']).toBe('1px');
    expect(code['border-top-left-radius']).toBe('3px');
    expect(parseFloat(code['font-size'])).toBeCloseTo(11.9, 1);
    expect((await get('u'))['text-decoration-line']).toBe('underline');
    expect((await get('del'))['text-decoration-line']).toBe('line-through');
    await mount(page, { kind: 'paragraph', text: 'x', props: { keyboard: true } });
    const kbd = await get('kbd');
    expect(kbd['border-bottom-width']).toBe('2px');
    expect(parseFloat(kbd['font-size'])).toBeCloseTo(12.6, 1);
  });

  test('the copy button is a 14 x 22 px glyph, 4 px from the text', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'This is a copyable text.', props: { copyable: true } });
    const copy = page.getByRole('button', { name: 'Copy' });
    const { width, height } = await box(copy);
    expect(Math.round(width)).toBe(14);
    expect(Math.round(height)).toBe(22);
    const gap = (await box(copy)).left - (await box(page.locator('.ads-typography-content'))).right;
    expect(Math.round(gap)).toBe(4);
  });
});

test.describe('the edit field moves nothing', () => {
  test('opening the field keeps the neighbours where they are; the field overhangs the line by 5 px and 12 px', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'This is an editable text.', props: { editable: true } });
    const before = { after: await box(page.locator('#after')), part: await box(part(page)) };
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('textbox')).toBeFocused();
    expect((await box(page.locator('#after'))).top).toBeCloseTo(before.after.top, 1);
    const area = await box(field(page));
    expect(Math.round(area.height)).toBe(32);
    expect(area.top).toBeCloseTo(before.part.top - 5, 0);
    expect(area.left).toBeCloseTo(before.part.left - 12, 0);
    // The part itself is the field's height, 5 px above and below the line: its margins shrink by the same, so nothing else moves.
    const open = await box(part(page));
    expect(Math.round(open.height)).toBe(32);
    expect(open.bottom).toBeCloseTo(before.part.bottom + 5, 0);
  });

  test('a title takes the font size of its text in the field and still moves nothing', async ({ page }) => {
    await mount(page, { kind: 'title', text: 'Heading text', props: { level: 2, editable: true } });
    const after = await box(page.locator('#after'));
    await page.getByRole('button', { name: 'Edit' }).click();
    const area = page.getByRole('textbox');
    await expect(area).toBeFocused();
    expect((await css(area, 'font-size'))['font-size']).toBe('30px');
    expect((await css(area, 'line-height'))['line-height']).toBe('38px');
    expect(Math.round((await box(field(page))).height)).toBe(48);
    expect((await box(page.locator('#after'))).top).toBeCloseTo(after.top, 1);
  });

  test('Enter keeps the text and returns the focus to the pencil; Escape discards', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { editable: { onchange: true, onend: true, oncancel: true, onstart: true } }, asContent: true });
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.keyboard.type('!!');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();
    await expect(part(page)).toContainText('Hello!!');
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.keyboard.type('??');
    await page.keyboard.press('Escape');
    await expect(part(page)).toContainText('Hello!!');
    await expect(part(page)).not.toContainText('??');
    expect(await log(page)).toEqual(['onstart', 'onchange:Hello!!', 'onend', 'onstart', 'oncancel']);
  });

  test('a click elsewhere keeps the text and the focus stays where the user put it', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { editable: true }, asContent: true });
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.keyboard.type('!');
    await page.locator('#outside').click();
    await expect(part(page)).toContainText('Hello!');
    await expect(page.locator('#outside')).toBeFocused();
  });

  test('Shift+Enter inserts no line break', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { editable: true } });
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.keyboard.press('Shift+Enter');
    await expect(page.getByRole('textbox')).toHaveValue('Hello');
  });
});

test.describe('the cut of long text', () => {
  test('one row in CSS: the box is one line, clipped, and the buttons stay beside it', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: true, copyable: true }, width: 400 });
    expect(Math.round((await box(part(page))).height)).toBe(22);
    const text = page.locator('.ads-typography-content');
    expect(await text.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
    const textBox = await box(text);
    const copy = await box(page.getByRole('button', { name: 'Copy' }));
    expect(copy.left).toBeGreaterThanOrEqual(textBox.right);
    expect(copy.right).toBeLessThanOrEqual((await box(part(page))).right + 0.5);
    expect((await css(text, 'text-overflow'))['text-overflow']).toBe('ellipsis');
  });

  test('several rows in CSS: the box is exactly the rows', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { rows: 3 } }, width: 400 });
    expect(Math.round((await box(part(page))).height)).toBe(66);
    expect(await page.locator('.ads-typography-content').evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
  });

  test('the script cut with an expand button and a suffix fills exactly the rows, and the button is at the end of the last row', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { rows: 2, expandable: true, suffix: '--Ant' } }, width: 500 });
    await expect(page.getByRole('button', { name: 'Expand' })).toBeVisible();
    const root = await box(part(page));
    expect(Math.round(root.height)).toBe(44);
    const expand = await box(page.getByRole('button', { name: 'Expand' }));
    expect(expand.top).toBeGreaterThanOrEqual(root.top + 21);
    expect(expand.bottom).toBeLessThanOrEqual(root.bottom + 0.5);
    expect(expand.right).toBeLessThanOrEqual(root.right + 0.5);
    const suffix = await box(page.locator('.ads-typography-suffix'));
    expect(suffix.top).toBeGreaterThanOrEqual(root.top + 21);
    await expect(page.locator('.ads-typography-sr')).toHaveText(LONG.trim());
  });

  test('a narrower box cuts again and still fits the rows; a wider box shows more', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { rows: 2, expandable: true } }, width: 600 });
    const shown = () => page.locator('.ads-typography-host > span[aria-hidden="true"]').first().evaluate((e) => (e.textContent ?? '').length);
    const wide = await shown();
    await page.evaluate(() => ((document.getElementById('host') as HTMLElement).style.width = '300px'));
    await expect.poll(shown).toBeLessThan(wide);
    expect(Math.round((await box(part(page))).height)).toBe(44);
    await page.evaluate(() => ((document.getElementById('host') as HTMLElement).style.width = '700px'));
    await expect.poll(shown).toBeGreaterThan(wide);
    expect(Math.round((await box(part(page))).height)).toBe(44);
  });

  test('expand and collapse change only the height of the part; the neighbours move by exactly that', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { rows: 2, expandable: 'collapsible', onexpand: true } }, width: 500 });
    const cut = { part: await box(part(page)), after: await box(page.locator('#after')), before: await box(page.locator('#before')) };
    await page.getByRole('button', { name: 'Expand' }).click();
    const open = { part: await box(part(page)), after: await box(page.locator('#after')), before: await box(page.locator('#before')) };
    expect(open.before.top).toBe(cut.before.top);
    expect(open.part.top).toBe(cut.part.top);
    expect(open.part.height).toBeGreaterThan(cut.part.height);
    expect(open.after.top - cut.after.top).toBeCloseTo(open.part.height - cut.part.height, 1);
    await page.getByRole('button', { name: 'Collapse' }).click();
    expect((await box(page.locator('#after'))).top).toBeCloseTo(cut.after.top, 1);
    expect(await log(page)).toEqual(['onexpand:true', 'onexpand:false']);
  });

  test('a text that fits is shown whole, with its suffix, and no expand button', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Short text', props: { ellipsis: { rows: 2, expandable: true, suffix: '--Ant' } }, width: 500 });
    await expect(part(page)).toContainText('Short text--Ant');
    await expect(page.getByRole('button', { name: 'Expand' })).toBeHidden();
    expect(Math.round((await box(part(page))).height)).toBe(22);
  });

  test('a Text with a width cuts in one inline row', async ({ page }) => {
    await mount(page, { kind: 'text', text: 'x', width: 200 });
    const row = (await box(part(page))).height;
    await mount(page, { kind: 'text', text: LONG, props: { ellipsis: true }, width: 200 });
    const root = await box(part(page));
    expect(root.width).toBeLessThanOrEqual(200.5);
    expect(root.height).toBeLessThan(row * 1.5);
  });

  test('a Text with a suffix cuts to the room its parent gives, and follows the parent', async ({ page }) => {
    await mount(page, { kind: 'text', text: 'x', width: 300 });
    const row = (await box(part(page))).height;
    await mount(page, { kind: 'text', text: LONG, props: { ellipsis: { suffix: '--Ant' } }, width: 300 });
    const first = await box(part(page));
    expect(first.width).toBeLessThanOrEqual(300.5);
    expect(first.height).toBeLessThan(row * 1.5);
    await page.evaluate(() => ((document.getElementById('host') as HTMLElement).style.width = '600px'));
    await expect.poll(async () => (await box(part(page))).width).toBeGreaterThan(first.width + 100);
    expect((await box(part(page))).height).toBeLessThan(row * 1.5);
  });
});

test.describe('the tip and onellipsis', () => {
  test('a clipped text shows its whole text in a tip; a copy button does not open it', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { tooltip: true }, copyable: true }, width: 400 });
    await page.getByRole('button', { name: 'Copy' }).hover();
    await expect(page.getByRole('tooltip')).toHaveText('Copy');
    await page.mouse.move(2, 400);
    await expect(page.getByRole('tooltip')).toBeHidden();
    await page.locator('.ads-typography-content').hover();
    await expect(page.getByRole('tooltip')).toContainText('Ant Design, a design language');
  });

  test('a text that fits has no tip', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Short', props: { ellipsis: { tooltip: true } }, width: 400 });
    await page.locator('.ads-typography-content').hover();
    await page.waitForTimeout(400);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('onellipsis follows the width', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: SENTENCE, props: { ellipsis: { onellipsis: true } }, width: 900 });
    await expect.poll(() => log(page)).toEqual(['onellipsis:false']);
    await page.evaluate(() => ((document.getElementById('host') as HTMLElement).style.width = '200px'));
    await expect.poll(() => log(page)).toEqual(['onellipsis:false', 'onellipsis:true']);
  });
});

test.describe('copy', () => {
  test('the copy state: the name, the box, the neighbours; it returns after 3 s', async ({ page, browserName, context }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mount(page, { kind: 'paragraph', text: 'This is a copyable text.', props: { copyable: { oncopy: true } } });
    const copy = page.getByRole('button', { name: 'Copy' });
    const before = { button: await box(copy), after: await box(page.locator('#after')), text: await box(page.locator('.ads-typography-content')) };
    await copy.click();
    const copied = page.getByRole('button', { name: 'Copied' });
    await expect(copied).toBeVisible();
    expect(await box(copied)).toEqual(before.button);
    expect((await box(page.locator('#after'))).top).toBe(before.after.top);
    expect((await box(page.locator('.ads-typography-content'))).right).toBe(before.text.right);
    await expect(page.getByRole('status')).toHaveText('Copied');
    if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('This is a copyable text.');
    expect(await log(page)).toEqual(['oncopy']);
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('status')).toHaveText('');
  });

  test('a promised text: a turning spinner in the same box until the check, and the focus stays', async ({ page, browserName, context }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mount(page, { kind: 'paragraph', text: 'This is a copyable text.', props: { copyable: { text: 'Later', pending: true, oncopy: true } } });
    const button = page.locator('.ads-typography-copy');
    const before = { button: await box(button), after: await box(page.locator('#after')), text: await box(page.locator('.ads-typography-content')) };
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const spinner = button.locator('.ads-icon-loading');
    await expect(spinner).toHaveCSS('animation-name', /ads-icon-turn/);
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveCSS('cursor', 'default');
    await expect(button).toBeFocused();
    expect(await box(button)).toEqual(before.button);
    expect((await box(page.locator('#after'))).top).toBe(before.after.top);
    expect((await box(page.locator('.ads-typography-content'))).right).toBe(before.text.right);
    // A second press while the text is awaited asks for nothing.
    await page.keyboard.press('Enter');
    expect(await log(page)).toEqual(['request']);
    await page.evaluate(() => window.__typographyLab.answer());
    const copied = page.getByRole('button', { name: 'Copied' });
    await expect(copied).toBeFocused();
    await expect(spinner).toHaveCount(0);
    await expect(button).not.toHaveAttribute('aria-busy');
    expect(await box(copied)).toEqual(before.button);
    if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Later');
    expect(await log(page)).toEqual(['request', 'oncopy']);
  });

  test('a promised text that takes more than 5 s is still copied: the write started inside the click', async ({ page, browserName, context }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { copyable: { text: 'Slow answer', pending: 6000, oncopy: true } } });
    const button = page.locator('.ads-typography-copy');
    await button.click();
    await expect(button.locator('.ads-icon-loading')).toBeVisible();
    // The time itself is under test: a browser lets a click pay for a write for about 5 s, and no longer. The page answers by
    // itself and the test leaves it alone meanwhile, because every call of Playwright into the page counts as a new click.
    await page.waitForTimeout(6500);
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Slow answer');
    expect(await log(page)).toEqual(['request', 'oncopy']);
  });

  test('the keyboard copies, and the focus ring is drawn', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { copyable: true } });
    await page.keyboard.press('Tab');
    const copy = page.getByRole('button', { name: 'Copy' });
    await expect(copy).toBeFocused();
    const outline = await css(copy, 'outline-style', 'outline-width');
    expect(outline['outline-style']).toBe('solid');
    expect(outline['outline-width']).toBe('2px');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Copied' })).toBeFocused();
  });

  test('a button inside a link does not follow the link', async ({ page }) => {
    await mount(page, { kind: 'link', text: 'Go', props: { href: '#clicked', copyable: true, editable: true } });
    await page.getByRole('button', { name: 'Copy' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    expect(page.url()).not.toContain('#clicked');
  });
});

test.describe('a focused button with an open tip', () => {
  test('taking it out of the page raises no error (the edit field replaces it, or the part goes away)', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Hello', props: { editable: true } });
    await page.getByRole('button', { name: 'Edit' }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await mount(page, { kind: 'paragraph', text: 'Another part' });
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });
});

test.describe('right-to-left and motion', () => {
  test('TYP-39: right-to-left: the cut falls on the end side, with the expand button at the left of the last row', async ({ page }) => {
    const place = async (dir: 'ltr' | 'rtl') => {
      await mount(page, { kind: 'paragraph', text: LONG, props: { ellipsis: { rows: 2, expandable: true } }, width: 400, dir });
      const button = page.getByRole('button', { name: 'Expand' });
      await expect(button).toBeVisible();
      const [own, whole] = [await box(button), await box(part(page))];
      return { middle: (own.left + own.right) / 2 - whole.left, row: own.top - whole.top, width: whole.width, height: whole.height };
    };
    const left = await place('ltr');
    const right = await place('rtl');
    expect(left.middle).toBeGreaterThan(left.width / 2);
    expect(right.middle).toBeLessThan(right.width / 2);
    for (const side of [left, right]) {
      expect(side.height).toBeCloseTo(44, 0);
      expect(side.row).toBeGreaterThan(18);
    }
  });

  test('TYP-39: right-to-left: the buttons are on the other side of the text', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Text', props: { copyable: true }, dir: 'rtl' });
    const text = await box(page.locator('.ads-typography-content'));
    const copy = await box(page.getByRole('button', { name: 'Copy' }));
    expect(copy.right).toBeLessThanOrEqual(text.left + 0.5);
  });

  test('TYP-39: right-to-left: the edit field overhangs the start side, which is the right one', async ({ page }) => {
    await mount(page, { kind: 'paragraph', text: 'Text', props: { editable: true }, dir: 'rtl' });
    const text = await box(page.locator('.ads-typography-content'));
    await page.getByRole('button', { name: 'Edit' }).click();
    const area = await box(field(page));
    expect(Math.abs(area.right - ((await box(part(page))).right + 12))).toBeLessThanOrEqual(1.5);
    expect(text.right).toBeLessThanOrEqual(area.right);
  });

  test('shimmer: a moving gradient, the motion plus the wait as one duration; none with reduced motion', async ({ page }) => {
    await mount(page, { kind: 'text', text: 'Thinking...', props: { shimmer: { duration: [1, 1] } } });
    await expect(part(page)).toHaveAttribute('aria-busy', 'true');
    expect(await part(page).evaluate((e) => e.getAnimations().map((a) => (a.effect?.getTiming().duration as number) ?? 0))).toEqual([2000]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount(page, { kind: 'text', text: 'Thinking...', props: { shimmer: true } });
    expect(await part(page).evaluate((e) => e.getAnimations().length)).toBe(0);
    expect((await css(part(page), '-webkit-text-fill-color'))['-webkit-text-fill-color']).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('contrast', () => {
  const PAGE = [255, 255, 255];
  test('every type color, the link and the actions are at least 4.5:1 with the accessible colors', async ({ page }) => {
    for (const type of ['secondary', 'success', 'warning', 'danger']) {
      await mount(page, { kind: 'text', text: 'Text', props: { type } });
      expect(contrast(rgb((await css(part(page), 'color')).color), PAGE), type).toBeGreaterThanOrEqual(4.5);
    }
    await mount(page, { kind: 'link', text: 'Link', props: { href: '#x', copyable: true } });
    expect(contrast(rgb((await css(part(page), 'color')).color), PAGE), 'link').toBeGreaterThanOrEqual(4.5);
    expect(contrast(rgb((await css(page.getByRole('button', { name: 'Copy' }), 'color')).color), PAGE), 'action').toBeGreaterThanOrEqual(4.5);
  });

  test('the dark theme keeps the ratios against its page', async ({ page }) => {
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    const dark = rgb(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ads-color-bg-container').trim() === '' ? 'rgb(20, 20, 20)' : 'rgb(20, 20, 20)'));
    for (const type of ['secondary', 'success', 'warning', 'danger']) {
      await mount(page, { kind: 'text', text: 'Text', props: { type } });
      expect(contrast(rgb((await css(part(page), 'color')).color), dark), type).toBeGreaterThanOrEqual(4.5);
    }
    await mount(page, { kind: 'paragraph', text: 'Text', props: {} });
    expect(contrast(rgb((await css(part(page), 'color')).color), dark)).toBeGreaterThanOrEqual(4.5);
    await page.evaluate(() => delete document.documentElement.dataset.theme);
  });
});
