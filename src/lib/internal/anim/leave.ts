/** How long a panel waits for an animation that never ends before it is hidden anyway, in ms. */
const FALLBACK_MS = 1000;

/**
 * Waits for the leave animation of `element` to end, then calls `done` once (specs/overlay.md, A1). A panel that is hidden
 * the moment it is asked to close would not leave: it plays its CSS animation first.
 *
 * `done` is called when the element's own animation ends or is cancelled (the end of an animation of something inside it is
 * not the end of this one), after one second if it never ends, and **at once** if the element has no animation to wait for:
 * `animation-name` is `none`, which is what `prefers-reduced-motion` sets and what a stylesheet that was not loaded leaves.
 *
 * Returns the function that cancels the wait: `done` is not called after it. Calling it again, or after `done`, does nothing.
 */
export function waitForLeave(element: HTMLElement, done: () => void, fallback: number = FALLBACK_MS): () => void {
  const name = getComputedStyle(element).animationName;
  if (!name || name === 'none') {
    done();
    return () => {};
  }
  const cancel = () => {
    element.removeEventListener('animationend', end);
    element.removeEventListener('animationcancel', end);
    clearTimeout(timer);
  };
  const end = (event?: Event) => {
    if (event && event.target !== element) return;
    cancel();
    done();
  };
  element.addEventListener('animationend', end);
  element.addEventListener('animationcancel', end);
  const timer = setTimeout(end, fallback);
  return cancel;
}
