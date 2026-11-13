import { orcaKeyCodeCommands } from '@guidepup/guidepup';
import type { Page } from '@playwright/test';

export const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4195';

/** Speech takes time: the log is read after the screen reader has had a moment to say what changed. */
export const settle = (page: Page, ms = 1200) => page.waitForTimeout(ms);

export const joined = (log: string[]) => log.join(' | ');

/**
 * Opens a page. Firefox in a window starts the same navigation twice and Playwright reports the first as interrupted
 * although the second one loads the page, so an error is forgiven when the page ends up at the address.
 */
export async function open(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    await page.waitForLoadState('domcontentloaded');
    if (page.url() !== url) throw error;
  }
}

/**
 * What `orca.navigateToWebContent()` of @guidepup/playwright 0.21.0 does, with the command names of Guidepup 0.40.0 (the
 * helper itself calls names that this version renamed): puts the browser window in front, takes the focus into the page
 * and puts Orca's caret at the start of the document.
 */
export async function toWebContent(page: Page, orca: { perform(command: unknown, options?: unknown): Promise<unknown>; clearSpokenPhraseLog(): Promise<void> }): Promise<void> {
  await page.bringToFront();
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await orca.perform(orcaKeyCodeCommands.CaretNavigator.StartOfFile, { capture: true });
  await orca.clearSpokenPhraseLog();
}

type Orca = {
  perform(command: unknown, options?: unknown): Promise<unknown>;
  lastSpokenPhrase(): Promise<string>;
  act(): Promise<void>;
};

/**
 * Moves through the form fields the way a screen reader user does (the structural navigation of Orca) until what Orca
 * says matches; returns what it said. The fixture page has about 30 buttons before the first switch, so this takes a while.
 */
export async function reach(orca: Orca, matcher: RegExp, max = 75): Promise<string> {
  const heard: string[] = [];
  for (let step = 0; step < max; step++) {
    await orca.perform(orcaKeyCodeCommands.StructuralNavigator.NextFormField, { capture: true });
    const said = await orca.lastSpokenPhrase();
    heard.push(said);
    if (matcher.test(said)) return said;
  }
  throw new Error(`Orca never said ${matcher} in ${max} steps; it said: ${heard.join(' | ')}`);
}
