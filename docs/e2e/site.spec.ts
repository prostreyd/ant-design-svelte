// End-to-end tests of the built documentation site (see playwright.config.ts).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { demos } from '../src/docs/data/button.ts';
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

async function accessibilityViolations(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document) => Promise<AxeResult> } }).axe;
    const { violations } = await axe.run(document);
    return violations.map((v) => ({
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
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox')).toBeFocused();
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
});

test.describe('Button page', () => {
  test('every example is the real component and shows its own source', async ({ page }) => {
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

  test('copy puts the source of the example on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, 'components/button/');
    const first = page.locator('section.demo').first();
    await first.getByRole('button', { name: 'Copy code' }).click();
    await expect(first.getByRole('status')).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("import { Button } from 'svelte-ant-design'");
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
