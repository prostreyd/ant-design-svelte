/**
 * The layer the library creates when a static dialog opens and no `ModalHost` is mounted: a `ModalLayer` on the body, made with the
 * first dialog and removed when none is left. A `ModalHost` that is mounted takes the dialogs over, and this layer goes. Nothing
 * happens on a server.
 */
import { mount, unmount } from 'svelte';
import ModalLayer from './ModalLayer.svelte';
import { getSnapshot, subscribe } from './store.js';

let layer: Record<string, unknown> | null = null;
let stop: (() => void) | null = null;

function sync(): void {
  const { records, activeHost } = getSnapshot();
  const needed = records.length > 0 && activeHost === undefined;
  if (needed && layer === null) {
    layer = mount(ModalLayer, { target: document.body, props: { hostId: undefined } });
  } else if (!needed && layer !== null) {
    const done = layer;
    layer = null;
    void unmount(done);
  }
}

let scheduled = false;

/**
 * A change that comes while a component is being torn down (a host that unmounts and hands the dialogs back) must not mount a component
 * in the middle of that: Svelte forbids creating effects there. It waits for the next microtask.
 */
function later(): void {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    sync();
  });
}

/** Called after every dialog is opened: starts watching the store, and makes the layer if one is needed. */
export function ensureLayer(): void {
  if (typeof document === 'undefined') return;
  stop ??= subscribe(later);
  sync();
}

/** Takes the layer away and stops watching. For tests. */
export function removeLayer(): void {
  stop?.();
  stop = null;
  if (layer !== null) {
    void unmount(layer);
    layer = null;
  }
}
