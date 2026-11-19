<script lang="ts">
  import { createPile, inertWhen, type PileRecord } from '../../src/lib/internal/pile/pile.svelte.js';
  import type { PauseReason } from '../../src/lib/internal/list/listStore.js';

  /** A list that lies in a pile when `collapsed`: two buttons in the element that holds the rows, and one outside it. */
  let {
    collapsed = false,
    records = [],
    rows = 0,
    show = true,
    buried = false,
    setPaused
  }: {
    collapsed?: boolean;
    records?: readonly PileRecord[];
    rows?: number;
    show?: boolean;
    buried?: boolean;
    setPaused: (id: number, reason: PauseReason, on: boolean) => void;
  } = $props();

  const pile = createPile({ collapsed: () => collapsed, records: () => records, rows: () => rows, setPaused: (id, reason, on) => setPaused(id, reason, on) });
</script>

{#if show}
  <div data-testid="content" class:piled={pile.piled} {@attach pile.attach}>
    <button data-testid="one">one</button>
    <button data-testid="two">two</button>
  </div>
{/if}
<button data-testid="outside">outside</button>
<span data-testid="state">{pile.piled ? 'piled' : 'open'}</span>
<div data-testid="buried" {@attach inertWhen(() => buried)}></div>
