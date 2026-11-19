import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { playFlip, readTops } from '../anim/motion.js';
import type { PauseReason } from '../list/listStore.js';

/** What the pile needs to know of a record: which timer to hold, and whether the pointer holds it. */
export interface PileRecord {
  readonly id: number;
  readonly pauseOnHover: boolean;
}

export interface PileOptions {
  /** The list is long enough to lie in a pile (past the threshold, and `stack` is on). Read reactively. */
  collapsed: () => boolean;
  /** The records of the list. While the pile is open their timers stand still. Read reactively. */
  records: () => readonly PileRecord[];
  /** Anything that changes when the rows change. It lets the rows slide into their new places. Read reactively. */
  rows: () => unknown;
  /** Holds or releases the timer of a record for a reason (`setPaused` of the list, specs/overlay.md, LS4). */
  setPaused: (id: number, reason: PauseReason, on: boolean) => void;
}

export interface Pile {
  /** The list lies in a pile now: it is collapsed and neither the pointer nor the focus has opened it. */
  readonly piled: boolean;
  /** For the element that holds the rows. It listens to the pointer and the focus, and forgets them when it goes away. */
  readonly attach: Attachment<HTMLElement>;
}

/**
 * The behavior of a list that lies in a pile past a threshold (specs/overlay.md, PL1 to PL6): the pointer or the focus opens
 * it, the timers wait while it is open, the rows slide when it opens or closes, and what the pointer and the focus did is
 * forgotten with the element. What a pile looks like (offsets, scale, the way it leans) is the CSS of the component.
 *
 * It makes effects, so it is called while a component initializes, once for each list that can pile.
 *
 * ```svelte
 * const pile = createPile({ collapsed: () => collapsed, records: () => records, rows: () => rows, setPaused });
 * <div {@attach pile.attach} class:piled={pile.piled}>...</div>
 * ```
 */
export function createPile(options: PileOptions): Pile {
  let hovered = $state(false);
  let focused = $state(false);
  let content = $state<HTMLElement | null>(null);

  // The pile opens while the pointer or the focus is in it.
  const piled = $derived(options.collapsed() && !hovered && !focused);

  // While a pile is open every timer in it stands still (focus always; the pointer unless a record opted out).
  $effect(() => {
    const open = options.collapsed() && (hovered || focused);
    const list = options.records();
    const byFocus = focused;
    for (const record of list) options.setPaused(record.id, 'pile', open && (byFocus || record.pauseOnHover));
    return () => {
      for (const record of list) options.setPaused(record.id, 'pile', false);
    };
  });

  // The rows of a pile that opens or closes change place at once; they slide from where they were (FLIP). The first
  // effect runs before the page changes and reads the places (only when the pile has just opened or closed), the second
  // after it and moves the rows back if the first one read any.
  let shown = false;
  let first: Map<string, number> | null = null;
  $effect.pre(() => {
    const next = piled;
    void options.rows();
    if (next !== shown && content) first = readTops(content);
  });
  $effect(() => {
    const next = piled;
    void options.rows();
    untrack(() => {
      if (content && first) playFlip(content, first);
      first = null;
      shown = next;
    });
  });

  const attach: Attachment<HTMLElement> = (node) => {
    content = node;

    const pointer = (on: boolean) => (event: Event) => {
      if ((event as PointerEvent).pointerType !== 'touch') hovered = on;
    };
    const enter = pointer(true);
    const leave = pointer(false);
    const focusin = (): void => {
      focused = true;
    };
    const focusout = (event: FocusEvent): void => {
      if (!node.contains(event.relatedTarget as Node | null)) focused = false;
    };

    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('focusin', focusin);
    node.addEventListener('focusout', focusout);

    return () => {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focusin', focusin);
      node.removeEventListener('focusout', focusout);
      // The element goes away with its last row, and a removed element sends no `pointerleave` and no `focusout`.
      // What the pointer and the focus did to it is forgotten with it; otherwise the next pile would open already
      // held by a pointer that is no longer there.
      content = null;
      hovered = false;
      focused = false;
    };
  };

  return {
    get piled() {
      return piled;
    },
    attach
  };
}

/**
 * An attachment that sets the attribute `inert` on its element while `active()` is true, and takes it off otherwise (read
 * reactively). The attribute and not the property: a browser without `inert` ignores a property it does not know, and there
 * only the elements the owner takes out of the Tab order by hand stay out of it.
 */
export function inertWhen(active: () => boolean): Attachment<HTMLElement> {
  return (node) => {
    node.toggleAttribute('inert', active());
  };
}
