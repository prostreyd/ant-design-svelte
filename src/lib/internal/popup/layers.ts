/**
 * The registry of open popups (specs/popup.md, R9 and R13).
 *
 * It owns the two document listeners every popup needs, so that there is one of each however many popups
 * are open: a press outside closes the popups it is outside of, and Escape closes the topmost one only.
 * A popup opened from inside another popup (a Select inside a Popover) is its child: a press in the child
 * is inside the parent as well, so the parent stays open while the child is used.
 */

export type DismissReason = 'outsidePress' | 'escape';

export interface Layer {
  /** Unique id of the popup. */
  id: string;
  /** The positioned panel, or `null` while it does not exist. */
  panel: () => HTMLElement | null;
  /** The element the popup is anchored to, or `null` for a point or no anchor. A press on it is not outside. */
  anchor: () => HTMLElement | null;
  /** Whether an outside press closes this popup. */
  outsidePress: () => boolean;
  /** Whether Escape closes this popup. */
  escape: () => boolean;
  /** Ask the popup to close. The popup decides (a controlled popup may refuse). */
  dismiss: (reason: DismissReason) => void;
}

const stack: Layer[] = [];

/** The open popups, the oldest first. The last one is the topmost. */
export function openLayers(): readonly Layer[] {
  return stack;
}

export function topmostLayer(): Layer | undefined {
  return stack[stack.length - 1];
}

/** The popup whose panel contains the anchor of `layer`: the one it was opened from. */
function parentOf(layer: Layer): Layer | undefined {
  const anchor = layer.anchor();
  if (!anchor) return undefined;
  for (let index = stack.length - 1; index >= 0; index--) {
    const candidate = stack[index];
    if (candidate !== layer && candidate.panel()?.contains(anchor)) return candidate;
  }
  return undefined;
}

/** Whether `target` belongs to the popup: its panel, its anchor, or any popup opened from it. */
export function isInsideLayer(layer: Layer, target: Node): boolean {
  if (layer.panel()?.contains(target) || layer.anchor()?.contains(target)) return true;
  return stack.some((other) => other !== layer && parentOf(other) === layer && isInsideLayer(other, target));
}

function onPointerDown(event: PointerEvent): void {
  // A press on the document always has a node as its target.
  const target = event.target as Node;
  // Topmost first. A copy, because a dismissal may unregister a layer.
  for (const layer of [...stack].reverse()) {
    if (layer.outsidePress() && !isInsideLayer(layer, target)) layer.dismiss('outsidePress');
  }
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
  const top = topmostLayer();
  if (!top || !top.escape()) return;
  // The key did its job: stop it from also clearing a search field or closing something below.
  event.preventDefault();
  top.dismiss('escape');
}

function listen(): void {
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);
}

function unlisten(): void {
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeyDown);
}

/** Adds a popup to the stack as the topmost one. Returns the function that removes it. */
export function registerLayer(layer: Layer): () => void {
  stack.push(layer);
  if (stack.length === 1) listen();
  return () => {
    const index = stack.indexOf(layer);
    if (index === -1) return;
    stack.splice(index, 1);
    if (stack.length === 0) unlisten();
  };
}
