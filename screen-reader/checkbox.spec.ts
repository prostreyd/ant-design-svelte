// Checkbox with a real screen reader (Orca with Firefox through Guidepup).
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, reach, settle, toWebContent } from './helpers';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(240_000);

test.beforeEach(async ({ page, orca }) => {
  await open(page, `${BASE}/`);
  await page.locator('[data-testid="cb-off"]').waitFor();
  await toWebContent(page, orca);
});

test('Checkbox: Orca says its name and that it is not checked, Space says checked, and the state changes', async ({ page, orca }) => {
  expect(await reach(orca, /^Off\. .*checked/)).toBe('Off. not checked');
  await orca.act();
  await settle(page);
  expect(await orca.lastSpokenPhrase()).toBe('checked');
  await expect(page.locator('[data-testid="cb-off"]')).toBeChecked();
});

test('Checkbox that is checked and one that is indeterminate: Orca says checked and partially checked', async ({ orca }) => {
  expect(await reach(orca, /^On\. .*checked/)).toBe('On. checked');
  expect(await reach(orca, /^Indeterminate\./)).toBe('Indeterminate. partially checked');
});

test('Checkbox in a group: Orca says the name of an option and its state', async ({ orca }) => {
  expect(await reach(orca, /^A much longer option\./)).toBe('A much longer option. not checked');
});
