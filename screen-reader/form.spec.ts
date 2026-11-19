// Form with a real screen reader (Orca with Firefox through Guidepup), on the Form lab of the e2e fixtures (`/#form`).
//
// One test, one walk through the page: Orca keeps state (the window, the caret, the mode) from a test to the next.
// What is asserted is what Orca says, in the form of Orca 51 with Firefox 159: the name, the state and the description,
// not the word of the role. The things that matter for a form: the star and the colon are not part of the name, the
// control says that it is required, the text of a tooltip is read as the description of its button, and a failed
// submit moves focus to the first invalid field, where Orca says that it is invalid and reads the message.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, settle, toWebContent } from './helpers';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(240_000);

/** What Orca said last, without the key names it adds for each key press ("tab." and "return."). */
const said = async (orca: { lastSpokenPhrase(): Promise<string> }) => (await orca.lastSpokenPhrase()).replace(/(tab|return|shift\+tab)\. /g, '');

test('Form: Orca says the name without the star and the colon, that a field is required, reads the tooltip and, after a failed submit, the invalid field and its message', async ({ page, orca }) => {
  await open(page, `${BASE}/#form`);
  await page.locator('[data-testid="lab-basic"]').waitFor();
  await toWebContent(page, orca);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await settle(page);
  await orca.clearSpokenPhraseLog();

  const heard: string[] = [];
  for (let step = 0; step < 5; step++) {
    await orca.press('Tab');
    await settle(page, 900);
    heard.push(await said(orca));
  }
  // The label is "Username" with a star and a colon drawn next to it: the name is the text only, and the field is required.
  expect(heard[0]).toBe('Username. entry required. Focus mode');
  // The help icon of the next label is a button named by its accessible name; the tooltip text is its description.
  expect(heard[1]).toBe('More information. button. Pick a strong password. Browse mode');
  expect(heard[2]).toBe('Password. password text. Focus mode');
  // A field with a rule and no `required`: its name only. (It has a rule that always fails, but nothing has validated it yet.)
  expect(heard[3]).toBe('Check. entry');
  expect(heard[4]).toBe('Send. button. Browse mode');

  // A failed submit: Enter on the button. Focus goes to the first invalid field and Orca says that it is invalid and reads the message.
  await orca.press('Enter');
  await settle(page, 1500);
  expect(await said(orca)).toBe('Username. entry required. invalid entry. Please input your username. Focus mode. invalid entry');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('input-user');

  // Fix it, and move away and back: the field is no longer invalid, and the message is gone.
  await page.keyboard.type('ann');
  await settle(page, 600);
  await orca.press('Tab');
  await settle(page, 900);
  await orca.press('Shift+Tab');
  await settle(page, 1200);
  const again = await said(orca);
  // Back in the field Orca says its name, its text ("ann", selected) and that it is required; nothing about invalid.
  expect(again).toMatch(/^Username\. entry\. ann\. selected required\./);
  expect(again).not.toContain('invalid');
  expect(again).not.toContain('Please input your username');
});
