<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
  let log = $state('');
</script>

<!-- bind:open: the close button, Cancel, Escape and the mask close it by themselves. OK does not: it is for you to close the Modal once you have checked or saved. -->
<div class="stack">
  <Button type="primary" onclick={() => (open = true)}>Open Modal</Button>
  <Modal
    bind:open
    title="Basic Modal"
    onok={() => (open = false)}
    oncancel={() => (log = 'cancelled')}
    onafterclose={() => (log = log ? `${log}, then closed` : 'closed')}
  >
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Modal>
  <output class="caption">{log}</output>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
