<script lang="ts">
  import { Select, type SelectValue } from '$lib';
  import { openOverlay } from '$lib/internal/overlay/overlay';
  import { portal, resolveContainer } from '$lib/internal/portal/portal.svelte';

  /**
   * A layer made the way a Modal will make it (specs/overlay.md): a mask and a box that the portal moves into the body and
   * `openOverlay` makes modal while it exists. Layer `a` has a Select in it, whose list opens in the body, and a button that
   * opens layer `b` over it.
   */
  let {
    id,
    ondismiss,
    onopen
  }: { id: string; ondismiss: (id: string) => void; onopen?: (id: string) => void } = $props();

  let wrap = $state<HTMLElement | null>(null);
  let box = $state<HTMLElement | null>(null);
  let choice = $state<SelectValue | undefined>('one');

  $effect(() => {
    if (!wrap || !box) return;
    return openOverlay({ root: box, scope: wrap, dismiss: () => ondismiss(id) });
  });
</script>

<div class="wrap" data-testid="layer-{id}" bind:this={wrap} {@attach portal(() => resolveContainer(undefined))}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="mask" data-testid="mask-{id}" onclick={() => ondismiss(id)}></div>
  <div class="box" role="dialog" aria-modal="true" aria-label="Layer {id}" tabindex="-1" data-testid="box-{id}" bind:this={box}>
    <button type="button" data-testid="first-{id}">First {id}</button>
    <input data-testid="input-{id}" aria-label="Input {id}" />
    {#if id === 'a'}
      <Select aria-label="Choice" options={['one', 'two', 'three']} bind:value={choice} style="width: 160px" />
      <output data-testid="choice">{choice}</output>
      <button type="button" data-testid="open-b" onclick={() => onopen?.('b')}>Open B</button>
    {/if}
    <button type="button" data-testid="last-{id}">Last {id}</button>
  </div>
</div>

<style>
  .wrap {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }
  .mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
  }
  .box {
    position: absolute;
    top: 120px;
    left: 50%;
    width: 360px;
    margin-left: -180px;
    padding: 24px;
    background: white;
    display: grid;
    gap: 12px;
    justify-items: start;
  }
</style>
