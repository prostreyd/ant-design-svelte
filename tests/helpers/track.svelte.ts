import { flushSync } from 'svelte';

/** Runs `read` inside an effect and records what it returned each time it ran, so a test can see what a change reached. */
export function track<T>(read: () => T): { values: T[]; stop: () => void } {
  const values: T[] = [];
  const stop = $effect.root(() => {
    $effect(() => {
      values.push(read());
    });
  });
  flushSync();
  return { values, stop };
}
