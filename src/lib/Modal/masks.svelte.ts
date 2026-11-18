// The masks of the open Modals, in the order they opened (specs/modal.md, P21). Only the lowest one draws its mask: a Modal
// opened over another one adds no second dimming layer, so the page behind is as dark as it was. The upper Modal is still
// modal: its layer covers the page and its dialog stands above the mask of the lower one.
import { untrack } from 'svelte';

const order = $state<number[]>([]);
let nextId = 0;

/** Claims a mask for a Modal that is shown; returns its id and the function that gives it back. */
export function claimMask(): { id: number; release: () => void } {
  const id = ++nextId;
  // Changing the list must not make the caller depend on it: the caller is an effect that only holds the claim.
  untrack(() => order.push(id));
  return { id, release: () => untrack(() => order.splice(0, order.length, ...order.filter((other) => other !== id))) };
}

/** Whether the mask of this Modal is covered by a Modal that opened before it. */
export function maskCovered(id: number): boolean {
  return order[0] !== id;
}
