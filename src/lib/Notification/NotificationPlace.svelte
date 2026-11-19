<script lang="ts">
  import { classList, styleText } from '../internal/semantic.js';
  import { createPile } from '../internal/pile/pile.svelte.js';
  import NotificationItem from './NotificationItem.svelte';
  import { setPaused, type NotificationRecord, type NotificationSettings } from './store.js';
  import type { NotificationPlacement } from './types.js';

  /**
   * One place of the window: the list of the notifications that stand there. A place that has none is not drawn, so its pile and its
   * scroll position are forgotten with it. The six places are drawn by `NotificationLayer`.
   */
  let {
    placement,
    records,
    settings
  }: { placement: NotificationPlacement; records: readonly NotificationRecord[]; settings: NotificationSettings } = $props();

  const bottom = $derived(placement === 'bottom' || placement === 'bottomLeft' || placement === 'bottomRight');
  const stacked = $derived(settings.stack.enabled);
  const openCount = $derived(records.filter((record) => record.state === 'open').length);
  // Past the threshold the rows lie behind the newest as a pile.
  const collapsed = $derived(stacked && openCount > settings.stack.threshold);
  // The newest stands nearest the window edge and the older ones away from it: first at a top place, last at a bottom place. The
  // rows are in the order they are drawn, so the reading order and the Tab order are the drawn order.
  const rows = $derived(bottom ? records : [...records].reverse());

  // The pile (specs/overlay.md, `pile/`): the pointer or the focus opens it, the timers wait while it is open, the rows slide when
  // it opens or closes. One pile for each place, so the pointer in one place opens that place only. The look is the CSS below and
  // in `NotificationItem.svelte`.
  const pile = createPile({ collapsed: () => collapsed, records: () => records, rows: () => rows, setPaused });
  const piled = $derived(pile.piled);

  // The distance from the window edge: the setting (a number is pixels), or the token when there is none.
  const edge = $derived(bottom ? settings.bottom : settings.top);
  const edgeToken = $derived(bottom ? 'var(--ads-notification-bottom)' : 'var(--ads-notification-top)');
  const edgeStyle = $derived(edge === undefined ? edgeToken : typeof edge === 'number' ? `${edge}px` : edge);

  // A list that is taller than the window scrolls. At a bottom place the newest stands at the end, so the end is kept in view
  // while a new row comes in (its slot grows during the motion, so it is kept for the length of it).
  let list = $state<HTMLElement | null>(null);
  let seen = 0;
  $effect(() => {
    const count = records.length;
    const element = list;
    if (!element || !bottom) {
      seen = count;
      return;
    }
    if (count <= seen) {
      seen = count;
      return;
    }
    seen = count;
    const until = performance.now() + 400;
    let frame = 0;
    const pin = () => {
      element.scrollTop = element.scrollHeight;
      if (performance.now() < until) frame = requestAnimationFrame(pin);
    };
    pin();
    return () => cancelAnimationFrame(frame);
  });
</script>

<div
  class={classList('ads-notification-list', settings.classNames.list)}
  style={styleText(`--ads-notification-edge: ${edgeStyle}`, settings.styles.list)}
  data-placement={placement}
  bind:this={list}
>
  <div
    class={classList(
      'ads-notification-list-content',
      stacked && 'ads-notification-stack',
      piled && 'ads-notification-piled',
      settings.classNames.listContent
    )}
    style={styleText(settings.styles.listContent)}
    data-bottom={bottom ? '' : undefined}
    {@attach pile.attach}
  >
    {#each rows as record, position (record.id)}
      <NotificationItem
        {record}
        index={bottom ? rows.length - 1 - position : position}
        count={rows.length}
        {placement}
        {settings}
        {piled}
        {stacked}
      />
    {/each}
  </div>
</div>

<style>
  /* A place: a column on its edge, as wide as a box and its margins, as tall as its boxes up to the window, and it scrolls past that. */
  .ads-notification-list {
    position: absolute;
    box-sizing: border-box;
    width: calc(var(--ads-notification-width) + 2 * var(--ads-notification-margin));
    max-width: 100%;
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    pointer-events: none;
  }

  .ads-notification-list[data-placement^='top'] {
    inset-block-start: 0;
  }

  .ads-notification-list[data-placement^='bottom'] {
    inset-block-end: 0;
  }

  /* The margins and the distance from the window edge are the padding of the content, not of the scroll area, so that the shadows of
     the boxes are not cut off. The content also clips what hangs out of it: a row that comes in grows its slot from nothing and the box
     stands out of the slot until it has grown, and the rows behind a pile are lowered. Without the clip that is scrollable overflow, and
     the place shows a scrollbar for as long as the motion lasts. What is clipped is outside the place and not seen anyway. */
  .ads-notification-list-content {
    box-sizing: border-box;
    padding-inline: var(--ads-notification-margin);
    overflow: hidden;
  }

  .ads-notification-list[data-placement^='top'] .ads-notification-list-content {
    padding-block-start: var(--ads-notification-edge);
    padding-block-end: var(--ads-notification-margin);
  }

  .ads-notification-list[data-placement^='bottom'] .ads-notification-list-content {
    padding-block-start: var(--ads-notification-margin);
    padding-block-end: var(--ads-notification-edge);
  }

  .ads-notification-list[data-placement$='Left'] {
    left: 0;
  }

  .ads-notification-list[data-placement$='Right'] {
    right: 0;
  }

  .ads-notification-list[data-placement='top'],
  .ads-notification-list[data-placement='bottom'] {
    left: 0;
    right: 0;
    margin-inline: auto;
  }

  .ads-notification-list-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* A pile: every row in the same cell, the newest on top; the rows behind it are lowered and scaled by their own style. A pile at a
     bottom place stands on the bottom of its cell, so that the newest is the one nearest the edge. */
  .ads-notification-list-content:global(.ads-notification-piled) {
    display: grid;
    justify-items: center;
    align-items: start;
  }

  .ads-notification-list-content:global(.ads-notification-piled)[data-bottom] {
    align-items: end;
  }
</style>
