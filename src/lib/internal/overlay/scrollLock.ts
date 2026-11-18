/** The inline values of the properties a lock writes, so that they can be put back exactly. */
type Saved = Map<string, string>;

/** What a container looked like before it was locked, and how many layers hold the lock. */
interface Lock {
  count: number;
  /** The container, and the page element (`html`) when the container is the body. */
  elements: { element: HTMLElement; saved: Saved }[];
}

const locks = new Map<HTMLElement, Lock>();

function save(element: HTMLElement, names: string[]): Saved {
  return new Map(names.map((name) => [name, element.style.getPropertyValue(name)]));
}

/** The width of the vertical scrollbar of the container, in px: what the page gains when the scrollbar goes away. */
function scrollbarWidth(container: HTMLElement): number {
  if (container === document.body) return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  const style = getComputedStyle(container);
  const borders = (parseFloat(style.borderInlineStartWidth) || 0) + (parseFloat(style.borderInlineEndWidth) || 0);
  return Math.max(0, container.offsetWidth - container.clientWidth - borders);
}

/**
 * Stops the container from scrolling while a layer is open, and keeps the page from jumping sideways when its scrollbar
 * goes away (specs/overlay.md, O1): `overflow: hidden`, and the width of the scrollbar added to `padding-inline-end`.
 *
 * For the body the `overflow` goes on `html` as well. Which of the two scrolls the page depends on the stylesheet: the
 * `overflow` of the body reaches the window only while `html` has none of its own, and a page that sets `overflow-y:
 * scroll` on `html` (to keep its scrollbar from coming and going) would not be locked by the body alone.
 *
 * It is counted per container: two layers lock once, and the last one to be released puts back exactly the inline values the
 * container had, empty ones included. A page with no scrollbar gets no padding. Returns the function that releases this
 * hold; calling it twice does nothing.
 *
 * Not handled, and said in the specification: iOS Safari before 16, which scrolls a page with `overflow: hidden` under a
 * finger.
 */
export function lockScroll(container: HTMLElement = document.body): () => void {
  let lock = locks.get(container);
  if (!lock) {
    lock = { count: 0, elements: [] };
    const own = { element: container, saved: save(container, ['overflow-x', 'overflow-y', 'padding-inline-end']) };
    lock.elements.push(own);
    // Measured before `overflow: hidden` takes the scrollbar away.
    const bar = scrollbarWidth(container);
    if (bar > 0) {
      const padding = parseFloat(getComputedStyle(container).paddingInlineEnd) || 0;
      container.style.setProperty('padding-inline-end', `${padding + bar}px`);
    }
    container.style.setProperty('overflow', 'hidden');
    if (container === document.body) {
      const page = document.documentElement;
      lock.elements.push({ element: page, saved: save(page, ['overflow-x', 'overflow-y']) });
      page.style.setProperty('overflow', 'hidden');
    }
    locks.set(container, lock);
  }
  const held = lock;
  held.count++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--held.count > 0) return;
    locks.delete(container);
    for (const { element, saved } of held.elements) {
      for (const [name, value] of saved) {
        if (value) element.style.setProperty(name, value);
        else element.style.removeProperty(name);
      }
    }
  };
}
