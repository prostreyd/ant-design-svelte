// Chromium only (see playwright.config.ts): the Chrome DevTools Protocol is how a real IME composition is driven. The edit field of
// Typography (specs/typography.md, TYP-19) must not end the editing with the Enter that confirms a composition, and a
// composition must not be cut by `maxlength` in the middle.
import { expect, test } from '@playwright/test';

test.describe('Typography edit with a real IME (Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#typography');
    await page.waitForFunction(() => Boolean((window as unknown as { __typographyLab?: unknown }).__typographyLab));
  });

  const mount = (page: import('@playwright/test').Page, editable: Record<string, unknown>) =>
    page.evaluate(
      (config) => (window as unknown as { __typographyLab: { set(c: unknown): void } }).__typographyLab.set(config),
      { kind: 'paragraph', text: 'Hi ', asContent: true, props: { editable } }
    );
  const log = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __typographyLab: { log(): string[] } }).__typographyLab.log());

  test('IME: the Enter that confirms a composition does not end the editing, the Enter after it does', async ({ page, context }) => {
    await mount(page, { onchange: true, onend: true });
    await page.getByRole('button', { name: 'Edit' }).click();
    const field = page.getByRole('textbox');
    await expect(field).toBeFocused();
    const session = await context.newCDPSession(page);
    await session.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    await page.keyboard.press('Enter');
    await expect(field).toBeVisible();
    expect(await log(page)).toEqual([]);
    await session.send('Input.insertText', { text: '你' });
    await expect(field).toHaveValue('Hi 你');
    await page.keyboard.press('Enter');
    await expect(field).toHaveCount(0);
    expect(await log(page)).toEqual(['onchange:Hi 你', 'onend']);
  });

  test('IME: a composition is not cut by maxlength before it ends', async ({ page, context }) => {
    await mount(page, { maxLength: 5 });
    await page.getByRole('button', { name: 'Edit' }).click();
    const field = page.getByRole('textbox');
    await expect(field).toBeFocused();
    const session = await context.newCDPSession(page);
    await session.send('Input.imeSetComposition', { text: 'abcdef', selectionStart: 6, selectionEnd: 6 });
    await expect(field).toHaveValue('Hi abcdef');
    await session.send('Input.insertText', { text: 'abcdef' });
    await expect(field).toHaveValue('Hi ab');
  });
});
