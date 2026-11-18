// Radio with a real screen reader (Orca with Firefox through Guidepup), on the Radio lab of the e2e fixtures (`/#radio`).
//
// One test, one walk through the page: Orca keeps state (the window, the caret, the mode) from a test to the next, and
// a series of short tests on this page read the wrong control. It asserts what Orca says (the name and the state, not the
// word of the role). Orca says nothing for a one-letter name (a quirk of Orca: the buttons "S", "M", "L" were read as just
// "selected"), so the options of the lab are words.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(240_000);

/** What Orca said last, without the "tab." of each key press and the landmark it may say first (see `cleanSpoken`). */
const said = async (orca: { lastSpokenPhrase(): Promise<string> }) => cleanSpoken(await orca.lastSpokenPhrase());

test('Radio: Orca says the name and the state of a radio, the name of a group and the selected radio, and follows an arrow key', async ({ page, orca }) => {
  await open(page, `${BASE}/#radio`);
  await page.locator('[data-testid="lab-single"]').waitFor();
  await toWebContent(page, orca);
  await page.locator('[data-testid="lab-before"]').focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();

  const heard: string[] = [];
  for (let step = 0; step < 4; step++) {
    await orca.press('Tab');
    await settle(page, 700);
    heard.push(await said(orca));
  }
  // A standalone radio: the name and that it is not selected.
  expect(heard[0]).toBe('Newsletter. not selected radio button');
  // A group: its name (from aria-labelledby), then the selected radio. Apple, Orange and Plum are not Tab stops.
  expect(heard[1]).toBe('Fruit. panel. Pear. selected radio button');
  // The group of buttons: its name, then the selected button.
  expect(heard[2]).toBe('leaving panel.. Size. panel. Medium. selected radio button');
  // A group nothing is selected in: the first radio, not selected.
  expect(heard[3]).toBe('leaving panel.. Plan. panel. Free. not selected radio button');

  // An arrow key in a group moves the selection and Orca says the new radio.
  await page.getByRole('radio', { name: 'Pear' }).focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();
  await orca.press('ArrowRight');
  await settle(page);
  expect(await said(orca)).toMatch(/Orange/);
  await expect(page.getByRole('radio', { name: 'Orange' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Pear' })).not.toBeChecked();
  await expect(page.locator('[data-testid="lab-value"]')).toHaveText('Orange');
});
