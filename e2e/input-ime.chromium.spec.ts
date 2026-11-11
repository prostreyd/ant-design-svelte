// Chromium only (see the `testIgnore` of the other projects in playwright.config.ts): the Chrome DevTools Protocol
// is how a real IME composition is driven, and Firefox and WebKit have no such API. The same behavior is
// checked in every engine, with the composition events themselves, in input.spec.ts.
import { expect, test } from '@playwright/test';

test.describe('Input with a real IME (Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('IME: the text is cut at the end of a composition, not in the middle of it', async ({ page, context }) => {
    const field = page.getByTestId('in-ime');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'abcdef', selectionStart: 6, selectionEnd: 6 });
    await expect(field).toHaveValue('abcdef');
    await session.send('Input.insertText', { text: 'abcdef' });
    await expect(field).toHaveValue('abc');
  });
});
