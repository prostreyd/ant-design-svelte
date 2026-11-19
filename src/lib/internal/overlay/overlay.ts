import { focusQuietly } from './focus.js';
import { hideOutside } from './inertOutside.js';
import { lockScroll } from './scrollLock.js';
import { registerOverlay, type OverlayDismissReason } from './stack.js';

export interface OverlayOptions {
  /** The box that keeps focus. It needs `tabindex="-1"` when it is the element focus goes to. */
  root: HTMLElement;
  /** What the layer is made of (the mask and the box); everything outside it is put out of reach. Default `root`. */
  scope?: HTMLElement;
  /** The container whose scroll is locked, `false` for none. Default `document.body`. */
  lockScroll?: HTMLElement | false;
  /** Put the page behind the layer out of reach. Default `true`. */
  inertOutside?: boolean;
  /** Keep Tab inside `root`. Default `true`. */
  trapFocus?: boolean;
  /** Where focus goes when the layer opens: an element, or a function that returns one. Default `root`. */
  initialFocus?: HTMLElement | (() => HTMLElement | null | undefined) | null;
  /** Give focus back to what had it before the layer opened. Default `true`. */
  restoreFocus?: boolean;
  /** Whether Escape closes the layer. Default: always. */
  escape?: () => boolean;
  /** Called when Escape asks the layer to close, with the key, which is not cancelled yet (the stack cancels it after the call). */
  dismiss?: (reason: OverlayDismissReason, event: KeyboardEvent) => void;
}

/** Runs every step, even when one throws, and throws the first error at the end. */
function runAll(steps: (() => void)[]): void {
  let failure: { error: unknown } | null = null;
  for (const step of steps) {
    try {
      step();
    } catch (error) {
      failure ??= { error };
    }
  }
  if (failure) throw failure.error;
}

/**
 * Makes a layer modal (specs/overlay.md, O5): remembers what has focus, joins the stack that gives Escape and Tab to the
 * topmost layer, moves focus in, and only then puts the page behind the layer out of reach and locks the scroll: where the
 * engine does not know `inert` the page gets `aria-hidden`, and a browser does not accept that on an ancestor of the element
 * that has focus (it reports it and ignores it). The function it returns undoes all of it in the reverse order, and gives
 * focus back last, once the page is reachable again. A step that throws undoes the ones before it.
 *
 * Call it from an effect, while the layer is open, and return what it returns: it touches the DOM.
 */
export function openOverlay(options: OverlayOptions): () => void {
  const { root, scope = root } = options;
  const undo: (() => void)[] = [];
  const close = () => runAll(undo.splice(0).reverse());
  try {
    const active = document.activeElement;
    const previous = active instanceof HTMLElement && active !== document.body ? active : null;
    undo.push(() => {
      if (options.restoreFocus === false || !previous || !previous.isConnected) return;
      // Where focus is now decides: inside the layer or lost on the body, it comes back; anywhere else, somebody put it there.
      const now = document.activeElement;
      if (!now || now === document.body || root.contains(now)) focusQuietly(previous);
    });
    undo.push(
      registerOverlay({
        root: () => root,
        escape: options.escape ?? (() => true),
        trap: () => options.trapFocus !== false,
        dismiss: (reason, event) => options.dismiss?.(reason, event)
      })
    );
    const initial = typeof options.initialFocus === 'function' ? options.initialFocus() : options.initialFocus;
    focusQuietly(initial ?? root);
    if (options.inertOutside !== false) undo.push(hideOutside(scope));
    if (options.lockScroll !== false) undo.push(lockScroll(options.lockScroll));
  } catch (error) {
    close();
    throw error;
  }
  return close;
}
