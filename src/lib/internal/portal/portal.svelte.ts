import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

/**
 * Where a panel is moved to (specs/overlay.md, P2): an element, or a function that returns one. A function may take the
 * arguments its owner gives it (Popup passes the anchor). Nothing, from either, means `document.body`.
 */
export type PortalContainer<Args extends unknown[] = []> =
  | HTMLElement
  | ((...args: Args) => HTMLElement | null | undefined)
  | null
  | undefined;

/** The element a container stands for. Browser only: it reads `document`. */
export function resolveContainer<Args extends unknown[]>(container: PortalContainer<Args>, ...args: Args): HTMLElement {
  return (typeof container === 'function' ? container(...args) : container) ?? document.body;
}

/**
 * An attachment that moves its element out of its place in the tree, so that a parent with `overflow: hidden`, a
 * `transform` or a low `z-index` cannot clip or hide it (specs/overlay.md, P1 to P5).
 *
 * `target` says where, and is read reactively: an element moves the element there (as the last child, again each time the
 * target goes from nothing to an element, so that layers of equal z-index stack in the order of opening), a change of the
 * target moves it again, and `null` leaves it where it is. When the owner is destroyed the element is removed from wherever
 * it is: Svelte removes only the nodes it put in place itself, and this one was moved out of them.
 *
 * ```svelte
 * <div {@attach portal(() => (open ? resolveContainer(container) : null))}>...</div>
 * ```
 */
export function portal(target: () => HTMLElement | null | undefined): Attachment<HTMLElement> {
  return (element) => {
    let placed: HTMLElement | null = null;
    const place = (next: HTMLElement | null | undefined) => {
      if (!next) {
        placed = null;
      } else if (placed !== next) {
        next.appendChild(element);
        placed = next;
      }
    };
    // The first placement is made now, not in an effect: an effect of the owner that runs after this attachment (it opens a
    // layer and puts everything outside it out of reach) has to find the element where it will stay.
    place(untrack(target));
    // The attachment runs once; the nested effect is the one that follows `target`.
    $effect(() => place(target()));
    return () => element.remove();
  };
}
