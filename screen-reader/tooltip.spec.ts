// Tooltip with a real screen reader (Orca with Firefox through Guidepup), on the Tooltip lab of the e2e fixtures (`/#tooltip`).
// What is asserted is what Orca says, in the form of Orca 51 with Firefox 159 (specs/tooltip.md, A11y): Tab to a trigger shows
// the tip and Orca says the name, the role and then the text of the tip, as a description (the trigger has `aria-describedby`
// while the tip is shown); a trigger that already has a description says it first and the tip after it; a long tip is read whole;
// a trigger with `trigger="click"` says only its name when it gets the focus; and Escape closes the tip and gives the trigger its
// own description back.
//
// One test, one walk: Orca keeps its state (the caret, the mode) from a test to the next, and a series of short tests on one
// page reads the wrong control.
//
// What this does NOT show: whether Orca announces a tip that opens after it has already spoken the focus (the Switch of the lab
// was said without its tip in one run, so the walk leaves it out: the speech of the description depends on a timing of Orca's
// own), nor how NVDA, JAWS or VoiceOver read the description.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(400_000);

type Orca = {
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  press(key: string): Promise<void>;
};

test('Tooltip: Orca says the text of a tip after the name and the role of its trigger, the old description first, a click tip not at all, and Escape closes it', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#tooltip`);
  await page.locator('[data-testid="main"]').waitFor();
  await toWebContent(page, orca);

  const at = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? '-');
  /** The visible tips of the page. */
  const tips = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="tooltip"]'))
        .filter((tip) => !(tip as HTMLElement).closest('[hidden]') && getComputedStyle(tip as HTMLElement).visibility !== 'hidden')
        .map((tip) => (tip.textContent ?? '').trim())
    );
  /** One Tab and what Orca said for it, by the test id of the control that took the focus. */
  const heard = new Map<string, string>();
  for (let press = 0; press < 8; press++) {
    await o.clearSpokenPhraseLog();
    await o.press('Tab');
    await settle(page, 1300);
    heard.set(await at(), (await o.spokenPhraseLog()).map(cleanSpoken).join(' | '));
  }

  // A trigger without a tip says its name and role, and no tip is shown.
  expect(heard.get('neighbor2')).toBe('Next. button');
  // A trigger with a tip: the name and the role, then the text of the tip as its description.
  expect(heard.get('wide')).toBe('A much wider trigger button. button. Wide trigger tip');
  expect(heard.get('box')).toBe('Agree with the terms. check box not checked. Checkbox tip');
  // A tip of a trigger with `trigger="click"` is not shown by the focus, so Orca says the name and the role only.
  expect(heard.get('click')).toBe('Click. button');
  // A long tip is read whole, up to its last word.
  expect(heard.get('long')).toMatch(/^Long\. button\. A long tip: the text of a tooltip wraps at the maximum width of 250 pixels, and Supercalifragilisticexpialidocious-is-a-word-that-/);
  // A trigger that has a description of its own says it first, and the text of the tip after it (the two ids are merged).
  expect(heard.get('described')).toBe('Has a note. button. Existing description Description');
  expect(await page.locator('[data-testid="described"]').getAttribute('aria-describedby')).toMatch(/^note ads-tooltip-/);
  expect(await tips()).toEqual(['Description']);

  // Escape closes the tip while the trigger keeps the focus, and the description of the trigger is its own again.
  await o.press('Escape');
  await settle(page, 1000);
  expect(await tips()).toEqual([]);
  expect(await at()).toBe('described');
  await expect(page.locator('[data-testid="described"]')).toHaveAttribute('aria-describedby', 'note');
});
