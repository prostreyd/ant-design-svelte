/** Keyboard helpers of the menu that read the page (specs/menu.md, A11y). */

/**
 * The items of a list that the arrow keys can reach: not disabled, not hidden, not inert (an item that did not fit a bar, a
 * closed inline submenu). `data-ads-hidden` is written beside `inert`, which a browser at the floor does not know.
 */
export function navigableItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
    (item) => item.getAttribute('aria-disabled') !== 'true' && !item.closest('[inert], [hidden], [data-ads-hidden]')
  );
}

/** The text an item is found by when the user types, lower case. */
export function itemText(item: HTMLElement): string {
  const content = item.querySelector('.ads-menu-item-content') ?? item;
  return (content.textContent as string).trim().toLowerCase();
}

/**
 * The index of the next text that starts with what was typed, going forward from `current` and wrapping, or -1.
 * One character, or the same character typed again and again, moves on to the next item that starts with it; a longer
 * text is a prefix and may stay on the current item.
 */
export function matchTypeahead(texts: readonly string[], current: number, typed: string): number {
  if (typed === '') return -1;
  const query = [...typed].every((character) => character === typed[0]) ? typed[0] : typed;
  const start = query.length === 1 ? current + 1 : Math.max(current, 0);
  for (let step = 0; step < texts.length; step++) {
    const index = (start + step) % texts.length;
    if (texts[index].startsWith(query)) return index;
  }
  return -1;
}
