// Switch with a real screen reader (Orca with Firefox through Guidepup). What is asserted is what Orca says, in the
// form of Orca 51 with Firefox 159: the name, then the state; Orca does not say the word "switch".
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, reach, settle, toWebContent } from './helpers';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(180_000);

test.beforeEach(async ({ page, orca }) => {
  await open(page, `${BASE}/`);
  await page.locator('[data-testid="sw-off"]').waitFor();
  await toWebContent(page, orca);
});

test('Switch off: Orca says its name and that it is off, Space says on, and the state changes', async ({ page, orca }) => {
  expect(await reach(orca, /^Off\./)).toBe('Off. off');
  await orca.act();
  await settle(page);
  expect(await orca.lastSpokenPhrase()).toBe('on');
  await expect(page.locator('[data-testid="sw-off"]')).toHaveAttribute('aria-checked', 'true');
});

test('Switch on: Orca says its name and that it is on; one that is loading is said to be unavailable', async ({ orca }) => {
  expect(await reach(orca, /^On\./)).toBe('On. on');
  expect(await reach(orca, /^Loading\./)).toBe('Loading. off grayed');
});
