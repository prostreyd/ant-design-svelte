import { wrapTab } from './focus.js';

export type OverlayDismissReason = 'escape';

/** An open layer, as the stack sees it. */
export interface OverlayLayer {
  /** The box that keeps focus; `null` while it does not exist. */
  root: () => HTMLElement | null;
  /** Whether Escape closes this layer. */
  escape: () => boolean;
  /** Whether Tab is kept inside `root`. */
  trap: () => boolean;
  /** Ask the layer to close. The layer decides: a controlled one may refuse. */
  dismiss: (reason: OverlayDismissReason) => void;
}

const stack: OverlayLayer[] = [];

/** The open layers, the oldest first. The last one is the topmost. */
export function openOverlays(): readonly OverlayLayer[] {
  return stack;
}

function onKeyDown(event: KeyboardEvent): void {
  // A key that was already handled (a popup that used Escape says so with `preventDefault`) or that ends an IME
  // composition is not for the layer.
  if (event.defaultPrevented || event.isComposing) return;
  // The listener exists only while a layer is open.
  const top = stack[stack.length - 1] as OverlayLayer;
  if (event.key === 'Escape') {
    if (!top.escape()) return;
    event.preventDefault();
    top.dismiss('escape');
  } else if (event.key === 'Tab' && top.trap()) {
    const root = top.root();
    if (root) wrapTab(root, event);
  }
}

/**
 * Adds a layer to the stack as the topmost one. Escape and Tab go to the topmost layer only (specs/overlay.md, O4), so a
 * second Modal over the first does not have two traps. One listener serves them all, on `window`: it runs after the
 * listener of the popups on `document`, which is how Escape in a Select inside a Modal closes the Select first.
 * Returns the function that removes the layer.
 */
export function registerOverlay(layer: OverlayLayer): () => void {
  stack.push(layer);
  if (stack.length === 1) window.addEventListener('keydown', onKeyDown);
  return () => {
    const index = stack.indexOf(layer);
    if (index === -1) return;
    stack.splice(index, 1);
    if (stack.length === 0) window.removeEventListener('keydown', onKeyDown);
  };
}
