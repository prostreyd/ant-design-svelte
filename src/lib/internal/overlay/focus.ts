/** What takes focus by itself, with no `tabindex`. */
const NATIVE = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])'
].join(',');

/**
 * The `tabindex` of an element as a number, or `null` when it has none or it is not a number. The attribute is read, not the
 * `tabIndex` property: the property of a `contenteditable` element or of a player is `-1` in some engines and `0` in others.
 */
function tabIndexOf(element: HTMLElement): number | null {
  const value = Number.parseInt(element.getAttribute('tabindex') ?? '', 10);
  return Number.isNaN(value) ? null : value;
}

/** Not displayed: `display: none` on the element or on an ancestor below `root`, or `visibility: hidden` on it. */
function isHidden(element: HTMLElement, root: HTMLElement): boolean {
  if (getComputedStyle(element).visibility === 'hidden') return true;
  for (let node: HTMLElement | null = element; node && node !== root; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return true;
  }
  return false;
}

function isTabbable(element: HTMLElement, root: HTMLElement): boolean {
  const index = tabIndexOf(element);
  // A negative `tabindex` takes an element out of the Tab order; an element with none is in it only if it takes focus by itself.
  if (index === null ? !element.matches(NATIVE) : index < 0) return false;
  if (element.matches(':disabled') || element.closest('[hidden], [inert]')) return false;
  if (element instanceof HTMLInputElement && element.type === 'hidden') return false;
  return !isHidden(element, root);
}

/** What Tab reaches inside `root`, in document order (specs/overlay.md, O3). `tabindex` above 0 is not reordered. */
export function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`${NATIVE},[tabindex]`)).filter((element) => isTabbable(element, root));
}

/** Focus without scrolling the page: a layer is fixed, and what it comes back to is where the user left it. */
export function focusQuietly(element: HTMLElement): void {
  element.focus({ preventScroll: true });
}

/**
 * Keeps Tab and Shift+Tab inside `root`: Tab on the last element goes to the first, Shift+Tab on the first goes to the last,
 * and a Tab while focus is on the body (after a press on the mask) goes in. A layer with nothing to focus keeps focus on
 * itself. Focus that is on something outside `root` but not on the body (a list a Select opened in `body`) is left alone:
 * it belongs to a popup that came from inside the layer.
 */
export function wrapTab(root: HTMLElement, event: KeyboardEvent): void {
  const items = tabbables(root);
  const active = document.activeElement;
  const onBody = !active || active === document.body || active === document.documentElement;
  if (!onBody && !root.contains(active)) return;
  if (items.length === 0) {
    event.preventDefault();
    focusQuietly(root);
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (onBody) {
    event.preventDefault();
    focusQuietly(event.shiftKey ? last : first);
  } else if (event.shiftKey && (active === first || active === root)) {
    event.preventDefault();
    focusQuietly(last);
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    focusQuietly(first);
  }
}
