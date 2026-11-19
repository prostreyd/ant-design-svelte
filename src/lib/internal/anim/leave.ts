/** How long a panel waits for an animation that never ends before it is hidden anyway, in ms. */
const FALLBACK_MS = 1000;

/**
 * Waits for the leave animation of `element` to end, then calls `done` once (specs/overlay.md, A1). A panel that is hidden
 * the moment it is asked to close would not leave: it plays its CSS animation first.
 *
 * `done` is called when the element's own leave animation ends or is cancelled (the end of an animation of something inside it, or the
 * cancel of the enter animation that the change of style interrupted, is not the end of this one), after one second if it never ends, and **at once** if the element has no animation to wait for:
 * `animation-name` is `none`, which is what `prefers-reduced-motion` sets and what a stylesheet that was not loaded leaves, or if there is no
 * element at all.
 *
 * Returns the function that cancels the wait: `done` is not called after it. Calling it again, or after `done`, does nothing.
 */
export function waitForLeave(element: HTMLElement | null, done: () => void, fallback: number = FALLBACK_MS): () => void {
  // No element (a panel that is not in the page yet) has nothing to animate: it is gone at once, as with no animation.
  const name = element ? getComputedStyle(element).animationName : 'none';
  if (!element || !name || name === 'none') {
    done();
    return () => {};
  }
  // The animations the element has now are the leave. The enter animation that was still running when the panel was asked to close is cancelled
  // by the change of style, and its `animationcancel` is not the end of the leave: only the events of these names count.
  const names = name.split(',').map((part) => part.trim());
  const cancel = () => {
    element.removeEventListener('animationend', end);
    element.removeEventListener('animationcancel', end);
    clearTimeout(timer);
  };
  const end = (event?: Event) => {
    if (event && event.target !== element) return;
    const named = (event as AnimationEvent | undefined)?.animationName;
    if (named !== undefined && !names.includes(named)) return;
    cancel();
    done();
  };
  element.addEventListener('animationend', end);
  element.addEventListener('animationcancel', end);
  const timer = setTimeout(end, fallback);
  return cancel;
}
