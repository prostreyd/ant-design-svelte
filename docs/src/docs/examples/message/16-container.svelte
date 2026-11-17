<script lang="ts">
  import { Button, MessageHost, message } from 'svelte-ant-design';

  let frame = $state<HTMLElement | null>(null);
  let mounted = $state(false);
</script>

<!-- The layer is position: fixed. A container with a transform (or a filter, or contain: layout) becomes the box
     it is fixed to, which gives a message region inside a part of the page. -->
{#if mounted && frame}
  <MessageHost container={frame} top={8} />
{/if}

<div class="stack">
  <div class="frame" bind:this={frame}>a region of the page</div>

  <div class="row">
    <Button onclick={() => (mounted = !mounted)}>{mounted ? 'Remove the host' : 'Mount the host in the region'}</Button>
    <Button onclick={() => message.info({ content: 'Inside the region', duration: 3 })}>Show message</Button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .frame {
    box-sizing: border-box;
    width: 280px;
    max-width: 100%;
    height: 120px;
    padding: 8px;
    border: 1px dashed var(--ads-color-border);
    border-radius: var(--ads-radius-md);
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    /* A transform makes this the box that the layer is fixed to. */
    transform: translateZ(0);
  }
</style>
