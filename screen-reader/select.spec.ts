// Select with a real screen reader (Orca with Firefox through Guidepup), on the Select lab of the e2e fixtures (`/#select`).
// What is asserted is what Orca says, in the form of Orca 51 with Firefox 159 (specs/select.md, A11y): the name of the field
// from its `<label for>` or `aria-label`, the role "combo box" and that it opens a popup; the list with its number of items,
// each option with "not selected" (a selected option is said by its name alone); a disabled option that the arrow keys skip;
// the label of a group said before the first option of the group and again when the arrows move into the next group; the
// selected values said with a searchable field (`aria-describedby` carries them); and the number of results after a search.
//
// One test, one walk through the lab: Orca keeps its state (the caret, the mode) from a test to the next, and a series of short
// tests on one page reads the wrong control.
//
// What this does NOT show: Orca does not say the shown value of a field that is not searchable. The field is a `div` with
// `role="combobox"` and its own text ("Sad"), as in the select-only example of the APG, and Orca says only its name, its role
// and that it opens a popup (the line of the page and a Tab press both). The value is in the page, and the option that was
// chosen is said as the selected one when the list opens again; how NVDA, JAWS and VoiceOver read the text of such a field is
// not shown here.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, joined, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(480_000);

type Orca = {
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  press(key: string): Promise<void>;
  type(text: string): Promise<void>;
};

test('Select: Orca says the name and the role of a field, the list and each option, skips a disabled option, says the group of an option, the selected values and the number of results', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#select`);
  await page.locator('[data-testid="single"]').waitFor();
  await toWebContent(page, orca);

  const at = () =>
    page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      return element ? element.getAttribute('data-testid') || element.getAttribute('aria-label') || element.tagName : '-';
    });
  /** What Orca said since the log was cleared, without the "tab." of each press and the landmark it may say first. */
  const heard = async () => (await o.spokenPhraseLog()).map(cleanSpoken).join(' | ');
  /** Tab until the field with this test id has the focus; returns what Orca said on the way to it, for the last press. */
  const tabTo = async (testId: string): Promise<string> => {
    for (let press = 0; press < 80; press++) {
      await o.clearSpokenPhraseLog();
      await o.press('Tab');
      await settle(page, 500);
      if ((await at()) === testId) {
        await settle(page, 400);
        return heard();
      }
    }
    throw new Error(`Tab never reached ${testId}`);
  };
  /** One key, then what Orca said for it. */
  const press = async (key: string, wait = 1000): Promise<string> => {
    await o.clearSpokenPhraseLog();
    await o.press(key);
    await settle(page, wait);
    return heard();
  };

  // ---- a field that is not searchable (the select-only pattern) -------------------------------------------------------
  // The name comes from `<label for="mood">`, and the role says that the field opens a popup.
  expect(await tabTo('single')).toMatch(/Mood\. combo box\. opens popup/);
  // ArrowDown opens the list: its name and number of items, then the first option and that it is not selected.
  expect(await press('ArrowDown')).toMatch(/Mood\. List with 4 items\. Happy\. not selected/);
  expect(await press('ArrowDown')).toMatch(/Sad\. not selected/);
  // A label too long for the field is read whole.
  expect(await press('ArrowDown')).toMatch(/A very long label that does not fit into a narrow field at all\. not selected/);
  // A disabled option is skipped by the arrows: nothing is said and the active option stays where it was.
  expect(await press('ArrowDown')).not.toMatch(/Not available/);
  expect(await page.evaluate(() => document.getElementById(document.querySelector('[data-testid="single"]')?.getAttribute('aria-activedescendant') ?? '')?.textContent)).toContain('A very long label');
  await expect(page.locator('[role="option"][aria-disabled="true"]')).toHaveText('Not available');
  expect(await press('ArrowUp')).toMatch(/Sad\. not selected/);
  // Enter chooses the option and closes the list; the field keeps the focus and shows the choice.
  await press('Enter');
  await expect(page.locator('[data-testid="single-value"]')).toHaveText('sad');
  await expect(page.locator('[data-testid="single"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-testid="single"]')).toBeFocused();
  // The list opens again on the chosen option, said by its name alone (a selected option is not "not selected").
  const reopened = await press('ArrowDown');
  expect(reopened).toMatch(/List with 4 items/);
  expect(reopened).toMatch(/Sad/);
  expect(reopened).not.toMatch(/Sad\. not selected/);
  await press('Escape');

  // ---- a field with several values (searchable by default) ----------------------------------------------------------------
  // The selected values are part of what Orca says for the field (a hidden element joined by `aria-describedby`).
  expect(await tabTo('multiple')).toMatch(/People\. editable combo box\. Ada, Grace\. opens popup/);
  await press('ArrowDown');
  await press('ArrowDown');
  // Enter on a chosen option takes it away; Orca then says the shortened list of values when the list closes.
  await press('Enter');
  await expect(page.locator('[data-testid="multi-value"]')).toHaveText('["Ada"]');
  expect(await press('Escape', 1500)).toMatch(/People\. editable combo box\. Ada\. opens popup/);

  // ---- a searchable field ---------------------------------------------------------------------------------------------
  expect(await tabTo('search')).toMatch(/Searchable\. editable combo box\. opens popup/);
  // Typing filters the list and Orca says how many results there are, and the first of them.
  await o.clearSpokenPhraseLog();
  await o.type('sa');
  await settle(page, 1200);
  expect(await heard()).toMatch(/Sad\. not selected\. 1 result/);
  // Enter chooses it and the field says its value.
  const chosen = await press('Enter', 1500);
  expect(chosen).toMatch(/Searchable\. editable combo box\. Sad\. opens popup/);

  // ---- the groups ----------------------------------------------------------------------------------------------------
  expect(await tabTo('groups')).toMatch(/Groups\. combo box\. opens popup/);
  // The label of a group is said before its first option, and again when the arrows move into the next group.
  expect(await press('ArrowDown')).toMatch(/Groups\. List with 2 items\. Engineers\. Ada\. not selected/);
  expect(await press('ArrowDown')).toMatch(/Linus\. not selected/);
  expect(await press('ArrowDown')).toMatch(/Scientists\. Grace\. not selected/);
  // The disabled option at the end of the last group is skipped.
  expect(await press('ArrowDown')).not.toMatch(/Barbara/);
  await press('Escape');
  expect(joined(await o.spokenPhraseLog())).not.toMatch(/Barbara/);
});
