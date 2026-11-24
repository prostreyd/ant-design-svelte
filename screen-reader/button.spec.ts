// Button with a real screen reader (Orca with Firefox through Guidepup), on the default page of the e2e fixtures (`/`). What is
// asserted is what Orca says, in the form of Orca 51 with Firefox 159 (specs/button.md, A11y): the name and then the role, the
// name of an icon-only button from its `aria-label` (the glyph is not read), a loading button said to be unavailable while it
// stays a Tab stop, a native `disabled` button that Tab skips but a screen reader still finds, and a link made of a Button.
//
// One test, one walk: Orca keeps its state (the caret, the mode) from a test to the next, and a series of short tests on one
// page reads the wrong control. Orca says the role only when it changes from the control before, so a run of buttons is
// "Primary. button", "Dashed", "Text", and the assertions below name the words that carry the meaning.
//
// What this does NOT show: a change of `aria-busy` is not spoken by Orca (a busy attribute is a hint for a live region, not a
// state it reads out), so the loading state is asserted through the unavailable state that comes with it; nor how NVDA, JAWS or
// VoiceOver read it.
import { orcaKeyCodeCommands } from '@guidepup/guidepup';
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, reachBy, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(300_000);

/** What Orca said last, without the "tab." of each key press and the landmark it may say first (see `cleanSpoken`). */
const said = async (orca: { lastSpokenPhrase(): Promise<string> }) => cleanSpoken(await orca.lastSpokenPhrase());

test('Button: Orca says the name and the role, the name of an icon-only button, that a loading or disabled button is unavailable, and the role of a link', async ({ page, orca }) => {
  await open(page, `${BASE}/`);
  await page.locator('[data-testid="default"]').waitFor();
  await toWebContent(page, orca);
  await page.locator('[data-testid="default"]').focus();
  await settle(page);
  await orca.clearSpokenPhraseLog();

  // The Tab walk through the buttons, from the first one to the link after them.
  const heard: string[] = [];
  for (let step = 0; step < 14; step++) {
    await orca.press('Tab');
    await settle(page, 700);
    heard.push(await said(orca));
  }
  // The first control after Default: the name, then the role. The types and sizes change the look and not the speech.
  expect(heard[0]).toBe('Primary. button');
  expect(heard[1]).toBe('Dashed. button');
  // An icon-only button is named by its `aria-label`; the "+" glyph of the lab is not read.
  expect(heard).toContain('Circle. button');
  expect(heard.join(' | ')).not.toMatch(/\+|plus/i);
  // A native `disabled` button is not a Tab stop: Tab goes from Large to the loading button, and the loading button is a Tab stop
  // that is said to be unavailable ("grayed").
  expect(heard.join(' | ')).not.toMatch(/Disabled/);
  expect(heard).toContain('Loading. button grayed');
  // A Button with `href` is a link.
  expect(heard).toContain('Anchor. link');

  // A screen reader still finds the disabled button without Tab, and says that it is unavailable.
  await toWebContent(page, orca);
  expect(await reachBy(orca, orcaKeyCodeCommands.StructuralNavigator.NextButton, /^Disabled\./, 20)).toBe('Disabled. grayed');
  expect(await reachBy(orca, orcaKeyCodeCommands.StructuralNavigator.NextButton, /^Loading\./, 5)).toBe('Loading. grayed');

  // A disabled link keeps its name and its role (it has no `href`, `role="link"` and `aria-disabled`). Orca does not add
  // "grayed" for a link here: how Orca presents a link is its own, so the state is asserted on the element.
  await toWebContent(page, orca);
  expect(await reachBy(orca, orcaKeyCodeCommands.StructuralNavigator.NextLink, /^Disabled anchor/, 5)).toBe('Disabled anchor. link');
  await expect(page.locator('[data-testid="anchor-disabled"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-testid="anchor-disabled"]')).toHaveAttribute('role', 'link');

  // A button that becomes loading after an Enter stays where the focus is, and Orca then says it is unavailable.
  const start = page.locator('[data-testid="load-toggle"]');
  await start.focus();
  await settle(page);
  await orca.press('Enter');
  await settle(page, 1200);
  await expect(start).toHaveAttribute('aria-busy', 'true');
  await expect(start).toBeFocused();
  await orca.press('Tab');
  await settle(page, 700);
  await orca.clearSpokenPhraseLog();
  await orca.press('Shift+Tab');
  await settle(page, 900);
  expect(await said(orca)).toBe('Start. button grayed');
});
