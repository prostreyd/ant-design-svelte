<script lang="ts">
  import { Button, ModalHost, modal } from 'svelte-ant-design';

  // With no <ModalHost /> the library makes its own layer. A host draws the dialogs where it stands, so they see the context of that place.
  let hosted = $state(false);
</script>

{#snippet where()}<span>This dialog was drawn {hosted ? 'by the host' : 'by the layer of the library'}.</span>{/snippet}

<div class="stack">
  <div class="field">
    <label class="row"><input type="checkbox" bind:checked={hosted} /> <span class="caption">Put a ModalHost in this example</span></label>
    <Button onclick={() => modal.info({ title: 'Where am I?', content: where })}>Open a dialog</Button>
  </div>
  {#if hosted}<ModalHost />{/if}
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
