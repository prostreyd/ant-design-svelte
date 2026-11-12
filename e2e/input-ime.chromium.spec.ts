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

  test('IME: a text area is cut at the end of a composition too', async ({ page, context }) => {
    const field = page.getByTestId('ta-ime');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'abcdef', selectionStart: 6, selectionEnd: 6 });
    await expect(field).toHaveValue('abcdef');
    await session.send('Input.insertText', { text: 'abcdef' });
    await expect(field).toHaveValue('abc');
  });

  test('IME: the Enter that confirms a composition does not search, the Enter after it does', async ({ page, context }) => {
    const field = page.getByTestId('in-search');
    const log = page.getByTestId('search-log');
    const session = await context.newCDPSession(page);
    await field.focus();
    await session.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    // The key event of a composition in progress has isComposing true, as in a real IME.
    await page.keyboard.press('Enter');
    await expect(log).toHaveText('');
    await session.send('Input.insertText', { text: '你' });
    await expect(field).toHaveValue('你');
    await expect(log).toHaveText('');
    await page.keyboard.press('Enter');
    await expect(log).toHaveText('input:你');
  });

  test('IME: a code cell takes its character when the composition ends, not before', async ({ page, context }) => {
    const cells = page.getByTestId('otp').locator('input');
    const value = page.getByTestId('otp-value');
    const session = await context.newCDPSession(page);
    await cells.nth(0).focus();
    await session.send('Input.imeSetComposition', { text: 'a', selectionStart: 1, selectionEnd: 1 });
    await expect(cells.nth(0)).toHaveValue('a');
    await expect(value).toHaveText('');
    await expect(cells.nth(0)).toBeFocused();
    await session.send('Input.insertText', { text: 'a' });
    await expect(value).toHaveText('a');
    await expect(cells.nth(1)).toBeFocused();
  });

  test('IME: a composition of several characters in a code cell fills the cells that follow', async ({ page, context }) => {
    const cells = page.getByTestId('otp').locator('input');
    const session = await context.newCDPSession(page);
    await cells.nth(0).focus();
    await session.send('Input.imeSetComposition', { text: 'bc', selectionStart: 2, selectionEnd: 2 });
    await session.send('Input.insertText', { text: 'bc' });
    await expect(page.getByTestId('otp-value')).toHaveText('bc');
    await expect(cells.nth(2)).toBeFocused();
  });

  test('IME: Backspace and the arrows pressed during a composition in a code cell are left to the IME', async ({ page, context }) => {
    const cells = page.getByTestId('otp').locator('input');
    const session = await context.newCDPSession(page);
    await cells.nth(0).focus();
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __seen: string[] }).__seen = seen;
      // On the window the handlers of the component have run, so defaultPrevented tells whether it took the key.
      window.addEventListener('keydown', (event) => seen.push(`${event.key}:${event.isComposing}:${event.defaultPrevented}`));
    });
    await session.send('Input.imeSetComposition', { text: 'ab', selectionStart: 2, selectionEnd: 2 });
    await page.keyboard.press('Backspace');
    await page.keyboard.press('ArrowRight');
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen).toEqual(['Backspace:true:false', 'ArrowRight:true:false']);
  });
});
