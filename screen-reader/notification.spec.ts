// Notification with a real screen reader (Orca with Firefox through Guidepup), on the Notification lab of the e2e fixtures
// (`/#notification`). What is asserted is what Orca says when its caret reads a notification and when Tab reaches the close
// button (specs/notification.md, A11y): the role of the type, the hidden type word before the title, the title, then the
// description, no icon file name, the new text after an update by key, and the name of the close button.
//
// What this does NOT show: whether Orca announces a notification when it opens (the same limit as for the Message: a live
// region inserted into the page is not spoken in this setup, Firefox under Xvfb with no window manager, so a missing
// announcement here proves nothing about the component), nor how NVDA, JAWS or VoiceOver read it.
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
const run = (page: Page, code: string) => page.evaluate((source) => new Function('lab', source)((window as unknown as { __notificationLab: unknown }).__notificationLab), code);

test('Notification: Orca reads the role, the type word, the title and the description, the new text after an update, and the name of the close button', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#notification`);
  await page.locator('[data-testid="before"]').waitFor();
  await toWebContent(page, orca);

  /** What Orca says for one move of the caret, with the log cleared before it. */
  const say = async (command: unknown): Promise<string> => {
    await o.clearSpokenPhraseLog();
    await o.perform(command, { capture: true });
    return joined(await o.spokenPhraseLog());
  };
  /** Opens a notification and reads from the end of the page up: the layer is the last element of the body. */
  const readFromEnd = async (code: string, lines: number): Promise<string[]> => {
    await run(page, code);
    await settle(page, 1500);
    const heard = [await say(orcaKeyCodeCommands.CaretNavigator.EndOfFile)];
    for (let i = 0; i < lines; i++) heard.push(await say(orcaKeyCodeCommands.CaretNavigator.PreviousLine));
    return heard;
  };
  const clear = async () => {
    await run(page, 'lab.notification.destroy()');
    await settle(page, 1500);
  };

  // An error is an alert. From the end of the page: the close button (the role is said where the caret enters the notification),
  // then the description, then the type word and the title. Orca says nothing for the icon.
  const error = await readFromEnd("lab.notification.error({ title: 'Upload failed', description: 'The file is too large', duration: 0 })", 2);
  expect(error).toEqual(['alert. Close. button', 'The file is too large', 'Error:. Upload failed']);
  expect(joined(error)).not.toMatch(/circle|image|img|graphic/i);
  await clear();

  // A success is a status (Orca names the role "status bar").
  expect(await readFromEnd("lab.notification.success({ title: 'Saved', description: 'Your changes are stored', duration: 0 })", 2)).toEqual([
    'status bar. Close. button',
    'Your changes are stored',
    'Success:. Saved'
  ]);
  await clear();

  // Without the close button the last line is the description, and the role is said with it.
  expect(await readFromEnd("lab.notification.warning({ title: 'Careful', description: 'Disk is almost full', duration: 0, closable: false })", 1)).toEqual([
    'alert. Disk is almost full',
    'Warning:. Careful'
  ]);
  await clear();

  // An update by key: the same box with the new type word, title and description, and the old text is gone.
  await run(page, "lab.notification.info({ title: 'Working', description: 'Please wait', key: 'job', duration: 0, closable: false })");
  expect(
    await readFromEnd("lab.notification.success({ title: 'Done', description: 'All finished', key: 'job', duration: 0, closable: false })", 1)
  ).toEqual(['status bar. All finished', 'Success:. Done']);
  expect(await page.locator('.ads-notification').allTextContents()).toHaveLength(1);
  expect(await page.locator('.ads-notification').first().textContent()).not.toContain('Working');
  await clear();

  // Tab from the page into the close button: Orca says the role of the notification it enters, then the name and "button".
  const tabInto = async (code: string): Promise<string> => {
    await run(page, code);
    await settle(page, 1500);
    await page.locator('[data-testid="after"]').focus();
    await settle(page);
    await o.clearSpokenPhraseLog();
    await o.press('Tab');
    await settle(page, 1800);
    expect(await page.evaluate(() => document.activeElement?.className.split(' ')[0])).toBe('ads-notification-close');
    return joined(await o.spokenPhraseLog()).replace(/tab\. /g, '');
  };
  expect(await tabInto("lab.notification.error({ title: 'Failed', description: 'Try again', duration: 0 })")).toMatch(/alert\. Close\. button$/);
  await clear();
  expect(await tabInto("lab.notification.success({ title: 'Saved', description: 'Stored', duration: 0 })")).toMatch(/status bar\. Close\. button$/);
});
