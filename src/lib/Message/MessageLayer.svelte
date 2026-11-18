<script lang="ts">
  import { untrack } from 'svelte';
  import { classList, styleText } from '../internal/semantic.js';
  import MessageItem from './MessageItem.svelte';
  import { playFlip, readTops } from './motion.js';
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

  let hovered = $state(false);
  let focused = $state(false);
  // The pile opens while the pointer or the focus is in it.
  const piled = $derived(collapsed && !hovered && !focused);

  // While a pile is open every timer in it stands still (focus always; the pointer unless a message opted out).
  $effect(() => {
    const open = collapsed && (hovered || focused);
    const list = records;
    const byFocus = focused;
    for (const record of list) setPaused(record.id, 'pile', open && (byFocus || record.pauseOnHover));
    return () => {
      for (const record of list) setPaused(record.id, 'pile', false);
    };
  });

  let content = $state<HTMLElement | null>(null);

  // The rows of a pile that opens or closes change place at once; they slide from where they were (FLIP). The first
  // effect runs before the page changes and reads the places, the second after it and moves the rows back.
  let shown = false;
  let first: Map<string, number> | null = null;
  $effect.pre(() => {
    const next = piled;
    void rows;
    if (next !== shown && content) first = readTops(content);
  });
  $effect(() => {
    const next = piled;
    void rows;
    untrack(() => {
      if (next !== shown && content && first) playFlip(content, first);
      first = null;
      shown = next;
    });
  });

  const top = $derived(typeof settings.top === 'number' ? `${settings.top}px` : settings.top);

  // The layer lives in the container (the body by default), not where the host sits in the tree: a parent with a
  // transform or a filter would otherwise be the box that `position: fixed` is measured against.
  function place(node: HTMLElement): () => void {
    const container = settings.container;
    const target = (typeof container === 'function' ? container() : container) ?? document.body;
    if (node.parentElement !== target) target.appendChild(node);
    // Svelte removes only the nodes it knows about, and this one has been moved out of them.
    return () => node.remove();
  }

  const pointer = (on: boolean) => (event: PointerEvent) => {
    if (event.pointerType !== 'touch') hovered = on;
  };

  function onfocusout(event: FocusEvent): void {
    if (!content?.contains(event.relatedTarget as Node | null)) focused = false;
  }
</script>

{#if active && rows.length > 0}
  <div
    class={classList('ads-message-list', settings.classNames.list)}
    style={styleText(top !== undefined && `top: ${top}`, settings.styles.list)}
    data-ads-overlay-keep=""
    {@attach place}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={classList(
        'ads-message-list-content',
        stacked && 'ads-message-stack',
        piled && 'ads-message-piled',
        settings.classNames.listContent
      )}
      style={styleText(settings.styles.listContent)}
      bind:this={content}
      onpointerenter={pointer(true)}
      onpointerleave={pointer(false)}
      onfocusin={() => (focused = true)}
      {onfocusout}
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
