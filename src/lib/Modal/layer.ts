/**
 * The layer the library creates when a static dialog opens and no `ModalHost` is mounted: a `ModalLayer` on the body, made with the
 * first dialog and removed when none is left. A `ModalHost` that is mounted takes the dialogs over, and this layer goes. Nothing
 * happens on a server. The mounting is `internal/layer`; this file says what to mount and when.
 */
import { createLayer } from '../internal/layer/layer.js';
import ModalLayer from './ModalLayer.svelte';
import { getSnapshot, subscribe } from './store.js';

const layer = createLayer({
  component: ModalLayer,
  props: { hostId: undefined },
  wanted: () => {
    const { records, activeHost } = getSnapshot();
    return records.length > 0 && activeHost === undefined;
  },
  subscribe
});

/** Called after every dialog is opened: starts watching the store, and makes the layer if one is needed. */
export const ensureLayer = layer.ensure;

/** Takes the layer away and stops watching. For tests. */
export const removeLayer = layer.remove;
