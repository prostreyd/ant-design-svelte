/**
 * The layer the library creates when a message opens and no `MessageHost` is mounted: a `MessageLayer` on the body, made with
 * the first message and removed when none is left. A `MessageHost` that is mounted takes the messages over, and this layer
 * goes. Nothing happens on a server. The mounting is `internal/layer`; this file says what to mount and when.
 */
import { createLayer } from '../internal/layer/layer.js';
import MessageLayer from './MessageLayer.svelte';
import { getSnapshot, subscribe } from './store.js';

const layer = createLayer({
  component: MessageLayer,
  props: { hostId: undefined },
  wanted: () => {
    const { records, activeHost } = getSnapshot();
    return records.length > 0 && activeHost === undefined;
  },
  subscribe
});

/** Called after every message is opened: starts watching the store, and makes the layer if one is needed. */
export const ensureLayer = layer.ensure;

/** Takes the layer away and stops watching. For tests. */
export const removeLayer = layer.remove;
