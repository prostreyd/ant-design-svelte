// Message with a real screen reader (Orca with Firefox through Guidepup), on the Message lab of the e2e fixtures
// (`/#message`). What is asserted is what Orca says when its caret reads a message and when Tab reaches the close button
// (specs/message.md, A11y): the role of the type, the hidden type word before the text, the text, no icon file name,
// the new text after an update by key, and the name of the close button.
//
// What this does NOT show: whether Orca announces a message when it opens. A control with plain DOM, a `role="alert"`
// inserted with `insertAdjacentHTML`, is not spoken in this setup either (Firefox under Xvfb, no window manager), and
// the notification list of Orca stays empty, so a missing announcement here proves nothing about the component.
import { orcaKeyCodeCommands } from '@guidepup/guidepup';
import { orcaTest as test } from '@guidepup/playwright';
import { expect, type Page } from '@playwright/test';
import { BASE, joined, open, settle, toWebContent } from './helpers';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(240_000);

type Orca = {
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  perform(command: unknown, options?: unknown): Promise<unknown>;
  press(key: string): Promise<void>;
};

/** Runs `code` in the page with the lab as `lab`. */
const run = (page: Page, code: string) => page.evaluate((source) => new Function('lab', source)((window as unknown as { __messageLab: unknown }).__messageLab), code);

test('Message: Orca reads the role, the type word and the text, the new text after an update, and the name of the close button', async ({ page, orca }) => {
  await open(page, `${BASE}/#message`);
  await page.locator('[data-testid="before"]').waitFor();
  await toWebContent(page, orca);

  /** Opens a message and reads the last line of the page with the caret: the layer is the last element of the body. */
  const readEnd = async (code: string): Promise<string> => {
    await run(page, code);
    await settle(page, 1500);
    await (orca as unknown as Orca).clearSpokenPhraseLog();
    await (orca as unknown as Orca).perform(orcaKeyCodeCommands.CaretNavigator.EndOfFile, { capture: true });
    return joined(await (orca as unknown as Orca).spokenPhraseLog());
  };

  // An error is an alert: the role, the type word, then the text. Orca says nothing for the icon.
  const error = await readEnd("lab.message.error('Upload failed', 0)");
  expect(error).toBe('alert. Error:. Upload failed');
  expect(error).not.toMatch(/circle|image|img|graphic/i);

  // A success is a status (Orca names the role "status bar").
  expect(await readEnd("lab.message.success('Saved', 0)")).toBe('status bar. Success:. Saved');

  // An update by key: the same box with the new type word and text, and the old text is gone.
  await run(page, "lab.message.loading({ content: 'Working', key: 'job', duration: 0 })");
  expect(await readEnd("lab.message.success({ content: 'Done', key: 'job', duration: 0 })")).toBe('status bar. Success:. Done');
  expect(await page.locator('.ads-message').allTextContents()).not.toContain('Loading: Working');

  // A message with a close button: the caret reads the button after the text.
  expect(await readEnd("lab.message.warning({ content: 'Careful', duration: 0, closable: true })")).toBe('alert. Warning:. Careful. Close. button');
  await run(page, 'lab.message.destroy()');
  await settle(page, 1500);

  // Tab from the page into the close button: Orca says the role of the message it enters, then the name and "button".
  const tabInto = async (code: string, from = 'after'): Promise<string> => {
    await run(page, code);
    await settle(page, 1500);
    await page.locator(`[data-testid="${from}"]`).focus();
    await settle(page);
    await (orca as unknown as Orca).clearSpokenPhraseLog();
    await orca.press('Tab');
    await settle(page, 1800);
    expect(await page.evaluate(() => document.activeElement?.className.split(' ')[0])).toBe('ads-message-close');
    return joined(await (orca as unknown as Orca).spokenPhraseLog()).replace(/tab\. /g, '');
  };
  expect(await tabInto("lab.message.error({ content: 'Failed', duration: 0, closable: true })")).toMatch(/alert\. Close\. button$/);
  await run(page, 'lab.message.destroy()');
  await settle(page, 1500);
  expect(await tabInto("lab.message.success({ content: 'Saved', duration: 0, closable: true })")).toMatch(/status bar\. Close\. button$/);
});
