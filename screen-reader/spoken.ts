/**
 * What Orca said, without the words it adds around what a test asserts.
 *
 * - "tab. ": it says this for each Tab key press.
 * - "main content. " at the start: the name of the landmark, which Orca says when the focus comes into the main region of
 *   the page from outside of it. Whether the phrase carries it depends on where Orca thought the focus was before, and that
 *   differs from run to run on the same page (a first attempt on GitHub said it, the retry of the same commit did not), so a
 *   test that is about a control must not depend on it. Only a leading landmark is removed: the same words inside a phrase
 *   are something Orca said about the page and stay.
 */
export function cleanSpoken(phrase: string): string {
  return phrase.replace(/tab\. /g, '').replace(/^main content\. /, '');
}
