// End-to-end tests of the built documentation site (see playwright.config.ts).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { demos } from '../src/docs/data/button.ts';
import { demos as checkboxDemos } from '../src/docs/data/checkbox.ts';
import { demos as inputDemos } from '../src/docs/data/input.ts';
import { demos as switchDemos } from '../src/docs/data/switch.ts';
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
    const library = ['.ads-btn', '.ads-switch', '.ads-checkbox', '.ads-checkbox-group', '.ads-input', '.ads-input-search', '.ads-input-otp'];
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

test.describe('home page', () => {
  test('the roadmap lists every ready component, and no alpha label is left', async ({ page }) => {
    await open(page, '');
    const now = page.locator('.road .card').first();
    await expect(now).toContainText('Button');
    await expect(now).toContainText('Input');
    await expect(now).toContainText('Checkbox');
    await expect(now).toContainText('Switch');
    // The ready components follow the order of the sidebar: Button, Input, Checkbox, Switch.
    await expect(now.locator('.chips').nth(1)).toContainText('variant');
    await expect(now.locator('.chips').nth(2)).toContainText('classNames');
    await expect(now.locator('.chips').nth(3)).toContainText('classNames');
    // A version number such as 0.1.0-alpha.2 is not a label; only the word on its own counts.
    await expect(page.locator('body')).not.toContainText(/alpha(?!\.\d)/i);
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


test.describe('Switch page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
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

  test('methods demo: the buttons move and remove focus', async ({ page }) => {
    await open(page, 'components/switch/');
    const demo = demoOf(page, 'Focus and blur');
    const toggle = demo.getByRole('switch', { name: 'Power' });
    await demo.getByRole('button', { name: 'Focus' }).click();
    await expect(toggle).toBeFocused();
    await toggle.evaluate((element) => (element as HTMLElement).blur());
    await demo.getByRole('button', { name: 'Focus' }).click();
    await demo.getByRole('button', { name: 'Blur' }).click();
    await expect(toggle).not.toBeFocused();
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
    await field.fill('Ada');
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
    await field.fill('cats');
    await field.press('Enter');
    await expect(status).toHaveText('onsearch("cats", source: input)');
    await expect(field.locator('xpath=..').locator('.ads-input-icon-loading')).toBeVisible();
    await field.fill('dogs');
    await field.press('Enter');
    await expect(status).toHaveText('onsearch("cats", source: input)');
    await expect(field.locator('xpath=..').locator('.ads-input-icon-loading')).toBeHidden({ timeout: 4000 });
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

test.describe('Checkbox page', () => {
  /** The example section with the given title. */
  const demoOf = (page: Page, title: string) => page.locator('section.demo').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

  test('every example is the real component and shows its own source', async ({ page }) => {
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

  test('methods demo: the buttons move and remove focus', async ({ page }) => {
    await open(page, 'components/checkbox/');
    const demo = demoOf(page, 'Focus and blur');
    const box = demo.getByRole('checkbox', { name: 'Subscribe' });
    await demo.getByRole('button', { name: 'Focus' }).click();
    await expect(box).toBeFocused();
    await box.evaluate((element) => (element as HTMLElement).blur());
    await demo.getByRole('button', { name: 'Focus' }).click();
    await demo.getByRole('button', { name: 'Blur' }).click();
    await expect(box).not.toBeFocused();
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
