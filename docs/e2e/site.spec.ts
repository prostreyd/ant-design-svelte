// End-to-end tests of the built documentation site (see playwright.config.ts).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { demos } from '../src/docs/data/button.ts';
import { demos as checkboxDemos } from '../src/docs/data/checkbox.ts';
import { demos as gridDemos } from '../src/docs/data/grid.ts';
import { demos as inputDemos } from '../src/docs/data/input.ts';
import { demos as menuDemos } from '../src/docs/data/menu.ts';
import { demos as messageDemos } from '../src/docs/data/message.ts';
import { demos as radioDemos } from '../src/docs/data/radio.ts';
import { demos as selectDemos } from '../src/docs/data/select.ts';
import { demos as spinDemos } from '../src/docs/data/spin.ts';
import { demos as switchDemos } from '../src/docs/data/switch.ts';
import { demos as tooltipDemos } from '../src/docs/data/tooltip.ts';
import { allPages, localize, type SitePath } from '../src/docs/pages.ts';

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const LANGS = ['en', 'ru', 'zh'] as const;
type Lang = (typeof LANGS)[number];
const HTML_LANG: Record<Lang, string> = { en: 'en', ru: 'ru', zh: 'zh-CN' };

/** The URL of a page relative to the base URL, e.g. 'ru/docs/faq/'. */
const rel = (path: SitePath, lang: Lang = 'en') => localize(path, lang).slice(1);

/** Opens a page and waits until the scripts have loaded, so that clicks and shortcuts have handlers to run. */
async function open(page: Page, url: string) {
  return page.goto(url, { waitUntil: 'networkidle' });
}

interface Violation {
  id: string;
  impact: string | null;
  targets: string[];
}

/** The part of the axe-core result that the tests read. */
interface AxeResult {
  violations: { id: string; impact?: string | null; nodes: { target: unknown[] }[] }[];
}

/**
 * Runs axe twice. All rules run on the whole page except `color-contrast`, which runs on the page without the
 * components of the library: they use Ant Design's own colours by default, which do not reach WCAG AA for text
 * (white on the primary fill is 4.10:1). Their contrast is covered by the contrast tests of the library, which load
 * tokens-accessible.css. The site's own texts, links and chrome are still checked for contrast.
 */
async function accessibilityViolations(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const axe = (window as unknown as {
      axe: {
        run: (context: Document | { exclude: string[][] }, options?: object) => Promise<AxeResult>;
      };
    }).axe;
    const library = ['.ads-btn', '.ads-switch', '.ads-checkbox', '.ads-checkbox-group', '.ads-radio', '.ads-radio-button', '.ads-radio-group', '.ads-input', '.ads-input-search', '.ads-input-otp', '.ads-select', '.ads-popup', '.ads-menu', '.ads-spin'];
    const everything = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    const contrast = await axe.run(
      { exclude: library.map((selector) => [selector]) },
      { runOnly: { type: 'rule', values: ['color-contrast'] } }
    );
    return [...everything.violations, ...contrast.violations].map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(' '))
    }));
  });
}

function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`console ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  return problems;
}

// The layout changes at several widths (wide, laptop, phone); each one is checked in both themes.
const VIEWPORTS = { wide: { width: 1440, height: 900 }, laptop: { width: 1100, height: 800 }, phone: { width: 390, height: 844 } };

for (const [size, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`every page, ${size} screen, ${theme} theme`, () => {
      test.use({ colorScheme: theme, viewport });

      for (const lang of LANGS) {
        for (const def of allPages) {
          test(`${localize(def.path, lang)} has no console errors, no accessibility violations and no overflow`, async ({ page }) => {
            const problems = collectProblems(page);
            await open(page, rel(def.path, lang));

            await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[lang]);
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
            await expect(page.locator('h1')).toHaveCount(1);
            expect(await accessibilityViolations(page)).toEqual([]);
            expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
            expect(problems).toEqual([]);
          });
        }
      }
    });
  }
}

test.describe('navigation', () => {
  test('docs and components have separate sidebars', async ({ page }) => {
    await open(page, 'docs/');
    const docsSide = page.getByRole('navigation', { name: 'Documentation sections' });
    await expect(docsSide.getByRole('link', { name: 'Getting started' })).toBeVisible();
    await expect(docsSide.getByRole('link', { name: 'Button' })).toHaveCount(0);

    await open(page, 'components/');
    const componentsSide = page.getByRole('navigation', { name: 'Components' });
    await expect(componentsSide.getByRole('link', { name: /^Button/ })).toBeVisible();
    await expect(componentsSide.getByRole('link', { name: 'Getting started' })).toHaveCount(0);
  });

  for (const lang of LANGS) {
    test(`the names of the components in the left menu are not translated (${lang})`, async ({ page }) => {
      await open(page, rel('/components/button/', lang));
      const side = page.getByRole('navigation', { name: /Components|Компоненты|组件/ });
      // Only the English name, in every language: no translated note next to it.
      await expect(side.getByRole('link', { name: 'Button', exact: true })).toBeVisible();
      await expect(side.getByRole('link', { name: 'Radio', exact: true })).toBeVisible();
      // A component that is not ready shows its name and the "soon" mark, but no translation.
      const typography = side.getByText('Typography').first();
      await expect(typography).toBeVisible();
      for (const translated of ['Кнопка', 'Флажок', 'Радиокнопка', 'Выбор', '按钮', '多选框', '单选框', '选择器']) {
        await expect(side.getByText(translated)).toHaveCount(0);
      }
    });
  }

  test('components that are not ready are listed but are not links', async ({ page }) => {
    await open(page, 'components/');
    const side = page.getByRole('navigation', { name: 'Components' });
    await expect(side.getByText('Typography')).toBeVisible();
    await expect(side.getByRole('link', { name: /Typography/ })).toHaveCount(0);
  });

  test('switching the language keeps it on every page and updates <html lang> without a reload', async ({ page }) => {
    await open(page, '');
    await page.getByRole('button', { name: /Language/ }).click();
    await page.getByRole('link', { name: 'Русский' }).click();
    await expect(page).toHaveURL(/\/ru\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

    await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Документация' }).click();
    await expect(page).toHaveURL(/\/ru\/docs\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

    await page.getByRole('button', { name: /Язык/ }).click();
    await page.getByRole('link', { name: '中文' }).click();
    await expect(page).toHaveURL(/\/zh\/docs\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  });

  test('the theme toggle switches the theme and the choice survives a reload', async ({ page }) => {
    await open(page, '');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('search: "/" focuses the field, the result opens with Enter', async ({ page }) => {
    await open(page, '');
    // The shortcut exists once the page has hydrated, and "networkidle" does not say when that is (WebKit is
    // slower to get there): press it again until it takes effect.
    await expect(async () => {
      await page.keyboard.press('/');
      await expect(page.getByRole('searchbox')).toBeFocused({ timeout: 500 });
    }).toPass();
    await page.keyboard.type('butt');
    await expect(page.getByRole('region', { name: 'Search' }).getByRole('link', { name: /Button/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/components\/button\/$/);
  });

  test('search: a query with no matches says so, Escape clears it', async ({ page }) => {
    await open(page, '');
    await page.getByRole('searchbox').fill('zzzz');
    await expect(page.getByText('Nothing found')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('searchbox')).toHaveValue('');
  });

  test('the skip link is the first tab stop and leads to the main content', async ({ page }) => {
    await open(page, 'docs/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('an unknown URL shows the 404 page in the language of the URL', async ({ page }) => {
    const response = await open(page, 'no-such-page/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the home page' })).toHaveAttribute('href', /\/$/);

    await open(page, 'ru/no-such-page/');
    await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });

  test('the on-page contents list links to the headings of the page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // narrower screens have no contents column
    await open(page, 'docs/getting-started/');
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc.getByRole('link')).toHaveCount(await page.locator('.art h2[id]').count());
    await toc.getByRole('link', { name: 'Usage' }).click();
    await expect(page).toHaveURL(/#use$/);
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the menu opens, shows the pages of the section, and closes with Escape', async ({ page }) => {
    await open(page, 'docs/faq/');
    const menu = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(menu).toBeHidden();
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Getting started' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  for (const lang of LANGS) {
    test(`the menu on a phone shows the names of the components without translation (${lang})`, async ({ page }) => {
      await open(page, rel('/components/button/', lang));
      await page.getByRole('button', { name: /^(Menu|Меню|菜单)$/ }).click();
      const menu = page.locator('#mobile-nav');
      await expect(menu).toBeVisible();
      await expect(menu.getByRole('link', { name: 'Radio', exact: true })).toBeVisible();
      for (const translated of ['Кнопка', 'Флажок', 'Радиокнопка', 'Выбор', '按钮', '多选框', '单选框', '选择器']) {
        await expect(menu.getByText(translated)).toHaveCount(0);
      }
    });
  }

  test('the menu fills the screen under the header, and every link in it can really be pressed', async ({ page }) => {
    // A link that is "visible" can still be cut off by a panel that is too short: what counts is that the point in
    // the middle of the link belongs to the link, and that the panel reaches the bottom of the screen.
    for (const path of ['', 'docs/faq/', 'components/', 'components/select/']) {
      await open(page, path);
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      const menu = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(menu).toBeVisible();
      const reach = await menu.evaluate((nav) => ({
        bottom: Math.round(nav.getBoundingClientRect().bottom),
        viewport: window.innerHeight,
        links: [...nav.querySelectorAll('a')].map((link) => {
          // The panel scrolls (a long list of components): a link below the screen is reached by scrolling to it.
          link.scrollIntoView({ block: 'nearest' });
          const box = link.getBoundingClientRect();
          return { name: link.textContent!.trim(), pressed: link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
        })
      }));
      expect(reach.bottom, `${path} the panel reaches the bottom of the screen`).toBe(reach.viewport);
      for (const link of reach.links) expect(link.pressed, `${path} ${link.name}`).toBe(true);
      expect(reach.links.map((link) => link.name.replace(/\d.*$/, '')).slice(0, 3), path).toEqual(['Docs', 'Components', 'Changelog']);
    }
  });

  test('the menu has the link to the page with the list of components, and it opens that page', async ({ page }) => {
    await open(page, '');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Components' }).click();
    await expect(page).toHaveURL(/components\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Components overview');
  });
});

for (const [label, viewport] of [['a phone', { width: 390, height: 844 }], ['a desktop', { width: 1280, height: 900 }]] as const) {
  test.describe(`components overview on ${label}`, () => {
    test.use({ viewport });

    const READY = ['Button', 'Grid', 'Menu', 'Input', 'Checkbox', 'Radio', 'Switch', 'Select', 'Tooltip', 'Message'];
    const PLANNED = ['Typography', 'Icon', 'Dropdown', 'DatePicker', 'Form', 'Table', 'Modal', 'Drawer', 'Notification'];

    test('a ready card is a link with a blue silhouette and its name, and nothing else is written on it', async ({ page }) => {
      await open(page, 'components/');
      for (const name of READY) {
        const card = page.locator(`a.card[data-component="${name}"]`);
        await expect(card, name).toHaveAttribute('href', new RegExp(`/components/${name.toLowerCase()}/$`));
        await expect(card.locator('.nm'), name).toHaveText(name);
        const picture = card.locator('svg.wire');
        await expect(picture, name).toBeVisible();
        await expect(picture, name).toHaveClass(/ready/);
        expect(await picture.locator('> *').count(), name).toBeGreaterThan(1);
        // The silhouette is decorative; no description, no tag, no live component (the page showed two buttons on every card).
        await expect(card.locator('.pic'), name).toHaveAttribute('aria-hidden', 'true');
        await expect(card.locator('.tag, .ov-blurb, .ads-btn, .ads-input, .ads-select, .ads-switch, .ads-checkbox, .ads-radio, .ads-radio-group'), name).toHaveCount(0);
      }
    });

    test('a planned card is not a link: a grey dashed silhouette and its name', async ({ page }) => {
      await open(page, 'components/');
      for (const name of PLANNED) {
        const card = page.locator(`div.card.soon[data-component="${name}"]`);
        await expect(card.locator('.nm'), name).toHaveText(name);
        const picture = card.locator('svg.wire');
        await expect(picture, name).toBeVisible();
        await expect(picture, name).toHaveClass(/planned/);
        expect(await picture.locator('> *').count(), name).toBeGreaterThan(1);
        await expect(card.locator('a'), name).toHaveCount(0);
        await expect(card.locator('.go'), name).toHaveCount(0);
      }
    });

    test('the state is told to a screen reader only: the name of a link ends with Ready, a planned card says Planned', async ({ page }) => {
      await open(page, 'components/');
      for (const name of READY) await expect(page.getByRole('link', { name: `${name} Ready`, exact: true })).toHaveCount(1);
      for (const name of PLANNED) await expect(page.locator(`div.card.soon[data-component="${name}"] .sr`), name).toHaveText('Planned');
      // Not drawn: the words are clipped to a point.
      const box = await page.locator('a.card[data-component="Select"] .sr').evaluate((element) => element.getBoundingClientRect().width);
      expect(box).toBeLessThanOrEqual(1);
    });

    test('the whole card is the link: a press on its picture opens the page, and the page does not scroll sideways', async ({ page }) => {
      await open(page, 'components/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const picture = page.locator('a.card[data-component="Select"] .pic');
      await picture.scrollIntoViewIfNeeded();
      const box = (await picture.boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(page).toHaveURL(/\/components\/select\/$/);
    });

    test('the cards lie in a grid: two in a row on a phone, at least four on a wide screen, none cut off', async ({ page }) => {
      await open(page, 'components/');
      const perRow = await page.locator('h2#g-entry + .ov').evaluate((grid) => {
        const tops = [...grid.querySelectorAll('.card')].map((card) => Math.round(card.getBoundingClientRect().top));
        return tops.filter((top) => top === tops[0]).length;
      });
      if (viewport.width < 600) expect(perRow).toBe(2);
      else expect(perRow).toBeGreaterThanOrEqual(4);
      const cut = await page.locator('.ov .card').evaluateAll((cards) => cards.filter((card) => card.scrollWidth > card.clientWidth + 1).length);
      expect(cut).toBe(0);
    });
  });
}

for (const [size, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`the header is an ordinary block (${size})`, () => {
    test.use({ viewport });

    const bottomOfHeader = (page: Page) => page.locator('header.hdr').evaluate((header) => Math.round(header.getBoundingClientRect().bottom));

    test('it scrolls away with the page, bit by bit, and is back at the top', async ({ page }) => {
      await open(page, 'components/select/');
      const header = page.locator('header.hdr');
      expect(await header.evaluate((element) => getComputedStyle(element).position)).not.toMatch(/sticky|fixed/);
      const full = await bottomOfHeader(page);
      expect(full).toBeGreaterThan(40);
      // Part of the way: the header is cut by the top edge of the screen, as an ordinary block is.
      await page.evaluate(() => window.scrollTo(0, 30));
      await expect.poll(() => bottomOfHeader(page)).toBe(full - 30);
      // Far down: it is out of view.
      await page.evaluate(() => window.scrollTo(0, 900));
      await expect.poll(() => bottomOfHeader(page)).toBeLessThanOrEqual(0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => bottomOfHeader(page)).toBe(full);
    });

    test('a link to a heading lands near the top, with no room left for a header that is not there', async ({ page }) => {
      // Without the smooth scrolling of the page, which is still under way when the position is read.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, 'components/select/');
      const id = (await page.locator('.art h2[id]').nth(2).getAttribute('id')) ?? '';
      expect(id).not.toBe('');
      await page.evaluate((hash) => (location.hash = hash), id);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
      await page.waitForTimeout(300);
      const top = await page.locator(`.art h2[id="${id}"]`).evaluate((heading) => Math.round(heading.getBoundingClientRect().top));
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThan(48);
    });
  });
}

test.describe('the sidebar and the table of contents, with a header that scrolls away', () => {
  test.use({ viewport: VIEWPORTS.wide });

  test('they stay in view under the top edge once the header has gone, and still scroll inside', async ({ page }) => {
    await open(page, 'components/select/');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(250);
    const side = page.locator('aside.side, .side').first();
    const toc = page.locator('.toc').first();
    const sideBox = (await side.boundingBox())!;
    expect(sideBox.y).toBeGreaterThanOrEqual(0);
    expect(sideBox.y).toBeLessThan(40);
    // It fills the screen: nothing is left above it for a header, and nothing is cut at the bottom.
    expect(Math.round(sideBox.y + sideBox.height)).toBeLessThanOrEqual(VIEWPORTS.wide.height);
    expect(sideBox.height).toBeGreaterThan(VIEWPORTS.wide.height - 80);
    const tocBox = (await toc.boundingBox())!;
    expect(tocBox.y).toBeGreaterThanOrEqual(0);
    expect(tocBox.y).toBeLessThan(48);
    expect(Math.round(tocBox.y + tocBox.height)).toBeLessThanOrEqual(VIEWPORTS.wide.height);
  });
});

test.describe('home page', () => {
  test('the roadmap lists every ready component, and no alpha label is left', async ({ page }) => {
    await open(page, '');
    const now = page.locator('.road .card').first();
    await expect(now).toContainText('Button');
    await expect(now).toContainText('Grid');
    await expect(now).toContainText('Menu');
    await expect(now).toContainText('Input');
    await expect(now).toContainText('Checkbox');
    await expect(now).toContainText('Radio');
    await expect(now).toContainText('Switch');
    await expect(now).toContainText('Select');
    await expect(now).toContainText('Tooltip');
    await expect(now).toContainText('Message');
    // The ready components follow the order of the sidebar: Button, Grid, Menu, Input, Checkbox, Radio, Switch, Select, Tooltip, Message.
    await expect(now.locator('.chips').nth(1)).toContainText('gutter');
    await expect(now.locator('.chips').nth(2)).toContainText('selectedKeys');
    await expect(now.locator('.chips').nth(3)).toContainText('variant');
    await expect(now.locator('.chips').nth(4)).toContainText('classNames');
    await expect(now.locator('.chips').nth(5)).toContainText('orientation');
    await expect(now.locator('.chips').nth(6)).toContainText('classNames');
    await expect(now.locator('.chips').nth(7)).toContainText('showSearch');
    await expect(now.locator('.chips').nth(8)).toContainText('placement');
    await expect(now.locator('.chips').nth(9)).toContainText('stack');
    // A version number such as 0.1.0-alpha.2 is not a label; only the word on its own counts.
    await expect(page.locator('body')).not.toContainText(/alpha(?!\.\d)/i);
  });
});

test.describe('Button page', () => {
  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/button/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(demos.length);

    for (let i = 0; i < demos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library buttons, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre .ads-btn').first()).toBeVisible();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/button/${String(i + 1).padStart(2, '0')}-${demos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('the code toggle looks different when the code is shown: another glyph and a tinted background', async ({ page }) => {
    await open(page, 'components/button/');
    const demo = page.locator('section.demo').first();
    const toggle = demo.locator('.demo-act .icon-btn').first();
    const glyph = () => toggle.locator('svg path').evaluateAll((paths) => paths.map((path) => path.getAttribute('d')).join('|'));

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const closedGlyph = await glyph();
    // Not hovered or focused: the background of a closed toggle is plain.
    await page.mouse.move(0, 0);
    await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.locator('.demo-code')).toBeVisible();
    // The glyph changes (brackets with a slash), and the button stays tinted when the pointer leaves it.
    expect(await glyph()).not.toBe(closedGlyph);
    await page.mouse.move(0, 0);
    await expect(toggle).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(toggle).toHaveAccessibleName('Hide code');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(await glyph()).toBe(closedGlyph);
    await page.mouse.move(0, 0);
    await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(toggle).toHaveAccessibleName('Show code');
  });

  test('copy puts the source of the example on the clipboard', async ({ page, context, browserName }) => {
    // The permission names are Chromium's: Firefox and WebKit have nothing to grant and let a click write to the
    // clipboard. The page's own call is recorded in every engine (and passed on, so a refusal would show up as
    // "Copy failed"); Chromium also reads the real clipboard back.
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      const written: string[] = [];
      (window as unknown as { __written: string[] }).__written = written;
      const original = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (text: string) => {
        written.push(text);
        return original(text);
      };
    });
    await open(page, 'components/button/');
    const first = page.locator('section.demo').first();
    await first.getByRole('button', { name: 'Copy code' }).click();
    await expect(first.getByRole('status')).toHaveText('Copied');
    const written = await page.evaluate(() => (window as unknown as { __written: string[] }).__written);
    expect(written).toHaveLength(1);
    expect(written[0]).toContain("import { Button } from 'svelte-ant-design'");
    if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(written[0]);
  });

  test('copy: when the clipboard refuses, the page says so and does not announce a copy', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('refused'));
    });
    await open(page, 'components/button/');
    const first = page.locator('section.demo').first();
    await first.getByRole('button', { name: 'Copy code' }).click();
    await expect(first.getByRole('status')).toHaveText('Copy failed');
    await expect(first.getByRole('status')).not.toHaveText('Copied');
  });

  test('loading demo: the button keeps focus while it loads and is announced as busy', async ({ page }) => {
    await open(page, 'components/button/');
    const button = page.getByRole('button', { name: 'Click me' });
    await button.click();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).not.toHaveAttribute('aria-busy', 'true', { timeout: 4000 });
  });

  test('forms demo: the pressed button name and value reach the form, reset clears the result', async ({ page }) => {
    await open(page, 'components/button/');
    const demo = page.locator('section.demo').filter({ hasText: 'Forms and native attributes' });
    const result = demo.locator('.demo-pre [role="status"]');

    await demo.getByRole('button', { name: 'Save' }).click(); // the empty required field blocks the submit
    await expect(result).toHaveText('');
    await demo.getByRole('textbox', { name: 'Title' }).fill('Hello');
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(result).toHaveText('Submitted: save');
    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(result).toHaveText('');
    await expect(demo.getByRole('link', { name: 'Download' })).toHaveAttribute('download', 'hello.txt');
  });

  test('the API table lists the properties and the tokens table the design tokens', async ({ page }) => {
    await open(page, 'components/button/');
    const api = page.getByRole('table', { name: /API/ });
    await expect(api.getByRole('rowheader', { name: 'iconPlacement' })).toBeVisible();
    const tokens = page.getByRole('table', { name: /tokens/i });
    await expect(tokens.getByRole('rowheader', { name: '--ads-control-height', exact: true })).toBeVisible();
  });
});


test.describe('Switch page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/switch/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(switchDemos.length);

    for (let i = 0; i < switchDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library switches, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre button.ads-switch[role="switch"]').first()).toBeVisible();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/switch/${String(i + 1).padStart(2, '0')}-${switchDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('basic demo: a click and the keyboard toggle the switch and report the new value', async ({ page }) => {
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Basic');
    const toggle = demo.getByRole('switch', { name: 'Notifications' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('onchange(false)');
    await expect(demo).toContainText('Notifications are off');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('onchange(true)');
  });

  test('text demo: toggling a switch does not move anything around it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Text and icons');
    const layout = () =>
      demo.locator('.demo-pre > *').evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return [x + scrollX, y + scrollY, width, height].map((value) => Math.round(value * 100) / 100);
        })
      );
    const before = await layout();
    expect(before).toHaveLength(7);
    for (const name of ['Power', 'Power, off', 'Mood', 'Approved', 'Approved, off', 'Small power']) {
      const toggle = demo.getByRole('switch', { name, exact: true });
      const checked = await toggle.getAttribute('aria-checked');
      await toggle.click();
      await expect(toggle).not.toHaveAttribute('aria-checked', checked!);
      expect(await layout(), name).toEqual(before);
      await toggle.click();
      expect(await layout(), `${name} back`).toEqual(before);
    }
  });

  test('disabled demo: the switches cannot be used until they are enabled', async ({ page }) => {
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Disabled');
    await expect(demo.getByRole('switch', { name: 'Disabled and on' })).toBeDisabled();
    await demo.getByRole('button', { name: 'Toggle disabled' }).click();
    await expect(demo.getByRole('switch', { name: 'Disabled and on' })).toBeEnabled();
    await demo.getByRole('switch', { name: 'Disabled and off' }).click();
    await expect(demo.getByRole('switch', { name: 'Disabled and off' })).toHaveAttribute('aria-checked', 'true');
  });

  test('loading demo: the switch keeps focus while it loads and is announced as busy', async ({ page }) => {
    await open(page, 'components/switch/');
    const toggle = demoOf(page, 'Loading').getByRole('switch', { name: 'Auto-save' });
    await toggle.click();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-busy', 'true');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Space'); // ignored while loading
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(toggle).not.toHaveAttribute('aria-busy', 'true', { timeout: 4000 });
  });

  test('control demo: the parent refuses a change until the terms are accepted', async ({ page }) => {
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Control by the parent');
    const feature = demo.getByRole('switch', { name: 'Enable the feature' });
    const lock = demo.getByRole('switch', { name: 'Lock the setting' });

    await feature.click();
    await lock.click();
    await expect(feature).toHaveAttribute('aria-checked', 'false');
    await expect(lock).toHaveAttribute('aria-checked', 'false');
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('disabled, refused 1 times');

    await demo.getByRole('checkbox', { name: 'I accept the terms' }).check();
    await feature.click();
    await lock.click();
    await expect(feature).toHaveAttribute('aria-checked', 'true');
    await expect(lock).toHaveAttribute('aria-checked', 'true');
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('enabled, refused 1 times');
  });

  test('labels demo: a click on the label text toggles its switch', async ({ page }) => {
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Accessible name');
    const wifi = demo.getByRole('switch', { name: 'Wi-Fi' });
    await expect(wifi).toHaveAttribute('aria-checked', 'true');
    await demo.locator('label[for="wifi"]').click();
    await expect(wifi).toHaveAttribute('aria-checked', 'false');
    await expect(demo.getByRole('switch', { name: 'Bluetooth' })).toHaveAccessibleDescription('Needed for headphones');
  });

  test('the API table lists the properties, the methods table the methods and the tokens table the design tokens', async ({ page }) => {
    await open(page, 'components/switch/');
    await expect(page.getByRole('table', { name: /API/ }).getByRole('rowheader', { name: 'unCheckedChildren' })).toBeVisible();
    await expect(page.getByRole('table', { name: /Methods/ }).getByRole('rowheader', { name: 'focus' })).toBeVisible();
    await expect(page.getByRole('table', { name: /tokens/i }).getByRole('rowheader', { name: '--ads-switch-track-on', exact: true })).toBeVisible();
  });

  test('is listed in the components menu', async ({ page }) => {
    await open(page, 'components/');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: /^Switch/ })).toBeVisible();
  });
});

test.describe('Input page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  // The site styles native inputs in the examples of other components; that must not reach the library fields
  // (the field once showed a second border and padding inside its own box).
  for (const theme of ['light', 'dark'] as const) {
    test(`a field has exactly one border: the native control inside it has none (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await open(page, 'components/input/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const fields = await page.evaluate(() => {
        const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
        const bordered = (element: Element) => sides.some((side) => parseFloat(getComputedStyle(element)[`border${side}Width`]) > 0);
        return [...document.querySelectorAll('.demo-pre .ads-input-input, .demo-pre .ads-input-textarea')].map((control) => {
          const own = getComputedStyle(control);
          let borders = 0;
          for (let element: Element | null = control; element && !element.classList.contains('demo-pre'); element = element.parentElement) {
            if (bordered(element)) borders += 1;
          }
          return { borders, padding: own.paddingLeft, background: own.backgroundColor, control: control.className.toString() };
        });
      });
      expect(fields.length).toBeGreaterThan(30);
      for (const field of fields) {
        expect(field.borders, field.control).toBe(1);
        expect(field.background, field.control).toBe('rgba(0, 0, 0, 0)');
      }
    });
  }

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/input/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(inputDemos.length);

    for (let i = 0; i < inputDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library fields, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre .ads-input input, .demo-pre .ads-input textarea').first()).toBeVisible();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/input/${String(i + 1).padStart(2, '0')}-${inputDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('the API tables list the properties of the five components, the methods table the methods and the tokens table the design tokens', async ({ page }) => {
    await open(page, 'components/input/');
    await expect(page.getByRole('table', { name: 'API', exact: true }).getByRole('rowheader', { name: 'allowClear' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'InputTextArea API' }).getByRole('rowheader', { name: 'autoSize' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'InputPassword API' }).getByRole('rowheader', { name: 'visibilityToggle' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'InputSearch API' }).getByRole('rowheader', { name: 'enterButton' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'InputOTP API' }).getByRole('rowheader', { name: 'separator' })).toBeVisible();
    await expect(page.getByRole('table', { name: /Methods/ }).getByRole('rowheader', { name: 'focus' })).toBeVisible();
    await expect(page.getByRole('table', { name: /tokens/i }).getByRole('rowheader', { name: '--ads-input-border', exact: true })).toBeVisible();
  });

  test('is listed in the components menu', async ({ page }) => {
    await open(page, 'components/');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: /^Input/ })).toBeVisible();
  });

  test('basic demo: typing updates the bound text and onchange reports each edit', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Basic');
    const field = demo.getByRole('textbox', { name: 'Name' });
    const status = demo.locator('.demo-pre').getByRole('status');
    // Typed key by key: `fill()` in Firefox acts like the end of an IME composition, which ends with a
    // `compositionend` event before the `input` one (the text and the number of calls are the same).
    await field.pressSequentially('Ada');
    await expect(demo).toContainText('The name is "Ada"');
    await expect(status).toHaveText('onchange("Ada", input)');
  });

  test('clear demo: the button empties the field, keeps focus in it and calls onclear', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Clear button');
    const field = demo.getByRole('textbox', { name: 'Clearable', exact: true });
    await expect(field).toHaveValue('Clear me');
    await field.locator('xpath=..').getByRole('button', { name: 'Clear' }).click();
    await expect(field).toHaveValue('');
    await expect(field).toBeFocused();
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('onclear called 1 times');
  });

  test('count demo: the count follows the text and the browser stops it at maxlength', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Character count');
    const field = demo.getByRole('textbox', { name: 'Limited to 20' });
    await field.fill('x'.repeat(30));
    await expect(field).toHaveValue('x'.repeat(20));
    await expect(field.locator('xpath=..').locator('.ads-input-count')).toHaveText('20 / 20');
  });

  test('controlled demo: a refused edit puts the text back, Enter is reported', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Controlled input and Enter');
    const digits = demo.getByRole('textbox', { name: 'Digits only' });
    await digits.pressSequentially('12a3');
    await expect(digits).toHaveValue('123');
    const enter = demo.getByRole('textbox', { name: 'Press Enter' });
    await enter.fill('hello');
    await enter.press('Enter');
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('Entered: hello');
  });

  test('password demo: the toggle shows the text and the controlled field follows its state', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Password');
    const field = demo.getByLabel('Password', { exact: true });
    await expect(field).toHaveAttribute('type', 'password');
    await field.locator('xpath=..').getByRole('button', { name: 'Show password' }).click();
    await expect(field).toHaveAttribute('type', 'text');
    await expect(demo.locator('.demo-pre').getByRole('status')).toContainText('toggled 1 times');
    const controlled = demo.getByLabel('Controlled password');
    await controlled.locator('xpath=..').getByRole('button', { name: 'Show password' }).click();
    await expect(controlled).toHaveAttribute('type', 'text');
    await expect(demo.locator('.demo-pre').getByRole('status')).toContainText('The password is shown');
  });

  test('search demo: Enter reports the text and the source; the spinner ignores a second search', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Search');
    const field = demo.getByRole('searchbox', { name: 'Search', exact: true });
    const status = demo.locator('.demo-pre').getByRole('status').first();
    const spinner = field.locator('xpath=..').locator('.ads-input-icon-loading');
    await field.fill('cats');
    // The demo "searches" for 1.5 seconds. Both Enter presses go in one round trip, so the second one lands inside
    // that time in every engine (WebKit needs about 300 ms per command and the test used to miss the window).
    const spinnerShown = await field.evaluate(async (element) => {
      const input = element as HTMLInputElement;
      const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
      const enter = () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
      enter();
      await frame();
      const shown = input.parentElement!.querySelector('.ads-input-icon-loading') !== null;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'dogs');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await frame();
      enter();
      return shown;
    });
    expect(spinnerShown).toBe(true);
    await expect(status).toHaveText('onsearch("cats", source: input)');
    await expect(spinner).toBeHidden({ timeout: 4000 });
    await expect(status).toHaveText('onsearch("cats", source: input)');
  });

  test('one-time code demo: typing fills the cells and onchange reports the whole code', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'One-time code');
    const group = demo.getByRole('group', { name: 'Verification code' });
    await group.getByRole('textbox').first().click();
    await page.keyboard.type('123456');
    await expect(demo).toContainText('The code is "123456"');
    await expect(demo.locator('.demo-pre').getByRole('status')).toContainText('onchange (all filled): "123456"');
  });

  test('autosize demo: the field grows with the text', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Auto size');
    const field = demo.getByRole('textbox', { name: 'Grows with the text' });
    const before = (await field.boundingBox())!.height;
    await field.fill('1\n2\n3\n4\n5\n6');
    await expect.poll(async () => (await field.boundingBox())!.height).toBeGreaterThan(before + 40);
  });

  test('native demo: a form submits the text of its fields and reset clears them', async ({ page }) => {
    await open(page, 'components/input/');
    const demo = demoOf(page, 'Forms and native attributes');
    await demo.getByRole('textbox', { name: 'Email' }).fill('ada@example.com');
    await demo.getByLabel('New password').fill('secret');
    await demo.getByRole('textbox', { name: 'About you' }).fill('Hello');
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText(
      'Submitted: [["email","ada@example.com"],["password","secret"],["about","Hello"],["age",""]]'
    );
    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(demo.getByRole('textbox', { name: 'Email' })).toHaveValue('');
    await expect(demo.getByRole('textbox', { name: 'About you' })).toHaveValue('');
  });
});

test.describe('Select page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  const panel = (page: Page) => page.locator('.ads-popup:not([hidden])').last();

  // The site styles native inputs in the examples of other components; that must not reach the search field of a Select.
  for (const theme of ['light', 'dark'] as const) {
    test(`the search input of a Select has no border, padding or background of its own (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await open(page, 'components/select/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const inputs = await page.evaluate(() =>
        [...document.querySelectorAll('.demo-pre input.ads-select-input')].map((control) => {
          const own = getComputedStyle(control);
          return { border: own.borderTopWidth, padding: own.paddingLeft, background: own.backgroundColor };
        })
      );
      expect(inputs.length).toBeGreaterThan(5);
      for (const input of inputs) expect(input).toEqual({ border: '0px', padding: '0px', background: 'rgba(0, 0, 0, 0)' });
    });
  }

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/select/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(selectDemos.length);

    for (let i = 0; i < selectDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library fields, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre .ads-select [role=combobox]').first()).toBeAttached();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/select/${String(i + 1).padStart(2, '0')}-${selectDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('the API tables list the properties of Select, SelectOption and SelectOptGroup, the methods table the methods and the tokens table the design tokens', async ({ page }) => {
    await open(page, 'components/select/');
    await expect(page.getByRole('table', { name: 'API', exact: true }).getByRole('rowheader', { name: 'popupMatchSelectWidth' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'SelectOption API' }).getByRole('rowheader', { name: 'value' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'SelectOptGroup API' }).getByRole('rowheader', { name: 'label' })).toBeVisible();
    await expect(page.getByRole('table', { name: /Methods/ }).getByRole('rowheader', { name: 'focus' })).toBeVisible();
    await expect(page.getByRole('table', { name: /tokens/i }).getByRole('rowheader', { name: '--ads-select-option-height', exact: true })).toBeVisible();
  });

  test('is listed in the components menu', async ({ page }) => {
    await open(page, 'components/');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: /^Select/ })).toBeVisible();
  });

  test('the basic example: opening, choosing an option and the callback', async ({ page }) => {
    await open(page, 'components/select/');
    const demo = demoOf(page, 'Basic');
    await demo.getByRole('combobox', { name: 'City' }).click();
    await expect(panel(page)).toBeVisible();
    await panel(page).getByRole('option', { name: 'Tashkent' }).click();
    await expect(demo.getByRole('combobox', { name: 'City' })).toContainText('Tashkent');
    await expect(demo.locator('.demo-pre [role=status]')).toHaveText('onchange("tashkent", {"value":"tashkent","label":"Tashkent"})');
  });

  test('the search example filters the list and reports the number of matches', async ({ page }) => {
    await open(page, 'components/select/');
    const demo = demoOf(page, 'Search');
    const field = demo.getByRole('combobox', { name: 'Person' });
    await field.click();
    await page.keyboard.type('comp');
    await expect(panel(page).getByRole('option')).toHaveCount(2);
    await expect(panel(page).locator('.ads-select-sr')).toHaveText('2 found');
    await page.keyboard.press('Enter');
    await expect(field).toHaveValue('');
    await expect(demo.locator('.demo-pre [role=status]')).toHaveText('onsearch("")');
  });

  test('the panel is not cut off by the example around it, and the field keeps its size while it is open', async ({ page }) => {
    await open(page, 'components/select/');
    const field = demoOf(page, 'Basic').getByRole('combobox', { name: 'City' });
    const root = field.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ads-select ")][1]');
    const before = await root.boundingBox();
    await field.click();
    await expect(panel(page)).toBeVisible();
    const panelBox = await panel(page).boundingBox();
    expect(await root.boundingBox()).toEqual(before);
    // The panel is a child of the body, so the overflow of the example does not clip it.
    expect(await panel(page).evaluate((element) => element.parentElement === document.body)).toBe(true);
    expect(panelBox!.height).toBeGreaterThan(100);
  });

  test('the custom content example: a press in the footer of the list keeps the list open and the focus in the field', async ({ page }) => {
    await open(page, 'components/select/');
    const demo = demoOf(page, 'Custom content');
    const field = demo.getByRole('combobox', { name: 'With a footer' });
    await field.click();
    await panel(page).getByRole('button', { name: /Add a person/ }).click();
    await expect(panel(page).getByRole('button', { name: 'Add a person (1)' })).toBeVisible();
    expect(await field.evaluate((element) => element === document.activeElement)).toBe(true);
  });

  test('the markup example: an inserted option appears in its place and the group can be reversed', async ({ page }) => {
    await open(page, 'components/select/');
    const demo = demoOf(page, 'Options as children');
    await demo.getByRole('button', { name: 'Insert an option' }).click();
    await demo.getByRole('button', { name: 'Reverse the group' }).click();
    await demo.getByRole('combobox', { name: 'Options as markup' }).click();
    const texts = (await panel(page).getByRole('option').allTextContents()).map((text) => text.trim());
    expect(texts.slice(0, 5)).toEqual(['Option A', 'Inserted in the middle', 'Option D', 'Option C', 'Option B']);
  });
});

test.describe('Checkbox page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/checkbox/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(checkboxDemos.length);

    for (let i = 0; i < checkboxDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library checkboxes, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre label.ads-checkbox').first()).toBeVisible();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/checkbox/${String(i + 1).padStart(2, '0')}-${checkboxDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('basic demo: a click, a click on the text and the keyboard toggle the checkbox and report the new value', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Basic');
    const box = demo.getByRole('checkbox', { name: 'Remember me' });
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(box).toBeChecked();
    await box.click();
    await expect(box).not.toBeChecked();
    await expect(status).toHaveText('onchange(false)');
    await expect(demo).toContainText('The box is unchecked');
    await demo.locator('.ads-checkbox-label').click();
    await expect(box).toBeChecked();
    await page.keyboard.press('Space');
    await expect(box).not.toBeChecked();
    await expect(status).toHaveText('onchange(false)');
  });

  test('disabled demo: the checkboxes cannot be used until they are enabled', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Disabled');
    const named = (name: string) => demo.getByRole('checkbox', { name, exact: true });
    await expect(named('Checked')).toBeDisabled();
    await expect(named('Checked')).toBeChecked();
    await demo.getByRole('button', { name: 'Toggle disabled' }).click();
    await expect(named('Checked')).toBeEnabled();
    await named('Unchecked').click();
    await expect(named('Unchecked')).toBeChecked();
    expect(await named('Indeterminate').ariaSnapshot()).toContain('[checked=mixed]');
  });

  test('control demo: the parent refuses a change until the terms are accepted, and the box goes back', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Control by the parent');
    const feature = demo.getByRole('checkbox', { name: 'Enable the feature' });
    const lock = demo.getByRole('checkbox', { name: 'Lock the setting' });

    await feature.click();
    await lock.click();
    await expect(feature).not.toBeChecked();
    await expect(lock).not.toBeChecked();
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('disabled, refused 1 times');

    await demo.getByRole('checkbox', { name: 'I accept the terms' }).check();
    await feature.click();
    await lock.click();
    await expect(feature).toBeChecked();
    await expect(lock).toBeChecked();
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('enabled, refused 1 times');
  });

  test('check all demo: the first control is indeterminate, checks everything, then clears everything', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Check all');
    const all = demo.getByRole('checkbox', { name: 'Check all' });
    const status = demo.locator('.demo-pre').getByRole('status');
    expect(await all.ariaSnapshot()).toContain('[checked=mixed]');
    await expect(status).toHaveText('Selected: Apple');
    await all.click();
    await expect(status).toHaveText('Selected: Apple, Pear, Orange');
    await expect(all).toBeChecked();
    await demo.getByRole('checkbox', { name: 'Pear' }).click();
    await expect(status).toHaveText('Selected: Apple, Orange');
    expect(await all.ariaSnapshot()).toContain('[checked=mixed]');
    await all.click();
    await all.click();
    await expect(status).toHaveText('Selected: nothing');
    await expect(all).not.toBeChecked();
  });

  test('group demo: a click toggles an option, the group reports the array and a disabled option stays off', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Checkbox group');
    const fruits = demo.getByRole('group', { name: 'Fruits', exact: true });
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(fruits.getByRole('checkbox', { name: 'Apple' })).toBeChecked();
    await fruits.getByRole('checkbox', { name: 'Orange' }).click();
    await expect(status).toHaveText('onchange([Apple, Orange])');
    await fruits.getByRole('checkbox', { name: 'Pear' }).click();
    await expect(status).toHaveText('onchange([Apple, Pear, Orange])');

    const extras = demo.getByRole('group', { name: 'Extras' });
    await expect(extras.getByRole('checkbox', { name: 'Plum' })).toBeDisabled();
    await extras.getByRole('checkbox', { name: 'Pear' }).click();
    await expect(status).toHaveText('pear: true');
    await expect(extras.locator('label[title="Juicy"]')).toHaveCount(1);
    for (const input of await demo.getByRole('group', { name: 'Disabled fruits' }).getByRole('checkbox').all()) {
      await expect(input).toBeDisabled();
    }
  });

  test('layout demo: checkboxes in a grid share the group state', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Custom layout');
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(status).toHaveText('Selected: mon, wed');
    await demo.getByRole('checkbox', { name: 'Tuesday' }).click();
    await expect(status).toHaveText('Selected: mon, tue, wed');
    await expect(demo.getByRole('checkbox', { name: 'Friday (closed)' })).toBeDisabled();
  });

  test('labels demo: a click on the label text or on an external label toggles the checkbox', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Accessible name');
    const sound = demo.getByRole('checkbox', { name: 'Sound' });
    await expect(sound).toBeChecked();
    await demo.locator('label[for="sound"]').click();
    await expect(sound).not.toBeChecked();
    await demo.locator('.demo-pre').getByText('Wi-Fi', { exact: true }).click();
    await expect(demo.getByRole('checkbox', { name: 'Wi-Fi' })).toBeChecked();
    await expect(demo.getByRole('checkbox', { name: 'Bluetooth' })).toHaveAccessibleDescription('Needed for headphones');
  });

  test('forms demo: the required box blocks the submit, only the checked ones are sent, reset clears the state', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Forms and native attributes');
    const result = demo.locator('.demo-pre').getByRole('status');
    const terms = demo.getByRole('checkbox', { name: 'I accept the terms' });

    await demo.getByRole('button', { name: 'Save' }).click(); // the unchecked required box blocks the submit
    await expect(result).toHaveText('');
    await terms.check();
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(result).toHaveText('Submitted: [["terms","accepted"]]');
    await demo.getByRole('checkbox', { name: 'news' }).check();
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(result).toHaveText('Submitted: [["terms","accepted"],["topic","news"]]');

    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(result).toHaveText('');
    await expect(terms).not.toBeChecked();
    await expect(demo.getByRole('checkbox', { name: 'news' })).not.toBeChecked();
    // The state and the view still agree after a reset: one click checks the box again.
    await terms.click();
    await expect(terms).toBeChecked();
  });

  test('the API tables list the properties of both components, the methods table the methods and the tokens table the design tokens', async ({ page }) => {
    await open(page, 'components/checkbox/');
    await expect(page.getByRole('table', { name: 'API', exact: true }).getByRole('rowheader', { name: 'indeterminate' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'CheckboxGroup API' }).getByRole('rowheader', { name: 'options' })).toBeVisible();
    await expect(page.getByRole('table', { name: /Methods/ }).getByRole('rowheader', { name: 'focus' })).toBeVisible();
    await expect(page.getByRole('table', { name: /tokens/i }).getByRole('rowheader', { name: '--ads-checkbox-checked-bg', exact: true })).toBeVisible();
  });

  test('is listed in the components menu', async ({ page }) => {
    await open(page, 'components/');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: /^Checkbox/ })).toBeVisible();
  });
});

test.describe('Radio page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/radio/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(radioDemos.length);

    for (let i = 0; i < radioDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library radios, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre label.ads-radio, .demo-pre label.ads-radio-button').first()).toBeVisible();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/radio/${String(i + 1).padStart(2, '0')}-${radioDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('basic demo: a click and a click on the text select the radio and report true, and a second click calls nothing', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Basic');
    const radio = demo.getByRole('radio', { name: 'Send me the newsletter' });
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(radio).not.toBeChecked();
    await expect(status).toHaveText('no change yet');
    await radio.click();
    await expect(radio).toBeChecked();
    await expect(status).toHaveText('onchange(true)');
    await expect(demo).toContainText('The radio is selected');
    await demo.locator('.ads-radio-label').click();
    await expect(radio).toBeChecked();
    await expect(status).toHaveText('onchange(true)');
  });

  test('disabled demo: the radios cannot be used until they are enabled', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Disabled');
    const named = (name: string) => demo.getByRole('radio', { name, exact: true });
    await expect(named('Not selected')).toBeDisabled();
    await expect(named('Selected')).toBeChecked();
    await expect(named('Pear (out of stock)')).toBeDisabled();
    await expect(named('Orange')).toBeEnabled();
    await demo.getByRole('button', { name: 'Enable' }).click();
    await expect(named('Not selected')).toBeEnabled();
    await named('Not selected').click();
    await expect(named('Not selected')).toBeChecked();
  });

  test('group demo: a click selects one radio and moves the selection; the arrow keys move and select', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Radio group');
    const group = demo.getByRole('radiogroup', { name: 'Fruit' });
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(group.getByRole('radio', { name: 'Apple' })).toBeChecked();
    await group.getByRole('radio', { name: 'Pear' }).click();
    await expect(group.getByRole('radio', { name: 'Pear' })).toBeChecked();
    await expect(group.getByRole('radio', { name: 'Apple' })).not.toBeChecked();
    await expect(status).toHaveText('onchange(Pear)');
    await expect(demo).toContainText('The value is Pear');
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: 'Orange' })).toBeChecked();
    await expect(group.getByRole('radio', { name: 'Orange' })).toBeFocused();
    // Up from the last radio, with no wrap around: the ends of a group are the platform's, and WebKit stops there.
    await page.keyboard.press('ArrowUp');
    await expect(group.getByRole('radio', { name: 'Pear' })).toBeChecked();
    await expect(status).toHaveText('onchange(Pear)');
  });

  test('options demo: a boolean value stays a boolean and the option onchange runs', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Options');
    await expect(demo.getByRole('radio', { name: 'No' })).toBeChecked();
    await demo.getByRole('radio', { name: 'Yes' }).click();
    await expect(demo.getByRole('radio', { name: 'Yes' })).toBeChecked();
    await expect(demo.getByRole('radio', { name: 'Plum' })).toBeDisabled();
    const extras = demo.getByRole('radiogroup', { name: 'Extras' });
    await extras.getByRole('radio', { name: 'Pear' }).click();
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('pear: true');
    await expect(extras.getByRole('radio', { name: 'Pear' })).toHaveAttribute('required', '');
  });

  test('button demo: a click selects a button, a disabled one stays off, and the solid group fills the checked button', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Radio button');
    const outline = demo.getByRole('radiogroup', { name: 'City', exact: true });
    await expect(outline.getByRole('radio', { name: 'Hangzhou' })).toBeChecked();
    await outline.getByRole('radio', { name: 'Shanghai' }).click();
    await expect(outline.getByRole('radio', { name: 'Shanghai' })).toBeChecked();
    await expect(outline.getByRole('radio', { name: 'Beijing' })).toBeDisabled();
    // The groups do not share a value: the solid group keeps its own selection (Shanghai), drawn with a fill.
    const solid = demo.getByRole('radiogroup', { name: 'City, solid' });
    await expect(solid.getByRole('radio', { name: 'Shanghai' })).toBeChecked();
    await solid.getByRole('radio', { name: 'Chengdu' }).click({ force: true });
    await expect(solid.getByRole('radio', { name: 'Chengdu' })).toBeChecked();
    await expect(outline.getByRole('radio', { name: 'Shanghai' })).toBeChecked();
    // The fill changes over 0.2 s after the click, and the first frame still has the old color (white in WebKit): wait for the final
    // color instead of reading it once.
    const checked = solid.locator('label.ads-radio-button-checked');
    await expect(checked).toHaveCount(1);
    await expect(checked).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(checked).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('size demo: the buttons are 40, 32 and 24 px high, and the aliases are the medium size', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Size');
    const height = async (name: string) => (await demo.getByRole('radiogroup', { name, exact: true }).locator('label').first().boundingBox())!.height;
    expect(await height('Large')).toBe(40);
    expect(await height('Medium')).toBe(32);
    expect(await height('Small')).toBe(24);
    expect(await height('Default (medium)')).toBe(32);
    // Each group has its own selection: choosing in one leaves the others alone.
    await demo.getByRole('radiogroup', { name: 'Large', exact: true }).getByRole('radio', { name: 'Beijing' }).click({ force: true });
    await expect(demo.getByRole('radiogroup', { name: 'Large', exact: true }).getByRole('radio', { name: 'Beijing' })).toBeChecked();
    await expect(demo.getByRole('radiogroup', { name: 'Medium', exact: true }).getByRole('radio', { name: 'Hangzhou' })).toBeChecked();
    await expect(demo.getByRole('radiogroup', { name: 'Small', exact: true }).getByRole('radio', { name: 'Hangzhou' })).toBeChecked();
  });

  test('layout demo: the vertical groups stack their items, block fills the width, and the grid shares one group', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Layout');
    const vertical = demo.getByRole('radiogroup', { name: 'Vertical', exact: true }).locator('label');
    const [first, second] = [await vertical.nth(0).boundingBox(), await vertical.nth(1).boundingBox()];
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 1);
    expect(Math.abs(second!.x - first!.x)).toBeLessThan(1);
    const shorthand = demo.getByRole('radiogroup', { name: 'Vertical buttons' }).locator('label');
    expect((await shorthand.nth(1).boundingBox())!.y).toBeGreaterThan((await shorthand.nth(0).boundingBox())!.y + 20);
    const block = demo.getByRole('radiogroup', { name: 'Block' });
    const [group, parent] = [await block.boundingBox(), await demo.locator('.demo-pre').boundingBox()];
    expect(group!.width).toBeGreaterThan(parent!.width - 60);
    await demo.getByRole('radio', { name: 'Bottom right' }).click();
    await expect(demo.getByRole('radio', { name: 'Bottom right' })).toBeChecked();
    await expect(demo.getByRole('radio', { name: 'Top left' })).not.toBeChecked();
  });

  test('controlled demo: the parent refuses a choice and the previous radio is put back; the plan can be cleared', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Controlled');
    const plan = demo.getByRole('radiogroup', { name: 'Plan' });
    const status = demo.locator('.demo-pre').getByRole('status');
    await expect(plan.getByRole('radio', { name: 'Free' })).toBeChecked();
    await plan.getByRole('radio', { name: 'Team (needs the terms)' }).click();
    await expect(plan.getByRole('radio', { name: 'Free' })).toBeChecked();
    await expect(plan.getByRole('radio', { name: 'Team (needs the terms)' })).not.toBeChecked();
    await expect(status).toHaveText('Plan: free, refused 1 times');
    await demo.getByRole('radio', { name: 'I accept the terms' }).check();
    await plan.getByRole('radio', { name: 'Team (needs the terms)' }).click();
    await expect(plan.getByRole('radio', { name: 'Team (needs the terms)' })).toBeChecked();
    await expect(status).toHaveText('Plan: team, refused 1 times');
    await demo.getByRole('button', { name: 'Clear the plan' }).click();
    await expect(plan.getByRole('radio', { name: 'Free' })).not.toBeChecked();
    await expect(plan.getByRole('radio', { name: 'Team (needs the terms)' })).not.toBeChecked();
    await expect(status).toHaveText('Plan: none, refused 1 times');
  });

  test('labels demo: every way of naming a radio and a group works', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Names and labels');
    for (const name of ['Visible text', 'Hidden label', 'Named by a heading', 'External label', 'Wi-Fi']) {
      await expect(demo.getByRole('radio', { name, exact: true }), name).toBeVisible();
    }
    await demo.locator('.demo-pre').getByText('External label').click();
    await expect(demo.getByRole('radio', { name: 'External label' })).toBeChecked();
    await expect(demo.getByRole('radiogroup', { name: 'Pick a colour' })).toBeVisible();
  });

  test('native demo: the named group and the radio are submitted, the unnamed group is not, and reset clears the state', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Forms and native attributes');
    const status = demo.locator('.demo-pre').getByRole('status');
    await demo.getByRole('radio', { name: 'M', exact: true }).click();
    await demo.getByRole('radio', { name: 'Gift wrap' }).check();
    await demo.getByRole('radio', { name: 'b', exact: true }).click();
    await demo.getByRole('button', { name: 'Save' }).click();
    await expect(status).toHaveText('Submitted: [["size","M"],["gift","yes"]]');
    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(status).toHaveText('');
    await expect(demo.getByRole('radio', { name: 'M', exact: true })).not.toBeChecked();
    await expect(demo.getByRole('radio', { name: 'Gift wrap' })).not.toBeChecked();
  });

  test('keyboard demo: a group is one Tab stop on the selected radio, and two groups never trade focus', async ({ page }) => {
    await open(page, 'components/radio/');
    const demo = demoOf(page, 'Keyboard');
    const first = demo.getByRole('radiogroup', { name: 'First group' });
    const second = demo.getByRole('radiogroup', { name: 'Second group' });
    await demo.getByLabel('Before the groups').focus();
    await page.keyboard.press('Tab');
    await expect(first.getByRole('radio', { name: 'Apple' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(first.getByRole('radio', { name: 'Pear' })).toBeChecked();
    // The single Tab stop: the next Tab leaves the first group (nothing is checked in the second, so its first radio gets it).
    await page.keyboard.press('Tab');
    await expect(second.getByRole('radio', { name: 'Red' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(second.getByRole('radio', { name: 'Green' })).toBeChecked();
    await expect(first.getByRole('radio', { name: 'Pear' })).toBeChecked();
    // Back into the first group with Shift+Tab: the focus lands on the checked radio, not on the first.
    await page.keyboard.press('Shift+Tab');
    await expect(first.getByRole('radio', { name: 'Pear' })).toBeFocused();
  });
});

test.describe('Tooltip page', () => {
  // The tip scales up when it opens (0.8 to 1 in 0.2 s). A rectangle read in the first frames is a rectangle of the scaled tip:
  // on the slow runner of CI the placement test read 11.2 px for an arrow that is 14 px from the edge. No animation, no such frame.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    test.slow();
    await open(page, 'components/tooltip/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(tooltipDemos.length);

    for (let i = 0; i < tooltipDemos.length; i++) {
      const demo = examples.nth(i);
      await expect(demo.locator('.demo-pre .ads-tooltip-trigger').first()).toBeAttached();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/tooltip/${String(i + 1).padStart(2, '0')}-${tooltipDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('placement demo: the buttons stand in a ring, and each tip is on the side its name says and covers no other button', async ({ page }) => {
    test.slow();
    await open(page, 'components/tooltip/');
    const demo = demoOf(page, 'Placement').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const cases = [
      ['TL', 'topLeft'], ['Top', 'top'], ['TR', 'topRight'],
      ['LT', 'leftTop'], ['Left', 'left'], ['LB', 'leftBottom'],
      ['RT', 'rightTop'], ['Right', 'right'], ['RB', 'rightBottom'],
      ['BL', 'bottomLeft'], ['Bottom', 'bottom'], ['BR', 'bottomRight']
    ] as const;

    // The ring: a row on top, a column on each side, a row at the bottom, and nothing in the middle.
    const at = async (label: string) => {
      const box = await demo.getByRole('button', { name: label, exact: true }).boundingBox();
      return { x: box!.x, y: box!.y, right: box!.x + box!.width, bottom: box!.y + box!.height };
    };
    const [tl, top, tr, lt, left, lb, rt, right, rb, bl, bottom, br] = await Promise.all(cases.map(([label]) => at(label)));
    for (const row of [[tl, top, tr], [bl, bottom, br]]) expect(new Set(row.map((box) => Math.round(box.y))).size).toBe(1);
    expect(top.y).toBeLessThan(left.y);
    expect(bottom.y).toBeGreaterThan(left.y);
    // The left column is flush with its left edge, the right one with its right edge.
    expect(new Set([lt, left, lb].map((box) => Math.round(box.x))).size).toBe(1);
    expect(new Set([rt, right, rb].map((box) => Math.round(box.right))).size).toBe(1);
    for (const column of [[lt, left, lb], [rt, right, rb]]) {
      expect(column[0].y).toBeLessThan(column[1].y);
      expect(column[1].y).toBeLessThan(column[2].y);
    }
    expect(left.right).toBeLessThan(top.x);
    expect(right.x).toBeGreaterThan(top.right);

    for (const [label, placement] of cases) {
      await page.mouse.move(2, 2);
      const button = demo.getByRole('button', { name: label, exact: true });
      await button.hover();
      // The tip that belongs to this button: the one its aria-describedby points at (the tip of the last button may still
      // be leaving).
      await expect(button, placement).toHaveAttribute('aria-describedby', /ads-tooltip-/);
      await expect(page.locator(`[id="${(await button.getAttribute('aria-describedby'))!.split(' ').pop()}"]`)).toHaveText(placement);
      const result = await button.evaluate((element) => {
        const frame = document.getElementById((element.getAttribute('aria-describedby') ?? '').split(' ').pop()!)!;
        const t = frame.getBoundingClientRect();
        const covered = [...element.closest('.demo-pre')!.querySelectorAll('button')]
          .filter((other) => other !== element)
          .filter((other) => {
            const r = other.getBoundingClientRect();
            return !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom);
          })
          .map((other) => other.textContent!.trim());
        const arrow = frame.querySelector('.ads-popup-arrow')!.getBoundingClientRect();
        const box = frame.querySelector('.ads-tooltip')!.getBoundingClientRect();
        // Where the arrow is along the edge it stands on, from the start of that edge (left, or top).
        const along = frame.dataset.side === 'left' || frame.dataset.side === 'right' ? arrow.y - box.y : arrow.x - box.x;
        const length = frame.dataset.side === 'left' || frame.dataset.side === 'right' ? box.height : box.width;
        return { placement: frame.dataset.placement, covered, inside: t.left >= 0 && t.right <= innerWidth && t.top >= 0, along, length };
      });
      expect(result.placement, `${label}: the placement used`).toBe(placement);
      expect(result.covered, `${label}: the buttons its tip covers`).toEqual([]);
      expect(result.inside, `${label}: inside the window`).toBe(true);
      // The arrow of an aligned placement is at its end of the edge, as far from it as the corner is round (6 px) and 8 px
      // more above or below the button, 7 px more beside it: the middle of the arrow is 14 or 13 px from that end.
      const side = ['top', 'bottom', 'left', 'right'].find((name) => placement.startsWith(name))!;
      const aligned = placement.slice(side.length);
      const edge = side === 'left' || side === 'right' ? 13 : 14;
      // The width of a tip is a fraction of a pixel and the placement reads it as a whole number: a pixel of slack.
      const wanted = aligned === '' ? result.length / 2 : aligned === 'Top' || aligned === 'Left' ? edge : result.length - edge;
      expect(Math.abs(result.along - wanted), `${label}: the arrow is ${result.along}px along a tip of ${result.length}px, expected ${wanted}`).toBeLessThanOrEqual(1.5);
    }
  });

  test('color demo: the preset tips keep their text readable and the arrow has the color of the box', async ({ page }) => {
    await open(page, 'components/tooltip/');
    const demo = demoOf(page, 'Colors').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    for (const name of ['yellow', 'blue', 'purple']) {
      await page.mouse.move(2, 2);
      await demo.getByRole('button', { name, exact: true }).hover();
      const tip = page.locator('.ads-popup:not([hidden]) .ads-tooltip').filter({ hasText: `${name} tip` });
      await expect(tip).toHaveCount(1);
      const painted = await tip.evaluate((box) => {
        const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
        const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const style = getComputedStyle(box);
        const arrow = getComputedStyle(box.closest('.ads-popup-frame')!.querySelector('.ads-popup-arrow > span')!);
        const [a, b] = [lum(rgb(style.color)), lum(rgb(style.backgroundColor))].sort((x, y) => y - x);
        return { ratio: (a + 0.05) / (b + 0.05), same: arrow.backgroundColor === style.backgroundColor };
      });
      expect(painted.ratio, `${name} contrast`).toBeGreaterThanOrEqual(4.5);
      expect(painted.same, `${name} arrow`).toBe(true);
    }
  });
});

test.describe('Grid page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  /** The width of the first column of the first Row of a demo, in 24ths of its Row. */
  const firstSpan = (demo: ReturnType<typeof demoOf>) =>
    demo.locator('.demo-pre .ads-row').first().evaluate((row) => {
      const column = row.querySelector(':scope > .ads-col')!.getBoundingClientRect().width;
      return Math.round((column / row.getBoundingClientRect().width) * 24 * 100) / 100;
    });

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/grid/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(gridDemos.length);

    for (let i = 0; i < gridDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library rows, not copies drawn with the same classes.
      await expect(demo.locator('.demo-pre .ads-row').first()).toBeVisible();
      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/grid/${String(i + 1).padStart(2, '0')}-${gridDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('every caption stands above the component it names, inside its own unit', async ({ page }) => {
    await open(page, 'components/grid/');
    const misplaced = await page.locator('.demo-pre .field').evaluateAll((fields) =>
      fields.filter((field) => field.querySelector(':scope > .caption') && field.firstElementChild?.className !== 'caption' && !field.firstElementChild?.classList.contains('caption')).length
    );
    expect(misplaced).toBe(0);
  });

  test('the gutter demo: a Row is as wide as its parent, and the page does not scroll sideways', async ({ page }) => {
    await open(page, 'components/grid/');
    const demo = demoOf(page, 'Gutter');
    const rows = await demo.locator('.demo-pre .ads-row').evaluateAll((all) =>
      all.map((row) => ({ row: row.getBoundingClientRect().width, parent: row.parentElement!.getBoundingClientRect().width }))
    );
    expect(rows).toHaveLength(4);
    for (const { row, parent } of rows) expect(row).toBeCloseTo(parent, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('no example makes the page scroll sideways', async ({ page }) => {
      await open(page, 'components/grid/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });

    test('the responsive demo is at its xs values, and the hidden column is hidden', async ({ page }) => {
      await open(page, 'components/grid/');
      expect(await firstSpan(demoOf(page, 'Responsive'))).toBeCloseTo(2, 1);
      const hidden = demoOf(page, 'Hide a column').locator('.demo-pre .ads-col').first();
      await expect(hidden).toHaveCSS('display', 'none');
    });
  });

  test.describe('on a laptop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('the responsive demo is at its xl values, and the hidden column shows', async ({ page }) => {
      await open(page, 'components/grid/');
      expect(await firstSpan(demoOf(page, 'Responsive'))).toBeCloseTo(10, 1);
      await expect(demoOf(page, 'Hide a column').locator('.demo-pre .ads-col').first()).toHaveCSS('display', 'block');
    });
  });

  test('the responsive values follow a resize, at the boundary pixel', async ({ page }) => {
    await open(page, 'components/grid/');
    const demo = demoOf(page, 'Responsive');
    for (const [width, span] of [[575, 2], [576, 4], [767, 4], [768, 6], [991, 6], [992, 8], [1199, 8], [1200, 10], [1599, 10], [1600, 11], [1919, 11], [1920, 12]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => firstSpan(demo), { message: `at ${width}px` }).toBeCloseTo(span, 1);
    }
  });

  test('breakpoints demo: the helper names the breakpoint of the screen, on the first render and after a resize', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await open(page, 'components/grid/');
    const demo = demoOf(page, 'Breakpoints in code');
    const current = demo.locator('output');
    await expect(current).toHaveText('md');
    await expect(demo.locator('.demo-pre').getByText('The screen is at least 768 px wide')).toBeVisible();
    await page.setViewportSize({ width: 500, height: 900 });
    await expect(current).toHaveText('xs');
    await expect(demo.locator('.demo-pre').getByText('The screen is narrower than 768 px')).toBeVisible();
    await page.setViewportSize({ width: 2000, height: 900 });
    await expect(current).toHaveText('xxxl');
  });

  test('wrap demo: the switch changes its own Row, and without wrap the strip scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await open(page, 'components/grid/');
    const demo = demoOf(page, 'Wrap');
    const strip = demo.locator('.demo-pre .strip');
    const row = demo.locator('.demo-pre .ads-row');
    const scrolls = () => strip.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(await scrolls()).toBe(false);
    await expect(row).not.toHaveClass(/ads-row-nowrap/);
    await demo.getByRole('switch', { name: 'wrap' }).click();
    await expect(row).toHaveClass(/ads-row-nowrap/);
    await expect(demo.locator('.demo-pre').getByRole('status')).toHaveText('wrap={false}');
    expect(await scrolls()).toBe(true);
  });

  test('playground: a choice in one group changes its own result, and no other group moves', async ({ page }) => {
    await open(page, 'components/grid/');
    const demo = demoOf(page, 'Playground');
    const checked = (name: string) => demo.getByRole('radiogroup', { name }).getByRole('radio', { checked: true });
    await expect(checked('Horizontal gutter')).toHaveAccessibleName('16');
    await expect(checked('Vertical gutter')).toHaveAccessibleName('16');
    await expect(checked('Columns in a row')).toHaveAccessibleName('4');

    await demo.getByRole('radiogroup', { name: 'Horizontal gutter' }).getByRole('radio', { name: '32', exact: true }).check();
    await expect(checked('Horizontal gutter')).toHaveAccessibleName('32');
    await expect(checked('Vertical gutter')).toHaveAccessibleName('16');
    await expect(checked('Columns in a row')).toHaveAccessibleName('4');
    await expect(demo.locator('.caption').last()).toContainText('gutter={[32, 16]}');

    await demo.getByRole('radiogroup', { name: 'Columns in a row' }).getByRole('radio', { name: '8', exact: true }).check();
    await expect(demo.locator('.demo-pre .ads-row .ads-col')).toHaveCount(16);
    await expect(checked('Horizontal gutter')).toHaveAccessibleName('32');
    await expect(checked('Vertical gutter')).toHaveAccessibleName('16');
  });

  test('is listed in the components menu', async ({ page }) => {
    await open(page, 'components/');
    await expect(page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Grid', exact: true })).toBeVisible();
  });

  test('the API tables name the props of Row, Col and Breakpoints', async ({ page }) => {
    await open(page, 'components/grid/');
    await expect(page.getByRole('table', { name: 'Row API' }).getByRole('rowheader', { name: 'gutter', exact: true })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Col API' }).getByRole('rowheader', { name: 'xxxl', exact: true })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Breakpoints' }).getByRole('rowheader', { name: 'current', exact: true })).toBeVisible();
  });
});

// The demos of a component page stand in two columns in the order of reading (1 | 2, 3 | 4, ...), a demo marked `wide` takes a whole
// row, and on a phone there is one column. With CSS columns a block jumped to the top of the other column when it did not fit, and
// the order depended on the heights.
test.describe('Spin page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  const pre = (demo: ReturnType<typeof demoOf>) => demo.locator('.demo-pre');

  test('every example is the real component and shows its own source', async ({ page }) => {
    // A loop over every example with several browser commands each: WebKit needs about three times the default time.
    test.slow();
    await open(page, 'components/spin/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(spinDemos.length);

    for (let i = 0; i < spinDemos.length; i++) {
      const demo = examples.nth(i);
      // The preview contains library Spins; the fullscreen one draws nothing until its button is pressed.
      if (spinDemos[i].slug === 'fullscreen') await expect(demo.locator('.demo-pre button.ads-btn').first()).toBeVisible();
      else await expect(demo.locator('.demo-pre .ads-spin').first()).toBeVisible();
      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/spin/${String(i + 1).padStart(2, '0')}-${spinDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('every caption stands above the component it names, inside its own unit', async ({ page }) => {
    await open(page, 'components/spin/');
    const misplaced = await page.locator('.demo-pre .field').evaluateAll((fields) =>
      fields.filter((field) => field.querySelector(':scope > .caption') && !field.firstElementChild?.classList.contains('caption')).length
    );
    expect(misplaced).toBe(0);
  });

  test('no loose text or element stands beside the units of an example', async ({ page }) => {
    await open(page, 'components/spin/');
    const loose = await page.locator('.demo-pre').evaluateAll((all) =>
      all.flatMap((preview) =>
        [...preview.children].filter((child) => !child.classList.contains('stack') && !child.classList.contains('ads-spin')).map((child) => child.className)
      )
    );
    expect(loose).toEqual([]);
  });

  test('basic demo: the switch turns a standalone Spin on and off, and nothing is left when it is off', async ({ page }) => {
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Basic');
    const toggle = demo.getByRole('switch', { name: 'Spinning' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(pre(demo).getByRole('status', { name: 'Loading the data' })).toBeVisible();
    await toggle.click();
    await expect(pre(demo).getByRole('status')).toHaveCount(0);
    await expect(demo).toContainText('spinning is false');
    await toggle.click();
    await expect(pre(demo).getByRole('status', { name: 'Loading the data' })).toBeVisible();
  });

  test('embedded demo: the mouse is blocked and the keyboard is not, and switching off frees the mouse', async ({ page }) => {
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Embedded mode');
    const press = demo.getByRole('button', { name: 'Press me' });
    const pressed = () => demo.locator('.demo-pre span', { hasText: 'The button was pressed' }).textContent();
    await expect(demo.locator('.ads-spin-container')).toHaveCSS('opacity', '0.5');
    const box = (await press.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    expect(await pressed()).toContain('pressed 0 times');
    await press.focus();
    await page.keyboard.press('Enter');
    expect(await pressed()).toContain('pressed 1 times');
    await demo.getByRole('switch', { name: 'Spinning' }).click();
    await expect(demo.locator('.ads-spin-container')).toHaveCSS('opacity', '1');
    await press.click();
    expect(await pressed()).toContain('pressed 2 times');
  });

  test('delay demo: a fast load never dims the panel, a slow one does after the delay', async ({ page }) => {
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Delay');
    const panel = demo.locator('.ads-spin-container');
    await demo.getByRole('button', { name: 'Load fast (200 ms)' }).click();
    // The load ends at 200 ms, before the 500 ms delay: the panel is never dimmed and the status line says it is done.
    await expect(demo.getByRole('status').filter({ hasText: 'Loaded in 200 ms' })).toBeVisible();
    await page.waitForTimeout(600);
    await expect(panel).toHaveCSS('opacity', '1');
    await expect(demo.locator('.ads-spin-section')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Load slow (2 s)' }).click();
    await expect(panel).toHaveCSS('opacity', '0.5');
    await expect(demo.locator('.ads-spin-section')).toHaveCount(1);
    await expect(demo.getByRole('status').filter({ hasText: 'Loaded in 2000 ms' })).toBeVisible({ timeout: 6000 });
    await expect(panel).toHaveCSS('opacity', '1');
  });

  test('progress demo: the slider moves its own ring only, and the other rings keep their values', async ({ page }) => {
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Progress');
    const rings = pre(demo).getByRole('progressbar');
    await expect(rings).toHaveCount(3);
    await expect(rings.nth(0)).toHaveAttribute('aria-valuenow', '35');
    await expect(rings.nth(1)).not.toHaveAttribute('aria-valuenow');
    await expect(rings.nth(2)).toHaveAttribute('aria-valuenow', '70');
    await demo.locator('input[type="range"]').fill('80');
    await expect(rings.nth(0)).toHaveAttribute('aria-valuenow', '80');
    await expect(rings.nth(1)).not.toHaveAttribute('aria-valuenow');
    await expect(rings.nth(2)).toHaveAttribute('aria-valuenow', '70');
    await expect(pre(demo).getByRole('progressbar', { name: 'Uploading' })).toBeVisible();
  });

  test('fullscreen demo: the backdrop covers the viewport, blocks the page and goes away by itself', async ({ page }) => {
    test.slow();
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Fullscreen');
    await demo.getByRole('button', { name: 'Show fullscreen' }).click();
    const backdrop = page.locator('.ads-spin-fullscreen');
    await expect(backdrop).toBeVisible();
    const viewport = page.viewportSize()!;
    const box = (await backdrop.boundingBox())!;
    expect(box).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    // The description is the content of the status element (a status has no name from content), and the content is what is announced.
    await expect(page.getByRole('status').filter({ hasText: 'Loading the page' })).toBeVisible();
    await expect(backdrop).toHaveCount(0, { timeout: 8000 });
    await expect(demo).toContainText('spinning is false');
  });

  test('semantic demo: classNames and styles reach the parts, and a custom property changes the color', async ({ page }) => {
    await open(page, 'components/spin/');
    const demo = demoOf(page, 'Classes and styles');
    await expect(demo.locator('.ads-spin-indicator.demo-indicator')).toHaveCount(1);
    await expect(demo.locator('.ads-spin-description.demo-description')).toHaveCount(1);
    const green = demo.locator('.ads-spin').nth(1);
    await expect(green).toHaveCSS('color', 'rgb(82, 196, 26)');
    await expect(demo.locator('.ads-spin-container.demo-container')).toHaveCount(1);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('no example makes the page scroll sideways', async ({ page }) => {
      await open(page, 'components/spin/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });
  });
});

test.describe('demos of a component page: reading order', () => {
  const componentPaths = allPages.map((entry) => entry.path).filter((path) => path.startsWith('/components/') && path !== '/components/');
  const boxesOf = (page: Page) =>
    page.locator('section.demo').evaluateAll((demos) =>
      demos.map((demo) => {
        const r = demo.getBoundingClientRect();
        return { x: r.x, width: r.width, top: r.top + scrollY, bottom: r.bottom + scrollY, wide: demo.classList.contains('wide') };
      })
    );

  test.describe('on a laptop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    for (const path of componentPaths) {
      test(`${path}: the demos fill the rows 1 | 2, 3 | 4, ... from the left, and a wide demo takes a row alone`, async ({ page }) => {
        await open(page, rel(path));
        const boxes = await boxesOf(page);
        expect(boxes.length).toBeGreaterThan(1);
        const left = Math.min(...boxes.map((box) => box.x));
        // A column is as wide as the widest narrow demo; when every demo is wide (the Menu page), it is half of a row less the gap.
        const narrow = boxes.filter((box) => !box.wide).map((box) => box.width);
        const column = narrow.length > 0 ? Math.max(...narrow) : (Math.max(...boxes.map((box) => box.width)) - 16) / 2;
        let slot = 0; // 0: the next demo opens a row on the left, 1: it completes the row on the right
        let above = 0; // the bottom of the rows before the current one
        let rowTop = 0;
        let rowBottom = 0;
        boxes.forEach((box, i) => {
          const name = `demo ${i + 1}`;
          if (box.wide) {
            above = Math.max(above, rowBottom);
            expect(Math.abs(box.x - left), `${name} (wide) starts at the left edge`).toBeLessThan(1);
            expect(box.width, `${name} (wide) is wider than a column`).toBeGreaterThan(column + 100);
            expect(box.top, `${name} (wide) starts below the rows before`).toBeGreaterThanOrEqual(above - 1);
            rowTop = box.top;
            rowBottom = box.bottom;
            slot = 0;
          } else if (slot === 0) {
            above = Math.max(above, rowBottom);
            expect(Math.abs(box.x - left), `${name} is in the left column`).toBeLessThan(1);
            expect(box.top, `${name} starts below the rows before`).toBeGreaterThanOrEqual(above - 1);
            rowTop = box.top;
            rowBottom = box.bottom;
            slot = 1;
          } else {
            expect(box.x, `${name} is in the right column`).toBeGreaterThan(left + 100);
            expect(Math.abs(box.top - rowTop), `${name} starts in the row of the demo before`).toBeLessThan(1);
            rowBottom = Math.max(rowBottom, box.bottom);
            slot = 0;
          }
        });
      });
    }
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    for (const path of componentPaths) {
      test(`${path}: one column, in order`, async ({ page }) => {
        await open(page, rel(path));
        const boxes = await boxesOf(page);
        expect(boxes.length).toBeGreaterThan(1);
        boxes.forEach((box, i) => {
          expect(Math.abs(box.x - boxes[0].x), `demo ${i + 1} is in the one column`).toBeLessThan(1);
          if (i > 0) expect(box.top, `demo ${i + 1} is below demo ${i}`).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
        });
      });
    }
  });
});

test.describe('Message page', () => {
  // A message fades in; a rectangle or a colour read in its first frames is the one of a half-shown message.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    test.slow();
    await open(page, 'components/message/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(messageDemos.length);

    for (let i = 0; i < messageDemos.length; i++) {
      const demo = examples.nth(i);
      // Nothing is on the page before a press: the layer appears with the first message and goes with the last one.
      await expect(demo.locator('.demo-pre').getByRole('button').first()).toBeAttached();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/message/${String(i + 1).padStart(2, '0')}-${messageDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('a press shows a message; an error is an alert and the others are status; the layer leaves with the last message', async ({ page }) => {
    await open(page, 'components/message/');
    await expect(page.locator('.ads-message-list')).toHaveCount(0);

    const types = demoOf(page, 'Types').locator('.demo-pre');
    await types.scrollIntoViewIfNeeded();
    await types.getByRole('button', { name: 'success', exact: true }).click();
    const done = page.locator('.ads-message-success');
    await expect(done).toHaveText(/This is a success message/);
    await expect(done).toHaveAttribute('role', 'status');

    await types.getByRole('button', { name: 'error', exact: true }).click();
    const failed = page.locator('.ads-message-error');
    await expect(failed).toHaveText(/This is an error message/);
    await expect(failed).toHaveAttribute('role', 'alert');

    // Both go by themselves (3 s), and then the page is as it was.
    await expect(page.locator('.ads-message')).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('.ads-message-list')).toHaveCount(0);
  });

  test('closable: the button closes a message that stays', async ({ page }) => {
    await open(page, 'components/message/');
    const demo = demoOf(page, 'Close button').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    await demo.getByRole('button', { name: 'stays', exact: true }).click();
    const kept = page.locator('.ads-message').filter({ hasText: 'A message that stays' });
    await expect(kept).toBeVisible();
    // duration 0: it is still there after a pause longer than the default 3 s would allow.
    await page.waitForTimeout(3500);
    await expect(kept).toBeVisible();
    await kept.locator('.ads-message-close').click();
    await expect(kept).toHaveCount(0);
  });
});

test.describe('installation tabs', () => {
  test('arrow keys move the focus between the package managers and change the command', async ({ page }) => {
    await open(page, 'docs/getting-started/');
    const npm = page.getByRole('tab', { name: 'npm', exact: true });
    await npm.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'pnpm' })).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText('pnpm add svelte-ant-design');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'bun' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(npm).toBeFocused();
  });
});

test.describe('Menu page', () => {
  // No animation: a rectangle is final right after a change.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
    test.slow();
    await open(page, 'components/menu/');
    const examples = page.locator('section.demo');
    await expect(examples).toHaveCount(menuDemos.length);

    for (let i = 0; i < menuDemos.length; i++) {
      const demo = examples.nth(i);
      await expect(demo.locator('.demo-pre ul.ads-menu-root').first()).toBeAttached();

      await demo.getByRole('button', { name: 'Show code' }).click();
      const shown = (await demo.locator('.demo-code pre').textContent()) ?? '';
      const file = new URL(`../src/docs/examples/menu/${String(i + 1).padStart(2, '0')}-${menuDemos[i].slug}.svelte`, import.meta.url);
      expect(shown.trimEnd()).toBe(readFileSync(file, 'utf8').trimEnd());
    }
  });

  test('selection demo: the three groups are independent (a click in one leaves the others as they were)', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Selection').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const status = demo.getByRole('status');
    await expect(status.nth(0)).toContainText('selectedKeys: a');
    await expect(status.nth(1)).toContainText('selectedKeys: a, c');
    await demo.getByRole('menu', { name: 'Single selection' }).getByRole('menuitemradio', { name: 'Beta' }).click();
    await expect(status.nth(0)).toContainText('selectedKeys: b');
    await expect(status.nth(1)).toContainText('selectedKeys: a, c');
    await demo.getByRole('menu', { name: 'Multiple selection' }).getByRole('menuitemcheckbox', { name: 'Alpha' }).click();
    await expect(status.nth(1)).toContainText('selectedKeys: c');
    await expect(status.nth(1)).toContainText('ondeselect: a');
    await expect(status.nth(0)).toContainText('selectedKeys: b');
    await demo.getByRole('menu', { name: 'Actions' }).getByRole('menuitem', { name: 'Gamma' }).click();
    await expect(status.nth(2)).toContainText('onclick: c (path c)');
    await expect(status.nth(0)).toContainText('selectedKeys: b');
    await expect(status.nth(1)).toContainText('selectedKeys: c');
  });

  test('vertical demo: the pointer opens a popup, and a click opens the popup of the click menu', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Vertical menu').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    await demo.getByRole('menu', { name: 'Vertical menu' }).getByRole('menuitem', { name: 'Navigation Two' }).hover();
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list')).toBeVisible();
    await expect(demo.getByRole('status').first()).toContainText('onopenchange: ["two"]');
    await page.mouse.move(5, 5);
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list')).toHaveCount(0);
    const clicking = demo.getByRole('menu', { name: 'Click to open' });
    await clicking.getByRole('menuitem', { name: 'Navigation Two' }).hover();
    await page.waitForTimeout(700);
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list')).toHaveCount(0);
    await clicking.getByRole('menuitem', { name: 'Navigation Two' }).click();
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list')).toBeVisible();
    await expect(demo.getByRole('status').nth(1)).toContainText('title click: two');
  });

  test('collapsed demo: the button narrows the menu to icons and brings it back', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Collapsed inline menu').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const menu = demo.getByRole('menu', { name: 'Collapsible menu' });
    await expect.poll(async () => (await menu.boundingBox())?.width).toBeGreaterThan(200);
    await demo.getByRole('button', { name: 'Collapse' }).click();
    await expect.poll(async () => Math.round((await menu.boundingBox())?.width ?? 0)).toBe(80);
    await demo.getByRole('button', { name: 'Expand' }).click();
    await expect.poll(async () => (await menu.boundingBox())?.width).toBeGreaterThan(200);
  });

  test('top navigation demo: a narrow container moves the items that do not fit into the "…" item', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Top navigation').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const narrow = demo.getByRole('menubar', { name: 'Narrow navigation' });
    const more = narrow.getByRole('menuitem', { name: 'More sections' });
    await expect(more).toBeVisible();
    await more.hover();
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list')).toBeVisible();
    await expect(page.locator('.ads-popup:not([hidden]) ul.ads-menu-popup-list').getByRole('menuitemradio', { name: 'Navigation Six' })).toBeVisible();
  });

  test('keyboard demo: one Tab stop, the arrows move, Escape returns', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Keyboard').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const bar = demo.getByRole('menubar', { name: 'Application menu' });
    await expect(bar.locator('[tabindex="0"]')).toHaveCount(1);
    await bar.getByRole('menuitem', { name: 'File' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ads-popup:not([hidden])').getByRole('menuitemradio', { name: 'New' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(bar.getByRole('menuitem', { name: 'File' })).toBeFocused();
  });

  test('markup demo: items written as components appear in the order of the markup, and an {#if} section comes and goes', async ({ page }) => {
    await open(page, 'components/menu/');
    const demo = demoOf(page, 'Items written as markup').locator('.demo-pre');
    await demo.scrollIntoViewIfNeeded();
    const dynamic = demo.getByRole('menu', { name: 'Dynamic markup' });
    await expect(dynamic.locator('[data-ads-key]')).toHaveCount(5);
    await demo.getByRole('checkbox', { name: 'Show the beta section' }).uncheck();
    await expect(dynamic.locator('[data-ads-key]')).toHaveCount(2);
    await demo.getByRole('checkbox', { name: 'Show the beta section' }).check();
    await expect(dynamic.locator('[data-ads-key]')).toHaveCount(5);
  });
});
