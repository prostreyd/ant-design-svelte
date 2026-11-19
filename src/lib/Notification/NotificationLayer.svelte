<script lang="ts">
  import { portal, resolveContainer } from '../internal/portal/portal.svelte.js';
  import NotificationPlace from './NotificationPlace.svelte';
  import { getSnapshot, subscribe } from './store.js';
  import { NOTIFICATION_PLACEMENTS } from './types.js';

  /**
   * Draws the open notifications: one fixed layer over the window, and in it one list for each place that has a notification.
   * It is used by `NotificationHost` and by the layer the library creates itself when no host is mounted. `hostId` is the id of
   * the host it belongs to, or `undefined` for that layer; the layer draws only while it is the one the store names as active.
   */
  let { hostId }: { hostId: number | undefined } = $props();

  let snap = $state.raw(getSnapshot());
  $effect(() => {
    // A change between the first render and now would otherwise be missed.
    snap = getSnapshot();
    return subscribe(() => {
      snap = getSnapshot();
    });
  });

  const active = $derived(snap.activeHost === hostId);
  const settings = $derived(snap.settings);
  const records = $derived(snap.records);

  // The places that have a notification, in the fixed order of the six. A closing notification still stands in its place. It is only
  // read while the layer is the active one.
  const places = $derived(
    NOTIFICATION_PLACEMENTS.map((placement) => ({
      placement,
      records: records.filter((record) => (record.placement ?? settings.placement) === placement)
    })).filter((place) => place.records.length > 0)
  );

  // The layer lives in the container (the body by default), not where the host sits in the tree: a parent with a transform or a
  // filter would otherwise be the box that `position: fixed` is measured against (`internal/portal`).
  const target = () => resolveContainer(settings.container);
</script>

{#if active && places.length > 0}
  <div class="ads-notification-layer" data-ads-overlay-keep="" {@attach portal(target)}>
    {#each places as place (place.placement)}
      <NotificationPlace placement={place.placement} records={place.records} {settings} />
    {/each}
  </div>
{/if}

<style>
  /* The layer: fixed over the whole window, and transparent to the pointer except for the boxes themselves. */
  .ads-notification-layer {
    position: fixed;
    inset: 0;
    z-index: var(--ads-notification-z-index);
    pointer-events: none;
  }
</style>
