/**
 * Where the last click was, so that a Modal can zoom in from it (specs/modal.md, P9). One listener on the document, there
 * while at least one Modal exists. A click is the press of a Modal that opens **in the same task** (the effects of a flush run as
 * microtasks, before the next task, so however long a slow page or a busy machine takes to show the Modal, it was opened by the
 * click), or within 300 ms of it; one opened later (a timer, a request) zooms from the middle. A click that came from the
 * keyboard (`detail` 0) has no place.
 */
const RECENT = 300;

interface Press {
  x: number;
  y: number;
  at: number;
  /** True until the task of the click is over. */
  sameTask: boolean;
}

let last: Press | null = null;
let users = 0;

function onClick(event: MouseEvent): void {
  if (event.detail === 0) {
    last = null;
    return;
  }
  const press: Press = { x: event.clientX, y: event.clientY, at: performance.now(), sameTask: true };
  last = press;
  setTimeout(() => (press.sameTask = false), 0);
}

/** Starts listening; returns the function that stops. Browser only. */
export function trackPress(): () => void {
  users++;
  if (users === 1) document.addEventListener('click', onClick, true);
  return () => {
    users--;
    if (users === 0) {
      document.removeEventListener('click', onClick, true);
      last = null;
    }
  };
}

/** The point of a click that is still being handled, or that happened a moment ago, or `null`. */
export function recentPress(): { x: number; y: number } | null {
  return last && (last.sameTask || performance.now() - last.at <= RECENT) ? { x: last.x, y: last.y } : null;
}
