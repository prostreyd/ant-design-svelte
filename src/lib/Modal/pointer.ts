/**
 * Where the last click was, so that a Modal can zoom in from it (specs/modal.md, P9). One listener on the document, there
 * while at least one Modal exists. A click is "recent" for 300 ms: a Modal opened by the click opens in the same task, and one
 * opened later (a timer, a request) zooms from the middle. A click that came from the keyboard (`detail` 0) has no place.
 */
const RECENT = 300;

interface Press {
  x: number;
  y: number;
  at: number;
}

let last: Press | null = null;
let users = 0;

function onClick(event: MouseEvent): void {
  last = event.detail === 0 ? null : { x: event.clientX, y: event.clientY, at: performance.now() };
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

/** The point of a click that happened a moment ago, or `null`. */
export function recentPress(): { x: number; y: number } | null {
  return last && performance.now() - last.at <= RECENT ? { x: last.x, y: last.y } : null;
}
