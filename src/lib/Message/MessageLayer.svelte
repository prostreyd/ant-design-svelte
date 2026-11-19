<script lang="ts">
  import { classList, styleText } from '../internal/semantic.js';
  import { createPile } from '../internal/pile/pile.svelte.js';
  import { portal, resolveContainer } from '../internal/portal/portal.svelte.js';
  import MessageItem from './MessageItem.svelte';
  import { getSnapshot, setPaused, subscribe } from './store.js';

  /**
   * Draws the open messages: a fixed layer at the top of the window, with one row for each. It is used by `MessageHost`
   * and by the layer the library creates itself when no host is mounted. `hostId` is the id of the host it belongs to,
   * or `undefined` for that layer; the layer draws only while it is the one the store names as active.
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
  const records = $derived(active ? snap.records : []);
  const stacked = $derived(settings.stack.enabled);
  const openCount = $derived(records.filter((record) => record.state === 'open').length);
  // With `stack` the newest message is the first row, and past the threshold the rows lie behind it as a pile.
  const collapsed = $derived(stacked && openCount > settings.stack.threshold);
  const rows = $derived(stacked ? [...records].reverse() : records);

  // The pile (specs/overlay.md, `pile/`): the pointer or the focus opens it, the timers wait while it is open, the rows
  // slide when it opens or closes. The look of it is the CSS below and in `MessageItem.svelte`.
  const pile = createPile({ collapsed: () => collapsed, records: () => records, rows: () => rows, setPaused });
  const piled = $derived(pile.piled);

  const top = $derived(typeof settings.top === 'number' ? `${settings.top}px` : settings.top);

  // The layer lives in the container (the body by default), not where the host sits in the tree: a parent with a
  // transform or a filter would otherwise be the box that `position: fixed` is measured against (`internal/portal`).
  const target = () => resolveContainer(settings.container);
</script>

{#if active && rows.length > 0}
  <div
    class={classList('ads-message-list', settings.classNames.list)}
    style={styleText(top !== undefined && `top: ${top}`, settings.styles.list)}
    data-ads-overlay-keep=""
    {@attach portal(target)}
  >
    <div
      class={classList(
        'ads-message-list-content',
        stacked && 'ads-message-stack',
        piled && 'ads-message-piled',
        settings.classNames.listContent
      )}
      style={styleText(settings.styles.listContent)}
      {@attach pile.attach}
    >
      {#each rows as record, index (record.id)}
        <MessageItem {record} {index} {settings} {piled} {stacked} />
      {/each}
    </div>
  </div>
{/if}

<style>
  /* The layer: fixed at the top, the full width, transparent to the pointer except for the boxes themselves. */
  .ads-message-list {
    position: fixed;
    inset-block-start: var(--ads-message-top);
    inset-inline: 0;
    z-index: var(--ads-message-z-index);
    box-sizing: border-box;
    padding-inline: var(--ads-message-margin-inline);
    pointer-events: none;
  }

  .ads-message-list-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* A pile: every row in the same cell, the first one on top (the rows are lowered and scaled by their own style). */
  .ads-message-list-content:global(.ads-message-piled) {
    display: grid;
    justify-items: center;
    align-items: start;
  }
</style>
