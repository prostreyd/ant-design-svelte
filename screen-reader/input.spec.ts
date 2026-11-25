// Input with a real screen reader (Orca with Firefox through Guidepup), on the default page of the e2e fixtures (`/`). What is
// asserted is what Orca says, in the form of Orca 51 with Firefox 159 (specs/input.md, A11y): the name of a field (from the
// `aria-label` the consumer gives) and its role, `status="error"` said as an invalid entry and a warning not, the count read as
// part of the field, the numeric field and the password field with the names of their roles, the clear, toggle and search
// buttons with their own names and states, the group of an `InputOTP` with the name of each cell, and the speech after a few
// keys: a count that goes over its soft limit is said as an invalid entry, a toggle says pressed, a cleared field takes the
// focus back, and an `InputOTP` says the next cell.
//
// One test, one walk: Orca keeps its state (the caret, the mode) from a test to the next, and a series of short tests on one
// page reads the wrong control. A word like "Focus mode" or "Browse mode" is Orca telling that it switched mode, so the
// assertions start at the name and the role and leave the end of a phrase to what the test is about.
//
// What this does NOT show: how Orca says a native `disabled` or `readonly` field (it did not reach one with the structural
// navigation of the entries, and the attributes are the browser's, not the component's), nor how NVDA, JAWS or VoiceOver read
// the fields.
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, joined, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(400_000);

type Orca = {
  lastSpokenPhrase(): Promise<string>;
  spokenPhraseLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  press(key: string): Promise<void>;
  type(text: string): Promise<void>;
};

test('Input: Orca says the name and the role of a field, an invalid entry for status error, the count, the buttons and the cells of an OTP, and the speech after a few keys', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/`);
  await page.locator('[data-testid="in-rest"]').waitFor();
  await toWebContent(page, orca);
  await page.locator('[data-testid="in-rest"]').focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();

  // The Tab walk from the first field to the cells of the OTP.
  const heard: string[] = [];
  for (let step = 0; step < 28; step++) {
    await o.press('Tab');
    await settle(page, 650);
    heard.push(cleanSpoken(await o.lastSpokenPhrase()));
  }
  const phrase = (matcher: RegExp): string => {
    const found = heard.find((said) => matcher.test(said));
    expect(found, `${matcher} in: ${joined(heard)}`).toBeDefined();
    return found as string;
  };

  // A field is said with its name and "entry"; the size and the variant change the look and not the speech.
  expect(phrase(/Large\. entry/)).toMatch(/Large\. entry/);
  phrase(/^Small\. entry/);
  phrase(/^Underlined\. entry/);
  // `status="error"` is `aria-invalid` and is said as an invalid entry (the field has a value, which Orca reads and selects);
  // a warning has no ARIA state and says nothing more, and the variant of the field does not matter.
  expect(phrase(/^Error\. entry/)).toMatch(/invalid entry$/);
  expect(phrase(/^Filled error\. entry/)).toMatch(/invalid entry$/);
  expect(phrase(/^Warning\. entry/)).not.toMatch(/invalid/);
  // The count is joined to the field by `aria-describedby`, so Orca reads it with the field.
  expect(phrase(/^Count\. entry/)).toMatch(/3 \/ 20$/);
  expect(phrase(/^Soft limit\. entry/)).toMatch(/0 \/ 5$/);
  // The role of a numeric field and of a password field is that of the native input.
  phrase(/^Number\. spin button/);
  phrase(/^Password\. password text/);
  // The buttons of a field have their own names and roles: the clear button, the toggle of the password (not pressed), the
  // search button.
  phrase(/^Clear\. button/);
  phrase(/^Show password\. toggle button not pressed/);
  phrase(/^Search\. entry/);
  phrase(/^Search\. button/);
  // A text area is an entry like the others.
  phrase(/^Auto size\. entry/);
  phrase(/^Counted\. entry/);
  // The group of an `InputOTP` has the name the consumer gives and each cell is named by its place.
  expect(phrase(/^Code\. panel\./)).toBe('Code. panel. Character 1 of 4. entry');

  // A count that goes over its soft limit sets `aria-invalid`, and Orca says it as soon as it changes, with the count.
  const soft = page.locator('[data-testid="in-soft"]');
  await soft.focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();
  await o.type('abcdefg');
  await settle(page, 1200);
  const overflow = joined(await o.spokenPhraseLog());
  expect(overflow).toMatch(/invalid entry/);
  expect(overflow).toMatch(/7 \/ 5/);
  await expect(soft).toHaveAttribute('aria-invalid', 'true');

  // The clear button empties the field and gives the focus back to it, so a screen reader user stays where they were.
  const clear = page.locator('[data-testid="in-clear"]');
  await clear.focus();
  await o.type('xy');
  await settle(page);
  await o.press('Tab');
  await settle(page, 700);
  await orca.clearSpokenPhraseLog();
  await o.press('Enter');
  await settle(page, 1200);
  await expect(clear).toHaveValue('');
  await expect(clear).toBeFocused();
  // Orca may still be saying the key echo of the Enter before it ("return."), so the phrase is matched by its end.
  expect(joined(await o.spokenPhraseLog())).toMatch(/Clear\. entry/);

  // The toggle of a password says pressed after a Space and shows the text.
  const password = page.locator('[data-testid="in-password"]');
  await password.focus();
  await o.press('Tab');
  await settle(page, 700);
  await orca.clearSpokenPhraseLog();
  await o.press('Space');
  await settle(page, 1200);
  // The log, not only the last phrase: the key echo ("space.") and the new state are separate phrases, in a timing of Orca's own.
  const toggled = joined(await o.spokenPhraseLog());
  expect(toggled).toMatch(/pressed/);
  expect(toggled).not.toMatch(/not pressed/);
  await expect(password).toHaveAttribute('type', 'text');

  // An `InputOTP` moves to the next cell after a character and Orca says the cell it moved to.
  await page.locator('[data-testid="otp"] [aria-label="Character 1 of 4"]').focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();
  await o.type('12');
  await settle(page, 1200);
  expect(joined(await o.spokenPhraseLog())).toMatch(/Character 3 of 4\. entry/);
  await expect(page.locator('[data-testid="otp"] [aria-label="Character 3 of 4"]')).toBeFocused();
});
