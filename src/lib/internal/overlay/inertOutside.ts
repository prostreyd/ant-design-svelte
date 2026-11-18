/** The attribute that keeps an element out of `hideOutside`: it is not part of the layer, but it must stay reachable. */
export const KEEP_ATTRIBUTE = 'data-ads-overlay-keep';

/** Elements that are never on screen and need no mark. */
const NOT_RENDERED = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT', 'META']);

/** What an element looked like before the first layer hid it, and how many layers hold it hidden. */
interface Hold {
  count: number;
  wasInert: boolean;
  ariaHidden: string | null;
  /** `aria-hidden` was written because the engine does not know `inert`. */
  wroteAria: boolean;
}

const holds = new Map<Element, Hold>();

/** `inert` is known to the engine (Chromium 102, Firefox 112, Safari 15.5); below that the attribute does nothing. */
const supportsInert = (): boolean => 'inert' in HTMLElement.prototype;

function hide(element: Element): void {
  let hold = holds.get(element);
  if (!hold) {
    hold = { count: 0, wasInert: element.hasAttribute('inert'), ariaHidden: element.getAttribute('aria-hidden'), wroteAria: false };
    if (!hold.wasInert) element.setAttribute('inert', '');
    if (!supportsInert()) {
      element.setAttribute('aria-hidden', 'true');
      hold.wroteAria = true;
    }
    holds.set(element, hold);
  }
  hold.count++;
}

function show(element: Element): void {
  const hold = holds.get(element);
  if (!hold || --hold.count > 0) return;
  holds.delete(element);
  if (!hold.wasInert) element.removeAttribute('inert');
  if (hold.wroteAria) {
    if (hold.ariaHidden === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', hold.ariaHidden);
  }
}

/**
 * Puts everything outside `scope` out of reach of the keyboard, the pointer and assistive technology while a layer is open
 * (specs/overlay.md, O2): the siblings of `scope` and of each of its ancestors, up to the body, get `inert`, and
 * `aria-hidden="true"` as well where the engine does not know `inert`.
 *
 * An element that was already inert or `aria-hidden` gets its own value back. A hold is counted per element, so layers may
 * close in any order. What is added to the page after the call (the list of a Select, a Tooltip) is not touched: it comes
 * from inside the layer. An element with `data-ads-overlay-keep` is never touched. Returns the function that lets go.
 */
export function hideOutside(scope: HTMLElement): () => void {
  const held: Element[] = [];
  for (let node: HTMLElement = scope; node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || NOT_RENDERED.has(sibling.tagName) || sibling.hasAttribute(KEEP_ATTRIBUTE)) continue;
      hide(sibling);
      held.push(sibling);
    }
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of held) show(element);
  };
}
