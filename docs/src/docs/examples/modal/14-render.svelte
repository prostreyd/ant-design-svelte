<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
</script>

<!-- modalRender gets the card as a snippet and may wrap it, for example in a draggable box. -->
{#snippet framed(card: Snippet)}
  <div class="frame">
    <span class="tag">wrapped by modalRender</span>
    {@render card()}
  </div>
{/snippet}

<div class="stack">
  <Button onclick={() => (open = true)}>modalRender</Button>
  <Modal bind:open title="Wrapped" modalRender={framed}><p>The card is inside a box of your own.</p></Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .frame {
    padding: 8px;
    border: 1px dashed var(--ads-color-primary);
    border-radius: 12px;
  }

  .tag {
    display: block;
    margin-bottom: 4px;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
