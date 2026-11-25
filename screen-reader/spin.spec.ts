// Spin with a real screen reader (Orca with Firefox through Guidepup), on the Spin lab of the e2e fixtures (`/#spin`). What is
// asserted is what Orca says when its caret reads the page, in the form of Orca 51 with Firefox 159 (specs/spin.md, A11y): the
// text of `description` in a status ("status bar" for Orca), a Spin named by `aria-label` only, an embedded Spin whose content
// stays readable, a Spin that is not spinning that leaves nothing behind, the progress ring said with its name and its value
// ("40 percent") and without a value when it is indeterminate, and a fullscreen Spin that does not hide the page behind it.
//
// What this does NOT show: whether Orca announces the status when it appears (a live region inserted into the page is not spoken
// in this setup, Firefox under Xvfb with no window manager, the same limit as for the Message and the Notification, so a missing
// announcement here proves nothing about the component), nor how NVDA, JAWS or VoiceOver read it.
import { orcaKeyCodeCommands } from '@guidepup/guidepup';
import { orcaTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';
import { BASE, open, settle, toWebContent } from './helpers';
import { cleanSpoken } from './spoken';

test.use({ orcaStartOptions: { capture: true } });
test.setTimeout(480_000);

type Orca = {
  perform(command: unknown, options?: unknown): Promise<unknown>;
  lastSpokenPhrase(): Promise<string>;
};

test('Spin: Orca reads the description as a status, the name of a Spin, the content it covers, the value of a progress ring and a fullscreen Spin that hides nothing', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#spin`);
  await page.waitForFunction(() => Boolean((window as unknown as { __spinLab?: unknown }).__spinLab));
  await toWebContent(page, orca);

  /** Mounts a fresh Spin and reads the page line by line from its start, the way a screen reader user reads it. */
  const read = async (config: unknown, lines = 5): Promise<string[]> => {
    await page.evaluate((next) => (window as unknown as { __spinLab: { set(next: unknown): void } }).__spinLab.set(next), config);
    await settle(page, 1500);
    await toWebContent(page, orca);
    const said: string[] = [];
    for (let line = 0; line < lines; line++) {
      await o.perform(orcaKeyCodeCommands.CaretNavigator.NextLine, { capture: true });
      said.push(cleanSpoken(await o.lastSpokenPhrase()));
    }
    return said;
  };

  // Standalone: the text of `description` is read as a status.
  expect(await read({ props: { description: 'Loading data' }, content: 'none' })).toContain('status bar. Loading data');
  await expect(page.locator('[data-testid="spin"]')).toHaveAttribute('role', 'status');

  // With no description the Spin is silent unless the consumer names it: a name from `aria-label` is read with the status.
  expect((await read({ props: { 'aria-label': 'Loading' }, content: 'none' })).join(' | ')).toMatch(/Loading\. status bar/);

  // Embedded: the status is read, and so is what the Spin covers (nothing is hidden or made inert); the busy state is on the
  // container, the region that is being updated.
  const embedded = await read({ props: { description: 'Saving' }, content: 'text' });
  expect(embedded.slice(0, 2)).toEqual(['status bar. Saving', 'Save. button']);
  await expect(page.locator('.ads-spin-container')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('[data-testid="inner-button"]')).not.toHaveAttribute('aria-hidden', /.*/);
  await expect(page.locator('[data-testid="inner-button"]')).not.toHaveAttribute('inert', /.*/);

  // A Spin that is not spinning says nothing and leaves the content as it was.
  const idle = await read({ props: { description: 'Saving', spinning: false }, content: 'text' });
  expect(idle.join(' | ')).not.toMatch(/status bar|Saving/);
  expect(idle).toContain('Save. button');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

  // The progress ring is a progress bar: its name (the description or the `aria-label`) and its value in percent.
  expect((await read({ props: { percent: 40, description: 'Uploading' }, content: 'none' })).join(' | ')).toMatch(/Uploading\. 40 percent/);
  expect((await read({ props: { percent: 40, 'aria-label': 'Upload' }, content: 'none' })).join(' | ')).toMatch(/Upload\. 40 percent/);
  // An indeterminate ring has no value to say.
  const auto = (await read({ props: { percent: 'auto', description: 'Working' }, content: 'none' })).join(' | ');
  expect(auto).toMatch(/Working\. progress bar/);
  expect(auto).not.toMatch(/percent/);

  // Fullscreen: the status is read and the page behind the backdrop is still there for a screen reader.
  const fullscreen = await read({ props: { fullscreen: true, description: 'Please wait' }, content: 'none' });
  expect(fullscreen).toContain('status bar. Please wait');
  expect(fullscreen).toContain('Outside. button');
  await expect(page.locator('[data-testid="outside"]')).not.toHaveAttribute('inert', /.*/);
});
