// Icon with a real screen reader (Orca with Firefox through Guidepup), on the Icon lab of the e2e fixtures (`/#icon`). What is
// asserted is what Orca says when its caret reads an icon and when Tab reaches a control that holds one (specs/icon.md, A1 to
// A4): a drawing is read as its name and "image", `label` replaces the name, `label=""` leaves nothing to read, a hidden icon inside
// a button leaves the button its own name, an icon-only button is read by its own name, and an icon with `role="button"` and a
// `label` is read as a button with that name.
//
// What this does NOT show: how NVDA, JAWS, VoiceOver or a phone screen reader read an icon. That a spinning icon announces
// nothing is not proved either: the component has no live region, and Orca in this setup does not speak a change that nobody
// asked for.
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

/** Runs `code` in the page with the lab as `lab`. */
const run = (page: Page, code: string) => page.evaluate((source) => new Function('lab', source)((window as unknown as { __iconLab: unknown }).__iconLab), code);

test('Icon: Orca reads a drawing as its name and "image", a label replaces the name, label="" is silent, and the icons in controls leave the controls their own names', async ({ page, orca }) => {
  const o = orca as unknown as Orca;
  await open(page, `${BASE}/#icon`);
  await page.locator('[data-testid="before"]').waitFor();
  await toWebContent(page, orca);

  /** What Orca says for one move of the caret, with the log cleared before it. */
  const say = async (command: unknown): Promise<string> => {
    await o.clearSpokenPhraseLog();
    await o.perform(command, { capture: true });
    return cleanSpoken(joined(await o.spokenPhraseLog()));
  };
  /** The first lines of the page, from its start: the line of the icon under test, then the lines below it. */
  const readLines = async (below: number): Promise<string[]> => {
    const heard = [await say(orcaKeyCodeCommands.CaretNavigator.StartOfFile)];
    for (let i = 0; i < below; i++) heard.push(await say(orcaKeyCodeCommands.CaretNavigator.NextLine));
    return heard;
  };

  // A drawing is read as its name, in English, and the word "image"; the svg inside says nothing of its own. Below it: three more
  // drawings by their names, then the controls. The icon inside the Search button is silent, so the button is "Search" and nothing
  // else; the icon-only Delete button is its own name; the icon with a role and a label is a button with that label.
  const normal = await readLines(2);
  expect(normal).toEqual(['Before. star. image. After', 'dot-net. image. login. image. rest. image', 'Search. button. Delete. button. Add a star. button']);
  expect(normal[2]).not.toMatch(/image|graphic/i);

  // `label` is the name that is read, in place of the name of the drawing.
  await run(page, "lab.set({ props: { label: 'Favourite' } })");
  await settle(page);
  const named = await readLines(0);
  expect(named).toEqual(['Before. Favourite. image. After']);
  expect(joined(named)).not.toMatch(/star/i);

  // `label=""` hides the icon: nothing of it is read, not even the word "image".
  await run(page, "lab.set({ props: { label: '' } })");
  await settle(page);
  const hidden = await readLines(0);
  expect(hidden).toEqual(['Before After']);
  expect(joined(hidden)).not.toMatch(/image|star|graphic/i);

  // The loading drawing is read by its name like any other; that it turns is not something Orca says.
  await run(page, "lab.set({ name: 'LoadingOutlined', props: { spin: true } })");
  await settle(page);
  expect(await readLines(0)).toEqual(['Before. loading. image. After']);

  // Tab from the page into the three controls: the button is named by its text, the icon-only one by its own name, the icon with a
  // role by its label, and each is a "button".
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  const tab = async (expected: string, focused: string): Promise<void> => {
    await o.clearSpokenPhraseLog();
    await o.press('Tab');
    await settle(page, 1500);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(focused);
    expect(cleanSpoken(joined(await o.spokenPhraseLog()))).toBe(expected);
  };
  await tab('Search. button', 'search-button');
  await tab('Delete. button', 'delete-button');
  await tab('Add a star. button', 'star-button');
});
