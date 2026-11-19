/**
 * The layer the library creates when a notification opens and no `NotificationHost` is mounted: a `NotificationLayer` on the body,
 * made with the first notification and removed when none is left. A `NotificationHost` that is mounted takes the notifications
 * over, and this layer goes. Nothing happens on a server. The mounting is `internal/layer`; this file says what to mount and when.
 */
import { createLayer } from '../internal/layer/layer.js';
import NotificationLayer from './NotificationLayer.svelte';
import { getSnapshot, subscribe } from './store.js';

const layer = createLayer({
  component: NotificationLayer,
  props: { hostId: undefined },
  wanted: () => {
    const { records, activeHost } = getSnapshot();
    return records.length > 0 && activeHost === undefined;
  },
  subscribe
});

/** Called after every notification is opened: starts watching the store, and makes the layer if one is needed. */
export const ensureLayer = layer.ensure;

/** Takes the layer away and stops watching. For tests. */
export const removeLayer = layer.remove;
