<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
  let log = $state('');

  // Every opening starts with an empty log, so that the last way to close is the only thing it says.
  function show() {
    log = '';
    open = true;
  }
</script>

<!-- bind:open: the close button, Cancel, Escape and the mask close it by themselves. OK does not: it is for you to close the Modal once you have checked or saved, so onok closes it here (the other examples set closeOnOk). -->
<div class="stack">
  <Button type="primary" onclick={show}>Open Modal</Button>
  <Modal
    bind:open
    title="Basic Modal"
    onok={() => {
      log = 'OK pressed';
      open = false;
    }}
    oncancel={() => (log = 'cancelled')}
    onafterclose={() => (log = `${log}, then closed`)}
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
