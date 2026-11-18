<script lang="ts">
  import StaticDialog from './StaticDialog.svelte';
  import { getSnapshot, subscribe } from './store.js';

  /**
   * Draws the static dialogs that are open. It is used by `ModalHost` and by the layer the library creates itself when no host is
   * mounted. `hostId` is the id of the host it belongs to, or `undefined` for that layer; it draws only while it is the one the store
   * names as active. The dialogs are drawn where this component stands (so that they see the context of the app), and each one moves
   * its own layer into the body.
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

  const records = $derived(snap.activeHost === hostId ? snap.records : []);
</script>

{#each records as record (record.id)}
  <StaticDialog {record} />
{/each}
