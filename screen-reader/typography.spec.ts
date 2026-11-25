// Typography with a real screen reader (Orca with Firefox through Guidepup), on the Typography lab of the e2e fixtures
// (`/#typography`). What is asserted is what Orca says (specs/typography.md, P23): the names of the copy and edit buttons, the
// `Copied` status after a copy (a string and a promised text), the edit field by its name and text, the expand button with its
// state, the whole text of a part that is cut by script, the level of a title, and plain links of the article and of a part.
//
// Orca says "expanded" when a button opens something and says nothing when it closes it again; a plain button with
// `aria-expanded` behaves the same in this setup (checked 2026-11-25), so the closed state is read by coming back to the button.
// What this does NOT show: how NVDA, JAWS, VoiceOver or a phone screen reader read the part; and the `Copied` of a promised text
// that comes seconds later. This setup speaks a change of a status only right after a key press: 4 s after it, it stays silent
// even for a plain `role="status"` on the page (checked 2026-11-25), so that silence says nothing about the component.
import { orcaKeyCodeCommands } from '@guidepup/guidepup';
import { orcaTest as test } from '@guidepup/playwright';
import { expect, type Page } from '@playwright/test';
import { BASE, joined, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(240_000);

type Orca = {
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  perform(command: unknown, options?: unknown): Promise<unknown>;
  press(key: string): Promise<void>;
};

const SENTENCE = 'Ant Design, a design language for background applications, is refined by Ant UED Team.';
const LONG = Array.from({ length: 4 }, () => SENTENCE).join(' ');

test('Typography: Orca reads the buttons, the Copied status, the edit field, the state of the expand button, the whole cut text, a heading and plain links', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#typography`);
  await page.waitForFunction(() => Boolean((window as unknown as { __typographyLab?: unknown }).__typographyLab));
  await toWebContent(page, orca);

  const mount = async (target: Page, config: unknown): Promise<void> => {
    await target.evaluate((c) => (window as unknown as { __typographyLab: { set(c: unknown): void } }).__typographyLab.set(c), config);
    await settle(target);
    await target.locator('body').click({ position: { x: 1, y: 1 } });
  };
  /** What Orca says while `act` runs, with the log cleared before it. */
  const hear = async (act: () => Promise<unknown>, ms = 1800): Promise<string> => {
    await o.clearSpokenPhraseLog();
    await act();
    await settle(page, ms);
    return cleanSpoken(joined(await o.spokenPhraseLog()));
  };

  // Copy: the button by its name; the copy is announced by the status, not only by the new name of the button.
  await mount(page, { kind: 'paragraph', text: 'This is a copyable text.', props: { copyable: true } });
  expect(await hear(() => o.press('Tab'))).toBe('Copy. button');
  expect(await hear(() => o.press('Enter'), 2500)).toMatch(/Copied/);

  // Edit: the button by its name, the field by its name and text, the button again after Escape.
  await mount(page, { kind: 'paragraph', text: 'Editable words', asContent: true, props: { editable: true } });
  expect(await hear(() => o.press('Tab'))).toBe('Edit. button');
  expect(await hear(() => o.press('Enter'), 2500)).toMatch(/Edit\. entry\. Editable words/);
  expect(await hear(() => o.press('Escape'), 2500)).toMatch(/Edit\. button/);

  // Expand: the name is the visible text and the state is read; opening says "expanded"; after closing, coming back to the button
  // reads it as collapsed again.
  await mount(page, { kind: 'paragraph', text: LONG, width: 500, props: { ellipsis: { rows: 2, expandable: 'collapsible' } } });
  expect(await hear(() => o.press('Tab'))).toMatch(/Expand\. collapsed button/);
  expect(await hear(() => o.press('Enter'), 2500)).toMatch(/expanded/);
  await hear(() => o.press('Enter'), 2500);
  await hear(() => o.press('Tab'));
  expect(await hear(() => o.press('Shift+Tab'))).toMatch(/Expand\. collapsed button/);

  // A part that is cut by script is read whole, once, without the dots; the button follows the text.
  await mount(page, { kind: 'paragraph', text: LONG, width: 500, props: { ellipsis: { rows: 2, expandable: true } } });
  await hear(() => o.perform(orcaKeyCodeCommands.CaretNavigator.StartOfFile, { capture: true }));
  const line = await hear(() => o.perform(orcaKeyCodeCommands.CaretNavigator.NextLine, { capture: true }));
  expect(line).toContain(LONG);
  expect(line).not.toMatch(/\.\.\.|…/);
  expect(line.split(SENTENCE).length - 1).toBe(4);
  expect(line).toMatch(/Expand\. collapsed button/);

  // A promised text: `Copied` is said when the text comes, and not before. A text that comes at once is announced like a string;
  // while a text is still awaited, nothing says that it was copied.
  await mount(page, { kind: 'paragraph', text: 'A text from a server', props: { copyable: { text: 'From a server', pending: 300 } } });
  await hear(() => o.press('Tab'));
  expect(await hear(() => o.press('Enter'), 2500)).toMatch(/Copied/);
  await mount(page, { kind: 'paragraph', text: 'A text from a server', props: { copyable: { text: 'From a server', pending: true } } });
  await hear(() => o.press('Tab'));
  expect(await hear(() => o.press('Enter'), 2500)).not.toMatch(/Copied/);

  // A title is a heading of its level.
  await mount(page, { kind: 'title', text: 'Release notes', props: { level: 3 } });
  await hear(() => o.perform(orcaKeyCodeCommands.CaretNavigator.StartOfFile, { capture: true }));
  expect(await hear(() => o.perform(orcaKeyCodeCommands.StructuralNavigator.NextHeading, { capture: true }))).toMatch(/Release notes\. heading 3/);

  // Plain links, written as `<a href>`: Tab reaches one of the article and one of a part outside it, and each is read as a link
  // by its name.
  await mount(page, { kind: 'article', props: {}, text: '' });
  expect(await hear(() => o.press('Tab'))).toMatch(/a plain link\. (visited )?link/);
  await page.locator('#out a.ads-btn').focus();
  await settle(page);
  expect(await hear(() => o.press('Tab'))).toMatch(/a link of a paragraph\. (visited )?link/);
});
