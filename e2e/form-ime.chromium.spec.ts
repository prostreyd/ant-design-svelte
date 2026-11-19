// Chromium only (see the `testIgnore` of the other projects in playwright.config.ts): the Chrome DevTools Protocol is how a
// real IME composition is driven. The same rule is checked in every engine with the composition events themselves, in
// tests/FormItem.test.ts (VAL-2). A message must not appear under a half-typed syllable (specs/form.md, VAL-2).
import { expect, test } from '@playwright/test';

test.describe('Form with a real IME (Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#form');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const message = (page: import('@playwright/test').Page) => page.getByTestId('ime-item').locator('.ads-form-item-help-item');

  test('IME: no message while a composition is open, the message when it ends on too little text', async ({ page, context }) => {
    const field = page.getByTestId('ime-input');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'n', selectionStart: 1, selectionEnd: 1 });
    await session.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    await expect(field).toHaveValue('ni');
    await page.waitForTimeout(200);
    await expect(message(page)).toHaveCount(0);
    await session.send('Input.insertText', { text: '你' });
    await expect(field).toHaveValue('你');
    await expect(message(page)).toHaveText('too short');
  });

  test('IME: a composition that ends on enough text leaves no message', async ({ page, context }) => {
    const field = page.getByTestId('ime-input');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'nihao', selectionStart: 5, selectionEnd: 5 });
    await session.send('Input.insertText', { text: '你好吗' });
    await expect(field).toHaveValue('你好吗');
    await page.waitForTimeout(200);
    await expect(message(page)).toHaveCount(0);
  });

  test('IME: after the composition the field validates on every change again', async ({ page, context }) => {
    const field = page.getByTestId('ime-input');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    await session.send('Input.insertText', { text: '你好吗' });
    await field.press('Backspace');
    await expect(message(page)).toHaveText('too short');
  });
});
