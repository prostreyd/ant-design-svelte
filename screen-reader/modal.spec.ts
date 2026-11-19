// Modal with a real screen reader (Orca with Firefox through Guidepup), on the Modal lab of the e2e fixtures (`/#modal`).
// What is asserted is what Orca says when its caret reads an open dialog and when Tab moves inside it (specs/modal.md, A11y):
// the document starts inside the dialog (the page behind is out of reach), the name and the text, the controls by name and
// role, Tab that stays inside, an alert dialog that is read from its title, and the page that is readable again after a close.
//
// What this does NOT show: whether Orca announces a dialog at the moment it opens. A move of focus by a script is not spoken
// in this setup (Firefox under Xvfb, no window manager), so the test reads the dialog with the caret instead. NVDA, JAWS,
// VoiceOver and a phone screen reader are not driven here.
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
const run = (page: Page, code: string) => page.evaluate((source) => new Function('lab', source)((window as unknown as { __modalLab: unknown }).__modalLab), code);

test('Modal: Orca starts the document inside the dialog, reads its name, text and controls, keeps Tab inside, reads an alert dialog from its title, and reads the page again after a close', async ({ page, orca }) => {
  const reader = orca as unknown as Orca;
  await open(page, `${BASE}/#modal`);
  await page.locator('[data-testid="open"]').waitFor();
  await page.waitForFunction(() => '__modalLab' in window);
  await toWebContent(page, orca);

  /** What the caret says at the start of the document, and then line after line (`lines` of them). */
  const readFromStart = async (lines: number): Promise<string[]> => {
    const said: string[] = [];
    await reader.clearSpokenPhraseLog();
    await reader.perform(orcaKeyCodeCommands.CaretNavigator.StartOfFile, { capture: true });
    said.push(joined(await reader.spokenPhraseLog()));
    for (let line = 0; line < lines; line++) {
      await reader.clearSpokenPhraseLog();
      await reader.perform(orcaKeyCodeCommands.CaretNavigator.NextLine, { capture: true });
      said.push(joined(await reader.spokenPhraseLog()));
    }
    return said;
  };

  // The page alone: the document starts with the heading of the page.
  expect((await readFromStart(0))[0]).toMatch(/Modal lab/);

  // A dialog: the document now starts inside it. Orca reads the first line as "Close. Basic Modal" or, when it enters the dialog, the whole text at once,
  // so what is asserted is what was read over the first lines together: the title, the body, the controls by name, and nothing of the page behind.
  await run(page, "lab.set({ open: true, title: 'Basic Modal' })");
  await settle(page, 2500);
  const dialog = await readFromStart(7);
  expect(dialog[0]).toMatch(/Basic Modal/);
  expect(dialog[0]).toMatch(/Close/);
  const dialogText = dialog.join(' | ');
  for (const part of ['Body line 1', 'Body line 2', 'Body line 3', 'Field. entry', 'Cancel. button', 'OK. button']) expect(dialogText).toContain(part);
  // Nothing of the page behind is reachable: not its heading, not its buttons, not its field.
  expect(dialogText).not.toMatch(/Modal lab|Open Modal|Page button|Page input/);

  // Tab goes around inside: the field of the body, Cancel, OK, the close button, and again. The page is never reached.
  await page.locator('.ads-modal-close').focus();
  const tabbed: string[] = [];
  for (let step = 0; step < 5; step++) {
    await reader.clearSpokenPhraseLog();
    await reader.press('Tab');
    await settle(page, 1500);
    tabbed.push(joined(await reader.spokenPhraseLog()).replace(/tab\. /g, ''));
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  expect(tabbed[0]).toMatch(/Field\. entry/);
  expect(tabbed[1]).toMatch(/Cancel\. button/);
  expect(tabbed[2]).toMatch(/OK\. button/);
  expect(tabbed[3]).toMatch(/Close\. button/);
  expect(tabbed[4]).toMatch(/Field\. entry/);
  expect(tabbed.join(' | ')).not.toMatch(/Page button|Page input|Open Modal/);

  // Escape closes it and the page is readable again from its heading.
  await reader.press('Escape');
  await settle(page, 2000);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await toWebContent(page, orca);
  expect((await readFromStart(0))[0]).toMatch(/Modal lab/);

  // A static dialog: the document starts inside it too, with the title, then the text and the buttons (Orca sometimes adds the whole text
  // to the first phrase when the caret enters an alert dialog, and sometimes not, so only the stable part is asserted).
  await run(page, "lab.modal.confirm({ title: 'Delete the file?', content: 'This cannot be undone.' })");
  await settle(page, 2500);
  // Focus is on OK, and there is no close button (checked before the caret walks: the caret takes focus to the button it lands on).
  expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-ads-modal-ok'))).toBe(true);
  await expect(page.locator('[role="alertdialog"] .ads-modal-close')).toHaveCount(0);
  const alert = await readFromStart(5);
  expect(alert[0]).toMatch(/^Delete the file\?/);
  const alertText = alert.join(' | ');
  for (const part of ['This cannot be undone.', 'Cancel. button', 'OK. button']) expect(alertText).toContain(part);
  expect(alertText).not.toMatch(/Modal lab|Page button|Page input|Open Modal|Close\. button/);
  await reader.press('Escape');
  await settle(page, 2000);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});
