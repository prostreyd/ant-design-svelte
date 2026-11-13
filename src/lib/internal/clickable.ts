/**
 * Makes WebKit send the `click` of a tap to an element that is not a link, a button or a field.
 *
 * In WebKit a tap on such an element sends no `click` (and no `mousedown`) unless the element has a click listener
 * of its own, a `tabindex` or an `onclick` attribute. Svelte does not put the listener of `onclick` on the element:
 * it puts one on the document (event delegation), which WebKit does not count, so a `div` with an `onclick` in
 * Svelte cannot be tapped. An empty listener on the element itself is enough; the real handler stays where it is.
 * Use it as `use:clickable` on an element whose `onclick` is the only way to act on it, such as an option of a list.
 */
const noop = (): void => {};

export function clickable(node: HTMLElement): void {
  node.addEventListener('click', noop);
}
