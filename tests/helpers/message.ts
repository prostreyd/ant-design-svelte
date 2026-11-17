import { tick } from 'svelte';
import { vi } from 'vitest';

/** The boxes of the open messages, in the order of the page. */
export const boxes = () => [...document.querySelectorAll<HTMLElement>('.ads-message')];

/** The text of each box with white space collapsed. */
export const texts = () => boxes().map((box) => box.textContent?.replace(/\s+/g, ' ').trim());

export const slots = () => [...document.querySelectorAll<HTMLElement>('.ads-message-slot')];

/** Moves the fake clock and lets Svelte flush. */
export async function settle(ms = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await tick();
}

/** A pointer event of a kind jsdom does not build: an `Event` with the field the code reads. */
export function pointer(target: Element, type: 'pointerenter' | 'pointerleave', pointerType = 'mouse'): void {
  target.dispatchEvent(Object.assign(new Event(type), { pointerType }));
}
