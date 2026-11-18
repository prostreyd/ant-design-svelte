<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let sticky = $state(false);
  let bare = $state(false);
  let silent = $state(false);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">mask: {'{ closable: false }'}</span>
    <Button onclick={() => (sticky = true)}>The mask does not close it</Button>
    <Modal bind:open={sticky} title="Sticky" mask={{ closable: false }}><p>A press outside does nothing. The close button, Cancel and Escape still close it.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">mask: false</span>
    <Button onclick={() => (bare = true)}>No mask</Button>
    <Modal bind:open={bare} title="No mask" mask={false}><p>No dim layer is drawn, but the page behind is still out of reach, as in Ant Design.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">keyboard: false</span>
    <Button onclick={() => (silent = true)}>Escape does not close it</Button>
    <Modal bind:open={silent} title="No Escape" keyboard={false}><p>Escape does nothing here.</p></Modal>
  </div>
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

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
